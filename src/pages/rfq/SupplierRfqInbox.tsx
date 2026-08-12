import React, { useState } from 'react';
import { Card, Table, Select, Input, Button, Tag } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const SupplierRfqInbox: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/supplier/rfqs' : '/user/supplier/rfqs';

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const quotes = useLiveQuery(
    () => activePartyId ? rfqDb.seller_quotes.where('seller_party_id').equals(activePartyId).toArray() : [],
    [activePartyId]
  ) || [];

  const items = useLiveQuery(() => rfqDb.rfq_items.toArray(), []) || [];
  const rfqs = useLiveQuery(() => rfqDb.rfqs.toArray(), []) || [];

  // Filter items assigned to this seller
  const assignedItems = React.useMemo(() => {
    if (!activePartyId) return [];
    return items.filter((item) =>
      item.seller_assignments?.some((a) => a.seller_party_id === activePartyId)
    );
  }, [items, activePartyId]);

  const allResponses = React.useMemo(() => {
    return assignedItems.map((item) => {
      const rfq = rfqs.find((r) => r.id === item.rfq_id);
      const quote = quotes.find((q) => q.rfq_item_id === item.id);

      return {
        key: item.id,
        rfq_id: item.rfq_id,
        rfq_number: rfq?.rfq_number || 'N/A',
        rfq_title: rfq?.title || 'Unknown RFQ',
        item_id: item.id,
        product_name: item.product_name || 'Custom Specifications',
        quantity: item.quantity,
        unit: item.unit,
        target_unit_price: item.target_unit_price,
        quote_status: quote ? quote.status : 'NOT_SUBMITTED',
        offered_price: quote ? quote.unit_price : undefined,
        quote_number: quote ? quote.seller_quote_number : undefined,
        round: quote ? quote.round : undefined
      };
    });
  }, [assignedItems, rfqs, quotes]);

  const filteredResponses = allResponses.filter((res) => {
    const matchesTab = selectedStatus === 'ALL' || res.quote_status === selectedStatus;
    const matchesSearch =
      res.rfq_number.toLowerCase().includes(searchText.toLowerCase()) ||
      res.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
      res.rfq_title.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const columns = [
    {
      title: 'RFQ & Sourcing Line Item',
      key: 'rfq_item',
      render: (_: any, record: any) => (
        <div>
          <div className="font-bold text-slate-900">{record.rfq_number} - {record.rfq_title}</div>
          <div className="text-xs text-slate-500">Product: <span className="font-medium text-slate-700">{record.product_name}</span></div>
        </div>
      )
    },
    {
      title: 'Requested Qty',
      key: 'qty',
      width: 140,
      render: (_: any, record: any) => (
        <span className="font-semibold text-slate-700">{record.quantity} {record.unit}</span>
      )
    },
    {
      title: 'Target Price',
      dataIndex: 'target_unit_price',
      key: 'target_unit_price',
      width: 120,
      render: (val: number) => val ? <span className="font-bold text-slate-600">${val}</span> : 'N/A'
    },
    {
      title: 'Your Offer Price',
      dataIndex: 'offered_price',
      key: 'offered_price',
      width: 140,
      render: (val: number, record: any) => (
        val ? (
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-600">${val}</span>
            <div className="text-[10px] text-slate-400">Ref: {record.quote_number} (Rd {record.round})</div>
          </div>
        ) : <span className="text-slate-400">No Offer Yet</span>
      )
    },
    {
      title: 'Quote Status',
      dataIndex: 'quote_status',
      key: 'quote_status',
      width: 160,
      render: (status: string) => {
        let color = 'default';
        if (status === 'SUBMITTED') color = 'blue';
        if (status === 'ACCEPTED') color = 'success';
        if (status === 'REVISION_REQUIRED') color = 'warning';
        if (status === 'REJECTED') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          ghost
          size="small"
          onClick={() => navigate(`${basePath}/${record.rfq_id}/items/${record.item_id}/respond`)}
          icon={<ArrowRightOutlined />}
        >
          {record.offered_price ? 'Update Offer' : 'Submit Offer'}
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Supplier Sourcing Inbox</h1>
          <p className="text-xs text-slate-500">RFQ Sourcing items assigned to {activeParty?.display_name || 'your party'}.</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200" bodyStyle={{ padding: '12px 16px' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filter Status:</span>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              size="small"
              className="w-48"
              options={[
                { value: 'ALL', label: `All Assigned (${allResponses.length})` },
                { value: 'NOT_SUBMITTED', label: 'Not Submitted' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'REVISION_REQUIRED', label: 'Revision Required' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'REJECTED', label: 'Rejected' }
              ]}
            />
          </div>

          <Input
            placeholder="Search assigned RFQs..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-64"
            size="small"
            allowClear
          />
        </div>

        <Table
          dataSource={filteredResponses}
          columns={columns}
          rowKey="key"
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
        />
      </Card>
    </div>
  );
};
