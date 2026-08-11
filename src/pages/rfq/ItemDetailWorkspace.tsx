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
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge, ItemSupplierStatusBadge } from '../../components/rfq/RfqStatusBadge';
import { TechnicalComparisonTable } from '../../components/rfq/TechnicalComparisonTable';
import { BuyerTechnicalReviewDrawer } from '../../components/rfq/BuyerTechnicalReviewDrawer';
import { SplitOrderAwardDrawer } from '../../components/rfq/SplitOrderAwardDrawer';
import { businessDb } from '../../data/business/business.db';

export const ItemDetailWorkspace: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [activeTab, setActiveTab] = useState('responses');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [techReviewDrawerOpen, setTechReviewDrawerOpen] = useState(false);
  const [awardDrawerOpen, setAwardDrawerOpen] = useState(false);

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  const quotes = useLiveQuery(() => (itemId ? rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).toArray() : []), [itemId]) || [];
  const quoteRevisions = useLiveQuery(() => rfqDb.seller_quote_revisions.toArray(), []) || [];
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const categoryName = categories.find((c) => c.id === item?.category_id)?.name;
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const submittedResponses = React.useMemo(() => {
    return quotes
      .filter((q) => q.status === 'SUBMITTED' || q.status === 'FINALIZED')
      .map((q) => {
        const party = parties.find((p) => p.id === q.seller_id) || { display_name: `Seller ${q.seller_id}` };
        
        let mappedStatus = 'TECHNICAL_SUBMITTED';
        if (q.status === 'FINALIZED') {
          mappedStatus = 'COMMERCIAL_FINALIZED';
        }

        return {
          ...q,
          seller_party_name: party.display_name,
          mapped_status: mappedStatus,
        };
      });
  }, [quotes, parties]);

  const assignedSuppliers = React.useMemo(() => {
    if (!item) return [];
    return (item.target_seller_party_ids || []).map((sellerId: string) => {
      const activeQuote = quotes.find((q) => q.seller_id === sellerId);
      const party = parties.find((p) => p.id === sellerId) || { display_name: `Seller ${sellerId}` };

      let mappedStatus = 'ASSIGNED';
      if (activeQuote) {
        if (activeQuote.status === 'FINALIZED') {
          mappedStatus = 'COMMERCIAL_FINALIZED';
        } else if (activeQuote.status === 'SUBMITTED') {
          mappedStatus = 'TECHNICAL_SUBMITTED';
        } else if (activeQuote.status === 'DRAFT') {
          mappedStatus = 'VIEWED';
        }
      }

      return {
        id: activeQuote?.id || `no-quote-${item.id}-${sellerId}`,
        seller_party_name: party.display_name,
        status: mappedStatus,
      };
    });
  }, [item, quotes, parties]);

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

  const handleGrantSplitAwards = async (allocations: { quoteId: string; awardedQty: number; unitPrice: number }[]) => {
    try {
      let totalQty = 0;
      for (const alloc of allocations) {
        if (alloc.awardedQty > 0) {
          totalQty += alloc.awardedQty;
          const awardId = `award-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const activeQuote = quotes.find((q) => q.id === alloc.quoteId);

          await rfqDb.rfq_awards.put({
            id: awardId,
            rfq_id: rfq.id,
            rfq_item_id: item.id,
            seller_party_id: activeQuote?.seller_id || 'pty-4',
            seller_product_id: 'sprod-1',
            variant_id: 'sprod-1-v1',
            awarded_quantity: alloc.awardedQty,
            unit_price: alloc.unitPrice,
            currency: 'USD',
            awarded_by_user_id: 'usr-2',
            awarded_at: new Date().toISOString(),
            status: 'PURCHASE_ORDER_GENERATED',
            purchase_order_id: `po-2026-${Math.floor(100 + Math.random() * 900)}`,
          });

          await rfqDb.seller_quotes.update(alloc.quoteId, {
            status: 'FINALIZED',
            updated_at: new Date().toISOString()
          });
        }
      }

      await rfqDb.rfq_items.update(item.id, {
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
      dataIndex: 'mapped_status',
      key: 'status',
      width: 220,
      render: (status: any) => <ItemSupplierStatusBadge status={status} />,
    },
    {
      title: 'Technical Round',
      key: 'round',
      width: 140,
      render: (_: any, record: any) => {
        const revisions = quoteRevisions.filter((r) => r.seller_quote_id === record.id);
        const maxRound = revisions.length > 0 ? Math.max(...revisions.map((r) => r.revision_number)) : 1;
        return <Tag color="cyan">Round #{maxRound}</Tag>;
      },
    },
    {
      title: 'Offered Price ($)',
      dataIndex: 'unit_price',
      key: 'price',
      width: 140,
      render: (price: number) => {
        return <span className="font-bold text-emerald-600">${price || '-'}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedQuoteId(record.id);
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
              <div>Required Qty: <strong className="text-blue-600 font-bold">{item.quantity} {item.unit}</strong></div>
              <div>Target Unit Price: <strong className="text-emerald-600 font-bold">${item.target_unit_price}</strong></div>
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
                  onReviewTechnical={(quoteId) => {
                    setSelectedQuoteId(quoteId);
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
        quoteId={selectedQuoteId}
        itemTitle={item.product_name}
      />

      <SplitOrderAwardDrawer
        visible={awardDrawerOpen}
        onClose={() => setAwardDrawerOpen(false)}
        item={item}
        quotes={quotes}
        onGrantSplitAwards={handleGrantSplitAwards}
      />
    </div>
  );
};
