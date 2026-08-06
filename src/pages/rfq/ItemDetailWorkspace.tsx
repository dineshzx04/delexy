import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag, Button, Breadcrumb, Table, Space, App as AntApp } from 'antd';
import {
  ToolOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { rfqDb, type ItemSupplierResponse, type ItemSupplierResponseStatus } from '../../data/rfq';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge, ItemSupplierStatusBadge } from '../../components/rfq/RfqStatusBadge';
import { TechnicalComparisonTable } from '../../components/rfq/TechnicalComparisonTable';
import { BuyerTechnicalReviewDrawer } from '../../components/rfq/BuyerTechnicalReviewDrawer';
import { SplitOrderAwardDrawer } from '../../components/rfq/SplitOrderAwardDrawer';
import { mockParties } from '../../data/business/parties';

export const ItemDetailWorkspace: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [activeTab, setActiveTab] = useState('responses');
  const [selectedResponse, setSelectedResponse] = useState<ItemSupplierResponse | null>(null);
  const [techReviewDrawerOpen, setTechReviewDrawerOpen] = useState(false);
  const [awardDrawerOpen, setAwardDrawerOpen] = useState(false);

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfqItems.get(itemId) : undefined), [itemId]);
  const quotes = useLiveQuery(() => (itemId ? rfqDb.sellerQuote.where('itemId').equals(itemId).toArray() : []), [itemId]) || [];

  const responses = React.useMemo(() => {
    if (!item) return [];
    const sellerIds = item.targettedSellerIds || item.target_seller_party_ids || [];
    return sellerIds.map((sellerId) => {
      const activeQuote = quotes.find((q) => q.sellerId === sellerId);
      const party = mockParties.find((p) => p.id === sellerId) || { display_name: `Seller ${sellerId}` };

      if (activeQuote) {
        let mappedStatus: ItemSupplierResponseStatus = 'TECHNICAL_SUBMITTED';
        if (activeQuote.status === 'FINALIZED') {
          mappedStatus = 'COMMERCIAL_FINALIZED';
        } else if (activeQuote.status === 'DRAFT') {
          mappedStatus = 'VIEWED';
        }

        return {
          id: activeQuote.id,
          assignment_id: `sa-${item.id}-${sellerId}`,
          rfq_id: item.rfqId || item.rfq_id || '',
          rfq_item_id: item.id,
          seller_party_id: sellerId,
          seller_party_name: party.display_name,
          supplier_user_id: `usr-${sellerId}`,
          status: mappedStatus,
          current_technical_round: activeQuote.round,
          technical_revision_rounds: [
            {
              round_number: activeQuote.round,
              submitted_by_user_id: `usr-${sellerId}`,
              submitted_at: new Date().toISOString(),
              buyer_requirement_snapshot: [],
              supplier_response: [],
              round_status: activeQuote.status === 'FINALIZED' ? 'APPROVED' : 'PENDING'
            }
          ],
          product_mapping: {
            seller_product_id: 'sprod-1',
            variant_id: 'sprod-1-v1',
            mapped_at: new Date().toISOString(),
            is_buyer_approved: true
          },
          commercial_terms: {
            offered_unit_price: activeQuote.unit_price,
            moq: 1,
            lead_time_days: 7,
            payment_terms: 'Net 30',
            freight_terms: 'FOB',
            warranty_terms: '1 Year',
            total_commercial_amount: activeQuote.unit_price * item.quantity
          },
          commercial_negotiation_rounds: [
            {
              round_number: activeQuote.round,
              sender_party_id: sellerId,
              sender_user_id: `usr-${sellerId}`,
              sender_name: party.display_name,
              unit_price: activeQuote.unit_price,
              quantity: item.quantity,
              timestamp: new Date().toISOString()
            }
          ],
          is_awarded: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ItemSupplierResponse;
      } else {
        return {
          id: `no-quote-${item.id}-${sellerId}`,
          assignment_id: `sa-${item.id}-${sellerId}`,
          rfq_id: item.rfqId || item.rfq_id || '',
          rfq_item_id: item.id,
          seller_party_id: sellerId,
          seller_party_name: party.display_name,
          supplier_user_id: `usr-${sellerId}`,
          status: 'ASSIGNED' as ItemSupplierResponseStatus,
          current_technical_round: 0,
          technical_revision_rounds: [],
          product_mapping: null,
          commercial_negotiation_rounds: [],
          is_awarded: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ItemSupplierResponse;
      }
    });
  }, [item, quotes]);

  if (!rfq || !item) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">Sourcing Item Not Found</h2>
        <Button className="mt-4" onClick={() => navigate(`${basePath}/${rfqId}`)}>
          Back to RFQ Workspace
        </Button>
      </div>
    );
  }

  const handleGrantSplitAwards = async (allocations: { responseId: string; awardedQty: number; unitPrice: number }[]) => {
    try {
      let totalQty = 0;
      for (const alloc of allocations) {
        if (alloc.awardedQty > 0) {
          totalQty += alloc.awardedQty;
          const awardId = `award-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const subtotal = alloc.awardedQty * alloc.unitPrice;

          await rfqDb.rfqAwards.put({
            id: awardId,
            rfq_id: rfq.id,
            rfq_item_id: item.id,
            item_supplier_response_id: alloc.responseId,
            seller_party_id: responses.find((r) => r.id === alloc.responseId)?.seller_party_id || 'pty-4',
            seller_product_id: 'sprod-1',
            variant_id: 'sprod-1-v1',
            awarded_quantity: alloc.awardedQty,
            awarded_unit_price: alloc.unitPrice,
            awarded_total_amount: subtotal,
            currency: 'USD',
            awarded_by_user_id: 'usr-2',
            awarded_at: new Date().toISOString(),
            status: 'PURCHASE_ORDER_GENERATED',
            purchase_order_id: `po-2026-${Math.floor(100 + Math.random() * 900)}`,
          });

          if (!alloc.responseId.startsWith('no-quote-')) {
            await rfqDb.sellerQuote.update(alloc.responseId, {
              status: 'FINALIZED',
            });
            await rfqDb.itemSupplierResponses.update(alloc.responseId, {
              status: 'AWARDED',
              is_awarded: true,
              awarded_quantity: alloc.awardedQty,
              awarded_unit_price: alloc.unitPrice,
              awarded_total_amount: subtotal,
            });
          }
        }
      }

      await rfqDb.rfqItems.update(item.id, {
        status: totalQty >= item.quantity ? 'FULLY_AWARDED' : 'PARTIALLY_AWARDED',
        awarded_quantity_total: totalQty,
      });

      antMessage.success('Multi-supplier split order awards granted!');
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to process split order awards');
    }
  };

  const responseColumns = [
    {
      title: 'Supplier Party',
      dataIndex: 'seller_party_name',
      key: 'seller_party_name',
      render: (text: string) => <span className="font-bold text-slate-900">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 220,
      render: (status: any) => <ItemSupplierStatusBadge status={status} />,
    },
    {
      title: 'Technical Round',
      key: 'round',
      width: 140,
      render: (_: any, record: ItemSupplierResponse) => (
        <Tag color="cyan">Round #{record.current_technical_round || 1}</Tag>
      ),
    },
    {
      title: 'Offered Price ($)',
      key: 'price',
      width: 140,
      render: (_: any, record: ItemSupplierResponse) => {
        const lastOffer = record.commercial_negotiation_rounds?.[record.commercial_negotiation_rounds.length - 1];
        const price = lastOffer?.unit_price ?? record.commercial_terms?.offered_unit_price ?? '-';
        return <span className="font-bold text-emerald-600">${price}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: ItemSupplierResponse) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedResponse(record);
              setTechReviewDrawerOpen(true);
            }}
            icon={<CheckCircleOutlined />}
          >
            Review Tech
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>RFQs</a> },
          { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq.rfq_number}</a> },
          { title: `Item #${item.item_index}: ${item.product_name}` },
        ]}
      />

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                Line Item #{item.item_index}
              </span>
              <h1 className="text-2xl font-black text-slate-900">{item.product_name}</h1>
              <RfqItemStatusBadge status={item.status} />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-600 font-medium">
              <div>Category: <Tag color="purple">{item.category_id}</Tag></div>
              <div>Required Qty: <strong className="text-blue-600 text-sm font-bold">{item.quantity} {item.unit_of_measure}</strong></div>
              <div>Target Unit Price: <strong className="text-emerald-600 text-sm font-bold">${item.target_unit_price}</strong></div>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={() => setAwardDrawerOpen(true)}
            icon={<TrophyOutlined />}
            className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5 font-bold shadow-md"
          >
            Split Award Hub
          </Button>
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'responses',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <SafetyCertificateOutlined /> Assigned Suppliers ({responses.length})
                </span>
              ),
              children: <Table dataSource={responses} columns={responseColumns} rowKey="id" pagination={false} />,
            },
            {
              key: 'comparison',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <ToolOutlined /> Technical Comparison
                </span>
              ),
              children: (
                <TechnicalComparisonTable
                  item={item}
                  responses={responses}
                  onReviewTechnical={(resp) => {
                    setSelectedResponse(resp);
                    setTechReviewDrawerOpen(true);
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <BuyerTechnicalReviewDrawer
        open={techReviewDrawerOpen}
        onClose={() => setTechReviewDrawerOpen(false)}
        response={selectedResponse}
        itemTitle={item.product_name}
      />

      <SplitOrderAwardDrawer
        visible={awardDrawerOpen}
        onClose={() => setAwardDrawerOpen(false)}
        item={item}
        responses={responses}
        onGrantSplitAwards={handleGrantSplitAwards}
      />
    </div>
  );
};
