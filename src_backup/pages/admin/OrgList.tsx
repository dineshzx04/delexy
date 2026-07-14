import React from 'react';
import { Table, Button, Tag, Space, Dropdown, Menu, Badge } from 'antd';
import { Search, Plus, MoreVertical, Edit2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const OrgList = () => {
  const columns = [
    { title: 'Org ID', dataIndex: 'id', key: 'id', render: (text: string) => <span className="font-mono text-gray-600">{text}</span> },
    { title: 'Organization Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold">{text}</span> },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'Active' ? 'green' : s === 'Pending' ? 'orange' : 'red'}>{s}</Tag>
    )},
    { title: 'Users', dataIndex: 'users', key: 'users' },
    { title: 'Joined', dataIndex: 'joined', key: 'joined' },
    { title: 'Action', key: 'action', render: () => (
      <Dropdown menu={{
        items: [
          { key: '1', icon: <Edit2 size={16} />, label: 'Edit Profile' },
          { key: '2', icon: <CheckCircle size={16} className="text-green-600" />, label: 'Approve' },
          { key: '3', icon: <XCircle size={16} className="text-red-600" />, label: 'Suspend' },
        ]
      }} trigger={['click']}>
        <Button type="text" icon={<MoreVertical size={16} />} />
      </Dropdown>
    )},
  ];
  
  const data = [
    { key: '1', id: 'ORG-1001', name: 'Acme Corp', type: 'Buyer & Seller', status: 'Active', users: 12, joined: '2025-01-15' },
    { key: '2', id: 'ORG-1002', name: 'Global Tech', type: 'Buyer', status: 'Pending', users: 3, joined: '2026-07-12' },
    { key: '3', id: 'ORG-1003', name: 'Pioneer Valves Ltd.', type: 'Seller', status: 'Suspended', users: 8, joined: '2024-11-20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
          <p className="text-gray-500">Manage tenant accounts, approve new registrations, and oversee roles.</p>
        </div>
        <Button type="primary" size="large" icon={<Plus size={18} />}>
          Invite Organization
        </Button>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <Table columns={columns} dataSource={data} />
      </div>
    </div>
  );
};
export default OrgList;
