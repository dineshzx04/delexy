import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Table, Button, Tag as AntTag, Descriptions } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, ShopOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { RFQQuoteStatusBadge } from './RfqStatusBadge';

export const SellerRfqWorkspace: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  const pageData = useLiveQuery(async () => {
    if (!rfqId) return null;

    const [rfq, rfqItems, parties, quotes, catalogProducts, categories, sellerProducts] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_items.where('rfq_id').equals(rfqId).toArray(),
      businessDb.parties.toArray(),
      rfqDb.seller_quotes.toArray(),
      catalogDb.products.toArray(),
      catalogDb.categories.toArray(),
      catalogDb.sellerProducts.toArray(),
    ]);

    return { rfq, rfqItems, parties, quotes, catalogProducts, categories, sellerProducts };
  }, [rfqId]);

  const { rfq, rfqItems = [], parties = [], quotes = [], catalogProducts = [], categories = [], sellerProducts = [] } = pageData ?? {};

  const activeParty = useMemo(() => {
    if (!parties.length) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace?.businessId, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(basePath)}>Seller RFQ Inbox</a> },
      { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'RFQ Workspace'}</span> },
    ],
    [navigate, basePath, rfq?.rfq_number]
  );
  useBreadcrumb(breadcrumbs);

  // Filter line items assigned to this seller for this specific RFQ
  const assignedLineItems = useMemo(() => {
    if (!activePartyId) return [];

    const sellerQuotesMap = new Map(quotes.filter((q) => q.seller_party_id === activePartyId).map((q) => [q.rfq_item_id, q]));

    return rfqItems
      .filter((item) => item.seller_assignments?.some((a) => a.seller_party_id === activePartyId))
      .map((item) => {
        const quote = sellerQuotesMap.get(item.id);
        const product = catalogProducts.find((p) => p.id === item.catalog_product_id);
        const category = categories.find((c) => c.id === item.category_id);

        let variantSku = '';
        if (item.variant_id) {
          const matchedSellerProduct = sellerProducts.find((sp) => sp.variants?.some((v) => v.id === item.variant_id));
          if (matchedSellerProduct) {
            const v = matchedSellerProduct.variants?.find((v) => v.id === item.variant_id);
            variantSku = v?.sku || v?.id || item.variant_id;
          } else {
            variantSku = item.variant_id;
          }
        }

        const isVariantSelected = Boolean(item.variant_id);

        return {
          key: item.id,
          rfq_item_id: item.id,
          item_index: item.item_index || 1,
          category_name: category?.name || item.category_id || '',
          product_name: product?.name || '',
          variant_sku: variantSku,
          is_variant_selected: isVariantSelected,
          req_quantity: item.req_quantity,
          req_unit: item.req_unit || 'PCS',
          quote_number: quote?.seller_quote_number,
          quote_status: quote?.status || 'NOT_SUBMITTED',
        };
      });
  }, [rfqItems, quotes, catalogProducts, categories, sellerProducts, activePartyId]);

  const requesterPartyName = useMemo(() => {
    if (!rfq?.requester_id) return 'Requester Company';
    return parties.find((p) => p.id === rfq.requester_id)?.display_name || `Party (${rfq.requester_id})`;
  }, [rfq?.requester_id, parties]);

  if (!pageData) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-sm font-semibold text-slate-600">Loading Seller RFQ Workspace...</h2>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-lg font-bold text-slate-800">RFQ Sourcing Container Not Found</h2>
        <Button size="small" className="mt-3" onClick={() => navigate(basePath)}>
          Back to Seller RFQs List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 pb-8">
      {/* Structural Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">Seller RFQ Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Manage assigned line items, evaluate specifications, and submit quotation proposals for this RFQ.
          </p>
        </div>
      </div>

      {/* RFQ Sourcing Details */}
      <Descriptions
        title={<span className="text-sm font-bold text-slate-800">RFQ Sourcing Details</span>}
        bordered
        size="small"
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        labelStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }}
        contentStyle={{ fontSize: '12px', color: '#1e293b' }}
        className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200"
        classNames={{ header: "mb-0", title: "p-2" }}
      >
        <Descriptions.Item label="Buyer" span={2}>
          <span className="font-semibold text-slate-800 text-xs">{requesterPartyName}</span>
        </Descriptions.Item>
        <Descriptions.Item label="RFQ Title">
          <span className="font-semibold text-slate-900 text-xs">{rfq.title}</span>
        </Descriptions.Item>
        <Descriptions.Item label="RFQ Number">
          <span className="font-mono font-bold text-slate-700 text-xs">{rfq.rfq_number}</span>
        </Descriptions.Item>
        <Descriptions.Item label="RFQ Status">
          <AntTag color={rfq.status === 'AWARDED' ? 'emerald' : 'blue'} className="font-bold text-xs m-0">
            {rfq.status || 'PUBLISHED'}
          </AntTag>
        </Descriptions.Item>
        <Descriptions.Item label="Submission Deadline">
          <span className="text-slate-700 font-medium text-xs">
            {rfq.submission_deadline ? new Date(rfq.submission_deadline).toLocaleDateString() : 'N/A'}
          </span>
        </Descriptions.Item>
        {rfq.description && (
          <Descriptions.Item label="Description" span={2}>
            <span className="text-slate-600 text-xs italic">{rfq.description}</span>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Line Items Table Card */}
      <Card size="small" className="shadow-sm border-slate-200 bg-white" title={<span className="font-bold text-xs text-slate-800">Assigned RFQ Line Items</span>}>
        <Table
          dataSource={assignedLineItems}
          rowKey="key"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'S.No',
              key: 'sno',
              width: 65,
              align: 'center',
              render: (_: any, __: any, index: number) => (
                <span className="font-mono text-xs text-slate-500 font-medium">{index + 1}</span>
              ),
            },
            {
              title: 'Line Item Specifications',
              key: 'item_spec',
              render: (_: any, record: any) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      Item #{record.item_index}
                    </span>
                    <AntTag color="blue" className="text-[10px] m-0 font-medium">
                      {record.category_name}
                    </AntTag>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs">
                    {record.product_name ? (
                      <span>{record.product_name}</span>
                    ) : (
                      <span>{record.category_name} (Custom Specifications)</span>
                    )}
                    {record.variant_sku && (
                      <span className="ml-2 text-[10px] font-mono text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                        SKU: {record.variant_sku}
                      </span>
                    )}
                  </div>
                </div>
              ),
            },
            {
              title: 'Requested Qty',
              key: 'req_qty',
              width: 140,
              render: (_: any, record: any) => (
                <span className="font-semibold text-slate-800 text-xs">
                  {record.req_quantity} {record.req_unit}
                </span>
              ),
            },
            {
              title: 'Proposal Status',
              key: 'status',
              width: 180,
              render: (_: any, record: any) => <RFQQuoteStatusBadge status={record.quote_status} />,
            },
            {
              title: 'Action',
              key: 'action',
              width: 160,
              align: 'right',
              render: (_: any, record: any) => {
                let buttonText = 'Make Proposal';
                if (record.quote_status === 'DRAFT') buttonText = 'Continue Draft';
                else if (record.quote_status === 'SUBMITTED') buttonText = 'View Proposal';
                else if (record.quote_status === 'REVISION_REQUIRED') buttonText = 'Revise Proposal';
                else if (['DEVIATION_ACCEPTED', 'PRODUCT_SUBMIT_REVISION', 'FINAL_ACKNOWLEDGE'].includes(record.quote_status || ''))
                  buttonText = 'View Proposal';
                else if (record.quote_status === 'REJECTED') buttonText = 'View Proposal';

                return (
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    className="font-semibold text-xs"
                    onClick={() => navigate(`${basePath}/${rfqId}/items/${record.rfq_item_id}/respond`)}
                    icon={<ArrowRightOutlined />}
                  >
                    {buttonText}
                  </Button>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
};

export const SupplierRfqWorkspace = SellerRfqWorkspace;
