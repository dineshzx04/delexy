import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Form, Divider } from 'antd';
import { Mail, Lock, Globe } from 'lucide-react';
import { PATHS } from '../../routes/paths';

const Login = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Success:', values);
    // Simulate login and redirect to dashboard
    navigate(PATHS.DASHBOARD);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome back</h2>
        <p className="text-gray-500">Sign in to your account to continue</p>
      </div>

      <Form
        name="login"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          label={<span className="font-medium text-gray-700">Email Address</span>}
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input
            prefix={<Mail size={18} className="text-gray-400 mr-2" />}
            placeholder="you@company.com"
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="flex justify-between w-full">
              <span className="font-medium text-gray-700">Password</span>
              <Link to="/auth/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Forgot password?
              </Link>
            </div>
          }
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<Lock size={18} className="text-gray-400 mr-2" />}
            placeholder="••••••••"
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item className="mt-6">
          <Button type="primary" htmlType="submit" className="w-full h-11 text-base font-medium rounded-md">
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <Divider className="my-6 text-gray-400 font-normal text-sm">Or continue with</Divider>

      <div className="grid grid-cols-2 gap-4">
        <Button className="h-11 flex items-center justify-center rounded-md border-gray-300">
          <Globe size={18} className="mr-2 text-gray-700" /> Google
        </Button>
      </div>

      <div className="mt-8 text-center text-gray-600">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-primary-600 hover:text-primary-700 font-semibold">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default Login;
