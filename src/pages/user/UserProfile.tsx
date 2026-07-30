import React, { useState, useEffect } from 'react';
import {
  Input as AntInput,
  Button as AntButton,
  Avatar as AntAvatar,
  Upload as AntUpload,
  Select as AntSelect,
  Tag as AntTag,
  Modal as AntModal,
  message as antMessage
} from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import FormItem from '../../components/common/FormItem';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  userDb,
  type EmailRecord,
  mockUsers,
  mockEmails,
  mockUserEmails,
  mockBusinessEmails,
  mockBusinesses,
  mockBusinessMemberships
} from '../../data/user';

const { Option } = AntSelect;

export interface CompactEmailDisplay {
  id: string;
  email: string;
  type: 'PRIMARY' | 'SECONDARY' | 'BUSINESS';
  roleLabel: string;
  isVerified: boolean;
}

interface PersonalInfoFormValues {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  phone: string;
  timezone: string;
}

interface AddEmailFormValues {
  email: string;
}

const UserProfile: React.FC = () => {
  const { currentUserId } = useWorkspace();
  const targetUserId = currentUserId || 'usr-1';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/profile" className="text-gray-900 font-semibold cursor-default pointer-events-none">User Profile</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // 1. Fetch User Record from Dexie DB or fallback to mockUsers from src/data/user/users.ts
  const userRecord = useLiveQuery(
    async () => await userDb.users.get(targetUserId),
    [targetUserId]
  ) || mockUsers.find((u) => u.id === targetUserId) || mockUsers[0];

  // 2. Query User Emails (Primary & Secondary) directly from Dexie DB / mockUserEmails
  const liveUserEmails = useLiveQuery(
    async () => {
      const uEmails = await userDb.userEmails.where('user_id').equals(targetUserId).toArray();
      const allEmails = await userDb.emails.toArray();

      return uEmails.map((ue) => {
        const emailObj = allEmails.find((e) => e.id === ue.email_id);
        return {
          id: ue.id,
          email: emailObj?.email || ue.email_id,
          type: ue.is_primary ? ('PRIMARY' as const) : ('SECONDARY' as const),
          roleLabel: ue.is_primary ? 'Account Primary Email' : 'Secondary Recovery Email',
          isVerified: ue.is_verified,
        };
      });
    },
    [targetUserId]
  );

  const fallbackUserEmails: CompactEmailDisplay[] = React.useMemo(() => {
    const uEmails = mockUserEmails.filter((ue) => ue.user_id === targetUserId);
    return uEmails.map((ue) => {
      const matchEmail = mockEmails.find((e) => e.id === ue.email_id);
      return {
        id: ue.id,
        email: matchEmail?.email || ue.email_id,
        type: ue.is_primary ? 'PRIMARY' : 'SECONDARY',
        roleLabel: ue.is_primary ? 'Account Primary Email' : 'Secondary Recovery Email',
        isVerified: ue.is_verified,
      };
    });
  }, [targetUserId]);

  const individualEmails = (liveUserEmails && liveUserEmails.length > 0) ? liveUserEmails : fallbackUserEmails;
  const primaryEmailItem = individualEmails.find((e) => e.type === 'PRIMARY') || individualEmails[0];
  const secondaryEmails = individualEmails.filter((e) => e.type === 'SECONDARY');

  // 3. Query Business Emails & Roles directly from Dexie DB / mockBusinessEmails
  const liveBusinessEmails = useLiveQuery(
    async () => {
      const memberships = await userDb.businessMemberships.where('user_id').equals(targetUserId).toArray();
      const bizIds = memberships.map((m) => m.business_id);

      const allBizEmails = await userDb.businessEmails.toArray();
      const userBizEmails = allBizEmails.filter((be) => bizIds.includes(be.business_id));
      const allEmails = await userDb.emails.toArray();
      const allBusinesses = await userDb.businesses.toArray();

      return userBizEmails.map((be) => {
        const emailObj = allEmails.find((e) => e.id === be.email_id);
        const bizObj = allBusinesses.find((b) => b.id === be.business_id);
        const member = memberships.find((m) => m.business_id === be.business_id);
        const role = member?.membership_type || 'MEMBER';
        return {
          id: be.id,
          email: emailObj?.email || be.email_id,
          type: 'BUSINESS' as const,
          roleLabel: `${bizObj?.name || 'Business'} (${be.label || 'Contact'}) • Role: ${role}`,
          isVerified: be.is_verified,
        };
      });
    },
    [targetUserId]
  );

  // 4. Query Personal Addresses directly from Dexie DB
  const mappedAddresses = useLiveQuery(
    async () => await userDb.addresses
      .where('owner_id').equals(targetUserId)
      .filter((a) => a.owner_type === 'USER')
      .toArray(),
    [targetUserId]
  ) || [];

  const fallbackBusinessEmails: CompactEmailDisplay[] = React.useMemo(() => {
    const list: CompactEmailDisplay[] = [];
    const memberships = mockBusinessMemberships.filter((bm) => bm.user_id === targetUserId);
    memberships.forEach((bm) => {
      const biz = mockBusinesses.find((b) => b.id === bm.business_id);
      const bizEmails = mockBusinessEmails.filter((be) => be.business_id === bm.business_id);
      bizEmails.forEach((be) => {
        const matchEmail = mockEmails.find((e) => e.id === be.email_id);
        list.push({
          id: be.id,
          email: matchEmail?.email || be.email_id,
          type: 'BUSINESS',
          roleLabel: `${biz?.name || 'Business'} (${be.label || 'Contact'}) • Role: ${bm.membership_type}`,
          isVerified: be.is_verified,
        });
      });
    });
    return list;
  }, [targetUserId]);

  const businessEmails = (liveBusinessEmails && liveBusinessEmails.length > 0) ? liveBusinessEmails : fallbackBusinessEmails;
  const totalEmailsCount = individualEmails.length + businessEmails.length;

  // React Hook Form for Personal Information
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { errors: profileErrors }
  } = useForm<PersonalInfoFormValues>({
    defaultValues: {
      firstName: userRecord?.first_name || 'John',
      lastName: userRecord?.last_name || 'Doe',
      jobTitle: 'Procurement Director',
      department: 'Operations',
      phone: '+1 (555) 000-0000',
      timezone: 'utc',
    }
  });

  useEffect(() => {
    if (userRecord) {
      resetProfileForm({
        firstName: userRecord.first_name || 'John',
        lastName: userRecord.last_name || 'Doe',
        jobTitle: 'Procurement Director',
        department: 'Operations',
        phone: '+1 (555) 000-0000',
        timezone: 'utc',
      });
    }
  }, [userRecord, resetProfileForm]);

  // React Hook Form for Add Secondary Email Modal
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    reset: resetEmailForm,
    formState: { errors: emailErrors }
  } = useForm<AddEmailFormValues>({
    defaultValues: { email: '' }
  });

  // ACTION 1: Save Profile Changes
  const onSaveProfile = async (data: PersonalInfoFormValues) => {
    try {
      if (userRecord?.id) {
        await userDb.users.update(userRecord.id, {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
          updated_at: new Date().toISOString(),
        });
        antMessage.success('Profile information saved successfully!');
      }
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to save profile changes.');
    }
  };

  // ACTION 2: Make Email Primary
  const handleMakePrimary = async (item: CompactEmailDisplay) => {
    try {
      const now = new Date().toISOString();
      const allDbEmails = await userDb.emails.toArray();
      let targetEmailObj = allDbEmails.find((e) => e.email.toLowerCase() === item.email.toLowerCase());

      if (!targetEmailObj) {
        const newEmailId = `em-${Date.now()}`;
        const newRecord: EmailRecord = { id: newEmailId, email: item.email.toLowerCase(), type: 'PERSONAL', created_at: now, updated_at: now };
        await userDb.emails.add(newRecord);
        targetEmailObj = newRecord;
      }

      if (!targetEmailObj) return;

      const existingUserEmails = await userDb.userEmails.where('user_id').equals(targetUserId).toArray();
      let foundTarget = false;

      for (const ue of existingUserEmails) {
        if (ue.email_id === targetEmailObj.id) {
          await userDb.userEmails.update(ue.id, { is_primary: true });
          foundTarget = true;
        } else {
          await userDb.userEmails.update(ue.id, { is_primary: false });
        }
      }

      if (!foundTarget) {
        await userDb.userEmails.add({
          id: `ue-${Date.now()}`,
          user_id: targetUserId,
          email_id: targetEmailObj.id,
          is_primary: true,
          is_self_added: true,
          is_verified: true,
          created_at: now,
          updated_at: now,
        });
      }

      antMessage.success(`Updated primary email to ${item.email}`);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to change primary email.');
    }
  };

  // ACTION 3: Add New Individual Secondary Email
  const onAddEmailSubmit = async (data: AddEmailFormValues) => {
    try {
      const now = new Date().toISOString();
      const inputEmail = data.email.trim().toLowerCase();
      const allDbEmails = await userDb.emails.toArray();
      let emailObj = allDbEmails.find((e) => e.email.toLowerCase() === inputEmail);

      if (!emailObj) {
        const newId = `em-${Date.now()}`;
        const newRecord: EmailRecord = { id: newId, email: inputEmail, type: 'PERSONAL', created_at: now, updated_at: now };
        await userDb.emails.add(newRecord);
        emailObj = newRecord;
      }

      if (!emailObj) return;

      const userEmails = await userDb.userEmails.where('user_id').equals(targetUserId).toArray();
      if (userEmails.some((ue) => ue.email_id === emailObj.id)) {
        antMessage.warning('This email address is already connected to your personal account.');
        return;
      }

      await userDb.userEmails.add({
        id: `ue-${Date.now()}`,
        user_id: targetUserId,
        email_id: emailObj.id,
        is_primary: false,
        is_self_added: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      });

      antMessage.success(`Added secondary individual email: ${inputEmail}`);
      setIsAddModalOpen(false);
      resetEmailForm();
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to add email address.');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and preferences.</p>
        </div>
        <AntButton
          type="primary"
          onClick={handleProfileSubmit(onSaveProfile)}
          className="bg-sky-600 hover:bg-sky-700 font-medium"
        >
          Save Changes
        </AntButton>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: User Overview */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col items-center text-center">
              <AntAvatar size={100} icon={<Lucide.User size={48} />} style={{ backgroundColor: '#0284c7' }} className="mb-4 text-3xl">
                {userRecord?.first_name?.[0]}{userRecord?.last_name?.[0]}
              </AntAvatar>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{userRecord?.full_name || `${userRecord?.first_name} ${userRecord?.last_name}`}</h2>
              <p className="text-gray-500 mb-4 text-sm font-medium">{primaryEmailItem?.email}</p>

              <AntUpload showUploadList={false}>
                <AntButton icon={<Lucide.Upload size={16} />}>Change Photo</AntButton>
              </AntUpload>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Info & Split Email Sections */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Personal Information Form */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800 text-lg flex items-center justify-between">
              <span>Personal Information</span>
              <Lucide.User size={18} className="text-gray-400" />
            </div>
            <div className="p-6">
              <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <FormItem label="First Name" required error={profileErrors.firstName?.message}>
                    <Controller
                      name="firstName"
                      control={profileControl}
                      rules={{ required: 'First name is required' }}
                      render={({ field }) => (
                        <AntInput {...field} status={profileErrors.firstName ? 'error' : ''} />
                      )}
                    />
                  </FormItem>

                  <FormItem label="Last Name" required error={profileErrors.lastName?.message}>
                    <Controller
                      name="lastName"
                      control={profileControl}
                      rules={{ required: 'Last name is required' }}
                      render={({ field }) => (
                        <AntInput {...field} status={profileErrors.lastName ? 'error' : ''} />
                      )}
                    />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <FormItem label="Job Title" error={profileErrors.jobTitle?.message}>
                    <Controller
                      name="jobTitle"
                      control={profileControl}
                      render={({ field }) => <AntInput {...field} />}
                    />
                  </FormItem>

                  <FormItem label="Department" error={profileErrors.department?.message}>
                    <Controller
                      name="department"
                      control={profileControl}
                      render={({ field }) => <AntInput {...field} />}
                    />
                  </FormItem>
                </div>

                <FormItem label="Phone Number" error={profileErrors.phone?.message}>
                  <Controller
                    name="phone"
                    control={profileControl}
                    render={({ field }) => (
                      <AntInput {...field} placeholder="+1 (555) 000-0000" />
                    )}
                  />
                </FormItem>

                <FormItem label="Timezone">
                  <Controller
                    name="timezone"
                    control={profileControl}
                    render={({ field }) => (
                      <AntSelect {...field} className="w-full">
                        <Option value="utc">UTC (Universal Coordinated Time)</Option>
                        <Option value="est">EST (Eastern Standard Time)</Option>
                        <Option value="pst">PST (Pacific Standard Time)</Option>
                      </AntSelect>
                    )}
                  />
                </FormItem>
              </form>
            </div>
          </div>
          {/* PERSONAL PHYSICAL ADDRESSES SECTION */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2 m-0">
                  <Lucide.MapPin size={18} className="text-sky-600" />
                  Personal Physical Addresses ({mappedAddresses.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-0">Registered shipping and billing address locations.</p>
              </div>

              <Link to="/user/addresses">
                <AntButton size="small" icon={<Lucide.ExternalLink size={13} />}>
                  Manage Addresses
                </AntButton>
              </Link>
            </div>

            <div className="p-6">
              {mappedAddresses.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No personal addresses registered.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mappedAddresses.map((addr) => (
                    <div key={addr.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <AntTag color="purple" className="text-xs font-semibold">{addr.address_type || 'HOME'}</AntTag>
                        {addr.is_primary ? <AntTag color="green">Primary</AntTag> : <AntTag color="default">Secondary</AntTag>}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{addr.line1} {addr.line2 ? `, ${addr.line2}` : ''}</div>
                      <div className="text-xs text-slate-500">
                        {addr.city}, {addr.state_province} {addr.postal_code}
                      </div>
                      <div className="text-xs text-sky-700 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60">
                        <Lucide.Globe size={12} /> {addr.country_name || addr.country_code} ({addr.country_code})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Compact Emails & Roles View - Split into Individual & Business */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2 m-0">
                  <Lucide.Mail size={18} className="text-sky-600" />
                  Email Addresses & Roles
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-0">Overview of individual (Primary & Secondary) and business emails.</p>
              </div>
              <div className="flex items-center gap-3">
                <AntTag color="blue" className="m-0 font-semibold">{totalEmailsCount} Connected</AntTag>
                <AntButton
                  type="primary"
                  size="small"
                  icon={<Lucide.Plus size={14} />}
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-sky-600 hover:bg-sky-700 flex items-center gap-1 font-medium"
                >
                  Add Email
                </AntButton>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* INDIVIDUAL EMAILS SECTION */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Lucide.User size={14} className="text-sky-600" />
                  Individual Emails
                </div>

                {/* Primary Email */}
                {primaryEmailItem && (
                  <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-lg flex items-center justify-between gap-4 text-sm shadow-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-sky-600 text-white shrink-0 mt-0.5 shadow-xs">
                        <Lucide.Star size={16} className="fill-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{primaryEmailItem.email}</div>
                        <div className="text-xs text-gray-500">{primaryEmailItem.roleLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AntTag color="gold" className="m-0 font-semibold text-xs py-0.5">Primary Email</AntTag>
                      {primaryEmailItem.isVerified && <AntTag color="success" className="m-0 text-xs py-0.5">Verified</AntTag>}
                    </div>
                  </div>
                )}

                {/* Secondary Emails */}
                {secondaryEmails.map((sec) => (
                  <div key={sec.id} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg flex items-center justify-between gap-4 text-sm hover:border-slate-300 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-200 text-slate-700 shrink-0 mt-0.5">
                        <Lucide.Mail size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{sec.email}</div>
                        <div className="text-xs text-gray-500">{sec.roleLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AntButton
                        type="text"
                        size="small"
                        icon={<Lucide.Star size={13} />}
                        onClick={() => handleMakePrimary(sec)}
                        className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 text-xs flex items-center gap-1 font-medium px-2"
                      >
                        Make Primary
                      </AntButton>

                      <AntTag color="default" className="m-0 font-medium text-xs text-gray-600">Secondary Email</AntTag>
                      {sec.isVerified && <AntTag color="success" className="m-0 text-xs">Verified</AntTag>}
                    </div>
                  </div>
                ))}
              </div>

              {/* BUSINESS EMAILS SECTION */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Lucide.Building2 size={14} className="text-purple-600" />
                  Business Emails ({businessEmails.length})
                </div>

                {businessEmails.length === 0 ? (
                  <div className="text-xs text-gray-400 italic px-1">No business emails linked.</div>
                ) : (
                  businessEmails.map((biz) => (
                    <div key={biz.id} className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-lg flex items-center justify-between gap-4 text-sm hover:border-purple-200 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                          <Lucide.Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{biz.email}</div>
                          <div className="text-xs text-purple-800 font-medium">{biz.roleLabel}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AntTag color="purple" className="m-0 font-medium text-xs">Business Email</AntTag>
                        {biz.isVerified && <AntTag color="success" className="m-0 text-xs">Verified</AntTag>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Add Secondary Individual Email Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Lucide.MailPlus size={20} className="text-sky-600" />
            <span>Add Secondary Individual Email</span>
          </div>
        }
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          resetEmailForm();
        }}
        footer={null}
        destroyOnClose
      >
        <form onSubmit={handleEmailSubmit(onAddEmailSubmit)} className="mt-4 space-y-4">
          <FormItem label="Email Address" required error={emailErrors.email?.message}>
            <Controller
              name="email"
              control={emailControl}
              rules={{
                required: 'Please enter an email address',
                pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email address' }
              }}
              render={({ field }) => (
                <AntInput
                  {...field}
                  placeholder="e.g. john.secondary@gmail.com"
                  status={emailErrors.email ? 'error' : ''}
                />
              )}
            />
          </FormItem>

          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            This email address will be linked to your individual user profile as a secondary recovery email.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <AntButton onClick={() => setIsAddModalOpen(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-sky-600 hover:bg-sky-700">
              Add Secondary Email
            </AntButton>
          </div>
        </form>
      </AntModal>
    </div>
  );
};
export default UserProfile;
