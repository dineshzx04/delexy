import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Menu as AntMenu, Dropdown as AntDropdown, Avatar as AntAvatar, Breadcrumb as AntBreadcrumb, Button as AntButton, Modal as AntModal, Input as AntInput, Tag as AntTag, App as AntApp } from 'antd';
import type { MenuProps } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace, type DynamicWorkspace } from '../contexts/WorkspaceContext';
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext';
import { cn } from '../lib/utils';

const UserLayout: React.FC = () => {
    const { message: antMessage } = AntApp.useApp();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { activeWorkspace, workspaces, switchWorkspace, validateSwitchPassword, currentUser, logout, currentCredential } = useWorkspace();
    const { customBreadcrumbs } = useBreadcrumbContext();

    const [pendingWorkspace, setPendingWorkspace] = useState<DynamicWorkspace | null>(null);
    const [switchPassInput, setSwitchPassInput] = useState('123456');
    const [switchPassModalOpen, setSwitchPassModalOpen] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

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

    // Route Guard: BUSINESS credential users do not have permission/rights to access user routes
    if (currentCredential?.credential_type === 'BUSINESS') {
        return <Navigate to="/b/dashboard" replace />;
    }

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
            if (ws.type === 'PLATFORM') {
                navigate('/p/dashboard');
            } else if (ws.type === 'BUSINESS') {
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
            if (ws?.type === 'PLATFORM') {
                navigate('/p/dashboard');
            } else if (ws?.type === 'BUSINESS') {
                navigate('/b/dashboard');
            } else {
                navigate('/user/dashboard');
            }
        } else {
            antMessage.error('Invalid secondary switch password.');
        }
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate('/user/dashboard');
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
                    {
                        key: '/user/brands',
                        icon: <Lucide.ShoppingBag size={18} />,
                        label: <Link to="/user/brands">Brands & Manufacturers I Sell</Link>,
                    },
                    {
                        key: '/user/seller-products',
                        icon: <Lucide.Package size={18} />,
                        label: <Link to="/user/seller-products">My Products</Link>,
                    },
                ],
            },
            {
                key: 'user-sourcing-group',
                type: 'group',
                label: collapsed ? null : 'Enterprise Sourcing (RFQs)',
                children: [
                    {
                        key: '/user/rfqs/dashboard',
                        icon: <Lucide.BarChart3 size={18} />,
                        label: <Link to="/user/rfqs/dashboard">Sourcing Dashboard</Link>,
                    },
                    {
                        key: '/user/rfqs',
                        icon: <Lucide.FileText size={18} />,
                        label: <Link to="/user/rfqs">My RFQs</Link>,
                    },
                    {
                        key: '/user/supplier/rfqs',
                        icon: <Lucide.Inbox size={18} />,
                        label: <Link to="/user/supplier/rfqs">Supplier Opportunities</Link>,
                    },
                ],
            },
            {
                key: 'business-action-group',
                type: 'group',
                label: collapsed ? null : 'Business Actions',
                children: [
                    {
                        key: '/user/business-submissions',
                        icon: <Lucide.FileCheck size={18} />,
                        label: <Link to="/user/business-submissions">Business Applications</Link>,
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
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 text-sm">{w.name}</span>
                        {w.requireSwitchPassword && (
                            <AntTag color="orange" className="text-[10px] m-0 font-medium px-1 py-0">Lock</AntTag>
                        )}
                    </div>
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
            {/* Mobile Drawer Overlay Backdrop */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-30 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300",
                    isMobile
                        ? (mobileOpen ? "w-72 translate-x-0 shadow-2xl" : "w-72 -translate-x-full")
                        : (collapsed ? "w-16" : "w-72")
                )}
            >
                {/* Brand */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                    <Link to="/user/dashboard" className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
                            D
                        </div>
                        {(!collapsed || isMobile) && (
                            <div className="flex flex-col leading-none">
                                <span className="font-bold text-lg text-slate-900 tracking-tight">Delexy</span>
                                <span className="text-[10px] text-sky-600 font-semibold tracking-wider uppercase">User Portal</span>
                            </div>
                        )}
                    </Link>
                    {isMobile && (
                        <AntButton type="text" icon={<Lucide.X size={18} />} onClick={() => setMobileOpen(false)} />
                    )}
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                    <AntMenu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={getMenuItems() as MenuProps['items']}
                        className="border-none text-slate-700 w-auto"
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
                    className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 fixed top-0 right-0 z-20 transition-all duration-300 left-0"
                    style={{ left: isMobile ? '0px' : (collapsed ? '4rem' : '18rem') }}
                >
                    <div className="flex items-center gap-2 sm:gap-4">
                        <AntButton
                            type="text"
                            icon={isMobile ? <Lucide.Menu size={20} /> : (collapsed ? <Lucide.Menu size={20} /> : <Lucide.ChevronLeft size={20} />)}
                            onClick={() => {
                                if (isMobile) {
                                    setMobileOpen(!mobileOpen);
                                } else {
                                    setCollapsed(!collapsed);
                                }
                            }}
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
                            Switching workspace to <span className="font-bold text-sky-700">{pendingWorkspace?.name}</span> requires secondary switch password verification:
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

                {/* Main Body */}
                <main className="flex-1 p-4 sm:p-6 md:p-8 mt-16 min-w-0 w-full">
                    <div className="mb-3">
                        <AntButton
                            type="default"
                            icon={<Lucide.ArrowLeft size={16} />}
                            onClick={handleGoBack}
                            className="h-9 px-3 rounded-md border-slate-300 text-slate-700 font-medium hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to Previous Page
                        </AntButton>
                    </div>
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
                    <div className="max-w-7xl w-full mx-auto min-w-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
