import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const UserLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, switchWorkspace, currentUser, logout, currentCredential } = useWorkspace();
  const { customBreadcrumbs } = useBreadcrumbContext();

  // Route Guard: BUSINESS credential users do not have permission/rights to access user routes
  if (currentCredential?.credential_type === 'BUSINESS') {
    return <Navigate to="/b/dashboard" replace />;
  }

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
    {
      key: 'profile',
      icon: <Lucide.User size={16} />,
      label: <Link to="/user/profile">My Profile</Link>,
    },
    {
      key: 'addresses',
      icon: <Lucide.MapPin size={16} />,
      label: <Link to="/user/addresses">My Addresses</Link>,
    },
    {
      key: 'identifications',
      icon: <Lucide.ShieldCheck size={16} />,
      label: <Link to="/user/identifications">Identity & KYC</Link>,
    },
    {
      type: 'divider',
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

  const getMenuItems = () => {
    return [
      {
        key: 'personal-group',
        type: 'group',
        label: collapsed ? null : 'User Workspace',
        children: [
          {
            key: '/user/dashboard',
            icon: <Lucide.LayoutDashboard size={18} />,
            label: <Link to="/user/dashboard">Dashboard</Link>,
          },
          {
            key: '/user/profile',
            icon: <Lucide.User size={18} />,
            label: <Link to="/user/profile">User Profile</Link>,
          },
          {
            key: '/user/addresses',
            icon: <Lucide.MapPin size={18} />,
            label: <Link to="/user/addresses">My Addresses</Link>,
          },
          {
            key: '/user/identifications',
            icon: <Lucide.ShieldCheck size={18} />,
            label: <Link to="/user/identifications">Identity Verification (KYC)</Link>,
          },
        ],
      },
      {
        key: 'business-action-group',
        type: 'group',
        label: collapsed ? null : 'Business Actions',
        children: [
          {
            key: '/user/create-business',
            icon: <Lucide.PlusCircle size={18} />,
            label: <Link to="/user/create-business">Create Business</Link>,
          },
        ],
      },
    ];
  };

  const workspaceMenuItems: MenuProps['items'] = workspaces.map((w) => ({
    key: w.id,
    label: (
      <div
        onClick={() => handleWorkspaceSwitch(w.id)}
        className={`flex items-center justify-between gap-4 min-w-[240px] cursor-pointer`}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-sm">{w.name}</span>
          {w.email && (
            <span className="text-xs text-sky-700 font-mono flex items-center gap-1 mt-0.5">
              <Lucide.Mail size={12} className="text-sky-600 shrink-0" />
              {w.email}
            </span>
          )}
          <span className="text-[11px] text-slate-500 capitalize mt-0.5">{w.type} • Role: {w.role}</span>
        </div>
        {w.id === activeWorkspace.id && <Lucide.Check size={16} className="text-sky-600 shrink-0" />}
      </div>
    ),
  }));

  const userInitials = currentUser?.first_name && currentUser?.last_name
    ? `${currentUser.first_name[0]}${currentUser.last_name[0]}`
    : (currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'US');

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <Link to="/user/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              D
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Delexy</span>
                <span className="text-[10px] text-sky-600 font-semibold tracking-wider uppercase">User Portal</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          <AntMenu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems() as MenuProps['items']}
            className="border-none text-slate-700"
            inlineCollapsed={collapsed}
          />
        </div>
      </aside>

      {/* Main Content Area */}
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
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace Switcher */}
            <AntDropdown menu={{ items: workspaceMenuItems }} trigger={['click']} placement="bottomRight" >
              <div className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 py-1.5 px-3 rounded-lg transition-colors border border-slate-200 bg-slate-50/50">
                <Lucide.Building2 size={16} className="text-sky-600 flex-shrink-0" />
                <div className="hidden md:flex flex-col leading-tight text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-800">{activeWorkspace.name}</span>
                    <span className="text-[10px] text-sky-700 bg-sky-100/80 px-1.5 py-0.2 rounded font-medium uppercase">
                      {activeWorkspace.type}
                    </span>
                  </div>
                  {activeWorkspace.email && (
                    <span className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                      <Lucide.Mail size={11} className="text-sky-600" />
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
                <AntAvatar style={{ backgroundColor: '#0284c7' }}>{userInitials}</AntAvatar>
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

        {/* Main Body */}
        <main className="flex-1 p-6 md:p-8 mt-16">
          {breadcrumbItems.length > 0 && (
            <div className="mb-6">
              <AntBreadcrumb
                items={[
                  {
                    title: (
                      <Link to="/user/dashboard" className="px-1">
                        <Lucide.Home size={14} className="text-slate-500 hover:text-sky-600 transition-colors" />
                      </Link>
                    )
                  },
                  ...breadcrumbItems
                ]}
                className="text-sm font-medium"
              />
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

export default UserLayout;
