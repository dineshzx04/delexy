import React from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const ActiveSessions: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
     { title: <Link to="/settings/sessions" className="text-gray-900 font-semibold cursor-default pointer-events-none">Active Sessions</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const sessions = [
    {
      key: '1',
      device: 'MacBook Pro - Chrome',
      ip: '192.168.1.1',
      location: 'San Francisco, CA, US',
      lastActive: 'Active Now',
      isCurrent: true,
      type: 'desktop'
    },
    {
      key: '2',
      device: 'iPhone 13 - Safari',
      ip: '104.28.1.50',
      location: 'San Francisco, CA, US',
      lastActive: '2 hours ago',
      isCurrent: false,
      type: 'mobile'
    },
    {
      key: '3',
      device: 'Windows PC - Edge',
      ip: '45.33.22.11',
      location: 'New York, NY, US',
      lastActive: 'Yesterday',
      isCurrent: false,
      type: 'desktop'
    },
  ];

  const columns = [
    {
      title: 'Device / Browser',
      dataIndex: 'device',
      key: 'device',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            {record.type === 'desktop' ? <Lucide.Monitor size={20} /> : <Lucide.Smartphone size={20} />}
          </div>
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              {text}
              {record.isCurrent && <AntTag color="blue" className="text-[10px] m-0 border-0 leading-3">CURRENT</AntTag>}
            </div>
            <div className="text-xs text-slate-500">{record.ip}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => <span className="text-slate-600">{text}</span>
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (text: string, record: any) => (
        <span className={record.isCurrent ? 'text-green-600 font-medium' : 'text-slate-500'}>
          {text}
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        !record.isCurrent ? (
          <AntButton danger type="text" size="small">Revoke Session</AntButton>
        ) : null
      ),
    },
  ];

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Active Sessions</h1>
          <p className="text-gray-500">Review and manage devices currently logged into your account.</p>
        </div>
        <AntButton danger type="default">Sign Out All Other Devices</AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-sky-50 border-b border-sky-100 flex items-start gap-3">
          <Lucide.ShieldAlert className="text-xl text-sky-600 mt-0.5" />
          <div className="text-sm text-sky-900">
            If you notice any unfamiliar activity or devices, you should immediately revoke the session and change your password in the <a href="//settings/security" className="font-semibold hover:underline">Security Settings</a>.
          </div>
        </div>
        <AntTable 
          columns={columns} 
          dataSource={sessions} 
          pagination={false}
          className="w-full"
          rowClassName="hover:bg-slate-50 transition-colors"
        />
      </div>
    </div>
  );
};

export default ActiveSessions;
