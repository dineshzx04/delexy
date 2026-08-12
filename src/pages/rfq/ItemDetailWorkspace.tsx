import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag, Button, Table, Breadcrumb, Descriptions } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge } from '../../components/rfq/RfqStatusBadge';

interface TabProps {
  itemId: string;
}

// ============================================================================
// MAIN CONTAINER COMPONENT: ItemDetailWorkspace
// ============================================================================
export const ItemDetailWorkspace: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const [activeTab, setActiveTab] = useState('attributes');

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  console.log(parties)
  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);

  const quotesCount = useLiveQuery(
    () => (itemId ? rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).count() : 0),
    [itemId]
  ) || 0;

  const itemAttributesCount = useLiveQuery(
    () => (itemId ? rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).count() : 0),
    [itemId]
  ) || 0;

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const catalogProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];

  if (!rfq || rfq.requester_id !== activePartyId || !item || !itemId) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">RFQ Item Container Not Found</h2>
        <Button className="mt-4" onClick={() => navigate(basePath)}>
          Back to RFQs List
        </Button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === item.category_id)?.name || 'Unknown';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
          { title: <a onClick={() => navigate(`${basePath}/${rfq.id}`)}>{rfq.rfq_number}</a> },
          { title: item.product_name || 'Item Detail' }
        ]}
      />

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{item.product_name}</h1>
              <RfqItemStatusBadge status={item.status} />
            </div>
            <p className="text-slate-600 text-sm mt-1">Sourcing Line Item evaluation for container {rfq.rfq_number}.</p>
          </div>
        </div>

        <Descriptions title="Requested Item Details" bordered size="small" column={2} className="mb-2">
          <Descriptions.Item label="Product / Service" span={2}>
            <strong className="text-slate-800">{item.product_name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Category">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <Tag color="blue" className="font-bold">{item.quantity} {item.unit}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Target Unit Price">
            {item.target_unit_price ? <span className="text-emerald-600 font-bold">${item.target_unit_price}</span> : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Item Source">
            <Tag>{item.item_source || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Catalog Product">
            {item.catalog_product_id
              ? catalogProducts.find((p) => p.id === item.catalog_product_id)?.name || item.catalog_product_id
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Number">
            <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'attributes',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <AppstoreOutlined /> Requested Attributes ({itemAttributesCount})
                </span>
              ),
              children: <RequestedAttributesTab itemId={itemId} />
            },

            {
              key: 'quotes',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <FileTextOutlined /> Supplier Quotes ({quotesCount})
                </span>
              ),
              children: <SupplierQuotesTab itemId={itemId} />
            },

            {
              key: 'sellers',
              label: (
                <span className="font-bold flex items-center gap-2">
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
// SUB-COMPONENT 1: Requested Attributes Tab (General preferences + custom specs)
// ============================================================================
const RequestedAttributesTab: React.FC<TabProps> = ({ itemId }) => {
  const item = useLiveQuery(() => rfqDb.rfq_items.get(itemId), [itemId]);
  const itemAttributes = useLiveQuery(
    () => rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
    [itemId]
  ) || [];

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const attributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const catalogBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const catalogManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  const attributeGroupsMap = React.useMemo(() => {
    const map: Record<string, { name: string; items: typeof itemAttributes }> = {};
    const customAttributes = itemAttributes.filter((ia) => ia.attribute_type !== 'SYSTEM');
    customAttributes.forEach((ia) => {
      const groupId = ia.group_id || 'ungrouped';
      if (!map[groupId]) {
        const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'General Specifications';
        map[groupId] = { name: groupName, items: [] };
      }
      map[groupId].items.push(ia);
    });
    return Object.entries(map);
  }, [itemAttributes, attributeGroups]);

  const getBrandNames = (ids: string[] | null | undefined): string => {
    if (!ids || ids.length === 0) return 'Any Brand';
    return ids.map((id) => catalogBrands.find((b) => b.id === id)?.name || id).join(', ');
  };

  const getManufacturerNames = (ids: string[] | null | undefined): string => {
    if (!ids || ids.length === 0) return 'Any Manufacturer';
    return ids.map((id) => catalogManufacturers.find((m) => m.id === id)?.company_name || id).join(', ');
  };

  if (!item) return null;

  const generalPreferencesData = [
    {
      key: 'brand',
      specification: 'Brand Preference',
      buyerAsked: getBrandNames(item.brand_id)
    },
    {
      key: 'manufacturer',
      specification: 'Manufacturer Preference',
      buyerAsked: getManufacturerNames(item.manufacturer_id)
    },
    {
      key: 'unit_price',
      specification: 'Target Unit Price ($)',
      buyerAsked: item.target_unit_price ? `$${item.target_unit_price}` : 'N/A'
    }
  ];

  const attributesColumns = [
    {
      title: 'Specification / Attribute',
      dataIndex: 'specification',
      key: 'specification',
      width: 320,
      render: (text: string, record: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 leading-tight">{text}</span>
          {record.description && (
            <span className="text-xs text-slate-400 leading-tight italic">{record.description}</span>
          )}
        </div>
      )
    },
    {
      title: 'Requested / Required Value',
      dataIndex: 'buyerAsked',
      key: 'buyerAsked',
      render: (text: string) => <span className="text-slate-600 font-medium">{text}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-slate-900 pt-3">Sourcing Configuration</h3>

      {/* 1. General Sourcing Preferences Card */}
      <div
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        style={{ borderLeft: `4px solid #2563eb` }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
          style={{ backgroundColor: `#2563eb14` }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-blue-600">
              1
            </span>
            <h4 className="text-md font-bold text-slate-800">General Sourcing Preferences</h4>
          </div>
          <Tag color="default" style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}>
            {generalPreferencesData.length} attributes
          </Tag>
        </div>
        <div className="p-3">
          <Table
            dataSource={generalPreferencesData}
            columns={attributesColumns}
            pagination={false}
            size="small"
            bordered
          />
        </div>
      </div>

      {/* 2. Custom Specifications (Groups) */}
      {attributeGroupsMap.map(([groupId, group], idx) => {
        const groupRows = group.items.map((ia) => {
          const attrName = attributes.find((a) => a.id === ia.attribute_id)?.name || ia.attribute_id;
          const requestedVals = (ia.values || []).map((v) => v.value_label).join(', ') || 'N/A';

          return {
            key: ia.id,
            specification: attrName,
            description: ia.description || null,
            buyerAsked: requestedVals
          };
        });

        const accentColor = ['#10b981', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'][idx % 5];

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
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {idx + 2}
                </span>
                <h4 className="text-md font-bold text-slate-800">{group.name}</h4>
              </div>
              <Tag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                {groupRows.length} attributes
              </Tag>
            </div>
            <div className="p-3">
              <Table
                dataSource={groupRows}
                columns={attributesColumns}
                pagination={false}
                size="small"
                bordered
              />
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
    () => rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).toArray(),
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
        <a
          onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/review`)}
          className="font-bold text-blue-600 hover:text-blue-800"
        >
          {text}
        </a>
      )
    },
    {
      title: 'Seller ID',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id',
      render: (sellerId: string) => {
        const p = parties.find((party) => party.id === sellerId);
        return <span>{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Offered Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (val: number) => <span className="font-bold text-emerald-600">${val}</span>
    },
    {
      title: 'Round',
      dataIndex: 'round',
      key: 'round',
      render: (val: number) => <Tag color="blue">Round #{val}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'ACCEPTED' ? 'success' : 'default'}>{status}</Tag>
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
        return <span className="font-bold text-slate-800">{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Party ID',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id_raw',
      render: (sellerId: string) => <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600">{sellerId}</code>
    },
    {
      title: 'Invitation Mode',
      dataIndex: 'assignment_type',
      key: 'assignment_type',
      render: (type: string) => (
        <Tag color={type === 'DIRECT_INVITATION' ? 'blue' : 'orange'}>
          {type === 'DIRECT_INVITATION' ? 'Direct Invitation' : 'Public Marketplace'}
        </Tag>
      )
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      render: (date: string) => <span className="text-slate-600 text-sm">{new Date(date).toLocaleString()}</span>
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