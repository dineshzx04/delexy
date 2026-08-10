import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input, InputNumber, Select, Button, Switch, Alert, App as AntApp, Divider, Breadcrumb, Tag, Descriptions, Segmented, Tooltip } from 'antd';
import {
  SendOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
  ToolOutlined,
  TagOutlined,
  FileTextOutlined,
  AimOutlined,
  ShopOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  rfqDb,
  type SellerQuote,
  type SellerAttributeResponse,
  type AttributeComment,
  type AttributeResponseHistory,
  type ItemAttributeValue
} from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface AttributeResponseState {
  key: string;
  name: string;
  groupId: string;
  attributeId: string;
  groupName?: string;
  requested: ItemAttributeValue[];
  offered: ItemAttributeValue[];
  isDeviated: boolean;
  reason: string;
  options?: { value: string; label: string }[];
}

export const SupplierItemRespond: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUser, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/supplier' : '/user/supplier';
  const { message: antMessage } = AntApp.useApp();

  const [submitting, setSubmitting] = useState(false);
  const [selectedRoundTab, setSelectedRoundTab] = useState<string>('LATEST');

  // Live queries from Dexie database stores
  const allParties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfqItems.get(itemId) : undefined), [itemId]);

  // Active supplier party resolution
  const activeParty = isBusinessContext
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId)
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId);

  const activePartyId = activeParty?.id || 'pty-4';
  const activePartyName = activeParty?.display_name || 'Responding Supplier Party';

  // Fetch quotes for this item and seller party
  const allQuotes = useLiveQuery(() => rfqDb.sellerQuote.toArray(), []) || [];
  const activeQuote = useMemo(() => {
    if (!itemId || !activePartyId) return undefined;
    return allQuotes.find(q => q.itemId === itemId && q.sellerId === activePartyId);
  }, [allQuotes, itemId, activePartyId]);

  const allAttributeResponses = useLiveQuery(() => rfqDb.sellerAttributeResponses.toArray(), []) || [];
  const activeResponses = useMemo(() => {
    if (!activeQuote) return [];
    return allAttributeResponses.filter(r => r.quoteId === activeQuote.id);
  }, [allAttributeResponses, activeQuote]);

  const allComments = useLiveQuery(() => rfqDb.attributeComments.toArray(), []) || [];
  const activeComments = useMemo(() => {
    if (!activeQuote) return [];
    return allComments.filter(c => c.quoteId === activeQuote.id);
  }, [allComments, activeQuote]);

  const allHistory = useLiveQuery(() => rfqDb.attributeResponseHistory.toArray(), []) || [];
  const activeHistory = useMemo(() => {
    if (!activeQuote) return [];
    return allHistory.filter(h => h.quoteId === activeQuote.id);
  }, [allHistory, activeQuote]);

  const historicalRounds = useMemo(() => {
    const roundsSet = new Set<number>();
    activeHistory.forEach(h => roundsSet.add(h.round));
    return Array.from(roundsSet).sort((a, b) => a - b);
  }, [activeHistory]);

  const allCategories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allAttributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allMasterProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  const itemAttributes = useLiveQuery(
    () => (itemId ? rfqDb.itemAttributes.where('itemId').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const sellerProduct = useLiveQuery(
    () => (item?.seller_product_id ? catalogDb.sellerProducts.get(item.seller_product_id) : undefined),
    [item?.seller_product_id]
  );

  // Form state for technical specification responses
  const [offeredSpecs, setOfferedSpecs] = useState<Record<string, AttributeResponseState>>({});
  const [commercialTerms, setCommercialTerms] = useState({
    offered_unit_price: 1000,
    offered_quantity: 60,
    lead_time_days: 5,
  });

  const revisionRounds = useMemo(() => {
    if (!activeQuote) return [];
    const rounds: any[] = [];
    for (let r = 1; r < activeQuote.round; r++) {
      rounds.push({
        round_number: r,
        round_status: 'SUBMITTED',
        buyer_review_notes: 'Reviewed in historical round',
      });
    }
    return rounds;
  }, [activeQuote]);

  const latestRound = useMemo(() => {
    if (!activeQuote) return null;
    return {
      round_number: activeQuote.round,
      round_status: activeQuote.status === 'SUBMITTED' ? 'PENDING' : (activeQuote.status === 'FINALIZED' ? 'APPROVED' : 'REVISION_REQUESTED'),
      buyer_review_notes: activeComments
        .filter(c => c.round === activeQuote.round && c.senderType === 'BUYER')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.comment || '',
    };
  }, [activeQuote, activeComments]);

  const isRoundPending = activeQuote?.status === 'SUBMITTED';
  const isRoundApproved = activeQuote?.status === 'FINALIZED';
  const hasBuyerCommentsInCurrentRound = useMemo(() => {
    if (!activeQuote) return false;
    return activeComments.some(
      (c) => c.round === activeQuote.round && c.senderType === 'BUYER'
    );
  }, [activeComments, activeQuote]);
  const isRoundRevisionRequested = !isRoundPending && !isRoundApproved && hasBuyerCommentsInCurrentRound;
  const isViewingHistoricalRound = selectedRoundTab !== 'LATEST';
  const isInputDisabled = isViewingHistoricalRound || isRoundPending || isRoundApproved;

  // Construct requested attribute list ordered identically to RfqCreateWizard.tsx
  const requestedAttributes = useMemo(() => {
    if (!item) return [];
    const list: AttributeResponseState[] = [];

    // 1. Static Brand & Manufacturer as virtual dynamic attributes
    const brandOptions = allBrands.map((b) => ({ value: b.name, label: b.name }));
    const mfgOptions = allManufacturers.map((m) => ({ value: m.company_name, label: m.company_name }));

    // Resolve requested brand values
    const brandIds = Array.isArray(item.brand_id) ? item.brand_id : (item.brand_id ? [item.brand_id] : []);
    const requestedBrands: ItemAttributeValue[] = brandIds.map(bId => {
      const brandObj = allBrands.find(b => b.id === bId);
      return { valueId: bId, valueLabel: brandObj?.name || bId };
    });

    // Resolve requested manufacturer values
    const mfgIds = Array.isArray(item.manufacturer_id) ? item.manufacturer_id : (item.manufacturer_id ? [item.manufacturer_id] : []);
    const requestedMfgs: ItemAttributeValue[] = mfgIds.map(mId => {
      const mfgObj = allManufacturers.find(m => m.id === mId);
      return { valueId: mId, valueLabel: mfgObj?.company_name || mId };
    });

    if (requestedBrands.length > 0) {
      const brandResp = activeResponses.find(r => r.groupId === 'static' && r.attributeId === 'brand');
      const offeredBrands = brandResp ? brandResp.value : requestedBrands;
      const isDev = brandResp ? brandResp.value.some((v: any) => !requestedBrands.some(r => r.valueId === v.valueId)) : false;

      // Find comment/reason for this attribute
      const commentObj = activeComments.find(c => c.groupId === 'static' && c.attributeId === 'brand' && c.senderType === 'SELLER');

      list.push({
        key: 'static-brand',
        name: 'Preferred Brand',
        groupId: 'static',
        attributeId: 'brand',
        requested: requestedBrands,
        offered: offeredBrands,
        isDeviated: isDev,
        reason: commentObj?.comment || '',
        options: brandOptions,
      });
    }

    if (requestedMfgs.length > 0) {
      const mfgResp = activeResponses.find(r => r.groupId === 'static' && r.attributeId === 'manufacturer');
      const offeredMfgs = mfgResp ? mfgResp.value : requestedMfgs;
      const isDev = mfgResp ? mfgResp.value.some((v: any) => !requestedMfgs.some(r => r.valueId === v.valueId)) : false;

      // Find comment/reason for this attribute
      const commentObj = activeComments.find(c => c.groupId === 'static' && c.attributeId === 'manufacturer' && c.senderType === 'SELLER');

      list.push({
        key: 'static-mfg',
        name: 'Preferred Manufacturer',
        groupId: 'static',
        attributeId: 'manufacturer',
        requested: requestedMfgs,
        offered: offeredMfgs,
        isDeviated: isDev,
        reason: commentObj?.comment || '',
        options: mfgOptions,
      });
    }

    // 2. Category Dynamic Attributes
    const category = allCategories.find((c) => c.id === item.category_id);
    const mappedGroupIds = category?.mappedGroupIds || [];

    mappedGroupIds.forEach((gId) => {
      const group = allAttributeGroups.find((g) => g.id === gId);
      if (!group) return;
      const groupAttrIds = group.attributeIds || [];
      groupAttrIds.forEach((attrId) => {
        const da = (item.dynamic_attributes || []).find((d) => d.attribute_id === attrId && d.group_id === gId);
        const attr = allAttributes.find((a) => a.id === attrId);
        if (!attr) return;

        // Resolve requested values
        let requestedVals: ItemAttributeValue[] = [];

        // 1. Check itemAttributes (custom specs)
        const itemAttr = itemAttributes.find((ia) => {
          const cleanIa = ia.attributeId.replace('attr-', '').replace(/^0+/, '');
          const cleanAttr = attrId.replace('attr-', '').replace(/^0+/, '');
          return cleanIa === cleanAttr;
        });

        if (itemAttr) {
          requestedVals = itemAttr.currentBuyerValues;
        } else if (da) {
          // 2. Check item.dynamic_attributes
          requestedVals = (da.selected_value_ids || []).map((vId) => {
            const vObj = allAttributeValues.find((v) => v.id === vId);
            return { valueId: vId, valueLabel: vObj?.label || vId };
          });
        } else if (sellerProduct) {
          // 3. Check sellerProduct specifications
          const spDa = (sellerProduct.dynamic_attributes || []).find((d) => d.attribute_id === attrId);
          if (spDa) {
            requestedVals = (spDa.selected_value_ids || []).map((vId) => {
              const vObj = allAttributeValues.find((v) => v.id === vId);
              return { valueId: vId, valueLabel: vObj?.label || vId };
            });
          } else {
            const spSpec = (sellerProduct.specifications || []).find((s) => s.attribute_id === attrId);
            if (spSpec) {
              requestedVals = (spSpec.values || []).map((v: any) => ({
                valueId: v.id || v.label,
                valueLabel: v.label || v.id,
              }));
            }
          }
        }

        // Offered lookup
        const resp = activeResponses.find((r) => r.groupId === gId && r.attributeId === attrId);
        const offeredVals = resp ? resp.value : requestedVals;
        const isDev = resp ? resp.value.some((v: any) => !requestedVals.some(r => r.valueId === v.valueId)) : false;

        const commentObj = activeComments.find(c => c.groupId === gId && c.attributeId === attrId && c.senderType === 'SELLER');

        const mappedValues = allAttributeValues.filter(
          (v) => v.attributeId === attrId || (attr?.valueIds && attr.valueIds.includes(v.id))
        );
        const valueOptions = mappedValues.map((v) => ({
          value: v.id || v.label || v.value,
          label: `${v.label || v.value}`,
        }));

        list.push({
          key: `dyn-${gId}-${attrId}`,
          name: attr.name || attr.label || attrId,
          groupId: gId,
          attributeId: attrId,
          groupName: group.name,
          requested: requestedVals,
          offered: offeredVals,
          isDeviated: isDev,
          reason: commentObj?.comment || '',
          options: valueOptions.length > 0 ? valueOptions : undefined,
        });
      });
    });

    // Catch any remaining dynamic attributes
    (item.dynamic_attributes || []).forEach((da) => {
      const alreadyAdded = list.some((l) => l.groupId === da.group_id && l.attributeId === da.attribute_id);
      if (!alreadyAdded) {
        const attr = allAttributes.find((a) => a.id === da.attribute_id);
        const group = allAttributeGroups.find((g) => g.id === da.group_id);
        if (!attr) return;

        let requestedVals: ItemAttributeValue[] = [];

        // Look up custom spec values first
        const itemAttr = itemAttributes.find((ia) => {
          const cleanIa = ia.attributeId.replace('attr-', '').replace(/^0+/, '');
          const cleanAttr = da.attribute_id.replace('attr-', '').replace(/^0+/, '');
          return cleanIa === cleanAttr;
        });

        if (itemAttr) {
          requestedVals = itemAttr.currentBuyerValues;
        } else {
          requestedVals = (da.selected_value_ids || []).map((vId) => {
            const vObj = allAttributeValues.find((v) => v.id === vId);
            return { valueId: vId, valueLabel: vObj?.label || vId };
          });
        }

        const resp = activeResponses.find((r) => r.groupId === da.group_id && r.attributeId === da.attribute_id);
        const offeredVals = resp ? resp.value : requestedVals;
        const isDev = resp ? resp.value.some((v: any) => !requestedVals.some(r => r.valueId === v.valueId)) : false;

        const commentObj = activeComments.find(c => c.groupId === da.group_id && c.attributeId === da.attribute_id && c.senderType === 'SELLER');

        const mappedValues = allAttributeValues.filter(
          (v) => v.attributeId === da.attribute_id || (attr?.valueIds && attr.valueIds.includes(v.id))
        );
        const valueOptions = mappedValues.map((v) => ({
          value: v.id || v.label || v.value,
          label: `${v.label || v.value}`,
        }));

        list.push({
          key: `dyn-${da.group_id}-${da.attribute_id}`,
          name: attr.name || attr.label || da.attribute_id,
          groupId: da.group_id,
          attributeId: da.attribute_id,
          groupName: group?.name || 'Category Attributes',
          requested: requestedVals,
          offered: offeredVals,
          isDeviated: isDev,
          reason: commentObj?.comment || '',
          options: valueOptions.length > 0 ? valueOptions : undefined,
        });
      }
    });

    return list;
  }, [item, allAttributes, allAttributeGroups, allAttributeValues, allBrands, allManufacturers, allCategories, itemAttributes, sellerProduct, activeResponses, activeComments]);

  // Populate form state when item, party response, or selected round changes
  useEffect(() => {
    if (requestedAttributes.length > 0) {
      const specs: Record<string, AttributeResponseState> = {};

      requestedAttributes.forEach((attr) => {
        specs[attr.key] = { ...attr };
      });

      // If viewing a historical round, overwrite offered values with archived history snapshot
      if (selectedRoundTab !== 'LATEST' && selectedRoundTab.startsWith('ROUND_')) {
        const roundNum = parseInt(selectedRoundTab.replace('ROUND_', ''), 10);
        const historyForRound = activeHistory.filter((h) => h.round === roundNum);

        historyForRound.forEach((hist) => {
          const specKey = Object.keys(specs).find(
            (k) => specs[k].groupId === hist.groupId && specs[k].attributeId === hist.attributeId
          );
          if (specKey) {
            specs[specKey] = {
              ...specs[specKey],
              offered: hist.value,
              isDeviated: hist.value.some((v) => !specs[specKey].requested.some((r) => r.valueId === v.valueId)),
            };
          }
        });
      }

      setOfferedSpecs(specs);
      console.log(specs)
      if (activeQuote) {
        setCommercialTerms({
          offered_unit_price: activeQuote.unit_price || item?.target_unit_price || 1000,
          offered_quantity: item?.quantity || 60,
          lead_time_days: 5,
        });
      } else if (item) {
        setCommercialTerms({
          offered_unit_price: item.target_unit_price || 1000,
          offered_quantity: item.quantity || 1,
          lead_time_days: 5,
        });
      }
    }
  }, [requestedAttributes, activeQuote, item, selectedRoundTab, activeHistory]);

  if (!rfq || !item) {
    return <div className="p-12 text-center text-slate-500">Loading Sourcing Request...</div>;
  }

  const categoryObj = allCategories.find((c) => c.id === item.category_id);
  const masterProductObj = allMasterProducts.find((p) => p.id === item.catalog_product_id);

  const handleSubmitResponse = async () => {
    setSubmitting(true);
    try {
      const currentQuote = activeQuote;
      const nextRoundNum = currentQuote ? currentQuote.round + 1 : 1;
      const quoteId = currentQuote?.id || `q-${itemId}-${activePartyId}`;

      if (currentQuote) {
        // 1. Archive current responses to history table
        const currentResponses = await rfqDb.sellerAttributeResponses.where('quoteId').equals(currentQuote.id).toArray();
        const historyEntries = currentResponses.map((r) => ({
          id: `hist-${r.id}-${currentQuote.round}`,
          responseId: r.id,
          quoteId: r.quoteId,
          round: currentQuote.round,
          groupId: r.groupId,
          attributeId: r.attributeId,
          buyerValue: r.buyerValue,
          value: r.value,
          archivedAt: new Date().toISOString(),
        }));
        if (historyEntries.length > 0) {
          await rfqDb.attributeResponseHistory.bulkPut(historyEntries);
        }

        // 2. Update existing quote
        await rfqDb.sellerQuote.update(currentQuote.id, {
          status: 'SUBMITTED',
          round: nextRoundNum,
          unit_price: commercialTerms.offered_unit_price,
        });

        // 3. Clear old responses for active quote
        await rfqDb.sellerAttributeResponses.where('quoteId').equals(currentQuote.id).delete();
      } else {
        // Create new quote
        await rfqDb.sellerQuote.put({
          id: quoteId,
          itemId: itemId!,
          sellerId: activePartyId,
          itemRevision: item?.itemRevision || 1,
          round: 1,
          unit_price: commercialTerms.offered_unit_price,
          status: 'SUBMITTED',
        });
      }

      // 4. Save new attribute response records
      const newResponses = Object.values(offeredSpecs).map((spec) => ({
        id: `resp-${quoteId}-${spec.groupId}-${spec.attributeId}`,
        quoteId: quoteId,
        groupId: spec.groupId,
        attributeId: spec.attributeId,
        buyerValue: spec.requested,
        value: spec.offered,
      }));
      await rfqDb.sellerAttributeResponses.bulkPut(newResponses);

      // 5. Save deviation comments if any
      const commentEntries = Object.values(offeredSpecs)
        .filter((spec) => spec.isDeviated && spec.reason)
        .map((spec) => ({
          id: `c-${quoteId}-${spec.groupId}-${spec.attributeId}-${nextRoundNum}`,
          quoteId: quoteId,
          groupId: spec.groupId,
          attributeId: spec.attributeId,
          round: nextRoundNum,
          senderType: 'SELLER' as const,
          senderId: activePartyId,
          comment: spec.reason,
          createdAt: new Date().toISOString(),
        }));
      if (commentEntries.length > 0) {
        await rfqDb.attributeComments.bulkPut(commentEntries);
      }

      antMessage.success(`Technical response (Round #${nextRoundNum}) submitted for ${activePartyName}!`);
      navigate(basePath);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  // Group dynamic attributes by groupName matching RfqCreateWizard.tsx
  const dynamicSpecs = Object.values(offeredSpecs).filter((s) => s.groupId !== 'static');
  const groupedDynamicSpecs = dynamicSpecs.reduce((acc: Record<string, AttributeResponseState[]>, spec) => {
    const gName = spec.groupName || 'Category Attributes';
    if (!acc[gName]) acc[gName] = [];
    acc[gName].push(spec);
    return acc;
  }, {});

  const brandMfgSpecs = Object.values(offeredSpecs).filter((s) => s.groupId === 'static');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>Supplier Inbox</a> },
          { title: `${rfq.rfq_number} - Item Technical Response` },
        ]}
      />

      <Card className="shadow-sm border-slate-200 p-2">
        {/* HEADER TITLE & PARTY BADGE */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Tag color="blue" className="font-bold">Phase 3: Technical Response</Tag>
              <Tag color="purple" icon={<ShopOutlined />}>Party: {activePartyName} ({activePartyId})</Tag>
              {item.variant_id && <Tag color="green" icon={<AimOutlined />}>Targeted Variant SKU</Tag>}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 m-0">{item.product_name}</h1>
            <p className="text-xs text-slate-500 m-0">
              Technical response & deviation matrix for <strong>{activePartyName}</strong>.
            </p>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(basePath)}>
            Back to Inbox
          </Button>
        </div>

        {/* REVISION ROUND HISTORY CONTROL */}
        {revisionRounds.length > 0 && (
          <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HistoryOutlined className="text-blue-600 text-base" />
              <div>
                <div className="text-xs font-bold text-slate-800">Technical Revision Rounds History</div>
                <div className="text-[11px] text-slate-500">
                  {revisionRounds.length} round(s) submitted for this seller party. Select a round to inspect snapshots.
                </div>
              </div>
            </div>
            <Segmented
              value={selectedRoundTab}
              onChange={(val) => setSelectedRoundTab(val as string)}
              options={[
                { label: 'Current / New Response', value: 'LATEST' },
                ...revisionRounds.map((r) => ({
                  label: `Round #${r.round_number} (${r.round_status})`,
                  value: `ROUND_${r.round_number}`,
                })),
              ]}
            />
          </div>
        )}

        {/* STATE-DEPENDENT DYNAMIC STATUS ALERTS */}
        {isRoundApproved ? (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleFilled />}
            message={`Technical Specification Approved (Round #${latestRound?.round_number})`}
            description="The buyer has approved 100% of your technical specification response. Your item has moved to the Commercial Negotiation phase."
            className="my-4"
          />
        ) : isRoundPending ? (
          <Alert
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            message={`Technical Response (Round #${latestRound?.round_number}) Submitted - Under Buyer Review`}
            description="Your technical response has been submitted to the buyer. Inputs are locked in read-only mode while the buyer evaluates your specifications."
            className="my-4"
          />
        ) : isRoundRevisionRequested ? (
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message={`Buyer Technical Revision Requested (Round #${latestRound?.round_number})`}
            description={
              latestRound?.buyer_review_notes ||
              'The buyer requested adjustments to technical attributes or offered specifications. Review buyer comments below and resubmit updated specs.'
            }
            className="my-4"
          />
        ) : null}

        {/* TARGETED VARIANT FOCUS BANNER (Matching RfqCreateWizard.tsx) */}
        {item.variant_id && (
          <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <AimOutlined className="text-emerald-600" /> Targeted Catalog Variant Bound
              </div>
              <div className="text-xs text-emerald-700 font-mono mt-0.5">
                SKU: <strong>{item.variant_sku || item.variant_id}</strong> | Product ID: {item.seller_product_id}
              </div>
            </div>
            <Tag color="green" className="font-bold">Targeted SKU</Tag>
          </div>
        )}

        <div className="space-y-5 mt-4">
          {/* 2. SECTION 1: BASIC PARAMETERS & RFQ CONTAINER CONTEXT */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 m-0">
              <AppstoreOutlined className="text-blue-600" /> Basic Parameters & RFQ Container Context
            </h4>

            <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered className="bg-white">
              <Descriptions.Item label="RFQ Number"><span className="font-bold text-slate-800">{rfq.rfq_number}</span></Descriptions.Item>
              <Descriptions.Item label="RFQ Title">{rfq.title}</Descriptions.Item>
              <Descriptions.Item label="Requester">{rfq.requester_name}</Descriptions.Item>
              <Descriptions.Item label="Leaf Category"><Tag color="purple">{categoryObj?.name || item.category_id}</Tag></Descriptions.Item>
              <Descriptions.Item label="Master Product">{masterProductObj?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Requested Qty"><strong className="text-slate-900">{item.quantity} {item.unit_of_measure}</strong></Descriptions.Item>
              <Descriptions.Item label="Target Price">{item.target_unit_price ? `$${item.target_unit_price}` : 'Open Quote'}</Descriptions.Item>
              <Descriptions.Item label="Deadline">{new Date(rfq.submission_deadline).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Shipping Destination">{rfq.shipping_destination}</Descriptions.Item>
            </Descriptions>
          </div>

          {/* 3. SECTION 2: BRAND & MANUFACTURER SPECIFICATION RESPONSE (SINGLE SELECT) */}
          {brandMfgSpecs.length > 0 && (
            <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 m-0">
                <ShopOutlined className="text-blue-600" /> Brand & Manufacturer
              </h4>
              <div className="space-y-2">
                {brandMfgSpecs.map((spec) => {
                  const buyerCommentObj = activeComments
                    .filter(c => c.groupId === spec.groupId && c.attributeId === spec.attributeId && c.senderType === 'BUYER')
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                  return (
                    <div key={spec.key} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="min-w-[180px]">
                          <span className="font-bold text-slate-800 text-xs">{spec.name}</span>
                          <div className="text-xs text-slate-500">
                            Requested: <strong className="text-slate-900">{spec.requested.map(r => r.valueLabel || r.valueId).join(', ') || '-'}</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-slate-600">Offered Value (Multiple Select)</label>
                            {spec.options && spec.options.length > 0 ? (
                              <Select
                                disabled={isInputDisabled}
                                mode="multiple"
                                size="small"
                                className="w-full"
                                placeholder="Select offered brand or manufacturer..."
                                value={spec.offered.map(o => o.valueId)}
                                options={spec.options}
                                onChange={(vals: string[]) => {
                                  const offeredVals = vals.map(val => {
                                    const opt = spec.options?.find(o => o.value === val);
                                    return { valueId: val, valueLabel: opt?.label || val };
                                  });
                                  const isDev = offeredVals.some(v => !spec.requested.some(r => r.valueId === v.valueId)) ||
                                                spec.requested.some(r => !offeredVals.some(v => v.valueId === r.valueId));
                                  setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: offeredVals, isDeviated: isDev } });
                                }}
                              />
                            ) : (
                              <Input
                                disabled={isInputDisabled}
                                size="small"
                                value={spec.offered.map(o => o.valueLabel || o.valueId).join(', ')}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  const offeredVals = valStr.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ valueId: v, valueLabel: v }));
                                  const isDev = offeredVals.some(v => !spec.requested.some(r => r.valueId === v.valueId)) ||
                                                spec.requested.some(r => !offeredVals.some(v => v.valueId === r.valueId));
                                  setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: offeredVals, isDeviated: isDev } });
                                }}
                              />
                            )}
                          </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-semibold text-slate-600">Deviated?</span>
                          <Switch
                            disabled={isInputDisabled}
                            size="small"
                            checked={spec.isDeviated}
                            onChange={(checked) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, isDeviated: checked } })}
                          />
                        </div>
                      </div>
                      {spec.isDeviated && (
                        <div className="min-w-[200px]">
                          <label className="text-[11px] font-semibold text-amber-700">Deviation Reason</label>
                          <Input
                            disabled={isInputDisabled}
                            size="small"
                            placeholder="Brand/mfg variance reason..."
                            value={spec.reason}
                            onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, reason: e.target.value } })}
                            className="border-amber-300 bg-amber-50"
                          />
                        </div>
                      )}
                    </div>
                    {buyerCommentObj && (
                      <div className="mt-2 p-2 rounded border bg-red-50/90 border-red-200 text-red-900 text-xs space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <ExclamationCircleOutlined className="text-red-600" /> Buyer Revision Request Remark:
                        </div>
                        <div>{buyerCommentObj.comment}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}


          {/* 5. SECTION 4: CATEGORY MAPPED DYNAMIC ATTRIBUTES */}
          {Object.keys(groupedDynamicSpecs).length > 0 && (
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
              <h4 className="font-bold text-purple-900 text-xs uppercase tracking-wider flex items-center gap-2 m-0">
                Category Attributes
              </h4>

              {Object.entries(groupedDynamicSpecs).map(([groupName, specs]) => (
                <div key={groupName} className="p-3 bg-white rounded-lg border border-purple-100 shadow-sm space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-800 border-b border-purple-50 pb-1">
                    {groupName}
                  </div>
                  <div className="space-y-2">
                    {specs.map((spec) => {
                      const buyerCommentObj = activeComments
                        .filter(c => c.groupId === spec.groupId && c.attributeId === spec.attributeId && c.senderType === 'BUYER')
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                      return (
                        <div key={spec.key} className="p-2.5 bg-purple-50/30 rounded border border-purple-100 flex flex-col justify-between gap-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="min-w-[180px]">
                              <span className="font-bold text-slate-800 text-xs">{spec.name}</span>
                              <div className="text-xs text-slate-600">
                                Requested: <strong className="text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded">
                                  {spec.requested.map(r => r.valueLabel || r.valueId).join(', ') || '-'}
                                </strong>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <label className="text-[11px] font-semibold text-slate-600">Offered Value</label>
                                {spec.options && spec.options.length > 0 ? (
                                  <Select
                                    disabled={isInputDisabled}
                                    mode="multiple"
                                    size="small"
                                    className="w-full"
                                    placeholder="Select offered attribute value(s)..."
                                    value={spec.offered.map(o => o.valueId)}
                                    options={spec.options}
                                    onChange={(vals: string[]) => {
                                      console.log(vals)
                                      const offeredVals = vals.map(val => {
                                        const opt = spec.options?.find(o => o.value === val);
                                        return { valueId: val, valueLabel: opt?.label || val };
                                      });
                                      const isDev = offeredVals.some(v => !spec.requested.some(r => r.valueId === v.valueId)) ||
                                                    spec.requested.some(r => !offeredVals.some(v => v.valueId === r.valueId));
                                      setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: offeredVals, isDeviated: isDev } });
                                    }}
                                  />
                                ) : (
                                  <Input
                                    disabled={isInputDisabled}
                                    size="small"
                                    value={spec.offered.map(o => o.valueLabel || o.valueId).join(', ')}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      const offeredVals = valStr.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ valueId: v, valueLabel: v }));
                                      const isDev = offeredVals.some(v => !spec.requested.some(r => r.valueId === v.valueId)) ||
                                                    spec.requested.some(r => !offeredVals.some(v => v.valueId === r.valueId));
                                      setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: offeredVals, isDeviated: isDev } });
                                    }}
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[11px] font-semibold text-slate-600">Deviated?</span>
                                <Switch
                                  disabled={isInputDisabled}
                                  size="small"
                                  checked={spec.isDeviated}
                                  onChange={(checked) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, isDeviated: checked } })}
                                />
                              </div>
                            </div>
                            {spec.isDeviated && (
                              <div className="min-w-[200px]">
                                <label className="text-[11px] font-semibold text-amber-700">Deviation Reason</label>
                                <Input
                                  disabled={isInputDisabled}
                                  size="small"
                                  placeholder="Equivalent grade remarks..."
                                  value={spec.reason}
                                  onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, reason: e.target.value } })}
                                  className="border-amber-300 bg-amber-50"
                                />
                              </div>
                            )}
                          </div>

                          {buyerCommentObj && (
                            <div className="mt-2 p-2 rounded border bg-red-50/90 border-red-200 text-red-900 text-xs space-y-0.5">
                              <div className="font-bold flex items-center gap-1.5">
                                <ExclamationCircleOutlined className="text-red-600" /> Buyer Revision Request Remark:
                              </div>
                              <div>{buyerCommentObj.comment}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}



          {/* 7. SECTION 6: COMMERCIAL QUOTE (INITIAL TERMS) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider m-0">
              Commercial Quote (Initial Terms)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Offered Unit Price ($) *</label>
                <InputNumber
                  disabled={isInputDisabled}
                  min={1}
                  value={commercialTerms.offered_unit_price}
                  onChange={(val) => setCommercialTerms({ ...commercialTerms, offered_unit_price: val || 0 })}
                  className="w-full mt-1"
                  prefix="$"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Offered Quantity *</label>
                <InputNumber
                  disabled={isInputDisabled}
                  min={1}
                  value={commercialTerms.offered_quantity}
                  onChange={(val) => setCommercialTerms({ ...commercialTerms, offered_quantity: val || 0 })}
                  className="w-full mt-1"
                  suffix={item.unit_of_measure || 'Units'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Lead Time (Days) *</label>
                <InputNumber
                  disabled={isInputDisabled}
                  min={1}
                  value={commercialTerms.lead_time_days}
                  onChange={(val) => setCommercialTerms({ ...commercialTerms, lead_time_days: val || 0 })}
                  className="w-full mt-1"
                  suffix="Days"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="text-slate-600">Total Commercial Amount:</span>
              <strong className="text-emerald-600 text-lg">
                ${(commercialTerms.offered_unit_price * commercialTerms.offered_quantity).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* STATE-DEPENDENT DYNAMIC ACTION BUTTON */}
        <div className="mt-6">
          {isRoundApproved ? (
            <Button
              type="primary"
              size="large"
              block
              onClick={() => navigate(basePath)}
              icon={<CheckCircleFilled />}
              className="bg-emerald-600 hover:bg-emerald-700 h-12 font-bold text-base shadow-md"
            >
              Technical Specification Approved (100%) - Return to Inbox
            </Button>
          ) : isRoundPending ? (
            <Button
              type="primary"
              size="large"
              block
              disabled
              icon={<ClockCircleOutlined />}
              className="h-12 font-bold text-base shadow-md disabled:bg-slate-300"
            >
              Technical Response Round #{latestRound?.round_number} Submitted - Awaiting Buyer Review
            </Button>
          ) : isRoundRevisionRequested ? (
            <Button
              danger
              type="primary"
              size="large"
              block
              loading={submitting}
              onClick={handleSubmitResponse}
              icon={<SendOutlined />}
              className="h-12 font-bold text-base shadow-md"
            >
              Submit Technical Revision Round #{revisionRounds.length + 1} for {activePartyName}
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              block
              disabled={isViewingHistoricalRound}
              loading={submitting}
              onClick={handleSubmitResponse}
              icon={<SendOutlined />}
              className="bg-emerald-600 hover:bg-emerald-700 h-12 font-bold text-base shadow-md disabled:bg-slate-300"
            >
              Submit Initial Technical Response for {activePartyName}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
