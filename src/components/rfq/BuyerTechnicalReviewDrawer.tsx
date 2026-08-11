import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Card,
  Button,
  Tag,
  Input,
  Progress,
  Space,
  Tooltip,
  Segmented,
  App as AntApp,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningFilled,
  CheckCircleFilled,
  MessageOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb } from '../../data/rfq';
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
  group_id: string;
  group_name: string;
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
  const { currentUserId } = useWorkspace();
  const { message: antMessage } = AntApp.useApp();

  const [submitting, setSubmitting] = useState(false);
  const [attributesState, setAttributesState] = useState<Record<string, AttributeAuditItem>>({});
  const [overallNotes, setOverallNotes] = useState('');

  const activeQuote = useLiveQuery(() => quoteId ? rfqDb.seller_quotes.get(quoteId) : undefined, [quoteId]);
  const quoteRevisions = useLiveQuery(() => quoteId ? rfqDb.seller_quote_revisions.where('seller_quote_id').equals(quoteId).toArray() : [], [quoteId]) || [];
  const activeQuoteRevision = quoteRevisions.find(r => r.id === activeQuote?.current_revision_id);
  const quoteResponses = useLiveQuery(() => activeQuote?.current_revision_id ? rfqDb.seller_quote_attributes.where('quote_revision_id').equals(activeQuote.current_revision_id).toArray() : [], [activeQuote?.current_revision_id]) || [];
  const quoteComments = useLiveQuery(() => quoteId ? rfqDb.seller_quote_comments.where('seller_quote_id').equals(quoteId).toArray() : [], [quoteId]) || [];
  const rfqItem = useLiveQuery(() => activeQuote?.rfq_item_id ? rfqDb.rfq_items.get(activeQuote.rfq_item_id) : undefined, [activeQuote?.rfq_item_id]);
  const allItemAttributes = useLiveQuery(() => rfqDb.rfq_item_attributes.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
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
      let groupName = 'Category Specifications';

      if (resp.group_id === 'static') {
        attributeName = resp.attribute_id === 'brand' ? 'Preferred Brand' : 'Preferred Manufacturer';
        key = `static-${resp.attribute_id === 'brand' ? 'brand' : 'mfg'}`;
        groupName = 'General Specifications';
      } else {
        const attr = allAttributes.find(a => a.id === resp.attribute_id);
        attributeName = attr?.name || attr?.label || resp.attribute_id || '';
        key = `dyn-${resp.group_id || ''}-${resp.attribute_id || ''}`;

        const groupObj = allAttributeGroups.find(g => g.id === resp.group_id);
        if (groupObj) {
          groupName = groupObj.name;
        }
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
        group_id: resp.group_id || 'static',
        group_name: groupName,
        requested_value: reqLabel,
        offered_value: offLabel,
        is_deviated: isDev,
        deviation_reason: sellerComment?.comment || '',
        status: initialStatus,
        rejection_comment: buyerComment?.comment || '',
        comment_history: commentsHistory
      } as AttributeAuditItem;
    });
  }, [activeQuote, activeQuoteRevision, quoteResponses, quoteComments, rfqItem, allItemAttributes, allAttributes, allAttributeGroups]);

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

  const groupedSections = useMemo(() => {
    const sections: Record<string, { group_name: string; items: AttributeAuditItem[] }> = {};
    auditList.forEach((attr) => {
      const gKey = attr.group_id;
      if (!sections[gKey]) {
        sections[gKey] = { group_name: attr.group_name, items: [] };
      }
      sections[gKey].items.push(attr);
    });
    // Put 'static' (General Specifications) first
    const ordered = Object.entries(sections).sort(([a], [b]) => {
      if (a === 'static') return -1;
      if (b === 'static') return 1;
      return 0;
    });
    return ordered;
  }, [auditList]);

  const handleApproveField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: 'APPROVED', rejection_comment: '' },
    }));
  };

  const handleRejectField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: 'REJECTED' },
    }));
  };

  const handleUpdateRejectionComment = (key: string, val: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: { ...prev[key], rejection_comment: val },
    }));
  };

  const handleResetField = (key: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: 'PENDING', rejection_comment: '' },
    }));
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
              Technical Review: {sellerParty?.display_name}
            </span>
          </div>
          <Tag className="font-mono text-[10px]" color="default">Round #{latestRoundNumber}</Tag>
        </div>
      }
      placement="right"
      width={820}
      onClose={onClose}
      open={open}
      destroyOnClose
      styles={{ body: { backgroundColor: '#f8fafc', padding: '16px 20px' } }}
    >
      <div className="space-y-5">
        {/* ── SUMMARY HEADER ── */}
        <div className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/60">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-sm font-black text-slate-900 leading-tight m-0 truncate">{itemTitle || rfqItem?.product_name}</h2>
            <span className="text-sm font-black text-sky-700 shrink-0">{percentApproved}%</span>
          </div>
          <Progress
            percent={percentApproved}
            strokeColor={{ from: '#0ea5e9', to: '#6366f1' }}
            trailColor="#e0e7ff"
            size="small"
            showInfo={false}
            className="mb-1.5"
          />
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">{approvedCount} Approved</span>
            <span className="text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded">{rejectedCount} Rejected</span>
            <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">{pendingCount} Pending</span>
            <span className="ml-auto text-slate-400 font-mono">{totalCount} total</span>
          </div>
        </div>

        {/* ── GROUPED SECTIONS ── */}
        {groupedSections.map(([groupId, section]) => {
          const sectionApproved = section.items.filter(i => i.status === 'APPROVED').length;
          const sectionTotal = section.items.length;
          const sectionPct = sectionTotal > 0 ? Math.round((sectionApproved / sectionTotal) * 100) : 0;
          const allSectionApproved = sectionApproved === sectionTotal && sectionTotal > 0;

          return (
            <div key={groupId} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {/* Section Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${allSectionApproved ? 'bg-emerald-500' : sectionApproved > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  <span className="font-bold text-slate-800 text-sm">{section.group_name}</span>
                  <Tag className="text-[10px] py-0 px-1.5 font-mono" color="default">
                    {sectionApproved}/{sectionTotal}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    type="circle"
                    percent={sectionPct}
                    size={28}
                    strokeColor={allSectionApproved ? '#10b981' : '#0ea5e9'}
                    strokeWidth={10}
                    format={() => <span className="text-[9px] font-bold">{sectionPct}%</span>}
                  />
                  {!isReadOnly && (
                    <Tooltip title="Approve all in this section">
                      <Button
                        size="small"
                        type="text"
                        icon={<CheckOutlined />}
                        className="text-emerald-600 text-[11px] h-6"
                        onClick={() => {
                          setAttributesState((prev) => {
                            const copy = { ...prev };
                            section.items.forEach((item) => {
                              copy[item.attribute_key] = { ...copy[item.attribute_key], status: 'APPROVED', rejection_comment: '' };
                            });
                            return copy;
                          });
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Attribute Rows */}
              <div className="divide-y divide-slate-100">
                {section.items.map((attr) => (
                  <div
                    key={attr.attribute_key}
                    className={`px-4 py-3 transition-all duration-200 ${attr.status === 'APPROVED'
                      ? 'bg-emerald-50/40'
                      : attr.status === 'REJECTED'
                        ? 'bg-red-50/40'
                        : 'bg-white'
                      }`}
                  >
                    {/* Row: Attribute Name + Action Segmented */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 text-[13px] truncate">{attr.attribute_name}</span>
                        {attr.is_deviated ? (
                          <Tooltip title={attr.deviation_reason || 'Value differs from buyer request'}>
                            <Tag color="warning" className="text-[10px] py-0 px-1.5 shrink-0">
                              <WarningFilled className="mr-0.5" />Deviated
                            </Tag>
                          </Tooltip>
                        ) : (
                          <Tag color="success" className="text-[10px] py-0 px-1.5 shrink-0">
                            <CheckCircleFilled className="mr-0.5" />Match
                          </Tag>
                        )}
                      </div>

                      {/* Segmented Action Control */}
                      {!isReadOnly ? (
                        <Segmented
                          size="small"
                          value={attr.status}
                          onChange={(val) => {
                            const status = val as 'APPROVED' | 'REJECTED' | 'PENDING';
                            if (status === 'APPROVED') handleApproveField(attr.attribute_key);
                            else if (status === 'REJECTED') handleRejectField(attr.attribute_key);
                            else handleResetField(attr.attribute_key);
                          }}
                          options={[
                            {
                              value: 'APPROVED',
                              icon: <CheckCircleFilled style={{ color: attr.status === 'APPROVED' ? '#059669' : undefined }} />,
                              label: <span className="text-[10px] font-semibold">Approve</span>,
                            },
                            {
                              value: 'PENDING',
                              icon: <ExclamationCircleOutlined style={{ color: attr.status === 'PENDING' ? '#d97706' : undefined }} />,
                              label: <span className="text-[10px] font-semibold">Pending</span>,
                            },
                            {
                              value: 'REJECTED',
                              icon: <WarningFilled style={{ color: attr.status === 'REJECTED' ? '#dc2626' : undefined }} />,
                              label: <span className="text-[10px] font-semibold">Reject</span>,
                            },
                          ]}
                          className="text-xs"
                        />
                      ) : (
                        <Tag
                          color={attr.status === 'APPROVED' ? 'success' : attr.status === 'REJECTED' ? 'error' : 'warning'}
                          className="text-[11px] font-semibold py-0.5 px-2"
                        >
                          {attr.status}
                        </Tag>
                      )}
                    </div>

                    {/* Value Comparison Row */}
                    <div className="grid grid-cols-2 gap-3 text-xs mb-1.5">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Buyer Requested</div>
                        <div className="font-semibold text-slate-800">{String(attr.requested_value)}</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${attr.is_deviated ? 'bg-orange-50/60 border-orange-200' : 'bg-blue-50/60 border-blue-200'}`}>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Seller Offered</div>
                        <div className={`font-semibold ${attr.is_deviated ? 'text-orange-800' : 'text-blue-800'}`}>{String(attr.offered_value)}</div>
                      </div>
                    </div>

                    {/* Supplier Deviation Note */}
                    {attr.deviation_reason && (
                      <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
                        <MessageOutlined className="text-amber-600 mt-0.5 shrink-0" />
                        <div><span className="font-bold">Supplier Note:</span> {attr.deviation_reason}</div>
                      </div>
                    )}

                    {/* Inline Rejection Comment Editor */}
                    {attr.status === 'REJECTED' && !isReadOnly && (
                      <div className="mt-2 p-2.5 bg-red-50/60 rounded-lg border border-red-200 space-y-1">
                        <label className="text-[10px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
                          <MessageOutlined className="text-red-500" /> Rejection Feedback
                        </label>
                        <Input.TextArea
                          rows={2}
                          placeholder="Specify the technical adjustment required from the supplier..."
                          value={attr.rejection_comment || ''}
                          onChange={(e) => handleUpdateRejectionComment(attr.attribute_key, e.target.value)}
                          className="bg-white/90 text-xs"
                        />
                      </div>
                    )}

                    {/* Read-only rejection remark display */}
                    {attr.rejection_comment && isReadOnly && (
                      <div className="mt-1.5 text-[11px] p-2 rounded-lg border bg-red-50/80 border-red-200 text-red-900">
                        <span className="font-bold">Rejection Remark:</span> {attr.rejection_comment}
                      </div>
                    )}

                    {/* Conversation Log */}
                    {attr.comment_history && attr.comment_history.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                          Thread ({attr.comment_history.length})
                        </span>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {attr.comment_history.map((c) => (
                            <div key={c.id} className="px-2 py-1 rounded bg-white border border-slate-100 flex items-center justify-between">
                              <div>
                                <strong className={c.sender_role === 'BUYER' ? 'text-blue-700' : 'text-purple-700'}>
                                  {c.sender_name}:
                                </strong>{' '}
                                <span className="text-slate-600">{c.comment}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 shrink-0 ml-2">
                                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── BOTTOM ACTION BAR ── */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          {isReadOnly ? (
            <Tag color="green" icon={<CheckCircleFilled />} className="py-1.5 px-4 font-bold text-sm">
              Technical Specification Approved
            </Tag>
          ) : (
            <Space size="middle">
              {/* {rejectedCount > 0 && ( */}
              <Button
                danger
                type="primary"
                size="large"
                disabled={rejectedCount === 0}
                loading={submitting}
                icon={<ExclamationCircleOutlined />}
                onClick={() => handleFinalizeDecision('REQUEST_REVISION')}
                className="font-bold shadow-md"
              >
                Request Revision ({rejectedCount} Rejected)
              </Button>
              {/* )} */}
              <Button
                type="primary"
                size="large"
                loading={submitting}
                disabled={!is100PercentApproved}
                icon={<CheckCircleOutlined />}
                onClick={() => handleFinalizeDecision('APPROVE')}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md"
              >
                Approve Technical Specification ({percentApproved}%)
              </Button>
            </Space>
          )}
        </div>
      </div>
    </Drawer>
  );
};

