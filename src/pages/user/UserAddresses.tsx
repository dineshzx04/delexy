import React from 'react';
import { Card, Table, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const UserAddresses: React.FC = () => {
  const { currentUserId } = useWorkspace();

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">My Addresses</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const addresses = useLiveQuery(
    async () => await userDb.addresses
      .where('owner_id').equals(currentUserId)
      .filter((a) => a.owner_type === 'USER')
      .toArray(),
    [currentUserId]
  ) || [];

  const columns = [
    {
      title: 'Type',
      dataIndex: 'address_type',
      key: 'address_type',
      render: (type?: string) => <Tag color="purple">{type || 'HOME'}</Tag>
    },
    {
      title: 'Address Line 1',
      dataIndex: 'line1',
      key: 'line1',
      render: (text: string) => <span className="font-medium text-slate-800">{text}</span>
    },
    {
      title: 'Line 2',
      dataIndex: 'line2',
      key: 'line2',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'State / Province',
      dataIndex: 'state_province',
      key: 'state_province',
    },
    {
      title: 'Postal Code',
      dataIndex: 'postal_code',
      key: 'postal_code',
    },
    {
      title: 'Country',
      dataIndex: 'country_code',
      key: 'country_code',
      render: (code: string, record: any) => (
        <span className="flex items-center gap-1.5 font-medium">
          <Tag color="blue">{code}</Tag>
          {record.country_name && <span className="text-slate-600 text-xs">{record.country_name}</span>}
        </span>
      )
    },
    {
      title: 'Primary',
      dataIndex: 'is_primary',
      key: 'is_primary',
      render: (isPrimary: boolean) => isPrimary ? <Tag color="green">Primary</Tag> : <Tag color="default">Secondary</Tag>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Addresses</h1>
          <p className="text-slate-500 text-sm">Manage personal shipping and billing address records.</p>
        </div>
        <Button type="primary" icon={<Lucide.Plus size={16} />} className="bg-sky-600 hover:bg-sky-700">
          Add New Address
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table
          dataSource={addresses}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No address records found for this user.' }}
        />
      </Card>
    </div>
  );
};

export default UserAddresses;
