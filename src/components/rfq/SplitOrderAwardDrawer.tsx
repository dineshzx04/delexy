import React, { useState } from 'react';
import { Drawer, Button, InputNumber, Card, Tag, Table, Alert, message } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, InfoCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { RfqItem, ItemSupplierResponse } from '../../data/rfq';

interface SplitOrderAwardDrawerProps {
  visible: boolean;
  onClose: () => void;
  item: RfqItem;
  responses: ItemSupplierResponse[];
  onGrantSplitAwards: (allocations: { responseId: string; awardedQty: number; unitPrice: number }[]) => void;
}

export const SplitOrderAwardDrawer: React.FC<SplitOrderAwardDrawerProps> = ({
  visible,
  onClose,
  item,
  responses,
  onGrantSplitAwards,
}) => {
  const eligibleResponses = responses.filter(
    (r) => r.status === 'COMMERCIAL_FINALIZED' || r.status === 'COMMERCIAL_UNDER_NEGOTIATION' || r.status === 'AWARDED' || r.status === 'PRODUCT_MAPPED'
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (eligibleResponses.length > 0) {
      initial[eligibleResponses[0].id] = eligibleResponses[0].awarded_quantity ?? 60;
      if (eligibleResponses.length > 1) {
        initial[eligibleResponses[1].id] = eligibleResponses[1].awarded_quantity ?? 40;
      }
    }
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);

  const totalAllocatedQty = Object.values(quantities).reduce((acc, val) => acc + (val || 0), 0);
  const remainingQty = item.quantity - totalAllocatedQty;
  const isAllocationValid = totalAllocatedQty === item.quantity;

  const handleQtyChange = (responseId: string, value: number | null) => {
    setQuantities((prev) => ({
      ...prev,
      [responseId]: value || 0,
    }));
  };

  const handleAwardClick = () => {
    if (!isAllocationValid) {
      message.error(`Total awarded quantity (${totalAllocatedQty}) must equal total requested quantity (${item.quantity}).`);
      return;
    }

    setSubmitting(true);
    try {
      const allocations = eligibleResponses.map((resp) => {
        const lastOffer = resp.commercial_negotiation_rounds?.[resp.commercial_negotiation_rounds.length - 1];
        const unitPrice = lastOffer?.unit_price ?? resp.commercial_terms?.offered_unit_price ?? 1000;
        return {
          responseId: resp.id,
          awardedQty: quantities[resp.id] || 0,
          unitPrice,
        };
      });

      onGrantSplitAwards(allocations);
      message.success('Multi-supplier split order awards granted & Purchase Orders generated!');
      onClose();
    } catch (err) {
      message.error('Failed to grant split awards');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Supplier Party',
      dataIndex: 'seller_party_name',
      key: 'seller_party_name',
      render: (text: string, record: ItemSupplierResponse) => (
        <div>
          <div className="font-bold text-slate-900">{text}</div>
          <div className="text-xs text-slate-500">
            Mapped Product: <span className="font-semibold text-purple-700">{record.product_mapping?.seller_product_id ?? 'sprod-1'}</span> (Variant: {record.product_mapping?.variant_id ?? 'sprod-1-v1'})
          </div>
        </div>
      ),
    },
    {
      title: 'Final Unit Price',
      key: 'unit_price',
      width: 140,
      render: (_: any, record: ItemSupplierResponse) => {
        const lastOffer = record.commercial_negotiation_rounds?.[record.commercial_negotiation_rounds.length - 1];
        const price = lastOffer?.unit_price ?? record.commercial_terms?.offered_unit_price ?? 1000;
        return <span className="font-bold text-emerald-600 text-base">${price}</span>;
      },
    },
    {
      title: 'Award Quantity Split',
      key: 'award_qty',
      width: 180,
      render: (_: any, record: ItemSupplierResponse) => {
        return (
          <InputNumber
            min={0}
            max={item.quantity}
            value={quantities[record.id] || 0}
            onChange={(val) => handleQtyChange(record.id, val)}
            className="w-full"
            addonAfter="Units"
          />
        );
      },
    },
    {
      title: 'Split Subtotal ($)',
      key: 'subtotal',
      width: 150,
      render: (_: any, record: ItemSupplierResponse) => {
        const lastOffer = record.commercial_negotiation_rounds?.[record.commercial_negotiation_rounds.length - 1];
        const price = lastOffer?.unit_price ?? record.commercial_terms?.offered_unit_price ?? 1000;
        const qty = quantities[record.id] || 0;
        return <span className="font-bold text-slate-900">${(price * qty).toLocaleString()}</span>;
      },
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-amber-500 text-2xl" />
          <div>
            <div className="font-bold text-slate-900 text-lg">Multi-Supplier Split Order Award Hub</div>
            <div className="text-xs text-slate-500 font-normal">
              Item: <span className="font-semibold text-slate-800">{item.product_name}</span> | Required Qty: <span className="font-bold text-blue-600">{item.quantity} Units</span>
            </div>
          </div>
        </div>
      }
      width={720}
      open={visible}
      onClose={onClose}
      bodyStyle={{ backgroundColor: '#f8fafc', padding: 24 }}
    >
      <Alert
        type={isAllocationValid ? 'success' : 'warning'}
        showIcon
        icon={isAllocationValid ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
        message={
          <div className="flex items-center justify-between font-medium">
            <span>
              Total Allocated: <strong className="text-slate-900">{totalAllocatedQty}</strong> / {item.quantity} Units
            </span>
            {remainingQty !== 0 && (
              <Tag color={remainingQty > 0 ? 'volcano' : 'error'}>
                {remainingQty > 0 ? `${remainingQty} Units Unallocated` : `${Math.abs(remainingQty)} Units Over-allocated`}
              </Tag>
            )}
          </div>
        }
        className="mb-6 shadow-sm border-slate-200"
      />

      <Card className="mb-6 border-slate-200 shadow-sm bg-white" title={<span className="font-bold text-slate-900">Technically Approved & Commercially Finalized Suppliers</span>}>
        <Table
          dataSource={eligibleResponses}
          columns={columns}
          pagination={false}
          rowKey="id"
          bordered
        />
      </Card>

      <Card className="mb-6 border-slate-200 bg-slate-900 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Award Grand Total</div>
            <div className="text-2xl font-black text-emerald-400">
              ${eligibleResponses.reduce((acc, resp) => {
                const lastOffer = resp.commercial_negotiation_rounds?.[resp.commercial_negotiation_rounds.length - 1];
                const price = lastOffer?.unit_price ?? resp.commercial_terms?.offered_unit_price ?? 1000;
                return acc + (price * (quantities[resp.id] || 0));
              }, 0).toLocaleString()}
            </div>
          </div>
          <Tag color="green" icon={<SafetyCertificateOutlined className="text-lg" />} className="px-3 py-1 text-sm font-bold">
            Split Award Ready
          </Tag>
        </div>
      </Card>

      <Button
        type="primary"
        size="large"
        block
        disabled={!isAllocationValid}
        loading={submitting}
        onClick={handleAwardClick}
        icon={<TrophyOutlined />}
        className="bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold shadow-md"
      >
        Grant Split Order Awards & Issue Purchase Orders
      </Button>
    </Drawer>
  );
};
