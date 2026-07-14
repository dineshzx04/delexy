import React, { useState, useMemo } from 'react';
import { Table as AntTable, Input as AntInput, Button as AntButton, Tag as AntTag, Dropdown as AntDropdown } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

// Define the User Product type
export interface UserProduct {
  id: string;
  name: string;
  partNumber: string;
  categoryName: string;
  status: 'Draft' | 'Pending Review' | 'Changes Requested' | 'Published';
  updatedAt: string;
}

// Generate Mock Data
const generateMockProducts = (): UserProduct[] => {
  return [
    { id: 'tp-1', name: 'Ultra Widget 5000', partNumber: 'UW-5000-X', categoryName: 'Industrial Sensors', status: 'Published', updatedAt: '2023-10-25' },
    { id: 'tp-2', name: 'Micro Controller Pro', partNumber: 'MCP-REV2', categoryName: 'Logic Boards', status: 'Pending Review', updatedAt: '2023-10-26' },
    { id: 'tp-3', name: 'Heavy Duty Servo', partNumber: 'HDS-99', categoryName: 'Motors', status: 'Changes Requested', updatedAt: '2023-10-27' },
    { id: 'tp-4', name: 'Lithium Battery Pack', partNumber: 'LBP-10AH', categoryName: 'Power Systems', status: 'Draft', updatedAt: '2023-10-28' },
  ];
};

const INITIAL_PRODUCTS = generateMockProducts();

const UserProductsList: React.FC = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <span className="text-gray-900 font-semibold">Products</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'Published': return <AntTag color="success">Published</AntTag>;
      case 'Pending Review': return <AntTag color="processing">Pending Review</AntTag>;
      case 'Changes Requested': return <AntTag color="warning">Changes Requested</AntTag>;
      case 'Draft': return <AntTag color="default">Draft (Self Revision)</AntTag>;
      default: return <AntTag>{status}</AntTag>;
    }
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
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      render: (_: any, record: UserProduct) => (
        <AntButton
          type="text"
          size="small"
          className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
          onClick={() => navigate(`/products/${record.id}/edit`)}
        >
          {record.status === 'Published' ? 'View' : 'Edit'}
        </AntButton>
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
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search by name or part number..."
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

export default UserProductsList;
