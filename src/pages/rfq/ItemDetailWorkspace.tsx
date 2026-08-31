import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag as AntTag, Button, Table, Descriptions, Grid as AntGrid } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge, RFQQuoteStatusBadge } from './RfqStatusBadge';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

interface TabProps {
  itemId: string;
}

// ============================================================================
// MAIN CONTAINER COMPONENT: ItemDetailWorkspace
// ============================================================================
export const ItemDetailWorkspace: React.FC = () => {
  const navigate = useNavigate();

  const screens = AntGrid.useBreakpoint();
  const descriptionsLayout = screens.md ? 'horizontal' : 'vertical';
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const [activeTab, setActiveTab] = useState('quotes');

  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  const itemProduct = useLiveQuery(() => (item?.catalog_product_id ? catalogDb.products.get(item.catalog_product_id) : undefined), [item]);
  const quotesCount = useLiveQuery(
    () => (itemId ? rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).filter((q) => q.status !== 'NOT_SUBMITTED').count() : 0),
    [itemId]
  ) || 0;

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfq?.id}`)}>{rfq?.rfq_number || 'RFQ Details'}</a> },
    { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'Item Details'}-item-{item?.item_index}</span> }
  ], [basePath, rfq?.id, rfq?.rfq_number, item?.item_index, navigate]);

  useBreadcrumb(breadcrumbs);

  if (!rfq || rfq.requester_id !== activePartyId || !item || !itemId) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-lg font-bold text-slate-800">RFQ Item Container Not Found</h2>
        <Button size="small" className="mt-3" onClick={() => navigate(basePath)}>
          Back to RFQs List
        </Button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === item.category_id)?.name || 'Unknown';

  return (
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Professional Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">Sourcing Line Item Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Manage requested attributes, assigned suppliers, quotation offers, and contract awards for this line item.
          </p>
        </div>
      </div>

      {/* Sourcing Item Details */}
      <Descriptions
        title={<span className="text-sm font-bold text-slate-800">Sourcing Item Details</span>}
        bordered
        size="small"
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        labelStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }}
        contentStyle={{ fontSize: '12px', color: '#1e293b' }}
        className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200"
        classNames={{ header: "mb-0", title: "p-2" }}
      >
        <Descriptions.Item label="Buyer" span={2}>
          <span className="font-semibold text-slate-800 text-xs">{rfq.requester_name}</span>
        </Descriptions.Item>
        <Descriptions.Item label="RFQ Number">
          <span className="font-mono font-bold text-slate-700 text-xs">{rfq.rfq_number}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Item Status">
          <RfqItemStatusBadge status={item.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Product / Service">
          <span className="font-semibold text-slate-900 text-xs">{itemProduct?.name || 'Custom Specifications'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <span className="text-slate-700 text-xs">{categoryName}</span>
        </Descriptions.Item>
        <Descriptions.Item label="SKU">
          {item?.variant_id ? (
            <AntTag color="purple" className="font-mono font-semibold m-0 text-xs">{item.variant_id}</AntTag>
          ) : (
            <AntTag color="orange" className="font-semibold m-0 text-xs">Custom Product</AntTag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Requested Quantity">
          <AntTag color="blue" className="font-bold m-0 text-xs">{item.req_quantity} {item.req_unit || 'pcs'}</AntTag>
        </Descriptions.Item>
      </Descriptions>

      {/* Tabs Container */}
      <Card size="small" className="shadow-sm border-slate-200">
        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'quotes',
              label: (
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <FileTextOutlined /> Seller Quotes ({quotesCount})
                </span>
              ),
              children: <SupplierQuotesTab itemId={itemId} />
            },
            {
              key: 'attributes',
              label: (
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <AppstoreOutlined /> Requested Attributes
                </span>
              ),
              children: <RequestedAttributesTab itemId={itemId} />
            },
            {
              key: 'sellers',
              label: (
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <TeamOutlined /> Assigned Sellers ({(item.seller_assignments || []).length})
                </span>
              ),
              children: <AssignedSellersTab itemId={itemId} />
            },
            {
              key: 'comparisons',
              label: (
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <BarChartOutlined /> Submitted Quote Comparisons ({quotesCount})
                </span>
              ),
              children: <SubmittedQuoteComparisonsTab itemId={itemId} />
            }
          ]}
        />
      </Card>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT 1: Requested Attributes Tab
// ============================================================================
const RequestedAttributesTab: React.FC<TabProps> = ({ itemId }) => {
  const item = useLiveQuery(() => rfqDb.rfq_items.get(itemId), [itemId]);
  const itemAttributes = useLiveQuery(
    () => rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
    [itemId]
  ) || [];

  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const attributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const attributesValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];

  const attributeGroupsMap = React.useMemo(() => {
    if (!item || !itemAttributes?.length) return [];
    const groups = new Map((attributeGroups || []).map(g => [g.id, g.name]));
    const attrs = new Map((attributes || []).map(a => [a.id, a.name]));

    const names: Record<string, string> = {
      mfg_brand_mapping: "Manufacturer & Brand",
    };

    const map = new Map<string, any>();

    itemAttributes.forEach((ia: any) => {
      // Exclude obsolete system attributes
      if (ia.attribute_type === "SYSTEM" && ia.attribute_id !== "mfg_brand_mapping") {
        return;
      }

      const groupId = ia.group_id;
      let values: any[] = [];

      if (ia.attribute_id === 'mfg_brand_mapping') {
        values = (ia.values || []).map((v: any) => ({
          value_id: v.value_id,
          value_label: v.value_label,
        }));
      } else {
        const ids = new Set((ia.values || []).map((v: any) => v.value_id));
        values = (attributesValues || [])
          .filter(v => ids.has(v.id))
          .map(v => ({ value_id: v.id, value_label: v.value || v.label }));
      }

      if (!map.has(groupId)) {
        map.set(groupId, {
          name: groupId === "system" ? "System Specifications" : groups.get(groupId) || "General Specifications",
          attributes: [],
        });
      }

      let reqViewValue = "N/A";
      if (ia.attribute_type === "SYSTEM" && ia.attribute_id === "mfg_brand_mapping") {
        reqViewValue = values.map((v: any) => v.value_label).join(" | ") || "N/A";
      } else {
        const joiner = ia.connector === "AND" ? ", " : ia.connector === "OR" ? " | " : ", ";
        reqViewValue = values.map((v: any) => v.value_label).join(joiner) || "N/A";
      }

      map.get(groupId).attributes.push({
        key: `${groupId}_${ia.attribute_id}`,
        attribute_type: ia.attribute_type,
        group_id: groupId,
        attribute_id: ia.attribute_id,
        attributeName: names[ia.attribute_id] || attrs.get(ia.attribute_id) || ia.attribute_id,
        description: ia.description || '',
        connector: ia.connector || 'OR',
        values,
        reqViewValue,
      });
    });

    const sortedEntries = [...map.entries()].sort(([groupIdA], [groupIdB]) => {
      if (groupIdA === 'system') return -1;
      if (groupIdB === 'system') return 1;
      return 0;
    });

    return sortedEntries;
  }, [item, itemAttributes, attributeGroups, attributes, attributesValues]);

  const screens = AntGrid.useBreakpoint();
  const isMobile = !screens.md;

  if (!item) return null;

  return (
    <div className="space-y-3">
      {attributeGroupsMap.map(([groupId, group], idx) => {
        const groupRows = group.attributes;
        const accentColor = ['#2a79ad', '#10b981', '#f59e0b', '#8b5cf6'][idx % 4];

        return (
          <div
            key={groupId}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            style={{ borderLeft: `4px solid ${accentColor}` }}
          >
            <div
              className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3"
              style={{ backgroundColor: `${accentColor}14` }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {idx + 1}
                </span>
                <h4 className="text-xs font-semibold text-slate-800 m-0">{group.name}</h4>
              </div>
              <AntTag color="default" className="text-[10px] font-bold m-0" style={{ borderColor: accentColor, color: accentColor }}>
                {groupRows.length} attributes
              </AntTag>
            </div>
            <div className="p-2 sm:p-3">
              <Descriptions
                layout={isMobile ? 'vertical' : 'horizontal'}
                bordered
                size="small"
                column={1}
                labelStyle={{
                  width: isMobile ? undefined : '30%',
                  backgroundColor: '#f8fafc',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#475569',
                }}
                contentStyle={{ backgroundColor: '#ffffff' }}
              >
                {groupRows.map((attrRow: any) => (
                  <Descriptions.Item
                    key={attrRow.key}
                    label={
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-slate-800 text-xs">{attrRow.attributeName}</span>
                        {attrRow.connector && attrRow.values?.length > 1 && (
                          <AntTag color="cyan" className="text-[10px] font-semibold m-0">
                            {attrRow.connector === 'AND' ? 'Match ALL (AND)' : 'Match ANY (OR)'}
                          </AntTag>
                        )}
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-800 text-xs font-medium break-words">{attrRow.reqViewValue}</span>
                      {attrRow.description && (
                        <span className="text-[11px] text-slate-500 italic">Note: {attrRow.description}</span>
                      )}
                    </div>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT 2: Supplier Quotes Tab
// ============================================================================
const SupplierQuotesTab: React.FC<TabProps> = ({ itemId }) => {
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const quotes = useLiveQuery(
    () =>
      rfqDb.seller_quotes
        .where('rfq_item_id')
        .equals(itemId)
        .filter(quote => quote.status !== 'NOT_SUBMITTED')
        .toArray(),
    [itemId]
  ) || [];

  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const quotesColumns = [
    {
      title: 'S.No.',
      key: 'sno',
      className: 'w-14 min-w-[50px] text-center',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-semibold text-xs text-slate-500">{index + 1}</span>
      )
    },
    {
      title: 'Quote Reference',
      dataIndex: 'seller_quote_number',
      key: 'seller_quote_number',
      className: 'w-36 md:w-54 min-w-[120px]',
      render: (text: string) => (
        <span className="font-mono font-bold text-xs text-indigo-700">
          {text}
        </span>
      )
    },
    {
      title: 'Seller',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id',
      className: 'min-w-[160px]',
      render: (sellerId: string) => {
        const p = parties.find((party) => party.id === sellerId);
        return <span className="text-xs text-slate-800 font-semibold">{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Round',
      dataIndex: 'round',
      key: 'round',
      className: 'w-24 min-w-[90px]',
      render: (val: number) => <AntTag color="blue" className="text-[10px] font-bold m-0">Round #{val}</AntTag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      className: 'w-32 md:w-36 min-w-[130px]',
      render: (status: any) => <RFQQuoteStatusBadge status={status} />
    },
    {
      title: 'Action',
      key: 'action',
      className: 'w-32 min-w-[120px] text-right',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="primary"
          ghost
          className="text-xs"
          onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/review`)}
        >
          Review Quote
        </Button>
      )
    }
  ];

  return (
    <Table
      dataSource={quotes}
      columns={quotesColumns}
      rowKey="id"
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: 'No quotes received yet for this item.' }}
    />
  );
};

// ============================================================================
// SUB-COMPONENT 3: Assigned Sellers Tab
// ============================================================================
const AssignedSellersTab: React.FC<TabProps> = ({ itemId }) => {
  const item = useLiveQuery(() => rfqDb.rfq_items.get(itemId), [itemId]);
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const assignmentsColumns = [
    {
      title: 'Seller Party',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id',
      render: (sellerId: string) => {
        const p = parties.find((party) => party.id === sellerId);
        return <span className="font-semibold text-xs text-slate-800">{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Party ID',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id_raw',
      render: (sellerId: string) => <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{sellerId}</code>
    },
    {
      title: 'Invitation Mode',
      dataIndex: 'assignment_type',
      key: 'assignment_type',
      render: (type: string) => (
        <AntTag color={type === 'DIRECT_INVITATION' ? 'blue' : 'orange'} className="text-[10px] font-bold">
          {type === 'DIRECT_INVITATION' ? 'Direct Invitation' : 'Public Marketplace'}
        </AntTag>
      )
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      render: (date: string) => <span className="text-slate-600 text-xs">{new Date(date).toLocaleString()}</span>
    }
  ];

  if (!item) return null;

  return (
    <Table
      dataSource={item.seller_assignments || []}
      columns={assignmentsColumns}
      rowKey="id"
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: 'No sellers assigned to this RFQ item.' }}
    />
  );
};

// ============================================================================
// SUB-COMPONENT 4: Submitted Quote Comparisons Tab
// ============================================================================
const SubmittedQuoteComparisonsTab: React.FC<TabProps> = ({ itemId }) => {
  const screens = AntGrid.useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const { rfqId } = useParams<{ rfqId: string }>();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const item = useLiveQuery(() => rfqDb.rfq_items.get(itemId), [itemId]);
  const itemAttributes = useLiveQuery(
    () => rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
    [itemId]
  ) || [];

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const catalogAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];

  const submittedQuotes = useLiveQuery(
    () =>
      rfqDb.seller_quotes
        .where('rfq_item_id')
        .equals(itemId)
        .filter((q) => q.status !== 'NOT_SUBMITTED')
        .toArray(),
    [itemId]
  ) || [];

  const submittedQuoteIds = React.useMemo(() => submittedQuotes.map((q) => q.id), [submittedQuotes]);

  const allQuoteAttributes = useLiveQuery(
    async () => {
      if (submittedQuoteIds.length === 0) return [];
      return await rfqDb.seller_quote_attributes.where('seller_quote_id').anyOf(submittedQuoteIds).toArray();
    },
    [submittedQuoteIds]
  ) || [];

  const allQuoteVariants = useLiveQuery(
    async () => {
      if (submittedQuoteIds.length === 0) return [];
      return await rfqDb.seller_quote_variants.where('seller_quote_id').anyOf(submittedQuoteIds).toArray();
    },
    [submittedQuoteIds]
  ) || [];

  const allQuoteSuggestedVariants = useLiveQuery(
    async () => {
      if (submittedQuoteIds.length === 0) return [];
      return await rfqDb.seller_quote_suggested_variants.where('seller_quote_id').anyOf(submittedQuoteIds).toArray();
    },
    [submittedQuoteIds]
  ) || [];

  // Build offered items across all submitted quotes
  const selectedOfferedItems = React.useMemo(() => {
    if (!submittedQuotes.length) return [];
    const items: any[] = [];

    submittedQuotes.forEach((quote) => {
      const party = parties.find((p) => p.id === quote.seller_party_id);
      const supplierName = party?.display_name || quote.seller_party_id;

      // Custom Quote Variants
      const customVars = allQuoteVariants.filter((v) => v.seller_quote_id === quote.id);
      customVars.forEach((v, idx) => {
        let label = '';
        // if (v.combinations && v.combinations.length > 0) {
        //   label = v.combinations.map((c: any) => c.value_label || c.value_id).join(' / ');
        // } else {
        //   label = `Custom Option ${idx + 1}`;
        // }

        items.push({
          id: v.id,
          quoteId: quote.id,
          sellerQuoteNumber: quote.seller_quote_number,
          supplierName,
          title: label,
          type: 'CUSTOM',
          offer_price: v.offer_price,
          product_attributes: v.product_attributes || v.combinations || [],
          status: quote.status,
          buyer_accepted: v.buyer_accepted,
        });
      });

      // Suggested Catalog Variants
      const suggestedVars = allQuoteSuggestedVariants.filter((v) => v.seller_quote_id === quote.id);
      suggestedVars.forEach((v) => {
        let label = v.sku || `Suggested SKU (${v.variant_id})`;
        // if (v.combinations && v.combinations.length > 0) {
        //   const comboLabel = v.combinations.map((c: any) => c.value_label || c.value_id).join(' / ');
        //   label = `${v.sku ? v.sku + ' - ' : ''}${comboLabel}`;
        // }

        items.push({
          id: v.id,
          quoteId: quote.id,
          sellerQuoteNumber: quote.seller_quote_number,
          supplierName,
          title: label,
          type: 'SUGGESTED',
          offer_price: v.offer_price,
          list_price: v.list_price,
          // product_attributes: v.product_attributes || v.combinations || [],
          status: quote.status,
          buyer_accepted: v.buyer_accepted,
        });
      });
    });

    return items;
  }, [submittedQuotes, parties, allQuoteVariants, allQuoteSuggestedVariants]);

  // Map proposal attributes by quote ID using Map object (keyed by unique group_id + attribute_id)
  const proposalAttributesMap = React.useMemo(() => {
    const map = new Map<string, Map<string, any>>();
    submittedQuotes.forEach((q) => {
      const qAttrs = allQuoteAttributes.filter((a) => a.seller_quote_id === q.id);
      const propAttrs = new Map<string, any>();
      qAttrs.forEach((qa) => {
        const uniqueKey = `${qa.group_id}_${qa.attribute_id}`;
        propAttrs.set(uniqueKey, qa);
        propAttrs.set(qa.attribute_id, qa);
      });
      map.set(q.id, propAttrs);
    });
    return map;
  }, [submittedQuotes, allQuoteAttributes]);

  // Build matrix rows for Ant Design Table with rowSpan merging (System Specs first)
  const matrixRows = React.useMemo(() => {
    if (!itemAttributes?.length) return [];

    const rowMap = new Map<string, { groupId: string; groupName: string; attrId: string; attrName: string; reqDisplayValue: string }[]>();

    itemAttributes.forEach((ia: any) => {
      const groupId = ia.group_id || 'general';
      const groupName = groupId === 'system' ? 'System Specifications' : (attributeGroups.find((g) => g.id === groupId)?.name || 'General Specifications');

      const attrName = ia.attribute_id === 'mfg_brand_mapping'
        ? 'Manufacturer & Brand'
        : (catalogAttributes.find((a) => a.id === ia.attribute_id)?.name || ia.attribute_id);

      let reqDisplayValue = 'N/A';
      if (ia.attribute_id === 'mfg_brand_mapping') {
        reqDisplayValue = (ia.values || []).map((v: any) => v.value_label || v.value_id).join(' | ') || 'N/A';
      } else {
        const reqValIds = new Set((ia.values || []).map((v: any) => v.value_id));
        const reqValLabels = (catalogAttributeValues || [])
          .filter((v) => reqValIds.has(v.id))
          .map((v) => v.value || v.label);
        const joiner = ia.connector === 'AND' ? ', ' : ' | ';
        reqDisplayValue = reqValLabels.length > 0 ? reqValLabels.join(joiner) : (ia.values || []).map((v: any) => v.value_label || v.value_id).join(joiner) || 'N/A';
      }

      if (!rowMap.has(groupId)) {
        rowMap.set(groupId, []);
      }
      rowMap.get(groupId)!.push({
        groupId,
        groupName,
        attrId: ia.attribute_id,
        attrName,
        reqDisplayValue,
      });
    });

    // Sort group entries so 'system' group comes first
    const sortedEntries = [...rowMap.entries()].sort(([gIdA], [gIdB]) => {
      if (gIdA === 'system') return -1;
      if (gIdB === 'system') return 1;
      return 0;
    });

    const rows: any[] = [];
    sortedEntries.forEach(([gId, attrs]) => {
      attrs.forEach((attr, idx) => {
        rows.push({
          key: `${gId}_${attr.attrId}`,
          groupId: gId,
          groupName: attr.groupName,
          attrId: attr.attrId,
          attrName: attr.attrName,
          reqDisplayValue: attr.reqDisplayValue,
          groupRowSpan: idx === 0 ? attrs.length : 0,
        });
      });
    });

    return rows;
  }, [itemAttributes, attributeGroups, catalogAttributes, catalogAttributeValues]);

  if (submittedQuotes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h3 className="text-sm font-bold text-slate-700 m-0">No Submitted Quotes to Compare</h3>
        <p className="text-xs text-slate-400 mt-1">When suppliers submit quote proposals for this line item, their offered options will be compared side-by-side here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 m-0">Submitted Quote Options Matrix ({selectedOfferedItems.length} offered options)</h3>
          <p className="text-xs text-slate-500 mt-0.5 m-0">Side-by-side comparison matrix of all supplier proposals for this line item.</p>
        </div>
      </div>

      <Table
        dataSource={matrixRows}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: 'Attribute Group',
            dataIndex: 'groupName',
            key: 'groupName',
            fixed: isMobile ? undefined : 'left',
            className: 'align-top bg-slate-50 font-bold text-slate-700 text-xs w-32 md:w-36 min-w-[120px]',
            onCell: (record: any) => ({
              rowSpan: record.groupRowSpan,
            }),
            render: (text: string) => (
              <span className="font-bold text-slate-800 text-xs">{text}</span>
            )
          },
          {
            title: 'Attribute Name',
            dataIndex: 'attrName',
            key: 'attrName',
            fixed: isMobile ? undefined : 'left',
            className: 'align-top font-semibold text-slate-700 text-xs bg-white w-36 md:w-44 min-w-[130px]',
            render: (text: string) => (
              <span className="font-semibold text-slate-700 text-xs">{text}</span>
            )
          },
          {
            title: 'Requested Specifications',
            dataIndex: 'reqDisplayValue',
            key: 'reqDisplayValue',
            fixed: isMobile ? undefined : 'left',
            className: 'align-top text-xs bg-blue-50 font-medium text-slate-900 w-40 md:w-48 min-w-[150px]',
            render: (text: string) => (
              <span className="font-medium text-slate-900 text-xs">{text}</span>
            )
          },
          ...selectedOfferedItems.map((colItem) => ({
            title: (
              <div className="flex flex-col items-center gap-0.5 py-1 min-w-[150px]">
                <div className="flex flex-col items-center gap-0.5 text-xs">
                  <span className="font-semibold text-slate-800">{colItem.supplierName}</span>
                  <span className="font-mono text-indigo-700 font-semibold text-[11px]">({colItem.sellerQuoteNumber})</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-emerald-700 text-xs">${colItem.offer_price?.toLocaleString()}</span>
                  <Link
                    to={`${basePath}/${rfqId}/items/${itemId}/quotes/${colItem.quoteId}/review`}
                    className="text-[11px] p-0 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Review &rarr;
                  </Link>
                </div>
              </div>
            ),
            key: colItem.id,
            className: 'align-top text-xs w-40 md:w-48 min-w-[150px]',
            render: (_: any, record: any) => {
              const matchedAttr = (colItem.product_attributes || []).find((pa: any) => pa.attribute_id === record.attrId);
              const uniqueKey = `${record.groupId}_${record.attrId}`;
              const propAttr = proposalAttributesMap.get(colItem.quoteId)?.get(uniqueKey) || proposalAttributesMap.get(colItem.quoteId)?.get(record.attrId);

              const values = matchedAttr ? [matchedAttr] : (propAttr?.values || []);
              if (!values || values.length === 0) {
                return <span className="text-slate-400 italic font-normal">N/A</span>;
              }

              if (record.attrId === 'mfg_brand_mapping') {
                const valObj = values[0];
                const valId = valObj?.value_id || valObj?.id || '';
                if (!valId) return <span className="text-slate-400 italic font-normal">N/A</span>;

                const parts = valId.split(':');
                const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                const brand = (allBrands || []).find((b: any) => b.id === brandId);
                const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Mfg');
                const brandName = brand?.name || (brandId ? brandId : 'Any Brand');

                return (
                  <AntTag color="purple" className="text-[11px] m-0">
                    Mfg: {mfgName} × Brand: {brandName}
                  </AntTag>
                );
              }

              const connector = propAttr?.connector || 'AND';
              const propJoiner = connector === 'OR' ? ' | ' : ', ';

              return (
                <div className="flex flex-wrap items-center">
                  {values.map((v: any, vIdx: number) => {
                    const valId = v.value_id || v.id;
                    const valObj = catalogAttributeValues?.find((cv: any) => cv.id === valId);
                    const valLabel = valObj?.label
                      || valObj?.value
                      || v.value_label
                      || v.label
                      || v.value
                      || valId;
                    const isLast = vIdx === values.length - 1;

                    return (
                      <span key={vIdx} className="inline-flex items-center my-0.5">
                        <AntTag color="blue" className="text-[11px] m-0 font-medium">
                          {valLabel}
                        </AntTag>
                        {!isLast && (
                          <span className="mx-0.5 text-emerald-600 font-bold text-[12px] select-none">
                            {propJoiner}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              );
            }
          }))
        ]}
      />
    </div>
  );
};