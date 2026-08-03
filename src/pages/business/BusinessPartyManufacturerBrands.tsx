import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Tag,
  Button,
  Badge,
  Modal as AntModal,
  Form as AntForm,
  Input as AntInput,
  Select as AntSelect,
  Tabs as AntTabs,
  Alert as AntAlert,
  Space as AntSpace,
  App as AntApp
} from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { businessDb, type Brand, type BrandSubmission, type Manufacturer, type ManufacturerSubmission } from '../../data/business';

const BusinessPartyManufacturerBrands: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace, currentUser } = useWorkspace();
  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id || 'bus-a';

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Party, Manufacturer & Brands</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Modals state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isMfgModalOpen, setIsMfgModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<BrandSubmission | null>(null);
  const [editingMfgSubmission, setEditingMfgSubmission] = useState<ManufacturerSubmission | null>(null);

  // Forms
  const [brandClaimForm] = AntForm.useForm();
  const [brandCreateForm] = AntForm.useForm();
  const [mfgRegisterForm] = AntForm.useForm();
  const [mfgClaimForm] = AntForm.useForm();
  const [revisionEditForm] = AntForm.useForm();
  const [mfgRevisionEditForm] = AntForm.useForm();

  // 1. Fetch Business Party Record strictly from Dexie DB
  const bizRecord = useLiveQuery(
    async () => await businessDb.parties
      .where('owner_id').equals(currentBizId)
      .filter((p) => p.owner_type === 'BUSINESS')
      .first(),
    [currentBizId]
  );

  // 2. Fetch Manufacturer Account for this Party
  const manufacturer = useLiveQuery(
    async () => (bizRecord ? await businessDb.manufacturers.where('manufacturer_party_id').equals(bizRecord.id).first() : undefined),
    [bizRecord?.id]
  );

  // 3. Fetch Brands Owned / Claimed by this Party
  const ownedBrandParties = useLiveQuery(
    async () => {
      if (!bizRecord) return [];
      const bParties = await businessDb.brandParties.where('party_id').equals(bizRecord.id).toArray();
      const allBrands = await businessDb.brands.toArray();
      return bParties.map((bp) => ({
        ...bp,
        brand: allBrands.find((b) => b.id === bp.brand_id),
      }));
    },
    [bizRecord?.id]
  ) || [];

  // 4. Fetch All Platform Brands for Claim Dropdown
  const catalogBrands = useLiveQuery(() => businessDb.brands.toArray()) || [];

  // 5. Fetch Brand Submissions for this Party strictly from Dexie DB
  const partyBrandSubmissions = useLiveQuery(
    async () => {
      if (!bizRecord) return [];
      return await businessDb.brandSubmissions.where('party_id').equals(bizRecord.id).toArray();
    },
    [bizRecord?.id]
  ) || [];

  // 6. Fetch Manufacturer Submissions for this Party strictly from Dexie DB
  const partyMfgSubmissions = useLiveQuery(
    async () => {
      if (!bizRecord) return [];
      return await businessDb.manufacturerSubmissions.where('party_id').equals(bizRecord.id).toArray();
    },
    [bizRecord?.id]
  ) || [];

  // 7. Fetch Unclaimed Placeholder Parties for Manufacturer Claim
  const unclaimedParties = useLiveQuery(
    async () => await businessDb.parties.filter((p) => p.is_claimed === false).toArray()
  ) || [];

  // Submit Brand Claim Request
  const handleClaimExistingBrand = async (values: { brand_id: string }) => {
    if (!bizRecord) return;
    const selectedBrand = catalogBrands.find((b) => b.id === values.brand_id);
    if (!selectedBrand) return;

    const newSub: BrandSubmission = {
      id: `bsub-${Date.now()}`,
      party_id: bizRecord.id,
      user_id: currentUser?.id || 'usr-1',
      submission_type: 'CLAIM',
      brand_id: selectedBrand.id,
      brand_name: selectedBrand.name,
      brand_slug: selectedBrand.slug,
      logo_url: selectedBrand.logo_url,
      manufacturer_party_id: bizRecord.id,
      manufacturer_company_name: manufacturer?.company_name || bizRecord.display_name,
      status: 'SUBMITTED',
      current_round: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await businessDb.brandSubmissions.put(newSub);
    antMessage.success(`Brand claim request for ${selectedBrand.name} submitted for Platform review.`);
    brandClaimForm.resetFields();
    setIsBrandModalOpen(false);
  };

  // Submit New Brand Creation Request
  const handleCreateNewBrand = async (values: { brand_name: string; brand_slug: string; logo_url?: string }) => {
    if (!bizRecord) return;

    const newSub: BrandSubmission = {
      id: `bsub-${Date.now()}`,
      party_id: bizRecord.id,
      user_id: currentUser?.id || 'usr-1',
      submission_type: 'CREATE_NEW',
      brand_name: values.brand_name,
      brand_slug: values.brand_slug || values.brand_name.toLowerCase().replace(/\s+/g, '-'),
      logo_url: values.logo_url,
      manufacturer_party_id: bizRecord.id,
      manufacturer_company_name: manufacturer?.company_name || bizRecord.display_name,
      status: 'SUBMITTED',
      current_round: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await businessDb.brandSubmissions.put(newSub);
    antMessage.success(`New brand creation request for "${values.brand_name}" submitted for Platform review.`);
    brandCreateForm.resetFields();
    setIsBrandModalOpen(false);
  };

  // Resubmit Brand Request (Round 2+) after Revision Request
  const handleResubmitRevision = async (values: { brand_name: string; brand_slug: string; logo_url?: string }) => {
    if (!editingSubmission) return;

    const updatedSub: BrandSubmission = {
      ...editingSubmission,
      brand_name: values.brand_name,
      brand_slug: values.brand_slug,
      logo_url: values.logo_url,
      status: 'SUBMITTED',
      current_round: editingSubmission.current_round + 1,
      rejection_comments: undefined,
      updated_at: new Date().toISOString(),
    };

    await businessDb.brandSubmissions.put(updatedSub);
    antMessage.success(`Submission updated and resubmitted for Round ${updatedSub.current_round} review!`);
    setEditingSubmission(null);
  };

  // Register New Manufacturer Profile (Submits for Platform Review)
  const handleRegisterManufacturer = async (values: { company_name: string; registration_number?: string }) => {
    if (!bizRecord) return;

    const newSub: ManufacturerSubmission = {
      id: `msub-${Date.now()}`,
      party_id: bizRecord.id,
      user_id: currentUser?.id || 'usr-1',
      submission_type: 'REGISTER_NEW',
      company_name: values.company_name,
      registration_number: values.registration_number,
      status: 'SUBMITTED',
      current_round: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await businessDb.manufacturerSubmissions.put(newSub);
    antMessage.success(`Manufacturer account registration request for "${values.company_name}" submitted for Platform Admin review.`);
    mfgRegisterForm.resetFields();
    setIsMfgModalOpen(false);
  };

  // Claim Existing Placeholder Manufacturer / Party (Submits for Platform Review)
  const handleClaimManufacturerParty = async (values: { target_party_id: string; notes?: string }) => {
    if (!bizRecord) return;
    const targetParty = unclaimedParties.find((p) => p.id === values.target_party_id);

    const newSub: ManufacturerSubmission = {
      id: `msub-${Date.now()}`,
      party_id: bizRecord.id,
      user_id: currentUser?.id || 'usr-1',
      submission_type: 'CLAIM_PARTY',
      company_name: targetParty?.display_name || values.target_party_id,
      target_party_id: values.target_party_id,
      status: 'SUBMITTED',
      current_round: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await businessDb.manufacturerSubmissions.put(newSub);
    antMessage.success('Manufacturer Party claim request submitted for Platform Admin review!');
    mfgClaimForm.resetFields();
    setIsMfgModalOpen(false);
  };

  // Resubmit Manufacturer Request (Round 2+) after Revision Request
  const handleResubmitMfgRevision = async (values: { company_name: string; registration_number?: string }) => {
    if (!editingMfgSubmission) return;

    const updatedSub: ManufacturerSubmission = {
      ...editingMfgSubmission,
      company_name: values.company_name,
      registration_number: values.registration_number,
      status: 'SUBMITTED',
      current_round: editingMfgSubmission.current_round + 1,
      rejection_comments: undefined,
      updated_at: new Date().toISOString(),
    };

    await businessDb.manufacturerSubmissions.put(updatedSub);
    antMessage.success(`Manufacturer submission updated and resubmitted for Round ${updatedSub.current_round} review!`);
    setEditingMfgSubmission(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lucide.Building2 className="text-indigo-600" size={26} />
            Party, Manufacturer & Brand Assets
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your 1:1 Corporate Party identity, Manufacturer profile, and owned/claimed Brand assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!manufacturer && (
            <Button
              type="default"
              icon={<Lucide.Factory size={16} />}
              onClick={() => setIsMfgModalOpen(true)}
              className="border-sky-600 text-sky-700 hover:text-sky-800 hover:border-sky-700 font-medium"
            >
              Register / Claim Manufacturer
            </Button>
          )}
          <Button
            type="primary"
            icon={<Lucide.PlusCircle size={16} />}
            onClick={() => setIsBrandModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 font-medium"
          >
            Claim / Create Brand
          </Button>
        </div>
      </div>

      {/* 1:1 Party Identity Banner */}
      <Card className="shadow-sm border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {bizRecord?.display_name?.charAt(0) || 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">{bizRecord?.display_name || 'Business Party'}</h2>
                {bizRecord?.is_verified && <Tag color="green">Verified Party</Tag>}
                {bizRecord?.is_claimed ? <Tag color="blue">Claimed</Tag> : <Tag color="orange">Unclaimed</Tag>}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 mb-0">
                Party ID: <span className="font-semibold text-slate-700">{bizRecord?.id || 'N/A'}</span> | Owner ID: <span className="font-semibold text-slate-700">{bizRecord?.owner_id || currentBizId}</span>
              </p>
            </div>
          </div>
          <Tag color="purple" className="px-3 py-1 text-sm font-semibold">
            {bizRecord?.owner_type || 'BUSINESS'} PARTY
          </Tag>
        </div>
      </Card>

      {/* Manufacturer Account Section (Single-Manufacturer Constraint) */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lucide.Factory className="text-sky-600" size={20} />
              Manufacturer Account Profile (1 Party : 1 Manufacturer)
            </div>
            {manufacturer && <Tag color="green" className="font-semibold">REGISTERED & ACTIVE</Tag>}
          </div>
        }
        className="shadow-sm"
      >
        {manufacturer ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Company Name</span>
              <span className="text-base font-semibold text-slate-800">{manufacturer.company_name}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Registration Number</span>
              <span className="text-base font-mono font-semibold text-slate-800">{manufacturer.registration_number || 'N/A'}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Linked Party ID</span>
              <span className="text-sm font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                {manufacturer.manufacturer_party_id}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Lucide.Factory className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No Manufacturer account registered for this Business Party.</p>
            <Button
              size="small"
              type="primary"
              onClick={() => setIsMfgModalOpen(true)}
              className="mt-3 bg-sky-600"
            >
              Register / Claim Manufacturer Account
            </Button>
          </div>
        )}
      </Card>

      {/* Manufacturer Onboarding & Revision Tracker Pipeline Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lucide.GitPullRequest className="text-sky-600" size={20} />
              Manufacturer Onboarding & Revision Submissions Pipeline ({partyMfgSubmissions.length})
            </div>
          </div>
        }
        className="shadow-sm"
      >
        {partyMfgSubmissions.length > 0 ? (
          <div className="space-y-4">
            {partyMfgSubmissions.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border transition-all ${
                  sub.status === 'NEEDS_REVISION'
                    ? 'border-amber-300 bg-amber-50/40'
                    : sub.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-sky-100 text-sky-700 font-bold text-sm">
                      {sub.submission_type === 'CLAIM_PARTY' ? 'CLAIM' : 'REGISTER'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base mb-0">{sub.company_name}</h4>
                        <Tag color={sub.submission_type === 'CLAIM_PARTY' ? 'blue' : 'cyan'} className="text-[10px] font-mono">
                          {sub.submission_type}
                        </Tag>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mb-0">
                        Submission ID: {sub.id} | Round: {sub.current_round} | Reg: {sub.registration_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag
                      color={
                        sub.status === 'APPROVED'
                          ? 'success'
                          : sub.status === 'NEEDS_REVISION'
                          ? 'warning'
                          : sub.status === 'REJECTED'
                          ? 'error'
                          : 'processing'
                      }
                      className="font-bold px-2.5 py-1 text-xs"
                    >
                      {sub.status === 'NEEDS_REVISION' ? 'REVISION REQUESTED' : sub.status}
                    </Tag>

                    {sub.status === 'NEEDS_REVISION' && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<Lucide.Edit3 size={13} />}
                        onClick={() => {
                          setEditingMfgSubmission(sub);
                          mfgRevisionEditForm.setFieldsValue({
                            company_name: sub.company_name,
                            registration_number: sub.registration_number,
                          });
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Edit & Resubmit (Round {sub.current_round + 1})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Revision Banner if Platform requested changes */}
                {sub.status === 'NEEDS_REVISION' && (
                  <div className="mt-3 p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Lucide.AlertTriangle size={15} className="text-amber-600" />
                      Platform Auditor Feedback (Round {sub.current_round}):
                    </div>
                    <p className="mb-0 text-amber-900 font-medium">
                      {sub.rejection_comments || 'Please review and update corporate manufacturer registration details.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No manufacturer onboarding submissions currently in progress.
          </div>
        )}
      </Card>

      {/* Brands Owned & Claimed Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lucide.Award className="text-amber-500" size={20} />
              Active Verified Brands ({ownedBrandParties.length})
            </div>
          </div>
        }
        className="shadow-sm"
      >
        {ownedBrandParties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownedBrandParties.map((bp) => (
              <div key={bp.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {bp.brand?.logo_url ? (
                      <img src={bp.brand.logo_url} alt={bp.brand.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        {bp.brand?.name?.charAt(0) || 'B'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{bp.brand?.name || 'Brand'}</h3>
                      <span className="text-xs text-slate-400 font-mono">{bp.brand?.slug}</span>
                    </div>
                  </div>
                  <Tag color={bp.claim_status === 'VERIFIED' ? 'green' : 'gold'} className="font-medium text-xs">
                    {bp.claim_status}
                  </Tag>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Claim Status:</span>
                  <Badge status={bp.claim_status === 'VERIFIED' ? 'success' : 'processing'} text={<span className="font-semibold text-slate-700">{bp.claim_status === 'VERIFIED' ? 'Verified Claim' : 'Claim ' + bp.claim_status}</span>} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Lucide.Award className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No Brands claimed or owned by this Business Party.</p>
          </div>
        )}
      </Card>

      {/* Brand Submissions & Revision Tracker Pipeline Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lucide.GitPullRequest className="text-indigo-600" size={20} />
              Brand Onboarding & Revision Submissions Pipeline ({partyBrandSubmissions.length})
            </div>
          </div>
        }
        className="shadow-sm"
      >
        {partyBrandSubmissions.length > 0 ? (
          <div className="space-y-4">
            {partyBrandSubmissions.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border transition-all ${
                  sub.status === 'NEEDS_REVISION'
                    ? 'border-amber-300 bg-amber-50/40'
                    : sub.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm">
                      {sub.submission_type === 'CLAIM' ? 'CLAIM' : 'NEW'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base mb-0">{sub.brand_name}</h4>
                        <Tag color={sub.submission_type === 'CLAIM' ? 'blue' : 'purple'} className="text-[10px] font-mono">
                          {sub.submission_type}
                        </Tag>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mb-0">
                        Submission ID: {sub.id} | Round: {sub.current_round} | Created: {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag
                      color={
                        sub.status === 'APPROVED'
                          ? 'success'
                          : sub.status === 'NEEDS_REVISION'
                          ? 'warning'
                          : sub.status === 'REJECTED'
                          ? 'error'
                          : 'processing'
                      }
                      className="font-bold px-2.5 py-1 text-xs"
                    >
                      {sub.status === 'NEEDS_REVISION' ? 'REVISION REQUESTED' : sub.status}
                    </Tag>

                    {sub.status === 'NEEDS_REVISION' && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<Lucide.Edit3 size={13} />}
                        onClick={() => {
                          setEditingSubmission(sub);
                          revisionEditForm.setFieldsValue({
                            brand_name: sub.brand_name,
                            brand_slug: sub.brand_slug,
                            logo_url: sub.logo_url,
                          });
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Edit & Resubmit (Round {sub.current_round + 1})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Revision Banner if Platform requested changes */}
                {sub.status === 'NEEDS_REVISION' && (
                  <div className="mt-3 p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Lucide.AlertTriangle size={15} className="text-amber-600" />
                      Platform Auditor Feedback (Round {sub.current_round}):
                    </div>
                    <p className="mb-0 text-amber-900 font-medium">
                      {sub.rejection_comments || 'Please review and update requested brand details and logo asset.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No brand onboarding submissions currently in progress.
          </div>
        )}
      </Card>

      {/* MODAL 1: Claim or Create Brand */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
            <Lucide.Award className="text-indigo-600" size={22} />
            <span>Onboard Brand Asset</span>
          </div>
        }
        open={isBrandModalOpen}
        onCancel={() => setIsBrandModalOpen(false)}
        footer={null}
        destroyOnClose
        width={580}
      >
        <AntTabs
          defaultActiveKey="claim"
          items={[
            {
              key: 'claim',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <Lucide.Search size={16} /> Claim Existing Brand
                </span>
              ),
              children: (
                <AntForm
                  form={brandClaimForm}
                  layout="vertical"
                  onFinish={handleClaimExistingBrand}
                  className="pt-2 space-y-4"
                >
                  <AntAlert
                    message="Claim Catalog Brand"
                    description="Select an existing brand registered in the Platform catalog to claim co-claimant ownership for your Business Party."
                    type="info"
                    showIcon
                    className="mb-4 text-xs"
                  />

                  <AntForm.Item
                    name="brand_id"
                    label="Select Existing Brand"
                    rules={[{ required: true, message: 'Please select a brand' }]}
                  >
                    <AntSelect
                      placeholder="Search catalog brands..."
                      showSearch
                      optionFilterProp="children"
                      options={catalogBrands.map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.slug})`,
                      }))}
                    />
                  </AntForm.Item>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button onClick={() => setIsBrandModalOpen(false)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" className="bg-indigo-600">
                      Submit Brand Claim Request
                    </Button>
                  </div>
                </AntForm>
              ),
            },
            {
              key: 'create',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <Lucide.PlusCircle size={16} /> Create New Brand
                </span>
              ),
              children: (
                <AntForm
                  form={brandCreateForm}
                  layout="vertical"
                  onFinish={handleCreateNewBrand}
                  className="pt-2 space-y-4"
                >
                  <AntAlert
                    message="New Brand Creation"
                    description="Submit a request for a brand not currently in the platform catalog. This brand will be linked to your Business Party and Manufacturer Profile."
                    type="warning"
                    showIcon
                    className="mb-4 text-xs"
                  />

                  <AntForm.Item
                    name="brand_name"
                    label="Brand Name"
                    rules={[{ required: true, message: 'Brand name is required' }]}
                  >
                    <AntInput placeholder="e.g. Acme Industrial Solutions" />
                  </AntForm.Item>

                  <AntForm.Item
                    name="brand_slug"
                    label="Brand Slug"
                    rules={[{ required: true, message: 'Brand slug is required' }]}
                  >
                    <AntInput placeholder="e.g. acme-industrial" />
                  </AntForm.Item>

                  <AntForm.Item
                    name="logo_url"
                    label="Brand Logo Asset URL (Optional)"
                  >
                    <AntInput placeholder="https://example.com/logo.png" />
                  </AntForm.Item>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button onClick={() => setIsBrandModalOpen(false)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" className="bg-indigo-600">
                      Submit New Brand Request
                    </Button>
                  </div>
                </AntForm>
              ),
            },
          ]}
        />
      </AntModal>

      {/* MODAL 2: Register or Claim Manufacturer */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
            <Lucide.Factory className="text-sky-600" size={22} />
            <span>Manufacturer Account Setup</span>
          </div>
        }
        open={isMfgModalOpen}
        onCancel={() => setIsMfgModalOpen(false)}
        footer={null}
        destroyOnClose
        width={580}
      >
        <AntTabs
          defaultActiveKey="register"
          items={[
            {
              key: 'register',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <Lucide.PlusCircle size={16} /> Register New Manufacturer Profile
                </span>
              ),
              children: (
                <AntForm
                  form={mfgRegisterForm}
                  layout="vertical"
                  onFinish={handleRegisterManufacturer}
                  className="pt-2 space-y-4"
                >
                  <AntAlert
                    message="Single-Manufacturer Constraint"
                    description={`Your Party (${bizRecord?.display_name || 'Business'}) will be linked 1:1 to this Manufacturer profile. Existing HQ addresses attached to Party ID (${bizRecord?.id}) are automatically reused.`}
                    type="info"
                    showIcon
                    className="mb-4 text-xs"
                  />

                  <AntForm.Item
                    name="company_name"
                    label="Manufacturer Registered Company Name"
                    initialValue={bizRecord?.display_name}
                    rules={[{ required: true, message: 'Company name is required' }]}
                  >
                    <AntInput placeholder="e.g. Samsung Electronics Manufacturing Ltd." />
                  </AntForm.Item>

                  <AntForm.Item
                    name="registration_number"
                    label="Corporate Registration / License Number"
                  >
                    <AntInput placeholder="e.g. REG-889977" />
                  </AntForm.Item>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button onClick={() => setIsMfgModalOpen(false)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" className="bg-sky-600">
                      Register Manufacturer Account
                    </Button>
                  </div>
                </AntForm>
              ),
            },
            {
              key: 'claim_party',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <Lucide.ShieldCheck size={16} /> Claim Existing Unclaimed Manufacturer Party
                </span>
              ),
              children: (
                <AntForm
                  form={mfgClaimForm}
                  layout="vertical"
                  onFinish={handleClaimManufacturerParty}
                  className="pt-2 space-y-4"
                >
                  <AntAlert
                    message="Party Claim Onboarding"
                    description="Claim an existing unclaimed placeholder manufacturer party entry in the platform registry."
                    type="warning"
                    showIcon
                    className="mb-4 text-xs"
                  />

                  <AntForm.Item
                    name="target_party_id"
                    label="Select Unclaimed Manufacturer Party"
                    rules={[{ required: true, message: 'Please select a party to claim' }]}
                  >
                    <AntSelect
                      placeholder="Select unclaimed party..."
                      options={unclaimedParties.map((p) => ({
                        value: p.id,
                        label: `${p.display_name} (${p.id})`,
                      }))}
                    />
                  </AntForm.Item>

                  <AntForm.Item
                    name="notes"
                    label="Claim Authorization Notes"
                  >
                    <AntInput.TextArea rows={3} placeholder="Describe legal authorization or ownership documentation details..." />
                  </AntForm.Item>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button onClick={() => setIsMfgModalOpen(false)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" className="bg-sky-600">
                      Submit Party Claim Request
                    </Button>
                  </div>
                </AntForm>
              ),
            },
          ]}
        />
      </AntModal>

      {/* MODAL 3: Revision Resubmit Modal (Round 2+) */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
            <Lucide.Edit3 className="text-amber-600" size={22} />
            <span>Update Submission & Resubmit (Round {(editingSubmission?.current_round || 1) + 1})</span>
          </div>
        }
        open={Boolean(editingSubmission)}
        onCancel={() => setEditingSubmission(null)}
        footer={null}
        destroyOnClose
        width={580}
      >
        <AntForm
          form={revisionEditForm}
          layout="vertical"
          onFinish={handleResubmitRevision}
          className="pt-2 space-y-4"
        >
          {editingSubmission?.rejection_comments && (
            <AntAlert
              message="Platform Auditor Feedback:"
              description={editingSubmission.rejection_comments}
              type="warning"
              showIcon
              className="mb-4 text-xs"
            />
          )}

          <AntForm.Item
            name="brand_name"
            label="Brand Name"
            rules={[{ required: true, message: 'Brand name is required' }]}
          >
            <AntInput />
          </AntForm.Item>

          <AntForm.Item
            name="brand_slug"
            label="Brand Slug"
            rules={[{ required: true, message: 'Brand slug is required' }]}
          >
            <AntInput />
          </AntForm.Item>

          <AntForm.Item
            name="logo_url"
            label="Brand Logo Asset URL"
          >
            <AntInput />
          </AntForm.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setEditingSubmission(null)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-amber-600 hover:bg-amber-700">
              Resubmit Request for Review
            </Button>
          </div>
        </AntForm>
      </AntModal>

      {/* MODAL 4: Manufacturer Revision Resubmit Modal (Round 2+) */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
            <Lucide.Edit3 className="text-amber-600" size={22} />
            <span>Update Manufacturer Request & Resubmit (Round {(editingMfgSubmission?.current_round || 1) + 1})</span>
          </div>
        }
        open={Boolean(editingMfgSubmission)}
        onCancel={() => setEditingMfgSubmission(null)}
        footer={null}
        destroyOnClose
        width={580}
      >
        <AntForm
          form={mfgRevisionEditForm}
          layout="vertical"
          onFinish={handleResubmitMfgRevision}
          className="pt-2 space-y-4"
        >
          {editingMfgSubmission?.rejection_comments && (
            <AntAlert
              message="Platform Auditor Feedback:"
              description={editingMfgSubmission.rejection_comments}
              type="warning"
              showIcon
              className="mb-4 text-xs"
            />
          )}

          <AntForm.Item
            name="company_name"
            label="Manufacturer Company Name"
            rules={[{ required: true, message: 'Company name is required' }]}
          >
            <AntInput />
          </AntForm.Item>

          <AntForm.Item
            name="registration_number"
            label="Corporate Registration / License Number"
          >
            <AntInput />
          </AntForm.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setEditingMfgSubmission(null)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-amber-600 hover:bg-amber-700">
              Resubmit Request for Review
            </Button>
          </div>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default BusinessPartyManufacturerBrands;
