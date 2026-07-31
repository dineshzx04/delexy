import React, { useState } from 'react';
import { Card, Table, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { businessDb } from '../../data/business';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const UserAddresses: React.FC = () => {
  const { currentUserId } = useWorkspace();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">My Addresses</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // 1. Resolve User's Personal Party
  const userParty = useLiveQuery(
    async () => await businessDb.parties
      .where('owner_id').equals(currentUserId)
      .filter((p) => p.owner_type === 'USER')
      .first(),
    [currentUserId]
  );

  // 2. Query Personal Addresses attached directly to party_id
  const addresses = useLiveQuery(
    async () => {
      if (!userParty) return [];
      return await userDb.addresses
        .where('party_id').equals(userParty.id)
        .toArray();
    },
    [userParty]
  ) || [];

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
      title: 'Party ID',
      dataIndex: 'party_id',
      key: 'party_id',
      render: (partyId: string) => <Tag color="geekblue" className="font-mono">{partyId}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'address_type',
      key: 'address_type',
      render: (type?: string) => <Tag color="purple">{type || 'RESIDENTIAL'}</Tag>
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
          <p className="text-slate-500 text-sm">
            Personal physical locations attached to your Personal Trading Party 
            {userParty && <Tag color="purple" className="ml-2 font-mono">{userParty.id}</Tag>}.
          </p>
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
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true
          }}
          locale={{ emptyText: 'No personal address records found for this user party.' }}
        />
      </Card>
    </div>
  );
};

export default UserAddresses;
