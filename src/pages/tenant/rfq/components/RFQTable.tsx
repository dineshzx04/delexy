import React from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Card as AntCard } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { RFQ } from '../../../../data/mockRFQs';

interface RFQTableProps {
  rfqs: RFQ[];
  isOutbound: boolean;
}

const RFQTable: React.FC<RFQTableProps> = ({ rfqs, isOutbound }) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'RFQ ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-sm font-semibold">{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'Open') color = 'blue';
        if (status === 'Responded') color = 'orange';
        if (status === 'Closed') color = 'green';
        if (status === 'Cancelled') color = 'red';
        return <AntTag color={color}>{status}</AntTag>;
      }
    },
    {
      title: 'Items',
      key: 'items',
      render: (_: any, record: RFQ) => (
        <span className="font-semibold text-gray-700">{record.items?.length || 0} Items</span>
      )
    },
    {
      title: isOutbound ? 'Details' : 'Requester',
      key: 'entity',
      render: (_: any, record: RFQ) => (
        <span className="text-gray-700">
          {isOutbound ? 'Multiple Line Items' : record.requesterTenantName}
        </span>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: RFQ) => (
        <AntButton type="primary" size="small" onClick={() => navigate(`/rfqs/${record.id}`)}>
          View
        </AntButton>
      )
    }
  ];

  return (
    <AntCard className="shadow-sm border-gray-200">
      <AntTable
        columns={columns}
        dataSource={rfqs}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </AntCard>
  );
};

export default RFQTable;
