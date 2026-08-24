import React from 'react';
import {
  Button as AntButton,
  Avatar as AntAvatar,
  Tag as AntTag,
  Card as AntCard
} from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { businessDb } from '../../data/business';

const BusinessProfile: React.FC = () => {
  const { businessId: paramBizId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();
  const currentBizId = paramBizId || activeWorkspace.businessId || activeWorkspace.id || 'bus-a';

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/b/profile" className="text-slate-800 font-semibold cursor-default pointer-events-none">Business Profile</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // 1. Fetch Business Record strictly from Dexie DB (userDb.businesses)
  const bizRecord = useLiveQuery(
    async () => await userDb.businesses.get(currentBizId),
    [currentBizId]
  );

  // 2. Fetch Business Emails strictly from Dexie DB (userDb.businessEmails + userDb.emails)
  const bizEmailsList = useLiveQuery(
    async () => {
      const bEmails = await userDb.businessEmails.where('business_id').equals(currentBizId).toArray();
      const allEmails = await userDb.emails.toArray();

      return bEmails.map((be) => {
        const emailObj = allEmails.find((e) => e.id === be.email_id);
        return {
          id: be.id,
          email: emailObj?.email || be.email_id,
          emailType: be.email_type,
          label: be.label || 'Contact Email',
          isVerified: be.is_verified,
        };
      });
    },
    [currentBizId]
  ) || [];

  // 3. Fetch Team Members strictly from Dexie DB (userDb.businessMemberships + userDb.users)
  const membersList = useLiveQuery(
    async () => {
      const memberships = await userDb.businessMemberships.where('business_id').equals(currentBizId).toArray();
      const allUsers = await userDb.users.toArray();

      return memberships.map((m) => {
        const uObj = allUsers.find((u) => u.id === m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          appUserId: uObj?.app_user_id || m.user_id,
          fullName: uObj?.full_name || 'Team Member',
          role: m.membership_type,
          status: m.status,
        };
      });
    },
    [currentBizId]
  ) || [];

  // 4. Query Claimed 1:1 Business Party Entity strictly from Dexie DB (businessDb.parties)
  const claimedParty = useLiveQuery(
    async () => {
      const p = await businessDb.parties
        .where('owner_id').equals(currentBizId)
        .filter((party) => party.owner_type === 'BUSINESS')
        .first();
      return p;
    },
    [currentBizId]
  );

  // 5. Query Party Claims linked to this party strictly from Dexie DB (businessDb.partyClaims)
  const linkedPartyClaims = useLiveQuery(
    async () => {
      if (!claimedParty) return [];
      return await businessDb.partyClaims
        .filter((clm) => clm.claimant_party_id === claimedParty.id || clm.target_party_id === claimedParty.id)
        .toArray();
    },
    [claimedParty?.id]
  ) || [];

  // 6. Query Co-Claimed Brands linked to this party strictly from Dexie DB (businessDb.brandParties + businessDb.brands)
  const linkedPartyBrands = useLiveQuery(
    async () => {
      if (!claimedParty) return [];
      const bps = await businessDb.brandParties
        .where('party_id').equals(claimedParty.id)
        .toArray();
      const allBrands = await businessDb.brands.toArray();
      return bps.map((bp) => {
        const brd = allBrands.find((b) => b.id === bp.brand_id);
        return {
          ...bp,
          brandName: brd?.name || bp.brand_id,
          brandSlug: brd?.slug,
          isVerifiedBrand: brd?.is_verified
        };
      });
    },
    [claimedParty?.id]
  ) || [];

  // 7. Query Corporate Addresses strictly from Dexie DB (userDb.addresses) via party_id
  const mappedBizAddresses = useLiveQuery(
    async () => {
      if (!claimedParty) return [];
      return await userDb.addresses
        .where('party_id').equals(claimedParty.id)
        .toArray();
    },
    [claimedParty?.id]
  ) || [];



  return (
    <div className="w-full space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Business Profile</h1>
          <p className="text-slate-500 text-sm">Read-only overview of organization profile, legal entity details, and connected data.</p>
        </div>
        {/* <Link to="/b/settings">
          <AntButton
            type="primary"
            icon={<Lucide.Settings size={15} />}
            className="bg-indigo-600 hover:bg-indigo-700 font-medium flex items-center gap-1.5"
          >
            Edit Settings
          </AntButton>
        </Link> */}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Organization Overview Card */}
        <div className="w-full lg:w-1/3">
          <AntCard className="shadow-sm border-slate-200 text-center">
            <div className="flex flex-col items-center">
              <AntAvatar
                size={90}
                icon={<Lucide.Building2 size={44} />}
                style={{ backgroundColor: '#4f46e5' }}
                className="mb-4 text-2xl font-bold shadow-sm"
              >
                {bizRecord?.name?.[0]}
              </AntAvatar>

              <h2 className="text-xl font-bold text-slate-900 mb-1">{bizRecord?.name}</h2>
              <p className="text-slate-500 text-xs font-mono mb-3">{bizRecord?.legal_name || `${bizRecord?.name} Inc.`}</p>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <AntTag color={bizRecord?.is_active !== false ? 'green' : 'red'} className="m-0 font-medium">
                  {bizRecord?.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                </AntTag>

                <AntTag color={bizRecord?.is_claimed !== false ? 'blue' : 'orange'} className="m-0 font-medium">
                  {bizRecord?.is_claimed !== false ? 'VERIFIED & CLAIMED' : 'UNCLAIMED'}
                </AntTag>
              </div>

              <div className="w-full text-left pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Business ID:</span>
                  <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                    {bizRecord?.id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Claimed 1:1 Party:</span>
                  <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold text-xs truncate max-w-[170px]" title={claimedParty?.display_name}>
                    {claimedParty?.id || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Country:</span>
                  <span className="font-semibold text-slate-800">{bizRecord?.country_code || 'US'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Team Members:</span>
                  <span className="font-semibold text-slate-800">{membersList.length} Members</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Connected Emails:</span>
                  <span className="font-semibold text-slate-800">{bizEmailsList.length} Emails</span>
                </div>
              </div>
            </div>
          </AntCard>
        </div>

        {/* Right Column: Detailed Business View & Connected Data */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* General Information Card (Read-Only) */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800 text-lg flex items-center justify-between">
              <span>General Information</span>
              <Lucide.Building size={18} className="text-slate-400" />
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Name</div>
                  <div className="text-slate-900 font-semibold text-base flex items-center gap-2">
                    <Lucide.Building size={16} className="text-indigo-600" />
                    <span>{bizRecord?.name}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Legal Entity Name</div>
                  <div className="text-slate-900 font-semibold text-base flex items-center gap-2">
                    <Lucide.FileText size={16} className="text-slate-500" />
                    <span>{bizRecord?.legal_name || `${bizRecord?.name} Inc.`}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Website Domain</div>
                  <div className="text-slate-900 font-medium text-sm flex items-center gap-2">
                    <Lucide.Globe size={16} className="text-sky-600" />
                    <a href={bizRecord?.website || 'https://company.com'} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      {bizRecord?.website || `https://${bizRecord?.slug || 'company'}.com`}
                    </a>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Main Contact Phone</div>
                  <div className="text-slate-900 font-medium text-sm flex items-center gap-2">
                    <Lucide.Phone size={16} className="text-emerald-600" />
                    <span>{bizRecord?.phone || '+1 (555) 000-0000'}</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Country of Operation</div>
                  <div className="text-slate-900 font-medium text-sm flex items-center gap-2">
                    <Lucide.MapPin size={16} className="text-amber-600" />
                    <span>{bizRecord?.country_code || 'US'} - United States</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Claimed 1:1 Business Party & Trading Identity Card */}
          <div className="bg-white border border-indigo-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/50 font-semibold text-slate-800 text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lucide.Award size={20} className="text-indigo-600" />
                <span>Claimed 1:1 Business Party & Trading Identity</span>
              </div>
              {claimedParty?.is_verified ? (
                <AntTag color="purple" className="font-semibold text-xs m-0">VERIFIED PARTY IDENTITY</AntTag>
              ) : (
                <AntTag color="orange" className="font-semibold text-xs m-0">UNVERIFIED PARTY</AntTag>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Party Display Name</div>
                  <div className="text-slate-900 font-bold text-base flex items-center gap-2">
                    <Lucide.Building2 size={16} className="text-indigo-600 shrink-0" />
                    <span>{claimedParty?.display_name || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Claimed Party Entity ID</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 font-bold text-sm">
                      {claimedParty?.id || 'N/A'}
                    </span>
                    <AntTag color="blue" className="text-xs font-mono font-semibold m-0">1:1 BUSINESS OWNER</AntTag>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ownership Architecture</div>
                  <div className="text-slate-800 font-medium text-sm flex items-center gap-2">
                    <Lucide.ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>Owner Type: <strong>{claimedParty?.owner_type || 'BUSINESS'}</strong> (Owner ID: <code className="text-indigo-600 font-mono">{claimedParty?.owner_id || currentBizId}</code>)</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Party Operational Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <AntTag color={claimedParty?.status === 'ACTIVE' ? 'success' : 'error'} className="font-bold text-xs">
                      {claimedParty?.status || 'ACTIVE'}
                    </AntTag>
                    {claimedParty?.is_claimed && (
                      <AntTag color="cyan" className="font-semibold text-xs">CLAIMED OWNERSHIP</AntTag>
                    )}
                  </div>
                </div>
              </div>

              {/* Linked Co-Claimed Brands Section if any */}
              {linkedPartyBrands.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lucide.Tag size={14} className="text-indigo-600" />
                    <span>Linked Co-Claimed Brands ({linkedPartyBrands.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {linkedPartyBrands.map((b) => (
                      <div key={b.id} className="bg-purple-50 border border-purple-200 text-purple-900 rounded-md px-3 py-1.5 text-xs flex items-center gap-2 font-semibold">
                        <Lucide.Award size={13} className="text-purple-600" />
                        <span>{b.brandName}</span>
                        <AntTag color="purple" className="text-[10px] m-0 font-mono">{b.claim_status}</AntTag>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governance Party Claim Notes if any */}
              {linkedPartyClaims.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lucide.FileCheck size={14} className="text-emerald-600" />
                    <span>Platform Party Claim Records ({linkedPartyClaims.length})</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {linkedPartyClaims.map((claim) => (
                      <div key={claim.id} className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>Claim #{claim.id}</span>
                            <AntTag color={claim.status === 'APPROVED' ? 'success' : claim.status === 'PENDING' ? 'processing' : 'error'} className="text-[10px] font-bold">
                              {claim.status}
                            </AntTag>
                          </div>
                          {claim.notes && (
                            <p className="text-[11px] text-slate-600 mb-0 mt-0.5">{claim.notes}</p>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono shrink-0">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connected Business Emails Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2 m-0">
                  <Lucide.Mail size={18} className="text-indigo-600" />
                  Business Email Addresses ({bizEmailsList.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-0">Registered organization contact and billing emails.</p>
              </div>

              <Link to="/b/emails">
                <AntButton size="small" icon={<Lucide.ExternalLink size={13} />}>
                  Manage Emails
                </AntButton>
              </Link>
            </div>

            <div className="p-6 space-y-3">
              {bizEmailsList.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No business emails registered.</div>
              ) : (
                bizEmailsList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-lg flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                        <Lucide.Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{item.email}</div>
                        <div className="text-xs text-indigo-800 font-medium">{item.label}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AntTag color="purple" className="m-0 font-medium text-xs">
                        {item.emailType}
                      </AntTag>
                      {item.isVerified && <AntTag color="success" className="m-0 text-xs">Verified</AntTag>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Owners Summary Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2 m-0">
                  <Lucide.Users size={18} className="text-indigo-600" />
                  Organization Members ({membersList.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-0">Organization owners and account administrators.</p>
              </div>

              <Link to="/b/members">
                <AntButton size="small" icon={<Lucide.UserPlus size={13} />}>
                  Manage Team
                </AntButton>
              </Link>
            </div>

            <div className="p-6 space-y-3">
              {membersList.filter((m) => m.role === 'OWNER').map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-lg flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AntAvatar style={{ backgroundColor: '#d97706' }} size="small">
                      {member.fullName[0]}
                    </AntAvatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{member.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{member.appUserId}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <AntTag color="gold" className="m-0 font-semibold text-xs">
                      OWNER
                    </AntTag>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corporate Locations & Addresses Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2 m-0">
                  <Lucide.MapPin size={18} className="text-indigo-600" />
                  Corporate Locations & Addresses ({mappedBizAddresses.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-0">Registered headquarters, branch offices, and warehouse addresses.</p>
              </div>
            </div>

            <div className="p-6">
              {mappedBizAddresses.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No corporate addresses registered.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mappedBizAddresses.map((addr) => (
                    <div key={addr.id} className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <AntTag color="purple" className="text-xs font-semibold">{addr.address_type || 'HQ'}</AntTag>
                        {addr.is_primary ? <AntTag color="green">Primary HQ</AntTag> : <AntTag color="default">Branch / Location</AntTag>}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{addr.line1} {addr.line2 ? `, ${addr.line2}` : ''}</div>
                      <div className="text-xs text-slate-500">
                        {addr.city}, {addr.state_province} {addr.postal_code}
                      </div>
                      <div className="text-xs text-indigo-700 font-medium flex items-center gap-1 pt-1 border-t border-indigo-100/60">
                        <Lucide.Globe size={12} /> {addr.country_name || addr.country_code} ({addr.country_code})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
