import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Form, Divider, Checkbox } from 'antd';
import { Mail, Lock, User, Globe, Building } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Success:', values);
    // After registration, redirect to onboarding flow to choose between Individual or Org
    navigate('/onboarding');
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Create an account</h2>
        <p className="text-gray-500">Join EngMarket and start sourcing globally</p>
      </div>

      <Form
        name="register"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={<span className="font-medium text-gray-700">First Name</span>}
            name="firstName"
            rules={[{ required: true, message: 'Required!' }]}
            className="mb-4"
          >
            <Input placeholder="John" className="rounded-md" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Last Name</span>}
            name="lastName"
            rules={[{ required: true, message: 'Required!' }]}
            className="mb-4"
          >
            <Input placeholder="Doe" className="rounded-md" />
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="font-medium text-gray-700">Email Address</span>}
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
          className="mb-4"
        >
          <Input
            prefix={<Mail size={18} className="text-gray-400 mr-2" />}
            placeholder="you@company.com"
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Password</span>}
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters' }
          ]}
          className="mb-4"
        >
          <Input.Password
            prefix={<Lock size={18} className="text-gray-400 mr-2" />}
            placeholder="Create a strong password"
            className="rounded-md"
          />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Should accept agreement')) }
          ]}
          className="mb-6"
        >
          <Checkbox className="text-gray-600 text-sm">
            I agree to the <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          </Checkbox>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" className="w-full h-11 text-base font-medium rounded-md">
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <Divider className="my-6 text-gray-400 font-normal text-sm">Or sign up with</Divider>

      <div className="grid grid-cols-2 gap-4">
        <Button className="h-11 flex items-center justify-center rounded-md border-gray-300">
          <Globe size={18} className="mr-2 text-gray-700" /> Google
        </Button>
      </div>

      <div className="mt-8 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Log in instead
        </Link>
      </div>
    </div>
  );
};

export default Register;
