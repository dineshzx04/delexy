import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton, Layout as AntLayout } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const UserLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, switchWorkspace, currentUser, allUsers, logout, switchUser } = useWorkspace();
  const { customBreadcrumbs } = useBreadcrumbContext();

  const handleWorkspaceSwitch = (id: string) => {
    switchWorkspace(id);
    const ws = workspaces.find(w => w.id === id);
    if (ws?.type === 'platform') {
      navigate('/platform');
    } else {
      navigate('/');
    }
  };

  const breadcrumbItems = customBreadcrumbs || [];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <Lucide.User size={16} />,
      label: <Link to="/profile">Profile</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'switch-user-group',
      type: 'group',
      label: 'Switch Persona',
      children: allUsers.map((u) => ({
        key: `user-${u.id}`,
        label: (
          <div
            onClick={() => switchUser(u.id)}
            className={cn(
              "flex items-center justify-between text-xs py-1",
              u.id === currentUser?.id ? "font-bold text-sky-600" : "text-slate-700"
            )}
          >
            <span>{u.full_name}</span>
            {u.id === currentUser?.id && <Lucide.Check size={14} className="text-sky-600" />}
          </div>
        ),
      })),
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
    const baseSettings = {
      key: 'settings-group',
      type: 'group',
      label: collapsed ? null : 'Personal Settings',
      children: [
        {
          key: '/profile',
          icon: <Lucide.User size={18} />,
          label: <Link to="/profile">User Profile</Link>,
        },
      ],
    };

    if (activeWorkspace?.type === 'tenant') {
      return [
        {
          key: 'tenant-group',
          type: 'group',
          label: collapsed ? null : 'Organization Workspace',
          children: [
            {
              key: '/dashboard',
              icon: <Lucide.LayoutDashboard size={18} />,
              label: <Link to="/dashboard">Tenant Dashboard</Link>,
            },
            {
              key: '/rfqs',
              icon: <Lucide.FileText size={18} />,
              label: <Link to="/rfqs">RFQs & Procurement</Link>,
            },
            {
              key: '/products',
              icon: <Lucide.Package size={18} />,
              label: <Link to="/products">Products Catalog</Link>,
            },
            {
              key: '/orders',
              icon: <Lucide.ShoppingCart size={18} />,
              label: <Link to="/orders">Purchase Orders</Link>,
            },
            {
              key: '/user-management',
              icon: <Lucide.Users size={18} />,
              label: <Link to="/user-management">Team Members</Link>,
            },
          ],
        },
        baseSettings,
      ];
    }

    // Default / Individual Workspace
    return [
      {
        key: 'individual-group',
        type: 'group',
        label: collapsed ? null : 'Personal Workspace',
        children: [
          {
            key: '/dashboard',
            icon: <Lucide.LayoutDashboard size={18} />,
            label: <Link to="/dashboard">Dashboard</Link>,
          },
          {
            key: '/create-organization',
            icon: <Lucide.PlusCircle size={18} />,
            label: <Link to="/create-organization">Create Business</Link>,
          },
          {
            key: '/join-organization',
            icon: <Lucide.UserPlus size={18} />,
            label: <Link to="/join-organization">Join Business</Link>,
          },
        ],
      },
      baseSettings,
    ];
  };

  const workspaceMenuItems: MenuProps['items'] = workspaces.map((w) => ({
    key: w.id,
    label: (
      <div
        onClick={() => handleWorkspaceSwitch(w.id)}
        className="flex items-center justify-between gap-4 py-1 min-w-[200px]"
      >
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{w.name}</span>
          <span className="text-xs text-slate-500">Role: {w.role}</span>
        </div>
        {w.id === activeWorkspace.id && <Lucide.Check size={16} className="text-sky-600" />}
      </div>
    ),
  }));

  const userInitials = currentUser?.first_name && currentUser?.last_name
    ? `${currentUser.first_name[0]}${currentUser.last_name[0]}`
    : 'US';

  return (
    <div className="min-h-screen flex bg-gray-50 text-slate-900 antialiased">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              D
            </div>
            {!collapsed && <span className="font-bold text-xl text-slate-900 tracking-tight">Delexy</span>}
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          <AntMenu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems() as MenuProps['items']}
            className="border-none"
            inlineCollapsed={collapsed}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 right-0 z-20 transition-all duration-300 left-0" style={{ left: collapsed ? '4rem' : '16rem' }}>
          <div className="flex items-center gap-4">
            <AntButton
              type="text"
              icon={collapsed ? <Lucide.Menu size={20} /> : <Lucide.ChevronLeft size={20} />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg w-10 h-10 flex items-center justify-center"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace Switcher */}
            <AntDropdown menu={{ items: workspaceMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1.5 px-3 rounded-md transition-colors border border-gray-200 bg-white">
                <span className="font-semibold text-sm text-gray-800 hidden md:block">{activeWorkspace.name}</span>
                <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-medium border border-sky-100 hidden md:block">
                  {activeWorkspace.type.toUpperCase()}
                </span>
                <Lucide.ChevronDown size={14} className="text-gray-400" />
              </div>
            </AntDropdown>

            <AntButton type="text" icon={<Lucide.Bell size={16} />} className="text-lg flex items-center justify-center" />
            <AntDropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
                <AntAvatar style={{ backgroundColor: '#0284c7' }}>{userInitials}</AntAvatar>
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-gray-800">{currentUser?.full_name || 'User'}</span>
                  <span className="text-xs text-gray-500">{activeWorkspace.role}</span>
                </div>
              </div>
            </AntDropdown>
          </div>
        </header>

        {/* Scrollable Content - Native body scrolling */}
        <main className="flex-1 p-6 md:p-8 mt-12">
          {breadcrumbItems.length > 0 && (
            <div className="mb-6">
              <AntBreadcrumb
                items={[
                  {
                    title: <Link to="/" className="px-1">
                      <Lucide.Home size={14} className="h-full text-gray-500 hover:text-sky-600 transition-colors" />
                    </Link>
                  },
                  ...breadcrumbItems
                ]}
                separator={<span className="flex items-center text-gray-400 pt-[2px]">
                  <Lucide.ChevronRight size={14} />
                </span>}
                className={cn(
                  "hidden md:block px-3 py-1.5",
                  "text-sm font-medium",
                  "[&_ol]:flex [&_ol]:items-center",
                  "[&_li]:flex [&_li]:items-center",
                  "[&_.ant-breadcrumb-separator]:flex [&_.ant-breadcrumb-separator]:items-center [&_.ant-breadcrumb-separator]:mx-1",
                  "[&_.ant-breadcrumb-link]:flex",
                  "[&_a]:flex [&_a]:items-center"
                )}
              />
            </div>
          )}
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
