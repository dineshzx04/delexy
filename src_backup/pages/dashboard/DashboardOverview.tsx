import React from 'react';
import { Card, Statistic, Row, Col, Typography, Avatar, Button, Table, Tag } from 'antd';
import { FileText, Package, CheckCircle, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const { Title, Text } = Typography;

const OrgDashboard = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-end">
      <div>
        <Title level={2} className="!mb-1">Organization Overview</Title>
        <Text type="secondary">Welcome back to your workspace. Here's what's happening.</Text>
      </div>
      <Button type="primary" icon={<FileText size={16} />}>Create Quote</Button>
    </div>

    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="Total Revenue" value={45231} prefix="$" suffix={<TrendingUp className="text-green-500 ml-2" size={16} />} valueStyle={{ color: '#1f2937' }} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="Active Orders" value={12} prefix={<Package className="text-primary-500 mr-2" size={18} />} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="Pending RFQs" value={28} prefix={<FileText className="text-orange-500 mr-2" size={18} />} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="Team Members" value={8} prefix={<Users className="text-purple-500 mr-2" size={18} />} />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]} className="mt-4">
      <Col xs={24} lg={16}>
        <Card title="Recent Activity" className="shadow-sm border-gray-100 h-full">
          <Table 
            dataSource={[
              { key: '1', action: 'New Order received', user: 'Jane Smith', date: '2 mins ago', status: 'pending' },
              { key: '2', action: 'RFQ #1024 Approved', user: 'John Doe', date: '1 hour ago', status: 'completed' },
              { key: '3', action: 'Invoice sent to Client A', user: 'Alice', date: '3 hours ago', status: 'completed' },
            ]}
            columns={[
              { title: 'Action', dataIndex: 'action', key: 'action' },
              { title: 'User', dataIndex: 'user', key: 'user' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => (
                <Tag color={status === 'completed' ? 'success' : 'processing'}>{status.toUpperCase()}</Tag>
              ) },
              { title: 'Time', dataIndex: 'date', key: 'date' },
            ]}
            pagination={false}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Quick Actions" className="shadow-sm border-gray-100 h-full">
          <div className="flex flex-col gap-3">
            <Button block className="text-left flex justify-start items-center h-10"><Users size={16} className="mr-2 text-gray-500"/> Invite Team Member</Button>
            <Button block className="text-left flex justify-start items-center h-10"><Package size={16} className="mr-2 text-gray-500"/> Add New Product</Button>
            <Button block className="text-left flex justify-start items-center h-10"><FileText size={16} className="mr-2 text-gray-500"/> Review Pending RFQs</Button>
            <Button block className="text-left flex justify-start items-center h-10"><DollarSign size={16} className="mr-2 text-gray-500"/> View Invoices</Button>
          </div>
        </Card>
      </Col>
    </Row>
  </div>
);

const PersonalDashboard = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-end">
      <div>
        <Title level={2} className="!mb-1">Personal Dashboard</Title>
        <Text type="secondary">Track your personal purchases and quotes.</Text>
      </div>
      <Button type="primary" icon={<Activity size={16} />}>Browse Marketplace</Button>
    </div>

    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="My Orders" value={3} prefix={<Package className="text-primary-500 mr-2" size={18} />} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="My RFQs" value={1} prefix={<FileText className="text-orange-500 mr-2" size={18} />} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <Statistic title="Saved Products" value={15} prefix={<CheckCircle className="text-green-500 mr-2" size={18} />} />
        </Card>
      </Col>
    </Row>
    
    <Card title="Recent Orders" className="shadow-sm border-gray-100 mt-4">
      <Table 
        dataSource={[]}
        columns={[
          { title: 'Order ID', dataIndex: 'id', key: 'id' },
          { title: 'Product', dataIndex: 'product', key: 'product' },
          { title: 'Date', dataIndex: 'date', key: 'date' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
        ]}
        locale={{ emptyText: 'No recent orders found' }}
      />
    </Card>
  </div>
);

const DashboardOverview = () => {
  const { currentWorkspace } = useWorkspace();
  
  if (currentWorkspace.type === 'org') {
    return <OrgDashboard />;
  }
  
  return <PersonalDashboard />;
};

export default DashboardOverview;
