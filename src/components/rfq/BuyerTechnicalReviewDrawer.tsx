import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Button,
  Tag,
  Input,
  Progress,
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
  forceReadOnly?: boolean;
}

interface AttributeAuditItem {
  attribute_key: string;
  attribute_name: string;
  group_id: string;
  group_name: string;
  description?: string;
  requested_value: any;
  offered_value: any;
  is_deviated: boolean;
  deviation_reason?: string;
  rejected_at?: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  rejection_comment?: string;
  comment_history?: any[];
}

export const BuyerTechnicalReviewDrawer: React.FC<BuyerTechnicalReviewDrawerProps> = ({
  open,
  onClose,
  quoteId,
  itemTitle,
  forceReadOnly,
}) => {
  const { currentUserId } = useWorkspace();
  const { message: antMessage } = AntApp.useApp();

  const [submitting, setSubmitting] = useState(false);
  const [attributesState, setAttributesState] = useState<Record<string, AttributeAuditItem>>({});
  const [overallNotes, setOverallNotes] = useState('');

  const activeQuote = useLiveQuery(() => quoteId ? rfqDb.seller_quotes.get(quoteId) : undefined, [quoteId]);
  const quoteRevisions = useLiveQuery(() => quoteId ? rfqDb.seller_quote_revisions.where('seller_quote_id').equals(quoteId).toArray() : [], [quoteId]) || [];
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

  const isFinalized = activeQuote?.status === 'NEGOTIATION' || activeQuote?.status === 'ACCEPTED' || activeQuote?.status === 'PARTIALLY_ACCEPTED';
  const isReadOnly = Boolean(forceReadOnly) || isFinalized;

  const attrList = useMemo(() => {
    if (!activeQuote) return [];

    const buyerItemAttributes = allItemAttributes.filter(ia => ia.rfq_item_id === activeQuote.rfq_item_id);

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

      const attrComments = quoteComments
        .filter(c => c.quote_attribute_id === resp.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const sellerComments = attrComments.filter(c => c.sender === 'SELLER');
      const buyerComments = attrComments.filter(c => c.sender === 'BUYER');
      const sellerComment = sellerComments[sellerComments.length - 1];
      const buyerComment = buyerComments[buyerComments.length - 1];

      const commentsHistory = attrComments
        .map(c => ({
          id: c.id,
          sender_role: c.sender || 'SELLER',
          sender_name: c.sender === 'BUYER' ? 'Buyer' : 'Supplier',
          sender_user_id: c.sender_id || '',
          comment: c.comment,
          timestamp: c.created_at
        }));

      let initialStatus: 'APPROVED' | 'REJECTED' | 'PENDING' = 'PENDING';
      if (activeQuote.status === 'NEGOTIATION' || activeQuote?.status === 'ACCEPTED' || activeQuote?.status === 'PARTIALLY_ACCEPTED') {
        initialStatus = 'APPROVED';
      } else if (buyerComment || activeQuote.status === 'REVISED') {
        initialStatus = 'REJECTED';
      }

      return {
        attribute_key: key,
        attribute_name: attributeName,
        group_id: resp.group_id || 'static',
        group_name: groupName,
        description: buyerAttr?.description || '',
        requested_value: reqLabel,
        offered_value: offLabel,
        is_deviated: isDev,
        deviation_reason: sellerComment?.comment || '',
        rejected_at: buyerComment?.created_at,
        status: initialStatus,
        rejection_comment: buyerComment?.comment || '',
        comment_history: commentsHistory
      } as AttributeAuditItem;
    });
  }, [activeQuote, quoteResponses, quoteComments, rfqItem, allItemAttributes, allAttributes, allAttributeGroups]);

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
  const approvedPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const rejectedPercent = totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0;
  const pendingPercent = Math.max(0, 100 - approvedPercent - rejectedPercent);
  const percentApproved = approvedPercent;
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

      const nextQuoteStatus = action === 'APPROVE' ? 'NEGOTIATION' : 'REVISED';
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
            <span className="font-black text-slate-800 text-base">
              Technical Review: {sellerParty?.display_name}
            </span>
            {forceReadOnly && !isFinalized && (
              <Tag color="default" className="font-semibold">
                VIEW ONLY
              </Tag>
            )}
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
      footer={
        <div className="flex items-center justify-end gap-3 bg-white py-3 px-6 border-t border-slate-200">
          {isReadOnly ? (
            isFinalized ? (
              <Tag color="green" icon={<CheckCircleFilled />} className="py-1.5 px-4 font-bold text-sm">
                Technical Review Approved
              </Tag>
            ) : (
              <Tag color="default" className="py-1.5 px-4 font-bold text-sm">
                View Only
              </Tag>
            )
          ) : (
            <Space size="middle">
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
                Request Revision ({rejectedCount})
              </Button>
              <Button
                type="primary"
                size="large"
                loading={submitting}
                disabled={!is100PercentApproved}
                icon={<CheckCircleOutlined />}
                onClick={() => handleFinalizeDecision('APPROVE')}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-md"
              >
                Approve ({percentApproved}%)
              </Button>
            </Space>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── SUMMARY HEADER ── */}
        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-sm font-black text-slate-900 leading-tight m-0 truncate">{itemTitle || rfqItem?.product_name}</h2>
            <span className="text-sm font-black text-slate-700 shrink-0">{percentApproved}%</span>
          </div>
          <div className="mb-1 h-2 w-full overflow-hidden rounded bg-slate-200 flex">
            <div className="h-full bg-emerald-500" style={{ width: `${approvedPercent}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${rejectedPercent}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${pendingPercent}%` }} />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{approvedCount} Approved</span>
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{rejectedCount} Rejected</span>
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{pendingCount} Pending</span>
            <span className="ml-auto text-slate-400 font-mono">{totalCount} total</span>
          </div>
        </div>

        {/* ── GROUPED SECTIONS ── */}
        {groupedSections.map(([groupId, section], groupIndex) => {
          const sectionApproved = section.items.filter(i => i.status === 'APPROVED').length;
          const sectionTotal = section.items.length;
          const sectionPct = sectionTotal > 0 ? Math.round((sectionApproved / sectionTotal) * 100) : 0;
          const allSectionApproved = sectionApproved === sectionTotal && sectionTotal > 0;

          const groupStyle = groupIndex % 3;
          const groupShellClass = groupStyle === 0 ? 'border-l-slate-400' : groupStyle === 1 ? 'border-l-slate-500' : 'border-l-slate-300';
          const groupHeaderClass = groupStyle === 0 ? 'bg-slate-50' : groupStyle === 1 ? 'bg-slate-100/70' : 'bg-slate-50/80';
          const groupBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

          return (
            <div key={groupId} className={`rounded-lg border border-slate-200 border-l-4 ${groupShellClass} bg-white overflow-hidden`}>
              {/* Section Header */}
              <div className={`px-3 py-2 border-b border-slate-200 flex items-center justify-between ${groupHeaderClass}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${allSectionApproved ? 'bg-slate-600' : sectionApproved > 0 ? 'bg-slate-500' : 'bg-slate-300'}`} />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border font-bold tracking-wide text-[11px] ${groupBadgeClass}`}>
                    {section.group_name}
                  </span>
                  <Tag className="text-[10px] py-0 px-1.5 font-mono" color="default">
                    {sectionApproved}/{sectionTotal}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    type="circle"
                    percent={sectionPct}
                    size={28}
                    strokeColor="#475569"
                    strokeWidth={10}
                    format={() => <span className="text-[9px] font-bold">{sectionPct}%</span>}
                  />
                  {!isReadOnly && (
                    <Tooltip title="Approve all in this section">
                      <Button
                        size="small"
                        type="text"
                        icon={<CheckOutlined />}
                        className="text-slate-600 text-[11px] h-6"
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
                    className={`px-3 py-2.5 transition-all duration-200 ${attr.status === 'APPROVED'
                      ? 'bg-slate-50/70'
                      : attr.status === 'REJECTED'
                        ? 'bg-slate-50/40'
                        : 'bg-white'
                      }`}
                  >
                    {/* Row: Attribute Name + Action Segmented */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
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
                        {attr.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{attr.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isReadOnly ? (
                          <Space size="middle">
                            <Button
                              size="small"
                              shape="round"
                              type={attr.status === 'APPROVED' ? 'primary' : 'default'}
                              className={
                                attr.status === 'APPROVED'
                                  ? 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold'
                                  : 'text-slate-600 border-slate-200 hover:text-emerald-600 hover:border-emerald-500 text-[11px] font-semibold'
                              }
                              icon={<CheckCircleFilled style={{ color: attr.status === 'APPROVED' ? '#fff' : '#059669' }} />}
                              onClick={() => {
                                if (attr.status === 'APPROVED') {
                                  handleResetField(attr.attribute_key);
                                } else {
                                  handleApproveField(attr.attribute_key);
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              shape="round"
                              danger
                              type={attr.status === 'REJECTED' ? 'primary' : 'default'}
                              className={
                                attr.status === 'REJECTED'
                                  ? 'bg-rose-600 border-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold'
                                  : 'text-slate-600 border-slate-200 hover:text-rose-600 hover:border-rose-500 text-[11px] font-semibold'
                              }
                              icon={<WarningFilled style={{ color: attr.status === 'REJECTED' ? '#fff' : '#dc2626' }} />}
                              onClick={() => {
                                if (attr.status === 'REJECTED') {
                                  handleResetField(attr.attribute_key);
                                } else {
                                  handleRejectField(attr.attribute_key);
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </Space>
                        ) : (
                          <Tag
                            color={attr.status === 'APPROVED' ? 'success' : attr.status === 'REJECTED' ? 'error' : 'warning'}
                            className="text-[11px] font-semibold py-0.5 px-2"
                          >
                            {attr.status}
                          </Tag>
                        )}
                      </div>
                    </div>

                    {attr.status === 'REJECTED' && (
                      <div className="mb-2 text-[10px] font-semibold text-rose-700">
                        {attr.rejected_at
                          ? `Rejected at ${new Date(attr.rejected_at).toLocaleString([], {
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                          : 'Rejected (time will be set on submit)'}
                      </div>
                    )}

                    {/* Value Comparison Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-1">
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Buyer Requested</div>
                        <div className="font-semibold">{String(attr.requested_value)}</div>
                      </div>
                      <div className={`p-2 rounded-lg border border-l-4 ${attr.is_deviated
                          ? 'bg-amber-50/70 border-amber-200 border-l-amber-500 text-amber-900'
                          : 'bg-emerald-50/40 border-emerald-100 border-l-emerald-500 text-emerald-900'
                        }`}>
                        <div className="text-[10px] opacity-75 font-semibold uppercase tracking-wider mb-0.5">
                          Seller Offered {attr.is_deviated ? '(Deviated)' : '(Match)'}
                        </div>
                        <div className="font-bold">{String(attr.offered_value)}</div>
                      </div>
                    </div>

                    {attr.deviation_reason && (
                      <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
                        <MessageOutlined className="text-amber-600 mt-0.5 shrink-0" />
                        <div><span className="font-bold">Supplier Note:</span> {attr.deviation_reason}</div>
                      </div>
                    )}

                    {attr.status === 'REJECTED' && !isReadOnly && (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 mb-1.5">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <MessageOutlined className="text-slate-500" /> Buyer Feedback
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

                    {attr.status === 'REJECTED' && isReadOnly && attr.rejection_comment && (
                      <div className="text-[11px] p-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 mb-1.5">
                        <span className="font-bold">Rejection Remark:</span> {attr.rejection_comment}
                      </div>
                    )}


                    {attr.comment_history && attr.comment_history.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                          <span>Thread ({attr.comment_history.length})</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {attr.comment_history.map((c) => (
                            <div key={c.id} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100/80 flex items-center justify-between gap-2">
                              <div className="truncate">
                                <strong className={c.sender_role === 'BUYER' ? 'text-blue-700' : 'text-purple-700'}>
                                  {c.sender_name}:
                                </strong>{' '}
                                <span className="text-slate-600">{c.comment}</span>
                              </div>
                              <span className="text-[8px] text-slate-400 shrink-0">
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


      </div>
    </Drawer>
  );
};

