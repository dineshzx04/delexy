import React, { useState } from 'react';
import { Steps as AntSteps, Form as AntForm, Input as AntInput, Button as AntButton, Select as AntSelect } from 'antd';
import * as Lucide from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
const { Option } = AntSelect;

const CreateOrganization: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = AntForm.useForm();
  const navigate = useNavigate();

  const next = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const onFinish = (values: any) => {
    console.log('Org creation values:', values);
    navigate('/');
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Organization</h2>
        <p className="text-slate-500">Set up your company workspace to start collaborating and procuring.</p>
      </div>

      <AntSteps current={currentStep} className="mb-8" items={[
        {
          title: 'Details',
          icon: <Lucide.Building2 size={16} />
        },
        {
          title: 'Industry'
        },
        {
          title: 'Complete',
          icon: <Lucide.CheckCircle2 size={16} />
        },
      ]} />

      <AntForm
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <div className={currentStep === 0 ? 'block' : 'hidden'}>
          <AntForm.Item
            label={<span className="font-medium text-slate-700">Company Name</span>}
            name="companyName"
            rules={[{ required: currentStep === 0, message: 'Please input your company name!' }]}
          >
            <AntInput placeholder="e.g. Acme Corp" />
          </AntForm.Item>
          <AntForm.Item
            label={<span className="font-medium text-slate-700">Workspace URL</span>}
            name="workspaceUrl"
            rules={[{ required: currentStep === 0, message: 'Please input a workspace URL!' }]}
          >
            <AntInput addonBefore="delexy.com/" placeholder="acme-corp" />
          </AntForm.Item>
          <div className="flex justify-end gap-2 mt-8">
            <Link to="/">
              <AntButton size="large">Cancel</AntButton>
            </Link>
            <AntButton type="primary" onClick={next} className="bg-sky-600 hover:bg-sky-700">
              Next <Lucide.ArrowRight size={16} />
            </AntButton>
          </div>
        </div>

        <div className={currentStep === 1 ? 'block' : 'hidden'}>
          <AntForm.Item
            label={<span className="font-medium text-slate-700">Industry</span>}
            name="industry"
            rules={[{ required: currentStep === 1, message: 'Please select your industry!' }]}
          >
            <AntSelect placeholder="Select Industry ">
              <Option value="manufacturing">Manufacturing</Option>
              <Option value="automotive">Automotive</Option>
              <Option value="aerospace">Aerospace</Option>
              <Option value="electronics">Electronics</Option>
              <Option value="software">Software & IT</Option>
              <Option value="other">Other</Option>
            </AntSelect>
          </AntForm.Item>
          <AntForm.Item
            label={<span className="font-medium text-slate-700">Company Size</span>}
            name="companySize"
            rules={[{ required: currentStep === 1, message: 'Please select company size!' }]}
          >
            <AntSelect placeholder="Select Size">
              <Option value="1-10">1-10 employees</Option>
              <Option value="11-50">11-50 employees</Option>
              <Option value="51-200">51-200 employees</Option>
              <Option value="201-500">201-500 employees</Option>
              <Option value="500+">500+ employees</Option>
            </AntSelect>
          </AntForm.Item>
          <div className="flex justify-between mt-8">
            <AntButton onClick={prev} icon={<Lucide.ArrowLeft size={16} />}>Previous</AntButton>
            <AntButton type="primary" onClick={next} className="bg-sky-600 hover:bg-sky-700">
              Next <Lucide.ArrowRight size={16} />
            </AntButton>
          </div>
        </div>

        <div className={currentStep === 2 ? 'block' : 'hidden'}>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lucide.CheckCircle2 size={36} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to go!</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Your organization has been created successfully. You can now invite team members and set up your procurement workflow.
            </p>
            <AntButton type="primary" htmlType="submit" className="bg-sky-600 hover:bg-sky-700 px-8" size="large">
              Go to Dashboard
            </AntButton>
          </div>
        </div>
      </AntForm>
    </div>
  );
};

export default CreateOrganization;
