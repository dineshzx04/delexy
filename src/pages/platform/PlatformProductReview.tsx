import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Modal, Input, notification, Switch, Divider, Tabs as AntTabs } from 'antd';
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

  // Detailed Payload for granular review (Mirrors ProductBuilder output)
  payload: {
    productData: Record<string, any>;
    globalSpecs: { name: string; value: string }[];
    variants: { id: string; name: string; sku: string; price: number; stock: number; minOrder: number }[];
  }
}

// Generate Mock Data using the complex payload structure provided
const generateMockSubmissions = (): SubmittedProduct[] => {
  return [
    {
      id: 'sub-1', submitterName: 'Acme Corp (Business)', productName: 'Sample product A', categoryName: 'Floating Ball Valves', status: 'Submitted', submittedAt: '2023-10-26 14:30',
      payload: {
        productData: {
          platformProductId: 'pp-3',
          height: '10', width: '20', emptyWeight: '50kg',
          name: 'Sample product A', modelNumber: '1', partNumber: '2',
          yearOfManufacture: 2023, countryOfOrigin: 'US', manufacturer: 'acme', brand: 'brand-x',
          seller: 'vendor-a', deviations: 'None', exclusions: 'None', assumptions: 'None'
        },
        globalSpecs: [{ name: 'Material Grade', value: 'Standard' }],
        variants: [{ id: 'v1', name: '150#', sku: 'PP-3-V1', price: 100, stock: 50, minOrder: 1 }, { id: 'v2', name: '300#', sku: 'PP-3-V2', price: 150, stock: 30, minOrder: 1 }]
      }
    },
    {
      id: 'sub-2', submitterName: 'John Doe (Individual)', productName: 'Micro Controller Pro', categoryName: 'Logic Boards', status: 'Changes Requested', submittedAt: '2023-10-25 09:15',
      payload: {
        productData: {
          name: 'Micro Controller Pro', modelNumber: 'R2', partNumber: 'MCP-R2', manufacturer: 'globaltech', brand: 'premium'
        },
        globalSpecs: [{ name: 'Clock Speed', value: '4 GHz' }, { name: 'RAM', value: '16GB' }],
        variants: [{ id: 'v1', name: '16GB Model', sku: 'MC-R2-V1', price: 50, stock: 100, minOrder: 100 }]
      }
    },
    {
      id: 'sub-3', submitterName: 'Jane Smith (Individual)', productName: 'Resubmitted Widget', categoryName: 'Widgets', status: 'Resubmitted', submittedAt: '2023-10-29 10:00',
      payload: {
        productData: { name: 'Resubmitted Widget', partNumber: 'RW-1' },
        globalSpecs: [{ name: 'Color', value: 'Red' }],
        variants: [{ id: 'v1', name: 'Standard', sku: 'RW-1-V1', price: 10, stock: 50, minOrder: 1 }]
      }
    },
    {
      id: 'pub-3', submitterName: 'Global Tech Ltd', productName: 'Heavy Duty Servo HDS-99', categoryName: 'Motors', status: 'Published', submittedAt: '2023-11-05 14:20',
      payload: { productData: { name: 'Heavy Duty Servo HDS-99' }, globalSpecs: [], variants: [] }
    },
    {
      id: 'sub-4', submitterName: 'Beta Manufacturing (Business)', productName: 'Hydraulic Pump V1', categoryName: 'Pumps', status: 'Draft', submittedAt: '2023-11-06 08:00',
      payload: { productData: { name: 'Hydraulic Pump V1' }, globalSpecs: [], variants: [] }
    },
    {
      id: 'sub-5', submitterName: 'Gamma Electronics (Business)', productName: 'Circuit Breaker X', categoryName: 'Electrical Components', status: 'Under Review', submittedAt: '2023-11-06 09:30',
      payload: { productData: { name: 'Circuit Breaker X' }, globalSpecs: [], variants: [] }
    },
    {
      id: 'sub-6', submitterName: 'Delta Robotics', productName: 'Stepper Motor NEMA 17', categoryName: 'Motors', status: 'Approved', submittedAt: '2023-11-06 11:15',
      payload: { productData: { name: 'Stepper Motor NEMA 17' }, globalSpecs: [], variants: [] }
    },
  ];
};

const INITIAL_SUBMISSIONS = generateMockSubmissions();

const PlatformProductReview: React.FC = () => {
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');

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

  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    
    if (activeTab !== 'All') {
      result = result.filter(p => p.status === activeTab);
    }

    return result.filter(p =>
      p.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.submitterName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [submissions, searchText, activeTab]);

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

  const handlePublishStatus = (record: SubmittedProduct) => {
    Modal.confirm({
      title: 'Publish Product?',
      content: `Are you sure you want to publish "${record.productName}" to the live global catalog?`,
      okText: 'Yes, Publish',
      okButtonProps: { className: 'bg-green-600' },
      onOk: () => {
        setSubmissions(submissions.map(p => p.id === record.id ? { ...p, status: 'Published' } : p));
        notification.success({ message: 'Product is now live in the catalog.' });
      }
    });
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
      render: (_: any, record: SubmittedProduct) => {
        if (record.status === 'Draft' || record.status === 'Published') {
           return <span className="text-gray-400 text-xs italic">No Action</span>;
        }
        if (record.status === 'Approved') {
           return (
             <AntButton type="primary" className="bg-green-600" size="small" onClick={() => handlePublishStatus(record)}>
               Publish to Catalog
             </AntButton>
           );
        }
        return (
          <AntButton type="primary" size="small" onClick={() => handleOpenReview(record)}>
            Review Submission
          </AntButton>
        );
      },
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
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
          <AntTabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="w-full sm:w-auto"
            style={{ marginBottom: -16 }} // Align tabs with the bottom border
            items={[
              { key: 'All', label: 'All Products' },
              { key: 'Draft', label: 'Drafts' },
              { key: 'Submitted', label: 'Submitted' },
              { key: 'Under Review', label: 'Under Review' },
              { key: 'Changes Requested', label: 'Changes Requested' },
              { key: 'Resubmitted', label: 'Resubmitted' },
              { key: 'Approved', label: 'Approved' },
              { key: 'Published', label: 'Published' },
            ]}
          />
          <Input
            placeholder="Search by product or submitter..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          columns={columns}
          dataSource={filteredSubmissions}
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

            <Divider orientation="horizontal" plain>1. Dimensions & Weight</Divider>
            <ReviewableRow label="Height" value={reviewingProduct.payload.productData.height} entityKey="dim-height" />
            <ReviewableRow label="Width" value={reviewingProduct.payload.productData.width} entityKey="dim-width" />
            <ReviewableRow label="Empty Weight" value={reviewingProduct.payload.productData.emptyWeight} entityKey="dim-weight" />

            <Divider orientation="horizontal" plain>2. Production Details</Divider>
            <ReviewableRow label="Product Name" value={reviewingProduct.payload.productData.name} entityKey="prod-name" />
            <ReviewableRow label="Model Number" value={reviewingProduct.payload.productData.modelNumber} entityKey="prod-model" />
            <ReviewableRow label="Part Number" value={reviewingProduct.payload.productData.partNumber} entityKey="prod-part" />
            <ReviewableRow label="Year of Manufacture" value={reviewingProduct.payload.productData.yearOfManufacture} entityKey="prod-year" />
            <ReviewableRow label="Country of Origin" value={reviewingProduct.payload.productData.countryOfOrigin} entityKey="prod-country" />
            <ReviewableRow label="Manufacturer" value={reviewingProduct.payload.productData.manufacturer} entityKey="prod-mfg" />
            <ReviewableRow label="Brand" value={reviewingProduct.payload.productData.brand} entityKey="prod-brand" />

            <Divider orientation="horizontal" plain>3. Seller Details</Divider>
            <ReviewableRow label="Seller" value={reviewingProduct.payload.productData.seller} entityKey="seller-name" />

            <Divider orientation="horizontal" plain>4. Others</Divider>
            <ReviewableRow label="Deviations" value={reviewingProduct.payload.productData.deviations} entityKey="other-dev" />
            <ReviewableRow label="Exclusions" value={reviewingProduct.payload.productData.exclusions} entityKey="other-exc" />
            <ReviewableRow label="Assumptions" value={reviewingProduct.payload.productData.assumptions} entityKey="other-ass" />
            <ReviewableRow label="Operation Instructions" value={reviewingProduct.payload.productData.operationInstructions} entityKey="other-op" />
            <ReviewableRow label="Safety Instructions" value={reviewingProduct.payload.productData.safetyInstructions} entityKey="other-saf" />
            <ReviewableRow label="Handling Instructions" value={reviewingProduct.payload.productData.handlingInstructions} entityKey="other-hand" />
            <ReviewableRow label="Maintenance Instructions" value={reviewingProduct.payload.productData.maintenanceInstructions} entityKey="other-maint" />
            <ReviewableRow label="Additional Requirements" value={reviewingProduct.payload.productData.additionalRequirements} entityKey="other-req" />
            <ReviewableRow label="Additional Information" value={reviewingProduct.payload.productData.additionalInformation} entityKey="other-info" />

            <Divider orientation="horizontal" plain>5. Global Specifications</Divider>
            {reviewingProduct.payload.globalSpecs.map((spec, i) => (
              <ReviewableRow key={`spec-${i}`} label={`Spec: ${spec.name}`} value={spec.value} entityKey={`spec-${spec.name}`} />
            ))}

            <Divider orientation="horizontal" plain>6. Variants Matrix</Divider>
            {reviewingProduct.payload.variants.map(v => (
              <div key={v.id} className={`p-3 rounded mb-2 border ${rejections[`variant-${v.id}`] !== undefined ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">Variant: {v.name}</div>
                    <div className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600 mt-1 inline-block">SKU: {v.sku}</div>
                  </div>
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
