import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input, Tabs as AntTabs } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserProduct } from '../../data/db';

const PlatformProductReview: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('Submitted');
  const navigate = useNavigate();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-900 font-semibold">User Product Reviews</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const products = useLiveQuery(() => {
    if (activeTab === 'All') return db.userProducts.toArray();
    return db.userProducts.where('status').equals(activeTab).toArray();
  }, [activeTab]) || [];

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.tenantId.toLowerCase().includes(searchText.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Submitted': return 'blue';
      case 'Under Review': return 'orange';
      case 'Changes Requested': return 'warning';
      case 'Resubmitted': return 'purple';
      case 'Approved': return 'success';
      case 'Published': return 'cyan';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Tenant',
      key: 'tenant',
      render: (_: any, record: UserProduct) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{record.tenantId}</span>
        </div>
      )
    },
    {
      title: 'Product Name',
      key: 'product',
      render: (_: any, record: UserProduct) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sky-700">{record.name}</span>
          <span className="text-xs text-gray-500">Part: {record.partNumber}</span>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <AntTag color={getStatusColor(status)} className="font-semibold uppercase text-xs tracking-wider">
          {status}
        </AntTag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: UserProduct) => (
        <AntButton 
          type="primary"
          className="bg-sky-600"
          size="small"
          onClick={() => navigate(`/platform/review/${record.id}`)}
        >
          Review
        </AntButton>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Product Reviews</h1>
          <p className="text-gray-500 mt-1">Review and approve tenant products before they go live on the platform catalog.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <AntTabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="mb-0"
            items={[
              { key: 'All', label: 'All Submissions' },
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
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default PlatformProductReview;
