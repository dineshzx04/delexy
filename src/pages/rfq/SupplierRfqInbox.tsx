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
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const sellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray(), []) || [];

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
      const category = categories.find((c) => c.id === item.category_id);

      let variantSku = '';
      let matchedSellerProduct = null;
      if (item.variant_id) {
        matchedSellerProduct = sellerProducts.find((sp) =>
          sp.variants?.some((v) => v.id === item.variant_id)
        );
        if (matchedSellerProduct) {
          const v = matchedSellerProduct.variants?.find((v) => v.id === item.variant_id);
          variantSku = v?.sku || v?.id || item.variant_id;
        } else {
          variantSku = item.variant_id;
        }
      }

      const isVariantSelected = Boolean(item.variant_id);
      const isCatalogProduct = Boolean(product || isVariantSelected);

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
        category_name: category?.name || item.category_id || '',
        product_name: product?.name || '',
        variant_sku: variantSku,
        is_variant_selected: isVariantSelected,
        is_catalog_product: isCatalogProduct,
        req_quantity: item.req_quantity,
        req_unit: item.req_unit,
        offer_quantity: quote ? quote.offer_quantity : undefined,
        offer_unit: quote ? quote.offer_unit : undefined,
      };
    });
  }, [assignedItems, rfqs, quotes, categories, catalogProducts, sellerProducts]);

  const filteredResponses = allResponses.filter((res) => {
    const matchesTab = selectedStatus === 'ALL' || res.quote_status === selectedStatus;
    const matchesSearch =
      res.rfq_number.toLowerCase().includes(searchText.toLowerCase()) ||
      res.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
      res.category_name.toLowerCase().includes(searchText.toLowerCase()) ||
      res.variant_sku.toLowerCase().includes(searchText.toLowerCase()) ||
      res.rfq_title.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Seller RFQ Inbox</h1>
          <p className="text-xs text-slate-500">RFQ items assigned to {activeParty?.display_name || 'your party'}.</p>
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
                { value: 'DEVIATION_ACCEPTED', label: 'Deviation Accepted' },
                { value: 'PRODUCT_SUBMIT_REVISION', label: 'Product Submit Revision' },
                { value: 'FINAL_ACKNOWLEDGE', label: 'Final Acknowledge' },
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AntTag color="blue" className="font-semibold text-xs m-0">
                        {record.rfq_number} - Item #{record.rfq_item_index}
                      </AntTag>
                      {/* {record.is_variant_selected ? (
                        <AntTag color="purple" className="text-[10px] m-0 font-bold">Specific Catalog SKU Variant</AntTag>
                      ) : (
                        <AntTag color="orange" className="text-[10px] m-0 font-bold">Customized Product Specs</AntTag>
                      )
                      } */}
                    </div>
                    <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                      {record.is_variant_selected ? (
                        <>
                          <span>{record.product_name || 'Catalog Product'}</span>
                          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">SKU: {record.variant_sku}</span>
                        </>
                      ) : (
                        <span>{record.category_name ? `${record.category_name} (Custom Specs)` : 'Custom Specifications'}</span>
                      )}
                    </div>
                  </div>
                )
              },
              {
                title: 'Req.Qty',
                key: 'qty',
                className: "w-[150px] max-w-[150px]",
                render: (_: any, record: any) => (
                  <span className="font-semibold text-slate-700">{record.req_quantity} {record.req_unit}</span>
                )
              },
              {
                title: 'Status',
                key: 'status',
                className: "w-[150px] max-w-[150px]",
                render: (_: any, record: any) => (
                  <RFQQuoteStatusBadge status={record.quote_status} />
                )
              },
              {
                title: 'Action',
                key: 'action',
                className: "w-[150px] max-w-[150px]",
                align: 'right' as const,
                render: (_: any, record: any) => {
                  let buttonText = 'Make Proposal';
                  if (record.quote_status === 'DRAFT') buttonText = 'Continue Draft';
                  else if (record.quote_status === 'SUBMITTED') buttonText = 'View Proposal';
                  else if (record.quote_status === 'REVISION_REQUIRED') buttonText = 'Revise Proposal';
                  else if (['DEVIATION_ACCEPTED', 'PRODUCT_SUBMIT_REVISION', 'FINAL_ACKNOWLEDGE'].includes(record.quote_status || '')) buttonText = 'View Proposal';
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
