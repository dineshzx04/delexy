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
import { rfqDb, type ItemSupplierResponse, type ItemSupplierResponseStatus, type TechnicalAttributeResponse } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
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
  const allResponses = useLiveQuery(() => rfqDb.sellerAttributeResponses.toArray(), []) || [];
  const allComments = useLiveQuery(() => (itemId ? rfqDb.itemAttributeComments.where('itemId').equals(itemId).toArray() : rfqDb.itemAttributeComments.toArray()), [itemId]) || [];
  const allHistory = useLiveQuery(() => (itemId ? rfqDb.itemAttributeChangeHistory.where('itemId').equals(itemId).toArray() : rfqDb.itemAttributeChangeHistory.toArray()), [itemId]) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const categoryName = categories.find((c) => c.id === item?.category_id)?.name;

  const responses = React.useMemo(() => {
    if (!item) return [];
    const sellerIds = item.target_seller_party_ids || [];
    return sellerIds.map((sellerId: string) => {
      const activeQuote = quotes.find((q) => q.sellerId === sellerId);
      const party = mockParties.find((p) => p.id === sellerId) || { display_name: `Seller ${sellerId}` };

      if (activeQuote) {
        let mappedStatus: ItemSupplierResponseStatus = 'TECHNICAL_SUBMITTED';
        if (activeQuote.status === 'FINALIZED') {
          mappedStatus = 'COMMERCIAL_FINALIZED';
        } else if (activeQuote.status === 'DRAFT') {
          mappedStatus = 'VIEWED';
        }

        // Fetch active offered specs and comments
        const quoteResponses = allResponses.filter(r => r.quoteId === activeQuote.id);
        const quoteComments = allComments.filter(c => c.quoteId === activeQuote.id);

        const supplierResponse: TechnicalAttributeResponse[] = quoteResponses.map(resp => {
          let attributeName = '';
          let key = '';

          if (resp.groupId === 'static') {
            attributeName = resp.attributeId === 'brand' ? 'Preferred Brand' : 'Preferred Manufacturer';
            key = `static-${resp.attributeId === 'brand' ? 'brand' : 'mfg'}`;
          } else {
            const attr = allAttributes.find(a => a.id === resp.attributeId);
            attributeName = attr?.name || attr?.label || resp.attributeId;
            key = `dyn-${resp.groupId}-${resp.attributeId}`;
          }

          const reqLabel = resp.buyerValue.map(v => v.valueLabel || v.valueId).join(', ') || '-';
          const offLabel = resp.value.map(v => v.valueLabel || v.valueId).join(', ') || '-';
          const isDev = resp.value.some((v) => !resp.buyerValue.some((r) => r.valueId === v.valueId)) ||
            resp.buyerValue.some((r) => !resp.value.some((v) => v.valueId === r.valueId));

          const sellerComment = quoteComments.find(c => c.groupId === resp.groupId && c.attributeId === resp.attributeId && c.senderType === 'SELLER' && c.round === activeQuote.round);
          const buyerComment = quoteComments.find(c => c.groupId === resp.groupId && c.attributeId === resp.attributeId && c.senderType === 'BUYER' && c.round === activeQuote.round);

          const commentsHistory = quoteComments
            .filter(c => c.groupId === resp.groupId && c.attributeId === resp.attributeId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(c => ({
              id: c.id,
              sender_role: c.senderType,
              sender_name: c.senderType === 'BUYER' ? 'Buyer' : 'Supplier',
              sender_user_id: c.senderId,
              comment: c.comment,
              timestamp: c.createdAt
            }));

          return {
            attribute_key: key,
            attribute_name: attributeName,
            requested_value: reqLabel,
            offered_value: offLabel,
            is_deviated: isDev,
            deviation_reason: sellerComment?.comment || '',
            buyer_status: buyerComment ? 'REVISION_REQUESTED' as const : (activeQuote.status === 'FINALIZED' ? 'APPROVED' as const : undefined),
            buyer_comment: buyerComment?.comment || '',
            comment_history: commentsHistory
          };
        });

        // Reconstruct historical rounds
        const quoteHistory = allHistory.filter(h => h.quoteId === activeQuote.id);
        const historyRoundsSet = new Set<number>();
        quoteHistory.forEach(h => historyRoundsSet.add(h.round));
        const historyRounds = Array.from(historyRoundsSet).sort((a, b) => a - b);

        const revisionRounds = historyRounds.map(rNum => {
          const roundHistories = quoteHistory.filter(h => h.round === rNum);
          const roundComments = quoteComments.filter(c => c.round === rNum);

          const roundSpecs: TechnicalAttributeResponse[] = roundHistories.map(h => {
            let attributeName = '';
            if (h.groupId === 'static') {
              attributeName = h.attributeId === 'brand' ? 'Preferred Brand' : 'Preferred Manufacturer';
            } else {
              const attr = allAttributes.find(a => a.id === h.attributeId);
              attributeName = attr?.name || attr?.label || h.attributeId;
            }

            const reqLabel = h.buyerValue.map(v => v.valueLabel || v.valueId).join(', ') || '-';
            const offLabel = h.value.map(v => v.valueLabel || v.valueId).join(', ') || '-';
            const isDev = h.value.some((v) => !h.buyerValue.some((r) => r.valueId === v.valueId)) ||
              h.buyerValue.some((r) => !h.value.some((v) => v.valueId === r.valueId));

            const sellerComment = roundComments.find(c => c.groupId === h.groupId && c.attributeId === h.attributeId && c.senderType === 'SELLER');
            const buyerComment = roundComments.find(c => c.groupId === h.groupId && c.attributeId === h.attributeId && c.senderType === 'BUYER');

            return {
              attribute_key: h.groupId === 'static' ? `static-${h.attributeId === 'brand' ? 'brand' : 'mfg'}` : `dyn-${h.groupId}-${h.attributeId}`,
              attribute_name: attributeName,
              requested_value: reqLabel,
              offered_value: offLabel,
              is_deviated: isDev,
              deviation_reason: sellerComment?.comment || '',
              buyer_status: buyerComment ? 'REVISION_REQUESTED' as const : 'APPROVED' as const,
              buyer_comment: buyerComment?.comment || '',
            };
          });

          return {
            round_number: rNum,
            submitted_by_user_id: `usr-${sellerId}`,
            submitted_at: roundHistories[0]?.archivedAt || new Date().toISOString(),
            buyer_requirement_snapshot: roundSpecs,
            supplier_response: roundSpecs,
            round_status: 'APPROVED' as any
          };
        });

        // Add the active current round
        const mappedRoundStatus = activeQuote.status === 'FINALIZED' ? 'APPROVED' as any : (activeQuote.status === 'SUBMITTED' ? 'PENDING' as any : 'REVISION_REQUESTED' as any);
        revisionRounds.push({
          round_number: activeQuote.round,
          submitted_by_user_id: `usr-${sellerId}`,
          submitted_at: new Date().toISOString(),
          buyer_requirement_snapshot: supplierResponse,
          supplier_response: supplierResponse,
          round_status: mappedRoundStatus
        });

        return {
          id: activeQuote.id,
          assignment_id: `sa-${item.id}-${sellerId}`,
          rfq_id: item.rfq_id || '',
          rfq_item_id: item.id,
          seller_party_id: sellerId,
          seller_party_name: party.display_name,
          supplier_user_id: `usr-${sellerId}`,
          status: mappedStatus,
          current_technical_round: activeQuote.round,
          technical_revision_rounds: revisionRounds,
          product_mapping: activeQuote.sellerProductMapping ? {
            seller_product_id: activeQuote.sellerProductMapping.seller_product_id,
            variant_id: activeQuote.sellerProductMapping.variant_id,
            mapped_at: activeQuote.sellerProductMapping.mapped_at,
            is_buyer_approved: activeQuote.sellerProductMapping.is_buyer_approved
          } : null,
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
          is_awarded: activeQuote.status === 'FINALIZED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ItemSupplierResponse;
      }
      else {
        return {
          id: `no-quote-${item.id}-${sellerId}`,
          assignment_id: `sa-${item.id}-${sellerId}`,
          rfq_id: item.rfq_id || '',
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
  }, [item, quotes, allResponses, allComments, allHistory, allAttributes]);

  const submittedResponses = React.useMemo(() => {
    return responses.filter((r: ItemSupplierResponse) => r.status !== 'ASSIGNED' && r.status !== 'VIEWED');
  }, [responses]);

  const assignedSuppliers = React.useMemo(() => {
    return responses.filter((r: ItemSupplierResponse) => r.status === 'ASSIGNED' || r.status === 'VIEWED');
  }, [responses]);

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

  const supplierColumns = [
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
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>RFQs</a> },
          { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq.rfq_number}</a> },
          { title: `Item ${item.item_index}: ${item.product_name}` },
        ]}
      />

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-md font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                Line Item #{item.item_index}
              </span>
              <h1 className="text-xl font-black text-slate-900">{item.product_name}</h1>
              <RfqItemStatusBadge status={item.status} />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-600 font-medium">
              <div>Category: <Tag color="purple">{categoryName}</Tag></div>
              <div>Required Qty: <strong className="text-blue-600  font-bold">{item.quantity} {item.unit_of_measure}</strong></div>
              <div>Target Unit Price: <strong className="text-emerald-600  font-bold">${item.target_unit_price}</strong></div>
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
                  <MessageOutlined /> Responses ({submittedResponses.length})
                </span>
              ),
              children: <Table dataSource={submittedResponses} columns={responseColumns} rowKey="id" pagination={false} />,
            },
            {
              key: 'suppliers',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <SafetyCertificateOutlined /> Assigned Suppliers ({assignedSuppliers.length})
                </span>
              ),
              children: <Table dataSource={assignedSuppliers} columns={supplierColumns} rowKey="id" pagination={false} />,
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
