import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Modal, Input, notification, Switch, Divider, Badge } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import WorkflowTimeline, { type ProductStatus } from '../../components/common/WorkflowTimeline';

// Define the Submitted Product type
interface SubmittedProduct {
  id: string;
  submitterName: string; // Could be a user or a business
  productName: string;
  categoryName: string;
  status: ProductStatus;
  submittedAt: string;

  // Detailed Payload for granular review
  payload: {
    basicInfo: {
      name: string;
      description: string;
      brand: string;
      partNumber: string;
      modelNumber: string;
      manufacturer: string;
    };
    attributes: { name: string; value: string }[];
    variants: { id: string; name: string; price: number; stock: number; minOrder: number }[];
  }
}

// Generate Mock Data using the complex payload structure provided
const generateMockSubmissions = (): SubmittedProduct[] => {
  return [
    {
      id: 'sub-1', submitterName: 'Acme Corp (Business)', productName: 'Sample product A', categoryName: 'Floating Ball Valves', status: 'Submitted', submittedAt: '2023-10-26 14:30',
      payload: {
        basicInfo: { name: 'Sample product A', description: 'rgsedg', brand: 'Brand A', partNumber: '2', modelNumber: '1', manufacturer: 'Manufacture A' },
        attributes: [{ name: 'Pressure components', value: 'BS EN ISO 10204 Type 3.1' }, { name: 'All components', value: 'BS EN ISO 10204 Type 2.2' }, { name: 'Design', value: 'ISO 17292' }],
        variants: [{ id: 'v1', name: '150#', price: 0, stock: 0, minOrder: 1 }, { id: 'v2', name: '300#', price: 0, stock: 0, minOrder: 1 }]
      }
    },
    {
      id: 'sub-2', submitterName: 'John Doe (Individual)', productName: 'Micro Controller Pro', categoryName: 'Logic Boards', status: 'Changes Requested', submittedAt: '2023-10-25 09:15',
      payload: {
        basicInfo: { name: 'Micro Controller Pro', description: 'Advanced logic board.', brand: 'TechFlow', partNumber: 'MCP-R2', modelNumber: 'R2', manufacturer: 'TechFlow' },
        attributes: [{ name: 'Clock Speed', value: '4 GHz' }, { name: 'RAM', value: '16GB' }],
        variants: [{ id: 'v1', name: '16GB Model', price: 50, stock: 100, minOrder: 100 }]
      }
    },
    {
      id: 'sub-3', submitterName: 'Jane Smith (Individual)', productName: 'Resubmitted Widget', categoryName: 'Widgets', status: 'Resubmitted', submittedAt: '2023-10-29 10:00',
      payload: {
        basicInfo: { name: 'Resubmitted Widget', description: 'Fixed the issues.', brand: 'Generic', partNumber: 'RW-1', modelNumber: '1', manufacturer: 'Generic' },
        attributes: [{ name: 'Color', value: 'Red' }],
        variants: [{ id: 'v1', name: 'Standard', price: 10, stock: 50, minOrder: 1 }]
      }
    },
  ];
};

const INITIAL_SUBMISSIONS = generateMockSubmissions();

const PlatformProductReview: React.FC = () => {
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);

  // Review Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState<SubmittedProduct | null>(null);

  // Rejections State map: { 'entity-key': 'Rejection Reason' }
  const [rejections, setRejections] = useState<Record<string, string>>({});

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-900 font-semibold">User Product Reviews</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const handleOpenReview = (product: SubmittedProduct) => {
    setReviewingProduct(product);
    setRejections({}); // Reset rejections for new review session
    setIsModalVisible(true);
  };

  const handleToggleRejection = (key: string, isRejected: boolean) => {
    setRejections(prev => {
      const next = { ...prev };
      if (isRejected) {
        next[key] = ''; // Open input for reason
      } else {
        delete next[key]; // Approved
      }
      return next;
    });
  };

  const handleUpdateRejectionReason = (key: string, reason: string) => {
    setRejections(prev => ({ ...prev, [key]: reason }));
  };

  const handleSubmitReview = (finalStatus: ProductStatus) => {
    if (finalStatus === 'Changes Requested' && Object.keys(rejections).length === 0) {
      notification.error({ message: 'You must reject at least one field to request changes.' });
      return;
    }

    // In real app, we would save the rejections payload to the backend
    setSubmissions(submissions.map(s => s.id === reviewingProduct?.id ? { ...s, status: finalStatus } : s));
    notification.success({ message: `Review submitted: ${finalStatus}` });
    setIsModalVisible(false);
  };

  const handleStartReview = () => {
    if (reviewingProduct && (reviewingProduct.status === 'Submitted' || reviewingProduct.status === 'Resubmitted')) {
      setSubmissions(submissions.map(s => s.id === reviewingProduct.id ? { ...s, status: 'Under Review' } : s));
      setReviewingProduct({ ...reviewingProduct, status: 'Under Review' });
    }
  };

  const getStatusTag = (status: ProductStatus) => {
    switch (status) {
      case 'Published': return <AntTag color="success">Published</AntTag>;
      case 'Approved': return <AntTag color="green">Approved</AntTag>;
      case 'Submitted':
      case 'Resubmitted': return <AntTag color="processing">{status}</AntTag>;
      case 'Under Review': return <AntTag color="blue">Under Review</AntTag>;
      case 'Changes Requested': return <AntTag color="warning">Changes Requested</AntTag>;
      case 'Draft': return <AntTag color="default">Draft</AntTag>;
      default: return <AntTag>{status}</AntTag>;
    }
  };

  const columns = [
    { title: 'Submitted By', dataIndex: 'submitterName', key: 'submitterName', render: (t: string) => <span className="font-semibold">{t}</span> },
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    { title: 'Category', dataIndex: 'categoryName', key: 'category' },
    { title: 'Submitted At', dataIndex: 'submittedAt', key: 'submittedAt', render: (t: string) => <span className="text-gray-500 text-sm">{t}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: ProductStatus) => getStatusTag(status) },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: SubmittedProduct) => (
        <AntButton type="primary" size="small" onClick={() => handleOpenReview(record)}>
          Review Submission
        </AntButton>
      ),
    },
  ];

  // Helper component to render a reviewable row
  const ReviewableRow = ({ label, value, entityKey }: { label: string; value: any; entityKey: string }) => {
    const isRejected = rejections[entityKey] !== undefined;
    return (
      <div className={`p-3 rounded mb-2 border ${isRejected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{label}</div>
            <div className="text-gray-900 font-medium">{value || <span className="text-gray-400 italic">Not provided</span>}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={isRejected ? "text-red-500 text-xs font-semibold" : "text-green-600 text-xs font-semibold"}>
              {isRejected ? 'REJECTED' : 'APPROVED'}
            </span>
            <Switch
              checked={!isRejected}
              onChange={(checked) => handleToggleRejection(entityKey, !checked)}
              className={!isRejected ? "bg-green-500" : "bg-red-500"}
            />
          </div>
        </div>
        {isRejected && (
          <div className="mt-3">
            <Input
              placeholder={`Reason for rejecting ${label}... (Required)`}
              value={rejections[entityKey]}
              onChange={(e) => handleUpdateRejectionReason(entityKey, e.target.value)}
              status={rejections[entityKey] ? '' : 'error'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">User Product Reviews</h1>
        <p className="text-gray-500">Granularly review and approve products submitted by individuals and businesses.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <AntTable
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={
          <div className="flex flex-col">
            <span className="text-lg font-bold">Review Product Submission</span>
            <span className="text-sm font-normal text-gray-500">From: {reviewingProduct?.submitterName}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <AntButton key="cancel" onClick={() => setIsModalVisible(false)}>
            Close
          </AntButton>,
          (reviewingProduct?.status === 'Submitted' || reviewingProduct?.status === 'Resubmitted') && (
            <AntButton key="start" type="default" onClick={handleStartReview}>
              Start Review
            </AntButton>
          ),
          Object.keys(rejections).length > 0 ? (
            <AntButton key="reject" danger type="primary" onClick={() => handleSubmitReview('Changes Requested')}>
              Send {Object.keys(rejections).length} Change Requests
            </AntButton>
          ) : (
            <AntButton key="approve" type="primary" className="bg-green-600" onClick={() => handleSubmitReview('Approved')}>
              Approve & Publish Product
            </AntButton>
          )
        ]}
      >
        {reviewingProduct && (
          <div className="mt-4 max-h-[600px] overflow-y-auto pr-2">

            <WorkflowTimeline currentStatus={reviewingProduct.status} />

            <div className="mb-4 bg-sky-50 p-3 rounded border border-sky-100 text-sky-800 text-sm">
              <Lucide.Info size={16} className="inline mr-2" />
              Toggle the switch on any field to reject it and request a change. If all switches are green, you can fully approve the product.
            </div>

            <Divider orientation="horizontal" plain>1. Basic Information</Divider>
            <ReviewableRow label="Product Name" value={reviewingProduct.payload.basicInfo.name} entityKey="basic-name" />
            <ReviewableRow label="Description" value={reviewingProduct.payload.basicInfo.description} entityKey="basic-desc" />
            <ReviewableRow label="Brand" value={reviewingProduct.payload.basicInfo.brand} entityKey="basic-brand" />
            <ReviewableRow label="Part Number" value={reviewingProduct.payload.basicInfo.partNumber} entityKey="basic-pn" />

            <Divider orientation="horizontal" plain>2. Engineering / Dynamic Attributes</Divider>
            {reviewingProduct.payload.attributes.map(attr => (
              <ReviewableRow key={`attr-${attr.name}`} label={`Attribute: ${attr.name}`} value={attr.value} entityKey={`attr-${attr.name}`} />
            ))}

            <Divider orientation="horizontal" plain>3. Variants Matrix</Divider>
            {reviewingProduct.payload.variants.map(v => (
              <div key={v.id} className={`p-3 rounded mb-2 border ${rejections[`variant-${v.id}`] !== undefined ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-900">Variant: {v.name}</div>
                  <div className="flex items-center gap-2">
                    <span className={rejections[`variant-${v.id}`] !== undefined ? "text-red-500 text-xs font-semibold" : "text-green-600 text-xs font-semibold"}>
                      {rejections[`variant-${v.id}`] !== undefined ? 'REJECTED' : 'APPROVED'}
                    </span>
                    <Switch
                      checked={rejections[`variant-${v.id}`] === undefined}
                      onChange={(checked) => handleToggleRejection(`variant-${v.id}`, !checked)}
                      className={rejections[`variant-${v.id}`] === undefined ? "bg-green-500" : "bg-red-500"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm bg-white p-2 border border-gray-100 rounded">
                  <div><span className="text-gray-500">Price:</span> ${v.price}</div>
                  <div><span className="text-gray-500">Stock:</span> {v.stock}</div>
                  <div><span className="text-gray-500">Min Order:</span> {v.minOrder}</div>
                </div>
                {rejections[`variant-${v.id}`] !== undefined && (
                  <div className="mt-3">
                    <Input
                      placeholder="Reason for rejecting this variant... (Required)"
                      value={rejections[`variant-${v.id}`]}
                      onChange={(e) => handleUpdateRejectionReason(`variant-${v.id}`, e.target.value)}
                      status={rejections[`variant-${v.id}`] ? '' : 'error'}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlatformProductReview;
