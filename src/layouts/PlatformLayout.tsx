import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton, Layout as AntLayout } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const PlatformLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, switchWorkspace, currentUser, allUsers, logout, switchUser } = useWorkspace();
  const { customBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWorkspaceSwitch = (id: string) => {
    const ws = switchWorkspace(id);
    if (ws?.type === 'PLATFORM') {
      navigate('/p/dashboard');
    } else if (ws?.type === 'BUSINESS') {
      navigate('/b/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/p/dashboard');
  };

  const breadcrumbItems = customBreadcrumbs || [];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <Lucide.User size={16} />,
      label: <Link to="/p/profile">Profile</Link>,
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

  const getMenuItems = () => [
    {
      key: "/p/dashboard",
      icon: <Lucide.LayoutDashboard size={16} />,
      label: <Link to="/p/dashboard">Dashboard</Link>,
    },

    // Organization Management
    {
      key: "organization-module",
      type: "group",
      label: collapsed ? null : "Organization",
      children: [
        {
          key: "/p/parties",
          icon: <Lucide.Building2 size={16} />,
          label: <Link to="/p/parties">Parties & Claims</Link>,
        },
        {
          key: "/p/businesses",
          icon: <Lucide.Building size={16} />,
          label: <Link to="/p/businesses">Businesses</Link>,
        },
        {
          key: "/p/business-reviews",
          icon: <Lucide.FileCheck size={16} />,
          label: <Link to="/p/business-reviews">Business Reviews & Audit</Link>,
        },
        {
          key: "/p/user-registry",
          icon: <Lucide.UserCheck size={16} />,
          label: <Link to="/p/user-registry">All Users Registry</Link>,
        },
      ],
    },

    // Product Catalog
    {
      key: "catalog-module",
      type: "group",
      label: collapsed ? null : "Catalog",
      children: [
        {
          key: "/p/categories",
          icon: <Lucide.FolderTree size={16} />,
          label: <Link to="/p/categories">Categories</Link>,
        },
        {
          key: "/p/brands",
          icon: <Lucide.Award size={16} />,
          label: <Link to="/p/brands">Brands & Claims Audit</Link>,
        },
        {
          key: "/p/manufacturers",
          icon: <Lucide.Factory size={16} />,
          label: <Link to="/p/manufacturers">Manufacturers</Link>,
        },
        {
          key: "/p/products",
          icon: <Lucide.Box size={16} />,
          label: <Link to="/p/products">Master Products</Link>,
        },
        {
          key: "/p/seller-products",
          icon: <Lucide.Package size={16} />,
          label: <Link to="/p/seller-products">Seller Products</Link>,
        },
        {
          key: "/p/seller-product-reviews",
          icon: <Lucide.ShieldCheck size={16} />,
          label: <Link to="/p/seller-product-reviews">Seller Product Reviews</Link>,
        },
      ],
    },

    // Product Attributes
    {
      key: "attributes-module",
      type: "group",
      label: collapsed ? null : "Attributes",
      children: [
        {
          key: "/p/attribute-groups",
          icon: <Lucide.Layers3 size={16} />,
          label: <Link to="/p/attribute-groups">Attribute Groups</Link>,
        },
        {
          key: "/p/attributes",
          icon: <Lucide.ListTree size={16} />,
          label: <Link to="/p/attributes">Attributes</Link>,
        },
        {
          key: "/p/attribute-values",
          icon: <Lucide.Tag size={16} />,
          label: <Link to="/p/attribute-values">Attribute Values</Link>,
        },
        {
          key: "/p/attribute-mapping",
          icon: <Lucide.GitMerge size={16} />,
          label: <Link to="/p/attribute-mapping">Attribute Mapping</Link>,
        },
      ],
    },

    // Administration
    {
      key: "administration-module",
      type: "group",
      label: collapsed ? null : "Administration",
      children: [
        {
          key: "/p/profile",
          icon: <Lucide.User size={16} />,
          label: <Link to="/p/profile">Profile</Link>,
        },
        {
          key: "/p/users",
          icon: <Lucide.Users size={16} />,
          label: <Link to="/p/users">Platform Users</Link>,
        },
        {
          key: "/p/platform-roles",
          icon: <Lucide.KeyRound size={16} />,
          label: <Link to="/p/platform-roles">Platform Roles</Link>,
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
    <div className="min-h-screen flex bg-gray-50 text-gray-900 antialiased">
      {/* Mobile Overlay Backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300",
          isMobile
            ? (mobileOpen ? "w-72 translate-x-0 shadow-2xl" : "w-72 -translate-x-full")
            : (collapsed ? "w-16" : "w-72")
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
          <Link to="/platform" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
              <Lucide.ShieldCheck size={20} />
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white tracking-tight leading-none">Delexy</span>
                <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Platform Admin</span>
              </div>
            )}
          </Link>
          {isMobile && (
            <AntButton type="text" icon={<Lucide.X size={18} className="text-slate-400" />} onClick={() => setMobileOpen(false)} />
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          <AntMenu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            items={getMenuItems() as MenuProps['items']}
            className="border-none bg-transparent w-auto"
            inlineCollapsed={!isMobile && collapsed}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0",
        isMobile ? "ml-0" : (collapsed ? "ml-16" : "ml-72")
      )}>
        {/* Top Navbar */}
        <header
          className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 fixed top-0 right-0 z-20 transition-all duration-300 left-0"
          style={{ left: isMobile ? '0px' : (collapsed ? '4rem' : '18rem') }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <AntButton
              type="text"
              icon={isMobile ? <Lucide.Menu size={20} /> : (collapsed ? <Lucide.PanelLeftOpen size={16} /> : <Lucide.PanelLeftClose size={16} />)}
              onClick={() => {
                if (isMobile) {
                  setMobileOpen(!mobileOpen);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="text-lg w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace Switcher */}
            <AntDropdown menu={{ items: workspaceMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 py-1.5 px-3 rounded-md transition-colors border border-gray-200 bg-white">
                <div className="hidden md:flex flex-col leading-tight text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-gray-800">{activeWorkspace.name}</span>
                    <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded font-medium border border-sky-100 uppercase">
                      {activeWorkspace.type}
                    </span>
                  </div>
                  {activeWorkspace.email && (
                    <span className="text-[11px] text-gray-500 font-normal flex items-center gap-1">
                      <Lucide.Mail size={11} className="text-sky-600" />
                      {activeWorkspace.email}
                    </span>
                  )}
                </div>
                <Lucide.ChevronDown size={14} className="text-gray-400" />
              </div>
            </AntDropdown>

            <AntButton type="text" icon={<Lucide.Bell size={16} />} className="text-lg flex items-center justify-center" />
            <AntDropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
                <AntAvatar style={{ backgroundColor: '#0284c7' }}>{userInitials}</AntAvatar>
                <div className="hidden md:flex flex-col leading-tight text-left">
                  <span className="text-sm font-semibold text-gray-800">{currentUser?.full_name || 'User'}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Lucide.Mail size={11} className="text-gray-400" />
                    {activeWorkspace.email}
                  </span>
                </div>
              </div>
            </AntDropdown>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 mt-16 min-w-0 w-full">
          <div className="mb-3">
            <AntButton
              type="default"
              icon={<Lucide.ArrowLeft size={16} />}
              onClick={handleGoBack}
              className="h-9 px-3 rounded-md border-gray-300 text-gray-700 font-medium hover:border-gray-400 hover:text-gray-900"
            >
              Back to Previous Page
            </AntButton>
          </div>
          {breadcrumbItems.length > 0 && (
            <div className="mb-6">
              <AntBreadcrumb
                items={[
                  {
                    title: <Link to="/platform" className="px-1">
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
          <div className="max-w-7xl w-full mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
