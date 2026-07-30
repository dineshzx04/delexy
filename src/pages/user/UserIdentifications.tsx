import React from 'react';
import { Card, Table, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const UserIdentifications: React.FC = () => {
  const { currentUserId } = useWorkspace();

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Identity Verification (KYC)</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const identifications = useLiveQuery(
    async () => await userDb.userIdentifications.where('user_id').equals(currentUserId).toArray(),
    [currentUserId]
  ) || [];

  const columns = [
    {
      title: 'ID Type',
      dataIndex: 'id_type',
      key: 'id_type',
      render: (type: string) => <Tag color="purple">{type}</Tag>
    },
    {
      title: 'ID Number',
      dataIndex: 'id_number',
      key: 'id_number',
      render: (num: string) => <span className="font-mono font-medium text-slate-800">{num}</span>
    },
    {
      title: 'Issuing Country',
      dataIndex: 'issuing_country',
      key: 'issuing_country',
    },
    {
      title: 'Verification Status',
      dataIndex: 'verification_status',
      key: 'verification_status',
      render: (status: string) => (
        <Tag color={status === 'VERIFIED' ? 'green' : 'gold'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (exp?: string) => exp || 'N/A'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Identity Verification (KYC)</h1>
          <p className="text-slate-500 text-sm">Passports, National IDs, and compliance documents.</p>
        </div>
        <Button type="primary" icon={<Lucide.ShieldCheck size={16} />} className="bg-sky-600 hover:bg-sky-700">
          Upload Identity Document
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table
          dataSource={identifications}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No identity documents found for this user.' }}
        />
      </Card>
    </div>
  );
};

export default UserIdentifications;
