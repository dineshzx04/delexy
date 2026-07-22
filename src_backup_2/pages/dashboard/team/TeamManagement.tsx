import React, { useState } from 'react';
import { Tabs as AntTabs, Table as AntTable, Button as AntButton, Tag as AntTag, Dropdown as AntDropdown, Modal as AntModal, Form as AntForm, Input as AntInput, Select as AntSelect, notification } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

const { TabPane } = AntTabs;

const TeamManagement: React.FC = () => {
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteForm] = AntForm.useForm();

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">App</Link>, url: '/' },
    { title: <span className="text-gray-900 font-semibold">User Management</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const activeUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Organization Admin', status: 'active', joined: 'Oct 12, 2023' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', role: 'Procurement Manager', status: 'active', joined: 'Nov 05, 2023' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Sales Manager', status: 'active', joined: 'Dec 01, 2023' },
  ];

  const pendingInvites = [
    { id: '101', email: 'new.hire@example.com', role: 'Finance Viewer', invitedBy: 'John Doe', sentDate: 'Feb 10, 2024', status: 'pending' },
    { id: '102', email: 'contractor@example.com', role: 'Procurement Manager', invitedBy: 'John Doe', sentDate: 'Jan 05, 2024', status: 'expired' },
  ];

  const handleInvite = (values: any) => {
    notification.success({
      message: 'Invitation Sent',
      description: `An invitation has been sent to ${values.email}.`,
    });
    setIsInviteModalVisible(false);
    inviteForm.resetFields();
  };

  const usersColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
            {record.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <AntTag color="blue">{role}</AntTag>
    },
    {
      title: 'Joined',
      dataIndex: 'joined',
      key: 'joined',
      render: (text: string) => <span className="text-gray-500">{text}</span>
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      render: () => (
        <AntDropdown menu={{ items: [
          { key: '1', label: 'Change Role', icon: <Lucide.Shield size={14} /> },
          { key: '2', label: 'Deactivate User', icon: <Lucide.UserX size={14} />, danger: true }
        ]}} trigger={['click']}>
          <AntButton type="text" icon={<Lucide.MoreVertical size={16} className="text-gray-500" />} />
        </AntDropdown>
      ),
    },
  ];

  const invitesColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <span className="font-medium text-gray-900">{email}</span>
    },
    {
      title: 'Assigned Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <AntTag color="default">{role}</AntTag>
    },
    {
      title: 'Sent Date',
      dataIndex: 'sentDate',
      key: 'sentDate',
      render: (text: string) => <span className="text-gray-500">{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <AntTag color={status === 'pending' ? 'orange' : 'error'}>
          {status.toUpperCase()}
        </AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.status === 'expired' ? (
            <AntButton type="text" size="small" className="text-sky-600">Resend</AntButton>
          ) : (
            <AntButton type="text" size="small" className="text-gray-500">Revoke</AntButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
          <p className="text-gray-500">Manage your team members, invitations, and role assignments.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => setIsInviteModalVisible(true)}>
          <Lucide.UserPlus size={16} /> Invite User
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <AntTabs defaultActiveKey="1" className="px-4">
          <TabPane tab="Active Users" key="1">
            <AntTable 
              columns={usersColumns} 
              dataSource={activeUsers} 
              pagination={false}
              rowKey="id"
              className="w-full"
            />
          </TabPane>
          <TabPane tab="Pending Invitations" key="2">
            <AntTable 
              columns={invitesColumns} 
              dataSource={pendingInvites} 
              pagination={false}
              rowKey="id"
              className="w-full"
            />
          </TabPane>
        </AntTabs>
      </div>

      <AntModal
        title="Invite Team Member"
        open={isInviteModalVisible}
        onCancel={() => setIsInviteModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <div className="mb-6 text-gray-500">
          Send an invitation email to a new team member. They will be prompted to create an account and join your organization.
        </div>
        <AntForm
          form={inviteForm}
          layout="vertical"
          onFinish={handleInvite}
        >
          <AntForm.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please input an email address!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <AntInput placeholder="colleague@company.com" size="large" />
          </AntForm.Item>
          
          <AntForm.Item
            name="role"
            label="Assign Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <AntSelect placeholder="Select a role" size="large">
              <AntSelect.Option value="admin">Organization Admin</AntSelect.Option>
              <AntSelect.Option value="procurement">Procurement Manager</AntSelect.Option>
              <AntSelect.Option value="sales">Sales Manager</AntSelect.Option>
              <AntSelect.Option value="finance">Finance Viewer</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>
          
          <div className="flex justify-end gap-2 mt-8">
            <AntButton onClick={() => setIsInviteModalVisible(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-sky-600">Send Invitation</AntButton>
          </div>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default TeamManagement;
