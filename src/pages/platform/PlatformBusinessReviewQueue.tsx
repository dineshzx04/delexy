import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Tabs as AntTabs, Card as AntCard } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { businessDb, type BusinessSubmission } from '../../data/business';

const PlatformBusinessReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600">Platform Admin</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Governance & Verification</span> },
    { title: <span className="text-gray-900 font-semibold">Business Reviews</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Submissions
  const submissions = useLiveQuery(() => businessDb.businessSubmissions.toArray()) || [];
  console.log(submissions)
  const queueActionNeeded = useMemo(() => submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW'), [submissions]);
  const queueNeedsRevision = useMemo(() => submissions.filter(s => s.status === 'NEEDS_REVISION'), [submissions]);
  const queueApproved = useMemo(() => submissions.filter(s => s.status === 'APPROVED'), [submissions]);

  const filteredData = useMemo(() => {
    let list = submissions;
    if (activeTab === '1') list = queueActionNeeded;
    if (activeTab === '2') list = queueNeedsRevision;
    if (activeTab === '3') list = queueApproved;

    return list.filter(sub =>
      sub.business_name.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.tax_id.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.to_claim_party_name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [submissions, activeTab, queueActionNeeded, queueNeedsRevision, queueApproved, searchText]);

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-gray-500 font-medium">{index + 1}</span>
      )
    },
    {
      title: 'Business Identity & Tax ID',
      key: 'identity',
      render: (_: any, record: BusinessSubmission) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            <Lucide.Building size={18} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              {record.business_name}
              <span className="font-mono text-xs text-sky-600 font-normal">({record.id})</span>
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              Tax ID: <strong>{record.tax_id}</strong> • Legal Name: {record.legal_name}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Target Party to Claim',
      key: 'to_claim_party',
      render: (_: any, record: BusinessSubmission) => (
        <div>
          <div className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
            <Lucide.Award size={13} className="text-purple-600 shrink-0" />
            <span>{record.to_claim_party_name}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
            {record.to_claim_party_id ? (
              <span className="text-sky-700 bg-sky-50 px-1 rounded font-semibold">Target ID: {record.to_claim_party_id}</span>
            ) : (
              <span>New Business Party</span>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Verification Docs',
      key: 'documents',
      width: 140,
      render: (_: any, record: BusinessSubmission) => (
        <AntTag color="purple" className="text-xs font-mono font-bold">
          {record.documents ? record.documents.length : 0} Document(s)
        </AntTag>
      )
    },
    {
      title: 'Audit Status & Round',
      key: 'status',
      width: 180,
      render: (_: any, record: BusinessSubmission) => (
        <div>
          <div className="flex items-center gap-1.5">
            <AntTag color={
              record.status === 'SUBMITTED' ? 'processing' :
              record.status === 'NEEDS_REVISION' ? 'error' :
              record.status === 'APPROVED' ? 'success' : 'cyan'
            } className="text-xs font-bold">
              {record.status.replace('_', ' ')}
            </AntTag>
            <AntTag color="purple" className="text-[10px] font-mono font-semibold">
              Round {record.current_round}
            </AntTag>
          </div>
          <div className="text-[11px] text-gray-400 font-mono mt-1">
            Submitted: {record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Action',
      key: 'actions',
      width: 130,
      render: (_: any, record: BusinessSubmission) => (
        <AntButton
          type="primary"
          size="small"
          icon={<Lucide.ShieldCheck size={14} />}
          className="bg-sky-600 hover:bg-sky-700 font-semibold text-xs"
          onClick={() => navigate(`/p/business-reviews/${record.id}`)}
        >
          Audit Review
        </AntButton>
      )
    }
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Compliance & Verification Queue</h1>
        <p className="text-gray-500 text-sm">
          Platform governance workbench: audit business registrations, verify tax credentials & legal documents, manage 1:1 Party claims, and approve enterprise workspace creation.
        </p>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AntCard className="border border-sky-200 bg-sky-50/50 shadow-sm">
          <div className="text-xs text-sky-700 font-semibold uppercase">Pending Action Queue</div>
          <div className="text-2xl font-bold text-sky-900 mt-1">{queueActionNeeded.length}</div>
        </AntCard>
        <AntCard className="border border-red-200 bg-red-50/50 shadow-sm">
          <div className="text-xs text-red-700 font-semibold uppercase">Awaiting Seller Revision</div>
          <div className="text-2xl font-bold text-red-900 mt-1">{queueNeedsRevision.length}</div>
        </AntCard>
        <AntCard className="border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <div className="text-xs text-emerald-700 font-semibold uppercase">Approved & Activated Tenants</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{queueApproved.length}</div>
        </AntCard>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <AntInput
            placeholder="Search queue by business name, ID, tax ID, or party title..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-96"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <AntTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-4"
          items={[
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2 font-bold">
                  <Lucide.Clock size={16} className="text-sky-600" /> Pending Review ({queueActionNeeded.length})
                </span>
              )
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2 font-bold">
                  <Lucide.AlertCircle size={16} className="text-red-600" /> Needs Revision ({queueNeedsRevision.length})
                </span>
              )
            },
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2 font-bold">
                  <Lucide.CheckCircle2 size={16} className="text-emerald-600" /> Approved Applications ({queueApproved.length})
                </span>
              )
            }
          ]}
        />

        <AntTable
          size="small"
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: 'No business submissions found in this queue tab.' }}
        />
      </div>
    </div>
  );
};

export default PlatformBusinessReviewQueue;
