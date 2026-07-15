import React from 'react';
import { Input as AntInput, Button as AntButton, Checkbox as AntCheckbox, Divider as AntDivider } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import FormItem from '../../components/common/FormItem';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', remember: true }
  });

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

      <form onSubmit={handleSubmit(onFinish)} className="space-y-2">
        <FormItem 
          label="Email Address" 
          required 
          error={errors.email?.message as string}
        >
          <Controller
            name="email"
            control={control}
            rules={{ 
              required: 'Please input your email!', 
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } 
            }}
            render={({ field }) => (
              <AntInput 
                {...field} 
                size="large" 
                status={errors.email ? 'error' : ''} 
                prefix={<Lucide.User size={16} className="text-slate-400" />} 
                placeholder="name@company.com" 
              />
            )}
          />
        </FormItem>

        <FormItem 
          label="Password" 
          required 
          error={errors.password?.message as string}
        >
          <Controller
            name="password"
            control={control}
            rules={{ required: 'Please input your password!' }}
            render={({ field }) => (
              <AntInput.Password 
                {...field} 
                size="large" 
                status={errors.password ? 'error' : ''} 
                prefix={<Lucide.Lock size={16} className="text-slate-400" />} 
                placeholder="••••••••" 
              />
            )}
          />
        </FormItem>

        <div className="flex items-center justify-between mb-6 mt-2">
          <Controller
            name="remember"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <AntCheckbox {...field} checked={value} onChange={onChange} className="text-slate-600">
                Remember me
              </AntCheckbox>
            )}
          />
          <Link to="/forgot-password" className="text-sky-600 hover:text-sky-700 font-medium text-sm">
            Forgot password?
          </Link>
        </div>

        <div className="mt-4">
          <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
            Sign In
          </AntButton>
        </div>
      </form>

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
