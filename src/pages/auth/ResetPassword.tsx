import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Reset password values:', values);
    navigate('/auth/login');
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Set new password</h2>
        <p className="text-slate-500">Your new password must be different from previous used passwords.</p>
      </div>

      <AntForm
        name="reset_password"
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <AntForm.Item
          label={<span className="font-medium text-slate-700">Password</span>}
          name="password"
          rules={[{ required: true, message: 'Please input your new password!' }, { min: 8, message: 'Must be at least 8 characters.' }]}
        >
          <AntInput.Password placeholder="••••••••" />
        </AntForm.Item>

        <AntForm.Item
          label={<span className="font-medium text-slate-700">Confirm Password</span>}
          name="confirm"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <AntInput.Password placeholder="••••••••" />
        </AntForm.Item>

        <AntForm.Item className="mt-8">
          <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
            Reset Password
          </AntButton>
        </AntForm.Item>
      </AntForm>

      <Link to="/auth/login" className="flex items-center justify-center text-slate-500 hover:text-slate-900 font-medium mt-6">
        <Lucide.ArrowLeft size={16} className="mr-2" /> Back to log in
      </Link>
    </div>
  );
};

export default ResetPassword;
