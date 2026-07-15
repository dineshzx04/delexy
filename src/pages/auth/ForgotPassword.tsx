import React, { useState } from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Alert as AntAlert } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const onFinish = (values: any) => {
    console.log('Forgot password values:', values);
    setSubmitted(true);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Forgot Password</h2>
        <p className="text-slate-500">No worries, we'll send you reset instructions.</p>
      </div>

      {submitted ? (
        <div className="mb-8">
          <AntAlert
            message="Reset link sent"
            description="We've sent a password reset link to your email address if it exists in our system."
            type="success"
            showIcon
            className="mb-6"
          />
          <Link to="/login">
            <AntButton size="large" className="w-full">Return to login</AntButton>
          </Link>
        </div>
      ) : (
        <AntForm
          name="forgot_password"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <AntForm.Item
            label={<span className="font-medium text-slate-700">Email Address</span>}
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Invalid email address' }]}
          >
            <AntInput prefix={<Lucide.User size={16} className="text-slate-400" />} placeholder="name@company.com" />
          </AntForm.Item>

          <AntForm.Item className="mt-8">
            <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
              Reset Password
            </AntButton>
          </AntForm.Item>
        </AntForm>
      )}

      {!submitted && (
        <Link to="/login" className="flex items-center justify-center text-slate-500 hover:text-slate-900 font-medium mt-6">
          <Lucide.ArrowLeft size={16} className="mr-2" /> Back to log in
        </Link>
      )}
    </div>
  );
};

export default ForgotPassword;
