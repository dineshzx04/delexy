import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Divider as AntDivider } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Register values:', values);
    navigate('/auth/verify-email');
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create an Account</h2>
        <p className="text-slate-500">Join Delexy to start streamlining your engineering procurement.</p>
      </div>

      <AntForm
        name="register"
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <div className="flex gap-4 w-full">
          <div className="flex-1">
            <AntForm.Item
              label={<span className="font-medium text-slate-700">First Name</span>}
              name="firstName"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <AntInput placeholder="John" />
            </AntForm.Item>
          </div>
          <div className="flex-1">
            <AntForm.Item
              label={<span className="font-medium text-slate-700">Last Name</span>}
              name="lastName"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <AntInput placeholder="Doe" />
            </AntForm.Item>
          </div>
        </div>

        <AntForm.Item
          label={<span className="font-medium text-slate-700">Work Email Address</span>}
          name="email"
          rules={[{ required: true, message: 'Please input your work email!' }, { type: 'email', message: 'Invalid email address' }]}
        >
          <AntInput placeholder="name@company.com" />
        </AntForm.Item>

        <AntForm.Item
          label={<span className="font-medium text-slate-700">Password</span>}
          name="password"
          rules={[{ required: true, message: 'Please create a password!' }, { min: 8, message: 'Must be at least 8 characters.' }]}
        >
          <AntInput.Password placeholder="Create a strong password" />
        </AntForm.Item>

        <div className="text-sm text-slate-500 mb-6">
          By signing up, you agree to our <a href="#" className="text-sky-600 hover:underline">Terms of Service</a> and <a href="#" className="text-sky-600 hover:underline">Privacy Policy</a>.
        </div>

        <AntForm.Item>
          <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
            Create Account
          </AntButton>
        </AntForm.Item>
      </AntForm>

      <div className="text-center text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-sky-600 font-semibold hover:text-sky-700">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
