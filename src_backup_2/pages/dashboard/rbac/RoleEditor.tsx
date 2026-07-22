import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Divider as AntDivider,Tooltip as AntTooltip, notification } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PermissionMatrix from './PermissionMatrix';

const RoleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = AntForm.useForm();
  
  const isEditing = Boolean(id && id !== 'new');
  
  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">App</Link>, url: '/' },
    { title: <Link to="/rbac/roles" className="text-gray-500 hover:text-sky-600 transition-colors">Roles & Permissions</Link>, url: '/rbac/roles' },
    { title: <span className="text-gray-900 font-semibold">{isEditing ? 'Edit Role' : 'Create Role'}</span> }
  ], [isEditing]);

  useBreadcrumb(breadcrumbs);

  // Mock initial data load if editing
  React.useEffect(() => {
    if (isEditing) {
      // In a real app, fetch role data based on ID
      form.setFieldsValue({
        name: id === '2' ? 'Procurement Manager' : 'Custom Role',
        description: 'Mock description for this role based on ID.',
        permissions: {
          rfqs: ['read', 'create', 'update'],
          products: ['read'],
        }
      });
    }
  }, [id, isEditing, form]);

  const onFinish = (values: any) => {
    console.log('Role values:', values);
    notification.success({
      message: isEditing ? 'Role Updated' : 'Role Created',
      description: `The role "${values.name}" has been successfully saved.`,
      placement: 'bottomRight'
    });
    navigate('/rbac/roles');
  };

  return (
    <div className="w-full max-w-6xl pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEditing ? 'Edit Role' : 'Create Custom Role'}</h1>
        <p className="text-gray-500">
          {isEditing 
            ? 'Modify the permissions and details for this role.' 
            : 'Define a new role by specifying its name and assigning precise granular permissions.'}
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
                <AntInput placeholder="e.g. Warehouse Associate" size="large" />
              </AntForm.Item>

              <AntForm.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please provide a brief description' }]}
              >
                <AntInput.TextArea 
                  placeholder="Describe what users with this role can do..." 
                  rows={3}
                />
              </AntForm.Item>
            </div>

            <AntDivider />

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 m-0">Permission Matrix</h2>
                <AntTooltip title="Select the specific actions this role can perform on each resource.">
                  <Lucide.Info size={16} className="text-gray-400 cursor-help" />
                </AntTooltip>
              </div>
              <p className="text-gray-500 mb-6">Configure granular access control below.</p>
              
              <AntForm.Item name="permissions" valuePropName="value">
                <PermissionMatrix />
              </AntForm.Item>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
            <AntButton size="large" onClick={() => navigate('/rbac/roles')}>
              Cancel
            </AntButton>
            <AntButton type="primary" htmlType="submit" size="large" className="bg-sky-600">
              {isEditing ? 'Save Changes' : 'Create Role'}
            </AntButton>
          </div>
        </AntForm>
      </div>
    </div>
  );
};

export default RoleEditor;
