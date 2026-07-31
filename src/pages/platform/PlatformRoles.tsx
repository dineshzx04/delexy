import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Drawer as AntDrawer, Card as AntCard, Tooltip as AntTooltip } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type PlatformRole, type PlatformMembership, type User } from '../../data/user';

const PlatformRoles: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Administration</span> },
    { title: <span className="text-gray-900 font-semibold">Platform Roles</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const platformRoles = useLiveQuery(() => userDb.platformRoles.toArray()) || [];
  const platformMemberships = useLiveQuery(() => userDb.platformMemberships.toArray()) || [];
  const users = useLiveQuery(() => userDb.users.toArray()) || [];

  // Enriched role records with assigned member count and member details
  const roleData = useMemo(() => {
    return platformRoles.map((role: PlatformRole) => {
      const assignedMemberships = platformMemberships.filter((pm: PlatformMembership) => pm.platform_role_id === role.id);
      const assignedUsersList = assignedMemberships.map((pm: PlatformMembership) => {
        const u = users.find((usr: User) => usr.id === pm.user_id);
        return {
          membership_id: pm.id,
          user_id: pm.user_id,
          full_name: u?.full_name || 'Unknown Staff',
          app_user_id: u?.app_user_id || pm.user_id,
          status: pm.status
        };
      });

      return {
        ...role,
        assignedCount: assignedMemberships.length,
        assignedUsers: assignedUsersList
      };
    }).filter(r =>
      r.role_name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.id.toLowerCase().includes(searchText.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchText.toLowerCase())) ||
      r.permissions.some(p => p.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [platformRoles, platformMemberships, users, searchText]);

  const columns = [
    {
      title: 'Role Identity',
      key: 'role_identity',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            <Lucide.KeyRound size={18} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              {record.role_name}
              <AntTag color="purple" className="text-[10px] font-mono px-1.5 py-0">
                {record.id}
              </AntTag>
            </div>
            <div className="text-xs text-gray-500 max-w-sm truncate mt-0.5">
              {record.description || 'No description configured.'}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Total Perms',
      dataIndex: 'permissions',
      key: 'total_perms',
      width: 120,
      render: (perms: string[]) => (
        <AntTag color="geekblue" className="font-semibold text-xs">
          {perms.length} Permissions
        </AntTag>
      )
    },
    {
      title: 'Assigned Staff',
      dataIndex: 'assignedCount',
      key: 'assignedCount',
      width: 140,
      render: (count: number) => (
        <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
          <Lucide.Users size={14} className="text-sky-600" />
          {count} Platform Members
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 130,
      render: (_: any, record: any) => (
        <AntButton
          type="text"
          size="small"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center gap-1 font-medium text-xs"
          onClick={() => {
            setSelectedRole(record);
            setIsDetailsDrawerOpen(true);
          }}
        >
          <Lucide.Eye size={14} /> View Details
        </AntButton>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Roles</h1>
          <p className="text-gray-500 text-sm">
            Manage RBAC platform administrative roles, granular permission policies, and assigned staff members.
          </p>
        </div>
        <AntButton
          type="primary"
          icon={<Lucide.Plus size={16} />}
          className="bg-purple-600 hover:bg-purple-700 font-medium"
          size="large"
        >
          Create Platform Role
        </AntButton>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search platform roles by name, ID, description, or permission..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500">
            Total {roleData.length} Configured Platform Roles
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={roleData}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={false}
        />
      </div>

      {/* Role Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Lucide.KeyRound size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">
                {selectedRole?.role_name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Role ID: {selectedRole?.id}
              </div>
            </div>
          </div>
        }
        width={560}
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        destroyOnClose
      >
        {selectedRole && (
          <div className="space-y-6">
            {/* 1. Overview Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">Role Policy Details</span>
                <AntTag color="purple" className="font-mono text-xs">
                  {selectedRole.permissions.length} PERMISSIONS
                </AntTag>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 block">Role Name</span>
                  <span className="font-semibold text-gray-800 text-sm">{selectedRole.role_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Description</span>
                  <span className="text-gray-700 leading-relaxed">{selectedRole.description || 'No description specified.'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 block">Created At</span>
                    <span className="font-mono text-gray-700">{new Date(selectedRole.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Assigned Staff</span>
                    <span className="font-semibold text-indigo-700">{selectedRole.assignedCount} Active Members</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Granular Permissions List */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.ShieldCheck size={16} className="text-purple-600" />
                Granted Permissions ({selectedRole.permissions.length})
              </span>
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedRole.permissions.map((perm: string) => (
                    <AntTag key={perm} color="blue" className="text-xs font-mono py-0.5">
                      <Lucide.CheckCircle2 size={12} className="inline mr-1 text-blue-600" />
                      {perm}
                    </AntTag>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Assigned Platform Staff */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Users size={16} className="text-sky-600" />
                Assigned Platform Members ({selectedRole.assignedUsers.length})
              </span>
              {selectedRole.assignedUsers.length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  No platform members are currently assigned to this role.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRole.assignedUsers.map((member: any) => (
                    <div key={member.membership_id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                          {member.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {member.full_name}
                            <span className="text-[10px] text-gray-400 font-mono">({member.app_user_id})</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">Membership ID: {member.membership_id}</div>
                        </div>
                      </div>
                      <AntTag color={member.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                        {member.status}
                      </AntTag>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AntDrawer>
    </div>
  );
};

export default PlatformRoles;
