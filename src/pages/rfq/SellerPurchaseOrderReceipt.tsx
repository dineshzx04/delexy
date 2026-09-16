import React, { useState, useMemo } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Tag as AntTag,
  Space,
  Input,
  Alert,
  App as AntApp,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import {
  rfqDb,
  type PurchaseOrderItem,
  type PoAcknowledgement,
} from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const SellerPurchaseOrderReceipt: React.FC = () => {
  const { rfqId, poId } = useParams<{ rfqId: string; poId: string }>();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  // State
  const [acknowledgementNote, setAcknowledgementNote] = useState<string>('');
  const [submittingAck, setSubmittingAck] = useState<boolean>(false);

  // Single Reactive Query for PO and context data
  const pageData = useLiveQuery(async () => {
    if (!rfqId || !poId) return null;

    const [
      rfq,
      purchaseOrder,
      purchaseOrderItems,
      parties,
      existingAcknowledgement,
      sellerQuotes,
    ] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.purchase_orders.get(poId),
      rfqDb.purchase_order_items.where('purchase_order_id').equals(poId).toArray(),
      businessDb.parties.toArray(),
      rfqDb.po_acknowledgements.where('purchase_order_id').equals(poId).first(),
      rfqDb.seller_quotes.toArray(),
    ]);

    return {
      rfq,
      purchaseOrder,
      purchaseOrderItems: purchaseOrderItems || [],
      parties: parties || [],
      existingAcknowledgement,
      sellerQuotes: sellerQuotes || [],
    };
  }, [rfqId, poId]);

  const {
    rfq,
    purchaseOrder,
    purchaseOrderItems = [],
    parties = [],
    existingAcknowledgement,
    sellerQuotes = [],
  } = pageData ?? {};

  // Global Breadcrumb Integration
  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(isBusinessContext ? '/b/dashboard' : '/user/dashboard')}>Dashboard</a> },
      { title: <a onClick={() => navigate(basePath)}>Seller RFQ Inbox</a> },
      { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || 'RFQ Workspace'}</a> },
      {
        title: (
          <span className="text-slate-800 font-semibold">
            {purchaseOrder?.po_number || 'PO Receipt & Acknowledgment'}
          </span>
        ),
      },
    ],
    [navigate, basePath, rfqId, isBusinessContext, rfq?.rfq_number, purchaseOrder?.po_number],
  );
  useBreadcrumb(breadcrumbs);

  // Derive Buyer and Seller Party Details
  const buyerParty = useMemo(() => {
    if (!purchaseOrder || !parties.length) return null;
    return parties.find(p => p.id === purchaseOrder.buyer_party_id) || null;
  }, [purchaseOrder, parties]);

  const sellerParty = useMemo(() => {
    if (!purchaseOrder || !parties.length) return null;
    return parties.find(p => p.id === purchaseOrder.seller_party_id) || null;
  }, [purchaseOrder, parties]);

  const quotesMap = useMemo(() => new Map(sellerQuotes.map(q => [q.id, q])), [sellerQuotes]);

  // Loading Guard
  if (!pageData || !purchaseOrder || !rfq) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading Purchase Order Details..." />
      </div>
    );
  }

  const isAcknowledged =
    purchaseOrder.po_status === 'SELLER_ACKNOWLEDGED' ||
    purchaseOrder.po_status === 'COMPLETED' ||
    !!existingAcknowledgement?.seller_acknowledged;

  // Handler: Confirm & Acknowledge Purchase Order
  const handleAcknowledgePo = async () => {
    setSubmittingAck(true);
    try {
      const now = new Date().toISOString();
      const ackId = existingAcknowledgement?.id || `poack-${crypto.randomUUID()}`;

      const ackPayload: PoAcknowledgement = {
        id: ackId,
        purchase_order_id: purchaseOrder.id,
        seller_party_id: purchaseOrder.seller_party_id,
        seller_acknowledged: true,
        seller_acknowledged_at: now,
        seller_note: acknowledgementNote.trim() || 'Purchase Order confirmed and accepted for fulfillment.',
        buyer_confirmed: true,
        buyer_confirmed_at: now,
        updated_at: now,
      };

      // Find all quote item awards associated with this PO
      const itemAwardIds = purchaseOrderItems
        .map(i => i.quote_item_award_id)
        .filter(Boolean) as string[];

      await rfqDb.transaction(
        'rw',
        [rfqDb.purchase_orders, rfqDb.po_acknowledgements, rfqDb.rfq_quote_item_awards],
        async () => {
          await rfqDb.purchase_orders.update(purchaseOrder.id, {
            po_status: 'SELLER_ACKNOWLEDGED',
            updated_at: now,
          });

          await rfqDb.po_acknowledgements.put(ackPayload);

          for (const awardId of itemAwardIds) {
            await rfqDb.rfq_quote_item_awards.update(awardId, {
              variant_award_status: 'PO_RECEIVED',
              seller_accepted: true,
              seller_accepted_at: now,
              updated_at: now,
            });
          }
        },
      );

      message.success(`Purchase Order ${purchaseOrder.po_number} successfully acknowledged!`);
    } catch (err) {
      console.error('Failed to acknowledge PO:', err);
      message.error('Failed to acknowledge Purchase Order.');
    } finally {
      setSubmittingAck(false);
    }
  };

  const sellerDisplayName = sellerParty?.display_name || `Seller (${purchaseOrder.seller_party_id})`;
  const buyerDisplayName = buyerParty?.display_name || rfq.requester_name || 'Enterprise Buyer Organization';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Tier 1: Static Semantic Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
            Purchase Order Receipt & Formal Acknowledgment
          </h1>
          <p className="text-slate-500 text-sm mt-1 m-0">
            Review buyer purchase order specifications, commercial terms, and submit formal supplier acknowledgment.
          </p>
        </div>
        <Space>
          <Button
            onClick={() => navigate(`${basePath}/${rfqId}`)}
            icon={<ArrowLeftOutlined />}
            className="text-slate-600 font-medium border-slate-200 shadow-xs hover:text-slate-900"
          >
            Return to RFQ
          </Button>
        </Space>
      </div>

      {/* Tier 2: Lifecycle State Banner */}
      {isAcknowledged ? (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined className="text-emerald-600" />}
          message={
            <span className="font-bold text-slate-800">
              Purchase Order Formally Acknowledged on{' '}
              {existingAcknowledgement?.seller_acknowledged_at
                ? new Date(existingAcknowledgement.seller_acknowledged_at).toLocaleDateString()
                : 'Confirmed Date'}
            </span>
          }
          description={
            <div className="text-xs text-slate-600 mt-1">
              You have confirmed receipt and committed to the terms of this Purchase Order. Production and dispatch should
              proceed according to the agreed schedule.
              {existingAcknowledgement?.seller_note && (
                <div className="mt-1 font-mono text-slate-700 bg-white/70 p-2 rounded border border-emerald-200">
                  Note: "{existingAcknowledgement.seller_note}"
                </div>
              )}
            </div>
          }
          className="border-emerald-200 bg-emerald-50/70 rounded-xl"
        />
      ) : (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined className="text-indigo-600" />}
          message={<span className="font-bold text-slate-800">Action Required: Supplier PO Acknowledgment</span>}
          description="The buyer has issued this Purchase Order. Please verify all line items, quantities, agreed unit pricing, and shipping terms, then submit your formal acknowledgment below."
          className="border-slate-200 bg-slate-50/80 rounded-xl"
        />
      )}

      {/* Tier 3: Entity Overview Card */}
      <Card size="small" className="border-slate-200/80 shadow-xs rounded-xl bg-white">
        <Descriptions
          bordered
          size="small"
          column={{ md: 3, sm: 2, xs: 1 }}
          classNames={{
            label: 'text-xs px-3 py-1.5 font-semibold text-slate-600 bg-slate-50',
          }}
          className="bg-white"
        >
          <Descriptions.Item label="PO Identifier">
            <span className="font-mono font-bold text-slate-900 text-xs">{purchaseOrder.po_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Buyer Organization">
            <span className="font-medium text-slate-800 text-xs">{buyerDisplayName}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Target RFQ">
            <span className="font-mono text-slate-700 text-xs">{rfq.rfq_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Date Issued">
            <span className="font-medium text-slate-800 text-xs">
              {purchaseOrder.po_released_at
                ? new Date(purchaseOrder.po_released_at).toLocaleDateString()
                : new Date(purchaseOrder.created_at).toLocaleDateString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Contract Value">
            <strong className="font-mono font-bold text-slate-900 text-xs">
              {formatCurrency(purchaseOrder.total_amount, purchaseOrder.currency)} {purchaseOrder.currency}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Order Status">
            {isAcknowledged ? (
              <AntTag color="success" className="font-semibold text-[10px] m-0 px-2 py-0">
                ✓ SELLER ACKNOWLEDGED
              </AntTag>
            ) : (
              <AntTag color="processing" className="font-semibold text-[10px] m-0 px-2 py-0">
                AWAITING ACKNOWLEDGMENT
              </AntTag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tier 4: Primary Workspace - Line Items & Specifications Table */}
      <Card
        size="small"
        className="border-slate-200/90 shadow-xs rounded-xl bg-white overflow-hidden"
        title={
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">
              Purchased Line Items ({purchaseOrderItems.length})
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Agreed specifications & contracted volumes
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          <Table
            dataSource={purchaseOrderItems}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 750 }}
            columns={[
              {
                title: '#',
                key: 'sno',
                width: 45,
                align: 'center' as const,
                render: (_: any, __: any, idx: number) => (
                  <span className="font-semibold text-xs text-slate-500">#{idx + 1}</span>
                ),
              },
              {
                title: 'Item & Specifications',
                key: 'product',
                render: (_: any, record: PurchaseOrderItem) => (
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{record.product_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{record.specifications}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKU: {record.sku} • {record.manufacturer} ({record.brand})
                    </div>
                  </div>
                ),
              },
              {
                title: 'Source Quote',
                key: 'quote',
                width: 140,
                render: (_: any, record: PurchaseOrderItem) => {
                  const quoteNum =
                    record.seller_quote_number ||
                    (record.seller_quote_id ? quotesMap.get(record.seller_quote_id)?.seller_quote_number : undefined);
                  return (
                    <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {quoteNum || 'Agreed Quote'}
                    </span>
                  );
                },
              },
              {
                title: 'Ordered Qty',
                key: 'quantity',
                width: 120,
                align: 'right' as const,
                render: (_: any, record: PurchaseOrderItem) => (
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {record.buyer_target_quantity.toLocaleString()} {record.unit_of_measure || 'PCS'}
                  </span>
                ),
              },
              {
                title: 'Contract Price',
                dataIndex: 'unit_price',
                key: 'unit_price',
                width: 120,
                align: 'right' as const,
                render: (price: number) => (
                  <span className="font-mono font-medium text-slate-700 text-xs">
                    {formatCurrency(price, purchaseOrder.currency)}
                  </span>
                ),
              },
              {
                title: 'Subtotal',
                dataIndex: 'total_price',
                key: 'total_price',
                width: 130,
                align: 'right' as const,
                render: (total: number) => (
                  <strong className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(total, purchaseOrder.currency)}
                  </strong>
                ),
              },
            ]}
          />

          {/* Grouped Commercial Terms Strip */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-slate-700">
              <div>
                <span className="text-slate-400 font-medium">Payment Terms:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {purchaseOrder.payment_terms || 'Net 30 Days from Invoice Date'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Incoterms:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {purchaseOrder.incoterms || 'FOB Port of Origin'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Shipping Method:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {purchaseOrder.shipping_method || 'Express Freight Direct Delivery'}
                </span>
              </div>
            </div>
            {purchaseOrder.delivery_notes && (
              <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                <span className="text-slate-400 font-medium">Buyer Delivery Notes:</span> {purchaseOrder.delivery_notes}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tier 5: Communication & Formal Sign-off Card */}
      <Card
        size="small"
        className="border-slate-200/90 shadow-xs rounded-xl bg-white"
        title={
          <div className="flex items-center gap-2">
            <FileProtectOutlined className="text-slate-700" />
            <span className="font-bold text-xs text-slate-900">Supplier Acknowledgment & Commitment</span>
          </div>
        }
      >
        <div className="space-y-4">
          {!isAcknowledged ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Supplier Acknowledgment Note (Optional):
              </label>
              <Input.TextArea
                rows={3}
                placeholder="e.g. Purchase order received and confirmed. Manufacturing slot scheduled. Anticipated delivery timeline complies with requirements."
                value={acknowledgementNote}
                onChange={e => setAcknowledgementNote(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-slate-500 m-0">
                By clicking "Acknowledge & Confirm PO Receipt", you formally accept this purchase order and confirm that
                fulfillment will proceed according to the stated terms.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircleOutlined className="text-emerald-600" />
                <span>
                  Supplier Acknowledgment Confirmed by <strong>{sellerDisplayName}</strong>
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Formal acknowledgment committed into platform audit registry.
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <Space>
              <Button
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                className="text-xs font-medium text-slate-700"
              >
                Print PO Document
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => message.info(`Downloading official PDF for ${purchaseOrder.po_number}...`)}
                className="text-xs font-medium text-slate-700"
              >
                Download PDF
              </Button>
            </Space>

            {!isAcknowledged && (
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={submittingAck}
                onClick={handleAcknowledgePo}
                className="text-xs font-semibold"
              >
                Acknowledge & Confirm PO Receipt
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerPurchaseOrderReceipt;
