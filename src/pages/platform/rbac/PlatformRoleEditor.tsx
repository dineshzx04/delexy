import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Divider as AntDivider, Tooltip as AntTooltip, notification } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PlatformPermissionMatrix from './PlatformPermissionMatrix';

const PlatformRoleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = AntForm.useForm();
  
  const isEditing = Boolean(id && id !== 'new');
  
  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <Link to="/platform/rbac/roles" className="text-gray-500 hover:text-sky-600 transition-colors">Platform Roles</Link>, url: '/platform/rbac/roles' },
    { title: <span className="text-gray-900 font-semibold">{isEditing ? 'Edit Role' : 'Create Role'}</span> }
  ], [isEditing]);

  useBreadcrumb(breadcrumbs);

  React.useEffect(() => {
    if (isEditing) {
      form.setFieldsValue({
        name: id === '2' ? 'Catalog Manager' : 'Custom Platform Role',
        description: 'Can manage global categories, attributes, and platform products.',
        permissions: {
          master_catalog: ['read', 'create', 'update', 'delete'],
          taxonomies: ['read', 'create', 'update', 'delete'],
        }
      });
    }
  }, [id, isEditing, form]);

  const onFinish = (values: any) => {
    console.log('Platform Role values:', values);
    notification.success({
      message: isEditing ? 'Platform Role Updated' : 'Platform Role Created',
      description: `The role "${values.name}" has been successfully saved.`,
      placement: 'bottomRight'
    });
    navigate('/platform/rbac/roles');
  };

  return (
    <div className="w-full max-w-6xl pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEditing ? 'Edit Platform Role' : 'Create Platform Role'}</h1>
        <p className="text-gray-500">
          {isEditing 
            ? 'Modify the global permissions for this platform role.' 
            : 'Define a new platform role with precise global permissions.'}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <AntForm
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="w-full"
        >
          <div className="p-6 md:p-8">
            <div className="max-w-2xl mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Details</h2>
              <AntForm.Item
                name="name"
                label="Role Name"
                rules={[{ required: true, message: 'Please provide a role name' }]}
              >
                <AntInput placeholder="e.g. Audit Manager" size="large" />
              </AntForm.Item>

              <AntForm.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please provide a brief description' }]}
              >
                <AntInput.TextArea 
                  placeholder="Describe what platform admins with this role can do..." 
                  rows={3}
                />
              </AntForm.Item>
            </div>

            <AntDivider />

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 m-0">Platform Permission Matrix</h2>
                <AntTooltip title="Select the specific actions this role can perform on global platform resources.">
                  <Lucide.Info size={16} className="text-gray-400 cursor-help" />
                </AntTooltip>
              </div>
              <p className="text-gray-500 mb-6">Configure granular global access control below.</p>
              
              <AntForm.Item name="permissions" valuePropName="value">
                <PlatformPermissionMatrix />
              </AntForm.Item>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
            <AntButton size="large" onClick={() => navigate('/platform/rbac/roles')}>
              Cancel
            </AntButton>
            <AntButton type="primary" htmlType="submit" size="large" className="bg-purple-600 hover:bg-purple-700">
              {isEditing ? 'Save Changes' : 'Create Role'}
            </AntButton>
          </div>
        </AntForm>
      </div>
    </div>
  );
};

export default PlatformRoleEditor;
