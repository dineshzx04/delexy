import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Modal as AntModal, Form as AntForm, Select as AntSelect, Card as AntCard, Tooltip as AntTooltip, Drawer as AntDrawer, Avatar as AntAvatar, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type Business } from '../../data/user';
import { businessDb, type Brand, type BrandParty, type Party } from '../../data/business';

const PlatformBrands: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const [searchText, setSearchText] = useState('');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = AntForm.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Product Information</span> },
    { title: <span className="text-gray-900 font-semibold">Brands</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const brands = useLiveQuery(() => businessDb.brands.toArray()) || [];
  const brandParties = useLiveQuery(() => businessDb.brandParties.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];

  // Enriched Brand records with co-claimants
  const brandData = useMemo(() => {
    return brands.map((brd: Brand) => {
      const claimRecords = brandParties.filter((bp: BrandParty) => bp.brand_id === brd.id);
      
      const coClaimants = claimRecords.map((bp: BrandParty) => {
        const party = parties.find((p: Party) => p.id === bp.party_id);
        const bus = party && party.owner_id ? businesses.find((b: Business) => b.id === party.owner_id) : null;
        return {
          brand_party_id: bp.id,
          party_id: bp.party_id,
          party_name: party?.display_name || bp.party_id,
          business_name: bus?.name || (party?.owner_type === 'USER' ? 'Individual User' : 'Unclaimed Placeholder'),
          country_code: bus?.country_code || 'GLOBAL',
          claim_status: bp.claim_status,
          is_verified: party?.is_verified || false
        };
      });

      return {
        ...brd,
        coClaimants,
        claimCount: coClaimants.length
      };
    }).filter(b => 
      b.name.toLowerCase().includes(searchText.toLowerCase()) || 
      b.slug.toLowerCase().includes(searchText.toLowerCase()) ||
      b.coClaimants.some(c => c.business_name.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [brands, brandParties, parties, businesses, searchText]);

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
      title: 'Brand Entity',
      key: 'brand',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2.5">
          <AntAvatar src={record.logo_url} icon={<Lucide.Award size={16} />} className="bg-sky-600 border border-gray-200 shrink-0" />
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
              {record.name}
              {record.is_verified && (
                <AntTooltip title="Platform Verified Brand">
                  <Lucide.BadgeCheck size={14} className="text-sky-600 inline" />
                </AntTooltip>
              )}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">slug: {record.slug}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Co-Claimants',
      dataIndex: 'claimCount',
      key: 'claimCount',
      width: 140,
      render: (count: number) => (
        <AntTag color="purple" className="font-medium text-xs">
          <Lucide.Users size={12} className="inline mr-1" /> {count} Parties
        </AntTag>
      )
    },
    {
      title: 'Verification',
      dataIndex: 'is_verified',
      key: 'is_verified',
      width: 130,
      render: (verified: boolean) => (
        <AntTag color={verified ? 'cyan' : 'orange'} className="text-xs">
          {verified ? 'VERIFIED' : 'UNVERIFIED'}
        </AntTag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (active: boolean) => (
        <AntTag color={active ? 'success' : 'default'} className="text-xs">
          {active ? 'ACTIVE' : 'INACTIVE'}
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
              setSelectedBrand(record);
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
              setEditingBrand(record);
              form.setFieldsValue({
                is_verified: record.is_verified,
                is_active: record.is_active
              });
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
    if (!editingBrand) return;
    await businessDb.brands.update(editingBrand.id, {
      is_verified: values.is_verified,
      is_active: values.is_active,
      updated_at: new Date().toISOString()
    });
    antMessage.success('Brand status updated successfully.');
    setIsModalVisible(false);
  };

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Standalone Brand Directory</h1>
          <p className="text-gray-500">
            Manage global product brands, platform verification, and multi-business co-claimant parties.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search brands by name, slug, or co-claimant business..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500">
            Total {brandData.length} Registered Brands
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={brandData}
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
      </div>

      {/* Edit Status Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.Award size={18} className="text-sky-600" />
            Manage Brand Status - {editingBrand?.name}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSaveStatus} className="mt-4">
          <AntForm.Item name="is_verified" label="Platform Verification" rules={[{ required: true }]}>
            <AntSelect>
              <AntSelect.Option value={true}>VERIFIED BRAND</AntSelect.Option>
              <AntSelect.Option value={false}>UNVERIFIED</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>

          <AntForm.Item name="is_active" label="Brand Status" rules={[{ required: true }]}>
            <AntSelect>
              <AntSelect.Option value={true}>ACTIVE</AntSelect.Option>
              <AntSelect.Option value={false}>INACTIVE</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>
        </AntForm>
      </AntModal>

      {/* Brand Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <AntAvatar src={selectedBrand?.logo_url} icon={<Lucide.Award size={18} />} className="bg-sky-600 border shrink-0" />
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight flex items-center gap-1.5">
                {selectedBrand?.name}
                {selectedBrand?.is_verified && <Lucide.BadgeCheck size={16} className="text-sky-600" />}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {selectedBrand?.id} • slug: {selectedBrand?.slug}
              </div>
            </div>
          </div>
        }
        width={560}
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        destroyOnClose
      >
        {selectedBrand && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Brand Overview</span>
                <div className="flex items-center gap-2">
                  <AntTag color={selectedBrand.is_verified ? 'cyan' : 'orange'}>
                    {selectedBrand.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                  </AntTag>
                  <AntTag color={selectedBrand.is_active ? 'success' : 'default'}>
                    {selectedBrand.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </AntTag>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block">Brand Slug</span>
                  <span className="font-mono text-gray-800">{selectedBrand.slug}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Co-Claimant Parties</span>
                  <span className="font-bold text-purple-700">{selectedBrand.claimCount} Business Parties</span>
                </div>
              </div>
            </div>

            {/* Co-Claimant Parties List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Lucide.Building2 size={16} className="text-indigo-600" />
                  Co-Claimant Business Parties ({selectedBrand.coClaimants.length})
                </span>
              </div>
              {selectedBrand.coClaimants.length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  No business parties have claimed this brand yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBrand.coClaimants.map((c: any) => (
                    <div key={c.brand_party_id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0">
                          <Lucide.Building2 size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-gray-900">{c.business_name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">Party ID: {c.party_id} • {c.country_code}</div>
                        </div>
                      </div>
                      <AntTag color={c.claim_status === 'VERIFIED' ? 'cyan' : c.claim_status === 'APPROVED' ? 'green' : 'orange'} className="text-xs">
                        {c.claim_status}
                      </AntTag>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AntDrawer>
    </div>
  );
};

export default PlatformBrands;
