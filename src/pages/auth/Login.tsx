import React, { useState } from 'react';
import { Input as AntInput, Button as AntButton, Checkbox as AntCheckbox, Divider as AntDivider, Alert as AntAlert, Tag as AntTag } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import FormItem from '../../components/common/FormItem';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useWorkspace();
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: 'john.personal@gmail.com', password: '123456', remember: true }
  });

  const onFinish = async (values: any) => {
    setAuthError(null);
    setLoading(true);
    const res = await login(values.email, values.password);
    setLoading(false);

    if (res.success && res.targetWorkspace) {
      if (res.targetWorkspace.type === 'tenant') {
        navigate('/b/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } else if (res.success) {
      navigate('/user/dashboard');
    } else {
      setAuthError(res.message || 'Login failed.');
    }
  };

  const handleQuickPersona = async (email: string) => {
    setValue('email', email);
    setValue('password', '123456');
    setAuthError(null);
    setLoading(true);
    const res = await login(email, '123456');
    setLoading(false);
    if (res.success && res.targetWorkspace) {
      if (res.targetWorkspace.type === 'tenant') {
        navigate('/b/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } else {
      setAuthError(res.message || 'Login failed.');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-slate-500">Sign in to access your Delexy account and workspaces.</p>
      </div>

      {/* Quick Demo Persona Switcher Card */}
      <div className="mb-6 p-4 rounded-xl border border-sky-100 bg-sky-50/60">
        <div className="text-xs font-semibold uppercase tracking-wider text-sky-800 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lucide.UserCheck size={14} /> Quick Demo Login Credentials
          </div>
          <Link
            to="/db"
            target="_blank"
            className="flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded transition-colors"
          >
            <Lucide.Database size={12} />
            <span>DB Manager</span>
          </Link>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickPersona('john.personal@gmail.com')}
            className="flex items-center justify-between p-2.5 rounded bg-white hover:bg-sky-100 border border-sky-200 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800">John Doe (INDIVIDUAL Credential - uc-1)</span>
              <span className="text-slate-500 block text-[11px]">john.personal@gmail.com</span>
            </div>
            <AntTag color="blue">Personal + All Businesses</AntTag>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPersona('john.c@gmail.com')}
            className="flex items-center justify-between p-2.5 rounded bg-white hover:bg-sky-100 border border-sky-200 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800">John Doe (BUSINESS Credential - uc-3)</span>
              <span className="text-slate-500 block text-[11px]">john.c@gmail.com</span>
            </div>
            <AntTag color="purple">Business C ONLY</AntTag>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPersona('alice.personal@gmail.com')}
            className="flex items-center justify-between p-2.5 rounded bg-white hover:bg-sky-100 border border-sky-200 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800">Alice Smith (INDIVIDUAL Credential - uc-2)</span>
              <span className="text-slate-500 block text-[11px]">alice.personal@gmail.com</span>
            </div>
            <AntTag color="green">Personal + Business C Owner</AntTag>
          </button>
        </div>
      </div>

      {authError && (
        <div className="mb-4">
          <AntAlert type="error" message={authError} showIcon />
        </div>
      )}

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
          <AntButton loading={loading} type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700 font-medium" size="large">
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
