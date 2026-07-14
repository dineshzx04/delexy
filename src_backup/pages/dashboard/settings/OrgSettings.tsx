import React, { useState } from 'react';
import { Tabs, Card, Form, Input, Button, Table, Tag, Modal, Select, Avatar, Typography, Space } from 'antd';
import { Building2, Mail, Users, Shield, UserPlus, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const { Title, Text } = Typography;

const OrgProfile = () => (
  <Form layout="vertical" className="max-w-2xl mt-4">
    <Form.Item label="Organization Name" name="orgName" initialValue="Acme Corp">
      <Input prefix={<Building2 size={16} className="text-gray-400 mr-2" />} className="h-10 rounded-md" />
    </Form.Item>
    <Form.Item label="Contact Email" name="email" initialValue="contact@acmecorp.com">
      <Input prefix={<Mail size={16} className="text-gray-400 mr-2" />} className="h-10 rounded-md" />
    </Form.Item>
    <Form.Item label="Website" name="website" initialValue="https://acmecorp.com">
      <Input className="h-10 rounded-md" />
    </Form.Item>
    <Button type="primary" size="large" className="rounded-md">Save Changes</Button>
  </Form>
);

const MembersList = () => {
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  
  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-primary-500">{record.initials}</Avatar>
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'Active' ? 'success' : 'warning'}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space size="middle">
          <Button type="text" icon={<Edit size={16} />} className="text-gray-500 hover:text-primary-600" />
          <Button type="text" danger icon={<Trash2 size={16} />} />
        </Space>
      )
    }
  ];

  const data = [
    { key: '1', name: 'John Doe', email: 'john@acmecorp.com', initials: 'JD', role: 'Owner', status: 'Active' },
    { key: '2', name: 'Jane Smith', email: 'jane@acmecorp.com', initials: 'JS', role: 'Procurement Manager', status: 'Active' },
    { key: '3', name: 'Mike Ross', email: 'mike@acmecorp.com', initials: 'MR', role: 'Viewer', status: 'Pending' },
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title level={4} className="!mb-0">Team Members</Title>
          <Text type="secondary">Manage who has access to your organization workspace.</Text>
        </div>
        <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setIsInviteModalVisible(true)}>
          Invite Member
        </Button>
      </div>

      <Table columns={columns} dataSource={data} pagination={false} className="border border-gray-100 rounded-lg overflow-hidden" />

      <Modal 
        title="Invite New Member" 
        open={isInviteModalVisible} 
        onCancel={() => setIsInviteModalVisible(false)}
        okText="Send Invitation"
        okButtonProps={{ className: 'rounded-md' }}
        cancelButtonProps={{ className: 'rounded-md' }}
      >
        <Form layout="vertical" className="mt-4">
          <Form.Item label="Email Address" required>
            <Input placeholder="colleague@company.com" className="h-10 rounded-md" />
          </Form.Item>
          <Form.Item label="Assign Role" required>
            <Select 
              className="h-10"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'procurement', label: 'Procurement Manager' },
                { value: 'viewer', label: 'Viewer' },
              ]}
              defaultValue="viewer"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const RolesAndPermissions = () => {
  const columns = [
    { title: 'Role Name', dataIndex: 'name', key: 'name', className: 'font-medium' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Members', dataIndex: 'membersCount', key: 'membersCount' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button type="link" disabled={record.isSystem}>Edit Permissions</Button>
      )
    }
  ];

  const data = [
    { key: '1', name: 'Owner', description: 'Full access to all resources and billing.', membersCount: 1, isSystem: true },
    { key: '2', name: 'Admin', description: 'Can manage members and settings.', membersCount: 2, isSystem: true },
    { key: '3', name: 'Procurement Manager', description: 'Can manage RFQs and approve orders.', membersCount: 4, isSystem: false },
    { key: '4', name: 'Viewer', description: 'Read-only access to products and orders.', membersCount: 8, isSystem: true },
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title level={4} className="!mb-0">Roles & Permissions</Title>
          <Text type="secondary">Define custom roles and manage granular permissions.</Text>
        </div>
        <Button icon={<ShieldAlert size={16} />}>Create Custom Role</Button>
      </div>

      <Table columns={columns} dataSource={data} pagination={false} className="border border-gray-100 rounded-lg overflow-hidden" />
    </div>
  );
};

const OrgSettings = () => {
  const { currentWorkspace } = useWorkspace();

  if (currentWorkspace.type !== 'org') {
    return (
      <Card className="text-center py-12">
        <Title level={4}>Not Available</Title>
        <Text type="secondary">Organization settings are only available when you are in an Organization workspace context.</Text>
      </Card>
    );
  }

  const items = [
    { key: 'profile', label: 'General Profile', icon: <Building2 size={16} />, children: <OrgProfile /> },
    { key: 'members', label: 'Members & Invitations', icon: <Users size={16} />, children: <MembersList /> },
    { key: 'roles', label: 'Roles & Permissions', icon: <Shield size={16} />, children: <RolesAndPermissions /> },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <Title level={2} className="!mb-1">Organization Settings</Title>
        <Text type="secondary">Manage your organization profile, team members, and security preferences.</Text>
      </div>

      <Card className="shadow-sm border-gray-100 min-h-[600px]">
        <Tabs items={items} className="w-full" size="large" />
      </Card>
    </div>
  );
};

export default OrgSettings;
