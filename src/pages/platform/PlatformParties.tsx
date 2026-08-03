import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Tabs as AntTabs, Modal as AntModal, Form as AntForm, Select as AntSelect, Card as AntCard, Tooltip as AntTooltip, Drawer as AntDrawer, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type Business } from '../../data/user';
import { businessDb, type Party, type PartyClaim, type Manufacturer, type Brand, type BrandParty } from '../../data/business';

const PlatformParties: React.FC = () => {
    const { message: antMessage } = AntApp.useApp();
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const breadcrumbs = useMemo(() => [
        { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
        { title: <span className="text-gray-500">Organizations</span> },
        { title: <span className="text-gray-900 font-semibold">Parties & Manufacturer Claims</span> }
    ], []);

    useBreadcrumb(breadcrumbs);

    // Live Query Dexie Tables
    const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
    const partyClaims = useLiveQuery(() => businessDb.partyClaims.toArray()) || [];
    const manufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
    const businesses = useLiveQuery(() => userDb.businesses.toArray()) || [];
    const brands = useLiveQuery(() => businessDb.brands.toArray()) || [];
    const brandParties = useLiveQuery(() => businessDb.brandParties.toArray()) || [];
    const addresses = useLiveQuery(() => userDb.addresses.toArray()) || [];

    // Enriched Party records with associated Business, Manufacturer, Brands, and Physical Locations
    const partyData = useMemo(() => {
        return parties
            .filter((pty: Party) => pty.owner_type === 'BUSINESS')
            .map((pty: Party) => {
                const bus = pty.owner_id
                    ? businesses.find((b: Business) => b.id === pty.owner_id)
                    : null;

                const mfg = manufacturers.find((m: Manufacturer) => m.manufacturer_party_id === pty.id);
                const partyAddrs = addresses.filter((a: any) => a.party_id === pty.id);

                const claimedBrandRecords = brandParties.filter((bp: BrandParty) => bp.party_id === pty.id);
                const claimedBrandsList = claimedBrandRecords.map((bp: BrandParty) => {
                    const brd = brands.find((b: Brand) => b.id === bp.brand_id);
                    return {
                        brand_party_id: bp.id,
                        name: brd?.name || bp.brand_id,
                        claim_status: bp.claim_status
                    };
                });

                return {
                    ...pty,
                    business: bus,
                    business_name: bus?.name || 'Unclaimed Corporate Placeholder',
                    manufacturer: mfg,
                    partyAddresses: partyAddrs,
                    claimedBrands: claimedBrandsList
                };
            }).filter(p =>
                p.display_name.toLowerCase().includes(searchText.toLowerCase()) ||
                p.id.toLowerCase().includes(searchText.toLowerCase()) ||
                p.business_name.toLowerCase().includes(searchText.toLowerCase())
            );
    }, [parties, businesses, manufacturers, brands, brandParties, addresses, searchText]);

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

    const partyColumns = [
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
            title: 'Party Entity',
            key: 'party',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                        <Lucide.Building2 size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {record.display_name}
                            <span className="text-[10px] text-gray-400 font-mono">({record.id})</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                            Owner Type: <strong className="text-indigo-600">{record.owner_type || 'UNCLAIMED'}</strong>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Claimed Business Entity',
            key: 'business',
            render: (_: any, record: any) => {
                if (!record.business) {
                    return <span className="text-xs text-gray-400 italic">{record.business_name}</span>;
                }
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-800">
                        <Lucide.Building size={14} className="text-sky-600 shrink-0" />
                        <div>
                            <div className="font-semibold text-gray-900">{record.business.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{record.business.country_code} • {record.business.id}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Manufacturer Unit',
            key: 'manufacturer',
            render: (_: any, record: any) => {
                if (!record.manufacturer) {
                    return <span className="text-xs text-gray-400 italic">No Manufacturer Unit</span>;
                }
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-800">
                        <Lucide.Factory size={14} className="text-emerald-600 shrink-0" />
                        <div>
                            <div className="font-semibold text-emerald-900">{record.manufacturer.company_name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">Reg: {record.manufacturer.registration_number}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Claim Status',
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
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <AntTag color={status === 'ACTIVE' ? 'success' : 'error'} className="text-xs">
                    {status}
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
                    className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 flex items-center gap-1 font-medium"
                    onClick={() => {
                        setSelectedParty(record);
                        setIsDetailsDrawerOpen(true);
                    }}
                >
                    <Lucide.Eye size={14} /> View Details
                </AntButton>
            )
        }
    ];

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
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Party Registry & Ownership Claims</h1>
                    <p className="text-gray-500">
                        View party entities, claimed business mappings, corporate manufacturers, and pending party claims.
                    </p>
                </div>
            </div>

            {/* Main Container */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <AntInput
                        placeholder="Search party display name, ID, or business name..."
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
                                    <Lucide.Building2 size={16} /> All Parties & Claims ({partyData.length})
                                </span>
                            ),
                            children: (
                                <AntTable
                                    size="small"
                                    columns={partyColumns}
                                    dataSource={partyData}
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

            {/* Comprehensive Party Details Drawer */}
            <AntDrawer
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            <Lucide.Building2 size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-base leading-tight">
                                {selectedParty?.display_name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                                {selectedParty?.id} • Owner Type: {selectedParty?.owner_type || 'UNCLAIMED'}
                            </div>
                        </div>
                    </div>
                }
                width={560}
                open={isDetailsDrawerOpen}
                onClose={() => setIsDetailsDrawerOpen(false)}
                destroyOnClose
            >
                {selectedParty && (
                    <div className="space-y-6">
                        {/* Overview Card */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-sm">Party Overview</span>
                                <div className="flex items-center gap-2">
                                    <AntTag color={selectedParty.is_claimed ? 'cyan' : 'orange'}>
                                        {selectedParty.is_claimed ? 'VERIFIED CLAIM' : 'UNCLAIMED'}
                                    </AntTag>
                                    <AntTag color={selectedParty.status === 'ACTIVE' ? 'success' : 'error'}>
                                        {selectedParty.status}
                                    </AntTag>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-gray-400 block">Owner Type</span>
                                    <span className="font-semibold text-indigo-700">{selectedParty.owner_type || 'NONE'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Owner Entity ID</span>
                                    <span className="font-mono text-gray-800">{selectedParty.owner_id || 'Unclaimed Placeholder'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Claimed Business Info */}
                        <div className="space-y-2">
                            <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <Lucide.Building size={16} className="text-sky-600" />
                                Claimed Business Entity
                            </span>
                            {selectedParty.business ? (
                                <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900">{selectedParty.business.name}</span>
                                        <AntTag color="blue" className="font-mono text-[10px]">{selectedBusinessCountry(selectedParty.business)}</AntTag>
                                    </div>
                                    <div className="text-gray-500">Legal: {selectedParty.business.legal_name || selectedParty.business.name}</div>
                                    <div className="text-[11px] text-gray-400 font-mono">Business ID: {selectedParty.business.id}</div>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                                    {selectedParty.business_name}
                                </div>
                            )}
                        </div>

                        {/* Manufacturer Details */}
                        <div className="space-y-2">
                            <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <Lucide.Factory size={16} className="text-emerald-600" />
                                Corporate Manufacturer Unit
                            </span>
                            {selectedParty.manufacturer ? (
                                <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900">{selectedParty.manufacturer.company_name}</span>
                                        <AntTag color={selectedParty.manufacturer.status === 'ACTIVE' ? 'success' : 'orange'}>
                                            {selectedParty.manufacturer.status}
                                        </AntTag>
                                    </div>
                                    <div className="text-gray-500 font-mono">Reg: {selectedParty.manufacturer.registration_number}</div>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                                    No manufacturer record linked to this party.
                                </div>
                            )}
                        </div>

                        {/* Claimed Brands */}
                        <div className="space-y-2">
                            <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <Lucide.Award size={16} className="text-sky-600" />
                                Claimed Brands ({selectedParty.claimedBrands.length})
                            </span>
                            {selectedParty.claimedBrands.length === 0 ? (
                                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                                    No brand claims linked to this party.
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {selectedParty.claimedBrands.map((b: any) => (
                                        <AntTag key={b.brand_party_id} color="sky" className="text-xs">
                                            <Lucide.Award size={12} className="inline mr-1 text-sky-600" />
                                            {b.name} ({b.claim_status})
                                        </AntTag>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Physical Locations attached to party_id */}
                        <div className="space-y-2">
                            <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <Lucide.MapPin size={16} className="text-indigo-600" />
                                Party Physical Locations ({selectedParty.partyAddresses?.length || 0})
                            </span>
                            {(!selectedParty.partyAddresses || selectedParty.partyAddresses.length === 0) ? (
                                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                                    No physical addresses attached to party_id {selectedParty.id}.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedParty.partyAddresses.map((addr: any) => (
                                        <div key={addr.id} className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <AntTag color="purple" className="text-[10px] font-semibold">{addr.address_type || 'HQ'}</AntTag>
                                                {addr.is_primary && <AntTag color="green" className="text-[10px]">PRIMARY</AntTag>}
                                            </div>
                                            <div className="font-medium text-gray-800">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                                            <div className="text-gray-500">{addr.city}, {addr.state_province} {addr.postal_code} — <span className="font-semibold text-gray-700">{addr.country_name || addr.country_code}</span></div>
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

const selectedBusinessCountry = (bus: any) => bus?.country_code || 'US';

export default PlatformParties;
