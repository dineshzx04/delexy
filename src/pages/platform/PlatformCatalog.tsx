import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input, Modal, notification } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

interface PublishedProduct {
  id: string;
  submitterName: string;
  productName: string;
  categoryName: string;
  publishedAt: string;
  status: 'Live' | 'Suspended';
}

const generateMockPublished = (): PublishedProduct[] => [
  { id: 'pub-1', submitterName: 'Acme Corp (Business)', productName: 'Ultra Widget 5000', categoryName: 'Industrial Sensors', publishedAt: '2023-11-01 10:00', status: 'Live' },
  { id: 'pub-2', submitterName: 'John Doe (Individual)', productName: 'Micro Controller Pro', categoryName: 'Logic Boards', publishedAt: '2023-11-02 11:30', status: 'Live' },
  { id: 'pub-3', submitterName: 'Global Tech Ltd', productName: 'Heavy Duty Servo HDS-99', categoryName: 'Motors', publishedAt: '2023-11-05 14:20', status: 'Suspended' },
];

const INITIAL_CATALOG = generateMockPublished();

const PlatformCatalog: React.FC = () => {
  const [products, setProducts] = useState(INITIAL_CATALOG);
  const [searchText, setSearchText] = useState('');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-900 font-semibold">Live Catalog</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.productName.toLowerCase().includes(searchText.toLowerCase()) || 
      p.submitterName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText]);

  const handleToggleStatus = (record: PublishedProduct) => {
    if (record.status === 'Live') {
      Modal.confirm({
        title: 'Suspend Product?',
        content: `Are you sure you want to suspend "${record.productName}"? It will immediately be removed from the global user catalog.`,
        okText: 'Yes, Suspend',
        okButtonProps: { danger: true },
        onOk: () => {
          setProducts(products.map(p => p.id === record.id ? { ...p, status: 'Suspended' } : p));
          notification.success({ message: 'Product suspended successfully.' });
        }
      });
    } else {
      setProducts(products.map(p => p.id === record.id ? { ...p, status: 'Live' } : p));
      notification.success({ message: 'Product reinstated to Live status.' });
    }
  };

  const columns = [
    { title: 'Product Name', dataIndex: 'productName', key: 'productName', render: (t: string) => <span className="font-semibold text-gray-900">{t}</span> },
    { title: 'Seller / Submitter', dataIndex: 'submitterName', key: 'submitterName' },
    { title: 'Category', dataIndex: 'categoryName', key: 'category' },
    { title: 'Published At', dataIndex: 'publishedAt', key: 'publishedAt', render: (t: string) => <span className="text-gray-500 text-sm">{t}</span> },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => (
        <AntTag color={status === 'Live' ? 'success' : 'error'}>{status.toUpperCase()}</AntTag>
      ) 
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: PublishedProduct) => (
        <AntButton 
          type="text" 
          danger={record.status === 'Live'}
          className={record.status === 'Suspended' ? 'text-sky-600' : ''}
          onClick={() => handleToggleStatus(record)}
        >
          {record.status === 'Live' ? 'Suspend' : 'Reinstate'}
        </AntButton>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Global Live Catalog</h1>
          <p className="text-gray-500">Manage all approved and live products across the entire platform.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Input 
            placeholder="Search by product or seller name..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            className="w-80"
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

export default PlatformCatalog;
