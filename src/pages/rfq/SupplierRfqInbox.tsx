import React, { useState, useMemo } from 'react';
import { Card, Table, Tabs, Input, Button, Tag } from 'antd';
import { SearchOutlined, SendOutlined, BankOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb, type ItemSupplierResponseStatus } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { ItemSupplierStatusBadge } from '../../components/rfq/RfqStatusBadge';

export const SupplierRfqInbox: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() as any;
  const isBusinessContext = outletContext?.workspaceContext?.isBusinessContext || false;
  const activePartyIdFromContext = outletContext?.workspaceContext?.activePartyId;
  const currentUserId = outletContext?.workspaceContext?.currentUser?.id || 'usr-2';

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.id === activePartyIdFromContext) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activePartyIdFromContext, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  const quotes = useLiveQuery(
    () => activePartyId ? rfqDb.seller_quotes.where('seller_id').equals(activePartyId).toArray() : [],
    [activePartyId]
  ) || [];

  const items = useLiveQuery(() => rfqDb.rfq_items.toArray(), []) || [];
  const rfqs = useLiveQuery(() => rfqDb.rfqs.toArray(), []) || [];
  const awards = useLiveQuery(() => rfqDb.rfq_awards.toArray(), []) || [];
  const quoteRevisions = useLiveQuery(() => rfqDb.seller_quote_revisions.toArray(), []) || [];
  const quoteAttributes = useLiveQuery(() => rfqDb.seller_quote_attributes.toArray(), []) || [];
  const quoteComments = useLiveQuery(() => rfqDb.seller_quote_comments.toArray(), []) || [];

  const allResponses = useMemo(() => {
    return quotes.map((q) => {
      const item = items.find((i) => i.id === q.rfq_item_id);

      let status: ItemSupplierResponseStatus = 'ASSIGNED';
      if (q.status === 'ACCEPTED' || q.status === 'PARTIALLY_ACCEPTED') {
        status = 'AWARDED';
      } else if (q.status === 'NEGOTIATION') {
        status = 'COMMERCIAL_UNDER_NEGOTIATION';
      } else if (q.status === 'REVISED') {
        status = 'TECHNICAL_REVISION_REQUESTED';
      } else if (q.status === 'SUBMITTED') {
        status = 'TECHNICAL_SUBMITTED';
      } else if (q.status === 'REJECTED') {
        status = 'REJECTED';
      } else {
        status = 'ASSIGNED';
      }

      return {
        id: q.id,
        rfq_id: item?.rfq_id || '',
        rfq_item_id: q.rfq_item_id,
        seller_party_id: q.seller_id,
        status: status,
        product_mapping: q.seller_product_mapping || null,
      };
    });
  }, [quotes, items, rfqs, awards, quoteRevisions, quoteAttributes, quoteComments]);

  const filteredResponses = allResponses.filter((resp: any) => {
    const item = items.find((i) => i.id === resp.rfq_item_id);
    const rfq = rfqs.find((r) => r.id === resp.rfq_id);
    const matchesTab = activeTab === 'ALL' || resp.status === activeTab;
    const matchesSearch =
      (item?.product_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (rfq?.title || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (rfq?.rfq_number || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const columns = [
    {
      title: 'RFQ Item & Sourcing Title',
      key: 'item_title',
      render: (_: any, record: any) => {
        const item = items.find((i) => i.id === record.rfq_item_id);
        const rfq = rfqs.find((r) => r.id === record.rfq_id);
        return (
          <div>
            <div className="font-bold text-slate-800 text-sm">{item?.product_name || 'Flagship Mobile Device'}</div>
            <div className="text-[11px] text-slate-500">RFQ: <span className="font-semibold text-slate-600">{rfq?.rfq_number}</span> ({rfq?.title})</div>
          </div>
        );
      },
    },
    {
      title: 'Requested Qty',
      key: 'quantity',
      width: 140,
      render: (_: any, record: any) => {
        const item = items.find((i) => i.id === record.rfq_item_id);
        return <span className="font-bold text-slate-700 text-xs">{item?.quantity || 100} {item?.unit || 'Units'}</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: ItemSupplierResponseStatus) => <ItemSupplierStatusBadge status={status} />,
    },
    {
      title: 'Catalog Product Mapping',
      key: 'product_mapping',
      width: 200,
      render: (_: any, record: any) => {
        if (!record.product_mapping?.seller_product_id) {
          return <Tag color="volcano" className="text-[10px] py-0 px-1.5">Product Not Mapped</Tag>;
        }
        return (
          <div>
            <Tag color="purple" className="text-[10px] py-0 px-1.5">{record.product_mapping.seller_product_id}</Tag>
            <div className="text-[9px] text-slate-400 font-mono">Variant: {record.product_mapping.variant_id}</div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => {
        const basePath = isBusinessContext ? '/b' : '/user';
        return (
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`${basePath}/supplier/rfqs/${record.rfq_id}/items/${record.rfq_item_id}/respond`)}
            icon={<SendOutlined />}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
          >
            {record.status === 'ASSIGNED' ? 'Submit' : 'Update'}
          </Button>
        );
      },
    },
  ];
  
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 mb-0">Supplier Sourcing Inbox</h1>
            <Tag color="purple" icon={isBusinessContext ? <BankOutlined /> : <UserOutlined />} className="px-2 py-0 font-bold text-[11px]">
              Seller Party: {activeParty?.display_name || ''} ({activePartyId})
            </Tag>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">View assigned RFQ opportunities for seller party {activeParty?.display_name || ''}.</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200" size="small">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            className="mb-0"
            items={[
              { key: 'ALL', label: `All (${allResponses.length})` },
              { key: 'ASSIGNED', label: 'Assigned' },
              { key: 'TECHNICAL_REVISION_REQUESTED', label: 'Revision Requests' },
              { key: 'TECHNICAL_SUBMITTED', label: 'Tech Submitted' },
              { key: 'TECHNICAL_APPROVED', label: 'Tech Approved' },
              { key: 'PRODUCT_MAPPED', label: 'Product Mapped' },
              { key: 'COMMERCIAL_UNDER_NEGOTIATION', label: 'Negotiating' },
              { key: 'AWARDED', label: 'Awarded' },
            ]}
          />

          <Input
            placeholder="Search responses..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-56"
            size="small"
            allowClear
          />
        </div>

        <Table
          dataSource={filteredResponses}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
        />
      </Card>
    </div>
  );
};
