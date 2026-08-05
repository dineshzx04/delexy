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
import { rfqDb, type TechnicalAttributeResponse, type ItemSupplierResponse, type AttributeCommentEntry } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface AttributeResponseState {
  key: string;
  name: string;
  category: 'DYNAMIC_ATTRIBUTE' | 'STATIC_DIMENSION' | 'MANUFACTURING_INPUT' | 'BRAND_MANUFACTURER';
  groupId?: string;
  groupName?: string;
  requested: string;
  offered: string;
  isDeviated: boolean;
  reason: string;
  options?: { value: string; label: string }[];
  buyerStatus?: string;
  buyerComment?: string;
  commentHistory?: AttributeCommentEntry[];
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
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || allParties[0]
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || allParties.find((p) => p.id === 'pty-6') || allParties[0];

  const activePartyId = activeParty?.id || 'pty-4';
  const activePartyName = activeParty?.display_name || 'Responding Supplier Party';

  // Fetch responses for this item and filter strictly by active supplier party ID
  const responsesForItem = useLiveQuery(
    () => (itemId ? rfqDb.itemSupplierResponses.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const response: ItemSupplierResponse | undefined = useMemo(() => {
    if (!responsesForItem || responsesForItem.length === 0) return undefined;
    return (
      responsesForItem.find((r) => r.seller_party_id === activePartyId) ||
      responsesForItem.find((r) => r.supplier_user_id === currentUserId) ||
      responsesForItem[0]
    );
  }, [responsesForItem, activePartyId, currentUserId]);

  const allCategories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allAttributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allMasterProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  // Form state for technical specification responses
  const [offeredSpecs, setOfferedSpecs] = useState<Record<string, AttributeResponseState>>({});
  const [commercialTerms, setCommercialTerms] = useState({
    offered_unit_price: 1000,
    offered_quantity: 60,
    lead_time_days: 5,
  });

  // Technical Revision Rounds history
  const revisionRounds = useMemo(() => {
    return response?.technical_revision_rounds || [];
  }, [response]);

  const latestRound = useMemo(() => {
    if (revisionRounds.length === 0) return null;
    return revisionRounds[revisionRounds.length - 1];
  }, [revisionRounds]);

  const isRoundPending = latestRound?.round_status === 'PENDING';
  const isRoundApproved = latestRound?.round_status === 'APPROVED' || response?.status === 'TECHNICAL_APPROVED';
  const isRoundRevisionRequested = latestRound?.round_status === 'REVISION_REQUESTED';
  const isViewingHistoricalRound = selectedRoundTab !== 'LATEST';
  const isInputDisabled = isViewingHistoricalRound || isRoundPending || isRoundApproved;

  // Construct requested attribute list ordered identically to RfqCreateWizard.tsx
  const requestedAttributes = useMemo(() => {
    if (!item) return [];
    const list: AttributeResponseState[] = [];

    // 1. Static Specs & Physical Dimensions (Exact Order from RfqCreateWizard.tsx)
    const brandOptions = allBrands.map((b) => ({ value: b.name, label: b.name }));
    const mfgOptions = allManufacturers.map((m) => ({ value: m.company_name, label: m.company_name }));

    const requestedBrandName = Array.isArray(item.brand_id)
      ? item.brand_id.map((bId) => allBrands.find((b) => b.id === bId)?.name || bId).join(', ')
      : allBrands.find((b) => b.id === item.brand_id)?.name || item.brand_id || 'Unspecified';

    const requestedMfgName = Array.isArray(item.manufacturer_id)
      ? item.manufacturer_id.map((mId) => allManufacturers.find((m) => m.id === mId)?.company_name || mId).join(', ')
      : allManufacturers.find((m) => m.id === item.manufacturer_id)?.company_name || item.manufacturer_id || 'Unspecified';

    const modelInput = (item.manufacturing_inputs || []).find((i) => i.field_id === 'model_number');
    const partInput = (item.manufacturing_inputs || []).find((i) => i.field_id === 'part_number');
    const cooInput = (item.manufacturing_inputs || []).find((i) => i.field_id === 'country_of_origin');

    if (item.brand_id && (Array.isArray(item.brand_id) ? item.brand_id.length > 0 : true)) {
      list.push({
        key: 'static-brand',
        name: 'Preferred Brand',
        category: 'BRAND_MANUFACTURER',
        requested: requestedBrandName,
        offered: requestedBrandName,
        isDeviated: false,
        reason: '',
        options: brandOptions,
      });
    }
    if (item.manufacturer_id && (Array.isArray(item.manufacturer_id) ? item.manufacturer_id.length > 0 : true)) {
      list.push({
        key: 'static-mfg',
        name: 'Preferred Manufacturer',
        category: 'BRAND_MANUFACTURER',
        requested: requestedMfgName,
        offered: requestedMfgName,
        isDeviated: false,
        reason: '',
        options: mfgOptions,
      });
    }
    if (modelInput) {
      list.push({ key: 'static-model_number', name: 'Model Number', category: 'STATIC_DIMENSION', requested: String(modelInput.value), offered: String(modelInput.value), isDeviated: false, reason: '' });
    }
    if (partInput) {
      list.push({ key: 'static-part_number', name: 'Part Number', category: 'STATIC_DIMENSION', requested: String(partInput.value), offered: String(partInput.value), isDeviated: false, reason: '' });
    }
    if (cooInput) {
      list.push({ key: 'static-country_of_origin', name: 'Country of Origin', category: 'STATIC_DIMENSION', requested: String(cooInput.value), offered: String(cooInput.value), isDeviated: false, reason: '' });
    }
    if (item.height) {
      list.push({ key: 'dim-height', name: 'Height', category: 'STATIC_DIMENSION', requested: item.height, offered: item.height, isDeviated: false, reason: '' });
    }
    if (item.width) {
      list.push({ key: 'dim-width', name: 'Width', category: 'STATIC_DIMENSION', requested: item.width, offered: item.width, isDeviated: false, reason: '' });
    }
    if (item.length) {
      list.push({ key: 'dim-length', name: 'Length', category: 'STATIC_DIMENSION', requested: item.length, offered: item.length, isDeviated: false, reason: '' });
    }
    if (item.weight) {
      list.push({ key: 'dim-weight', name: 'Weight', category: 'STATIC_DIMENSION', requested: item.weight, offered: item.weight, isDeviated: false, reason: '' });
    }

    // 2. Category Dynamic Attributes (Sorted strictly by Category mappedGroupIds & Group attributeIds)
    const category = allCategories.find((c) => c.id === item.category_id);
    const mappedGroupIds = category?.mappedGroupIds || [];

    mappedGroupIds.forEach((gId) => {
      const group = allAttributeGroups.find((g) => g.id === gId);
      if (!group) return;

      const groupAttrIds = group.attributeIds || [];
      groupAttrIds.forEach((attrId) => {
        const da = (item.dynamic_attributes || []).find((d) => d.attribute_id === attrId && d.group_id === gId);
        if (da) {
          const attr = allAttributes.find((a) => a.id === da.attribute_id);
          const valLabels = (da.selected_value_ids || [])
            .map((vId) => {
              const vObj = allAttributeValues.find((v) => v.id === vId);
              return vObj?.label || vId;
            })
            .join(', ');

          const mappedValues = allAttributeValues.filter(
            (v) => v.attributeId === da.attribute_id || (attr?.valueIds && attr.valueIds.includes(v.id))
          );
          const valueOptions = mappedValues.map((v) => ({
            value: v.label || v.value,
            label: `${v.label || v.value}`,
          }));

          if (attr && valLabels) {
            list.push({
              key: `dyn-${da.attribute_id}`,
              name: attr.name || attr.label || da.attribute_id,
              category: 'DYNAMIC_ATTRIBUTE',
              groupId: group.id,
              groupName: group.name,
              requested: valLabels,
              offered: valLabels,
              isDeviated: false,
              reason: '',
              options: valueOptions.length > 0 ? valueOptions : undefined,
            });
          }
        }
      });
    });

    // Catch any remaining dynamic attributes
    (item.dynamic_attributes || []).forEach((da) => {
      const alreadyAdded = list.some((l) => l.key === `dyn-${da.attribute_id}`);
      if (!alreadyAdded) {
        const attr = allAttributes.find((a) => a.id === da.attribute_id);
        const group = allAttributeGroups.find((g) => g.id === da.group_id);
        const valLabels = (da.selected_value_ids || [])
          .map((vId) => {
            const vObj = allAttributeValues.find((v) => v.id === vId);
            return vObj?.label || vId;
          })
          .join(', ');

        const mappedValues = allAttributeValues.filter(
          (v) => v.attributeId === da.attribute_id || (attr?.valueIds && attr.valueIds.includes(v.id))
        );
        const valueOptions = mappedValues.map((v) => ({
          value: v.label || v.value,
          label: `${v.label || v.value}`,
        }));

        if (attr && valLabels) {
          list.push({
            key: `dyn-${da.attribute_id}`,
            name: attr.name || attr.label || da.attribute_id,
            category: 'DYNAMIC_ATTRIBUTE',
            groupId: group?.id || da.group_id,
            groupName: group?.name || 'Category Attributes',
            requested: valLabels,
            offered: valLabels,
            isDeviated: false,
            reason: '',
            options: valueOptions.length > 0 ? valueOptions : undefined,
          });
        }
      }
    });

    // 3. Other Manufacturing & Material Inputs
    (item.manufacturing_inputs || []).forEach((mInput) => {
      if (!['model_number', 'part_number', 'country_of_origin'].includes(mInput.field_id)) {
        list.push({
          key: `mfg-${mInput.field_id}`,
          name: mInput.field_name || mInput.field_id,
          category: 'MANUFACTURING_INPUT',
          requested: String(mInput.value),
          offered: String(mInput.value),
          isDeviated: false,
          reason: '',
        });
      }
    });

    return list;
  }, [item, allAttributes, allAttributeGroups, allAttributeValues, allBrands, allManufacturers, allCategories]);

  // Populate form state when item, party response, or selected round changes
  useEffect(() => {
    if (requestedAttributes.length > 0) {
      const initialSpecs: Record<string, AttributeResponseState> = {};

      requestedAttributes.forEach((attr) => {
        initialSpecs[attr.key] = { ...attr };
      });

      // Load specific revision round snapshot based on tab selection
      let roundToLoad = latestRound;
      if (selectedRoundTab !== 'LATEST' && selectedRoundTab.startsWith('ROUND_')) {
        const roundNum = parseInt(selectedRoundTab.replace('ROUND_', ''), 10);
        roundToLoad = revisionRounds.find((r) => r.round_number === roundNum) || latestRound;
      }

      if (roundToLoad && roundToLoad.supplier_response) {
        (roundToLoad.supplier_response || []).forEach((resp) => {
          if (initialSpecs[resp.attribute_key]) {
            initialSpecs[resp.attribute_key] = {
              ...initialSpecs[resp.attribute_key],
              offered: String(resp.offered_value),
              isDeviated: resp.is_deviated,
              reason: resp.deviation_reason || '',
              buyerStatus: resp.buyer_status,
              buyerComment: resp.buyer_comment,
              commentHistory: resp.comment_history,
            };
          }
        });
      }

      setOfferedSpecs(initialSpecs);

      if (response?.commercial_terms) {
        setCommercialTerms({
          offered_unit_price: response.commercial_terms.offered_unit_price || item?.target_unit_price || 1000,
          offered_quantity: response.awarded_quantity || item?.quantity || 60,
          lead_time_days: response.commercial_terms.lead_time_days || 5,
        });
      } else if (item) {
        setCommercialTerms({
          offered_unit_price: item.target_unit_price || 1000,
          offered_quantity: item.quantity || 1,
          lead_time_days: 5,
        });
      }
    }
  }, [requestedAttributes, response, item, selectedRoundTab, latestRound, revisionRounds]);

  if (!rfq || !item) {
    return <div className="p-12 text-center text-slate-500">Loading Sourcing Request...</div>;
  }

  const categoryObj = allCategories.find((c) => c.id === item.category_id);
  const masterProductObj = allMasterProducts.find((p) => p.id === item.catalog_product_id);

  const handleSubmitResponse = async () => {
    setSubmitting(true);
    try {
      const techResponses: TechnicalAttributeResponse[] = Object.values(offeredSpecs).map((spec) => ({
        attribute_key: spec.key,
        attribute_name: spec.name,
        requested_value: spec.requested,
        offered_value: spec.offered,
        is_deviated: spec.isDeviated,
        deviation_reason: spec.reason,
      }));

      const submitUserId = currentUserId || currentUser?.id || 'usr-3';
      const nextRoundNum = (revisionRounds.length || 0) + 1;

      if (response) {
        await rfqDb.itemSupplierResponses.update(response.id, {
          status: 'TECHNICAL_SUBMITTED',
          seller_party_id: response.seller_party_id || activePartyId,
          seller_party_name: response.seller_party_name || activePartyName,
          supplier_user_id: submitUserId,
          current_technical_round: nextRoundNum,
          technical_revision_rounds: [
            ...revisionRounds,
            {
              round_number: nextRoundNum,
              submitted_by_user_id: submitUserId,
              submitted_at: new Date().toISOString(),
              buyer_requirement_snapshot: techResponses,
              supplier_response: techResponses,
              round_status: 'PENDING',
            },
          ],
          commercial_terms: {
            offered_unit_price: commercialTerms.offered_unit_price,
            lead_time_days: commercialTerms.lead_time_days,
            moq: 1,
            payment_terms: 'Net 30 Days',
            freight_terms: 'FOB Destination',
            warranty_terms: '2 Years Factory Warranty',
            total_commercial_amount: commercialTerms.offered_unit_price * commercialTerms.offered_quantity,
          },
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new response record bound to current seller party
        const newResponseId = `isr-${rfq.id}-${item.id}-${activePartyId}`;
        await rfqDb.itemSupplierResponses.put({
          id: newResponseId,
          assignment_id: `sa-${rfq.id}-${item.id}`,
          rfq_id: rfq.id,
          rfq_item_id: item.id,
          seller_party_id: activePartyId,
          seller_party_name: activePartyName,
          supplier_user_id: submitUserId,
          status: 'TECHNICAL_SUBMITTED',
          current_technical_round: 1,
          technical_revision_rounds: [
            {
              round_number: 1,
              submitted_by_user_id: submitUserId,
              submitted_at: new Date().toISOString(),
              buyer_requirement_snapshot: techResponses,
              supplier_response: techResponses,
              round_status: 'PENDING',
            },
          ],
          commercial_terms: {
            offered_unit_price: commercialTerms.offered_unit_price,
            lead_time_days: commercialTerms.lead_time_days,
            moq: 1,
            payment_terms: 'Net 30 Days',
            freight_terms: 'FOB Destination',
            warranty_terms: '2 Years Factory Warranty',
            total_commercial_amount: commercialTerms.offered_unit_price * commercialTerms.offered_quantity,
          },
          product_mapping: null,
          commercial_negotiation_rounds: [],
          is_awarded: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
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
  const dynamicSpecs = Object.values(offeredSpecs).filter((s) => s.category === 'DYNAMIC_ATTRIBUTE');
  const groupedDynamicSpecs = dynamicSpecs.reduce((acc: Record<string, AttributeResponseState[]>, spec) => {
    const gName = spec.groupName || 'Category Attributes';
    if (!acc[gName]) acc[gName] = [];
    acc[gName].push(spec);
    return acc;
  }, {});

  const brandMfgSpecs = Object.values(offeredSpecs).filter((s) => s.category === 'BRAND_MANUFACTURER');
  const staticDimensionSpecs = Object.values(offeredSpecs).filter((s) => s.category === 'STATIC_DIMENSION');
  const mfgSpecs = Object.values(offeredSpecs).filter((s) => s.category === 'MANUFACTURING_INPUT');

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
                <ShopOutlined className="text-blue-600" /> Brand & Manufacturer Specification Response
              </h4>
              <div className="space-y-2">
                {brandMfgSpecs.map((spec) => (
                  <div key={spec.key} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-[180px]">
                        <span className="font-bold text-slate-800 text-xs">{spec.name}</span>
                        <div className="text-xs text-slate-500">Requested: <strong className="text-slate-900">{spec.requested}</strong></div>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-slate-600">Offered Value (Single Select)</label>
                          {spec.options && spec.options.length > 0 ? (
                            <Select
                              disabled={isInputDisabled}
                              size="small"
                              className="w-full"
                              placeholder="Select offered brand or manufacturer..."
                              value={spec.offered}
                              options={spec.options}
                              onChange={(val: string) => {
                                const isDev = val !== spec.requested;
                                setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: val, isDeviated: isDev } });
                              }}
                            />
                          ) : (
                            <Input
                              disabled={isInputDisabled}
                              size="small"
                              value={spec.offered}
                              onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: e.target.value } })}
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

                    {spec.buyerComment && (
                      <div className="mt-2 p-2 rounded border bg-red-50/90 border-red-200 text-red-900 text-xs space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <ExclamationCircleOutlined className="text-red-600" /> Buyer Revision Request Remark:
                        </div>
                        <div>{spec.buyerComment}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SECTION 3: STATIC SPECS & PHYSICAL DIMENSIONS */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 m-0">
              <ToolOutlined className="text-indigo-600" /> Static Specs & Physical Dimensions
            </h4>

            {staticDimensionSpecs.length > 0 && (
              <div className="space-y-2">
                {staticDimensionSpecs.map((spec) => (
                  <div key={spec.key} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-[180px]">
                        <span className="font-bold text-slate-800 text-xs">{spec.name}</span>
                        <div className="text-xs text-slate-500">Requested: <strong className="text-slate-900">{spec.requested}</strong></div>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-slate-600">Offered Value</label>
                          <Input
                            disabled={isInputDisabled}
                            size="small"
                            value={spec.offered}
                            onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: e.target.value } })}
                          />
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
                            placeholder="Variance reason..."
                            value={spec.reason}
                            onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, reason: e.target.value } })}
                            className="border-amber-300 bg-amber-50"
                          />
                        </div>
                      )}
                    </div>

                    {spec.buyerComment && (
                      <div className="mt-2 p-2 rounded border bg-red-50/90 border-red-200 text-red-900 text-xs space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <ExclamationCircleOutlined className="text-red-600" /> Buyer Revision Request Remark:
                        </div>
                        <div>{spec.buyerComment}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. SECTION 4: CATEGORY MAPPED DYNAMIC ATTRIBUTES */}
          {Object.keys(groupedDynamicSpecs).length > 0 && (
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
              <h4 className="font-bold text-purple-900 text-xs uppercase tracking-wider flex items-center gap-2 m-0">
                <Tag color="purple">Master Taxonomy</Tag> Category Mapped Dynamic Attributes
              </h4>

              {Object.entries(groupedDynamicSpecs).map(([groupName, specs]) => (
                <div key={groupName} className="p-3 bg-white rounded-lg border border-purple-100 shadow-sm space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-800 border-b border-purple-50 pb-1">
                    {groupName}
                  </div>
                  <div className="space-y-2">
                    {specs.map((spec) => (
                      <div key={spec.key} className="p-2.5 bg-purple-50/30 rounded border border-purple-100 flex flex-col justify-between gap-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="min-w-[180px]">
                            <span className="font-bold text-slate-800 text-xs">{spec.name}</span>
                            <div className="text-xs text-slate-600">
                              Requested: <strong className="text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded">{spec.requested}</strong>
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
                                  value={spec.offered ? spec.offered.split(', ').map((s) => s.trim()).filter(Boolean) : []}
                                  options={spec.options}
                                  onChange={(vals: string[]) => {
                                    const offeredStr = vals.join(', ');
                                    const isDev = offeredStr !== spec.requested;
                                    setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: offeredStr, isDeviated: isDev } });
                                  }}
                                />
                              ) : (
                                <Input
                                  disabled={isInputDisabled}
                                  size="small"
                                  value={spec.offered}
                                  onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: e.target.value } })}
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

                        {spec.buyerComment && (
                          <div className="mt-2 p-2 rounded border bg-red-50/90 border-red-200 text-red-900 text-xs space-y-0.5">
                            <div className="font-bold flex items-center gap-1.5">
                              <ExclamationCircleOutlined className="text-red-600" /> Buyer Revision Request Remark:
                            </div>
                            <div>{spec.buyerComment}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. SECTION 5: MANUFACTURING & MATERIAL INPUTS */}
          {mfgSpecs.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 m-0">
                <TagOutlined className="text-slate-600" /> Manufacturing & Material Inputs
              </h4>
              <div className="space-y-2">
                {mfgSpecs.map((spec) => (
                  <div key={spec.key} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-[180px]">
                        <span className="font-bold text-slate-800 text-xs">{spec.name}</span>
                        <div className="text-xs text-slate-500">Requested: <strong className="text-slate-900">{spec.requested}</strong></div>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-slate-600">Offered Value</label>
                          <Input
                            disabled={isInputDisabled}
                            size="small"
                            value={spec.offered}
                            onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, offered: e.target.value } })}
                          />
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
                            placeholder="Standard tolerance..."
                            value={spec.reason}
                            onChange={(e) => setOfferedSpecs({ ...offeredSpecs, [spec.key]: { ...spec, reason: e.target.value } })}
                            className="border-amber-300 bg-amber-50"
                          />
                        </div>
                      )}
                    </div>

                    {spec.buyerComment && (
                      <div className="mt-2 p-2 rounded border bg-red-50/90 border-red-200 text-red-900 text-xs space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <ExclamationCircleOutlined className="text-red-600" /> Buyer Revision Request Remark:
                        </div>
                        <div>{spec.buyerComment}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
