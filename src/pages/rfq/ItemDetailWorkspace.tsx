import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag as AntTag, Button, Table, Descriptions, Grid as AntGrid } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge } from './RfqStatusBadge';
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">{itemProduct?.name || 'Sourcing Line Item'}</h1>
            <RfqItemStatusBadge status={item.status} />
            <AntTag color="blue" className="font-bold m-0 text-xs">{item.req_quantity} {item.req_unit}</AntTag>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            RFQ: <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span> &bull; Category: <strong className="text-slate-700">{categoryName}</strong>
          </p>
        </div>
      </div>

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
                  <FileTextOutlined /> Supplier Quotes ({quotesCount})
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
  const descriptionsLayout = screens.md ? 'horizontal' : 'vertical';

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
              className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
              style={{ backgroundColor: `${accentColor}14` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
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
            <div className="p-3">
              <Descriptions
                layout={descriptionsLayout}
                bordered
                size="small"
                column={{ xs: 1, sm: 1, md: 1 }}
                labelStyle={{
                  width: screens.md ? '35%' : '100%',
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
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 text-xs">{attrRow.attributeName}</span>
                        {attrRow.connector && attrRow.values?.length > 1 && (
                          <AntTag color="cyan" className="text-[10px] font-semibold w-max mt-0.5">
                            {attrRow.connector === 'AND' ? 'Match ALL (AND)' : 'Match ANY (OR)'}
                          </AntTag>
                        )}
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-800 text-xs font-medium">{attrRow.reqViewValue}</span>
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
      title: 'Quote Reference',
      dataIndex: 'seller_quote_number',
      key: 'seller_quote_number',
      render: (text: string, record: any) => (
        <span
          // onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/review`)}
          className="font-bold text-xs"
        >
          {text}
        </span>
      )
    },
    {
      title: 'Seller ID',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id',
      render: (sellerId: string) => {
        const p = parties.find((party) => party.id === sellerId);
        return <span className="text-xs text-slate-700 font-medium">{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Round',
      dataIndex: 'round',
      key: 'round',
      render: (val: number) => <AntTag color="blue" className="text-[10px] font-bold">Round #{val}</AntTag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <AntTag color={status === 'DEVIATION_ACCEPTED' ? 'success' : 'default'} className="text-[10px] font-semibold">
          {status}
        </AntTag>
      )
    },
    {
      title: 'Action',
      key: 'action',
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
      locale={{ emptyText: 'No sellers assigned to this RFQ item.' }}
    />
  );
};