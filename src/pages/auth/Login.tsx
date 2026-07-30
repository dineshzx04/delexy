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
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'global' | 'business'>('global');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { identifier: 'john.personal@gmail.com', password: '123456', remember: true }
  });

  // Dynamic Database Queries for Demo Credentials
  const allUsers = useLiveQuery(() => userDb.users.toArray()) || [];
  const allEmails = useLiveQuery(() => userDb.emails.toArray()) || [];
  const allUserEmails = useLiveQuery(() => userDb.userEmails.toArray()) || [];
  const allAuthCreds = useLiveQuery(() => userDb.authCredentials.toArray()) || [];
  const allPlatformMemberships = useLiveQuery(() => userDb.platformMemberships.toArray()) || [];
  const allBusinessMemberships = useLiveQuery(() => userDb.businessMemberships.toArray()) || [];
  const allBusinesses = useLiveQuery(() => userDb.businesses.toArray()) || [];
  const allPlatformRoles = useLiveQuery(() => userDb.platformRoles.toArray()) || [];

  // Derive Global Personas (Includes Platform Super Admin, Platform Members & Individual Users)
  const globalPersonas = React.useMemo(() => {
    const indCreds = allAuthCreds.filter((c) => c.credential_type === 'INDIVIDUAL');

    return indCreds.map((cred) => {
      const u = allUsers.find((user) => user.id === cred.user_id);
      const pm = allPlatformMemberships.find((p) => p.user_id === cred.user_id);
      const pRole = pm?.platform_role_id ? allPlatformRoles.find((r) => r.id === pm.platform_role_id) : undefined;
      const primaryUe = allUserEmails.find((ue) => ue.user_id === cred.user_id && ue.is_primary);
      const emailObj = primaryUe ? allEmails.find((e) => e.id === primaryUe.email_id) : undefined;

      const userBizMemberships = allBusinessMemberships.filter((m) => m.user_id === cred.user_id);
      const ownedBizCount = userBizMemberships.filter((m) => m.membership_type === 'OWNER').length;
      const memberBizCount = userBizMemberships.filter((m) => m.membership_type !== 'OWNER').length;
      
      const emailStr = emailObj?.email || cred.email_id || u?.app_user_id || cred.user_id;

      let roleTag = 'Individual Account';
      let tagColor = 'blue';

      if (pm) {
        if (pm.membership_type === 'SUPER_ADMIN') {
          roleTag = 'Super Admin';
          tagColor = 'red';
        } else {
          roleTag = pRole?.role_name || 'Platform Member';
          tagColor = 'purple';
        }
      } else if (ownedBizCount > 0 && memberBizCount > 0) {
        roleTag = `Individual + Owner (${ownedBizCount}) & Member (${memberBizCount})`;
        tagColor = 'cyan';
      } else if (ownedBizCount > 0) {
        roleTag = `Individual + Owner (${ownedBizCount} Biz)`;
        tagColor = 'blue';
      } else if (memberBizCount > 0) {
        roleTag = `Individual + Member (${memberBizCount} Biz)`;
        tagColor = 'geekblue';
      }

      return {
        id: cred.id,
        identifier: pm?.membership_type === 'SUPER_ADMIN' ? (u?.app_user_id || cred.user_id) : emailStr,
        name: u?.full_name || 'User',
        userId: u?.app_user_id || cred.user_id,
        password: cred.password || pm?.switch_password || '123456',
        roleTag,
        tagColor,
      };
    });
  }, [allAuthCreds, allUsers, allUserEmails, allEmails, allPlatformMemberships, allPlatformRoles, allBusinessMemberships]);

  // Derive Business Personas dynamically (Include ONLY Business MEMBER credentials)
  const businessPersonas = React.useMemo(() => {
    const bizCreds = allAuthCreds.filter((c) => c.credential_type === 'BUSINESS');

    // Filter to include ONLY credentials where the linked membership is of type 'MEMBER'
    const memberCreds = bizCreds.filter((cred) => {
      if (!cred.business_membership_id) return false;
      const bm = allBusinessMemberships.find((m) => m.id === cred.business_membership_id);
      return bm?.membership_type === 'MEMBER';
    });

    return memberCreds.map((cred) => {
      const u = allUsers.find((user) => user.id === cred.user_id);
      const bm = cred.business_membership_id ? allBusinessMemberships.find((m) => m.id === cred.business_membership_id) : undefined;
      const biz = bm ? allBusinesses.find((b) => b.id === bm.business_id) : undefined;
      const emailObj = cred.email_id ? allEmails.find((e) => e.id === cred.email_id) : undefined;

      // Filter business memberships tied strictly to THIS member email / credential
      const memberEmailId = cred.email_id;
      const emailMemberships = allBusinessMemberships.filter((m) => {
        if (m.membership_type !== 'MEMBER') return false;
        if (memberEmailId && m.email_id === memberEmailId) return true;
        if (cred.business_membership_id && m.id === cred.business_membership_id) return true;
        return false;
      });

      const totalBizCount = emailMemberships.length > 0 ? emailMemberships.length : 1;

      const roleTag = `Member (${totalBizCount} Biz)`;
      const tagColor = 'purple';

      return {
        id: cred.id,
        identifier: emailObj?.email || cred.email_id || 'business@gmail.com',
        name: u?.full_name || 'Business Member',
        businessName: biz?.name || 'Organization',
        password: cred.password || '123456',
        roleTag,
        tagColor,
      };
    });
  }, [allAuthCreds, allUsers, allBusinessMemberships, allBusinesses, allEmails]);

  const handleTabChange = (tab: 'global' | 'business') => {
    setActiveTab(tab);
    setAuthError(null);
    if (tab === 'global') {
      const firstG = globalPersonas[0];
      setValue('identifier', firstG ? firstG.identifier : 'SUPERADMIN-001');
      setValue('password', firstG ? firstG.password : 'admin123');
    } else {
      const firstB = businessPersonas[0];
      setValue('identifier', firstB ? firstB.identifier : 'alice.business@gmail.com');
      setValue('password', '123456');
    }
  };

  const onFinish = async (values: any) => {
    setAuthError(null);
    setLoading(true);
    const res = await login(values.identifier, values.password);
    setLoading(false);

    if (res.success && res.targetWorkspace) {
      if (res.targetWorkspace.type === 'PLATFORM') {
        navigate('/p/dashboard');
      } else if (res.targetWorkspace.type === 'BUSINESS') {
        navigate('/b/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } else {
      setAuthError(res.message || 'Login failed.');
    }
  };

  const handleQuickPersona = async (identifier: string, pass: string) => {
    setValue('identifier', identifier);
    setValue('password', pass);
    setAuthError(null);
    setLoading(true);
    const res = await login(identifier, pass);
    setLoading(false);
    if (res.success && res.targetWorkspace) {
      if (res.targetWorkspace.type === 'PLATFORM') {
        navigate('/p/dashboard');
      } else if (res.targetWorkspace.type === 'BUSINESS') {
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
      {/* Mode Switcher Tabs (Global, Business) */}
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
              Sign in with your individual account or platform admin handle to access personal features, platform management, and switch across linked businesses.
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

      {/* Dynamic Demo Persona Cards */}
      <div className={`mb-6 p-4 rounded-xl border ${activeTab === 'global' ? 'border-sky-100 bg-sky-50/40' : 'border-purple-100 bg-purple-50/40'}`}>
        <div className={`text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center justify-between ${
          activeTab === 'global' ? 'text-sky-800' : 'text-purple-800'
        }`}>
          <div className="flex items-center gap-1.5">
            <Lucide.UserCheck size={14} /> Quick Demo {activeTab === 'global' ? 'Global' : 'Business'} Credentials
          </div>
          <Link
            to="/db"
            target="_blank"
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            <Lucide.Database size={12} />
            <span>DB Manager</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          {activeTab === 'global' && globalPersonas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleQuickPersona(p.identifier, p.password)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-sky-100/70 border border-sky-200 transition-colors text-left shadow-2xs"
            >
              <div>
                <span className="font-semibold text-slate-800 block">{p.name} ({p.userId})</span>
                <span className="text-slate-500 block text-[11px]">{p.identifier}</span>
              </div>
              <AntTag color={p.tagColor} className="m-0 font-medium">{p.roleTag}</AntTag>
            </button>
          ))}

          {activeTab === 'business' && businessPersonas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleQuickPersona(p.identifier, p.password)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-purple-100/70 border border-purple-200 transition-colors text-left shadow-2xs"
            >
              <div>
                <span className="font-semibold text-slate-800 block">{p.name} • {p.businessName}</span>
                <span className="text-slate-500 block text-[11px]">{p.identifier}</span>
              </div>
              <AntTag color={p.tagColor} className="m-0 font-medium">{p.roleTag}</AntTag>
            </button>
          ))}
        </div>
      </div>

      {authError && (
        <div className="mb-4">
          <AntAlert type="error" message={authError} showIcon />
        </div>
      )}

      <form onSubmit={handleSubmit(onFinish)} className="space-y-2">
        <FormItem
          label={activeTab === 'global' ? 'Global Email or User ID / Handle' : 'Business Email Address'}
          required
          error={errors.identifier?.message as string}
        >
          <Controller
            name="identifier"
            control={control}
            rules={{ required: 'Please input your login identifier!' }}
            render={({ field }) => (
              <AntInput
                {...field}
                size="large"
                status={errors.identifier ? 'error' : ''}
                prefix={<Lucide.User size={16} className="text-slate-400" />}
                placeholder={activeTab === 'global' ? 'e.g. john.personal@gmail.com or SUPERADMIN-001' : 'alice.business@gmail.com'}
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
          <Link to="/forgot-password" className="text-slate-600 hover:text-slate-900 font-medium text-sm">
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
        <Link to="/register" className="text-sky-600 hover:text-sky-700 font-semibold">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;
