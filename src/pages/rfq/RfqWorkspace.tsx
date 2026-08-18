import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag as AntTag, Button, Table } from 'antd';
import {
  AppstoreOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqStatusBadge, RfqItemStatusBadge } from './RfqStatusBadge';

import { catalogDb } from '../../data/catalog/catalog.db';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const RfqWorkspace: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const [activeTab, setActiveTab] = useState('items');

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const items = useLiveQuery(() => (rfqId ? rfqDb.rfq_items.where('rfq_id').equals(rfqId).toArray() : []), [rfqId]) || [];
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
    { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number ? `${rfq.rfq_number}` : 'RFQ Workspace'}</span> }
  ], [navigate, basePath, rfq?.rfq_number, rfq?.title]);
  useBreadcrumb(breadcrumbs);

  if (!rfq || rfq.requester_id !== activePartyId) {
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
      title: 'S.No.',
      dataIndex: 'item_index',
      key: 'item_index',
      width: 60,
      render: (val: number) => <span className="font-bold text-slate-500">{val}</span>,
    },
    {
      title: 'Item Title & Category',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: any) => {
        const catName = categories.find((c) => c.id === record.category_id)?.name;
        return (
          <div>
            <div className="font-bold text-slate-900">{text}</div>
            <div className="text-xs text-slate-500">Category: <AntTag color="purple">{catName}</AntTag></div>
          </div>
        );
      },
    },
    {
      title: 'Req.Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 160,
      render: (val: number, record: any) => (
        <span className="font-semibold text-slate-800">{val} {record.unit}</span>
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
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-700 flex items-center">
                <AntTag color={"processing"} className='mr-2'>{rfq.rfq_number}</AntTag>
                <span>{rfq.title}</span>
              <RfqStatusBadge status={rfq.status} />
              </h1>
            </div>
            <p className="text-slate-600 text-sm mt-1">{rfq.description}</p>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
              <div>Requester: <strong className="text-slate-800">{rfq.requester_name}</strong></div>
              <div>Deadline: <strong className="text-slate-800">{new Date(rfq.submission_deadline).toLocaleDateString()}</strong></div>
              {/* <div>Total Estimated Budget: <strong className="text-emerald-600 text-sm font-bold">${(rfq.total_estimated_budget || 0).toLocaleString()}</strong></div> */}
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
          ]}
        />
      </Card>
    </div>
  );
};

