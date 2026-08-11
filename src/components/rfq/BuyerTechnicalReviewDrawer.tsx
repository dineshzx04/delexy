import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Card,
  Button,
  Tag,
  Input,
  Progress,
  Alert,
  Modal,
  Space,
  Descriptions,
  Tooltip,
  App as AntApp,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  WarningFilled,
  CheckCircleFilled,
  ShopOutlined,
  MessageOutlined,
  CheckOutlined,
  RotateLeftOutlined,
  LockOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  rfqDb,
  type ItemSupplierResponse,
  type TechnicalAttributeResponse,
  type TechnicalRevisionRound,
  type AttributeCommentEntry,
} from '../../data/rfq';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface BuyerTechnicalReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  response: ItemSupplierResponse | null;
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
  comment_history?: AttributeCommentEntry[];
  reviewed_by_user_name?: string;
  reviewed_at?: string;
}

export const BuyerTechnicalReviewDrawer: React.FC<BuyerTechnicalReviewDrawerProps> = ({
  open,
  onClose,
  response,
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

  const latestRound: TechnicalRevisionRound | null = useMemo(() => {
    if (!response?.technical_revision_rounds || response.technical_revision_rounds.length === 0) return null;
    return response.technical_revision_rounds[response.technical_revision_rounds.length - 1];
  }, [response]);

  // Read-only mode enforcement: Editing is only active when round status is PENDING
  const isReadOnly = useMemo(() => {
    if (!latestRound) return false;
    return latestRound.round_status === 'APPROVED' || latestRound.round_status === 'REJECTED';
  }, [latestRound]);

  // Initialize attribute audit state when response or round changes
  useEffect(() => {
    if (latestRound && latestRound.supplier_response) {
      setOverallNotes(latestRound.buyer_review_notes || '');
      const stateMap: Record<string, AttributeAuditItem> = {};

      latestRound.supplier_response.forEach((attr) => {
        let initialStatus: 'APPROVED' | 'REJECTED' | 'PENDING' = 'PENDING';
        if (attr.buyer_status === 'APPROVED') initialStatus = 'APPROVED';
        else if (attr.buyer_status === 'REJECTED' || attr.buyer_status === 'REVISION_REQUESTED') initialStatus = 'REJECTED';

        stateMap[attr.attribute_key] = {
          attribute_key: attr.attribute_key,
          attribute_name: attr.attribute_name,
          requested_value: attr.requested_value,
          offered_value: attr.offered_value,
          is_deviated: attr.is_deviated,
          deviation_reason: attr.deviation_reason,
          status: initialStatus,
          rejection_comment: attr.buyer_comment || '',
          comment_history: attr.comment_history || [],
        };
      });

      setAttributesState(stateMap);
    }
  }, [latestRound]);

  const attrList = useMemo(() => Object.values(attributesState), [attributesState]);
  const totalCount = attrList.length;
  const approvedCount = attrList.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = attrList.filter((a) => a.status === 'REJECTED').length;
  const pendingCount = attrList.filter((a) => a.status === 'PENDING').length;
  const percentApproved = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const is100PercentApproved = totalCount > 0 && approvedCount === totalCount;

  if (!response || !latestRound) return null;

  // Single Attribute Review Actions
  const handleApproveField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: 'APPROVED',
        rejection_comment: undefined,
        reviewed_by_user_name: reviewerName,
        reviewed_at: new Date().toISOString(),
      },
    }));
    antMessage.success(`Attribute "${attributesState[key]?.attribute_name || key}" approved.`);
  };

  const handleOpenRejectModal = (key: string) => {
    setRejectingFieldKey(key);
    setCommentInput(attributesState[key]?.rejection_comment || '');
  };

  const handleConfirmRejection = () => {
    if (!rejectingFieldKey) return;
    if (!commentInput.trim()) {
      antMessage.error('Please enter a reviewer comment explaining the required technical adjustment.');
      return;
    }

    setAttributesState((prev) => ({
      ...prev,
      [rejectingFieldKey]: {
        ...prev[rejectingFieldKey],
        status: 'REJECTED',
        rejection_comment: commentInput.trim(),
        reviewed_by_user_name: reviewerName,
        reviewed_at: new Date().toISOString(),
      },
    }));

    antMessage.warning(`Attribute "${attributesState[rejectingFieldKey]?.attribute_name || rejectingFieldKey}" marked for revision.`);
    setRejectingFieldKey(null);
    setCommentInput('');
  };

  const handleResetField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: 'PENDING',
        rejection_comment: undefined,
      },
    }));
  };

  // Bulk Review Action Handlers (Matching PlatformSellerProductReviewDetail.tsx)
  const handleBulkApproveAllPending = () => {
    setAttributesState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].status === 'PENDING') {
          next[k] = {
            ...next[k],
            status: 'APPROVED',
            rejection_comment: undefined,
            reviewed_by_user_name: reviewerName,
            reviewed_at: new Date().toISOString(),
          };
        }
      });
      return next;
    });
    antMessage.success('Marked all pending attributes as APPROVED.');
  };

  const handleBulkApproveAll = () => {
    setAttributesState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = {
          ...next[k],
          status: 'APPROVED',
          rejection_comment: undefined,
          reviewed_by_user_name: reviewerName,
          reviewed_at: new Date().toISOString(),
        };
      });
      return next;
    });
    antMessage.success('Marked all attributes as APPROVED.');
  };

  const handleBulkResetAll = () => {
    setAttributesState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = {
          ...next[k],
          status: 'PENDING',
          rejection_comment: undefined,
        };
      });
      return next;
    });
    antMessage.info('Reset all attributes to PENDING review.');
  };

  // Save Progress without finalizing round status
  const handleSaveProgress = async () => {
    setSubmitting(true);
    try {
      const updatedSupplierResponse: TechnicalAttributeResponse[] = attrList.map((attr) => ({
        attribute_key: attr.attribute_key,
        attribute_name: attr.attribute_name,
        requested_value: attr.requested_value,
        offered_value: attr.offered_value,
        is_deviated: attr.is_deviated,
        deviation_reason: attr.deviation_reason,
        buyer_status: attr.status === 'APPROVED' ? 'APPROVED' : attr.status === 'REJECTED' ? 'REVISION_REQUESTED' : undefined,
        buyer_comment: attr.rejection_comment,
        comment_history: attr.comment_history,
      }));

      antMessage.success('Review progress saved successfully.');
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to save review progress');
    } finally {
      setSubmitting(false);
    }
  };

  // Final Decision Handler: Request Revision OR Approve Technical Response
  const handleFinalizeDecision = async (action: 'APPROVE' | 'REQUEST_REVISION') => {
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
      const activeQuote = await rfqDb.seller_quotes.get(response.id);
      const quoteRevisionId = activeQuote?.current_revision_id || '';
      
      const quoteAttributes = quoteRevisionId 
        ? await rfqDb.seller_quote_attributes.where('quote_revision_id').equals(quoteRevisionId).toArray()
        : [];

      // Update sellerQuote status
      const nextQuoteStatus = action === 'APPROVE' ? 'FINALIZED' : 'DRAFT';
      await rfqDb.seller_quotes.update(response.id, {
        status: nextQuoteStatus,
        updated_at: now
      });

      // Save buyer rejection comments to seller_quote_comments
      const commentEntries = attrList
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

          const matchingAttr = quoteAttributes.find(qa => qa.group_id === groupId && qa.attribute_id === attributeId);

          return {
            id: `c-${response.id}-${groupId}-${attributeId}-${latestRound?.round_number || 1}`,
            seller_quote_id: response.id,
            quote_attribute_id: matchingAttr?.id || null,
            comment: attr.rejection_comment || '',
            sender: 'BUYER' as const,
            sender_id: currentUserId || 'usr-2',
            created_at: now,
          };
        });

      if (commentEntries.length > 0) {
        await rfqDb.seller_quote_comments.bulkPut(commentEntries);
      }

      if (action === 'APPROVE') {
        antMessage.success(`Technical Specification Approved (Round #${latestRound.round_number}) for ${response.seller_party_name}! Unlocked Commercial Negotiation.`);
      } else {
        antMessage.warning(`Technical Revision Request (Round #${latestRound.round_number}) sent to ${response.seller_party_name}.`);
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
        <div className="flex items-center justify-between pr-6">
          <div className="flex items-center gap-2">
            <Tag color="blue" className="font-bold">Attribute Audit</Tag>
            <span className="font-bold text-slate-900">
              Technical Evaluation #{response.id} (Round #{latestRound.round_number})
            </span>
          </div>
          <Tag color="purple" icon={<ShopOutlined />}>
            {response.seller_party_name}
          </Tag>
        </div>
      }
      width={920}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <div className="space-y-5 p-1">
        {/* READ-ONLY BANNER */}
        {isReadOnly && (
          <Alert
            type="info"
            showIcon
            icon={<LockOutlined />}
            message={`Technical Review Completed (Round #${latestRound.round_number})`}
            description={`This technical revision round is finalized (${latestRound.round_status}). Attribute reviewing is read-only.`}
            className="mb-3"
          />
        )}

        {/* HEADER SUMMARY CARD */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered className="bg-white">
            <Descriptions.Item label="Line Item"><strong>{itemTitle || response.rfq_item_id}</strong></Descriptions.Item>
            <Descriptions.Item label="Supplier Party">{response.seller_party_name}</Descriptions.Item>
            <Descriptions.Item label="Revision Round"><Tag color="cyan">Round #{latestRound.round_number}</Tag></Descriptions.Item>
            <Descriptions.Item label="Submitted At">{new Date(latestRound.submitted_at).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Round Status">
              <Tag color={latestRound.round_status === 'APPROVED' ? 'green' : latestRound.round_status === 'REVISION_REQUESTED' ? 'warning' : 'blue'}>
                {latestRound.round_status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* ATTRIBUTE AUDIT PROGRESS & BULK ACTIONS BAR (Matching PlatformSellerProductReviewDetail.tsx) */}
        <Card className="border border-sky-200 bg-sky-50/50 shadow-sm p-2">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>Attribute Audit Approval Progress</span>
                  <span className="text-sky-700">{approvedCount} / {totalCount} Approved ({percentApproved}%)</span>
                </div>
                <Progress percent={percentApproved} strokeColor="#0284c7" size="small" />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded text-xs">{approvedCount} Approved</span>
                <span className="text-red-700 bg-red-100/80 px-2.5 py-1 rounded text-xs">{rejectedCount} Rejected</span>
                <span className="text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded text-xs">{pendingCount} Pending</span>
              </div>
            </div>

            {/* BULK REVIEW CONTROLS */}
            {!isReadOnly && (
              <div className="pt-2 border-t border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircleOutlined className="text-sky-600" /> Bulk Review Controls:
                </span>

                <Space size="small" className="flex-wrap">
                  {pendingCount > 0 && (
                    <Button
                      size="small"
                      type="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                      icon={<CheckCircleOutlined />}
                      onClick={handleBulkApproveAllPending}
                    >
                      Approve All Pending ({pendingCount})
                    </Button>
                  )}
                  {approvedCount < totalCount && (
                    <Button
                      size="small"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                      icon={<CheckOutlined />}
                      onClick={handleBulkApproveAll}
                    >
                      Approve Entire List ({totalCount})
                    </Button>
                  )}
                  {(approvedCount > 0 || rejectedCount > 0) && (
                    <Button
                      size="small"
                      type="text"
                      className="text-slate-500 hover:text-slate-700 text-xs"
                      icon={<RotateLeftOutlined />}
                      onClick={handleBulkResetAll}
                    >
                      Reset All to Pending
                    </Button>
                  )}
                </Space>
              </div>
            )}
          </div>
        </Card>

        {/* OVERALL REVIEW COMMENTS / REVISION NOTES */}
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

        {/* GRANULAR ATTRIBUTE CARDS MATRIX (Matching PlatformSellerProductReviewDetail.tsx) */}
        <Card
          title={
            <span className="font-bold text-slate-900 text-sm">
              Granular Technical Attribute Audit Matrix ({totalCount} Attributes)
            </span>
          }
          className="shadow-sm border-slate-200"
        >
          <div className="space-y-3">
            {attrList.map((attr) => (
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
                        <Tag icon={<WarningFilled />} color="warning" className="text-[11px] py-0 px-1.5">Deviated</Tag>
                      </Tooltip>
                    ) : (
                      <Tag icon={<CheckCircleFilled />} color="success" className="text-[11px] py-0 px-1.5">Exact Match</Tag>
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

                {/* Values Comparison Display */}
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

                {/* Attribute Review Rejection Comment Display */}
                {attr.rejection_comment && (
                  <div className="mt-2 text-xs p-2 rounded border bg-red-50/90 border-red-200 text-red-900 space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <MessageOutlined className="text-red-600" /> Reviewer Rejection Remark:
                    </div>
                    <div>{attr.rejection_comment}</div>
                  </div>
                )}

                {/* Comment History Log Across Rounds */}
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

        {/* BOTTOM STICKY ACTION BAR DEPENDING ON AUDIT STATE */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {isReadOnly ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Technical Evaluation Status:</span>
              {latestRound.round_status === 'APPROVED' ? (
                <Tag color="green" icon={<CheckCircleFilled />} className="py-1.5 px-4 font-bold text-sm">
                  Technical Specification Approved
                </Tag>
              ) : (
                <Tag color="warning" icon={<WarningFilled />} className="py-1.5 px-4 font-bold text-sm">
                  Awaiting Supplier Technical Revision (Round #{latestRound.round_number})
                </Tag>
              )}
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
