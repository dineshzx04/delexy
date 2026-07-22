import React from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

const RolesList: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">App</Link>, url: '/' },
    { title: <Link to="/rbac/roles" className="text-gray-900 font-semibold cursor-default pointer-events-none">Roles & Permissions</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const roles = [
    {
      id: '1',
      name: 'Organization Admin',
      description: 'Full access to all organization settings, billing, and user management.',
      usersCount: 2,
      lastModified: 'Oct 12, 2023',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Procurement Manager',
      description: 'Can create and manage RFQs, approve Purchase Orders, and browse the supplier directory.',
      usersCount: 5,
      lastModified: 'Nov 05, 2023',
      isDefault: false,
    },
    {
      id: '3',
      name: 'Sales Manager',
      description: 'Can create products, respond to RFQs with quotes, and manage incoming orders.',
      usersCount: 3,
      lastModified: 'Dec 01, 2023',
      isDefault: false,
    },
    {
      id: '4',
      name: 'Finance Viewer',
      description: 'Read-only access to invoices and payment methods.',
      usersCount: 1,
      lastModified: 'Jan 15, 2024',
      isDefault: false,
    }
  ];

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {text}
            {record.isDefault && <AntTag color="blue" className="m-0 border-0 text-[10px] leading-3">DEFAULT</AntTag>}
          </div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      )
    },
    {
      title: 'Assigned Users',
      dataIndex: 'usersCount',
      key: 'usersCount',
      width: 150,
      render: (count: number) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Lucide.Users size={16} />
          {count} users
        </div>
      )
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 150,
      render: (text: string) => <span className="text-gray-500">{text}</span>
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => navigate(`/rbac/roles/${record.id}`)}>
            Edit
          </AntButton>
          {!record.isDefault && (
            <AntButton type="text" danger size="small">
              Delete
            </AntButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Roles & Permissions</h1>
          <p className="text-gray-500">Manage what your team members can see and do within your organization.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => navigate('/rbac/roles/new')}>
          <Lucide.Plus size={16} /> Create Custom Role
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput 
            placeholder="Search roles..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            className="w-72"
          />
        </div>
        <AntTable 
          columns={columns} 
          dataSource={roles} 
          pagination={false}
          className="w-full"
          rowKey="id"
          rowClassName="hover:bg-slate-50 transition-colors"
        />
      </div>
    </div>
  );
};

export default RolesList;
