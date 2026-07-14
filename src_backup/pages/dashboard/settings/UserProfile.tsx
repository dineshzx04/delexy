import React from 'react';
import { Tabs, Card, Form, Input, Button, Table, Typography, Switch, Avatar, List } from 'antd';
import { User, Bell, Activity, Lock, Settings } from 'lucide-react';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const { Title, Text } = Typography;

const GeneralProfile = () => (
  <Form layout="vertical" className="max-w-2xl mt-4">
    <div className="flex items-center gap-6 mb-8">
      <Avatar size={80} className="bg-primary-500 text-3xl">JD</Avatar>
      <div>
        <Button>Upload new picture</Button>
        <p className="text-sm text-gray-500 mt-2">At least 800x800 px recommended. JPG or PNG is allowed</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <Form.Item label="First Name" name="firstName" initialValue="John">
        <Input className="h-10 rounded-md" />
      </Form.Item>
      <Form.Item label="Last Name" name="lastName" initialValue="Doe">
        <Input className="h-10 rounded-md" />
      </Form.Item>
    </div>
    <Form.Item label="Email Address" name="email" initialValue="john.doe@example.com">
      <Input className="h-10 rounded-md" disabled />
    </Form.Item>
    <Form.Item label="Phone Number" name="phone" initialValue="+1 (555) 000-0000">
      <Input className="h-10 rounded-md" />
    </Form.Item>
    
    <Button type="primary" size="large" className="rounded-md">Save Profile</Button>
  </Form>
);

const SecuritySettings = () => (
  <div className="max-w-2xl mt-4">
    <Title level={5} className="!mb-4">Change Password</Title>
    <Form layout="vertical">
      <Form.Item label="Current Password" name="currentPassword">
        <Input.Password className="h-10 rounded-md" />
      </Form.Item>
      <Form.Item label="New Password" name="newPassword">
        <Input.Password className="h-10 rounded-md" />
      </Form.Item>
      <Form.Item label="Confirm New Password" name="confirmPassword">
        <Input.Password className="h-10 rounded-md" />
      </Form.Item>
      <Button type="primary" className="rounded-md">Update Password</Button>
    </Form>
    
    <div className="mt-12">
      <Title level={5} className="!mb-2">Two-Factor Authentication</Title>
      <Text type="secondary" className="block mb-4">Add an extra layer of security to your account.</Text>
      <Button>Enable 2FA</Button>
    </div>
  </div>
);

const NotificationPreferences = () => {
  const data = [
    { key: '1', title: 'Order Updates', description: 'Get notified when an order status changes.', email: true, push: true },
    { key: '2', title: 'New RFQs', description: 'Receive alerts for new Request for Quotes matching your products.', email: true, push: false },
    { key: '3', title: 'Messages', description: 'When someone sends you a direct message.', email: false, push: true },
    { key: '4', title: 'Promotions', description: 'Occasional offers and news from EngMarket.', email: false, push: false },
  ];

  return (
    <div className="mt-4 max-w-3xl">
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={item => (
          <List.Item
            actions={[
              <div className="flex gap-8 w-40 justify-end" key="actions">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1">Email</span>
                  <Switch defaultChecked={item.email} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1">Push</span>
                  <Switch defaultChecked={item.push} />
                </div>
              </div>
            ]}
          >
            <List.Item.Meta
              title={<span className="font-medium text-gray-900">{item.title}</span>}
              description={<span className="text-gray-500">{item.description}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

const ActivityLogs = () => {
  const data = [
    { key: '1', action: 'Logged in from new device', date: 'Oct 24, 2026 14:23', ip: '192.168.1.1' },
    { key: '2', action: 'Updated profile picture', date: 'Oct 23, 2026 09:12', ip: '192.168.1.1' },
    { key: '3', action: 'Changed password', date: 'Oct 20, 2026 18:45', ip: '10.0.0.5' },
    { key: '4', action: 'Created new Organization "Acme Corp"', date: 'Oct 15, 2026 11:30', ip: '192.168.1.1' },
  ];

  return (
    <div className="mt-4">
      <Table 
        dataSource={data} 
        columns={[
          { title: 'Activity', dataIndex: 'action', key: 'action' },
          { title: 'Date & Time', dataIndex: 'date', key: 'date' },
          { title: 'IP Address', dataIndex: 'ip', key: 'ip', render: (ip) => <Text type="secondary" className="font-mono text-xs">{ip}</Text> },
        ]}
        pagination={false}
        className="border border-gray-100 rounded-lg overflow-hidden"
      />
    </div>
  );
};

const UserProfile = () => {
  const { currentWorkspace } = useWorkspace();

  const items = [
    { key: 'profile', label: 'My Profile', icon: <User size={16} />, children: <GeneralProfile /> },
    { key: 'security', label: 'Security', icon: <Lock size={16} />, children: <SecuritySettings /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={16} />, children: <NotificationPreferences /> },
    { key: 'activity', label: 'Activity Log', icon: <Activity size={16} />, children: <ActivityLogs /> },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <Title level={2} className="!mb-1">User Settings</Title>
        <Text type="secondary">Manage your personal account settings and preferences.</Text>
      </div>

      <Card className="shadow-sm border-gray-100 min-h-[600px]">
        <Tabs items={items} className="w-full" size="large" />
      </Card>
    </div>
  );
};

export default UserProfile;
