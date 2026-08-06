import React from 'react';
import { Card, Row, Col, Table, Button, Tag, Statistic } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  SyncOutlined,
  TrophyOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { mockParties } from '../../data/business/parties';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqStatusBadge } from '../../components/rfq/RfqStatusBadge';

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  // Active party resolution
  const activeParty = isBusinessContext
    ? mockParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || mockParties[0]
    : mockParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || mockParties.find((p) => p.id === 'pty-6') || mockParties[0];

  const activePartyId = activeParty.id;

  // Party-centric live queries
  const partyRfqs = useLiveQuery(
    () => rfqDb.rfqs.where('requester_party_id').equals(activePartyId).toArray(),
    [activePartyId]
  ) || [];

  const responses = useLiveQuery(() => rfqDb.sellerQuote.toArray(), []) || [];
  const awards = useLiveQuery(() => rfqDb.rfqAwards.toArray(), []) || [];

  const activeRfqs = partyRfqs.filter((r) => r.status === 'ISSUED' || r.status === 'UNDER_EVALUATION' || r.status === 'IN_PROGRESS');
  const totalAwardedAmount = awards.reduce(
    (acc, a) => acc + ((a.awardedQuantity || 0) * (a.unitPrice || 0) || a.awarded_total_amount || 0),
    0
  );
  const pendingReviewsCount = responses.filter((r) => r.status === 'SUBMITTED').length;

  const columns = [
    {
      title: 'RFQ Number & Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold text-slate-900">{record.rfq_number} - {text}</div>
          <div className="text-xs text-slate-500">Requester: {record.requester_name} ({record.requester_party_id})</div>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'total_items_count',
      key: 'total_items_count',
      width: 90,
      render: (val: number) => <Tag color="blue">{val} Items</Tag>,
    },
    {
      title: 'Estimated Budget',
      dataIndex: 'total_estimated_budget',
      key: 'total_estimated_budget',
      width: 160,
      render: (val: number) => <span className="font-bold text-slate-800">${(val || 0).toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: any) => <RfqStatusBadge status={status} />,
    },
    {
      title: 'Deadline',
      dataIndex: 'submission_deadline',
      key: 'submission_deadline',
      width: 140,
      render: (date: string) => (
        <span className="text-xs text-slate-600 font-medium">
          <ClockCircleOutlined className="mr-1" />
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 130,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          ghost
          size="small"
          onClick={() => navigate(`${basePath}/${record.id}`)}
          icon={<ArrowRightOutlined />}
        >
          Open Workspace
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Enterprise Sourcing Portal
            </span>
            <Tag color="purple" icon={isBusinessContext ? <BankOutlined /> : <UserOutlined />} className="px-2 py-0.5 font-bold">
              Party: {activeParty.display_name} ({activePartyId})
            </Tag>
          </div>
          <h1 className="text-2xl font-black text-white">Strategic Procurement Dashboard</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Managing party-based RFQs, technical evaluation rounds, product mapping, and multi-supplier split order awards for {activeParty.display_name}.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate(`${basePath}/create`)}
          icon={<PlusOutlined />}
          className="bg-emerald-500 hover:bg-emerald-600 h-12 px-6 font-bold text-base shadow-lg border-0"
        >
          Create New RFQ
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <Statistic title="Party RFQs" value={partyRfqs.length} prefix={<FileTextOutlined className="mr-2 text-blue-500" />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <Statistic title="Active Sourcing" value={activeRfqs.length} valueStyle={{ color: '#4f46e5' }} prefix={<SyncOutlined spin className="mr-2 text-indigo-500" />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <Statistic title="Pending Tech Reviews" value={pendingReviewsCount} valueStyle={{ color: '#d97706' }} prefix={<SafetyCertificateOutlined className="mr-2 text-amber-500" />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <Statistic title="Total Awarded" value={totalAwardedAmount} prefix="$" valueStyle={{ color: '#059669' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-lg">Active Sourcing Containers ({activeParty.display_name})</span>
            <Button type="link" onClick={() => navigate(basePath)}>
              View All RFQs →
            </Button>
          </div>
        }
        className="shadow-sm border-slate-200"
      >
        <Table dataSource={partyRfqs} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>
    </div>
  );
};
