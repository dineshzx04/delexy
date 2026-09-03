import React, { useState } from 'react';
import { Card, Table, Button, Input, Select, Tag as AntTag } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, SearchOutlined, FolderOpenOutlined, ClockCircleOutlined } from '@ant-design/icons';
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

  // const breadcrumbs = React.useMemo(() => [
  //   { title: <span className="text-slate-800 font-semibold">RFQ Sourcing</span> }
  // ], []);
  // useBreadcrumb(breadcrumbs);

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
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-slate-900 text-xs">{record.rfq_number}</span>
            <span className="text-slate-800 font-semibold text-xs">• {text}</span>
          </div>
          {record.description && (
            <div className="text-[11px] text-slate-500 truncate max-w-lg">{record.description}</div>
          )}
          <div className="text-[11px] text-slate-400">
            Requester: <span className="font-medium text-slate-600">{record.requester_name}</span> ({record.requester_party_id})
          </div>
        </div>
      ),
    },
    {
      title: 'Status & Deadline',
      key: 'status_deadline',
      width: 170,
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-1">
          <div>
            <RfqStatusBadge status={record.status} />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ClockCircleOutlined className="text-slate-400" />
            {new Date(record.submission_deadline).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'actions',
      width: 110,
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
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Professional Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">RFQ Sourcing Management</h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Manage and track purchase request packages, supplier invitations, and quotation responses.
          </p>
        </div>

        <Button
          type="primary"
          onClick={() => navigate(`${basePath}/create`)}
          icon={<PlusOutlined />}
          className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm text-xs px-3 h-8 rounded-lg flex items-center"
        >
          Create RFQ
        </Button>
      </div>

      {/* Main Content Card */}
      <Card size="small" className="shadow-sm border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
            <Select
              value={activeTab}
              onChange={setActiveTab}
              size="small"
              className="w-48"
              options={[
                { value: 'ALL', label: `All Statuses (${partyRfqs.length})` },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ISSUED', label: 'Issued' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'CLOSED', label: 'Closed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <Input
            placeholder="Search RFQs..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-56"
            size="small"
            allowClear
          />
        </div>

        <Table
          dataSource={filteredRfqs}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 600 }}
          pagination={{ pageSize: 10, size: 'small' }}
        />
      </Card>
    </div>
  );
};
