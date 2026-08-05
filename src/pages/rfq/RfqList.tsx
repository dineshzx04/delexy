import React, { useState } from 'react';
import { Card, Table, Button, Input, Tabs, Tag } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, SearchOutlined, FolderOpenOutlined, ClockCircleOutlined, BankOutlined, UserOutlined } from '@ant-design/icons';
import { rfqDb, type RfqStatus } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqStatusBadge } from '../../components/rfq/RfqStatusBadge';

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
    () => rfqDb.rfqs.where('requester_party_id').equals(activePartyId).toArray(),
    [activePartyId]
  ) || [];
  console.log(activePartyId)
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
      title: 'RFQ Number & Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold text-slate-900 text-base">{record.rfq_number} - {text}</div>
          <div className="text-xs text-slate-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Requester Party',
      dataIndex: 'requester_name',
      key: 'requester_name',
      width: 240,
      render: (text: string, record: any) => (
        <div>
          <span className="font-semibold text-slate-800">{text}</span>
          <div className="text-[10px] text-slate-400 font-mono">Party ID: {record.requester_party_id}</div>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'total_items_count',
      key: 'total_items_count',
      width: 100,
      render: (val: number) => <Tag color="blue" className="font-bold">{val} Items</Tag>,
    },
    {
      title: 'Budget',
      dataIndex: 'total_estimated_budget',
      key: 'total_estimated_budget',
      width: 150,
      render: (val: number) => <span className="font-bold text-slate-900">${(val || 0).toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: RfqStatus) => <RfqStatusBadge status={status} />,
    },
    {
      title: 'Deadline',
      dataIndex: 'submission_deadline',
      key: 'submission_deadline',
      width: 150,
      render: (date: string) => (
        <span className="text-xs text-slate-600 font-medium">
          <ClockCircleOutlined className="mr-1" />
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          onClick={() => navigate(`${basePath}/${record.id}`)}
          icon={<FolderOpenOutlined />}
          className="bg-blue-600 hover:bg-blue-700 font-semibold"
        >
          Open Workspace
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">RFQ Sourcing Containers</h1>
            <Tag color={isBusinessContext ? 'purple' : 'cyan'} icon={isBusinessContext ? <BankOutlined /> : <UserOutlined />} className="px-2.5 py-0.5 font-bold">
              Party: {activePartyName} ({activePartyId})
            </Tag>
          </div>
          <p className="text-sm text-slate-500">Party-centric sourcing view showing procurement requests created by active party {activePartyName}.</p>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate(`${basePath}/create`)}
          icon={<PlusOutlined />}
          className="bg-blue-600 hover:bg-blue-700 h-11 px-5 font-bold shadow-md"
        >
          Create RFQ Container
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'ALL', label: `All RFQs (${partyRfqs.length})` },
              { key: 'ISSUED', label: 'Issued' },
              { key: 'UNDER_EVALUATION', label: 'Under Evaluation' },
              { key: 'PARTIALLY_AWARDED', label: 'Partially Awarded' },
              { key: 'FULLY_AWARDED', label: 'Fully Awarded' },
              { key: 'CLOSED', label: 'Closed' },
            ]}
          />

          <Input
            placeholder="Search by RFQ #, title, party..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-72"
            allowClear
          />
        </div>

        <Table dataSource={filteredRfqs} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
};
