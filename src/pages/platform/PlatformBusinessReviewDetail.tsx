import React, { useState, useEffect, useMemo } from 'react';
import { Card as AntCard, Button as AntButton, Tag as AntTag, Input as AntInput, Modal as AntModal, message as antMessage, Space as AntSpace, Progress as AntProgress } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { businessDb, type BusinessSubmission, type BusinessSubmissionSectionItem, type BusinessSubmissionDocument, type Party, type PartyClaim } from '../../data/business';
import { userDb, type Business as UserBusiness, type Address as UserAddress, type BusinessMembership } from '../../data/user';

const PlatformBusinessReviewDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useWorkspace();

  const [isSaving, setIsSaving] = useState(false);

  // Live Query DB Tables
  const submissions = useLiveQuery(() => businessDb.businessSubmissions.toArray()) || [];
  const submission = useMemo(() => submissions.find(s => s.id === id), [submissions, id]);

  // Section verification state & Documents verification state
  const [sectionsState, setSectionsState] = useState<Record<string, BusinessSubmissionSectionItem>>({});
  const [documentsState, setDocumentsState] = useState<BusinessSubmissionDocument[]>([]);

  // Rejection modal state
  const [rejectingKey, setRejectingKey] = useState<{ type: 'SECTION' | 'DOC'; id: string } | null>(null);
  const [rejectionCommentInput, setRejectionCommentInput] = useState('');

  // Normalize sections to guarantee all 6 standard fields exist
  const initialSections = useMemo(() => {
    if (!submission) return {};
    const defaultFields: Record<string, { label: string; section: any; value: any }> = {
      business_name: { label: 'Business Operating Title', section: 'CORE_INFO', value: submission.business_name },
      legal_name: { label: 'Legal Entity Registered Name', section: 'CORE_INFO', value: submission.legal_name },
      tax_id: { label: 'Tax Identification Number', section: 'LEGAL_TAX', value: submission.tax_id },
      registration_number: { label: 'Registration / License Number', section: 'LEGAL_TAX', value: submission.registration_number || 'N/A' },
      address: { label: 'Corporate HQ Address', section: 'ADDRESS', value: `${submission.address?.line1 || ''}, ${submission.address?.city || ''}` },
      to_claim_party_name: { label: 'Target Business Party Title', section: 'CLAIMED_BRANDS', value: submission.to_claim_party_name }
    };

    const normalized: Record<string, BusinessSubmissionSectionItem> = { ...(submission.sections || {}) };
    Object.keys(defaultFields).forEach(key => {
      if (!normalized[key]) {
        normalized[key] = {
          field_key: key,
          field_label: defaultFields[key].label,
          section: defaultFields[key].section,
          value: defaultFields[key].value,
          status: 'PENDING'
        };
      }
    });
    return normalized;
  }, [submission]);

  // Synchronize local review state on load
  useEffect(() => {
    if (submission) {
      setSectionsState(initialSections);
      setDocumentsState(submission.documents || []);
    }
  }, [submission, initialSections]);

  const isReviewReadOnly = submission?.status !== 'SUBMITTED' && submission?.status !== 'UNDER_REVIEW';

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600">Platform Admin</Link>, url: '/p/dashboard' },
    { title: <Link to="/p/business-reviews" className="text-gray-500 hover:text-sky-600">Business Queue</Link>, url: '/p/business-reviews' },
    { title: <span className="text-gray-900 font-semibold">{submission ? `Audit #${submission.id}` : 'Review Detail'}</span> }
  ], [submission]);

  useBreadcrumb(breadcrumbs);

  // Verification Stats Calculation
  const totalSectionItems = Object.keys(sectionsState).length + documentsState.length;

  const approvedCount = Object.values(sectionsState).filter(s => s.status === 'APPROVED').length + documentsState.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = Object.values(sectionsState).filter(s => s.status === 'REJECTED').length + documentsState.filter(d => d.status === 'REJECTED').length;
  const pendingCount = Object.values(sectionsState).filter(s => s.status === 'PENDING').length + documentsState.filter(d => d.status === 'PENDING').length;

  const percentApproved = totalSectionItems > 0 ? Math.round((approvedCount / totalSectionItems) * 100) : 0;

  // Unsaved changes detection
  const hasUnsavedChanges = useMemo(() => {
    if (!submission) return false;
    return JSON.stringify(sectionsState) !== JSON.stringify(initialSections) ||
      JSON.stringify(documentsState) !== JSON.stringify(submission.documents || []);
  }, [submission, sectionsState, initialSections, documentsState]);

  // Section / Doc Approval Handler
  const handleApproveItem = (type: 'SECTION' | 'DOC', itemKey: string) => {
    if (type === 'SECTION') {
      setSectionsState(prev => ({
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          status: 'APPROVED',
          rejection_comment: undefined
        }
      }));
    } else {
      setDocumentsState(prev => prev.map(d => d.id === itemKey ? { ...d, status: 'APPROVED', rejection_comment: undefined } : d));
    }
    antMessage.success('Marked item as APPROVED.');
  };

  // Section / Doc Revert to Pending Handler
  const handleResetItem = (type: 'SECTION' | 'DOC', itemKey: string) => {
    if (type === 'SECTION') {
      setSectionsState(prev => ({
        ...prev,
        [itemKey]: {
          ...(prev[itemKey] || { field_key: itemKey, field_label: itemKey, section: 'CORE_INFO', value: '' }),
          status: 'PENDING',
          rejection_comment: undefined
        }
      }));
    } else {
      setDocumentsState(prev => prev.map(d => d.id === itemKey ? { ...d, status: 'PENDING', rejection_comment: undefined } : d));
    }
    antMessage.info('Reverted item back to PENDING review.');
  };

  // Rejection Confirmation Handler
  const handleConfirmRejection = () => {
    if (!rejectingKey) return;
    if (!rejectionCommentInput.trim()) {
      antMessage.error('Please enter a clear explanation for rejecting this item.');
      return;
    }

    if (rejectingKey.type === 'SECTION') {
      setSectionsState(prev => ({
        ...prev,
        [rejectingKey.id]: {
          ...prev[rejectingKey.id],
          status: 'REJECTED',
          rejection_comment: rejectionCommentInput.trim()
        }
      }));
    } else {
      setDocumentsState(prev => prev.map(d => d.id === rejectingKey.id ? { ...d, status: 'REJECTED', rejection_comment: rejectionCommentInput.trim() } : d));
    }

    setRejectingKey(null);
    setRejectionCommentInput('');
    antMessage.warning('Marked item as REJECTED with comments.');
  };

  // Bulk approve all pending items
  const handleBulkApprovePending = () => {
    setSectionsState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k].status === 'PENDING') {
          next[k] = { ...next[k], status: 'APPROVED' };
        }
      });
      return next;
    });
    setDocumentsState(prev => prev.map(d => d.status === 'PENDING' ? { ...d, status: 'APPROVED' } : d));
    antMessage.success('Marked all pending section items and documents as APPROVED.');
  };

  // Bulk revert all items back to pending
  const handleBulkResetAll = () => {
    setSectionsState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = { ...next[k], status: 'PENDING', rejection_comment: undefined };
      });
      return next;
    });
    setDocumentsState(prev => prev.map(d => ({ ...d, status: 'PENDING', rejection_comment: undefined })));
    antMessage.info('Reverted all section items and documents back to PENDING review.');
  };

  // Render contextual action buttons per item based on current status
  const renderItemActionButtons = (type: 'SECTION' | 'DOC', itemKey: string, currentStatus?: string) => {
    if (isReviewReadOnly) return null;
    const status = currentStatus || 'PENDING';

    if (status === 'APPROVED') {
      return (
        <AntSpace size="small">
          <AntButton
            size="small"
            type="default"
            className="text-[10px] text-slate-700 border-slate-300 hover:bg-slate-100 font-semibold"
            icon={<Lucide.RotateCcw size={11} />}
            onClick={() => handleResetItem(type, itemKey)}
          >
            Revert
          </AntButton>
          <AntButton
            size="small"
            danger
            className="text-[10px] font-semibold"
            onClick={() => setRejectingKey({ type, id: itemKey })}
          >
            Reject
          </AntButton>
        </AntSpace>
      );
    }

    if (status === 'REJECTED') {
      return (
        <AntSpace size="small">
          <AntButton
            size="small"
            type="primary"
            className="bg-emerald-600 text-[10px] font-semibold"
            onClick={() => handleApproveItem(type, itemKey)}
          >
            Approve
          </AntButton>
          <AntButton
            size="small"
            type="default"
            className="text-[10px] text-slate-700 border-slate-300 hover:bg-slate-100 font-semibold"
            icon={<Lucide.RotateCcw size={11} />}
            onClick={() => handleResetItem(type, itemKey)}
          >
            Revert
          </AntButton>
        </AntSpace>
      );
    }

    // Default PENDING status
    return (
      <AntSpace size="small">
        <AntButton
          size="small"
          type="primary"
          className="bg-emerald-600 text-[10px] font-semibold"
          onClick={() => handleApproveItem(type, itemKey)}
        >
          Approve
        </AntButton>
        <AntButton
          size="small"
          danger
          className="text-[10px] font-semibold"
          onClick={() => setRejectingKey({ type, id: itemKey })}
        >
          Reject
        </AntButton>
      </AntSpace>
    );
  };

  // Save Progress Action
  const handleSaveProgress = async () => {
    if (!submission) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedRecord: BusinessSubmission = {
        ...submission,
        status: submission.status === 'SUBMITTED' ? 'UNDER_REVIEW' : submission.status,
        sections: sectionsState,
        documents: documentsState,
        updated_at: now
      };

      await businessDb.businessSubmissions.put(updatedRecord);
      antMessage.success('Review progress saved successfully.');
    } catch (err) {
      antMessage.error('Failed to save review progress.');
    } finally {
      setIsSaving(false);
    }
  };

  // Request Revision Action
  const handleRequestRevision = async () => {
    if (!submission) return;
    if (pendingCount > 0) {
      antMessage.warning('Please complete review of all pending items before requesting revision.');
      return;
    }
    if (rejectedCount === 0) {
      antMessage.error('Please reject at least 1 section item or document with a comment before requesting revision.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedAudit = [...(submission.audit_history || [])];
      updatedAudit.push({
        id: `aud-b-${Date.now()}`,
        round: submission.current_round,
        actor_id: currentUser?.id || 'usr-admin',
        actor_name: currentUser?.full_name || 'Platform Compliance Admin',
        action: 'REQUESTED_REVISION',
        notes: `Rejected ${rejectedCount} field(s)/document(s) with comments. Requested Round ${submission.current_round} revision.`,
        timestamp: now
      });

      const updatedRecord: BusinessSubmission = {
        ...submission,
        status: 'NEEDS_REVISION',
        sections: sectionsState,
        documents: documentsState,
        audit_history: updatedAudit,
        updated_at: now
      };

      await businessDb.businessSubmissions.put(updatedRecord);
      antMessage.success(`Revision request sent to applicant for Round ${submission.current_round}.`);
      navigate('/p/business-reviews');
    } catch (err) {
      antMessage.error('Failed to request revision.');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve Business Registration & Generate Entities Execution Engine
  const handleApproveBusiness = async () => {
    if (!submission) return;
    if (pendingCount > 0 || rejectedCount > 0) {
      antMessage.error('All section items and verification documents must be APPROVED to activate business workspace.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const newBusId = `bus-${Date.now().toString().slice(-4)}`;
      const newPartyId = `pty-${Date.now().toString().slice(-4)}`;

      // 1. Create Business Entity
      const newBusinessRecord: UserBusiness = {
        id: newBusId,
        name: submission.business_name,
        legal_name: submission.legal_name,
        slug: submission.business_name.toLowerCase().replace(/\s+/g, '-'),
        website: submission.website,
        phone: submission.phone,
        country_code: submission.country_code,
        is_active: true,
        is_claimed: true,
        created_at: now,
        updated_at: now
      };
      await userDb.businesses.put(newBusinessRecord);

      // 2. Grant Ownership to Target Party OR Create 1:1 Business Party Entity
      let assignedPartyId = newPartyId;

      if (submission.to_claim_party_id) {
        const existingParty = await businessDb.parties.get(submission.to_claim_party_id);
        if (existingParty) {
          assignedPartyId = existingParty.id;
          const updatedTargetParty: Party = {
            ...existingParty,
            owner_id: newBusId,
            is_claimed: true,
            is_verified: true,
            updated_at: now
          };
          await businessDb.parties.put(updatedTargetParty);
        } else {
          assignedPartyId = submission.to_claim_party_id;
          const claimedPartyRecord: Party = {
            id: submission.to_claim_party_id,
            owner_type: 'BUSINESS',
            owner_id: newBusId,
            display_name: submission.to_claim_party_name || submission.business_name,
            status: 'ACTIVE',
            is_claimed: true,
            is_verified: true,
            created_at: now,
            updated_at: now
          };
          await businessDb.parties.put(claimedPartyRecord);
        }

        // Generate APPROVED PartyClaim record
        const approvedPartyClaim: PartyClaim = {
          id: `clm-${Date.now().toString().slice(-4)}`,
          target_party_id: submission.to_claim_party_id,
          claimant_party_id: assignedPartyId,
          claimant_user_id: submission.user_id,
          status: 'APPROVED',
          notes: `Platform approved claim of party ${submission.to_claim_party_id} during business registration approval.`,
          created_at: now,
          updated_at: now
        };
        await businessDb.partyClaims.put(approvedPartyClaim);
      } else {
        const newPartyRecord: Party = {
          id: newPartyId,
          owner_type: 'BUSINESS',
          owner_id: newBusId,
          display_name: submission.to_claim_party_name || submission.business_name,
          status: 'ACTIVE',
          is_claimed: true,
          is_verified: true,
          created_at: now,
          updated_at: now
        };
        await businessDb.parties.put(newPartyRecord);
      }

      // 3. Create Corporate HQ Address linked to party_id
      const newAddressRecord: UserAddress = {
        id: `addr-${Date.now().toString().slice(-4)}`,
        party_id: assignedPartyId,
        address_type: 'HQ',
        line1: submission.address.line1,
        line2: submission.address.line2,
        city: submission.address.city,
        state_province: submission.address.state_province,
        postal_code: submission.address.postal_code,
        country_code: submission.address.country_code,
        is_primary: true,
        created_at: now
      };
      await userDb.addresses.put(newAddressRecord);

      // 4. Create Business Membership (OWNER)
      const newMembershipRecord: BusinessMembership = {
        id: `bm-${Date.now().toString().slice(-4)}`,
        business_id: newBusId,
        user_id: submission.user_id,
        membership_type: 'OWNER',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      };
      await userDb.businessMemberships.put(newMembershipRecord);

      // 6. Update Submission Status to APPROVED
      const updatedAudit = [...(submission.audit_history || [])];
      updatedAudit.push({
        id: `aud-b-${Date.now()}`,
        round: submission.current_round,
        actor_id: currentUser?.id || 'usr-admin',
        actor_name: currentUser?.full_name || 'Platform Compliance Admin',
        action: 'APPROVED',
        notes: `Approved business registration application. Activated Business ${newBusId} and 1:1 Claimed Party ${newPartyId}.`,
        timestamp: now
      });

      const updatedSubmission: BusinessSubmission = {
        ...submission,
        status: 'APPROVED',
        sections: sectionsState,
        documents: documentsState,
        audit_history: updatedAudit,
        reviewed_at: now,
        reviewed_by_user_name: currentUser?.full_name || 'Platform Compliance Admin',
        updated_at: now
      };
      await businessDb.businessSubmissions.put(updatedSubmission);

      antMessage.success(`Business ${submission.business_name} approved! Activated Party ${newPartyId} & Business Tenant ${newBusId}.`);
      navigate('/p/business-reviews');
    } catch (err) {
      antMessage.error('Failed to approve business registration.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!submission) {
    return (
      <div className="p-8 text-center text-gray-500">
        Business submission not found or invalid ID.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-16 space-y-6">
      {/* Sticky Header Action Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 mb-0">
              Business Application #{submission.id}
            </h1>
            <AntTag color={
              submission.status === 'SUBMITTED' ? 'processing' :
                submission.status === 'NEEDS_REVISION' ? 'error' :
                  submission.status === 'APPROVED' ? 'success' : 'cyan'
            } className="text-xs font-semibold">
              {submission.status.replace('_', ' ')} (Round {submission.current_round})
            </AntTag>
          </div>
          <p className="text-gray-500 text-xs mt-1 mb-0">
            Applicant: <strong className="text-sky-700">{submission.user_id}</strong> • Business: <strong className="text-gray-800">{submission.business_name}</strong>
          </p>
        </div>

        {/* Dynamic Progressive Header Action Buttons */}
        <AntSpace>
          <AntButton onClick={() => navigate('/p/business-reviews')}>
            Back to Queue
          </AntButton>

          {!isReviewReadOnly && (
            <>
              <AntButton
                type="default"
                icon={<Lucide.Save size={14} />}
                loading={isSaving}
                onClick={handleSaveProgress}
                className={hasUnsavedChanges ? 'border-amber-500 text-amber-600 font-bold' : ''}
              >
                Save Progress
              </AntButton>

              {/* Status-Wise Contextual Primary Action Button */}
              {pendingCount > 0 ? (
                <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5">
                  <Lucide.Clock size={14} className="text-sky-600 shrink-0" />
                  <span>Audit Pending ({pendingCount} item{pendingCount > 1 ? 's' : ''} remaining)</span>
                </div>
              ) : rejectedCount > 0 ? (
                <AntButton
                  type="primary"
                  danger
                  icon={<Lucide.AlertTriangle size={14} />}
                  loading={isSaving}
                  onClick={handleRequestRevision}
                >
                  Request Revision ({rejectedCount} rejected)
                </AntButton>
              ) : approvedCount === totalSectionItems ? (
                <AntButton
                  type="primary"
                  icon={<Lucide.CheckCircle2 size={14} />}
                  loading={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                  onClick={handleApproveBusiness}
                >
                  Approve Business & Activate
                </AntButton>
              ) : null}
            </>
          )}
        </AntSpace>
      </div>

      {/* Progress & Verification Overview Card */}
      <AntCard className="border border-sky-200 bg-sky-50/40 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block">
                Verification Audit Progress (Round {submission.current_round})
              </span>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 font-mono">
                <span>Total Items: <strong>{totalSectionItems}</strong></span>
                <span className="text-emerald-700">Approved: <strong>{approvedCount}</strong></span>
                <span className="text-red-700">Rejected: <strong>{rejectedCount}</strong></span>
                <span className="text-sky-700">Pending: <strong>{pendingCount}</strong></span>
              </div>
            </div>

            {!isReviewReadOnly && (
              <AntSpace>
                {pendingCount > 0 && (
                  <AntButton
                    size="small"
                    type="primary"
                    className="bg-emerald-600 text-xs font-semibold"
                    icon={<Lucide.CheckCheck size={13} />}
                    onClick={handleBulkApprovePending}
                  >
                    Approve All Pending ({pendingCount})
                  </AntButton>
                )}
                {(approvedCount > 0 || rejectedCount > 0) && (
                  <AntButton
                    size="small"
                    type="default"
                    className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
                    icon={<Lucide.RotateCcw size={13} />}
                    onClick={handleBulkResetAll}
                  >
                    Revert All to Pending ({approvedCount + rejectedCount})
                  </AntButton>
                )}
              </AntSpace>
            )}
          </div>

          <AntProgress percent={percentApproved} status={percentApproved === 100 ? 'success' : 'active'} strokeColor={{ '0%': '#0284c7', '100%': '#059669' }} />
        </div>
      </AntCard>

      {/* 5 SECTION AUDIT CARDS */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Business Operating Title</span>
                  {sectionsState.business_name?.status === 'APPROVED' && <AntTag color="success" className="text-[10px]">APPROVED</AntTag>}
                  {sectionsState.business_name?.status === 'REJECTED' && <AntTag color="error" className="text-[10px]">REJECTED</AntTag>}
                  {sectionsState.business_name?.status === 'PENDING' && <AntTag color="processing" className="text-[10px]">PENDING</AntTag>}
                </div>
                {renderItemActionButtons('SECTION', 'business_name', sectionsState.business_name?.status)}
              </div>
              <div className="font-bold text-gray-900 text-sm">{submission.business_name}</div>
              {sectionsState.business_name?.status === 'REJECTED' && (
                <div className="text-red-600 font-semibold text-[11px]">Comment: {sectionsState.business_name.rejection_comment}</div>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Legal Entity Registered Name</span>
                  {sectionsState.legal_name?.status === 'APPROVED' && <AntTag color="success" className="text-[10px]">APPROVED</AntTag>}
                  {sectionsState.legal_name?.status === 'REJECTED' && <AntTag color="error" className="text-[10px]">REJECTED</AntTag>}
                  {sectionsState.legal_name?.status === 'PENDING' && <AntTag color="processing" className="text-[10px]">PENDING</AntTag>}
                </div>
                {renderItemActionButtons('SECTION', 'legal_name', sectionsState.legal_name?.status)}
              </div>
              <div className="font-bold text-gray-900 text-sm">{submission.legal_name}</div>
              {sectionsState.legal_name?.status === 'REJECTED' && (
                <div className="text-red-600 font-semibold text-[11px]">Comment: {sectionsState.legal_name.rejection_comment}</div>
              )}
            </div>
          </div>
        </AntCard>

        {/* SECTION 2: LEGAL REGISTRATION & TAX CREDENTIALS */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.FileText size={18} className="text-emerald-600" />
              2. Legal Registration & Tax Identification
            </div>
          }
          className="border border-gray-200 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Tax Identification Number (EIN / VAT)</span>
                  {sectionsState.tax_id?.status === 'APPROVED' && <AntTag color="success" className="text-[10px]">APPROVED</AntTag>}
                  {sectionsState.tax_id?.status === 'REJECTED' && <AntTag color="error" className="text-[10px]">REJECTED</AntTag>}
                  {sectionsState.tax_id?.status === 'PENDING' && <AntTag color="processing" className="text-[10px]">PENDING</AntTag>}
                </div>
                {renderItemActionButtons('SECTION', 'tax_id', sectionsState.tax_id?.status)}
              </div>
              <div className="font-bold text-gray-900 text-sm">{submission.tax_id}</div>
              {sectionsState.tax_id?.status === 'REJECTED' && (
                <div className="text-red-600 font-semibold font-sans text-[11px]">Comment: {sectionsState.tax_id.rejection_comment}</div>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 font-sans">
              <div className="flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Registration / License Number</span>
                  {sectionsState.registration_number?.status === 'APPROVED' && <AntTag color="success" className="text-[10px]">APPROVED</AntTag>}
                  {sectionsState.registration_number?.status === 'REJECTED' && <AntTag color="error" className="text-[10px]">REJECTED</AntTag>}
                  {sectionsState.registration_number?.status === 'PENDING' && <AntTag color="processing" className="text-[10px]">PENDING</AntTag>}
                </div>
                {renderItemActionButtons('SECTION', 'registration_number', sectionsState.registration_number?.status)}
              </div>
              <div className="font-bold text-gray-900 text-sm font-mono">{submission.registration_number || 'N/A'}</div>
              {sectionsState.registration_number?.status === 'REJECTED' && (
                <div className="text-red-600 font-semibold font-sans text-[11px]">Comment: {sectionsState.registration_number.rejection_comment}</div>
              )}
            </div>
          </div>
        </AntCard>

        {/* SECTION 3: CORPORATE HQ LOCATION */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.MapPin size={18} className="text-indigo-600" />
              3. Corporate Headquarters Physical Location
            </div>
          }
          className="border border-gray-200 shadow-sm"
        >
          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">Headquarters Address</span>
                {sectionsState.address?.status === 'APPROVED' && <AntTag color="success" className="text-[10px]">APPROVED</AntTag>}
                {sectionsState.address?.status === 'REJECTED' && <AntTag color="error" className="text-[10px]">REJECTED</AntTag>}
                {sectionsState.address?.status === 'PENDING' && <AntTag color="processing" className="text-[10px]">PENDING</AntTag>}
              </div>
              {renderItemActionButtons('SECTION', 'address', sectionsState.address?.status)}
            </div>
            <div className="font-bold text-gray-900 text-sm">
              {submission.address.line1}, {submission.address.city} {submission.address.state_province} {submission.address.postal_code}, {submission.address.country_code}
            </div>
            {sectionsState.address?.status === 'REJECTED' && (
              <div className="text-red-600 font-semibold text-[11px]">Comment: {sectionsState.address.rejection_comment}</div>
            )}
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
          <div className="space-y-3 text-xs">
            <div className="bg-purple-50/60 p-3 rounded border border-purple-200 space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-purple-700 font-semibold">Target Business Party Title</span>
                  {submission.to_claim_party_id ? (
                    <AntTag color="blue" className="font-mono text-[10px]">Target ID: {submission.to_claim_party_id}</AntTag>
                  ) : (
                    <AntTag color="purple" className="font-mono text-[10px]">New Business Party</AntTag>
                  )}
                  {sectionsState.to_claim_party_name?.status === 'APPROVED' && <AntTag color="success" className="text-[10px]">APPROVED</AntTag>}
                  {sectionsState.to_claim_party_name?.status === 'REJECTED' && <AntTag color="error" className="text-[10px]">REJECTED</AntTag>}
                  {sectionsState.to_claim_party_name?.status === 'PENDING' && <AntTag color="processing" className="text-[10px]">PENDING</AntTag>}
                </div>
                {renderItemActionButtons('SECTION', 'to_claim_party_name', sectionsState.to_claim_party_name?.status)}
              </div>
              <div className="font-bold text-purple-950 text-sm">{submission.to_claim_party_name}</div>
              <span className="text-gray-500 block text-[11px] mt-1">
                {submission.to_claim_party_id
                  ? `Grants ownership of existing placeholder party ID ${submission.to_claim_party_id} and generates APPROVED PartyClaim upon platform approval.`
                  : 'Generates a fresh 1:1 Business Party entity upon platform approval.'}
              </span>
              {sectionsState.to_claim_party_name?.status === 'REJECTED' && (
                <div className="text-red-600 font-semibold text-[11px]">Comment: {sectionsState.to_claim_party_name.rejection_comment}</div>
              )}
            </div>
          </div>
        </AntCard>

        {/* SECTION 5: VERIFICATION PROOF DOCUMENTS ATTACHMENTS */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.ShieldCheck size={18} className="text-purple-600" />
              5. Verification Proof Attachments Audit ({documentsState.length})
            </div>
          }
          className="border border-purple-200 shadow-sm"
        >
          <div className="space-y-3">
            {documentsState.map(doc => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <Lucide.FileCheck size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <a href={doc.doc_url} target="_blank" rel="noreferrer" className="hover:underline text-indigo-600">
                        {doc.doc_name}
                      </a>
                      <AntTag color="purple" className="text-[10px] font-mono">{doc.doc_type.replace('_', ' ')}</AntTag>
                      {doc.status === 'APPROVED' && <AntTag color="success" className="text-[10px] font-mono">APPROVED</AntTag>}
                      {doc.status === 'REJECTED' && <AntTag color="error" className="text-[10px] font-mono">REJECTED</AntTag>}
                    </div>
                    {doc.rejection_comment && (
                      <div className="text-red-600 font-semibold text-[11px] mt-0.5">
                        <strong>Rejection Comment:</strong> {doc.rejection_comment}
                      </div>
                    )}
                  </div>
                </div>

                {renderItemActionButtons('DOC', doc.id, doc.status)}
              </div>
            ))}
          </div>
        </AntCard>
      </div>

      {/* Mandatory Rejection Comment Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-red-600 font-bold">
            <Lucide.AlertTriangle size={18} />
            Reject Item & Provide Applicant Feedback
          </div>
        }
        open={!!rejectingKey}
        onCancel={() => setRejectingKey(null)}
        onOk={handleConfirmRejection}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-3 py-2">
          <p className="text-xs text-gray-600">
            Please enter a clear explanation of why this section item or document is rejected so the applicant can correct it in Round {submission.current_round + 1}:
          </p>
          <AntInput.TextArea
            rows={4}
            value={rejectionCommentInput}
            onChange={e => setRejectionCommentInput(e.target.value)}
            placeholder="Reviewer Feedback / Revision Instructions (e.g. Upload a valid 2026 tax registration certificate issued by state authority)"
          />
        </div>
      </AntModal>
    </div>
  );
};

export default PlatformBusinessReviewDetail;
