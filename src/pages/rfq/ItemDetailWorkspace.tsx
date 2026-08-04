import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag, Button, Breadcrumb, Table, Space, message } from 'antd';
import {
  ToolOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { rfqDb, type CommercialNegotiationRound } from '../../data/rfq';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge, ItemSupplierStatusBadge } from '../../components/rfq/RfqStatusBadge';
import { TechnicalComparisonTable } from '../../components/rfq/TechnicalComparisonTable';
import { CommercialNegotiationDrawer } from '../../components/rfq/CommercialNegotiationDrawer';
import { SplitOrderAwardDrawer } from '../../components/rfq/SplitOrderAwardDrawer';

export const ItemDetailWorkspace: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const [activeTab, setActiveTab] = useState('comparison');
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [negotiationDrawerOpen, setNegotiationDrawerOpen] = useState(false);
  const [awardDrawerOpen, setAwardDrawerOpen] = useState(false);

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfqItems.get(itemId) : undefined), [itemId]);
  const responses = useLiveQuery(() => (itemId ? rfqDb.itemSupplierResponses.where('rfq_item_id').equals(itemId).toArray() : []), [itemId]) || [];

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

  const handleApproveTechnical = async (respId: string) => {
    try {
      await rfqDb.itemSupplierResponses.update(respId, {
        status: 'TECHNICAL_APPROVED',
        updated_at: new Date().toISOString(),
      });
      message.success('Technical response approved! Supplier can now complete product mapping.');
    } catch (err) {
      message.error('Failed to approve technical response');
    }
  };

  const handleApproveProductMapping = async (respId: string) => {
    try {
      const resp = responses.find((r) => r.id === respId);
      if (resp?.product_mapping) {
        await rfqDb.itemSupplierResponses.update(respId, {
          status: 'COMMERCIAL_UNDER_NEGOTIATION',
          product_mapping: { ...resp.product_mapping, is_buyer_approved: true },
          updated_at: new Date().toISOString(),
        });
        message.success('Product mapping approved! Commercial negotiation opened.');
      }
    } catch (err) {
      message.error('Failed to approve product mapping');
    }
  };

  const handleSendCounterOffer = async (respId: string, round: CommercialNegotiationRound) => {
    try {
      const resp = responses.find((r) => r.id === respId);
      if (resp) {
        const history = [...(resp.commercial_negotiation_rounds || []), round];
        await rfqDb.itemSupplierResponses.update(respId, {
          commercial_negotiation_rounds: history,
          status: 'COMMERCIAL_UNDER_NEGOTIATION',
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      message.error('Failed to record counter offer');
    }
  };

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

          await rfqDb.itemSupplierResponses.update(alloc.responseId, {
            status: 'AWARDED',
            is_awarded: true,
            awarded_quantity: alloc.awardedQty,
            awarded_unit_price: alloc.unitPrice,
            awarded_total_amount: subtotal,
          });
        }
      }

      await rfqDb.rfqItems.update(item.id, {
        status: totalQty >= item.quantity ? 'FULLY_AWARDED' : 'PARTIALLY_AWARDED',
        awarded_quantity_total: totalQty,
      });

      message.success('Multi-supplier split order awards granted!');
    } catch (err) {
      console.error(err);
      message.error('Failed to process split order awards');
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
      width: 190,
      render: (status: any) => <ItemSupplierStatusBadge status={status} />,
    },
    {
      title: 'Product Mapping',
      key: 'mapping',
      width: 220,
      render: (_: any, record: any) => {
        if (!record.product_mapping?.seller_product_id) {
          return <span className="text-xs text-slate-400 italic">Not mapped yet</span>;
        }
        return (
          <div>
            <div className="text-xs font-semibold text-purple-700">{record.product_mapping.seller_product_id}</div>
            <div className="text-[10px] text-slate-500">Variant: {record.product_mapping.variant_id}</div>
          </div>
        );
      },
    },
    {
      title: 'Offered Price ($)',
      key: 'price',
      width: 140,
      render: (_: any, record: any) => {
        const lastOffer = record.commercial_negotiation_rounds?.[record.commercial_negotiation_rounds.length - 1];
        const price = lastOffer?.unit_price ?? record.commercial_terms?.offered_unit_price ?? '-';
        return <span className="font-bold text-emerald-600">${price}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'TECHNICAL_SUBMITTED' && (
            <Button type="primary" size="small" onClick={() => handleApproveTechnical(record.id)} icon={<CheckCircleOutlined />}>
              Approve Tech
            </Button>
          )}

          {record.status === 'PRODUCT_MAPPED' && (
            <Button type="primary" size="small" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleApproveProductMapping(record.id)}>
              Approve Product
            </Button>
          )}

          <Button
            size="small"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedResponse(record);
              setNegotiationDrawerOpen(true);
            }}
          >
            Negotiate
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
              key: 'comparison',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <ToolOutlined /> Technical Comparison
                </span>
              ),
              children: <TechnicalComparisonTable item={item} responses={responses} />,
            },
            {
              key: 'responses',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <SafetyCertificateOutlined /> Assigned Suppliers ({responses.length})
                </span>
              ),
              children: <Table dataSource={responses} columns={responseColumns} rowKey="id" pagination={false} />,
            },
          ]}
        />
      </Card>

      {selectedResponse && (
        <CommercialNegotiationDrawer
          visible={negotiationDrawerOpen}
          onClose={() => setNegotiationDrawerOpen(false)}
          response={selectedResponse}
          currentPartyId="pty-1"
          currentUserId="usr-2"
          currentUserName="John Doe"
          onSendCounterOffer={handleSendCounterOffer}
        />
      )}

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
