import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton, Tag as AntTag, Modal as AntModal, Input as AntInput, message as antMessage } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace, type DynamicWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const BusinessLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, switchWorkspace, validateSwitchPassword, currentUser, logout, currentCredential } = useWorkspace();
  const { customBreadcrumbs } = useBreadcrumbContext();

  const [pendingWorkspace, setPendingWorkspace] = useState<DynamicWorkspace | null>(null);
  const [switchPassInput, setSwitchPassInput] = useState('123456');
  const [switchPassModalOpen, setSwitchPassModalOpen] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const handleWorkspaceSwitch = (id: string) => {
    const targetWs = workspaces.find((w) => w.id === id);
    if (!targetWs) return;

    if (targetWs.requireSwitchPassword && targetWs.id !== activeWorkspace.id) {
      setPendingWorkspace(targetWs);
      setSwitchPassInput('123456');
      setSwitchPassModalOpen(true);
    } else {
      const ws = switchWorkspace(id);
      if (!ws) return;
      if (ws.type === 'tenant') {
        navigate('/b/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  };

  const handleConfirmSwitchPassword = async () => {
    if (!pendingWorkspace) return;
    setLoadingPass(true);
    const isValid = await validateSwitchPassword(pendingWorkspace.id, switchPassInput);
    setLoadingPass(false);

    if (isValid) {
      const ws = switchWorkspace(pendingWorkspace.id);
      setSwitchPassModalOpen(false);
      setPendingWorkspace(null);
      if (ws?.type === 'tenant') {
        navigate('/b/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } else {
      antMessage.error('Invalid secondary switch password.');
    }
  };

  const breadcrumbItems = customBreadcrumbs || [];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'business-profile',
      icon: <Lucide.Building2 size={16} />,
      label: <Link to="/b/profile">Business Profile</Link>,
    },
    ...(currentCredential?.credential_type !== 'BUSINESS'
      ? [
          {
            key: 'user-profile',
            icon: <Lucide.User size={16} />,
            label: <Link to="/user/profile">Personal Profile</Link>,
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <Lucide.LogOut size={16} className="text-red-500" />,
      label: (
        <span
          className="text-red-500 cursor-pointer block"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </span>
      ),
    },
  ];

  const getMenuItems = () => [
    {
      key: 'business-core',
      type: 'group',
      label: collapsed ? null : 'Business Management',
      children: [
        {
          key: '/b/dashboard',
          icon: <Lucide.LayoutDashboard size={18} />,
          label: <Link to="/b/dashboard">Business Dashboard</Link>,
        },
        {
          key: '/b/profile',
          icon: <Lucide.Building2 size={18} />,
          label: <Link to="/b/profile">Business Profile</Link>,
        },
        {
          key: '/b/members',
          icon: <Lucide.Users size={18} />,
          label: <Link to="/b/members">Team Members</Link>,
        },
        {
          key: '/b/roles',
          icon: <Lucide.ShieldCheck size={18} />,
          label: <Link to="/b/roles">Roles & Permissions</Link>,
        },
        {
          key: '/b/emails',
          icon: <Lucide.Mail size={18} />,
          label: <Link to="/b/emails">Business Emails</Link>,
        },
        {
          key: '/b/settings',
          icon: <Lucide.Settings size={18} />,
          label: <Link to="/b/settings">Business Settings</Link>,
        },
      ],
    },
    {
      key: 'b2b-operations',
      type: 'group',
      label: collapsed ? null : 'Procurement & Catalog',
      children: [
        {
          key: '/b/rfqs',
          icon: <Lucide.FileText size={18} />,
          label: <Link to="/b/rfqs">RFQs & Quotes</Link>,
        },
        {
          key: '/b/products',
          icon: <Lucide.Package size={18} />,
          label: <Link to="/b/products">Business Products</Link>,
        },
      ],
    },
  ];

  const workspaceMenuItems: MenuProps['items'] = workspaces.map((w) => ({
    key: w.id,
    label: (
      <div
        onClick={() => handleWorkspaceSwitch(w.id)}
        className="flex items-center justify-between gap-4 py-2 min-w-[240px] cursor-pointer"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 text-sm">{w.name}</span>
            {w.requireSwitchPassword && (
              <AntTag color="orange" className="text-[10px] m-0 font-medium px-1 py-0">Lock</AntTag>
            )}
          </div>
          {w.email && (
            <span className="text-xs text-indigo-700 font-mono flex items-center gap-1 mt-0.5">
              <Lucide.Mail size={12} className="text-indigo-600 shrink-0" />
              {w.email}
            </span>
          )}
          <span className="text-[11px] text-slate-500 capitalize mt-0.5">{w.type} • Role: {w.role}</span>
        </div>
        {w.id === activeWorkspace.id && <Lucide.Check size={16} className="text-indigo-600 shrink-0" />}
      </div>
    ),
  }));

  const userInitials = currentUser?.first_name && currentUser?.last_name
    ? `${currentUser.first_name[0]}${currentUser.last_name[0]}`
    : (currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'US');

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased">
      {/* Business Sidebar */}
      <aside
        className={cn(
          "bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
          <Link to="/b/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
              <Lucide.Building2 size={18} />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base text-white tracking-tight truncate max-w-[140px]">
                  {activeWorkspace.name.replace(/\(Personal\)/g, '')}
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-0.5">
                  Business Workspace
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar bg-slate-900">
          <AntMenu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            items={getMenuItems() as MenuProps['items']}
            className="border-none bg-transparent w-auto"
            inlineCollapsed={collapsed}
          />
        </div>
      </aside>

      {/* Main Container */}
      <div className={cn("flex-1 flex flex-col transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 fixed top-0 right-0 z-20 transition-all duration-300" style={{ left: collapsed ? '4rem' : '16rem' }}>
          <div className="flex items-center gap-4">
            <AntButton
              type="text"
              icon={collapsed ? <Lucide.Menu size={20} /> : <Lucide.ChevronLeft size={20} />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-600 hover:text-slate-900 flex items-center justify-center"
            />
            <div className="hidden sm:flex items-center gap-2">
              <AntTag color="indigo" className="font-medium text-xs py-0.5 px-2">
                Enterprise Tenant Context
              </AntTag>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace Switcher Dropdown */}
            <AntDropdown menu={{ items: workspaceMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2.5 cursor-pointer hover:bg-indigo-50/60 py-1.5 px-3 rounded-lg transition-colors border border-indigo-200 bg-white">
                <Lucide.Building2 size={16} className="text-indigo-600 flex-shrink-0" />
                <div className="hidden md:flex flex-col leading-tight text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-800">{activeWorkspace.name}</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-medium uppercase">
                      {activeWorkspace.role}
                    </span>
                  </div>
                  {activeWorkspace.email && (
                    <span className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                      <Lucide.Mail size={11} className="text-indigo-600" />
                      {activeWorkspace.email}
                    </span>
                  )}
                </div>
                <Lucide.ChevronDown size={14} className="text-slate-400" />
              </div>
            </AntDropdown>

            <AntButton type="text" icon={<Lucide.Bell size={18} />} className="text-slate-600 flex items-center justify-center" />

            <AntDropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors border border-slate-200">
                <AntAvatar style={{ backgroundColor: '#4f46e5' }}>{userInitials}</AntAvatar>
                <div className="hidden md:flex flex-col leading-tight text-left">
                  <span className="text-sm font-semibold text-slate-800">{currentUser?.full_name || 'User'}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Lucide.Mail size={11} className="text-slate-400" />
                    {activeWorkspace.email}
                  </span>
                </div>
              </div>
            </AntDropdown>
          </div>
        </header>

        {/* Layout Context Switch Password Modal */}
        <AntModal
          open={switchPassModalOpen}
          onCancel={() => {
            setSwitchPassModalOpen(false);
            setPendingWorkspace(null);
          }}
          onOk={handleConfirmSwitchPassword}
          okText="Confirm Switch"
          confirmLoading={loadingPass}
          title={
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Lucide.KeyRound size={20} className="text-amber-500" />
              Switch Password Required
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <p className="text-slate-600 text-sm">
              Switching workspace to <span className="font-bold text-indigo-700">{pendingWorkspace?.name}</span> requires secondary switch password verification:
            </p>

            <AntInput.Password
              size="large"
              value={switchPassInput}
              onChange={(e) => setSwitchPassInput(e.target.value)}
              placeholder="Enter switch password (e.g. 123456)"
              prefix={<Lucide.Lock size={16} className="text-slate-400" />}
            />
          </div>
        </AntModal>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 mt-16">
          {breadcrumbItems.length > 0 && (
            <div className="mb-6">
              <AntBreadcrumb items={breadcrumbItems} className="text-sm font-medium" />
            </div>
          )}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessLayout;
