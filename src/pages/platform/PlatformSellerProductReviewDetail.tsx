import React, { useState, useMemo, useEffect } from 'react';
import { Card as AntCard, Button as AntButton, Tag as AntTag, Input as AntInput, Progress as AntProgress, Alert as AntAlert, Modal as AntModal, Space as AntSpace, Table as AntTable, Collapse as AntCollapse, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type SellerProductSubmission, type SubmissionAttributeItem, type SellerProduct, type SellerProductSpecification, type SellerProductVariant } from '../../data/catalog';
import { businessDb, type Party } from '../../data/business';

const PlatformSellerProductReviewDetail: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useWorkspace();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600">Platform Admin</Link>, url: '/p/dashboard' },
    { title: <Link to="/p/seller-product-reviews" className="text-gray-500 hover:text-sky-600">Product Review Queue</Link>, url: '/p/seller-product-reviews' },
    { title: <span className="text-gray-900 font-semibold">Attribute Audit ({id})</span> }
  ], [id]);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie DB
  const submissions = useLiveQuery(() => catalogDb.sellerProductSubmissions.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];

  const submission = useMemo(() => {
    return submissions.find((s: SellerProductSubmission) => s.id === id);
  }, [submissions, id]);

  const sellerParty = useMemo(() => {
    if (!submission) return null;
    return parties.find((p: Party) => p.id === submission.party_id);
  }, [submission, parties]);

  const [attributesState, setAttributesState] = useState<Record<string, SubmissionAttributeItem>>({});
  const [rejectingFieldKey, setRejectingFieldKey] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (submission) {
      setAttributesState(submission.attributes || {});
    }
  }, [submission]);

  const attrList = useMemo(() => Object.values(attributesState), [attributesState]);
  const totalCount = attrList.length;
  const approvedCount = attrList.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = attrList.filter(a => a.status === 'REJECTED').length;
  const pendingCount = attrList.filter(a => a.status === 'PENDING').length;
  const percentApproved = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const is100PercentApproved = totalCount > 0 && approvedCount === totalCount;

  // Read-Only Enforcement for Platform Reviewer:
  // Reviewer can ONLY perform attribute editing/actions when status is SUBMITTED or UNDER_REVIEW.
  // All other statuses (NEEDS_REVISION, APPROVED, PUBLISHED, REJECTED) are View-Only (Read-Only).
  const isReviewReadOnly = useMemo(() => {
    if (!submission) return false;
    return submission.status !== 'SUBMITTED' && submission.status !== 'UNDER_REVIEW';
  }, [submission]);

  // Saved Database State Metrics (Persisted state in Dexie DB)
  const savedAttrList = useMemo(() => Object.values(submission?.attributes || {}), [submission]);
  const savedPendingCount = useMemo(() => savedAttrList.filter(a => a.status === 'PENDING').length, [savedAttrList]);
  const savedRejectedCount = useMemo(() => savedAttrList.filter(a => a.status === 'REJECTED').length, [savedAttrList]);
  const savedApprovedCount = useMemo(() => savedAttrList.filter(a => a.status === 'APPROVED').length, [savedAttrList]);
  const isSaved100PercentApproved = useMemo(() => savedAttrList.length > 0 && savedApprovedCount === savedAttrList.length, [savedAttrList, savedApprovedCount]);

  // Detect un-saved component state changes vs persisted database state
  const hasUnsavedChanges = useMemo(() => {
    if (!submission) return false;
    return JSON.stringify(attributesState) !== JSON.stringify(submission.attributes);
  }, [attributesState, submission]);

  // Handle Approve Field
  const handleApproveField = (fieldKey: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        status: 'APPROVED',
        rejection_comment: undefined,
        reviewed_by_user_name: currentUser?.full_name || 'Platform Admin',
        reviewed_at: new Date().toISOString()
      }
    }));
    antMessage.success(`Attribute "${attributesState[fieldKey]?.field_label || fieldKey}" approved.`);
  };

  // Handle Open Reject Modal
  const handleOpenRejectModal = (fieldKey: string) => {
    setRejectingFieldKey(fieldKey);
    setCommentInput(attributesState[fieldKey]?.rejection_comment || '');
  };

  // Confirm Rejection
  const handleConfirmRejection = () => {
    if (!rejectingFieldKey) return;
    if (!commentInput.trim()) {
      antMessage.error('Please enter a reviewer rejection comment explaining the required correction.');
      return;
    }

    setAttributesState((prev) => ({
      ...prev,
      [rejectingFieldKey]: {
        ...prev[rejectingFieldKey],
        status: 'REJECTED',
        rejection_comment: commentInput.trim(),
        reviewed_by_user_name: currentUser?.full_name || 'Platform Admin',
        reviewed_at: new Date().toISOString()
      }
    }));

    antMessage.warning(`Attribute "${attributesState[rejectingFieldKey]?.field_label || rejectingFieldKey}" rejected.`);
    setRejectingFieldKey(null);
    setCommentInput('');
  };

  // Reset Field to Pending
  const handleResetField = (fieldKey: string) => {
    setAttributesState((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        status: 'PENDING',
        rejection_comment: undefined
      }
    }));
  };

  // Bulk Review Operations
  const handleBulkApproveAllPending = () => {
    setAttributesState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key].status === 'PENDING') {
          next[key] = {
            ...next[key],
            status: 'APPROVED',
            rejection_comment: undefined,
            reviewed_by_user_name: currentUser?.full_name || 'Platform Admin',
            reviewed_at: new Date().toISOString()
          };
        }
      });
      return next;
    });
    antMessage.success('Marked all pending attributes as APPROVED.');
  };

  const handleBulkApproveAll = () => {
    setAttributesState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = {
          ...next[key],
          status: 'APPROVED',
          rejection_comment: undefined,
          reviewed_by_user_name: currentUser?.full_name || 'Platform Admin',
          reviewed_at: new Date().toISOString()
        };
      });
      return next;
    });
    antMessage.success('Marked all attributes as APPROVED.');
  };

  const handleBulkResetAll = () => {
    setAttributesState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = {
          ...next[key],
          status: 'PENDING',
          rejection_comment: undefined
        };
      });
      return next;
    });
    antMessage.info('Reset all attributes to PENDING review.');
  };

  // Save Progress (In-Progress Review)
  const handleSaveProgress = async () => {
    if (!submission) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedRecord: SellerProductSubmission = {
        ...submission,
        status: submission.status === 'SUBMITTED' ? 'UNDER_REVIEW' : submission.status,
        attributes: attributesState,
        updated_at: now
      };

      await catalogDb.sellerProductSubmissions.put(updatedRecord);
      antMessage.success('Review progress saved successfully.');
    } catch (err) {
      antMessage.error('Failed to save review progress.');
    } finally {
      setIsSaving(false);
    }
  };

  // Request Revision (All reviewed, at least 1 rejected in saved state)
  const handleRequestRevision = async () => {
    if (!submission) return;
    if (hasUnsavedChanges) {
      antMessage.warning('Please click "Save Review Progress" before requesting revision.');
      return;
    }
    if (savedPendingCount > 0) {
      antMessage.warning('Please complete review of all pending attributes before requesting revision.');
      return;
    }
    if (savedRejectedCount === 0) {
      antMessage.error('Please reject at least 1 attribute with a comment before requesting revision.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedAudit = [...(submission.audit_history || [])];
      updatedAudit.push({
        id: `aud-${Date.now()}`,
        round: submission.current_round,
        actor_id: currentUser?.id || 'usr-admin',
        actor_name: currentUser?.full_name || 'Platform Admin',
        action: 'REQUESTED_REVISION',
        notes: `Rejected ${savedRejectedCount} attribute(s) with comments. Requested Round ${submission.current_round} seller revision.`,
        timestamp: now
      });

      const updatedRecord: SellerProductSubmission = {
        ...submission,
        status: 'NEEDS_REVISION',
        attributes: attributesState,
        audit_history: updatedAudit,
        updated_at: now
      };

      await catalogDb.sellerProductSubmissions.put(updatedRecord);
      antMessage.success(`Revision request sent to seller for Round ${submission.current_round}.`);
      navigate('/p/seller-product-reviews');
    } catch (err) {
      antMessage.error('Failed to send revision request.');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve Submission (100% Approved in saved state)
  const handleApproveSubmission = async () => {
    if (!submission) return;
    if (hasUnsavedChanges) {
      antMessage.warning('Please click "Save Review Progress" before approving submission.');
      return;
    }
    if (!isSaved100PercentApproved) {
      antMessage.warning('All attributes must be approved in saved state before approving submission.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedAudit = [...(submission.audit_history || [])];
      updatedAudit.push({
        id: `aud-${Date.now()}`,
        round: submission.current_round,
        actor_id: currentUser?.id || 'usr-admin',
        actor_name: currentUser?.full_name || 'Platform Admin',
        action: 'FINAL_APPROVED',
        notes: `All ${totalCount} attributes approved (100%). Submission approved.`,
        timestamp: now
      });

      const updatedRecord: SellerProductSubmission = {
        ...submission,
        status: 'APPROVED',
        attributes: attributesState,
        audit_history: updatedAudit,
        updated_at: now
      };

      await catalogDb.sellerProductSubmissions.put(updatedRecord);
      antMessage.success('Submission approved! Click "Publish to Seller Catalog" to publish product.');
    } catch (err) {
      antMessage.error('Failed to approve submission.');
    } finally {
      setIsSaving(false);
    }
  };

  // Final Publish Engine (Once Status is APPROVED)
  const handlePublishToCatalog = async () => {
    if (!submission || !is100PercentApproved) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const publishedId = submission.published_seller_product_id || `sprod-${Date.now()}`;
      const attrs = attributesState;

      const publishedProduct: SellerProduct = {
        id: publishedId,
        category_id: attrs.category_id?.value || 'c-3-1-1',
        catalog_product_id: attrs.catalog_product_id?.value || 'prod-2',
        product_name: attrs.product_name?.value || 'Untitled Seller Product',
        manufacturer_id: attrs.manufacturer_id?.value || 'mfg-1',
        brand_id: attrs.brand_id?.value || 'brd-1',
        party_id: submission.party_id,

        year_of_manufacture: attrs.year_of_manufacture?.value,
        country_of_origin: 'US',
        model_number: attrs.model_number?.value,
        part_number: attrs.part_number?.value || 'PN-101',

        height: attrs.height?.value,
        width: attrs.width?.value,
        length: attrs.length?.value,
        weight: attrs.weight?.value,

        deviations: attrs.deviations?.value,
        exclusions: attrs.exclusions?.value,
        assumptions: attrs.assumptions?.value,
        operation_instructions: attrs.operation_instructions?.value,
        safety_instructions: attrs.safety_instructions?.value,
        handling_instructions: attrs.handling_instructions?.value,
        maintenance_instructions: attrs.maintenance_instructions?.value,
        additional_requirements: attrs.additional_requirements?.value,
        additional_information: attrs.additional_information?.value,

        dynamic_attributes: [],
        specifications: attrs.specifications?.value || [],
        variants: attrs.variants?.value || [],

        is_locked: true,
        status: 'ACTIVE',
        created_at: submission.created_at || now,
        updated_at: now
      };

      await catalogDb.sellerProducts.put(publishedProduct);

      const updatedAudit = [...(submission.audit_history || [])];
      updatedAudit.push({
        id: `aud-${Date.now()}`,
        round: submission.current_round,
        actor_id: currentUser?.id || 'usr-admin',
        actor_name: currentUser?.full_name || 'Platform Admin',
        action: 'PUBLISHED',
        notes: `Published seller product ID ${publishedId} to catalogDb.sellerProducts.`,
        timestamp: now
      });

      const updatedSubmissionRecord: SellerProductSubmission = {
        ...submission,
        status: 'PUBLISHED',
        published_seller_product_id: publishedId,
        attributes: attributesState,
        audit_history: updatedAudit,
        published_at: now,
        updated_at: now
      };

      await catalogDb.sellerProductSubmissions.put(updatedSubmissionRecord);
      antMessage.success(`Seller Product published successfully! (ID: ${publishedId})`);
      navigate('/p/seller-product-reviews');
    } catch (err) {
      antMessage.error('Failed to publish seller product.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!submission) {
    return (
      <div className="p-8 text-center text-gray-500">
        Submission #{id} not found.
      </div>
    );
  }

  // Compact Attribute Card Renderer
  const renderAttributeCard = (fieldKey: string) => {
    const item = attributesState[fieldKey];
    if (!item) return null;

    let isComplexValue = false;
    let displayVal: React.ReactNode = item.value;

    if (fieldKey === 'specifications' && Array.isArray(item.value)) {
      isComplexValue = true;
      const specs = item.value as SellerProductSpecification[];
      displayVal = specs.length === 0 ? (
        <span className="text-gray-400 italic">No dynamic specifications.</span>
      ) : (
        <div className="flex flex-wrap gap-1.5 py-1">
          {specs.map((s, idx) => (
            <AntTag key={idx} color="blue" className="text-xs">
              {s.attribute_name}: <strong>{s.values.map(v => v.label).join(', ')}</strong>
            </AntTag>
          ))}
        </div>
      );
    } else if (fieldKey === 'variants' && Array.isArray(item.value)) {
      isComplexValue = true;
      const variants = item.value as SellerProductVariant[];
      displayVal = variants.length === 0 ? (
        <span className="text-gray-400 italic">No variants configured.</span>
      ) : (
        <div className="space-y-1 py-1">
          <div className="text-xs font-semibold text-gray-700 flex items-center justify-between border-b pb-1">
            <span>{variants.length} Sellable SKUs Total</span>
            <AntTag color="purple">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} Units Stock</AntTag>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
            {variants.map((v) => (
              <div key={v.id} className="flex justify-between items-center text-[11px] font-mono bg-white p-1.5 rounded border border-gray-200">
                <span>{v.sku} ({v.combination_values.map(c => c.label).join(' / ')})</span>
                <strong className="text-emerald-700">${v.price} ({v.stock} Stock)</strong>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (typeof item.value === 'object' && item.value !== null) {
      displayVal = <pre className="text-[11px] font-mono leading-tight">{JSON.stringify(item.value, null, 2)}</pre>;
    }

    return (
      <div
        key={fieldKey}
        className={`p-3 rounded-lg border transition-all ${
          item.status === 'APPROVED' ? 'bg-emerald-50/30 border-emerald-300' :
          item.status === 'REJECTED' ? 'bg-red-50/30 border-red-300' :
          'bg-white border-gray-200 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-xs">{item.field_label}</span>
            <span className="text-[11px] font-mono text-gray-400">({fieldKey})</span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.status === 'APPROVED' && (
              <AntTag color="success" className="text-[11px] py-0 px-1.5 font-semibold">APPROVED</AntTag>
            )}
            {item.status === 'REJECTED' && (
              <AntTag color="error" className="text-[11px] py-0 px-1.5 font-semibold">REJECTED</AntTag>
            )}
            {item.status === 'PENDING' && (
              <AntTag color="warning" className="text-[11px] py-0 px-1.5 font-semibold">PENDING</AntTag>
            )}

            {!isReviewReadOnly && (
              <AntSpace size={4}>
                {item.status !== 'APPROVED' && (
                  <AntButton
                    type="primary"
                    size="small"
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-[11px] h-6 px-2"
                    onClick={() => handleApproveField(fieldKey)}
                  >
                    Approve
                  </AntButton>
                )}
                {item.status !== 'REJECTED' && (
                  <AntButton
                    danger
                    size="small"
                    className="font-semibold text-[11px] h-6 px-2"
                    onClick={() => handleOpenRejectModal(fieldKey)}
                  >
                    Reject
                  </AntButton>
                )}
                {item.status !== 'PENDING' && (
                  <AntButton
                    type="text"
                    size="small"
                    className="text-gray-500 text-[11px] h-6 px-1.5"
                    onClick={() => handleResetField(fieldKey)}
                  >
                    Reset
                  </AntButton>
                )}
              </AntSpace>
            )}
          </div>
        </div>

        {/* Compact Value Display */}
        <div className="bg-gray-50/90 p-2 rounded border border-gray-200 text-xs text-gray-800 break-words">
          {isComplexValue ? displayVal : (item.value || <span className="text-gray-400 italic">No value provided</span>)}
        </div>

        {/* Rejection comment display */}
        {item.status === 'REJECTED' && item.rejection_comment && (
          <div className="mt-1.5 text-xs bg-red-100/80 border border-red-200 p-2 rounded text-red-800 space-y-0.5">
            <div className="font-semibold flex items-center gap-1">
              <Lucide.MessageSquare size={12} /> Reviewer Comment:
            </div>
            <div>{item.rejection_comment}</div>
          </div>
        )}

        {item.reviewed_by_user_name && (
          <div className="text-[10px] text-gray-400 font-mono mt-1 text-right">
            Reviewed by {item.reviewed_by_user_name} on {new Date(item.reviewed_at || Date.now()).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-16 space-y-6">
      {/* Sticky Header Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 mb-0">
              Attribute Audit #{submission.id}
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
            Seller Party: <strong className="text-sky-700">{sellerParty?.display_name || submission.party_id}</strong> ({sellerParty?.owner_type})
          </p>
        </div>

        {/* Dynamic Progressive Header Action Buttons */}
        <AntSpace>
          <AntButton onClick={() => navigate('/p/seller-product-reviews')} size="middle">
            Back to Queue
          </AntButton>

          {isReviewReadOnly ? (
            submission.status === 'PUBLISHED' ? (
              <AntTag color="green" className="py-1 px-3 text-xs font-bold">
                Published to Catalog
              </AntTag>
            ) : submission.status === 'APPROVED' ? (
              <AntButton
                type="primary"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                loading={isSaving}
                onClick={handlePublishToCatalog}
                size="middle"
              >
                Publish to Seller Catalog
              </AntButton>
            ) : submission.status === 'NEEDS_REVISION' ? (
              <AntTag color="warning" className="py-1 px-3 text-xs font-bold flex items-center gap-1">
                <Lucide.Clock size={13} />
                Awaiting Seller Revision (Round {submission.current_round})
              </AntTag>
            ) : (
              <AntTag color="default" className="py-1 px-3 text-xs font-bold">
                View Only Mode
              </AntTag>
            )
          ) : (
            /* Active Reviewer Mode (SUBMITTED or UNDER_REVIEW) */
            hasUnsavedChanges ? (
              <AntButton
                type="primary"
                className="bg-sky-600 hover:bg-sky-700 font-bold"
                loading={isSaving}
                onClick={handleSaveProgress}
                size="middle"
              >
                Save Review Progress ({approvedCount + rejectedCount}/{totalCount})
              </AntButton>
            ) : savedPendingCount > 0 ? (
              <AntButton
                type="primary"
                className="bg-sky-600 hover:bg-sky-700 font-medium"
                loading={isSaving}
                onClick={handleSaveProgress}
                size="middle"
              >
                Save Review Progress ({savedApprovedCount + savedRejectedCount}/{totalCount})
              </AntButton>
            ) : savedRejectedCount > 0 ? (
              <AntButton
                danger
                type="primary"
                className="font-bold"
                loading={isSaving}
                onClick={handleRequestRevision}
                size="middle"
              >
                Request Revision ({savedRejectedCount} Rejected)
              </AntButton>
            ) : isSaved100PercentApproved ? (
              <AntButton
                type="primary"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                loading={isSaving}
                onClick={handleApproveSubmission}
                size="middle"
              >
                Approve Submission (100% Approved)
              </AntButton>
            ) : (
              <AntButton
                type="primary"
                className="bg-sky-600 hover:bg-sky-700 font-medium"
                loading={isSaving}
                onClick={handleSaveProgress}
                size="middle"
              >
                Save Review Progress
              </AntButton>
            )
          )}
        </AntSpace>
      </div>

      {/* View-Only Mode Banner */}
      {isReviewReadOnly && (
        <AntAlert
          type={submission.status === 'NEEDS_REVISION' ? 'warning' : 'info'}
          showIcon
          icon={submission.status === 'NEEDS_REVISION' ? <Lucide.Clock size={20} /> : <Lucide.Lock size={20} />}
          message={
            <span className="font-bold text-base">
              Attribute Audit View-Only Mode ({submission.status.replace('_', ' ')})
            </span>
          }
          description={
            <div className="text-xs space-y-1 mt-1">
              <p>
                Granular attribute review and editing actions are only active when status is <strong>SUBMITTED</strong> or <strong>UNDER_REVIEW</strong>.
                {submission.status === 'NEEDS_REVISION' && ` Round ${submission.current_round} revision request was sent to seller. Editing is locked until seller submits revisions.`}
                {submission.status === 'APPROVED' && ' Submission is approved. Click "Publish to Seller Catalog" to publish listing into active catalog.'}
                {submission.status === 'PUBLISHED' && ' This product submission is published to active seller catalog.'}
              </p>
            </div>
          }
          className="border-amber-200 bg-amber-50/60"
        />
      )}

      {/* Audit Progress & Bulk Controls Card */}
      <AntCard className="border border-sky-200 bg-sky-50/50 shadow-sm" size="small">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                <span>Attribute Audit Approval Progress</span>
                <span className="text-sky-700">{approvedCount} / {totalCount} Approved ({percentApproved}%)</span>
              </div>
              <AntProgress percent={percentApproved} strokeColor="#0284c7" size="small" />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
              <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded text-xs">{approvedCount} Approved</span>
              <span className="text-red-700 bg-red-100/80 px-2.5 py-1 rounded text-xs">{rejectedCount} Rejected</span>
              <span className="text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded text-xs">{pendingCount} Pending</span>
            </div>
          </div>

          {/* Bulk Review Action Bar (Only visible during active SUBMITTED / UNDER_REVIEW review mode) */}
          {!isReviewReadOnly && (
            <div className="pt-2 border-t border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lucide.CheckCheck size={14} className="text-sky-600" />
                Bulk Review Controls:
              </span>

              <AntSpace size="small" className="flex-wrap">
                {pendingCount > 0 && (
                  <AntButton
                    size="small"
                    type="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                    icon={<Lucide.CheckCircle2 size={13} />}
                    onClick={handleBulkApproveAllPending}
                  >
                    Approve All Pending ({pendingCount})
                  </AntButton>
                )}
                {approvedCount < totalCount && (
                  <AntButton
                    size="small"
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                    icon={<Lucide.Check size={13} />}
                    onClick={handleBulkApproveAll}
                  >
                    Approve Entire List ({totalCount})
                  </AntButton>
                )}
                {(approvedCount > 0 || rejectedCount > 0) && (
                  <AntButton
                    size="small"
                    type="text"
                    className="text-gray-500 hover:text-gray-700 text-xs"
                    icon={<Lucide.RotateCcw size={13} />}
                    onClick={handleBulkResetAll}
                  >
                    Reset All to Pending
                  </AntButton>
                )}
              </AntSpace>
            </div>
          )}
        </div>
      </AntCard>

      {/* Compact Section Cards matching SellerProductSubmissionForm.tsx */}
      <div className="space-y-6">

        {/* SECTION 1: BASIC IDENTIFIERS & TAXONOMIES */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.Tag size={16} className="text-sky-600" />
              1. Basic Identifiers & Taxonomies
            </div>
          }
          className="border border-gray-200 shadow-sm"
          size="small"
        >
          <div className="space-y-3">
            {renderAttributeCard('product_name')}
            {renderAttributeCard('category_id')}
            {renderAttributeCard('catalog_product_id')}
            {renderAttributeCard('brand_id')}
            {renderAttributeCard('manufacturer_id')}
          </div>
        </AntCard>

        {/* SECTION 2: MANUFACTURING & PHYSICAL SPECS */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.Factory size={16} className="text-emerald-600" />
              2. Manufacturing & Physical Specs
            </div>
          }
          className="border border-gray-200 shadow-sm"
          size="small"
        >
          <div className="space-y-3">
            {renderAttributeCard('year_of_manufacture')}
            {renderAttributeCard('model_number')}
            {renderAttributeCard('part_number')}
            {renderAttributeCard('height')}
            {renderAttributeCard('width')}
            {renderAttributeCard('length')}
            {renderAttributeCard('weight')}
          </div>
        </AntCard>

        {/* SECTION 3: OPERATIONAL & GOVERNANCE INSTRUCTIONS */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.ShieldCheck size={16} className="text-purple-600" />
              3. Operational & Governance Instructions
            </div>
          }
          className="border border-gray-200 shadow-sm"
          size="small"
        >
          <div className="space-y-3">
            {renderAttributeCard('operation_instructions')}
            {renderAttributeCard('safety_instructions')}
            {renderAttributeCard('handling_instructions')}
            {renderAttributeCard('maintenance_instructions')}
            {renderAttributeCard('deviations')}
            {renderAttributeCard('exclusions')}
            {renderAttributeCard('assumptions')}
            {renderAttributeCard('additional_requirements')}
            {renderAttributeCard('additional_information')}
          </div>
        </AntCard>

        {/* SECTION 4: CATEGORY DYNAMIC SPECIFICATIONS */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.SlidersHorizontal size={16} className="text-indigo-600" />
              4. Dynamic Technical Specifications
            </div>
          }
          className="border border-gray-200 shadow-sm"
          size="small"
        >
          <div className="space-y-3">
            {renderAttributeCard('specifications')}
          </div>
        </AntCard>

        {/* SECTION 5: SELLABLE PRODUCT VARIANTS DIRECTORY */}
        <AntCard
          title={
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Lucide.Layers3 size={16} className="text-purple-600" />
              5. Sellable Product Variants Directory
            </div>
          }
          className="border border-gray-200 shadow-sm"
          size="small"
        >
          <div className="space-y-3">
            {renderAttributeCard('variants')}
          </div>
        </AntCard>

      </div>

      {/* Reject Modal with Mandatory Comment */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-red-600 font-bold">
            <Lucide.AlertTriangle size={18} />
            Reject Attribute & Provide Feedback
          </div>
        }
        open={!!rejectingFieldKey}
        onCancel={() => setRejectingFieldKey(null)}
        onOk={handleConfirmRejection}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-3 py-2">
          <p className="text-xs text-gray-600">
            Please enter a clear explanation of why this attribute is rejected so the seller can correct it in Round {submission.current_round + 1}:
          </p>
          <AntInput.TextArea
            rows={4}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Reviewer Feedback / Revision Instructions (e.g. Provide certified weight measurement in kilograms)"
          />
        </div>
      </AntModal>
    </div>
  );
};

export default PlatformSellerProductReviewDetail;
