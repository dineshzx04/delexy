import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Modal as AntModal, Form as AntForm, Select as AntSelect, message as antMessage, Card as AntCard, Tooltip as AntTooltip, Drawer as AntDrawer, Avatar as AntAvatar } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type Business, type BusinessMembership, type User } from '../../data/user';
import { businessDb, type Party, type Brand, type BrandParty, type Manufacturer } from '../../data/business';

const PlatformBusinesses: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [form] = AntForm.useForm();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Organizations</span> },
    { title: <span className="text-gray-900 font-semibold">Businesses</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];
  const businessMemberships = useLiveQuery(() => userDb.businessMemberships.toArray()) || [];
  const users = useLiveQuery(() => userDb.users.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const brands = useLiveQuery(() => businessDb.brands.toArray()) || [];
  const brandParties = useLiveQuery(() => businessDb.brandParties.toArray()) || [];
  const manufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];

  // Enriched business records with owner name, member count, claimed party, claimed brands, and manufacturers
  const businessData = useMemo(() => {
    return businesses.map((bus: Business) => {
      const memberships = businessMemberships.filter((bm: BusinessMembership) => bm.business_id === bus.id);
      const ownerMembership = memberships.find((bm: BusinessMembership) => bm.membership_type === 'OWNER');
      const ownerUser = ownerMembership ? users.find((u: User) => u.id === ownerMembership.user_id) : null;

      // Resolve 1 Business <-> 1 Claimed Party (owner_type = 'BUSINESS' & owner_id = bus.id)
      const claimedParty = parties.find((p: Party) => p.owner_type === 'BUSINESS' && p.owner_id === bus.id);

      // Resolve claimed brands for this party
      const claimedBrandRecords = claimedParty
        ? brandParties.filter((bp: BrandParty) => bp.party_id === claimedParty.id)
        : [];

      const claimedBrandsList = claimedBrandRecords.map((bp: BrandParty) => {
        const brd = brands.find((b: Brand) => b.id === bp.brand_id);
        return {
          brand_party_id: bp.id,
          brand_id: bp.brand_id,
          name: brd?.name || bp.brand_id,
          slug: brd?.slug || '',
          logo_url: brd?.logo_url,
          claim_status: bp.claim_status,
          is_verified: brd?.is_verified || false
        };
      });

      // Resolve claimed manufacturers for this party
      const claimedManufacturersList = claimedParty
        ? manufacturers.filter((m: Manufacturer) => m.manufacturer_party_id === claimedParty.id)
        : [];

      return {
        ...bus,
        memberCount: memberships.length,
        ownerName: ownerUser ? ownerUser.full_name : 'No Owner Assigned',
        ownerAppUserId: ownerUser ? ownerUser.app_user_id : '-',
        claimedParty,
        claimedBrands: claimedBrandsList,
        claimedManufacturers: claimedManufacturersList
      };
    }).filter(b =>
      b.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (b.legal_name && b.legal_name.toLowerCase().includes(searchText.toLowerCase())) ||
      b.country_code.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [businesses, businessMemberships, users, parties, brands, brandParties, manufacturers, searchText]);

  const columns = [
    {
      title: 'Business Entity',
      key: 'business',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
            <Lucide.Building2 size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              {record.name}
              <AntTag color="blue" className="text-[10px] uppercase font-mono px-1.5 py-0">{record.country_code}</AntTag>
            </div>
            {record.legal_name && (
              <div className="text-xs text-gray-500 truncate max-w-[240px]">{record.legal_name}</div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Business Owner',
      key: 'owner',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2 text-sm text-gray-800">
          <Lucide.UserCheck size={14} className="text-sky-600 shrink-0" />
          <div>
            <div className="font-medium text-xs">{record.ownerName}</div>
            <div className="text-[11px] text-gray-400 font-mono">{record.ownerAppUserId}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Claimed Status',
      dataIndex: 'is_claimed',
      key: 'is_claimed',
      width: 140,
      render: (claimed: boolean) => (
        <AntTag color={claimed ? 'cyan' : 'orange'} className="text-xs">
          {claimed ? 'VERIFIED CLAIM' : 'UNCLAIMED'}
        </AntTag>
      )
    },
    {
      title: 'Account Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 130,
      render: (active: boolean) => (
        <AntTag color={active ? 'success' : 'error'} className="text-xs">
          {active ? 'ACTIVE' : 'SUSPENDED'}
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
              setSelectedBusiness(record);
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
              setEditingBusiness(record);
              form.setFieldsValue({
                is_active: record.is_active,
                is_claimed: record.is_claimed
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
    if (!editingBusiness) return;
    await userDb.businesses.update(editingBusiness.id, {
      is_active: values.is_active,
      is_claimed: values.is_claimed,
      updated_at: new Date().toISOString()
    });
    antMessage.success('Business status updated successfully.');
    setIsModalVisible(false);
  };

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Registry</h1>
          <p className="text-gray-500">
            View registered business entities, tenant owners, claimed parties, brands, and status controls.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search businesses by name, legal name, or country..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500">
            Total {businessData.length} Registered Businesses
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={businessData}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      {/* Status Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.Building2 size={18} className="text-indigo-600" />
            Manage Business Status - {editingBusiness?.name}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSaveStatus} className="mt-4">
          <AntForm.Item name="is_active" label="Account Status" rules={[{ required: true }]}>
            <AntSelect>
              <AntSelect.Option value={true}>ACTIVE</AntSelect.Option>
              <AntSelect.Option value={false}>SUSPENDED</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>

          {/* <AntForm.Item name="is_claimed" label="Corporate Claim Status" rules={[{ required: true }]}>
            <AntSelect>
              <AntSelect.Option value={true}>VERIFIED CLAIMED</AntSelect.Option>
              <AntSelect.Option value={false}>UNCLAIMED</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>
          */}
        </AntForm>
      </AntModal>

      {/* Comprehensive Business Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Lucide.Building2 size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">
                {selectedBusiness?.name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {selectedBusiness?.id} • {selectedBusiness?.country_code}
              </div>
            </div>
          </div>
        }
        width={600}
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        destroyOnClose
      >
        {selectedBusiness && (
          <div className="space-y-6">
            {/* 1. Overview Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">Business Overview</span>
                <div className="flex items-center gap-2">
                  <AntTag color={selectedBusiness.is_claimed ? 'cyan' : 'orange'}>
                    {selectedBusiness.is_claimed ? 'VERIFIED CLAIMED' : 'UNCLAIMED'}
                  </AntTag>
                  <AntTag color={selectedBusiness.is_active ? 'success' : 'error'}>
                    {selectedBusiness.is_active ? 'ACTIVE' : 'SUSPENDED'}
                  </AntTag>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Legal Entity Name</span>
                  <span className="font-semibold text-gray-800">{selectedBusiness.legal_name || selectedBusiness.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Country / Region</span>
                  <span className="font-semibold text-gray-800">{selectedBusiness.country_code}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Tenant Owner</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                    <Lucide.UserCheck size={14} className="text-sky-600" />
                    {selectedBusiness.ownerName} ({selectedBusiness.ownerAppUserId})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Team Members</span>
                  <span className="font-semibold text-purple-700 mt-0.5 block">{selectedBusiness.memberCount} Staff Members</span>
                </div>
                {selectedBusiness.website && (
                  <div>
                    <span className="text-gray-400 block">Website</span>
                    <a href={selectedBusiness.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                      {selectedBusiness.website}
                    </a>
                  </div>
                )}
                {selectedBusiness.phone && (
                  <div>
                    <span className="text-gray-400 block">Contact Phone</span>
                    <span className="font-mono text-gray-800">{selectedBusiness.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. 1 Business <-> 1 Claimed Party Card */}
            <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Lucide.ShieldCheck size={18} className="text-indigo-600" /> Claimed Corporate Party
              </div>
              {selectedBusiness.claimedParty ? (
                <div className="bg-white p-3 rounded border border-indigo-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{selectedBusiness.claimedParty.display_name}</span>
                    <AntTag color="blue" className="font-mono text-[10px]">{selectedBusiness.claimedParty.id}</AntTag>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 text-[11px]">
                    <span>Owner Type: <strong className="text-indigo-700">{selectedBusiness.claimedParty.owner_type}</strong></span>
                    <span>Status: <strong className="text-emerald-700">{selectedBusiness.claimedParty.status}</strong></span>
                    <span>Verified: <strong>{selectedBusiness.claimedParty.is_verified ? 'YES' : 'NO'}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic bg-white p-3 rounded border border-indigo-100">
                  No claimed corporate party assigned to this business entity.
                </div>
              )}
            </div>

            {/* 3. Claimed Brands List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Lucide.Award size={16} className="text-sky-600" />
                  Claimed Brands ({selectedBusiness.claimedBrands.length})
                </span>
              </div>
              {selectedBusiness.claimedBrands.length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  This business has not claimed any brand entities.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBusiness.claimedBrands.map((b: any) => (
                    <div key={b.brand_party_id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <AntAvatar src={b.logo_url} icon={<Lucide.Award size={14} />} className="bg-sky-600 border shrink-0" />
                        <div>
                          <div className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                            {b.name}
                            {b.is_verified && <Lucide.BadgeCheck size={14} className="text-sky-600" />}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">slug: {b.slug}</div>
                        </div>
                      </div>
                      <AntTag color={b.claim_status === 'VERIFIED' ? 'cyan' : b.claim_status === 'APPROVED' ? 'green' : 'orange'} className="text-xs">
                        {b.claim_status}
                      </AntTag>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Claimed Manufacturers List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Lucide.Factory size={16} className="text-emerald-600" />
                  Manufacturing Units ({selectedBusiness.claimedManufacturers.length})
                </span>
              </div>
              {selectedBusiness.claimedManufacturers.length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  No manufacturing units linked to this business party.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBusiness.claimedManufacturers.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Lucide.Factory size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-gray-900">{m.company_name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">Reg: {m.registration_number}</div>
                        </div>
                      </div>
                      <AntTag color={m.status === 'ACTIVE' ? 'success' : 'orange'} className="text-xs">
                        {m.status}
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

export default PlatformBusinesses;

