import React, { useState } from 'react';
import { Card, Table, Select, Input, Button, Tag } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const SupplierRfqInbox: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

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

  const awards = useLiveQuery(
    () => activePartyId ? rfqDb.rfq_awards.where('seller_party_id').equals(activePartyId).toArray() : [],
    [activePartyId]
  ) || [];

  const items = useLiveQuery(() => rfqDb.rfq_items.toArray(), []) || [];
  const rfqs = useLiveQuery(() => rfqDb.rfqs.toArray(), []) || [];
  const catalogProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];

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
      const award = awards.find((a) => a.rfq_item_id === item.id);
      const product = catalogProducts.find((p) => p.id === item.catalog_product_id);

      return {
        key: item.id,
        rfq_id: item.rfq_id,
        rfq_number: rfq?.rfq_number || 'N/A',
        rfq_title: rfq?.title || 'Unknown RFQ',
        item_id: item.id,
        product_name: product?.name || 'Custom Specifications',
        quantity: item.quantity,
        unit: item.unit,
        target_unit_price: item.target_unit_price,
        quote_status: quote ? quote.status : 'NOT_SUBMITTED',
        offered_price: quote ? quote.unit_price : undefined,
        quote_number: quote ? quote.seller_quote_number : undefined,
        round: quote ? quote.round : undefined,
        award
      };
    });
  }, [assignedItems, rfqs, quotes, awards]);

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
          <div className="space-y-0.5 text-left">
            <span className="font-bold text-emerald-600">${val}</span>
            <div>
              <a
                onClick={() => navigate(`${isBusinessContext ? '/b/supplier' : '/user/supplier'}/rfqs/${record.rfq_id}/items/${record.item_id}/respond`)}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline block"
              >
                Ref: {record.quote_number} (Rd {record.round})
              </a>
            </div>
          </div>
        ) : <span className="text-slate-400">No Offer Yet</span>
      )
    },
    {
      title: 'Quote & Award Status',
      key: 'quote_status',
      width: 200,
      render: (_: any, record: any) => {
        const award = record.award;
        if (award) {
          const mapStatus = award.product_mapping_status;
          return (
            <div className="flex flex-col gap-1">
              <Tag color="gold" className="w-fit font-bold">CONTRACT AWARDED</Tag>
              {mapStatus === 'PENDING' && <Tag color="warning" className="w-fit text-[10px]">Mapping Required</Tag>}
              {mapStatus === 'SUBMITTED' && <Tag color="blue" className="w-fit text-[10px]">Submitted Mapping</Tag>}
              {mapStatus === 'ACKNOWLEDGED' && <Tag color="success" className="w-fit text-[10px]">Mapping Approved</Tag>}
            </div>
          );
        }

        let color = 'default';
        const status = record.quote_status;
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
      render: (_: any, record: any) => {
        const award = record.award;
        if (award) {
          if (award.product_mapping_status === 'PENDING') {
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => navigate(`${isBusinessContext ? '/b/supplier' : '/user/supplier'}/rfqs/${record.rfq_id}/items/${record.item_id}/product`)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Map Product
              </Button>
            );
          }
          if (award.product_mapping_status === 'SUBMITTED') {
            return <span className="text-xs text-blue-600 font-medium italic">Awaiting Spec Approval...</span>;
          }
          if (award.product_mapping_status === 'ACKNOWLEDGED' && award.award_status === 'AWARDED') {
            return <span className="text-xs text-amber-600 font-medium italic">Awaiting PO Release...</span>;
          }

          if (award.award_status === 'PO_CREATED') {
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => navigate(`${isBusinessContext ? '/b/supplier' : '/user/supplier'}/rfqs/${record.rfq_id}/items/${record.item_id}/award/${award.id}/receipt`)}
                className="bg-purple-600 hover:bg-purple-700 font-semibold"
              >
                Confirm PO Receipt
              </Button>
            );
          }

          if (award.award_status === 'PO_RECEIVED') {
            return (
              <Button
                size="small"
                onClick={() => navigate(`${isBusinessContext ? '/b/supplier' : '/user/supplier'}/rfqs/${record.rfq_id}/items/${record.item_id}/award/${award.id}/receipt`)}
                className="border-emerald-600 text-emerald-600 hover:text-emerald-700"
              >
                View PO / Order
              </Button>
            );
          }

          return null;
        }

        let buttonText = 'Submit Offer';
        if (record.quote_status === 'SUBMITTED') buttonText = 'Update Offer';
        else if (record.quote_status === 'REVISION_REQUIRED') buttonText = 'Revise Offer';
        else if (record.quote_status === 'DRAFT') buttonText = 'Continue Draft';
        else if (record.quote_status === 'REJECTED') buttonText = 'View Offer';
        else if (record.offered_price) buttonText = 'Update Offer';

        return (
          <Button
            type="primary"
            ghost
            size="small"
            onClick={() => navigate(`${basePath}/${record.rfq_id}/items/${record.item_id}/respond`)}
            icon={<ArrowRightOutlined />}
          >
            {buttonText}
          </Button>
        );
      }
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
