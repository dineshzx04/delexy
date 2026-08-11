import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Card,
  Button,
  Tag,
  Input,
  Progress,
  Modal,
  Space,
  Tooltip,
  App as AntApp,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningFilled,
  CheckCircleFilled,
  MessageOutlined,
  CheckOutlined,
  RotateLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb, type SellerQuote } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { businessDb } from '../../data/business/business.db';

interface BuyerTechnicalReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  quoteId: string | null;
  itemTitle?: string;
}

interface AttributeAuditItem {
  attribute_key: string;
  attribute_name: string;
  requested_value: any;
  offered_value: any;
  is_deviated: boolean;
  deviation_reason?: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  rejection_comment?: string;
  comment_history?: any[];
}

export const BuyerTechnicalReviewDrawer: React.FC<BuyerTechnicalReviewDrawerProps> = ({
  open,
  onClose,
  quoteId,
  itemTitle,
}) => {
  const { currentUserId, currentUser } = useWorkspace();
  const { message: antMessage } = AntApp.useApp();
  const reviewerName = currentUser?.full_name || 'Requester Buyer';

  const [submitting, setSubmitting] = useState(false);
  const [attributesState, setAttributesState] = useState<Record<string, AttributeAuditItem>>({});
  const [rejectingFieldKey, setRejectingFieldKey] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [overallNotes, setOverallNotes] = useState('');

  const activeQuote = useLiveQuery(() => quoteId ? rfqDb.seller_quotes.get(quoteId) : undefined, [quoteId]);
  const quoteRevisions = useLiveQuery(() => quoteId ? rfqDb.seller_quote_revisions.where('seller_quote_id').equals(quoteId).toArray() : [], [quoteId]) || [];
  const activeQuoteRevision = quoteRevisions.find(r => r.id === activeQuote?.current_revision_id);
  const quoteResponses = useLiveQuery(() => activeQuote?.current_revision_id ? rfqDb.seller_quote_attributes.where('quote_revision_id').equals(activeQuote.current_revision_id).toArray() : [], [activeQuote?.current_revision_id]) || [];
  const quoteComments = useLiveQuery(() => quoteId ? rfqDb.seller_quote_comments.where('seller_quote_id').equals(quoteId).toArray() : [], [quoteId]) || [];
  const rfqItem = useLiveQuery(() => activeQuote?.rfq_item_id ? rfqDb.rfq_items.get(activeQuote.rfq_item_id) : undefined, [activeQuote?.rfq_item_id]);
  const allItemAttributes = useLiveQuery(() => rfqDb.rfq_item_attributes.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const sellerParty = useMemo(() => {
    if (!activeQuote) return null;
    return parties.find(p => p.id === activeQuote.seller_id) || { display_name: `Seller ${activeQuote.seller_id}` };
  }, [activeQuote, parties]);

  const latestRoundNumber = useMemo(() => {
    if (quoteRevisions.length === 0) return 1;
    return Math.max(...quoteRevisions.map(r => r.revision_number));
  }, [quoteRevisions]);

  const isReadOnly = activeQuote?.status === 'FINALIZED';

  const attrList = useMemo(() => {
    if (!activeQuote || !activeQuoteRevision) return [];
    
    const buyerItemAttributes = allItemAttributes.filter(ia => ia.rfq_item_revision_id === activeQuoteRevision.rfq_item_revision_id || ia.rfq_item_revision_id === rfqItem?.current_revision_id);

    return quoteResponses.map(resp => {
      let attributeName = '';
      let key = '';

      if (resp.group_id === 'static') {
        attributeName = resp.attribute_id === 'brand' ? 'Preferred Brand' : 'Preferred Manufacturer';
        key = `static-${resp.attribute_id === 'brand' ? 'brand' : 'mfg'}`;
      } else {
        const attr = allAttributes.find(a => a.id === resp.attribute_id);
        attributeName = attr?.name || attr?.label || resp.attribute_id || '';
        key = `dyn-${resp.group_id || ''}-${resp.attribute_id || ''}`;
      }

      const buyerAttr = buyerItemAttributes.find(ia => ia.group_id === resp.group_id && ia.attribute_id === resp.attribute_id);

      const reqLabel = buyerAttr ? buyerAttr.values.map((v: any) => v.value_label || v.value_id).join(', ') : '-';
      const offLabel = resp.offered_values.map((v: any) => v.value_label || v.value_id).join(', ') || '-';
      
      let isDev = false;
      if (resp.group_id === 'static') {
        const reqIds = Array.isArray(rfqItem?.brand_id) ? rfqItem.brand_id : (rfqItem?.brand_id ? [rfqItem.brand_id] : []);
        const mfgIds = Array.isArray(rfqItem?.manufacturer_id) ? rfqItem.manufacturer_id : (rfqItem?.manufacturer_id ? [rfqItem.manufacturer_id] : []);
        const targetIds = resp.attribute_id === 'brand' ? reqIds : mfgIds;

        isDev = resp.offered_values.some((v: any) => !targetIds.includes(v.value_id)) ||
                targetIds.some((id: string) => !resp.offered_values.some((v: any) => v.value_id === id));
      } else {
        isDev = buyerAttr ? (
          resp.offered_values.some((v: any) => !buyerAttr.values.some((r: any) => r.value_id === v.value_id)) ||
          buyerAttr.values.some((r: any) => !resp.offered_values.some((v: any) => v.value_id === r.value_id))
        ) : false;
      }

      const sellerComment = quoteComments.find(c => c.quote_attribute_id === resp.id && c.sender === 'SELLER');
      const buyerComment = quoteComments.find(c => c.quote_attribute_id === resp.id && c.sender === 'BUYER');

      const commentsHistory = quoteComments
        .filter(c => c.quote_attribute_id === resp.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(c => ({
          id: c.id,
          sender_role: c.sender || 'SELLER',
          sender_name: c.sender === 'BUYER' ? 'Buyer' : 'Supplier',
          sender_user_id: c.sender_id || '',
          comment: c.comment,
          timestamp: c.created_at
        }));

      let initialStatus: 'APPROVED' | 'REJECTED' | 'PENDING' = 'PENDING';
      if (activeQuote.status === 'FINALIZED') {
        initialStatus = 'APPROVED';
      } else if (buyerComment) {
        initialStatus = 'REJECTED';
      }

      return {
        attribute_key: key,
        attribute_name: attributeName,
        requested_value: reqLabel,
        offered_value: offLabel,
        is_deviated: isDev,
        deviation_reason: sellerComment?.comment || '',
        status: initialStatus,
        rejection_comment: buyerComment?.comment || '',
        comment_history: commentsHistory
      } as AttributeAuditItem;
    });
  }, [activeQuote, activeQuoteRevision, quoteResponses, quoteComments, rfqItem, allItemAttributes, allAttributes]);

  useEffect(() => {
    if (attrList.length > 0) {
      const stateMap: Record<string, AttributeAuditItem> = {};
      attrList.forEach((attr) => {
        stateMap[attr.attribute_key] = attr;
      });
      setAttributesState(stateMap);
      
      const buyerOverallComment = quoteComments.find(c => c.sender === 'BUYER' && !c.quote_attribute_id);
      setOverallNotes(buyerOverallComment?.comment || '');
    } else {
      setAttributesState({});
      setOverallNotes('');
    }
  }, [attrList, quoteComments]);

  const auditList = Object.values(attributesState);
  const totalCount = auditList.length;
  const approvedCount = auditList.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = auditList.filter((a) => a.status === 'REJECTED').length;
  const pendingCount = totalCount - (approvedCount + rejectedCount);
  const percentApproved = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const is100PercentApproved = approvedCount === totalCount && totalCount > 0;

  const handleApproveField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: 'APPROVED', rejection_comment: '' },
    }));
  };

  const handleOpenRejectModal = (key: string) => {
    setRejectingFieldKey(key);
    setCommentInput(attributesState[key]?.rejection_comment || '');
  };

  const handleConfirmRejection = () => {
    if (rejectingFieldKey) {
      setAttributesState((prev) => ({
        ...prev,
        [rejectingFieldKey]: {
          ...prev[rejectingFieldKey],
          status: 'REJECTED',
          rejection_comment: commentInput,
        },
      }));
      setRejectingFieldKey(null);
      setCommentInput('');
    }
  };

  const handleResetField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: 'PENDING', rejection_comment: '' },
    }));
  };

  const handleBulkApproveAllPending = () => {
    setAttributesState((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        if (copy[key].status === 'PENDING') {
          copy[key] = { ...copy[key], status: 'APPROVED', rejection_comment: '' };
        }
      });
      return copy;
    });
  };

  const handleBulkApproveAll = () => {
    setAttributesState((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        copy[key] = { ...copy[key], status: 'APPROVED', rejection_comment: '' };
      });
      return copy;
    });
  };

  const handleBulkResetAll = () => {
    setAttributesState((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach(key => {
        copy[key] = { ...copy[key], status: 'PENDING', rejection_comment: '' };
      });
      return copy;
    });
  };

  const handleSaveProgress = async () => {
    if (!quoteId) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const commentEntries: any[] = [];
      
      auditList.forEach((attr) => {
        if (attr.rejection_comment) {
          let groupId = 'static';
          let attributeId = 'brand';
          if (attr.attribute_key === 'static-brand') {
            attributeId = 'brand';
          } else if (attr.attribute_key === 'static-mfg') {
            attributeId = 'manufacturer';
          } else if (attr.attribute_key.startsWith('dyn-')) {
            const parts = attr.attribute_key.replace('dyn-', '').split('-');
            groupId = parts[0];
            attributeId = parts[1];
          }

          const matchingAttr = quoteResponses.find(qa => qa.group_id === groupId && qa.attribute_id === attributeId);

          commentEntries.push({
            id: `c-${quoteId}-${groupId}-${attributeId}-${latestRoundNumber}`,
            seller_quote_id: quoteId,
            quote_attribute_id: matchingAttr?.id || null,
            comment: attr.rejection_comment,
            sender: 'BUYER' as const,
            sender_id: currentUserId || 'usr-2',
            created_at: now,
          });
        }
      });

      if (commentEntries.length > 0) {
        await rfqDb.seller_quote_comments.bulkPut(commentEntries);
      }

      antMessage.success('Review progress saved successfully.');
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to save review progress');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeDecision = async (action: 'APPROVE' | 'REQUEST_REVISION') => {
    if (!quoteId) return;
    if (action === 'REQUEST_REVISION' && rejectedCount === 0) {
      antMessage.error('Please reject at least 1 attribute with feedback before requesting technical revision.');
      return;
    }
    if (action === 'APPROVE' && !is100PercentApproved) {
      antMessage.warning('All attributes must be marked as APPROVED before approving technical specification.');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();

      const nextQuoteStatus = action === 'APPROVE' ? 'FINALIZED' : 'DRAFT';
      await rfqDb.seller_quotes.update(quoteId, {
        status: nextQuoteStatus,
        updated_at: now
      });

      const commentEntries: any[] = [];
      auditList
        .filter((attr) => attr.rejection_comment)
        .map((attr) => {
          let groupId = 'static';
          let attributeId = 'brand';
          if (attr.attribute_key === 'static-brand') {
            attributeId = 'brand';
          } else if (attr.attribute_key === 'static-mfg') {
            attributeId = 'manufacturer';
          } else if (attr.attribute_key.startsWith('dyn-')) {
            const parts = attr.attribute_key.replace('dyn-', '').split('-');
            groupId = parts[0];
            attributeId = parts[1];
          }

          const matchingAttr = quoteResponses.find(qa => qa.group_id === groupId && qa.attribute_id === attributeId);

          commentEntries.push({
            id: `c-${quoteId}-${groupId}-${attributeId}-${latestRoundNumber}`,
            seller_quote_id: quoteId,
            quote_attribute_id: matchingAttr?.id || null,
            comment: attr.rejection_comment || '',
            sender: 'BUYER' as const,
            sender_id: currentUserId || 'usr-2',
            created_at: now,
          });
        });

      if (overallNotes.trim()) {
        commentEntries.push({
          id: `c-overall-${quoteId}-${latestRoundNumber}`,
          seller_quote_id: quoteId,
          quote_attribute_id: null,
          comment: overallNotes.trim(),
          sender: 'BUYER' as const,
          sender_id: currentUserId || 'usr-2',
          created_at: now,
        });
      }

      if (commentEntries.length > 0) {
        await rfqDb.seller_quote_comments.bulkPut(commentEntries);
      }

      if (action === 'APPROVE') {
        antMessage.success(`Technical Specification Approved for ${sellerParty?.display_name}! Unlocked Commercial Negotiation.`);
      } else {
        antMessage.warning(`Technical Revision Request sent to ${sellerParty?.display_name}.`);
      }

      onClose();
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to finalize technical review decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <div className="flex items-center gap-2">
            <Tag color="blue" className="font-bold">SPEC AUDIT</Tag>
            <span className="font-black text-slate-800 text-base">
              Evaluate Sourcing Specifications: {sellerParty?.display_name}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Quote ID: {quoteId}</span>
        </div>
      }
      placement="right"
      width={780}
      onClose={onClose}
      open={open}
      destroyOnClose
      bodyStyle={{ backgroundColor: '#f8fafc', padding: '16px' }}
    >
      <div className="space-y-4">
        {/* SUMMARY HEADER BOX */}
        <Card className="shadow-2xs border-sky-100 bg-sky-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Evaluation Item Context</span>
              <h2 className="text-lg font-black text-slate-900 leading-tight m-0">{itemTitle || rfqItem?.product_name}</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="text-xs text-sky-950 font-bold">
                  <span>Technical Round Audit Progress</span>
                  <span className="text-sky-700 ml-2">{approvedCount} / {totalCount} Approved ({percentApproved}%)</span>
                </div>
                <Progress percent={percentApproved} strokeColor="#0284c7" size="small" />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold shrink-0 pt-1">
                <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded text-xs">{approvedCount} Approved</span>
                <span className="text-red-700 bg-red-100/80 px-2.5 py-1 rounded text-xs">{rejectedCount} Rejected</span>
                <span className="text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded text-xs">{pendingCount} Pending</span>
              </div>
            </div>
          </div>
        </Card>

        {/* OVERALL REVIEW COMMENTS */}
        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
          <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <MessageOutlined className="text-amber-700" /> Overall Technical Review Comments / Revision Notes
          </label>
          <Input.TextArea
            disabled={isReadOnly}
            rows={2}
            placeholder="Enter overall technical feedback, compliance requirements, or revision instructions for the supplier..."
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Granular Attribute Audit Matrix */}
        <Card
          title={
            <span className="font-bold text-slate-900 text-sm">
              Granular Technical Attribute Audit Matrix ({totalCount} Attributes)
            </span>
          }
          className="shadow-sm border-slate-200"
        >
          <div className="space-y-3">
            {auditList.map((attr) => (
              <div
                key={attr.attribute_key}
                className={`p-3.5 rounded-lg border transition-all ${
                  attr.status === 'APPROVED'
                    ? 'bg-emerald-50/30 border-emerald-300'
                    : attr.status === 'REJECTED'
                    ? 'bg-red-50/30 border-red-300'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{attr.attribute_name}</span>
                    <span className="text-[11px] font-mono text-slate-400 ml-2">({attr.attribute_key})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {attr.is_deviated ? (
                      <Tooltip title={attr.deviation_reason || 'Deviated spec'}>
                        <Tag color="warning" className="text-[11px] py-0 px-1.5">Deviated</Tag>
                      </Tooltip>
                    ) : (
                      <Tag color="success" className="text-[11px] py-0 px-1.5">Exact Match</Tag>
                    )}

                    {attr.status === 'APPROVED' && (
                      <Tag color="success" className="text-[11px] font-semibold py-0 px-1.5">APPROVED</Tag>
                    )}
                    {attr.status === 'REJECTED' && (
                      <Tag color="error" className="text-[11px] font-semibold py-0 px-1.5">REJECTED</Tag>
                    )}
                    {attr.status === 'PENDING' && (
                      <Tag color="warning" className="text-[11px] font-semibold py-0 px-1.5">PENDING</Tag>
                    )}

                    {!isReadOnly && (
                      <Space size={4}>
                        {attr.status !== 'APPROVED' && (
                          <Button
                            type="primary"
                            size="small"
                            className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-[11px] h-6 px-2"
                            onClick={() => handleApproveField(attr.attribute_key)}
                          >
                            Approve
                          </Button>
                        )}
                        {attr.status !== 'REJECTED' && (
                          <Button
                            danger
                            size="small"
                            className="font-semibold text-[11px] h-6 px-2"
                            onClick={() => handleOpenRejectModal(attr.attribute_key)}
                          >
                            Reject
                          </Button>
                        )}
                        {attr.status !== 'PENDING' && (
                          <Button
                            type="text"
                            size="small"
                            className="text-slate-500 text-[11px] h-6 px-1.5"
                            onClick={() => handleResetField(attr.attribute_key)}
                          >
                            Reset
                          </Button>
                        )}
                      </Space>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-800 flex flex-wrap gap-4 items-center">
                  <div>Buyer Target: <strong className="text-slate-900">{String(attr.requested_value)}</strong></div>
                  <span className="text-slate-300">|</span>
                  <div>Offered: <strong className="text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded font-medium">{String(attr.offered_value)}</strong></div>
                </div>

                {attr.deviation_reason && (
                  <div className="mt-1.5 text-xs text-amber-800 bg-amber-100/60 p-2 rounded border border-amber-200">
                    <span className="font-semibold">Supplier Note: </span>
                    {attr.deviation_reason}
                  </div>
                )}

                {attr.rejection_comment && (
                  <div className="mt-2 text-xs p-2 rounded border bg-red-50/90 border-red-200 text-red-900 space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <MessageOutlined className="text-red-600" /> Reviewer Rejection Remark:
                    </div>
                    <div>{attr.rejection_comment}</div>
                  </div>
                )}

                {attr.comment_history && attr.comment_history.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-500 text-[11px]">Conversation Log ({attr.comment_history.length}):</span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {attr.comment_history.map((c) => (
                        <div key={c.id} className="p-1.5 rounded bg-white border border-slate-100 flex items-center justify-between text-[11px]">
                          <div>
                            <strong className={c.sender_role === 'BUYER' ? 'text-blue-700' : 'text-purple-700'}>
                              [{c.sender_role}] {c.sender_name}:
                            </strong>{' '}
                            <span>{c.comment}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {isReadOnly ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Technical Evaluation Status:</span>
              <Tag color="green" icon={<CheckCircleFilled />} className="py-1.5 px-4 font-bold text-sm">
                Technical Specification Approved
              </Tag>
            </div>
          ) : (
            <>
              <Button
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={handleSaveProgress}
                size="large"
              >
                Save Progress ({approvedCount + rejectedCount}/{totalCount})
              </Button>

              <Space size="middle">
                {pendingCount > 0 ? (
                  <Button
                    type="primary"
                    size="large"
                    loading={submitting}
                    icon={<SaveOutlined />}
                    onClick={handleSaveProgress}
                    className="bg-blue-600 hover:bg-blue-700 font-bold"
                  >
                    Save Progress ({approvedCount + rejectedCount}/{totalCount} Reviewed)
                  </Button>
                ) : rejectedCount > 0 ? (
                  <Button
                    danger
                    type="primary"
                    size="large"
                    loading={submitting}
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => handleFinalizeDecision('REQUEST_REVISION')}
                    className="font-bold shadow-md"
                  >
                    Request Revision ({rejectedCount} Rejected)
                  </Button>
                ) : is100PercentApproved ? (
                  <Button
                    type="primary"
                    size="large"
                    loading={submitting}
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleFinalizeDecision('APPROVE')}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md"
                  >
                    Approve Technical Specification (100% Approved)
                  </Button>
                ) : null}
              </Space>
            </>
          )}
        </div>
      </div>

      {/* REJECTION COMMENT MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <ExclamationCircleOutlined /> Reject Attribute & Specify Required Adjustment
          </div>
        }
        open={!!rejectingFieldKey}
        onOk={handleConfirmRejection}
        onCancel={() => {
          setRejectingFieldKey(null);
          setCommentInput('');
        }}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, disabled: !commentInput.trim() }}
        destroyOnClose
      >
        <div className="space-y-3 py-2">
          <div className="text-xs text-slate-600">
            Attribute: <strong className="text-slate-900">{attributesState[rejectingFieldKey || '']?.attribute_name}</strong>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Reviewer Correction Remark *</label>
            <Input.TextArea
              rows={3}
              placeholder="Explain why this attribute is rejected and specify the technical adjustment required from the supplier..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </Modal>
    </Drawer>
  );
};
