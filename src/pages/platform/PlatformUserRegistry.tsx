import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  userDb, 
  type User, 
  type Business,
  type BusinessMembership, 
  type PlatformMembership, 
  type PlatformRole 
} from '../../data/user';
import { businessDb, type Party } from '../../data/business';

const PlatformUserRegistry: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedUserRecord, setSelectedUserRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Organizations</span> },
    { title: <span className="text-gray-900 font-semibold">User Registry</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const users = useLiveQuery(() => userDb.users.toArray()) || [];
  const userEmails = useLiveQuery(() => userDb.userEmails.toArray()) || [];
  const emails = useLiveQuery(() => userDb.emails.toArray()) || [];
  const businessMemberships = useLiveQuery(() => userDb.businessMemberships.toArray()) || [];
  const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const addresses = useLiveQuery(() => userDb.addresses.toArray()) || [];
  const platformMemberships = useLiveQuery(() => userDb.platformMemberships.toArray()) || [];
  const platformRoles = useLiveQuery(() => userDb.platformRoles.toArray()) || [];

  // Filter out Super Admin and enrich User Registry records for individual users
  const allUserData = useMemo(() => {
    return users
      .filter((u: User) => !u.is_platform_active && u.id !== 'usr-1')
      .map((u: User) => {
        // Resolve primary email record from userEmails -> emails
        const primaryUserEmailRel = userEmails.find((ue: any) => ue.user_id === u.id && ue.is_primary);
        const emailObj = primaryUserEmailRel ? emails.find((e: any) => e.id === primaryUserEmailRel.email_id) : null;
        const primaryEmailStr = emailObj?.email || 'No Primary Email';

        // Resolve user's Personal Trading Party (owner_type = 'USER' & owner_id = u.id)
        const personalParty = parties.find((p: Party) => p.owner_type === 'USER' && p.owner_id === u.id);

        // Resolve physical locations attached to user's personal party_id
        const personalAddresses = personalParty ? addresses.filter((a: any) => a.party_id === personalParty.id) : [];

        // Resolve business memberships owned or joined by this user
        const userBizMemberships = businessMemberships.filter((bm: BusinessMembership) => bm.user_id === u.id);
        const enrichedBizMemberships = userBizMemberships.map((bm: BusinessMembership) => {
          const biz = businesses.find((b: Business) => b.id === bm.business_id);
          return {
            ...bm,
            businessName: biz?.name || bm.business_id,
            businessSlug: biz?.slug || '',
            countryCode: biz?.country_code || 'US'
          };
        });

        // Resolve platform membership & role
        const pltMembership = platformMemberships.find((pm: PlatformMembership) => pm.user_id === u.id);
        const pltRole = pltMembership ? platformRoles.find((pr: PlatformRole) => pr.id === pltMembership.platform_role_id) : null;

        return {
          ...u,
          primaryEmail: primaryEmailStr,
          emailType: emailObj?.type || 'PERSONAL',
          personalParty,
          personalAddresses,
          businessMemberships: enrichedBizMemberships,
          platformMembership: pltMembership,
          platformRoleName: pltRole?.role_name || 'Individual User'
        };
      }).filter((u: any) =>
        u.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.app_user_id.toLowerCase().includes(searchText.toLowerCase()) ||
        u.primaryEmail.toLowerCase().includes(searchText.toLowerCase()) ||
        (u.country_of_residence && u.country_of_residence.toLowerCase().includes(searchText.toLowerCase()))
      );
  }, [users, userEmails, emails, parties, addresses, businessMemberships, businesses, platformMemberships, platformRoles, searchText]);

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
      title: 'User Identity',
      key: 'user_identity',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {record.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              {record.full_name}
              <AntTag color="blue" className="text-[10px] font-mono px-1.5 py-0">
                {record.app_user_id}
              </AntTag>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Lucide.Mail size={12} className="text-gray-400" />
              {record.primaryEmail}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Country of Residence',
      dataIndex: 'country_of_residence',
      key: 'country_of_residence',
      width: 180,
      render: (country: string) => (
        <span className="text-xs font-medium text-gray-700">{country || 'Global Platform'}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (active: boolean) => (
        <AntTag color={active ? 'success' : 'error'} className="text-xs">
          {active ? 'ACTIVE' : 'INACTIVE'}
        </AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 130,
      render: (_: any, record: any) => (
        <AntButton
          type="text"
          size="small"
          className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 flex items-center gap-1 font-medium text-xs"
          onClick={() => {
            setSelectedUserRecord(record);
            setIsDetailsDrawerOpen(true);
          }}
        >
          <Lucide.Eye size={14} /> View Details
        </AntButton>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">User Registry</h1>
          <p className="text-gray-500 text-sm">
            Platform directory of registered individual user accounts, credentials, personal parties, and business workspace memberships.
          </p>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search users by full name, App User ID, email, or country..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500">
            Total {allUserData.length} Registered Individual Users
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={allUserData}
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

      {/* User Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {selectedUserRecord?.full_name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">
                {selectedUserRecord?.full_name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                User ID: {selectedUserRecord?.id} • App ID: {selectedUserRecord?.app_user_id}
              </div>
            </div>
          </div>
        }
        width={600}
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        destroyOnClose
      >
        {selectedUserRecord && (
          <div className="space-y-6">
            {/* 1. Profile Overview Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">User Identity & Profile</span>
                <div className="flex items-center gap-2">
                  <AntTag color="blue">INDIVIDUAL ACCOUNT</AntTag>
                  <AntTag color={selectedUserRecord.is_active ? 'success' : 'error'}>
                    {selectedUserRecord.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </AntTag>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Full Name</span>
                  <span className="font-semibold text-gray-800">{selectedUserRecord.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">App User ID</span>
                  <span className="font-mono text-gray-800">{selectedUserRecord.app_user_id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Primary Personal Email</span>
                  <span className="font-mono text-gray-800 flex items-center gap-1 mt-0.5">
                    <Lucide.Mail size={12} className="text-sky-600" />
                    {selectedUserRecord.primaryEmail}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Country of Residence</span>
                  <span className="font-semibold text-gray-800">{selectedUserRecord.country_of_residence || 'Global'}</span>
                </div>
                {selectedUserRecord.date_of_birth && (
                  <div>
                    <span className="text-gray-400 block">Date of Birth</span>
                    <span className="font-mono text-gray-800">{selectedUserRecord.date_of_birth}</span>
                  </div>
                )}
                {selectedUserRecord.place_of_birth && (
                  <div>
                    <span className="text-gray-400 block">Place of Birth</span>
                    <span className="font-semibold text-gray-800">{selectedUserRecord.place_of_birth}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Personal Trading Party Card */}
            <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                  <Lucide.UserCheck size={16} className="text-indigo-600" />
                  Personal Trading Party
                </span>
                {selectedUserRecord.personalParty && (
                  <AntTag color="blue" className="font-mono text-[10px]">{selectedUserRecord.personalParty.id}</AntTag>
                )}
              </div>
              {selectedUserRecord.personalParty ? (
                <div className="bg-white p-3 rounded border border-indigo-100 space-y-1.5 text-xs">
                  <div className="font-bold text-gray-900">{selectedUserRecord.personalParty.display_name}</div>
                  <div className="flex items-center gap-4 text-gray-600 text-[11px]">
                    <span>Owner Type: <strong className="text-indigo-700">{selectedUserRecord.personalParty.owner_type}</strong></span>
                    <span>Status: <strong className="text-emerald-700">{selectedUserRecord.personalParty.status}</strong></span>
                    <span>Verified: <strong>{selectedUserRecord.personalParty.is_verified ? 'YES' : 'NO'}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic bg-white p-3 rounded border border-indigo-100">
                  No personal trading party created for this user profile.
                </div>
              )}
            </div>

            {/* 3. Personal Physical Locations (attached directly to party_id) */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.MapPin size={16} className="text-indigo-600" />
                Personal Physical Locations ({selectedUserRecord.personalAddresses?.length || 0})
              </span>
              {(!selectedUserRecord.personalAddresses || selectedUserRecord.personalAddresses.length === 0) ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  No personal physical locations attached to party_id {selectedUserRecord.personalParty?.id || '-'}.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedUserRecord.personalAddresses.map((addr: any) => (
                    <div key={addr.id} className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <AntTag color="purple" className="text-[10px] font-semibold">{addr.address_type || 'RESIDENTIAL'}</AntTag>
                        {addr.is_primary && <AntTag color="green" className="text-[10px]">PRIMARY</AntTag>}
                      </div>
                      <div className="font-medium text-gray-800">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                      <div className="text-gray-500">{addr.city}, {addr.state_province} {addr.postal_code} — <span className="font-semibold text-gray-700">{addr.country_name || addr.country_code}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Business Workspace Memberships List */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Building2 size={16} className="text-sky-600" />
                Business Workspace Memberships ({selectedUserRecord.businessMemberships?.length || 0})
              </span>
              {(!selectedUserRecord.businessMemberships || selectedUserRecord.businessMemberships.length === 0) ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  This user is not a member or owner of any corporate business workspaces.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedUserRecord.businessMemberships.map((bm: any) => (
                    <div key={bm.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {bm.businessName}
                          <AntTag color="blue" className="text-[10px] font-mono px-1 py-0">{bm.countryCode}</AntTag>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">Business ID: {bm.business_id}</div>
                      </div>
                      <AntTag color={bm.membership_type === 'OWNER' ? 'gold' : 'cyan'} className="text-xs">
                        {bm.membership_type}
                      </AntTag>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Platform Context & Access Role */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Shield size={16} className="text-purple-600" />
                Platform Context & Access Role
              </span>
              {selectedUserRecord.platformMembership ? (
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{selectedUserRecord.platformRoleName}</span>
                    <AntTag color="purple" className="text-xs">{selectedUserRecord.platformMembership.membership_type}</AntTag>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-[11px]">
                    <span>Status: <strong className="text-emerald-700">{selectedUserRecord.platformMembership.status}</strong></span>
                    <span>Switch Gate: <strong>{selectedUserRecord.platformMembership.require_switch_password ? 'Password Protected' : 'Direct Access'}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  No active platform administration role assigned to this user.
                </div>
              )}
            </div>
          </div>
        )}
      </AntDrawer>
    </div>
  );
};

export default PlatformUserRegistry;
