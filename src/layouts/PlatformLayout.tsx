import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton, Layout as AntLayout } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const userMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    icon: <Lucide.User size={16} />,
    label: <Link to="/profile">Profile</Link>,
  },
  {
    key: 'account',
    icon: <Lucide.Settings size={16} />,
    label: <Link to="/settings/account">Account Settings</Link>,
  },
  {
    key: 'security',
    icon: <Lucide.ShieldCheck size={16} />,
    label: <Link to="/settings/security">Security</Link>,
  },
  {
    key: 'sessions',
    icon: <Lucide.Monitor size={16} />,
    label: <Link to="/settings/sessions">Active Sessions</Link>,
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    icon: <Lucide.LogOut size={16} className="text-red-500" />,
    label: <span className="text-red-500">Log out</span>,
  },
];

const PlatformLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, switchWorkspace } = useWorkspace();
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

  const pathParts = location.pathname.split('/').filter(p => p);
  const breadcrumbItems = customBreadcrumbs || [];

  const selectedKey = pathParts[pathParts.length - 1] || 'profile';
  console.log(selectedKey)
  const workspaceMenuItems = workspaces.map((ws) => ({
    key: ws.id,
    label: (
      <div
        className="flex items-center justify-between w-full min-w-[200px] py-1"
        onClick={() => handleWorkspaceSwitch(ws.id)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            {ws.type === 'tenant' ? <Lucide.Building2 size={16} /> : ws.type === 'platform' ? <Lucide.Globe size={16} /> : <Lucide.User size={16} />}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 leading-tight">{ws.name}</span>
            <span className="text-xs text-gray-500">{ws.role}</span>
          </div>
        </div>
        {activeWorkspace.id === ws.id && <Lucide.Check size={16} className="text-sky-600" />}
      </div>
    )
  }));

  const getMenuItems = () => {
    const baseSettings = {
      key: 'settings-group',
      type: 'group',
      label: collapsed ? null : 'Personal Settings',
      children: [
        { key: 'profile', icon: <Lucide.User size={16} />, label: <Link to="/profile">Profile</Link> },
        { key: 'account', icon: <Lucide.Settings size={16} />, label: <Link to="/settings/account">Account</Link> },
        { key: 'security', icon: <Lucide.ShieldCheck size={16} />, label: <Link to="/settings/security">Security</Link> },
        { key: 'sessions', icon: <Lucide.Monitor size={16} />, label: <Link to="/settings/sessions">Sessions</Link> },
      ]
    };
    return [
      { key: 'dashboard', icon: <Lucide.Globe size={16} />, label: <Link to="/dashboard">Global Overview</Link> },
      { key: 'attribute-values', icon: <Lucide.Tags size={16} />, label: <Link to="/platform/attribute-values">Attribute Values</Link> },
      { key: 'attributes', icon: <Lucide.List size={16} />, label: <Link to="/platform/attributes">Attributes</Link> },
      { key: 'groups', icon: <Lucide.Layers size={16} />, label: <Link to="/platform/groups">Groups</Link> },
      { key: 'category', icon: <Lucide.FolderTree size={16} />, label: <Link to="/platform/category">Category</Link> },
      { key: 'platform-products', icon: <Lucide.Package size={16} />, label: <Link to="/platform/platform-products">Platform Products</Link> },
      { type: 'divider' },
      baseSettings
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed */}
      <AntLayout.Sider
        theme="light"
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        collapsedWidth={80}
        className="fixed inset-y-0 left-0 z-20 border-r border-gray-200 shadow-sm"
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
          <Link to="/" className="flex items-center gap-2 text-slate-800">
            <Lucide.Hexagon size={28} className="text-sky-600" />
            {!collapsed && <span className="text-xl font-bold tracking-tight">Delexy</span>}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <AntMenu
            mode="inline"
            selectedKeys={[selectedKey]}
            className="border-r-0"
            items={getMenuItems() as any}
          />
        </div>
      </AntLayout.Sider>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-[80px]' : 'ml-[250px]'}`}>
        {/* Header - Fixed */}
        <header className={`fixed top-0 right-0 z-10 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between transition-all duration-300 ${collapsed ? 'left-[80px]' : 'left-[250px]'}`}>
          <div className="flex items-center gap-4">
            <AntButton
              type="text"
              icon={collapsed ? <Lucide.PanelLeftOpen size={16} /> : <Lucide.PanelLeftClose size={16} />}
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
                <AntAvatar style={{ backgroundColor: '#0284c7' }}>JD</AntAvatar>
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-gray-800">John Doe</span>
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

export default PlatformLayout;
