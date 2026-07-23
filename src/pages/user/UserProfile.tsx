import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Avatar as AntAvatar, Upload as AntUpload, Select as AntSelect } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const { Option } = AntSelect;

const UserProfile: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
     { title: <Link to="/profile" className="text-gray-900 font-semibold cursor-default pointer-events-none">User Profile</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and preferences.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600">Save Changes</AntButton>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col items-center text-center">
              <AntAvatar size={100} icon={<Lucide.User size={48} />} style={{ backgroundColor: '#0284c7' }} className="mb-4 text-3xl">JD</AntAvatar>
              <h2 className="text-xl font-bold text-gray-900 mb-1">John Doe</h2>
              <p className="text-gray-500 mb-4">john.doe@acmecorp.com</p>
              
              <AntUpload>
                <AntButton icon={<Lucide.Upload size={16} />}>Change Photo</AntButton>
              </AntUpload>
              
              <hr className="my-6 border-t border-gray-200 w-full" />
              
              <div className="w-full text-left">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Role</div>
                <div className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-md inline-block font-medium text-sm mb-4">
                  Organization Owner
                </div>
                
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Member Since</div>
                <div className="text-gray-700">October 12, 2023</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 text-lg">
              Personal Information
            </div>
            <div className="p-6">
              <AntForm layout="vertical" initialValues={{ firstName: 'John', lastName: 'Doe', email: 'john.doe@acmecorp.com', jobTitle: 'Procurement Director', department: 'Operations' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <AntForm.Item label="First Name" name="firstName" rules={[{ required: true }]}>
                    <AntInput />
                  </AntForm.Item>
                  <AntForm.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
                    <AntInput />
                  </AntForm.Item>
                </div>

                <AntForm.Item label="Email Address" name="email" rules={[{ required: true, type: 'email' }]}>
                  <AntInput disabled />
                </AntForm.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <AntForm.Item label="Job Title" name="jobTitle">
                    <AntInput />
                  </AntForm.Item>
                  <AntForm.Item label="Department" name="department">
                    <AntInput />
                  </AntForm.Item>
                </div>

                <AntForm.Item label="Phone Number" name="phone">
                  <AntInput placeholder="+1 (555) 000-0000" />
                </AntForm.Item>

                <AntForm.Item label="Timezone" name="timezone" initialValue="utc">
                  <AntSelect>
                    <Option value="utc">UTC (Universal Coordinated Time)</Option>
                    <Option value="est">EST (Eastern Standard Time)</Option>
                    <Option value="pst">PST (Pacific Standard Time)</Option>
                  </AntSelect>
                </AntForm.Item>
              </AntForm>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
