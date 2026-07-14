import { useState } from 'react';
import { Menu, Dropdown, Avatar, Badge } from 'antd';
import {
  Building2, User, ChevronDown, Bell, Search, Menu as MenuIcon
} from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getMenuItemsByContext, type ActorContext } from '../routes/sitemap';
import { useWorkspace } from '../contexts/WorkspaceContext';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentWorkspace, availableWorkspaces, switchWorkspace } = useWorkspace();
  const location = useLocation();

  const currentContext: ActorContext = currentWorkspace.context;
  const filteredMenuItems = getMenuItemsByContext(currentContext);

  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  const getActiveKey = (pathname: string, items: any[]): string => {
    const keys: string[] = [];
    const extractKeys = (menuItems: any[]) => {
      menuItems.forEach(item => {
        if (item.key && item.type !== 'divider') keys.push(item.key);
        if (item.children) extractKeys(item.children);
      });
    };
    extractKeys(items);

    let bestMatch = '';
    for (const key of keys) {
      if (pathname.startsWith(key) && key.length > bestMatch.length) {
        bestMatch = key;
      }
    }
    return bestMatch || pathname;
  };

  const activeKey = getActiveKey(location.pathname, filteredMenuItems);

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <aside
        className="border-r border-gray-100 bg-white transition-all duration-200 overflow-auto fixed left-0 top-0 bottom-0 z-20"
        style={{ width: collapsed ? 80 : 260 }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-white transition-colors">
          <span className="text-xl font-bold text-primary-600 tracking-tight truncate px-4">
            {collapsed ? 'EM' : 'EngMarket Hub'}
          </span>
        </div>

        <div className="p-4 border-b border-gray-100 bg-white">
          <Dropdown menu={{
            items: availableWorkspaces.map(ws => ({
              key: ws.id,
              label: `${ws.name} (${ws.type === 'org' ? 'Organization' : 'Personal'})`,
              icon: ws.type === 'org' ? <Building2 size={14} /> : <User size={14} />,
              onClick: () => switchWorkspace(ws.id)
            }))
          }} trigger={['click']}>
            <div className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''}`}>
              {!collapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-600">
                    {currentWorkspace.type === 'org' ? <Building2 size={16} /> : <User size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 leading-tight">
                      {currentWorkspace.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {currentWorkspace.type === 'org' ? 'Organization Account' : 'Personal Account'}
                    </span>
                  </div>
                </div>
              )}
              {collapsed && (
                <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-600">
                  {currentWorkspace.type === 'org' ? <Building2 size={16} /> : <User size={16} />}
                </div>
              )}
              {!collapsed && <ChevronDown size={16} className="text-gray-400" />}
            </div>
          </Dropdown>
        </div>

        <Menu
          theme="light"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[activeKey]}
          items={filteredMenuItems as any} // Cast needed for Antd strict typing
          className="mt-4 border-none bg-white font-medium [&_.ant-menu-item]:text-gray-500 [&_.ant-menu-submenu-title]:text-gray-500 [&_.ant-menu-item-selected]:text-primary-600"
        />
      </aside>
      <div style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }} className="flex flex-col min-h-screen">
        <header
          className="bg-white px-6 h-16 flex items-center justify-between border-b border-gray-200 z-10"
          style={{ position: 'fixed', top: 0, right: 0, width: `calc(100% - ${collapsed ? 80 : 260}px)`, transition: 'all 0.2s' }}
        >
          <div className="flex items-center gap-4">
            <MenuIcon
              className="w-5 h-5 text-gray-500 cursor-pointer hover:text-primary-600"
              onClick={() => setCollapsed(!collapsed)}
            />
            <h1 className="text-lg font-semibold text-gray-800 m-0 ml-2">
              {isDashboardRoute ? 'Dashboard' : 'Marketplace'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <Search className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary-600" />
            <Badge dot>
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary-600" />
            </Badge>
            <div className="h-6 w-px bg-gray-200"></div>
            <Avatar className="bg-primary-500" icon={<User size={16} />} />
          </div>
        </header>
        <main className="p-6 bg-[#fafafb] flex-1" style={{ marginTop: 64 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
