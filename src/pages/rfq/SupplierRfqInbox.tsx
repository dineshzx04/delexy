import React, { useState } from 'react';
import { Card, Table, Select, Input, Button, Tag as AntTag } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { RFQQuoteStatusBadge } from './RfqStatusBadge';

export const SupplierRfqInbox: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
      const product = catalogProducts.find((p) => p.id === item.catalog_product_id);

      return {
        key: item.id,
        rfq_id: item.rfq_id,
        rfq_number: rfq?.rfq_number || 'N/A',
        rfq_title: rfq?.title || 'Unknown RFQ',
        rfq_item_id: item.id,
        rfq_item_index: item.item_index,
        quote_number: quote ? quote.seller_quote_number : undefined,
        round: quote ? quote.round : undefined,
        quote_status: quote ? quote.status : 'NOT_SUBMITTED',
        product_name: product?.name || 'Custom Specifications',
        req_quantity: item.req_quantity,
        req_unit: item.req_unit,
        req_unit_price: item.req_unit_price,
        offer_quantity: quote ? quote.offer_quantity : undefined,
        offer_unit: quote ? quote.offer_unit : undefined,
        offer_unit_price: quote ? quote.offer_unit_price : undefined,
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
          columns={
            [
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
                title: 'RFQ Item',
                key: 'rfq_item',
                render: (_: any, record: any) => (
                  <div>
                    <div className="font-semibold text-slate-700">
                      <AntTag color={"blue"}>{record.rfq_number} - Item {record.rfq_item_index}</AntTag>
                      <div className="font-medium text-slate-700"> {record.product_name} </div>
                    </div>
                  </div>
                )
              },
              {
                title: 'Req.Qty',
                key: 'qty',
                // width: 140,
                render: (_: any, record: any) => (
                  <span className="font-semibold text-slate-700">{record.req_quantity} {record.req_unit}</span>
                )
              },
              {
                title: 'Req.UnitPrice',
                key: 'req_unit_price',
                // width: 120,
                render: (_: any, record: any) => record.req_unit_price ? <span className="font-bold text-slate-600">${record.req_unit_price}</span> : 'N/A'
              },
              {
                title: 'Offer Price',
                dataIndex: 'offered_price',
                key: 'offered_price',
                // width: 140,
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
                title: 'Status',
                key: 'status',
                // width: 200,
                render: (_: any, record: any) => (
                  <RFQQuoteStatusBadge status={record.quote_status} />
                )
              },
              {
                title: 'Action',
                key: 'action',
                // width: 150,
                align: 'right' as const,
                render: (_: any, record: any) => {
                  let buttonText = 'Make Proposal';
                  if (record.quote_status === 'DRAFT') buttonText = 'Continue Draft';
                  else if (record.quote_status === 'SUBMITTED') buttonText = 'View Proposal';
                  else if (record.quote_status === 'REVISION_REQUIRED') buttonText = 'Revise Proposal';
                  else if (record.quote_status === 'ACCEPTED') buttonText = 'View Proposal';
                  else if (record.quote_status === 'REJECTED') buttonText = 'View Proposal';

                  return (
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      onClick={() => navigate(`${basePath}/${record.rfq_id}/items/${record.rfq_item_id}/respond`)}
                      icon={<ArrowRightOutlined />}
                    >
                      {buttonText}
                    </Button>
                  );
                }
              }
            ]
          }
          rowKey="key"
          size="small"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            size: 'small',
            showSizeChanger: true
          }}
        />
      </Card>
    </div>
  );
};
