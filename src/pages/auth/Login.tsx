import React, { useState } from 'react';
import {
  Input as AntInput,
  Button as AntButton,
  Checkbox as AntCheckbox,
  Divider as AntDivider,
  Alert as AntAlert,
  Tag as AntTag,
} from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import FormItem from '../../components/common/FormItem';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'global' | 'business'>('global');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: 'john.personal@gmail.com', password: '123456', remember: true }
  });

  const handleTabChange = (tab: 'global' | 'business') => {
    setActiveTab(tab);
    setAuthError(null);
    if (tab === 'global') {
      setValue('email', 'john.personal@gmail.com');
    } else {
      setValue('email', 'alice.business@gmail.com');
    }
  };

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
      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('global')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'global'
              ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lucide.Globe size={16} className={activeTab === 'global' ? 'text-sky-600' : 'text-slate-400'} />
          <span>Global Account Login</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('business')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'business'
              ? 'bg-white text-purple-700 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lucide.Building2 size={16} className={activeTab === 'business' ? 'text-purple-600' : 'text-slate-400'} />
          <span>Business Member Login</span>
        </button>
      </div>

      {/* Header Context */}
      <div className="mb-6">
        {activeTab === 'global' ? (
          <>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              Global Sign In
            </h2>
            <p className="text-slate-500 text-sm">
              Sign in with your primary individual account to access personal features and switch across all your linked businesses.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              Business Member Sign In
            </h2>
            <p className="text-slate-500 text-sm">
              Direct sign-in for enterprise employees and organization staff tied strictly to a single business workspace.
            </p>
          </>
        )}
      </div>

      {/* Context Scope Info Banner */}
      {activeTab === 'global' ? (
        <div className="mb-6 p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900 text-xs flex items-start gap-2.5 shadow-sm">
          <Lucide.Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sky-950 block mb-0.5">Multi-Workspace Access Scope</span>
            Authenticating with an <span className="font-semibold underline decoration-sky-400">INDIVIDUAL Credential</span> grants full access to your personal account dashboard and allows seamless workspace switching between all your associated companies.
          </div>
        </div>
      ) : (
        <div className="mb-6 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5 shadow-sm">
          <Lucide.ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-purple-950 block mb-0.5">Single Business Context Scope</span>
            Authenticating with a <span className="font-semibold underline decoration-purple-400">BUSINESS Credential</span> locks your active session directly to that specific tenant workspace without personal profile switching.
          </div>
        </div>
      )}

      {/* Quick Demo Persona Switcher Card */}
      <div className={`mb-6 p-4 rounded-xl border ${activeTab === 'global' ? 'border-sky-100 bg-sky-50/40' : 'border-purple-100 bg-purple-50/40'}`}>
        <div className={`text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center justify-between ${activeTab === 'global' ? 'text-sky-800' : 'text-purple-800'}`}>
          <div className="flex items-center gap-1.5">
            <Lucide.UserCheck size={14} /> Quick Demo {activeTab === 'global' ? 'Global' : 'Business'} Credentials
          </div>
          <Link
            to="/db"
            target="_blank"
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
              activeTab === 'global' 
                ? 'text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200' 
                : 'text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200'
            }`}
          >
            <Lucide.Database size={12} />
            <span>DB Manager</span>
          </Link>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          {activeTab === 'global' ? (
            <>
              <button
                type="button"
                onClick={() => handleQuickPersona('john.personal@gmail.com')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-sky-100/70 border border-sky-200 transition-colors text-left shadow-2xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">John Doe (INDIVIDUAL Credential - uc-1)</span>
                  <span className="text-slate-500 block text-[11px]">john.personal@gmail.com</span>
                </div>
                <AntTag color="blue" className="m-0 font-medium">Personal + All Businesses</AntTag>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('alice.personal@gmail.com')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-sky-100/70 border border-sky-200 transition-colors text-left shadow-2xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Alice Smith (INDIVIDUAL Credential - uc-2)</span>
                  <span className="text-slate-500 block text-[11px]">alice.personal@gmail.com</span>
                </div>
                <AntTag color="green" className="m-0 font-medium">Personal + Member Businesses</AntTag>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleQuickPersona('alice.business@gmail.com')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-purple-100/70 border border-purple-200 transition-colors text-left shadow-2xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">Alice Smith (BUSINESS Credential - uc-3 / uc-4)</span>
                  <span className="text-slate-500 block text-[11px]">alice.business@gmail.com</span>
                </div>
                <AntTag color="purple" className="m-0 font-medium">Multi-Context (Biz A & B)</AntTag>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('john.member@gmail.com')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-purple-100/70 border border-purple-200 transition-colors text-left shadow-2xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">John Doe (BUSINESS Credential - uc-5)</span>
                  <span className="text-slate-500 block text-[11px]">john.member@gmail.com</span>
                </div>
                <AntTag color="geekblue" className="m-0 font-medium">Business C ONLY</AntTag>
              </button>
            </>
          )}
        </div>
      </div>

      {authError && (
        <div className="mb-4">
          <AntAlert type="error" message={authError} showIcon />
        </div>
      )}

      <form onSubmit={handleSubmit(onFinish)} className="space-y-2">
        <FormItem 
          label={activeTab === 'global' ? 'Global Email Address' : 'Business Email Address'} 
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
                prefix={activeTab === 'global' ? <Lucide.User size={16} className="text-slate-400" /> : <Lucide.Mail size={16} className="text-slate-400" />} 
                placeholder={activeTab === 'global' ? 'john.personal@gmail.com' : 'alice.business@gmail.com'} 
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
          <Link to="/forgot-password" className={`${activeTab === 'global' ? 'text-sky-600 hover:text-sky-700' : 'text-purple-600 hover:text-purple-700'} font-medium text-sm`}>
            Forgot password?
          </Link>
        </div>

        <div className="mt-4">
          <AntButton 
            loading={loading} 
            type="primary" 
            htmlType="submit" 
            className={`w-full font-medium ${
              activeTab === 'global' 
                ? 'bg-sky-600 hover:bg-sky-700' 
                : 'bg-purple-600 hover:bg-purple-700 border-purple-600'
            }`} 
            size="large"
          >
            {activeTab === 'global' ? 'Sign In (Global Account)' : 'Sign In (Business Workspace)'}
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
        <Link to="/register" className={`${activeTab === 'global' ? 'text-sky-600 hover:text-sky-700' : 'text-purple-600 hover:text-purple-700'} font-semibold`}>
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;


