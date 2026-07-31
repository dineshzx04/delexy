import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessMembers: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();
  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Team Members</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const memberships = useLiveQuery(
    async () => await userDb.businessMemberships.where('business_id').equals(currentBizId).toArray(),
    [currentBizId]
  ) || [];

  const users = useLiveQuery(() => userDb.users.toArray()) || [];
  const roles = useLiveQuery(() => userDb.roles.toArray()) || [];

  const data = memberships.map((m) => {
    const usr = users.find((u) => u.id === m.user_id);
    const role = roles.find((r) => r.id === m.role_id);
    return {
      ...m,
      user_name: usr ? usr.full_name : m.user_id,
      role_name: role ? role.role_name : m.membership_type,
    };
  });

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-slate-500 font-medium">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      )
    },
    {
      title: 'Member Name',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string) => <span className="font-semibold text-slate-800">{text}</span>
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (id: string) => <span className="font-mono text-xs text-slate-500">{id}</span>
    },
    {
      title: 'Membership Type',
      dataIndex: 'membership_type',
      key: 'membership_type',
      render: (type: string) => (
        <Tag color={type === 'OWNER' ? 'purple' : 'blue'}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (role: string) => <span className="font-medium text-slate-700">{role}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'gold'}>
          {status}
        </Tag>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Team Members</h1>
          <p className="text-slate-500 text-sm">Manage users with access to this business workspace.</p>
        </div>
        <Button type="primary" icon={<Lucide.UserPlus size={16} />} className="bg-indigo-600 hover:bg-indigo-700">
          Invite Team Member
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true
          }}
          locale={{ emptyText: 'No team members found.' }}
        />
      </Card>
    </div>
  );
};

export default BusinessMembers;
