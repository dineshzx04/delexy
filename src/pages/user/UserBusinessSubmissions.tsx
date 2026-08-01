import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Card as AntCard, Tooltip as AntTooltip, Drawer as AntDrawer, Descriptions as AntDescriptions, Timeline as AntTimeline } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { businessDb, type BusinessSubmission } from '../../data/business';

const UserBusinessSubmissions: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useWorkspace();
  const [searchText, setSearchText] = useState('');

  // View Drawer State
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BusinessSubmission | null>(null);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/user/dashboard" className="text-slate-500 hover:text-sky-600">User Workspace</Link>, url: '/user/dashboard' },
    { title: <span className="text-slate-900 font-semibold">Business Applications & Submissions</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Submissions
  const submissions = useLiveQuery(() => businessDb.businessSubmissions.toArray()) || [];

  const userSubmissions = useMemo(() => {
    if (!currentUser) return [];
    return submissions
      .filter((sub: BusinessSubmission) => sub.user_id === currentUser.id)
      .filter((sub: BusinessSubmission) =>
        sub.business_name.toLowerCase().includes(searchText.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchText.toLowerCase()) ||
        sub.tax_id.toLowerCase().includes(searchText.toLowerCase())
      );
  }, [submissions, currentUser, searchText]);

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
      title: 'Business Operating Title',
      key: 'business_identity',
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
              Tax ID: <strong>{record.tax_id}</strong> • Country: <strong>{record.country_code}</strong>
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
          <div className="text-[11px] text-gray-500 mt-0.5 font-mono flex items-center gap-1">
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
      title: 'Submission Status & Round',
      key: 'status',
      width: 190,
      render: (_: any, record: BusinessSubmission) => (
        <div>
          <div className="flex items-center gap-1.5">
            <AntTag color={
              record.status === 'SUBMITTED' ? 'processing' :
              record.status === 'NEEDS_REVISION' ? 'error' :
              record.status === 'APPROVED' ? 'success' : 'default'
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
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: BusinessSubmission) => {
        const isEditable = record.status === 'NEEDS_REVISION';
        return (
          <div className="flex items-center gap-2">
            {/* View Button -> Opens Drawer */}
            <AntButton
              type="default"
              size="small"
              icon={<Lucide.Eye size={14} />}
              className="text-sky-700 hover:text-sky-800 border-sky-200 hover:border-sky-300 font-semibold"
              onClick={() => {
                setSelectedSubmission(record);
                setIsViewDrawerOpen(true);
              }}
            >
              View
            </AntButton>

            {/* Edit Button -> Redirects to Form */}
            {isEditable ? (
              <AntButton
                type="primary"
                size="small"
                icon={<Lucide.Edit3 size={14} />}
                className={record.status === 'NEEDS_REVISION' ? 'bg-red-600 hover:bg-red-700 font-bold' : 'bg-sky-600 hover:bg-sky-700 font-semibold'}
                onClick={() => navigate(`/user/business-submissions/edit/${record.id}`)}
              >
                {record.status === 'NEEDS_REVISION' ? `Revise R${record.current_round + 1}` : 'Edit'}
              </AntButton>
            ) : (
              <AntTooltip title={record.status === 'APPROVED' ? 'Application approved and activated' : 'Under platform compliance review'}>
                <AntButton
                  type="default"
                  size="small"
                  disabled
                  icon={<Lucide.Lock size={14} />}
                >
                  Edit
                </AntButton>
              </AntTooltip>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Registration Directory</h1>
          <p className="text-gray-500 text-sm">
            Track business tenant registration applications, 1:1 Party claim verification progress, and platform review status.
          </p>
        </div>
        <AntButton
          type="primary"
          icon={<Lucide.Plus size={16} />}
          size="large"
          className="bg-sky-600 hover:bg-sky-700 font-bold"
          onClick={() => navigate('/user/business-submissions/new')}
        >
          Register New Business
        </AntButton>
      </div>

      {/* Main Submissions Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <AntInput
            placeholder="Search business applications by name, ID, or tax ID..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-96"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <AntTable
          size="small"
          columns={columns}
          dataSource={userSubmissions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: 'No business registration applications found.' }}
        />
      </div>

      {/* Submission Details Read-Only Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Lucide.Building size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">
                {selectedSubmission?.business_name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Application #{selectedSubmission?.id} • Round {selectedSubmission?.current_round}
              </div>
            </div>
          </div>
        }
        width={620}
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        destroyOnClose
      >
        {selectedSubmission && (
          <div className="space-y-6">
            {/* Header Status Banner */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Application Status</span>
                <AntTag color={
                  selectedSubmission.status === 'SUBMITTED' ? 'processing' :
                  selectedSubmission.status === 'NEEDS_REVISION' ? 'error' :
                  selectedSubmission.status === 'APPROVED' ? 'success' : 'default'
                } className="text-xs font-bold mt-0.5">
                  {selectedSubmission.status.replace('_', ' ')}
                </AntTag>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block font-medium">Current Review Round</span>
                <AntTag color="purple" className="font-mono text-xs font-bold mt-0.5">
                  Round {selectedSubmission.current_round}
                </AntTag>
              </div>
            </div>

            {/* Revision Comment Alert if Needs Revision */}
            {selectedSubmission.status === 'NEEDS_REVISION' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-700">
                  <Lucide.AlertTriangle size={15} /> Platform Revision Instructions
                </div>
                <p className="mb-0 text-red-800">
                  Platform compliance requested corrections on your submission. Click <strong>"Revise Application"</strong> below to update rejected fields and resubmit in Round {selectedSubmission.current_round + 1}.
                </p>
              </div>
            )}

            {/* 1. Core Identifiers */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Building size={16} className="text-sky-600" />
                1. Business Identifiers & Tax Credentials
              </span>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block">Business Operating Name</span>
                  <span className="font-semibold text-gray-800">{selectedSubmission.business_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Legal Registered Name</span>
                  <span className="font-semibold text-gray-800">{selectedSubmission.legal_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Tax Identification Number</span>
                  <span className="font-mono font-bold text-gray-900">{selectedSubmission.tax_id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Registration License Number</span>
                  <span className="font-mono text-gray-800">{selectedSubmission.registration_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Registration Country</span>
                  <span className="font-semibold text-gray-800">{selectedSubmission.country_code}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Phone / Contact</span>
                  <span className="font-mono text-gray-800">{selectedSubmission.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 2. Corporate HQ Address */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.MapPin size={16} className="text-indigo-600" />
                2. Corporate Headquarters Address
              </span>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div className="font-medium text-gray-800">
                  {selectedSubmission.address.line1}
                  {selectedSubmission.address.line2 ? `, ${selectedSubmission.address.line2}` : ''}
                </div>
                <div className="text-gray-500">
                  {selectedSubmission.address.city}, {selectedSubmission.address.state_province} {selectedSubmission.address.postal_code} — <span className="font-semibold text-gray-700">{selectedSubmission.address.country_code}</span>
                </div>
              </div>
            </div>

            {/* 3. Target Business Party Claim Request */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Award size={16} className="text-amber-600" />
                3. Target Business Party Claim Request
              </span>
              <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-purple-700 font-semibold">Target Party to Claim</span>
                  {selectedSubmission.to_claim_party_id ? (
                    <AntTag color="blue" className="font-mono text-[10px]">Target ID: {selectedSubmission.to_claim_party_id}</AntTag>
                  ) : (
                    <AntTag color="purple" className="font-mono text-[10px]">New Business Party</AntTag>
                  )}
                </div>
                <span className="font-bold text-purple-950 text-sm block">{selectedSubmission.to_claim_party_name}</span>
                <span className="text-gray-500 block text-[11px] mt-1">
                  {selectedSubmission.to_claim_party_id
                    ? `Requests ownership transfer of existing placeholder party ID ${selectedSubmission.to_claim_party_id} upon platform approval.`
                    : 'Requests creation of a fresh 1:1 business party entity upon platform approval.'}
                </span>
              </div>
            </div>

            {/* 4. Attached Verification Proof Files */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.ShieldCheck size={16} className="text-purple-600" />
                4. Attached Verification Documents ({selectedSubmission.documents?.length || 0})
              </span>
              <div className="space-y-2">
                {selectedSubmission.documents?.map(doc => (
                  <div key={doc.id} className="bg-white border border-gray-200 rounded p-3 text-xs flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                        <Lucide.FileCheck size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <a href={doc.doc_url} target="_blank" rel="noreferrer" className="hover:underline text-indigo-600">
                            {doc.doc_name}
                          </a>
                          <AntTag color="purple" className="text-[10px] font-mono">{doc.doc_type.replace('_', ' ')}</AntTag>
                          {doc.status === 'APPROVED' && <AntTag color="success" className="text-[10px] font-mono">APPROVED</AntTag>}
                          {doc.status === 'REJECTED' && <AntTag color="error" className="text-[10px] font-mono">REJECTED</AntTag>}
                        </div>
                        {doc.rejection_comment && (
                          <div className="text-red-600 font-semibold text-[11px] mt-0.5">
                            <strong>Rejection Comment:</strong> {doc.rejection_comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Round Audit History Log */}
            <div className="space-y-3">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.History size={16} className="text-sky-600" />
                5. Round Audit History Log ({selectedSubmission.audit_history?.length || 0})
              </span>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <AntTimeline
                  items={selectedSubmission.audit_history?.map(aud => ({
                    color: aud.action === 'APPROVED' ? 'green' : aud.action === 'REQUESTED_REVISION' ? 'red' : 'blue',
                    children: (
                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">
                            Round {aud.round} — {aud.action.replace('_', ' ')}
                          </span>
                          <span className="text-gray-400 font-mono text-[10px]">
                            {new Date(aud.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          Actor: <strong>{aud.actor_name}</strong> ({aud.actor_id})
                        </div>
                        {aud.notes && (
                          <div className="text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                            "{aud.notes}"
                          </div>
                        )}
                      </div>
                    )
                  }))}
                />
              </div>
            </div>

            {/* Bottom Action Footer inside Drawer */}
            {selectedSubmission.status === 'NEEDS_REVISION' && (
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <AntButton
                  type="primary"
                  size="large"
                  icon={<Lucide.Edit3 size={16} />}
                  className="bg-red-600 hover:bg-red-700 font-bold"
                  onClick={() => {
                    setIsViewDrawerOpen(false);
                    navigate(`/user/business-submissions/edit/${selectedSubmission.id}`);
                  }}
                >
                  Revise Application (Round {selectedSubmission.current_round + 1})
                </AntButton>
              </div>
            )}
          </div>
        )}
      </AntDrawer>
    </div>
  );
};

export default UserBusinessSubmissions;
