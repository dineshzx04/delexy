import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag, Button, Table, Timeline, Breadcrumb } from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  HistoryOutlined,
  TrophyOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqStatusBadge, RfqItemStatusBadge } from '../../components/rfq/RfqStatusBadge';

export const RfqWorkspace: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const [activeTab, setActiveTab] = useState('items');

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const items = useLiveQuery(() => (rfqId ? rfqDb.rfqItems.where('rfq_id').equals(rfqId).toArray() : []), [rfqId]) || [];
  const responses = useLiveQuery(() => (rfqId ? rfqDb.itemSupplierResponses.where('rfq_id').equals(rfqId).toArray() : []), [rfqId]) || [];

  if (!rfq) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">RFQ Container Not Found</h2>
        <Button className="mt-4" onClick={() => navigate(basePath)}>
          Back to RFQs List
        </Button>
      </div>
    );
  }

  const itemColumns = [
    {
      title: '#',
      dataIndex: 'item_index',
      key: 'item_index',
      width: 60,
      render: (val: number) => <span className="font-bold text-slate-500">#{val}</span>,
    },
    {
      title: 'Item Title & Category',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold text-slate-900 text-base">{text}</div>
          <div className="text-xs text-slate-500">Category: <Tag color="purple">{record.category_id}</Tag></div>
        </div>
      ),
    },
    {
      title: 'Quantity Requested',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 160,
      render: (val: number, record: any) => (
        <span className="font-semibold text-slate-800">{val} {record.unit_of_measure}</span>
      ),
    },
    {
      title: 'Target Price',
      dataIndex: 'target_unit_price',
      key: 'target_unit_price',
      width: 140,
      render: (val: number) => <span className="font-bold text-emerald-600">${val || 0}</span>,
    },
    {
      title: 'Item Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: any) => <RfqItemStatusBadge status={status} />,
    },
    {
      title: 'Action',
      key: 'action',
      width: 160,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          onClick={() => navigate(`${basePath}/${rfqId}/items/${record.id}`)}
          icon={<FolderOpenOutlined />}
          className="bg-blue-600 font-semibold"
        >
          Manage Item
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
          { title: rfq.rfq_number },
        ]}
      />

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{rfq.rfq_number} - {rfq.title}</h1>
              <RfqStatusBadge status={rfq.status} />
            </div>
            <p className="text-slate-600 text-sm mt-1">{rfq.description}</p>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
              <div>Requester: <strong className="text-slate-800">{rfq.requester_name}</strong></div>
              <div>Deadline: <strong className="text-slate-800">{new Date(rfq.submission_deadline).toLocaleDateString()}</strong></div>
              <div>Total Estimated Budget: <strong className="text-emerald-600 text-sm font-bold">${(rfq.total_estimated_budget || 0).toLocaleString()}</strong></div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'items',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <AppstoreOutlined /> Sourcing Items ({items.length})
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Table dataSource={items} columns={itemColumns} rowKey="id" pagination={false} />
                </div>
              ),
            },
            {
              key: 'suppliers',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <TeamOutlined /> Assigned Suppliers ({responses.length})
                </span>
              ),
              children: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {responses.map((resp) => (
                    <Card key={resp.id} className="border-slate-200 shadow-sm bg-slate-50">
                      <div className="font-bold text-slate-900 text-base">{resp.seller_party_name}</div>
                      <div className="text-xs text-slate-500 mt-1">Status: <Tag color="blue">{resp.status}</Tag></div>
                      <div className="text-xs text-slate-600 mt-2">
                        Mapped Product: <span className="font-semibold">{resp.product_mapping?.seller_product_id ?? 'sprod-1'}</span> ({resp.product_mapping?.variant_id ?? 'v1'})
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              key: 'timeline',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <HistoryOutlined /> Audit Timeline
                </span>
              ),
              children: (
                <Timeline
                  items={(rfq.timeline || []).map((t) => ({
                    children: (
                      <div>
                        <div className="font-bold text-slate-800">{t.event_type} - {t.actor_name}</div>
                        <div className="text-xs text-slate-500">{t.remarks}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(t.timestamp).toLocaleString()}</div>
                      </div>
                    ),
                  }))}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
