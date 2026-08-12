import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag, Button, Table, Breadcrumb } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge } from '../../components/rfq/RfqStatusBadge';

export const ItemDetailWorkspace: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const [activeTab, setActiveTab] = useState('attributes');

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

  const quotes = useLiveQuery(
    () => (itemId ? rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const itemAttributes = useLiveQuery(
    () => (itemId ? rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const attributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];

  if (!rfq || rfq.requester_id !== activePartyId || !item) {
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

  const detailsColumns = [
    { title: 'Attribute', dataIndex: 'label', key: 'label', width: 220, render: (text: string) => <span className="font-semibold text-slate-700">{text}</span> },
    { title: 'Value', dataIndex: 'value', key: 'value', render: (text: string) => <span className="text-slate-900">{text}</span> }
  ];

  const detailsData = [
    { key: '1', label: 'Item Name', value: item.product_name || 'Custom Requirements' },
    { key: '2', label: 'Category', value: categoryName },
    { key: '3', label: 'Required Quantity', value: `${item.quantity} ${item.unit}` },
    { key: '4', label: 'Target Unit Price', value: item.target_unit_price ? `$${item.target_unit_price}` : 'N/A' },
    { key: '5', label: 'Item Status', value: item.status }
  ];

  const attributesColumns = [
    {
      title: 'Group',
      dataIndex: 'group_id',
      key: 'group_id',
      width: 180,
      render: (groupId: string) => {
        const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'General';
        return <Tag color="indigo">{groupName}</Tag>;
      }
    },
    {
      title: 'Attribute',
      dataIndex: 'attribute_id',
      key: 'attribute_id',
      width: 200,
      render: (attrId: string) => {
        const attrName = attributes.find((a) => a.id === attrId)?.name || attrId;
        return <span className="font-bold text-slate-800">{attrName}</span>;
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Requested Values',
      dataIndex: 'values',
      key: 'values',
      render: (values: any[]) => (values || []).map((v) => v.value_label).join(', ') || 'N/A'
    }
  ];

  const quotesColumns = [
    {
      title: 'Quote Reference',
      dataIndex: 'seller_quote_number',
      key: 'seller_quote_number',
      render: (text: string) => <span className="font-bold text-slate-900">{text}</span>
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
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
          { title: <a onClick={() => navigate(`${basePath}/${rfq.id}`)}>{rfq.rfq_number}</a> },
          { title: item.product_name || 'Item Detail' }
        ]}
      />

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{item.product_name}</h1>
              <RfqItemStatusBadge status={item.status} />
            </div>
            <p className="text-slate-600 text-sm mt-1">Sourcing Line Item evaluation for container {rfq.rfq_number}.</p>
          </div>
        </div>
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
                  <AppstoreOutlined /> Requested Attributes ({itemAttributes.length})
                </span>
              ),
              children: (
                <div className="space-y-6">
                  <Table dataSource={detailsData} columns={detailsColumns} pagination={false} size="small" />
                  <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">Technical Specifications</h3>
                  <Table dataSource={itemAttributes} columns={attributesColumns} rowKey="id" pagination={false} size="small" />
                </div>
              )
            },
            {
              key: 'quotes',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <FileTextOutlined /> Supplier Quotes ({quotes.length})
                </span>
              ),
              children: <Table dataSource={quotes} columns={quotesColumns} rowKey="id" pagination={false} size="small" />
            }
          ]}
        />
      </Card>
    </div>
  );
};
