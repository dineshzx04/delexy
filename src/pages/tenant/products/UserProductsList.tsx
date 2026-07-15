import React, { useState, useMemo } from 'react';
import { Table as AntTable, Input as AntInput, Button as AntButton, Tag as AntTag, Modal, Tabs as AntTabs } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import WorkflowTimeline, { type ProductStatus } from '../../../components/common/WorkflowTimeline';

// Define the User Product type
export interface UserProduct {
  id: string;
  name: string;
  partNumber: string;
  categoryName: string;
  status: ProductStatus;
  updatedAt: string;
}

// Generate Mock Data
const generateMockProducts = (): UserProduct[] => {
  return [
    { id: 'tp-1', name: 'Sample product A', partNumber: '2', categoryName: 'Floating Ball Valves', status: 'Published', updatedAt: '2023-10-25' },
    { id: 'tp-2', name: 'Micro Controller Pro', partNumber: 'MCP-REV2', categoryName: 'Logic Boards', status: 'Under Review', updatedAt: '2023-10-26' },
    { id: 'tp-3', name: 'Heavy Duty Servo', partNumber: 'HDS-99', categoryName: 'Motors', status: 'Changes Requested', updatedAt: '2023-10-27' },
    { id: 'tp-4', name: 'Lithium Battery Pack', partNumber: 'LBP-10AH', categoryName: 'Power Systems', status: 'Draft', updatedAt: '2023-10-28' },
    { id: 'tp-5', name: 'Resubmitted Widget', partNumber: 'RW-1', categoryName: 'Widgets', status: 'Resubmitted', updatedAt: '2023-10-29' },
  ];
};

const INITIAL_PRODUCTS = generateMockProducts();

const UserProductsList: React.FC = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false);
  const [selectedProductStatus, setSelectedProductStatus] = useState<ProductStatus | null>(null);
  const navigate = useNavigate();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <span className="text-gray-900 font-semibold">Products</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (activeTab !== 'All') {
      if (activeTab === 'Submitted/Review') {
        result = result.filter(p => p.status === 'Submitted' || p.status === 'Resubmitted' || p.status === 'Under Review');
      } else {
        result = result.filter(p => p.status === activeTab);
      }
    }

    return result.filter(p =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText, activeTab]);

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

  const handleViewStatus = (status: ProductStatus) => {
    setSelectedProductStatus(status);
    setIsTimelineModalVisible(true);
  };

  const columns = [
    {
      title: 'Product Info',
      key: 'info',
      render: (_: any, record: UserProduct) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{record.name}</span>
          <span className="text-xs text-gray-500 font-mono">PN: {record.partNumber}</span>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'category',
      render: (text: string) => (
        <span className="text-gray-600 flex items-center gap-1 text-sm">
          <Lucide.FolderTree size={14} className="text-gray-400" />
          {text}
        </span>
      )
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => <span className="text-gray-500 text-sm">{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProductStatus) => getStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'action',
      width: 150,
      render: (_: any, record: UserProduct) => (
        <div className="flex gap-2">
          <AntButton
            type="text"
            size="small"
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            onClick={() => handleViewStatus(record.status)}
          >
            Status
          </AntButton>
          <AntButton
            type="text"
            size="small"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            onClick={() => navigate(`/products/${record.id}/edit`)}
          >
            {record.status === 'Published' ? 'View' : 'Edit'}
          </AntButton>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Products</h1>
          <p className="text-gray-500">Manage your business inventory and platform submissions.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => navigate('/products/new')}>
          <Lucide.Plus size={16} /> Create New Product
        </AntButton>
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
              { key: 'Submitted/Review', label: 'Pending Review' },
              { key: 'Changes Requested', label: 'Action Required' },
              { key: 'Published', label: 'Published' },
            ]}
          />
          <AntInput
            placeholder="Search by name or part number..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="Product Workflow Status"
        open={isTimelineModalVisible}
        onCancel={() => setIsTimelineModalVisible(false)}
        footer={[
          <AntButton key="close" onClick={() => setIsTimelineModalVisible(false)}>
            Close
          </AntButton>
        ]}
        width={700}
      >
        {selectedProductStatus && (
          <div className="mt-6">
            <WorkflowTimeline currentStatus={selectedProductStatus} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserProductsList;
