import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Table, Button, Tag as AntTag, Descriptions, Space } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb, type PurchaseOrder } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { RFQQuoteStatusBadge } from './RfqStatusBadge';

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const SellerRfqWorkspace: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  const pageData = useLiveQuery(async () => {
    if (!rfqId) return null;

    const [
      rfq,
      rfqItems,
      parties,
      quotes,
      catalogProducts,
      categories,
      sellerProducts,
      awardHistory,
      awardItems,
      quoteAwards,
      purchaseOrders,
      purchaseOrderItems,
    ] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_items.where('rfq_id').equals(rfqId).toArray(),
      businessDb.parties.toArray(),
      rfqDb.seller_quotes.toArray(),
      catalogDb.products.toArray(),
      catalogDb.categories.toArray(),
      catalogDb.sellerProducts.toArray(),
      rfqDb.rfq_quote_item_award_revisions.where('rfq_id').equals(rfqId).toArray(),
      rfqDb.rfq_quote_item_awards.where('rfq_id').equals(rfqId).toArray(),
      rfqDb.rfq_quote_awards.where('rfq_id').equals(rfqId).toArray(),
      rfqDb.purchase_orders.where('rfq_id').equals(rfqId).toArray(),
      rfqDb.purchase_order_items.toArray(),
    ]);

    return {
      rfq,
      rfqItems,
      parties,
      quotes,
      catalogProducts,
      categories,
      sellerProducts,
      awardHistory: awardHistory || [],
      awardItems: awardItems || [],
      quoteAwards: quoteAwards || [],
      purchaseOrders: purchaseOrders || [],
      purchaseOrderItems: purchaseOrderItems || [],
    };
  }, [rfqId]);

  const {
    rfq,
    rfqItems = [],
    parties = [],
    quotes = [],
    catalogProducts = [],
    categories = [],
    sellerProducts = [],
    awardHistory = [],
    awardItems = [],
    quoteAwards = [],
    purchaseOrders = [],
    purchaseOrderItems = [],
  } = pageData ?? {};

  const activeParty = useMemo(() => {
    if (!parties.length) return null;
    return isBusinessContext
      ? parties.find(p => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId) || parties[0]
      : parties.find(p => p.owner_type === 'USER' && p.owner_id === currentUserId) ||
          parties.find(p => p.id === 'pty-6') ||
          parties[0];
  }, [parties, isBusinessContext, activeWorkspace?.businessId, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(basePath)}>Seller RFQ Inbox</a> },
      { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'RFQ Workspace'}</span> },
    ],
    [navigate, basePath, rfq?.rfq_number],
  );
  useBreadcrumb(breadcrumbs);

  // My Seller Purchase Orders for this RFQ
  const myPurchaseOrders: PurchaseOrder[] = useMemo(() => {
    if (!activePartyId) return [];
    return purchaseOrders.filter(po => po.seller_party_id === activePartyId);
  }, [purchaseOrders, activePartyId]);

  // Filter line items assigned to this seller for this specific RFQ
  const assignedLineItems = useMemo(() => {
    if (!activePartyId) return [];

    const sellerQuotesMap = new Map(
      quotes.filter(q => q.seller_party_id === activePartyId).map(q => [q.rfq_item_id, q]),
    );

    return rfqItems
      .filter(item => item.seller_assignments?.some(a => a.seller_party_id === activePartyId))
      .map(item => {
        const quote = sellerQuotesMap.get(item.id);
        const product = catalogProducts.find(p => p.id === item.catalog_product_id);
        const category = categories.find(c => c.id === item.category_id);

        let variantSku = '';
        if (item.variant_id) {
          const matchedSellerProduct = sellerProducts.find(sp => sp.variants?.some(v => v.id === item.variant_id));
          if (matchedSellerProduct) {
            const v = matchedSellerProduct.variants?.find(v => v.id === item.variant_id);
            variantSku = v?.sku || v?.id || item.variant_id;
          } else {
            variantSku = item.variant_id;
          }
        }

        const isVariantSelected = Boolean(item.variant_id);

        const myAward = (quoteAwards || []).find(
          (a: any) => a.rfq_item_id === item.id && a.seller_party_id === activePartyId,
        );
        const myAwardStatus = myAward?.award_status;
        const awardRound = myAward?.award_round || 1;

        const myAwardItems = (awardItems || []).filter(
          a => a.rfq_item_id === item.id && a.seller_party_id === activePartyId,
        );
        const hasAwardHistory = awardHistory.some(
          h => h.rfq_item_id === item.id && h.seller_party_id === activePartyId,
        );

        // Check if a PO has been created for this item
        const linkedPoId =
          myAwardItems.find(a => a.purchase_order_id)?.purchase_order_id ||
          purchaseOrderItems.find(poi => poi.rfq_item_id === item.id && poi.seller_quote_id === quote?.id)
            ?.purchase_order_id ||
          myPurchaseOrders.find(po => po.seller_quote_ids?.includes(quote?.id || ''))?.id;

        const linkedPo = linkedPoId ? myPurchaseOrders.find(po => po.id === linkedPoId) : undefined;
        const isPoCreated = Boolean(
          linkedPo || myAwardItems.some(a => a.variant_award_status === 'PO_CREATED' || a.variant_award_status === 'PO_RECEIVED'),
        );
        const isPoAcknowledged = linkedPo?.po_status === 'SELLER_ACKNOWLEDGED' || myAwardItems.some(a => a.variant_award_status === 'PO_RECEIVED');

        // An award exists strictly if an award record, award items, or award history exists
        const hasAward = Boolean(myAward || myAwardItems.length > 0 || hasAwardHistory);

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
          proposal_round: quote?.round || 1,
          award_round: awardRound,
          award_status: myAwardStatus,
          has_award: hasAward,
          is_po_created: isPoCreated,
          is_po_acknowledged: isPoAcknowledged,
          linked_po_id: linkedPo?.id || linkedPoId,
          linked_po_number: linkedPo?.po_number,
        };
      });
  }, [
    rfqItems,
    quotes,
    catalogProducts,
    categories,
    sellerProducts,
    activePartyId,
    awardHistory,
    awardItems,
    quoteAwards,
    myPurchaseOrders,
    purchaseOrderItems,
  ]);

  const requesterPartyName = useMemo(() => {
    if (!rfq?.requester_id) return 'Requester Company';
    return parties.find(p => p.id === rfq.requester_id)?.display_name || `Party (${rfq.requester_id})`;
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
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Seller RFQ Workspace</h1>
          <p className="text-slate-500 text-sm mt-1 m-0">
            View assigned line items, submit specifications and pricing proposals, and review purchase orders.
          </p>
        </div>
        <Button
          onClick={() => navigate(basePath)}
          icon={<ArrowLeftOutlined />}
          className="text-slate-600 font-medium border-slate-200 shadow-xs hover:text-slate-900"
        >
          Return to Inbox
        </Button>
      </div>

      {/* RFQ Overview Card */}
      <Descriptions
        bordered
        size="small"
        column={{ md: 3, sm: 2, xs: 1 }}
        classNames={{ header: 'mb-0', title: 'p-2' }}
        className="bg-white rounded-xl shadow-xs border border-slate-200"
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

      {/* Purchase Orders Received Summary Card (if any POs issued) */}
      {myPurchaseOrders.length > 0 && (
        <Card
          size="small"
          className="border-slate-200 shadow-xs rounded-xl bg-white"
          title={
            <div className="flex items-center gap-2">
              <FileProtectOutlined className="text-indigo-600" />
              <span className="font-bold text-xs text-slate-900">
                Purchase Orders Received from Buyer ({myPurchaseOrders.length})
              </span>
            </div>
          }
        >
          <div className="space-y-3">
            {myPurchaseOrders.map(po => {
              const isAck = po.po_status === 'SELLER_ACKNOWLEDGED';
              return (
                <div
                  key={po.id}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{po.po_number}</span>
                      {isAck ? (
                        <AntTag color="success" className="text-[10px] font-semibold m-0">
                          ✓ Acknowledged
                        </AntTag>
                      ) : (
                        <AntTag color="processing" className="text-[10px] font-semibold m-0">
                          Action Required: Await Acknowledgment
                        </AntTag>
                      )}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Issued: {po.po_released_at ? new Date(po.po_released_at).toLocaleDateString() : 'Recent'} • Value:{' '}
                      <strong className="font-mono text-slate-800">
                        {formatCurrency(po.total_amount, po.currency)}
                      </strong>
                    </div>
                  </div>

                  <Button
                    type={!isAck ? 'primary' : 'default'}
                    size="small"
                    onClick={() => navigate(`${basePath}/${rfqId}/purchase-orders/${po.id}`)}
                    className="text-xs font-semibold"
                  >
                    {!isAck ? 'View & Acknowledge PO →' : 'View PO Document →'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Line Items Table Card */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={<span className="font-bold text-xs text-slate-800">Assigned RFQ Line Items</span>}
      >
        <Table
          dataSource={assignedLineItems}
          rowKey="key"
          size="small"
          pagination={false}
          classNames={{ header: { cell: 'text-[12px]' } }}
          columns={[
            {
              title: 'S.No',
              key: 'sno',
              width: 55,
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
              width: 130,
              render: (_: any, record: any) => (
                <span className="font-semibold text-slate-800 text-xs">
                  {record.req_quantity} {record.req_unit}
                </span>
              ),
            },
            {
              title: 'Proposal Status',
              key: 'proposal_status',
              width: 150,
              render: (_: any, record: any) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <RFQQuoteStatusBadge status={record.quote_status} />
                  {record.quote_status !== 'NOT_SUBMITTED' && (
                    <AntTag color="cyan" className="text-[10px] m-0 font-medium">
                      Round-{record.proposal_round || 1}
                    </AntTag>
                  )}
                </div>
              ),
            },
            {
              title: 'Award / PO Status',
              key: 'award_status',
              width: 200,
              render: (_: any, record: any) => {
                if (record.is_po_created) {
                  return (
                    <div className="space-y-1">
                      {record.is_po_acknowledged ? (
                        <AntTag color="success" className="text-[10px] font-bold m-0 flex items-center gap-1 w-fit">
                          <CheckCircleOutlined /> PO Acknowledged
                        </AntTag>
                      ) : (
                        <AntTag color="processing" className="text-[10px] font-bold m-0 flex items-center gap-1 w-fit">
                          <ClockCircleOutlined /> PO Issued
                        </AntTag>
                      )}
                      {record.linked_po_number && (
                        <span className="font-mono text-[10px] text-slate-600 block">{record.linked_po_number}</span>
                      )}
                    </div>
                  );
                }

                if (!record.has_award) {
                  if (record.quote_status === 'DEVIATION_ACCEPTED') {
                    return (
                      <AntTag color="blue" className="text-[10px] m-0 font-medium border-dashed">
                        Allocation Eligible
                      </AntTag>
                    );
                  }
                  return <span className="text-slate-300 font-bold text-sm">—</span>;
                }

                return (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {record.award_status === 'CONFIRMED' ? (
                        <AntTag color="emerald" className="text-[10px] m-0 font-bold">
                          ✓ Confirmed (R{record.award_round})
                        </AntTag>
                      ) : record.award_status === 'SELLER_REVISED' ? (
                        <AntTag color="amber" className="text-[10px] m-0 font-bold">
                          Revised (R{record.award_round})
                        </AntTag>
                      ) : record.award_status === 'AWARDED' ? (
                        <AntTag color="purple" className="text-[10px] m-0 font-bold">
                          Awarded (R{record.award_round})
                        </AntTag>
                      ) : (
                        <AntTag color="blue" className="text-[10px] m-0 font-medium">
                          Round {record.award_round}
                        </AntTag>
                      )}
                    </div>
                    {record.award_status === 'AWARDED' && (
                      <span className="text-[10px] text-purple-700 font-semibold block">Action Required</span>
                    )}
                    {record.award_status === 'SELLER_REVISED' && (
                      <span className="text-[10px] text-amber-600 italic block">Awaiting Buyer Review</span>
                    )}
                  </div>
                );
              },
            },
            {
              title: 'Actions',
              key: 'action',
              width: 220,
              align: 'right',
              render: (_: any, record: any) => {
                let buttonText = 'Make Proposal';
                if (record.quote_status === 'DRAFT') buttonText = 'Continue Draft';
                else if (record.quote_status === 'SUBMITTED') buttonText = 'View Proposal';
                else if (record.quote_status === 'REVISION_REQUIRED')
                  buttonText = `Revise Specs (R${record.proposal_round})`;
                else if (
                  ['DEVIATION_ACCEPTED', 'PRODUCT_SUBMIT_REVISION', 'FINAL_ACKNOWLEDGE'].includes(
                    record.quote_status || '',
                  )
                )
                  buttonText = 'View Proposal';
                else if (record.quote_status === 'REJECTED') buttonText = 'View Proposal';

                const isAwardActionRequired = record.award_status === 'AWARDED';
                const isAwardConfirmed = record.award_status === 'CONFIRMED';

                return (
                  <div className="flex flex-col items-end gap-1.5">
                    {/* If PO is Created */}
                    {record.is_po_created && record.linked_po_id ? (
                      <Button
                        type={!record.is_po_acknowledged ? 'primary' : 'default'}
                        size="small"
                        className="font-semibold text-xs flex items-center gap-1 w-fit"
                        onClick={() => navigate(`${basePath}/${rfqId}/purchase-orders/${record.linked_po_id}`)}
                        icon={<FileDoneOutlined />}
                      >
                        {!record.is_po_acknowledged ? 'Acknowledge PO →' : 'View PO Order →'}
                      </Button>
                    ) : record.has_award ? (
                      <Button
                        type={isAwardActionRequired ? 'primary' : 'default'}
                        size="small"
                        className={`${
                          isAwardActionRequired
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : isAwardConfirmed
                              ? 'text-emerald-700 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100'
                              : 'text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100'
                        } font-semibold text-xs flex items-center gap-1 w-fit`}
                        onClick={() => navigate(`${basePath}/${rfqId}/items/${record.rfq_item_id}/award-revision`)}
                        icon={<ArrowRightOutlined />}
                      >
                        {isAwardActionRequired
                          ? `Review & Confirm Award (R${record.award_round})`
                          : isAwardConfirmed
                            ? 'View Confirmed Award ✓'
                            : `View Award Revision (R${record.award_round})`}
                      </Button>
                    ) : null}

                    <Button
                      type={
                        !record.has_award &&
                        (record.quote_status === 'NOT_SUBMITTED' ||
                          record.quote_status === 'DRAFT' ||
                          record.quote_status === 'REVISION_REQUIRED')
                          ? 'primary'
                          : 'default'
                      }
                      ghost={
                        !record.has_award &&
                        (record.quote_status === 'NOT_SUBMITTED' || record.quote_status === 'DRAFT')
                      }
                      size="small"
                      className={`${
                        !record.has_award && record.quote_status === 'REVISION_REQUIRED'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-0'
                          : record.has_award
                            ? 'text-slate-600 hover:text-slate-900 border-slate-200'
                            : ''
                      } font-medium text-xs flex items-center gap-1 w-fit`}
                      onClick={() => navigate(`${basePath}/${rfqId}/items/${record.rfq_item_id}/respond`)}
                      icon={<ArrowRightOutlined />}
                    >
                      {buttonText}
                    </Button>
                  </div>
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
