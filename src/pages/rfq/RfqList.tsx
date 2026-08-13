import React, { useState } from 'react';
import { Card, Table, Button, Input, Tabs, Tag } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, SearchOutlined, FolderOpenOutlined, ClockCircleOutlined, BankOutlined, UserOutlined } from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqStatusBadge } from './RfqStatusBadge';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const RfqList: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  // Live Query from Dexie businessDb indexed database store
  const allParties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  // Determine active party ID
  const activeParty = isBusinessContext
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || allParties[0]
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || allParties.find((p) => p.id === 'pty-6') || allParties[0];

  const activePartyId = activeParty?.id || 'pty-1';
  const activePartyName = activeParty?.display_name || 'Active Party';

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  // Live Query filtered strictly by active Party ID
  const partyRfqs = useLiveQuery(
    () => activePartyId ? rfqDb.rfqs.where('requester_id').equals(activePartyId).toArray() : [],
    [activePartyId]
  ) || [];

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">RFQ Sourcing</span> }
  ], []);
  useBreadcrumb(breadcrumbs);

  const filteredRfqs = partyRfqs.filter((r) => {
    const matchesTab = activeTab === 'ALL' || r.status === activeTab;
    const matchesSearch =
      r.rfq_number.toLowerCase().includes(searchText.toLowerCase()) ||
      r.title.toLowerCase().includes(searchText.toLowerCase()) ||
      r.requester_name.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const columns = [
    {
      title: 'RFQ Details',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{record.rfq_number}</span>
            <span className="text-slate-700 font-medium text-sm">• {text}</span>
          </div>
          {record.description && (
            <div className="text-xs text-slate-500 line-clamp-1">{record.description}</div>
          )}
          <div className="text-[11px] text-slate-400 mt-0.5">
            Requester: <span className="font-medium text-slate-600">{record.requester_name}</span> ({record.requester_party_id})
          </div>
        </div>
      ),
    },
    {
      title: 'Items & Budget',
      key: 'items_budget',
      width: 160,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-sm">
            ${(record.total_estimated_budget || 0).toLocaleString()}
          </div>
          <div>
            <Tag color="blue" className="font-semibold text-xs py-0 px-1.5">
              {record.total_items_count} Items
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Status & Deadline',
      key: 'status_deadline',
      width: 180,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div>
            <RfqStatusBadge status={record.status} />
          </div>
          <div className="text-xs text-slate-500">
            <ClockCircleOutlined className="mr-1 text-slate-400" />
            {new Date(record.submission_deadline).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'actions',
      width: 130,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`${basePath}/${record.id}`)}
          icon={<FolderOpenOutlined />}
          className="bg-blue-600 hover:bg-blue-700 font-medium text-xs"
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className=" max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">RFQ Sourcing Containers</h1>
          </div>
          <p className="text-xs text-slate-500">Party-centric sourcing view for {activePartyName}.</p>
        </div>
        <Button
          type="primary"
          onClick={() => navigate(`${basePath}/create`)}
          icon={<PlusOutlined />}
          className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm"
        >
          Create RFQ
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200" bodyStyle={{ padding: '12px 16px' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            items={[
              { key: 'ALL', label: `All (${partyRfqs.length})` },
              { key: 'DRAFT', label: 'Draft' },
              { key: 'ISSUED', label: 'Issued' },
              { key: 'IN_PROGRESS', label: 'In Progress' },
              { key: 'CLOSED', label: 'Closed' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ]}
          />

          <Input
            placeholder="Search RFQs..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-64"
            size="small"
            allowClear
          />
        </div>

        <Table
          dataSource={filteredRfqs}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
        />
      </Card>
    </div>
  );
};


