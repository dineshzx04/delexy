import React, { useState } from 'react';
import { Drawer, Button, InputNumber, Card, Tag, Table, Alert, App as AntApp } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import type { RfqItem, SellerQuote } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';

interface SplitOrderAwardDrawerProps {
  visible: boolean;
  onClose: () => void;
  item: RfqItem;
  quotes: SellerQuote[];
  onGrantSplitAwards: (allocations: { quoteId: string; awardedQty: number; unitPrice: number }[]) => void;
}

export const SplitOrderAwardDrawer: React.FC<SplitOrderAwardDrawerProps> = ({
  visible,
  onClose,
  item,
  quotes,
  onGrantSplitAwards,
}) => {
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  // Only quotes that are submitted/finalized are eligible for awards
  const eligibleQuotes = quotes.filter(
    (q) => q.status === 'SUBMITTED' || q.status === 'FINALIZED'
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (eligibleQuotes.length > 0) {
      initial[eligibleQuotes[0].id] = item.quantity;
    }
    return initial;
  });

  const { message: antMessage } = AntApp.useApp();
  const [submitting, setSubmitting] = useState(false);

  const totalAllocatedQty = Object.values(quantities).reduce((acc, val) => acc + (val || 0), 0);
  const remainingQty = item.quantity - totalAllocatedQty;
  const isAllocationValid = totalAllocatedQty === item.quantity;

  const handleQtyChange = (quoteId: string, value: number | null) => {
    setQuantities((prev) => ({
      ...prev,
      [quoteId]: value || 0,
    }));
  };

  const handleAwardClick = () => {
    if (!isAllocationValid) {
      antMessage.error(`Total awarded quantity (${totalAllocatedQty}) must equal total requested quantity (${item.quantity}).`);
      return;
    }

    setSubmitting(true);
    try {
      const allocations = eligibleQuotes.map((q) => {
        const unitPrice = q.unit_price || 0;
        return {
          quoteId: q.id,
          awardedQty: quantities[q.id] || 0,
          unitPrice,
        };
      });

      onGrantSplitAwards(allocations);
      antMessage.success('Multi-supplier split order awards granted & Purchase Orders generated!');
      onClose();
    } catch (err) {
      antMessage.error('Failed to grant split awards');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Supplier Party',
      dataIndex: 'seller_id',
      key: 'seller_id',
      render: (sellerId: string, record: SellerQuote) => {
        const party = parties.find((p) => p.id === sellerId) || { display_name: `Seller ${sellerId}` };
        return (
          <div>
            <div className="font-bold text-slate-900">{party.display_name}</div>
            {record.seller_product_mapping && (
              <div className="text-xs text-slate-500">
                Mapped Product: <span className="font-semibold text-purple-700">{record.seller_product_mapping.seller_product_id}</span> (Variant: {record.seller_product_mapping.variant_id})
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Final Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 140,
      render: (price: number) => {
        return <span className="font-bold text-emerald-600 text-base">${price}</span>;
      },
    },
    {
      title: 'Allocated Award Qty',
      key: 'allocated_qty',
      width: 180,
      render: (_: any, record: SellerQuote) => (
        <InputNumber
          min={0}
          max={item.quantity}
          value={quantities[record.id] || 0}
          onChange={(val) => handleQtyChange(record.id, val)}
          className="w-full"
          placeholder="Enter quantity"
        />
      ),
    },
    {
      title: 'Subtotal Amount',
      key: 'subtotal',
      width: 150,
      render: (_: any, record: SellerQuote) => {
        const qty = quantities[record.id] || 0;
        const price = record.unit_price || 0;
        return <span className="font-semibold text-slate-700">${(qty * price).toLocaleString()}</span>;
      },
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-amber-500" />
          <span className="font-black text-slate-800 text-base">Grant Split Order Awards</span>
        </div>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={visible}
      destroyOnClose
      bodyStyle={{ backgroundColor: '#f8fafc', padding: '20px' }}
    >
      <div className="space-y-4">
        <Card className="shadow-2xs border-amber-100 bg-amber-50/50">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Line Item Summary</span>
            <h3 className="text-lg font-black text-slate-900 leading-tight m-0">{item.product_name}</h3>
            <div className="flex items-center gap-6 mt-2 text-xs font-semibold text-slate-600">
              <div>Total Quantity Required: <span className="text-blue-600 font-bold text-sm">{item.quantity} {item.unit}</span></div>
              <div>Target Unit Price: <span className="text-emerald-600 font-bold text-sm">${item.target_unit_price}</span></div>
            </div>
          </div>
        </Card>

        {eligibleQuotes.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            message="No Eligible Quotes Found"
            description="Only quotes that have been submitted can be awarded."
          />
        ) : (
          <>
            <Card title={<span className="font-bold text-sm text-slate-900">Configure Supplier Allocations</span>} className="shadow-sm">
              <Table
                dataSource={eligibleQuotes}
                columns={columns}
                rowKey="id"
                pagination={false}
                bordered
              />
            </Card>

            {/* ALLOCATION AUDIT BAR */}
            <Card className={`shadow-sm border-l-4 ${isAllocationValid ? 'border-l-emerald-500 bg-emerald-50/20' : 'border-l-red-500 bg-red-50/20'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold text-slate-700">
                <div className="space-y-0.5">
                  <div>Allocated Qty: <span className={isAllocationValid ? 'text-emerald-600 text-sm' : 'text-red-600 text-sm'}>{totalAllocatedQty} / {item.quantity} {item.unit}</span></div>
                  <div>Remaining Qty: <span className={remainingQty === 0 ? 'text-slate-600' : 'text-amber-600'}>{remainingQty} {item.unit}</span></div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  disabled={!isAllocationValid}
                  loading={submitting}
                  icon={<CheckCircleOutlined />}
                  onClick={handleAwardClick}
                  className="bg-slate-900 hover:bg-slate-800 font-bold"
                >
                  Finalize Awards
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </Drawer>
  );
};
