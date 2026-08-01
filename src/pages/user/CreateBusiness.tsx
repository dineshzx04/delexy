import React, { useState, useEffect, useMemo } from 'react';
import { Card as AntCard, Input as AntInput, Button as AntButton, Tag as AntTag, Select as AntSelect, Upload as AntUpload, message as antMessage, Space as AntSpace } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { businessDb, type BusinessSubmission, type BusinessSubmissionDocument, type Brand, mockParties } from '../../data/business';

const CreateBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { id: submissionIdParam } = useParams<{ id?: string }>();
  const { currentUser } = useWorkspace();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Query DB Tables
  const dbSubmissions = useLiveQuery(() => businessDb.businessSubmissions.toArray()) || [];
  const dbBrands = useLiveQuery(() => businessDb.brands.toArray()) || [];
  const dbParties = useLiveQuery(() => businessDb.parties.toArray()) || [];

  // Available Unclaimed Placeholder Business Parties
  const unclaimedParties = useMemo(() => {
    const pool = dbParties.length > 0 ? dbParties : mockParties;
    return pool.filter(p => p.owner_type === 'BUSINESS' && !p.is_claimed);
  }, [dbParties]);

  // Editing Submission Target
  const existingSubmission = useMemo(() => {
    if (submissionIdParam && submissionIdParam !== 'new') {
      return dbSubmissions.find(s => s.id === submissionIdParam);
    }
    return dbSubmissions.find(s => s.user_id === currentUser?.id && s.status === 'NEEDS_REVISION');
  }, [dbSubmissions, submissionIdParam, currentUser]);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [taxId, setTaxId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  // HQ Address State
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Party Claims State (1:1 Party Target to Claim)
  const [toClaimPartyId, setToClaimPartyId] = useState<string | undefined>(undefined);
  const [toClaimPartyName, setToClaimPartyName] = useState('');
  const [claimMode, setClaimMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Documents State
  const [documents, setDocuments] = useState<BusinessSubmissionDocument[]>([
    {
      id: `doc-init-1`,
      doc_type: 'TAX_CERTIFICATE',
      doc_name: 'XYZ_Tax_Registration_Proof.pdf',
      doc_url: 'https://docs.delexy.com/xyz_tax_proof.pdf',
      file_size: '1.4 MB',
      status: 'PENDING'
    },
    {
      id: `doc-init-2`,
      doc_type: 'BUSINESS_LICENSE',
      doc_name: 'ABC_Certificate_of_Incorporation.pdf',
      doc_url: 'https://docs.delexy.com/abc_incorporation_cert.pdf',
      file_size: '2.1 MB',
      status: 'PENDING'
    }
  ]);

  // Document upload modal simulation inputs
  const [newDocType, setNewDocType] = useState<any>('TRADEMARK_REGISTRATION');
  const [newDocName, setNewDocName] = useState('');

  // Populate state from existing submission if editing or revising
  useEffect(() => {
    if (existingSubmission) {
      setBusinessName(existingSubmission.business_name || '');
      setLegalName(existingSubmission.legal_name || '');
      setWebsite(existingSubmission.website || '');
      setPhone(existingSubmission.phone || '');
      setCountryCode(existingSubmission.country_code || 'US');
      setTaxId(existingSubmission.tax_id || '');
      setRegistrationNumber(existingSubmission.registration_number || '');

      if (existingSubmission.address) {
        setLine1(existingSubmission.address.line1 || '');
        setLine2(existingSubmission.address.line2 || '');
        setCity(existingSubmission.address.city || '');
        setStateProvince(existingSubmission.address.state_province || '');
        setPostalCode(existingSubmission.address.postal_code || '');
      }

      setToClaimPartyId(existingSubmission.to_claim_party_id);
      setToClaimPartyName(existingSubmission.to_claim_party_name || '');
      if (existingSubmission.to_claim_party_id) {
        setClaimMode('EXISTING');
      } else if (existingSubmission.to_claim_party_name) {
        setClaimMode('NEW');
      }
      setDocuments(existingSubmission.documents || []);
    }
  }, [existingSubmission]);

  const isReadOnly = existingSubmission?.status === 'SUBMITTED' || existingSubmission?.status === 'UNDER_REVIEW' || existingSubmission?.status === 'APPROVED';

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/user/dashboard" className="text-slate-500 hover:text-sky-600">User Workspace</Link>, url: '/user/dashboard' },
    { title: <Link to="/user/business-submissions" className="text-slate-500 hover:text-sky-600">Business Submissions</Link>, url: '/user/business-submissions' },
    { title: <span className="text-slate-900 font-semibold">{existingSubmission ? `Application #${existingSubmission.id}` : 'Register Business'}</span> }
  ], [existingSubmission]);

  useBreadcrumb(breadcrumbs);

  // Add sample document helper
  const handleAddDocument = () => {
    if (!newDocName.trim()) {
      antMessage.warning('Please enter a document title.');
      return;
    }
    const newDoc: BusinessSubmissionDocument = {
      id: `doc-${Date.now()}`,
      doc_type: newDocType,
      doc_name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      doc_url: `https://docs.delexy.com/user_uploads/${newDocName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      file_size: '1.5 MB',
      status: 'PENDING'
    };
    setDocuments(prev => [...prev, newDoc]);
    setNewDocName('');
    antMessage.success('Verification proof document attached successfully.');
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Helper to render field rejection alert
  const renderFieldRejectionNotice = (fieldKey: string) => {
    if (!existingSubmission || !existingSubmission.sections) return null;
    const item = existingSubmission.sections[fieldKey];
    if (item && item.status === 'REJECTED' && item.rejection_comment) {
      return (
        <div className="mt-1 text-xs bg-red-50 border border-red-200 rounded p-1.5 text-red-700 font-medium flex items-center gap-1.5">
          <Lucide.AlertCircle size={14} className="shrink-0 text-red-600" />
          <span><strong>Reviewer Comment:</strong> {item.rejection_comment}</span>
        </div>
      );
    }
    return null;
  };

  // Handle Submit Application Action
  const handleSubmitForm = async () => {
    if (!businessName.trim() || !taxId.trim() || !line1.trim() || !toClaimPartyName.trim()) {
      antMessage.error('Please complete all required fields (Business Name, Tax ID, Street Address, Target Party Title).');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const currentRound = existingSubmission ? (existingSubmission.status === 'NEEDS_REVISION' ? existingSubmission.current_round + 1 : existingSubmission.current_round) : 1;
      const subId = existingSubmission ? existingSubmission.id : `bsub-${Date.now().toString().slice(-4)}`;

      // Construct Sections Record
      const sectionsRecord: Record<string, any> = {
        business_name: { field_key: 'business_name', field_label: 'Business Name', section: 'CORE_INFO', value: businessName, status: 'PENDING' },
        legal_name: { field_key: 'legal_name', field_label: 'Legal Entity Name', section: 'CORE_INFO', value: legalName, status: 'PENDING' },
        tax_id: { field_key: 'tax_id', field_label: 'Tax Identification Number', section: 'LEGAL_TAX', value: taxId, status: 'PENDING' },
        registration_number: { field_key: 'registration_number', field_label: 'Registration / License Number', section: 'LEGAL_TAX', value: registrationNumber || 'N/A', status: 'PENDING' },
        address: { field_key: 'address', field_label: 'Corporate HQ Address', section: 'ADDRESS', value: `${line1}, ${city} ${stateProvince} ${postalCode}`, status: 'PENDING' },
        to_claim_party_name: { field_key: 'to_claim_party_name', field_label: 'Target Party Title', section: 'CLAIMED_BRANDS', value: toClaimPartyName, status: 'PENDING' }
      };

      const updatedAudit = [...(existingSubmission?.audit_history || [])];
      updatedAudit.push({
        id: `aud-b-${Date.now()}`,
        round: currentRound,
        actor_id: currentUser?.id || 'usr-curr',
        actor_name: currentUser?.full_name || 'Business Applicant',
        action: 'SUBMITTED',
        notes: `Submitted Round ${currentRound} business registration & party claim application.`,
        timestamp: now
      });

      const submissionRecord: BusinessSubmission = {
        id: subId,
        user_id: currentUser?.id || 'usr-2',
        business_name: businessName,
        legal_name: legalName || businessName,
        website: website || undefined,
        phone: phone || undefined,
        country_code: countryCode,
        tax_id: taxId,
        registration_number: registrationNumber || undefined,
        address: {
          line1,
          line2: line2 || undefined,
          city,
          state_province: stateProvince,
          postal_code: postalCode,
          country_code: countryCode
        },
        to_claim_party_id: toClaimPartyId,
        to_claim_party_name: toClaimPartyName,
        documents: documents.map(d => ({ ...d, status: 'PENDING', rejection_comment: undefined })),
        sections: sectionsRecord,
        status: 'SUBMITTED',
        current_round: currentRound,
        submitted_at: now,
        audit_history: updatedAudit,
        created_at: existingSubmission?.created_at || now,
        updated_at: now
      };

      await businessDb.businessSubmissions.put(submissionRecord);
      antMessage.success(`Business application submitted for platform review (Round ${currentRound})!`);
      navigate('/user/business-submissions');
    } catch (err) {
      antMessage.error('Failed to submit business application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto pb-16 space-y-6">
      {/* Header Navigation Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 mb-0">
            {existingSubmission ? `Business Application #${existingSubmission.id}` : 'Register Enterprise Business & Claim Party'}
          </h1>
          {existingSubmission && (
            <AntTag color={
              existingSubmission.status === 'SUBMITTED' ? 'processing' :
                existingSubmission.status === 'NEEDS_REVISION' ? 'error' :
                  existingSubmission.status === 'APPROVED' ? 'success' : 'default'
            } className="text-xs font-semibold">
              {existingSubmission.status.replace('_', ' ')} (Round {existingSubmission.current_round})
            </AntTag>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-1 mb-0">
          {isReadOnly ? 'Viewing business registration application details (Read-Only Mode).' : 'Provide business entity information, legal tax IDs, claim your 1:1 Party & Brands, attach proof documents, and submit for platform compliance verification.'}
        </p>
      </div>

      {/* Revision Banner Alert if Needs Revision */}
      {existingSubmission?.status === 'NEEDS_REVISION' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-sm text-red-700">
            <Lucide.AlertTriangle size={18} />
            Round {existingSubmission.current_round} Platform Revision Requested
          </div>
          <p className="text-xs text-red-800 mb-0">
            Platform compliance requested corrections on your submission. Review highlighted red fields and rejected documents below, update your details, and click <strong>"Resubmit Round {existingSubmission.current_round + 1}"</strong>.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* SECTION 1: CORE BUSINESS IDENTIFIERS */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.Building size={18} className="text-sky-600" />
              1. Core Business Identifiers
            </div>
          }
          className="border border-gray-200 shadow-sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Business Operating Name <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="e.g. XYZ Enterprises LLC"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
                {renderFieldRejectionNotice('business_name')}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Legal Entity Registered Name <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="e.g. ABC Holdings Inc"
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                />
                {renderFieldRejectionNotice('legal_name')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Corporate Website</label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  prefix={<Lucide.Globe size={14} className="text-gray-400" />}
                  placeholder="https://www.xyz-enterprises.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Primary Phone Number</label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  prefix={<Lucide.Phone size={14} className="text-gray-400" />}
                  placeholder="+1-555-0100"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Registration Country</label>
                <AntSelect
                  size="middle"
                  className="w-full"
                  disabled={isReadOnly}
                  value={countryCode}
                  onChange={val => setCountryCode(val)}
                  options={[
                    { value: 'US', label: 'United States (US)' },
                    { value: 'IN', label: 'India (IN)' },
                    { value: 'GB', label: 'United Kingdom (GB)' },
                    { value: 'SE', label: 'Sweden (SE)' },
                    { value: 'DE', label: 'Germany (DE)' },
                    { value: 'JP', label: 'Japan (JP)' }
                  ]}
                />
              </div>
            </div>
          </div>
        </AntCard>

        {/* SECTION 2: LEGAL REGISTRATION & TAX IDENTIFICATION */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.FileText size={18} className="text-emerald-600" />
              2. Legal & Tax Registration Credentials
            </div>
          }
          className="border border-gray-200 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Tax Identification Number (EIN / VAT / GST) <span className="text-red-500">*</span>
              </label>
              <AntInput
                size="middle"
                disabled={isReadOnly}
                placeholder="Tax Identification Code (e.g. TAX-ID-987654321)"
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
              />
              {renderFieldRejectionNotice('tax_id')}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Company Incorporation / License Number
              </label>
              <AntInput
                size="middle"
                disabled={isReadOnly}
                placeholder="State / National Registration Number (e.g. REG-123456)"
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
              />
            </div>
          </div>
        </AntCard>

        {/* SECTION 3: CORPORATE HEADQUARTERS LOCATION */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.MapPin size={18} className="text-indigo-600" />
              3. Corporate Headquarters Physical Location
            </div>
          }
          className="border border-gray-200 shadow-sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Street Address Line 1 <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="HQ Building, Street Address (e.g. 100 Industrial Parkway)"
                  value={line1}
                  onChange={e => setLine1(e.target.value)}
                />
                {renderFieldRejectionNotice('address')}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Street Address Line 2 (Suite / Unit / Floor)
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="Suite 500, Building B"
                  value={line2}
                  onChange={e => setLine2(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="e.g. Cityville"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  State / Province <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="e.g. State Province"
                  value={stateProvince}
                  onChange={e => setStateProvince(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Postal / ZIP Code <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="e.g. 90001"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <AntSelect
                  size="middle"
                  className="w-full"
                  disabled={isReadOnly}
                  value={countryCode}
                  onChange={val => setCountryCode(val)}
                  options={[
                    { value: 'US', label: 'United States (US)' },
                    { value: 'IN', label: 'India (IN)' },
                    { value: 'GB', label: 'United Kingdom (GB)' },
                    { value: 'SE', label: 'Sweden (SE)' },
                    { value: 'DE', label: 'Germany (DE)' },
                    { value: 'JP', label: 'Japan (JP)' }
                  ]}
                />
              </div>
            </div>
          </div>
        </AntCard>

        {/* SECTION 4: TARGET BUSINESS PARTY CLAIM REQUEST */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.Award size={18} className="text-amber-600" />
              4. Target Business Party Claim Request (1:1 Party)
            </div>
          }
          className="border border-gray-200 shadow-sm"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => { setClaimMode('EXISTING'); setToClaimPartyId(undefined); setToClaimPartyName(''); }}
                className={`flex-1 p-3 rounded-lg border text-left text-xs font-semibold transition-all ${claimMode === 'EXISTING'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lucide.CheckCircle2 size={16} className={claimMode === 'EXISTING' ? 'text-sky-600' : 'text-gray-400'} />
                  <span className="font-bold text-sm">Claim Existing Unclaimed Party</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-0 font-normal">
                  Select an existing verified/placeholder business party registered on the platform to claim ownership.
                </p>
              </button>

              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => { setClaimMode('NEW'); setToClaimPartyId(undefined); setToClaimPartyName(''); }}
                className={`flex-1 p-3 rounded-lg border text-left text-xs font-semibold transition-all ${claimMode === 'NEW'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lucide.PlusCircle size={16} className={claimMode === 'NEW' ? 'text-purple-600' : 'text-gray-400'} />
                  <span className="font-bold text-sm">Register New Business Party</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-0 font-normal">
                  Create a new 1:1 business party entity title if your company is not listed in the platform registry.
                </p>
              </button>
            </div>

            {claimMode === 'EXISTING' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-800">
                  Select Target Unclaimed Party to Claim <span className="text-red-500">*</span>
                </label>
                <AntSelect
                  size="large"
                  disabled={isReadOnly}
                  className="w-full"
                  placeholder="Search and select an unclaimed placeholder business party..."
                  value={toClaimPartyId}
                  onChange={(val) => {
                    setToClaimPartyId(val);
                    const match = unclaimedParties.find(p => p.id === val);
                    if (match) setToClaimPartyName(match.display_name);
                  }}
                >
                  {unclaimedParties.map(p => (
                    <AntSelect.Option key={p.id} value={p.id}>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="font-semibold text-gray-900">{p.display_name}</span>
                        <span className="font-mono text-xs text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">ID: {p.id}</span>
                      </div>
                    </AntSelect.Option>
                  ))}
                </AntSelect>
                {toClaimPartyId && (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 text-xs text-sky-900 flex items-center justify-between">
                    <div>
                      <span className="font-semibold block">Selected Target Party to Claim:</span>
                      <span className="font-bold text-sky-950">{toClaimPartyName}</span>
                    </div>
                    <AntTag color="blue" className="font-mono text-xs">Target ID: {toClaimPartyId}</AntTag>
                  </div>
                )}
                {renderFieldRejectionNotice('to_claim_party_name')}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-800">
                  New Business Party Entity Display Title <span className="text-red-500">*</span>
                </label>
                <AntInput
                  size="middle"
                  disabled={isReadOnly}
                  placeholder="Display Name for New Business Party (e.g. XYZ Commercial Global Party)"
                  value={toClaimPartyName}
                  onChange={e => setToClaimPartyName(e.target.value)}
                />
                <p className="text-[11px] text-gray-500 mt-1 mb-0">
                  Upon approval, this will generate a fresh 1:1 business party entity (`owner_type = 'BUSINESS'`).
                </p>
                {renderFieldRejectionNotice('to_claim_party_name')}
              </div>
            )}
          </div>
        </AntCard>

        {/* SECTION 5: VERIFICATION PROOF DOCUMENTS ATTACHMENT */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.ShieldCheck size={18} className="text-purple-600" />
              5. Mandatory Verification Proof Attachments
            </div>
          }
          className="border border-purple-200 shadow-sm"
        >
          <div className="space-y-4">
            {!isReadOnly && (
              <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200 space-y-2">
                <span className="text-xs font-bold text-purple-900 block">Attach Verification Proof File</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <AntSelect
                    size="small"
                    className="w-full sm:w-48 font-semibold text-xs"
                    value={newDocType}
                    onChange={val => setNewDocType(val)}
                    options={[
                      { value: 'TAX_CERTIFICATE', label: 'Tax Registration Certificate' },
                      { value: 'BUSINESS_LICENSE', label: 'Incorporation / License' },
                      { value: 'TRADEMARK_REGISTRATION', label: 'Trademark Certificate' },
                      { value: 'DEALER_AUTHORIZATION', label: 'Dealer Auth Letter' },
                      { value: 'ID_PROOF', label: 'Government ID Proof' }
                    ]}
                  />
                  <AntInput
                    size="small"
                    placeholder="Document Title (e.g. XYZ_Tax_Proof_2026.pdf)"
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <AntButton
                    size="small"
                    type="primary"
                    icon={<Lucide.Paperclip size={13} />}
                    className="bg-purple-600 hover:bg-purple-700 font-semibold text-xs shrink-0"
                    onClick={handleAddDocument}
                  >
                    Attach Document
                  </AntButton>
                </div>
              </div>
            )}

            {/* Document List Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Attached Verification Proof Files ({documents.length})
              </span>
              {documents.map((doc) => (
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
                        <AntTag color="purple" className="text-[10px] font-mono">
                          {doc.doc_type.replace('_', ' ')}
                        </AntTag>
                        {doc.status === 'REJECTED' && (
                          <AntTag color="error" className="text-[10px] font-mono">REJECTED</AntTag>
                        )}
                        {doc.status === 'APPROVED' && (
                          <AntTag color="success" className="text-[10px] font-mono">APPROVED</AntTag>
                        )}
                      </div>
                      {doc.rejection_comment && (
                        <div className="text-[11px] text-red-600 font-medium mt-0.5">
                          <strong>Rejection Reason:</strong> {doc.rejection_comment}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <AntButton
                      size="small"
                      type="text"
                      danger
                      icon={<Lucide.Trash2 size={14} />}
                      onClick={() => handleRemoveDocument(doc.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </AntCard>
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Lucide.Info size={16} className="text-sky-600 shrink-0" />
          <span>
            {isReadOnly ? 'This application is locked under review or approved.' : 'Ensure required fields (*), 1:1 Party title, and proof documents are attached before submitting.'}
          </span>
        </div>

        <AntSpace className="shrink-0">
          <AntButton onClick={() => navigate('/user/business-submissions')}>
            Back to Directory
          </AntButton>
          {!isReadOnly && (
            <AntButton
              type="primary"
              className="bg-sky-600 hover:bg-sky-700 font-bold"
              loading={isSubmitting}
              onClick={() => handleSubmitForm()}
            >
              {existingSubmission?.status === 'NEEDS_REVISION' ? `Resubmit Round ${existingSubmission.current_round + 1}` : 'Submit for Platform Verification'}
            </AntButton>
          )}
        </AntSpace>
      </div>
    </div>
  );
};

export default CreateBusiness;
