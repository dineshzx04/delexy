import React from 'react';
import * as Lucide from 'lucide-react';
import { Card as AntCard, Row as AntRow, Col as AntCol, Table as AntTable, Progress as AntProgress } from 'antd';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const PlatformDashboard: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
    { title: <span className="font-semibold text-gray-900">Platform Overview</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const stats = [
    { title: 'Total Tenants', value: '1,284', trend: '+12%', icon: <Lucide.Building2 className="text-blue-500" size={24} /> },
    { title: 'Active Users', value: '45,231', trend: '+5%', icon: <Lucide.Users className="text-green-500" size={24} /> },
    { title: 'Platform Revenue', value: '$2.4M', trend: '+18%', icon: <Lucide.DollarSign className="text-purple-500" size={24} /> },
    { title: 'System Health', value: '99.9%', trend: 'Stable', icon: <Lucide.Activity className="text-rose-500" size={24} /> },
  ];

  const recentTenants = [
    { id: '1', name: 'Acme Corp', industry: 'Manufacturing', users: 120, joined: '2 hours ago' },
    { id: '2', name: 'Global Tech', industry: 'IT Services', users: 45, joined: '5 hours ago' },
    { id: '3', name: 'Stark Industries', industry: 'Aerospace', users: 890, joined: '1 day ago' },
    { id: '4', name: 'Wayne Enterprises', industry: 'Conglomerate', users: 500, joined: '2 days ago' },
  ];

  const columns = [
    { title: 'Tenant Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-sky-600">{text}</span> },
    { title: 'Industry', dataIndex: 'industry', key: 'industry' },
    { title: 'Users', dataIndex: 'users', key: 'users' },
    { title: 'Joined', dataIndex: 'joined', key: 'joined', render: (text: string) => <span className="text-gray-500">{text}</span> },
  ];

  return (
    <div className="w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Dashboard</h1>
        <p className="text-gray-500">Global overview of marketplace activity and system health.</p>
      </div>

      <AntRow gutter={[16, 16]} className="mb-8">
        {stats.map((stat, idx) => (
          <AntCol xs={24} sm={12} lg={6} key={idx}>
            <AntCard bordered={false} className="shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  {stat.icon}
                </div>
                <span className={`text-sm font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-gray-500'}`}>
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </AntCard>
          </AntCol>
        ))}
      </AntRow>

      <AntRow gutter={[16, 16]}>
        <AntCol xs={24} lg={16}>
          <AntCard title="Recently Onboarded Tenants" bordered={false} className="shadow-sm border border-gray-200 h-full">
            <AntTable 
              columns={columns} 
              dataSource={recentTenants} 
              pagination={false}
              rowKey="id"
              size="middle"
            />
          </AntCard>
        </AntCol>
        <AntCol xs={24} lg={8}>
          <AntCard title="Storage Usage" bordered={false} className="shadow-sm border border-gray-200 h-full">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Database</span>
                  <span className="text-sm text-gray-500">75%</span>
                </div>
                <AntProgress percent={75} status="active" strokeColor="#0ea5e9" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Assets (Images/PDFs)</span>
                  <span className="text-sm text-gray-500">42%</span>
                </div>
                <AntProgress percent={42} status="active" strokeColor="#10b981" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Cache</span>
                  <span className="text-sm text-gray-500">90%</span>
                </div>
                <AntProgress percent={90} status="exception" />
              </div>
            </div>
          </AntCard>
        </AntCol>
      </AntRow>
    </div>
  );
};

export default PlatformDashboard;
