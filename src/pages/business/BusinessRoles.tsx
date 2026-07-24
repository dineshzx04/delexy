import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessRoles: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();
  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id;

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Business Roles</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const roles = useLiveQuery(
    async () => await db.userBusinessRoles.where('business_id').equals(currentBizId).toArray(),
    [currentBizId]
  ) || [];

  const columns = [
    {
      title: 'Role ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-mono text-xs text-slate-500">{id}</span>
    },
    {
      title: 'Role Name',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (name: string) => <span className="font-semibold text-slate-800">{name}</span>
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Roles & Permissions</h1>
          <p className="text-slate-500 text-sm">Define custom roles assigned to team members.</p>
        </div>
        <Button type="primary" icon={<Lucide.Plus size={16} />} className="bg-indigo-600 hover:bg-indigo-700">
          Create New Role
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No custom roles defined for this business.' }}
        />
      </Card>
    </div>
  );
};

export default BusinessRoles;
