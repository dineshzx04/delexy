import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Modal as AntModal, Form as AntForm, Select as AntSelect, Drawer as AntDrawer, Tabs as AntTabs, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type Business } from '../../data/user';
import { businessDb, type Manufacturer, type Party, type ManufacturerSubmission } from '../../data/business';

const PlatformManufacturers: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [form] = AntForm.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Revision Modal State
  const [revisionSub, setRevisionSub] = useState<ManufacturerSubmission | null>(null);
  const [revisionForm] = AntForm.useForm();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Organizations</span> },
    { title: <span className="text-gray-900 font-semibold">Manufacturers & Onboarding Audit</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables strictly from DB
  const manufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];
  const mfgSubmissions = useLiveQuery(() => businessDb.manufacturerSubmissions.toArray()) || [];

  // Enriched Manufacturer records
  const manufacturerData = useMemo(() => {
    return manufacturers.map((mfg: Manufacturer) => {
      const party = parties.find((p: Party) => p.id === mfg.manufacturer_party_id);
      const bus = party && party.owner_id ? businesses.find((b: Business) => b.id === party.owner_id) : null;

      return {
        ...mfg,
        party_name: party?.display_name || mfg.manufacturer_party_id,
        business_name: bus?.name || (party?.owner_type === 'USER' ? 'Individual User Account' : 'Unclaimed Corporate Placeholder'),
        legal_name: bus?.legal_name || bus?.name,
        country_code: bus?.country_code || 'GLOBAL'
      };
    }).filter(m =>
      m.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
      m.business_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (m.registration_number && m.registration_number.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [manufacturers, parties, businesses, searchText]);

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-gray-500 font-medium">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      )
    },
    {
      title: 'Manufacturer Company',
      key: 'company',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
            <Lucide.Factory size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{record.company_name}</div>
            <div className="text-[11px] text-gray-400 font-mono">Reg: {record.registration_number}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Corporate Party',
      key: 'party',
      render: (_: any, record: any) => (
        <div>
          <div className="font-semibold text-xs text-indigo-900 flex items-center gap-1">
            <Lucide.Building2 size={13} className="text-indigo-600 shrink-0" />
            {record.party_name}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">{record.manufacturer_party_id}</div>
        </div>
      )
    },
    {
      title: 'Claimed Business Entity',
      key: 'business',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
          <Lucide.Building size={14} className="text-sky-600 shrink-0" />
          {record.business_name}
          <AntTag color="blue" className="text-[10px] uppercase font-mono px-1 py-0">{record.country_code}</AntTag>
        </div>
      )
    },
    {
      title: 'Verification Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: string) => (
        <AntTag color={status === 'ACTIVE' ? 'success' : 'orange'} className="text-xs">
          {status}
        </AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 160,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <AntButton
            type="text"
            size="small"
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 flex items-center gap-1 font-medium"
            onClick={() => {
              setSelectedManufacturer(record);
              setIsDetailsDrawerOpen(true);
            }}
          >
            <Lucide.Eye size={14} /> View Details
          </AntButton>
          <AntButton
            type="text"
            size="small"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => {
              setEditingManufacturer(record);
              form.setFieldsValue({ status: record.status });
              setIsModalVisible(true);
            }}
          >
            Edit Status
          </AntButton>
        </div>
      ),
    },
  ];

  const handleSaveStatus = async (values: any) => {
    if (!editingManufacturer) return;
    await businessDb.manufacturers.update(editingManufacturer.id, {
      status: values.status,
      updated_at: new Date().toISOString()
    });
    antMessage.success('Manufacturer status updated successfully.');
    setIsModalVisible(false);
  };

  // Handle Platform Approval for Manufacturer Submissions
  const handleApproveMfgSubmission = async (sub: ManufacturerSubmission) => {
    let targetPartyId = sub.party_id;

    if (sub.submission_type === 'CLAIM_PARTY' && sub.target_party_id) {
      targetPartyId = sub.target_party_id;
      const party = parties.find((p) => p.id === targetPartyId);
      if (party) {
        await businessDb.parties.update(party.id, {
          is_claimed: true,
          is_verified: true,
          updated_at: new Date().toISOString(),
        });
      }
    }

    await businessDb.manufacturers.put({
      id: `mfg-${Date.now()}`,
      manufacturer_party_id: targetPartyId,
      company_name: sub.company_name,
      registration_number: sub.registration_number,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await businessDb.manufacturerSubmissions.update(sub.id, {
      status: 'APPROVED',
      updated_at: new Date().toISOString(),
    });

    antMessage.success(`Manufacturer submission ${sub.id} APPROVED! Manufacturer account registered in DB.`);
  };

  // Handle Request Revision
  const handleConfirmMfgRevision = async (values: { comments: string }) => {
    if (!revisionSub) return;

    await businessDb.manufacturerSubmissions.update(revisionSub.id, {
      status: 'NEEDS_REVISION',
      rejection_comments: values.comments,
      updated_at: new Date().toISOString(),
    });

    antMessage.warning(`Revision requested for Manufacturer submission ${revisionSub.id}. Feedback sent to Tenant Workbench.`);
    setRevisionSub(null);
    revisionForm.resetFields();
  };

  // Manufacturer Submission Table Columns
  const submissionColumns = [
    {
      title: 'Submission ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-mono text-xs font-semibold text-sky-700">{id}</span>
    },
    {
      title: 'Type',
      dataIndex: 'submission_type',
      key: 'submission_type',
      render: (type: string) => (
        <AntTag color={type === 'CLAIM_PARTY' ? 'blue' : 'cyan'} className="font-mono text-xs font-semibold">
          {type}
        </AntTag>
      )
    },
    {
      title: 'Company & Reg Number',
      key: 'company_info',
      render: (_: any, record: ManufacturerSubmission) => (
        <div>
          <div className="font-bold text-gray-900">{record.company_name}</div>
          <div className="text-xs text-gray-500 font-mono">Reg: {record.registration_number || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Submitting Party',
      dataIndex: 'party_id',
      key: 'party_id',
      render: (partyId: string) => {
        const party = parties.find((p) => p.id === partyId);
        return (
          <div>
            <div className="font-semibold text-gray-800 text-xs">{party?.display_name || partyId}</div>
            <div className="text-[11px] font-mono text-gray-400">{partyId}</div>
          </div>
        );
      }
    },
    {
      title: 'Round',
      dataIndex: 'current_round',
      key: 'current_round',
      render: (round: number) => <span className="font-semibold text-xs">Round {round}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <AntTag
          color={
            status === 'APPROVED'
              ? 'success'
              : status === 'NEEDS_REVISION'
              ? 'warning'
              : status === 'REJECTED'
              ? 'error'
              : 'processing'
          }
          className="font-bold text-xs"
        >
          {status}
        </AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ManufacturerSubmission) => (
        <div className="flex items-center gap-2">
          {record.status !== 'APPROVED' && (
            <>
              <AntButton
                type="text"
                size="small"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                onClick={() => handleApproveMfgSubmission(record)}
              >
                Approve
              </AntButton>
              <AntButton
                type="text"
                size="small"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium"
                onClick={() => {
                  setRevisionSub(record);
                  revisionForm.setFieldsValue({
                    comments: record.rejection_comments || 'Please provide official corporate registration document and confirm registration number.'
                  });
                }}
              >
                Request Revision
              </AntButton>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Manufacturer Management & Onboarding Audit</h1>
          <p className="text-gray-500">
            View registered corporate manufacturing units, party mappings, and audit onboarding submissions.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search manufacturers by company name, reg number, or business..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
                <span className="flex items-center gap-2">
                  <Lucide.Factory size={16} /> Manufacturer Directory ({manufacturerData.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={columns}
                  dataSource={manufacturerData}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    },
                    showSizeChanger: true
                  }}
                />
              )
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.GitPullRequest size={16} /> Manufacturer Submissions Review Queue ({mfgSubmissions.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={submissionColumns}
                  dataSource={mfgSubmissions}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )
            }
          ]}
        />
      </div>

      {/* Edit Status Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.Factory size={18} className="text-emerald-600" />
            Manage Manufacturer Status - {editingManufacturer?.company_name}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSaveStatus} className="mt-4">
          <AntForm.Item name="status" label="Verification Status" rules={[{ required: true }]}>
            <AntSelect
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'PENDING_VERIFICATION', label: 'PENDING VERIFICATION' },
              ]}
            />
          </AntForm.Item>
        </AntForm>
      </AntModal>

      {/* Manufacturer Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Lucide.Factory size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">
                {selectedManufacturer?.company_name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {selectedManufacturer?.id} • Reg: {selectedManufacturer?.registration_number}
              </div>
            </div>
          </div>
        }
        width={560}
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        destroyOnClose
      >
        {selectedManufacturer && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Manufacturer Overview</span>
                <AntTag color={selectedManufacturer.status === 'ACTIVE' ? 'success' : 'orange'}>
                  {selectedManufacturer.status}
                </AntTag>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block">Registration Number</span>
                  <span className="font-mono text-gray-800">{selectedManufacturer.registration_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Country Code</span>
                  <span className="font-bold text-indigo-700">{selectedManufacturer.country_code}</span>
                </div>
              </div>
            </div>

            {/* Corporate Party Mappings */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Building2 size={16} className="text-indigo-600" />
                Corporate Party & Business Mapping
              </span>
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 block">Manufacturer Party</span>
                  <span className="font-bold text-indigo-900">{selectedManufacturer.party_name} ({selectedManufacturer.manufacturer_party_id})</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Claimed Business Entity</span>
                  <span className="font-semibold text-gray-900">{selectedManufacturer.business_name} ({selectedManufacturer.legal_name})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AntDrawer>

      {/* Platform Request Revision Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-3">
            <Lucide.AlertTriangle className="text-amber-600" size={20} />
            <span>Request Revision for Manufacturer Submission {revisionSub?.id}</span>
          </div>
        }
        open={Boolean(revisionSub)}
        onCancel={() => setRevisionSub(null)}
        footer={null}
        destroyOnClose
      >
        <AntForm
          form={revisionForm}
          layout="vertical"
          onFinish={handleConfirmMfgRevision}
          className="pt-2 space-y-4"
        >
          <div className="text-xs text-gray-600 bg-amber-50 p-3 rounded border border-amber-200">
            Enter auditor comments outlining required changes for Manufacturer <strong>"{revisionSub?.company_name}"</strong>. This will set the submission status to <code className="text-amber-700 font-bold">NEEDS_REVISION</code> and notify the Tenant Business.
          </div>

          <AntForm.Item
            name="comments"
            label="Auditor Revision Feedback & Instructions"
            rules={[{ required: true, message: 'Auditor comments are required' }]}
          >
            <AntInput.TextArea rows={4} placeholder="Specify missing documentation or required registration number corrections..." />
          </AntForm.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <AntButton onClick={() => setRevisionSub(null)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-amber-600 hover:bg-amber-700">
              Send Revision Feedback
            </AntButton>
          </div>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default PlatformManufacturers;
