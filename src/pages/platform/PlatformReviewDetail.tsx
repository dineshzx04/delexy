import React, { useState, useMemo, useEffect } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input, notification, Divider, message } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import WorkflowTimeline from '../../components/common/WorkflowTimeline';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserProduct } from '../../data/db';
import { type FieldReview, type FieldReviewStatus } from '../../data/mockProducts';

const PlatformReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reviewingProduct = useLiveQuery(() => id ? db.userProducts.get(id) : undefined, [id]);

  // Field Reviews State map
  const [fieldReviews, setFieldReviews] = useState<Record<string, FieldReview>>({});
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedSpecKeys, setSelectedSpecKeys] = useState<React.Key[]>([]);
  const [selectedVariantKeys, setSelectedVariantKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    if (reviewingProduct) {
      setFieldReviews(reviewingProduct.reviewData || {});
    }
  }, [reviewingProduct]);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <Link to="/platform/user-products" className="text-gray-500 hover:text-sky-600 transition-colors">Product Reviews</Link>, url: '/platform/user-products' },
    { title: <span className="text-gray-900 font-semibold">{reviewingProduct?.name || 'Review'}</span> }
  ], [reviewingProduct]);

  useBreadcrumb(breadcrumbs);

  if (!reviewingProduct) return null;

  const modalMode = ['Draft', 'Published'].includes(reviewingProduct.status) ? 'view' : 'review';

  const payload = (reviewingProduct as any).payload || {};
  const staticFieldsCount = 18; // Height, width, weight, name, model, part, year, country, mfg, brand, seller, + 7 others
  const specFieldsCount = payload.globalSpecs?.length || 0;
  const variantFieldsCount = payload.variants?.length || 0;
  const totalFields = staticFieldsCount + specFieldsCount + variantFieldsCount;

  const approvedFieldsCount = Object.values(fieldReviews).filter(r => r.status === 'approved').length;
  const rejectedFieldsCount = Object.values(fieldReviews).filter(r => r.status === 'rejected').length;
  const pendingFieldsCount = totalFields - approvedFieldsCount - rejectedFieldsCount;

  const handleUpdateFieldStatus = (entityKey: string, status: FieldReviewStatus) => {
    if (modalMode !== 'review') return;
    setFieldReviews(prev => ({
      ...prev,
      [entityKey]: { ...(prev[entityKey] || {}), status }
    }));
  };

  const handleUpdateFieldComment = (entityKey: string, comment: string) => {
    if (modalMode !== 'review') return;
    setFieldReviews(prev => ({
      ...prev,
      [entityKey]: { ...(prev[entityKey] || { status: 'pending' }), comment }
    }));
  };

  const handleBulkActionSpecs = (status: FieldReviewStatus) => {
    if (!reviewingProduct || selectedSpecKeys.length === 0) return;
    const updates: Record<string, FieldReview> = {};
    selectedSpecKeys.forEach(name => {
      updates[`spec-${name}`] = { status };
    });
    setFieldReviews(prev => ({ ...prev, ...updates }));
    setSelectedSpecKeys([]);
  };

  const handleBulkActionVariants = (status: FieldReviewStatus) => {
    if (!reviewingProduct || selectedVariantKeys.length === 0) return;
    const updates: Record<string, FieldReview> = {};
    selectedVariantKeys.forEach(vId => {
      updates[`variant-${vId}`] = { status };
    });
    setFieldReviews(prev => ({ ...prev, ...updates }));
    setSelectedVariantKeys([]);
  };

  const handleBulkApproveSpecs = () => {
    if (!reviewingProduct) return;
    const payload = (reviewingProduct as any).payload || {};
    const updates: Record<string, FieldReview> = {};
    (payload.globalSpecs || []).forEach((spec: any) => {
      const key = `spec-${spec.name}`;
      if (!fieldReviews[key] || fieldReviews[key].status === 'pending') {
        updates[key] = { status: 'approved' };
      }
    });
    setFieldReviews(prev => ({ ...prev, ...updates }));
  };

  const handleBulkApproveVariants = () => {
    if (!reviewingProduct) return;
    const payload = (reviewingProduct as any).payload || {};
    const updates: Record<string, FieldReview> = {};
    (payload.variants || []).forEach((v: any) => {
      const key = `variant-${v.id}`;
      if (!fieldReviews[key] || fieldReviews[key].status === 'pending') {
        updates[key] = { status: 'approved' };
      }
    });
    setFieldReviews(prev => ({ ...prev, ...updates }));
  };

  const handleSaveProgress = async () => {
    await db.userProducts.update(reviewingProduct.id, { reviewData: fieldReviews, status: 'Under Review' });
    notification.success({ message: 'Progress Saved', description: 'Review progress has been saved.' });
  };

  const handleApproveProduct = async () => {
    await db.userProducts.update(reviewingProduct.id, { reviewData: fieldReviews, status: 'Approved' });
    notification.success({ message: 'Product Approved', description: 'The product has been approved.' });
    navigate('/platform');
  };

  const handleReturnToUser = async () => {
    await db.userProducts.update(reviewingProduct.id, { reviewData: fieldReviews, status: 'Changes Requested' });
    notification.warning({ message: 'Returned to User', description: 'Sent back to user for changes.' });
    navigate('/platform');
  };

  const specColumns = [
    { title: 'Specification Name', dataIndex: 'name', key: 'name', width: '25%', render: (t: string) => <span className="font-semibold text-sm">{t}</span> },
    { title: 'Value', dataIndex: 'value', key: 'value', width: '25%', render: (t: string) => <span className="text-sm">{t}</span> },
    {
      title: 'Review Action',
      key: 'action',
      width: '50%',
      render: (_: any, record: any) => {
        const entityKey = `spec-${record.name}`;
        const review = fieldReviews[entityKey] || { status: 'pending' };
        if (modalMode === 'view') {
          return <span className={`text-xs font-semibold ${review.status === 'rejected' ? 'text-red-500' : review.status === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>{review.status.toUpperCase()}</span>;
        }
        return (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex bg-gray-50 rounded border border-gray-200 p-0.5 gap-0.5 shrink-0">
              <button onClick={() => handleUpdateFieldStatus(entityKey, 'pending')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${review.status === 'pending' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>Pending</button>
              <button onClick={() => handleUpdateFieldStatus(entityKey, 'approved')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${review.status === 'approved' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Approve</button>
              <button onClick={() => handleUpdateFieldStatus(entityKey, 'rejected')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${review.status === 'rejected' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Reject</button>
            </div>
            <Input size="small" placeholder="Reviewer comment..." value={review.comment || ''} onChange={(e) => handleUpdateFieldComment(entityKey, e.target.value)} className="flex-1 min-w-[120px] text-xs" />
          </div>
        );
      }
    }
  ];

  const variantColumns = [
    {
      title: 'Variant Details',
      key: 'details',
      width: '30%',
      render: (_: any, v: any) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm">{v.name}</div>
          <div className="text-[11px] font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600 mt-1 inline-block">SKU: {v.sku}</div>
        </div>
      )
    },
    {
      title: 'Pricing & Stock',
      key: 'inventory',
      width: '25%',
      render: (_: any, v: any) => (
        <div className="text-xs space-y-0.5">
          <div><span className="text-gray-500">Price:</span> ${v.price}</div>
          <div><span className="text-gray-500">Stock:</span> {v.stock} | <span className="text-gray-500">Min:</span> {v.minOrder}</div>
        </div>
      )
    },
    {
      title: 'Review Action',
      key: 'action',
      width: '45%',
      render: (_: any, v: any) => {
        const entityKey = `variant-${v.id}`;
        const review = fieldReviews[entityKey] || { status: 'pending' };
        if (modalMode === 'view') {
          return <span className={`text-xs font-semibold ${review.status === 'rejected' ? 'text-red-500' : review.status === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>{review.status.toUpperCase()}</span>;
        }
        return (
          <div className="flex flex-col xl:flex-row xl:items-center gap-2">
            <div className="flex bg-gray-50 rounded border border-gray-200 p-0.5 gap-0.5 shrink-0">
              <button onClick={() => handleUpdateFieldStatus(entityKey, 'pending')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${review.status === 'pending' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>Pending</button>
              <button onClick={() => handleUpdateFieldStatus(entityKey, 'approved')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${review.status === 'approved' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Approve</button>
              <button onClick={() => handleUpdateFieldStatus(entityKey, 'rejected')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${review.status === 'rejected' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Reject</button>
            </div>
            <Input size="small" placeholder="Reviewer comment..." value={review.comment || ''} onChange={(e) => handleUpdateFieldComment(entityKey, e.target.value)} className="flex-1 min-w-[120px] text-xs" />
          </div>
        );
      }
    }
  ];

  const ReviewableRow = ({ label, value, entityKey }: { label: string; value: any; entityKey: string }) => {
    const review = fieldReviews[entityKey] || { status: 'pending' };
    const isEditingComment = activeCommentField === entityKey;

    let borderColor = 'border-gray-200';
    let bgColor = 'bg-white';
    if (review.status === 'approved') { borderColor = 'border-green-200'; bgColor = 'bg-green-50/30'; }
    if (review.status === 'rejected') { borderColor = 'border-red-200'; bgColor = 'bg-red-50/30'; }

    return (
      <div className={`flex flex-col mb-2 p-2 rounded border transition-colors ${bgColor} ${borderColor}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <span className="text-gray-500 text-sm w-48 inline-block font-medium">{label}:</span>
            <span className="text-gray-900 font-semibold">{value || <span className="text-gray-400 italic">Not provided</span>}</span>
          </div>

          {modalMode === 'review' ? (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex bg-white rounded border border-gray-200 p-0.5 gap-0.5">
                <button onClick={() => handleUpdateFieldStatus(entityKey, 'pending')} className={`px-2 py-1 text-[11px] font-bold uppercase rounded-sm transition-colors ${review.status === 'pending' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>Pending</button>
                <button onClick={() => handleUpdateFieldStatus(entityKey, 'approved')} className={`px-2 py-1 text-[11px] font-bold uppercase rounded-sm transition-colors ${review.status === 'approved' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Approve</button>
                <button onClick={() => handleUpdateFieldStatus(entityKey, 'rejected')} className={`px-2 py-1 text-[11px] font-bold uppercase rounded-sm transition-colors ${review.status === 'rejected' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Reject</button>
              </div>
              <AntButton type="text" size="small" icon={<Lucide.MessageSquare size={14} className={review.comment ? 'text-sky-500 fill-sky-100' : 'text-gray-400'} />} onClick={() => setActiveCommentField(isEditingComment ? null : entityKey)} />
            </div>
          ) : (
            <div className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${review.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : review.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {review.status}
            </div>
          )}
        </div>

        {(isEditingComment || (review.comment && modalMode === 'view')) && (
          <div className="mt-2 ml-[12.5rem] mr-[9rem]">
            {modalMode === 'review' ? (
              <Input.TextArea placeholder="Add a review comment..." value={review.comment || ''} onChange={(e) => handleUpdateFieldComment(entityKey, e.target.value)} autoFocus autoSize={{ minRows: 2, maxRows: 6 }} className="text-sm" />
            ) : (
              <div className="bg-yellow-50/50 p-2 border border-yellow-100 rounded text-sm text-gray-700">
                <span className="font-semibold text-gray-900 text-xs uppercase tracking-wider block mb-1">Reviewer Note:</span>
                {review.comment}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{modalMode === 'review' ? 'Reviewing Submission' : 'Viewing Submission'}</h1>
          <p className="text-gray-500 m-0">From: {reviewingProduct.tenantId} • Submitted {reviewingProduct.submittedAt}</p>
        </div>
        <div className="flex items-center gap-4">
          <AntButton onClick={() => navigate('/platform/user-products')}>Back to List</AntButton>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <WorkflowTimeline currentStatus={reviewingProduct.status as any} />

        {modalMode === 'review' && (
          <div className="mt-8 mb-4 bg-sky-50 p-4 rounded border border-sky-100 flex items-start gap-3">
            <Lucide.Info size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sky-800 text-sm m-0 mb-1 font-semibold">Progressive Review Active</p>
              <p className="text-sky-700 text-xs m-0">
                You can approve/reject individual fields and leave comments. Click "Save Progress" to safely store your review so you or another admin can continue later. You can only fully approve the product once all fields have been reviewed.
              </p>
            </div>
          </div>
        )}

        {modalMode === 'review' && (
          <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 p-3 mb-6 z-10 flex gap-6 text-sm font-semibold justify-center shadow-sm rounded">
            <div className="text-gray-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Pending: {pendingFieldsCount}</div>
            <div className="text-green-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Approved: {approvedFieldsCount}</div>
            <div className="text-red-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Rejected: {rejectedFieldsCount}</div>
          </div>
        )}

        <Divider orientation="horizontal" plain>1. Dimensions & Weight</Divider>
        <ReviewableRow label="Height" value={payload.productData?.height} entityKey="dim-height" />
        <ReviewableRow label="Width" value={payload.productData?.width} entityKey="dim-width" />
        <ReviewableRow label="Empty Weight" value={payload.productData?.emptyWeight} entityKey="dim-weight" />

        <Divider orientation="horizontal" plain>2. Production Details</Divider>
        <ReviewableRow label="Product Name" value={payload.productData?.name} entityKey="prod-name" />
        <ReviewableRow label="Model Number" value={payload.productData?.modelNumber} entityKey="prod-model" />
        <ReviewableRow label="Part Number" value={payload.productData?.partNumber} entityKey="prod-part" />
        <ReviewableRow label="Year of Manufacture" value={payload.productData?.yearOfManufacture} entityKey="prod-year" />
        <ReviewableRow label="Country of Origin" value={payload.productData?.countryOfOrigin} entityKey="prod-country" />
        <ReviewableRow label="Manufacturer" value={payload.productData?.manufacturer} entityKey="prod-mfg" />
        <ReviewableRow label="Brand" value={payload.productData?.brand} entityKey="prod-brand" />

        <Divider orientation="horizontal" plain>3. Seller Details</Divider>
        <ReviewableRow label="Seller" value={payload.productData?.seller} entityKey="seller-name" />

        <Divider orientation="horizontal" plain>4. Others</Divider>
        <ReviewableRow label="Deviations" value={payload.productData?.deviations} entityKey="other-dev" />
        <ReviewableRow label="Exclusions" value={payload.productData?.exclusions} entityKey="other-exc" />
        <ReviewableRow label="Assumptions" value={payload.productData?.assumptions} entityKey="other-ass" />
        <ReviewableRow label="Operation Instructions" value={payload.productData?.operationInstructions} entityKey="other-op" />
        <ReviewableRow label="Safety Instructions" value={payload.productData?.safetyInstructions} entityKey="other-saf" />
        <ReviewableRow label="Handling Instructions" value={payload.productData?.handlingInstructions} entityKey="other-hand" />
        <ReviewableRow label="Maintenance Instructions" value={payload.productData?.maintenanceInstructions} entityKey="other-maint" />
        <ReviewableRow label="Additional Requirements" value={payload.productData?.additionalRequirements} entityKey="other-req" />
        <ReviewableRow label="Additional Information" value={payload.productData?.additionalInformation} entityKey="other-info" />

        <Divider orientation="horizontal" plain>5. Global Specifications</Divider>
        {payload.globalSpecs && payload.globalSpecs.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            {modalMode === 'review' && (
              <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600">
                  {selectedSpecKeys.length > 0 ? `${selectedSpecKeys.length} selected` : 'Select rows to bulk process'}
                </div>
                <div className="flex gap-2">
                  <AntButton size="small" disabled={selectedSpecKeys.length === 0} onClick={() => handleBulkActionSpecs('approved')} className="text-green-600 border-green-600 hover:bg-green-50">
                    Approve Selected
                  </AntButton>
                  <AntButton size="small" disabled={selectedSpecKeys.length === 0} onClick={() => handleBulkActionSpecs('rejected')} className="text-red-600 border-red-600 hover:bg-red-50">
                    Reject Selected
                  </AntButton>
                  <AntButton size="small" type="primary" ghost onClick={handleBulkApproveSpecs}>
                    Approve All Pending
                  </AntButton>
                </div>
              </div>
            )}
            <AntTable
              rowSelection={modalMode === 'review' ? {
                selectedRowKeys: selectedSpecKeys,
                onChange: setSelectedSpecKeys,
              } : undefined}
              columns={specColumns}
              dataSource={payload.globalSpecs}
              rowKey="name"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </div>
        ) : (
          <div className="text-gray-500 italic mb-6">No global specifications provided.</div>
        )}

        <Divider orientation="horizontal" plain>6. Variants Matrix</Divider>
        {payload.variants && payload.variants.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
            {modalMode === 'review' && (
              <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600">
                  {selectedVariantKeys.length > 0 ? `${selectedVariantKeys.length} selected` : 'Select rows to bulk process'}
                </div>
                <div className="flex gap-2">
                  <AntButton size="small" disabled={selectedVariantKeys.length === 0} onClick={() => handleBulkActionVariants('approved')} className="text-green-600 border-green-600 hover:bg-green-50">
                    Approve Selected
                  </AntButton>
                  <AntButton size="small" disabled={selectedVariantKeys.length === 0} onClick={() => handleBulkActionVariants('rejected')} className="text-red-600 border-red-600 hover:bg-red-50">
                    Reject Selected
                  </AntButton>
                  <AntButton size="small" type="primary" ghost onClick={handleBulkApproveVariants}>
                    Approve All Pending
                  </AntButton>
                </div>
              </div>
            )}
            <AntTable
              rowSelection={modalMode === 'review' ? {
                selectedRowKeys: selectedVariantKeys,
                onChange: setSelectedVariantKeys,
              } : undefined}
              columns={variantColumns}
              dataSource={payload.variants}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </div>
        ) : (
          <div className="text-gray-500 italic">No variants provided.</div>
        )}
      </div>

      {modalMode === 'review' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {pendingFieldsCount > 0 ? (
                <span><span className="font-semibold text-gray-900">{pendingFieldsCount}</span> fields still require your review.</span>
              ) : (
                <span className="text-green-600 font-semibold"><Lucide.CheckCircle size={16} className="inline mr-1 -mt-0.5" /> All fields reviewed!</span>
              )}
            </div>
            <div className="flex gap-3">
              <AntButton size="large" onClick={handleSaveProgress}>
                <Lucide.Save size={16} className="mr-2" />
                Save Progress
              </AntButton>

              <AntButton size="large" danger disabled={rejectedFieldsCount === 0 || pendingFieldsCount > 0} onClick={handleReturnToUser}>
                <Lucide.XCircle size={16} className="mr-2" />
                Return to User
              </AntButton>

              <AntButton
                size="large"
                type="primary"
                className="bg-green-600 hover:bg-green-700"
                disabled={pendingFieldsCount > 0 || rejectedFieldsCount > 0}
                onClick={handleApproveProduct}
              >
                <Lucide.CheckCircle size={16} className="mr-2" />
                Fully Approve Product
              </AntButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformReviewDetail;
