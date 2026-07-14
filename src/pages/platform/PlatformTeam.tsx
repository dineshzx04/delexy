import React, { useState } from 'react';
import { Tabs as AntTabs, Table as AntTable, Button as AntButton, Tag as AntTag, Dropdown as AntDropdown, Modal as AntModal, Form as AntForm, Input as AntInput, Select as AntSelect, notification } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const { TabPane } = AntTabs;

const PlatformTeam: React.FC = () => {
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteForm] = AntForm.useForm();

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-900 font-semibold">Team Management</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const activeMembers = [
    { id: '1', name: 'Admin User', email: 'admin@delexy.com', role: 'Super Admin', status: 'active', joined: 'Jan 01, 2023' },
    { id: '2', name: 'Jane Support', email: 'jane@delexy.com', role: 'Support Specialist', status: 'active', joined: 'Mar 15, 2023' },
    { id: '3', name: 'Bob Catalog', email: 'bob@delexy.com', role: 'Catalog Manager', status: 'active', joined: 'Jun 20, 2023' },
  ];

  const pendingInvites = [
    { id: '101', email: 'new.admin@delexy.com', role: 'Finance Manager', invitedBy: 'Admin User', sentDate: 'Oct 10, 2023', status: 'pending' },
  ];

  const handleInvite = (values: any) => {
    notification.success({
      message: 'Invitation Sent',
      description: `A platform invitation has been sent to ${values.email}.`,
    });
    setIsInviteModalVisible(false);
    inviteForm.resetFields();
  };

  const usersColumns = [
    {
      title: 'Member',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
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
      title: 'Platform Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <AntTag color={role === 'Super Admin' ? 'purple' : 'blue'}>{role}</AntTag>
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
          { key: '2', label: 'Revoke Access', icon: <Lucide.UserX size={14} />, danger: true }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Team</h1>
          <p className="text-gray-500">Manage internal platform administrators and their access.</p>
        </div>
        <AntButton type="primary" className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2" size="large" onClick={() => setIsInviteModalVisible(true)}>
          <Lucide.UserPlus size={16} /> Invite Admin
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <AntTabs defaultActiveKey="1" className="px-4">
          <TabPane tab="Active Members" key="1">
            <AntTable 
              columns={usersColumns} 
              dataSource={activeMembers} 
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
        title="Invite Platform Administrator"
        open={isInviteModalVisible}
        onCancel={() => setIsInviteModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <div className="mb-6 text-gray-500">
          Send an invitation to join the internal platform management team.
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
            <AntInput placeholder="admin@delexy.com" size="large" />
          </AntForm.Item>
          
          <AntForm.Item
            name="role"
            label="Assign Platform Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <AntSelect placeholder="Select a platform role" size="large">
              <AntSelect.Option value="super">Super Admin</AntSelect.Option>
              <AntSelect.Option value="catalog">Catalog Manager</AntSelect.Option>
              <AntSelect.Option value="support">Support Specialist</AntSelect.Option>
              <AntSelect.Option value="finance">Finance Manager</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>
          
          <div className="flex justify-end gap-2 mt-8">
            <AntButton onClick={() => setIsInviteModalVisible(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-purple-600 hover:bg-purple-700">Send Invitation</AntButton>
          </div>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default PlatformTeam;
