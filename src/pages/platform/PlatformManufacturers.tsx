import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Modal as AntModal, Form as AntForm, Select as AntSelect, message as antMessage, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type Business } from '../../data/user';
import { businessDb, type Manufacturer, type Party } from '../../data/business';

const PlatformManufacturers: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [form] = AntForm.useForm();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Organizations</span> },
    { title: <span className="text-gray-900 font-semibold">Manufacturers</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const manufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];

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

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Manufacturer Directory</h1>
          <p className="text-gray-500">
            View registered corporate manufacturing units, party mappings, and verification status.
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
          <div className="text-xs text-gray-500">
            Total {manufacturerData.length} Registered Manufacturers
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={manufacturerData}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
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
            <AntSelect>
              <AntSelect.Option value="ACTIVE">ACTIVE</AntSelect.Option>
              <AntSelect.Option value="PENDING_VERIFICATION">PENDING VERIFICATION</AntSelect.Option>
            </AntSelect>
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
    </div>
  );
};

export default PlatformManufacturers;
