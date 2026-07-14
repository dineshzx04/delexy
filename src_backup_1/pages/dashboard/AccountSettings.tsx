import React from 'react';
import { Form as AntForm, Select as AntSelect, Button as AntButton, Switch as AntSwitch, Alert as AntAlert } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const { Option } = AntSelect;

const AccountSettings: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
     { title: <Link to="/settings/account" className="text-gray-900 font-semibold cursor-default pointer-events-none">My Super Custom Account Settings</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Account Settings</h1>
          <p className="text-gray-500">Manage your language, region, and notification preferences.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600">Save Preferences</AntButton>
      </div>

      <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 flex items-center gap-2">
          <Lucide.Globe size={16} /> Regional Settings
        </div>
        <div className="p-6">
          <AntForm layout="vertical" initialValues={{ language: 'en', currency: 'usd' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AntForm.Item label="Display Language" name="language">
                <AntSelect>
                  <Option value="en">English (US)</Option>
                  <Option value="es">Español</Option>
                  <Option value="fr">Français</Option>
                  <Option value="de">Deutsch</Option>
                  <Option value="zh">中文 (Chinese)</Option>
                </AntSelect>
              </AntForm.Item>
              <AntForm.Item label="Preferred Currency" name="currency">
                <AntSelect>
                  <Option value="usd">USD ($)</Option>
                  <Option value="eur">EUR (€)</Option>
                  <Option value="gbp">GBP (£)</Option>
                  <Option value="jpy">JPY (¥)</Option>
                </AntSelect>
              </AntForm.Item>
            </div>
          </AntForm>
        </div>
      </div>

      {/* <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 flex items-center gap-2">
          <Lucide.Bell size={16} /> Email Notifications
        </div>
        <div className="p-6">
          <AntAlert 
            message="Important Updates" 
            description="Security alerts and critical account notifications cannot be disabled."
            type="info" 
            showIcon 
            className="mb-6"
          />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">RFQ Updates</div>
                <div className="text-sm text-gray-500">Receive emails when an RFQ is quoted, updated, or expires.</div>
              </div>
              <AntSwitch defaultChecked />
            </div>
            <hr className="my-0 border-t border-gray-200" />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Purchase Orders</div>
                <div className="text-sm text-gray-500">Notifications for new POs, approvals, and shipping updates.</div>
              </div>
              <AntSwitch defaultChecked />
            </div>
            <hr className="my-0 border-t border-gray-200" />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Team Activity</div>
                <div className="text-sm text-gray-500">Weekly digest of team sourcing activities and spend.</div>
              </div>
              <AntSwitch />
            </div>
            <hr className="my-0 border-t border-gray-200" />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Platform News & Updates</div>
                <div className="text-sm text-gray-500">Announcements about new features and best practices.</div>
              </div>
              <AntSwitch defaultChecked />
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default AccountSettings;
