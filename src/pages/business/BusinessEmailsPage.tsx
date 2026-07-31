import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Tag, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessEmailsPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id;

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Business Emails</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const businessEmails = useLiveQuery(
    async () => await userDb.businessEmails.where('business_id').equals(currentBizId).toArray(),
    [currentBizId]
  ) || [];

  const emails = useLiveQuery(() => userDb.emails.toArray()) || [];

  const data = businessEmails.map((be) => {
    const em = emails.find((e) => e.id === be.email_id);
    return {
      ...be,
      email: em ? em.email : be.email_id,
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
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <span className="font-semibold text-slate-800">{email}</span>
    },
    {
      title: 'Label / Department',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: 'Type',
      dataIndex: 'email_type',
      key: 'email_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Verified',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (verified: boolean) => (
        <Tag color={verified ? 'green' : 'gold'}>
          {verified ? 'VERIFIED' : 'PENDING'}
        </Tag>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Emails</h1>
          <p className="text-slate-500 text-sm">Official contact and department email addresses.</p>
        </div>
        <Button type="primary" icon={<Lucide.MailPlus size={16} />} className="bg-indigo-600 hover:bg-indigo-700">
          Add Business Email
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
          locale={{ emptyText: 'No business emails listed.' }}
        />
      </Card>
    </div>
  );
};

export default BusinessEmailsPage;
