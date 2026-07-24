import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const Dashboard: React.FC = () => {
  const { currentUser, workspaces } = useWorkspace();

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">User Dashboard</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider bg-white/20 text-white font-semibold px-3 py-1 rounded-full">
              Personal Account Context
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">
              Welcome, {currentUser?.full_name || 'User'}!
            </h1>
            <p className="text-sky-100 text-sm mt-1">
              Manage your personal identity, addresses, KYC verification, and linked business workspaces.
            </p>
          </div>
          <Link to="/user/create-business">
            <Button size="large" type="primary" icon={<Lucide.PlusCircle size={18} />} className="bg-white text-sky-700 hover:bg-sky-50 border-none font-semibold shadow-sm">
              Create New Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/user/profile" className="block group">
          <Card className="hover:border-sky-300 transition-all shadow-sm group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-sky-100 text-sky-600">
                <Lucide.User size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base group-hover:text-sky-600 transition-colors">User Profile</h3>
                <p className="text-xs text-slate-500">Personal & Contact Info</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/user/addresses" className="block group">
          <Card className="hover:border-sky-300 transition-all shadow-sm group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <Lucide.MapPin size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base group-hover:text-emerald-600 transition-colors">My Addresses</h3>
                <p className="text-xs text-slate-500">Shipping & Billing Locations</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/user/identifications" className="block group">
          <Card className="hover:border-sky-300 transition-all shadow-sm group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <Lucide.ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base group-hover:text-purple-600 transition-colors">Identity & KYC</h3>
                <p className="text-xs text-slate-500">Passports & National IDs</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/user/create-business" className="block group">
          <Card className="hover:border-sky-300 transition-all shadow-sm group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                <Lucide.Building2 size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">Business Workspaces</h3>
                <p className="text-xs text-slate-500">{workspaces.filter(w => w.type === 'tenant').length} Workspaces Linked</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* User Information Card */}
      <Card title={<span className="flex items-center gap-2 font-semibold text-slate-800"><Lucide.Info size={18} /> Profile & Account Overview</span>} className="shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-400 block text-xs">App User ID</span>
            <span className="font-medium text-slate-800">{currentUser?.app_user_id || currentUser?.id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Full Name</span>
            <span className="font-medium text-slate-800">{currentUser?.full_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Country of Residence</span>
            <span className="font-medium text-slate-800">{currentUser?.country_of_residence || 'United States'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Account Status</span>
            <Tag color={currentUser?.is_active ? "green" : "red"}>
              {currentUser?.is_active ? "ACTIVE" : "INACTIVE"}
            </Tag>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Date of Birth</span>
            <span className="font-medium text-slate-800">{currentUser?.date_of_birth || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Place of Birth</span>
            <span className="font-medium text-slate-800">{currentUser?.place_of_birth || 'N/A'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
