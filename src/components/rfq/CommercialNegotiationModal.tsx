import React, { useState, useEffect } from 'react';
import { Modal, Card, Input, InputNumber, Button, Tag, Descriptions, Timeline, Alert, App as AntApp } from 'antd';
import {
  DollarOutlined,
  SendOutlined,
  HistoryOutlined,
  CheckCircleFilled,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { rfqDb, type ItemSupplierResponse, type CommercialNegotiationRound, type RfqItem } from '../../data/rfq';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface CommercialNegotiationModalProps {
  open: boolean;
  onClose: () => void;
  response: ItemSupplierResponse | null;
  item: RfqItem | null;
}

export const CommercialNegotiationModal: React.FC<CommercialNegotiationModalProps> = ({
  open,
  onClose,
  response,
  item,
}) => {
  const { currentUserId, currentUser, activeWorkspace } = useWorkspace();
  const { message: antMessage } = AntApp.useApp();
  const isBuyer = activeWorkspace?.type === 'BUSINESS' ? false : true; // Can act as buyer or seller context
  const [submitting, setSubmitting] = useState(false);

  const [unitPrice, setUnitPrice] = useState<number>(1000);
  const [quantity, setQuantity] = useState<number>(60);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    if (response) {
      setUnitPrice(response.commercial_terms?.offered_unit_price || item?.target_unit_price || 1000);
      setQuantity(response.awarded_quantity || item?.quantity || 60);
      setLeadTimeDays(response.commercial_terms?.lead_time_days || 5);
      setRemarks('');
    }
  }, [response, item]);

  if (!response || !item) return null;

  const rounds: CommercialNegotiationRound[] = response.commercial_negotiation_rounds || [];

  const handleSendOffer = async () => {
    setSubmitting(true);
    try {
      const senderRole = isBuyer ? 'BUYER' : 'SELLER';
      const senderName = currentUser?.full_name || (isBuyer ? 'Requester Buyer' : response.seller_party_name);

      const nextRoundNum = rounds.length + 1;
      const newRound: CommercialNegotiationRound = {
        round_number: nextRoundNum,
        sender_party_id: isBuyer ? 'pty-1' : response.seller_party_id,
        sender_user_id: currentUserId || 'usr-1',
        sender_name: senderName,
        unit_price: unitPrice,
        quantity: quantity,
        lead_time_days: leadTimeDays,
        remarks: remarks || `Commercial negotiation round #${nextRoundNum}`,
        timestamp: new Date().toISOString(),
      };

      const updatedRounds = [...rounds, newRound];

      await rfqDb.itemSupplierResponses.update(response.id, {
        status: 'COMMERCIAL_UNDER_NEGOTIATION',
        commercial_terms: {
          offered_unit_price: unitPrice,
          discount_percent: response.commercial_terms?.discount_percent || 0,
          lead_time_days: leadTimeDays,
          moq: response.commercial_terms?.moq || 1,
          payment_terms: response.commercial_terms?.payment_terms || 'Net 30 Days',
          freight_terms: response.commercial_terms?.freight_terms || 'FOB Destination',
          warranty_terms: response.commercial_terms?.warranty_terms || '2 Years Factory Warranty',
          total_commercial_amount: unitPrice * quantity,
        },
        awarded_quantity: quantity,
        commercial_negotiation_rounds: updatedRounds,
        updated_at: new Date().toISOString(),
      });

      antMessage.success(`Commercial Counter-Offer Round #${nextRoundNum} submitted successfully!`);
      setRemarks('');
      onClose();
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to submit commercial offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-emerald-600" />
          <span className="font-bold text-slate-900">Commercial Negotiation & Volume Discount</span>
          <Tag color="purple">{response.seller_party_name}</Tag>
        </div>
      }
      width={750}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div className="space-y-5 py-2">
        {/* CONTEXT BANNER */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered className="bg-white">
            <Descriptions.Item label="Line Item">{item.product_name}</Descriptions.Item>
            <Descriptions.Item label="Target Price">{item.target_unit_price ? `$${item.target_unit_price}` : 'Open'}</Descriptions.Item>
            <Descriptions.Item label="Requested Qty"><strong>{item.quantity} {item.unit_of_measure}</strong></Descriptions.Item>
          </Descriptions>
        </div>

        {/* NEGOTIATION FORM */}
        <Card title={<span className="font-bold text-slate-900 text-sm">Submit Counter-Offer Terms</span>} className="shadow-sm border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Offered Unit Price ($) *</label>
              <InputNumber
                min={1}
                value={unitPrice}
                onChange={(val) => setUnitPrice(val || 0)}
                className="w-full mt-1"
                prefix="$"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Order Quantity *</label>
              <InputNumber
                min={1}
                value={quantity}
                onChange={(val) => setQuantity(val || 0)}
                className="w-full mt-1"
                suffix={item.unit_of_measure || 'Units'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Lead Time (Days) *</label>
              <InputNumber
                min={1}
                value={leadTimeDays}
                onChange={(val) => setLeadTimeDays(val || 0)}
                className="w-full mt-1"
                suffix="Days"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-700">Negotiation Remarks & Volume Discount Terms</label>
            <Input.TextArea
              rows={2}
              placeholder="e.g. 'If volume increased to 100 units, we can reduce price to $850/unit with FOB destination freight.'"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Calculated Commercial Amount:</span>
              <div className="text-lg font-bold text-emerald-600">${(unitPrice * quantity).toLocaleString()}</div>
            </div>
            <Button
              type="primary"
              size="large"
              loading={submitting}
              icon={<SendOutlined />}
              onClick={handleSendOffer}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              Submit Commercial Offer
            </Button>
          </div>
        </Card>

        {/* NEGOTIATION TIMELINE HISTORY */}
        {rounds.length > 0 && (
          <Card title={<span className="font-bold text-slate-900 text-sm flex items-center gap-2"><HistoryOutlined /> Negotiation History ({rounds.length} Rounds)</span>} className="shadow-sm border-slate-200">
            <Timeline
              items={rounds.map((r) => ({
                color: 'blue',
                children: (
                  <div key={r.round_number} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800">Round #{r.round_number} - {r.sender_name}</strong>
                      <span className="text-slate-400 font-mono text-[11px]">{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-emerald-700 font-bold text-sm">
                      ${r.unit_price} / unit × {r.quantity} {item.unit_of_measure} = ${(r.unit_price * r.quantity).toLocaleString()}
                    </div>
                    {r.remarks && <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 italic">{r.remarks}</div>}
                  </div>
                ),
              }))}
            />
          </Card>
        )}
      </div>
    </Modal>
  );
};
