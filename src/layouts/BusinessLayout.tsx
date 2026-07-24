import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton, Tag as AntTag } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const BusinessLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, switchWorkspace, currentUser, logout, currentCredential } = useWorkspace();
  const { customBreadcrumbs } = useBreadcrumbContext();

  const handleWorkspaceSwitch = (id: string) => {
    const ws = switchWorkspace(id);
    if (!ws) return;
    if (ws.type === 'tenant') {
      navigate('/b/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const breadcrumbItems = customBreadcrumbs || [];

  const userMenuItems: MenuProps['items'] = [
    ...(currentCredential?.credential_type !== 'BUSINESS'
      ? [
          {
            key: 'user-profile',
            icon: <Lucide.User size={16} />,
            label: <Link to="/user/profile">Personal Profile</Link>,
          },
          {
            type: 'divider' as const,
          },
        ]
      : []),
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
          icon: <Lucide.Building size={18} />,
          label: <Link to="/b/settings">Business Profile</Link>,
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
        className="flex items-center justify-between gap-4 py-1.5 min-w-[220px] cursor-pointer"
      >
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-sm">{w.name}</span>
          <span className="text-xs text-slate-500 capitalize">{w.type} • Role: {w.role}</span>
        </div>
        {w.id === activeWorkspace.id && <Lucide.Check size={16} className="text-indigo-600" />}
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
            className="border-none bg-transparent"
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
              <div className="flex items-center gap-2 cursor-pointer hover:bg-indigo-50/60 py-1.5 px-3 rounded-lg transition-colors border border-indigo-200 bg-white">
                <Lucide.Building2 size={16} className="text-indigo-600" />
                <span className="font-semibold text-sm text-slate-800 hidden md:block">{activeWorkspace.name}</span>
                <span className="text-[11px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-medium hidden md:block uppercase">
                  {activeWorkspace.role}
                </span>
                <Lucide.ChevronDown size={14} className="text-slate-400" />
              </div>
            </AntDropdown>

            <AntButton type="text" icon={<Lucide.Bell size={18} />} className="text-slate-600 flex items-center justify-center" />

            <AntDropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors border border-slate-200">
                <AntAvatar style={{ backgroundColor: '#4f46e5' }}>{userInitials}</AntAvatar>
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-slate-800">{currentUser?.full_name || 'User'}</span>
                  <span className="text-xs text-slate-500">{activeWorkspace.role}</span>
                </div>
              </div>
            </AntDropdown>
          </div>
        </header>

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
