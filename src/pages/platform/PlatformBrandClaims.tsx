import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Tabs as AntTabs, Card as AntCard, Tooltip as AntTooltip, message as antMessage, Avatar as AntAvatar } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type Business } from '../../data/user';
import { businessDb, type Brand, type BrandParty, type Manufacturer, type Party, type PartyClaim } from '../../data/business';

const PlatformBrandClaims: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Organizations</span> },
    { title: <span className="text-gray-900 font-semibold">Brands & Manufacturers</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];
  const brands = useLiveQuery(() => businessDb.brands.toArray()) || [];
  const brandParties = useLiveQuery(() => businessDb.brandParties.toArray()) || [];
  const manufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const partyClaims = useLiveQuery(() => businessDb.partyClaims.toArray()) || [];

  // Enriched Brand & Co-Claimant records
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
      b.coClaimants.some(c => c.business_name.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [brands, brandParties, parties, businesses, searchText]);

  // Enriched Manufacturer records
  const manufacturerData = useMemo(() => {
    return manufacturers.map((mfg: Manufacturer) => {
      const party = parties.find((p: Party) => p.id === mfg.manufacturer_party_id);
      const bus = party && party.owner_id ? businesses.find((b: Business) => b.id === party.owner_id) : null;

      return {
        ...mfg,
        party_name: party?.display_name || mfg.manufacturer_party_id,
        business_name: bus?.name || (party?.owner_type === 'USER' ? 'Individual User' : 'Unclaimed Placeholder'),
        country_code: bus?.country_code || 'GLOBAL'
      };
    }).filter(m =>
      m.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
      m.business_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (m.registration_number && m.registration_number.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [manufacturers, parties, businesses, searchText]);

  // Enriched Party Claims audit records
  const claimsData = useMemo(() => {
    return partyClaims.map((clm: PartyClaim) => {
      const targetParty = parties.find((p: Party) => p.id === clm.target_party_id);
      const claimantParty = parties.find((p: Party) => p.id === clm.claimant_party_id);
      const claimantBus = claimantParty && claimantParty.owner_id ? businesses.find((b: Business) => b.id === claimantParty.owner_id) : null;

      return {
        ...clm,
        target_display_name: targetParty?.display_name || clm.target_party_id,
        claimant_display_name: claimantParty?.display_name || clm.claimant_party_id,
        claimant_business_name: claimantBus?.name || 'Unknown Business'
      };
    });
  }, [partyClaims, parties, businesses]);

  // Handle Approve Claim
  const handleApproveClaim = async (claimId: string, targetPartyId: string, claimantPartyId: string) => {
    const claimantParty = parties.find((p: Party) => p.id === claimantPartyId);
    if (claimantParty) {
      await businessDb.parties.update(targetPartyId, {
        owner_type: 'BUSINESS',
        owner_id: claimantParty.owner_id,
        is_claimed: true,
        is_verified: true,
        updated_at: new Date().toISOString()
      });
    }
    await businessDb.partyClaims.update(claimId, {
      status: 'APPROVED',
      updated_at: new Date().toISOString()
    });
    antMessage.success('Party claim approved successfully.');
  };

  // Handle Reject Claim
  const handleRejectClaim = async (claimId: string) => {
    await businessDb.partyClaims.update(claimId, {
      status: 'REJECTED',
      updated_at: new Date().toISOString()
    });
    antMessage.info('Party claim rejected.');
  };

  // Columns for Brands & Co-Claimants
  const brandColumns = [
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
      title: 'Claimed Business Parties (Co-Claimants)',
      key: 'coClaimants',
      render: (_: any, record: any) => (
        <div className="space-y-1 py-1">
          {record.coClaimants.map((claim: any) => (
            <div key={claim.brand_party_id} className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded">
              <Lucide.Building2 size={13} className="text-indigo-600 shrink-0" />
              <span className="font-semibold text-gray-800">{claim.business_name}</span>
              <span className="text-[10px] text-gray-400 font-mono">({claim.party_id})</span>
              <AntTag color={claim.claim_status === 'VERIFIED' ? 'cyan' : claim.claim_status === 'APPROVED' ? 'green' : 'orange'} className="ml-auto text-[10px]">
                {claim.claim_status}
              </AntTag>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Co-Claimants Count',
      dataIndex: 'claimCount',
      key: 'claimCount',
      width: 150,
      render: (count: number) => (
        <AntTag color="purple" className="font-medium text-xs">
          <Lucide.Users size={12} className="inline mr-1" /> {count} Co-Claimants
        </AntTag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <AntTag color={active ? 'success' : 'default'} className="text-xs">
          {active ? 'ACTIVE' : 'INACTIVE'}
        </AntTag>
      )
    }
  ];

  // Columns for Manufacturers
  const manufacturerColumns = [
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
      title: 'Claimed Business Party',
      key: 'businessParty',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2 text-xs text-gray-800">
          <Lucide.Building2 size={14} className="text-indigo-600 shrink-0" />
          <div>
            <div className="font-semibold text-indigo-900">{record.business_name}</div>
            <div className="text-[11px] text-gray-400 font-mono">Party ID: {record.manufacturer_party_id}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Verification Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: string) => (
        <AntTag color={status === 'ACTIVE' ? 'success' : 'orange'} className="text-xs">
          {status}
        </AntTag>
      )
    }
  ];

  // Columns for Party Claims Audit
  const claimsColumns = [
    {
      title: 'Claimant Business',
      key: 'claimant',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
          <Lucide.Building2 size={14} className="text-sky-600 shrink-0" />
          {record.claimant_business_name}
          <span className="text-gray-400 font-mono font-normal">({record.claimant_party_id})</span>
        </div>
      )
    },
    {
      title: 'Target Unclaimed Party',
      key: 'target',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2 text-xs text-gray-800 font-medium">
          <Lucide.Building size={14} className="text-amber-500 shrink-0" />
          {record.target_display_name}
          <span className="text-gray-400 font-mono font-normal">({record.target_party_id})</span>
        </div>
      )
    },
    {
      title: 'Claim Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <AntTag color={status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'orange' : 'error'} className="text-xs">
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
          {record.status === 'PENDING' && (
            <>
              <AntButton
                type="text"
                size="small"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleApproveClaim(record.id, record.target_party_id, record.claimant_party_id)}
              >
                Approve
              </AntButton>
              <AntButton
                type="text"
                danger
                size="small"
                onClick={() => handleRejectClaim(record.id)}
              >
                Reject
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Brand & Manufacturer Ownership Claims</h1>
          <p className="text-gray-500">
            Audit multi-business brand co-claimants, corporate manufacturing parties, and party ownership claims.
          </p>
        </div>
      </div>

      {/* Rules Banner */} 

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search brands, manufacturers, or claimant businesses..."
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
                  <Lucide.Award size={16} /> Brands & Co-Claimants ({brandData.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={brandColumns}
                  dataSource={brandData}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.Factory size={16} /> Corporate Manufacturers ({manufacturerData.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={manufacturerColumns}
                  dataSource={manufacturerData}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )
            },
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.FileCheck size={16} /> Party Claims Audit ({claimsData.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={claimsColumns}
                  dataSource={claimsData}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default PlatformBrandClaims;
