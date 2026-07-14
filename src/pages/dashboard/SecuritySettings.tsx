import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Tag as AntTag } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const SecuritySettings: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
     { title: <Link to="/settings/security" className="text-gray-900 font-semibold cursor-default pointer-events-none">Security Settings</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const securityKeys = [
    {
      title: 'Authenticator App (Primary)',
      description: 'Google Authenticator or Authy',
      icon: <Lucide.Smartphone size={24} className="text-sky-600" />,
      action: <AntButton type="default">Reconfigure</AntButton>
    },
    {
      title: 'Security Keys',
      description: 'No security keys registered',
      icon: <Lucide.Key size={24} className="text-gray-400" />,
      action: <AntButton type="default">Add Key</AntButton>
    }
  ];

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Security Settings</h1>
        <p className="text-gray-500">Protect your account with advanced security features.</p>
      </div>

      <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 flex items-center gap-2">
          <Lucide.Lock size={16} /> Change Password
        </div>
        <div className="p-6">
          <AntForm layout="vertical" className="max-w-md">
            <AntForm.Item label="Current Password" name="currentPassword" rules={[{ required: true }]}>
              <AntInput.Password placeholder="Enter current password" />
            </AntForm.Item>
            <AntForm.Item label="New Password" name="newPassword" rules={[{ required: true, min: 8 }]}>
              <AntInput.Password placeholder="Enter new password" />
            </AntForm.Item>
            <AntForm.Item label="Confirm New Password" name="confirmPassword" rules={[{ required: true }]}>
              <AntInput.Password placeholder="Confirm new password" />
            </AntForm.Item>
            <AntButton type="primary" className="bg-sky-600">Update Password</AntButton>
          </AntForm>
        </div>
      </div>

      {/* <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 flex items-center gap-2">
          <Lucide.ShieldCheck size={16} /> Two-Factor Authentication (2FA)
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Two-Factor Authentication is Enabled</h3>
              <p className="text-gray-500 text-sm max-w-xl">
                Your account is protected. Every time you log in from a new device, you'll need to enter a verification code.
              </p>
            </div>
            <AntTag color="success" className="px-3 py-1 border-0 bg-green-50 text-green-700 font-semibold">ENABLED</AntTag>
          </div>

          <ul className="border border-gray-200 rounded-lg mb-6 divide-y divide-gray-200">
            {securityKeys.map((item, index) => (
              <li key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.title}</div>
                    <div className="text-gray-500">{item.description}</div>
                  </div>
                </div>
                <div>{item.action}</div>
              </li>
            ))}
          </ul>
          
          <AntButton danger type="dashed">Disable Two-Factor Authentication</AntButton>
        </div>
      </div> */}
    </div>
  );
};

export default SecuritySettings;
