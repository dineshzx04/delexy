import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Modal as AntModal, Form as AntForm, Select as AntSelect, Card as AntCard, Tooltip as AntTooltip, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type User, type PlatformMembership, type PlatformRole } from '../../data/user';

const PlatformUsers: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMembership, setEditingMembership] = useState<any>(null);
  const [form] = AntForm.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Organizations</span> },
    { title: <span className="text-gray-900 font-semibold">Platform Users & Memberships</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const users = useLiveQuery(() => userDb.users.toArray()) || [];
  const platformMemberships = useLiveQuery(() => userDb.platformMemberships.toArray()) || [];
  const platformRoles = useLiveQuery(() => userDb.platformRoles.toArray()) || [];
  const userEmails = useLiveQuery(() => userDb.userEmails.toArray()) || [];
  const emails = useLiveQuery(() => userDb.emails.toArray()) || [];
  const businessMemberships = useLiveQuery(() => userDb.businessMemberships.toArray()) || [];

  // Combine user, membership, platform email, and role data (show ONLY platform members, not super admin)
  const platformUserData = useMemo(() => {
    return platformMemberships
      .filter((pm: PlatformMembership) => pm.membership_type === 'PLATFORM_MEMBER')
      .map((pm: PlatformMembership) => {
        const user = users.find((u: User) => u.id === pm.user_id);
        const role = platformRoles.find((r: PlatformRole) => r.id === pm.platform_role_id);

        // Resolve personal email via userEmails (for non-SuperAdmin users)
        const userEmailRecord = userEmails.find((ue: any) => ue.user_id === pm.user_id && ue.is_primary);
        const emailRecord = userEmailRecord ? emails.find((e: any) => e.id === userEmailRecord.email_id) : null;

        // Check 3-Tier Separation constraint: check if this email is mistakenly used in business memberships
        const isOverlappingWithMemberEmail = emailRecord
          ? businessMemberships.some((bm: any) => bm.email_id === emailRecord.id)
          : false;

        return {
          id: pm.id,
          user_id: pm.user_id,
          app_user_id: user?.app_user_id || pm.user_id,
          full_name: user?.full_name || 'Unknown User',
          membership_type: pm.membership_type,
          role_name: role?.role_name || 'Platform Member',
          platform_role_id: pm.platform_role_id,
          email: emailRecord ? emailRecord.email : 'Unlinked Email',
          email_type: emailRecord?.type || 'UNLINKED',
          isOverlappingWithMemberEmail,
          require_switch_password: pm.require_switch_password,
          status: pm.status,
          created_at: pm.created_at
        };
      });
  }, [users, platformMemberships, platformRoles, userEmails, emails, businessMemberships]);

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-gray-500 font-medium">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      )
    },
    {
      title: 'Platform User',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {record.membership_type === 'SUPER_ADMIN' ? <Lucide.ShieldAlert size={18} /> : record.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              {record.full_name}
              <span className="text-xs text-gray-400 font-mono">({record.app_user_id})</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Lucide.Mail size={12} className="text-gray-400" />
              {record.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Membership Type',
      dataIndex: 'membership_type',
      key: 'membership_type',
      render: (type: string) => (
        <AntTag color={type === 'SUPER_ADMIN' ? 'purple' : 'blue'} className="font-medium px-2 py-0.5">
          {type === 'SUPER_ADMIN' ? 'SUPER ADMIN (Root)' : 'PLATFORM MEMBER'}
        </AntTag>
      )
    },
    {
      title: 'Assigned Platform Role',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (roleName: string, record: any) => (
        <div className="flex items-center gap-1.5 font-medium text-gray-800">
          <Lucide.KeyRound size={14} className="text-sky-600" />
          {roleName}
        </div>
      )
    },
    {
      title: 'Email Tier (3-Tier Rule)',
      key: 'email_tier',
      render: (_: any, record: any) => {
        if (record.membership_type === 'SUPER_ADMIN') {
          return (
            <AntTooltip title="Rule 3: Super Admin MUST NOT have any email address in userEmails or emails table.">
              <AntTag color="purple" className="text-xs">SUPERADMIN ISOLATED</AntTag>
            </AntTooltip>
          );
        }
        if (record.isOverlappingWithMemberEmail) {
          return (
            <AntTag color="error" className="text-xs">
              <Lucide.AlertTriangle size={12} className="inline mr-1" /> OVERLAP VIOLATION
            </AntTag>
          );
        }
        return (
          <AntTooltip title="Rule 2: Personal login email from userEmails.ts (0 overlap with single-tenant business member emails).">
            <AntTag color="blue" className="text-xs font-mono">
              <Lucide.CheckCircle2 size={12} className="inline mr-1 text-blue-600" /> PERSONAL TIER
            </AntTag>
          </AntTooltip>
        );
      }
    },
    {
      title: 'Switch Gate',
      dataIndex: 'require_switch_password',
      key: 'require_switch_password',
      render: (required: boolean) => (
        required ? (
          <AntTag color="orange" className="text-xs">
            <Lucide.Lock size={12} className="inline mr-1" /> Protected
          </AntTag>
        ) : (
          <span className="text-xs text-gray-400">Direct</span>
        )
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <AntTag color={status === 'ACTIVE' ? 'success' : 'default'}>{status}</AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.membership_type !== 'SUPER_ADMIN' && (
            <AntButton
              type="text"
              size="small"
              className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
              onClick={() => {
                setEditingMembership(record);
                form.setFieldsValue({
                  platform_role_id: record.platform_role_id,
                  status: record.status
                });
                setIsModalVisible(true);
              }}
            >
              Edit Access
            </AntButton>
          )}
        </div>
      ),
    },
  ];

  const handleSaveMembership = async (values: any) => {
    if (!editingMembership) return;
    await userDb.platformMemberships.update(editingMembership.id, {
      platform_role_id: values.platform_role_id,
      status: values.status,
      updated_at: new Date().toISOString()
    });
    antMessage.success('Platform membership updated successfully.');
    setIsModalVisible(false);
  };

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Users & Memberships</h1>
          <p className="text-gray-500">
            View platform administrators, assign RBAC roles, and verify strict 3-tier email separation rules.
          </p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large">
          <Lucide.UserPlus size={16} /> Invite user
        </AntButton>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <AntTable
          size="small"
          columns={columns}
          dataSource={platformUserData}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true
          }}
        />
      </div>

      {/* Edit Membership Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.Shield size={18} className="text-sky-600" />
            Edit Platform Access for {editingMembership?.full_name}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSaveMembership} className="mt-4">
          <AntForm.Item name="platform_role_id" label="Platform Role" rules={[{ required: true, message: 'Please select a role' }]}>
            <AntSelect
              placeholder="Select a platform role"
              options={platformRoles.map((role: PlatformRole) => ({
                value: role.id,
                label: `${role.role_name} (${role.permissions.length} permissions)`,
              }))}
            />
          </AntForm.Item>

          <AntForm.Item name="status" label="Membership Status" rules={[{ required: true }]}>
            <AntSelect
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
              ]}
            />
          </AntForm.Item>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default PlatformUsers;
