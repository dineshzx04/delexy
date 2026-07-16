import React, { useState, useMemo, useEffect } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input, Tabs as AntTabs } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { getProducts, updateProduct, type Product } from '../../data/mockProducts';

const PlatformProductReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    // Load from our unified module store, filtering out Drafts
    setSubmissions(getProducts().filter(p => p.status !== 'Draft'));
  }, []);

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
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.tenantName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [submissions, activeTab, searchText]);

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
      title: 'Tenant / Submitter',
      dataIndex: 'tenantName',
      key: 'tenantName',
      render: (text: string) => <span className="font-medium text-gray-900">{text}</span>,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string) => <AntTag>{text}</AntTag>,
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
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (text: string) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Product) => {
        if (record.status === 'Submitted' || record.status === 'Resubmitted' || record.status === 'Under Review') {
          return (
            <AntButton
              type="primary"
              className={record.status === 'Under Review' ? "bg-orange-500 hover:bg-orange-600" : "bg-sky-600 hover:bg-sky-700"}
              onClick={() => {
                if (record.status === 'Submitted' || record.status === 'Resubmitted') {
                  updateProduct(record.id, { status: 'Under Review' });
                }
                navigate(`/platform/review/${record.id}`);
              }}
            >
              {record.status === 'Under Review' ? 'Continue Review' : 'Start Review'}
            </AntButton>
          );
        } else if (record.status === 'Approved') {
          return (
            <AntButton
              type="primary"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                 updateProduct(record.id, { status: 'Published' });
                 setSubmissions(getProducts().filter(p => p.status !== 'Draft'));
              }}
            >
              Publish to Catalog
            </AntButton>
          );
        }
        return (
          <AntButton onClick={() => navigate(`/platform/review/${record.id}`)}>
            View Product
          </AntButton>
        );
      },
    },
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
          dataSource={filteredSubmissions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default PlatformProductReview;
