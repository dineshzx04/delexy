import { useState } from 'react';
import { Menu, Avatar, Dropdown } from 'antd';
import { ChevronDown, LogOut, Menu as MenuIcon } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { getMenuItemsByContext } from '../routes/sitemap';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const adminMenuItems = getMenuItemsByContext('platform_admin');

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

  const activeKey = getActiveKey(location.pathname, adminMenuItems);

  return (
    <div className="min-h-screen bg-gray-50">
      <aside 
        className="fixed left-0 top-0 bottom-0 z-20 bg-[#001529] transition-all duration-200 overflow-y-auto"
        style={{ width: collapsed ? 80 : 260 }}
      >
        <div className="h-16 flex items-center justify-center bg-gray-900 border-b border-gray-800">
          <span className="text-xl font-bold text-white tracking-tight">
            {collapsed ? 'EA' : 'EngMarket Admin'}
          </span>
        </div>
        
        <Menu 
          theme="dark"
          mode="inline" 
          inlineCollapsed={collapsed}
          selectedKeys={[activeKey]} 
          items={adminMenuItems as any} // Cast needed for Antd strict typing
          className="mt-4"
        />
      </aside>
      <div className="flex-1 flex flex-col transition-all duration-200 min-h-screen" style={{ marginLeft: collapsed ? 80 : 260 }}>
        <header 
          className="bg-white px-6 h-16 flex items-center justify-between border-b border-gray-200 fixed top-0 right-0 z-10 transition-all duration-200 shadow-sm" 
          style={{ width: `calc(100% - ${collapsed ? 80 : 260}px)` }}
        >
          <div className="flex items-center gap-4">
            <MenuIcon 
              className="w-5 h-5 text-gray-500 cursor-pointer hover:text-primary-600" 
              onClick={() => setCollapsed(!collapsed)} 
            />
          </div>
          <div className="flex items-center gap-4">
            <Dropdown menu={{
              items: [
                { key: '1', label: 'Admin Settings' },
                { type: 'divider' },
                { key: '2', icon: <LogOut size={16} />, label: 'Sign Out' },
              ]
            }} trigger={['click']}>
              <div className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-primary-600 transition-colors">
                <Avatar className="bg-gray-800 text-white font-semibold">SA</Avatar>
                <div className="flex flex-col text-sm leading-tight">
                  <span className="font-semibold">Super Admin</span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </Dropdown>
          </div>
        </header>
        <main className="p-8 bg-gray-50 flex-1" style={{ marginTop: 64 }}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[80vh] p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
