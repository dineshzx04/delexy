import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, Select } from 'antd';
import { Building2, Globe, Users } from 'lucide-react';
import { PATHS } from '../../routes/paths';

const CreateOrganization = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Success:', values);
    // After creating org, redirect to dashboard context org
    navigate(PATHS.DASHBOARD);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Set up your workspace</h2>
        <p className="text-gray-500">Create an organization profile to collaborate with your team</p>
      </div>

      <Form
        name="createOrg"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          label={<span className="font-medium text-gray-700">Organization Name</span>}
          name="orgName"
          rules={[{ required: true, message: 'Please input the organization name!' }]}
          className="mb-5"
        >
          <Input 
            prefix={<Building2 size={18} className="text-gray-400 mr-2" />} 
            placeholder="Acme Engineering Ltd." 
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Organization URL (Optional)</span>}
          name="website"
          className="mb-5"
        >
          <Input 
            prefix={<Globe size={18} className="text-gray-400 mr-2" />} 
            placeholder="acme-engineering.com" 
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Company Size</span>}
          name="size"
          rules={[{ required: true, message: 'Please select company size!' }]}
          className="mb-8"
        >
          <Select 
            placeholder="Select number of employees"
            suffixIcon={<Users size={16} className="text-gray-400" />}
            className="rounded-md h-11"
            options={[
              { value: '1-10', label: '1 - 10 employees' },
              { value: '11-50', label: '11 - 50 employees' },
              { value: '51-200', label: '51 - 200 employees' },
              { value: '201-1000', label: '201 - 1,000 employees' },
              { value: '1000+', label: '1,000+ employees' },
            ]}
          />
        </Form.Item>

        <div className="flex gap-4">
          <Button 
            type="default" 
            className="w-1/3 h-11 text-base font-medium rounded-md"
            onClick={() => navigate('/auth/onboarding')}
          >
            Back
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            className="w-2/3 h-11 text-base font-medium rounded-md"
          >
            Create Organization
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateOrganization;
