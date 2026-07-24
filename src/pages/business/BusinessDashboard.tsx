import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessDashboard: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();

  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id;

  const business = useLiveQuery(
    async () => await db.businesses.get(currentBizId),
    [currentBizId]
  );

  const memberships = useLiveQuery(
    async () => await db.businessMemberships.where('business_id').equals(currentBizId).toArray(),
    [currentBizId]
  ) || [];

  const businessEmails = useLiveQuery(
    async () => await db.businessEmails.where('business_id').equals(currentBizId).toArray(),
    [currentBizId]
  ) || [];

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">{business?.name || 'Business Dashboard'}</span> }
  ], [business?.name]);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md border border-indigo-900/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider bg-indigo-500/20 text-indigo-300 font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
                Business Tenant Context
              </span>
              <Tag color="green">{business?.is_claimed ? 'CLAIMED' : 'UNCLAIMED'}</Tag>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-2 text-white">
              {business?.name || activeWorkspace.name}
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              Legal Name: {business?.legal_name || 'N/A'} • Role: <span className="font-semibold text-white">{activeWorkspace.role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/business/${currentBizId}/members`}>
              <Button size="large" type="primary" icon={<Lucide.UserPlus size={18} />} className="bg-indigo-600 hover:bg-indigo-500 border-none font-semibold shadow-sm">
                Manage Team
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Active Members</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{memberships.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Lucide.Users size={24} />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Contact Emails</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{businessEmails.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
              <Lucide.Mail size={24} />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Country Code</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{business?.country_code || 'US'}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Lucide.Globe size={24} />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Workspace Status</p>
              <Tag color={business?.is_active ? 'green' : 'red'} className="mt-1 font-semibold text-sm">
                {business?.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Tag>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Lucide.ShieldCheck size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Overview Details */}
      <Card title={<span className="flex items-center gap-2 font-semibold text-slate-800"><Lucide.Building size={18} /> Business Profile Overview</span>} className="shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-slate-400 block text-xs">Business ID</span>
            <span className="font-mono font-medium text-slate-800">{business?.id || currentBizId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Website</span>
            <a href={business?.website} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">
              {business?.website || 'N/A'}
            </a>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Phone</span>
            <span className="font-medium text-slate-800">{business?.phone || 'N/A'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BusinessDashboard;
