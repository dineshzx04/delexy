import React from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Checkbox as AntCheckbox, Divider as AntDivider } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Login values:', values);
    // Simulate login and redirect to 2FA or App
    navigate('/2fa');
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-slate-500">Please enter your details to sign in to your account.</p>
      </div>

      <AntForm
        name="login"
        layout="vertical"
        initialValues={{ remember: true }}
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

        <AntForm.Item
          label={<span className="font-medium text-slate-700">Password</span>}
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <AntInput.Password prefix={<Lucide.Lock size={16} className="text-slate-400" />} placeholder="••••••••" />
        </AntForm.Item>

        <div className="flex items-center justify-between mb-6">
          <AntForm.Item name="remember" valuePropName="checked" noStyle>
            <AntCheckbox className="text-slate-600">Remember me</AntCheckbox>
          </AntForm.Item>
          <Link to="/forgot-password" className="text-sky-600 hover:text-sky-700 font-medium text-sm">
            Forgot password?
          </Link>
        </div>

        <AntForm.Item>
          <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
            Sign In
          </AntButton>
        </AntForm.Item>
      </AntForm>

      <AntDivider className="text-slate-400 text-sm">Or sign in with</AntDivider>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <AntButton size="large" className="flex items-center justify-center text-slate-600 hover:text-slate-900">
          Google
        </AntButton>
        <AntButton size="large" className="flex items-center justify-center text-slate-600 hover:text-slate-900">
          Microsoft
        </AntButton>
      </div>

      <div className="text-center text-slate-500 mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-sky-600 font-semibold hover:text-sky-700">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;
