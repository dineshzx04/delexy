import React, { useState } from 'react';
import { Drawer, Button, Input, InputNumber, Form, Card, Tag, Timeline, App as AntApp } from 'antd';
import { DollarOutlined, SendOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ItemSupplierResponse, CommercialNegotiationRound } from '../../data/rfq';

interface CommercialNegotiationDrawerProps {
  visible: boolean;
  onClose: () => void;
  response: ItemSupplierResponse;
  currentPartyId: string;
  currentUserId: string;
  currentUserName: string;
  onSendCounterOffer: (responseId: string, round: CommercialNegotiationRound) => void;
}

export const CommercialNegotiationDrawer: React.FC<CommercialNegotiationDrawerProps> = ({
  visible,
  onClose,
  response,
  currentPartyId,
  currentUserId,
  currentUserName,
  onSendCounterOffer,
}) => {
  const [form] = Form.useForm();
  const { message: antMessage } = AntApp.useApp();
  const [submitting, setSubmitting] = useState(false);

  const negotiationHistory = response.commercial_negotiation_rounds || [];
  const lastOffer = negotiationHistory[negotiationHistory.length - 1];

  const handleFinish = (values: any) => {
    setSubmitting(true);
    try {
      const newRound: CommercialNegotiationRound = {
        round_number: (negotiationHistory.length || 0) + 1,
        sender_party_id: currentPartyId,
        sender_user_id: currentUserId,
        sender_name: currentUserName,
        unit_price: values.unit_price,
        quantity: values.quantity,
        remarks: values.remarks,
        timestamp: new Date().toISOString(),
      };

      onSendCounterOffer(response.id, newRound);
      antMessage.success('Counter-offer submitted successfully!');
      form.resetFields();
    } catch (err) {
      antMessage.error('Failed to submit counter-offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-amber-500 text-xl" />
          <div>
            <div className="font-bold text-slate-900">Commercial Counter-Offer Negotiation</div>
            <div className="text-xs text-slate-500 font-normal">
              Supplier: <span className="font-semibold text-slate-800">{response.seller_party_name}</span>
            </div>
          </div>
        </div>
      }
      width={540}
      open={visible}
      onClose={onClose}
      bodyStyle={{ backgroundColor: '#f8fafc', padding: 20 }}
    >
      {/* Current Terms Summary Header */}
      <Card className="mb-4 border-slate-200 shadow-sm bg-white">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Latest Agreed / Offered Terms
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="text-xs text-slate-500">Unit Price ($)</div>
            <div className="text-lg font-bold text-emerald-600">
              ${lastOffer?.unit_price ?? response.commercial_terms?.offered_unit_price ?? 0}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="text-xs text-slate-500">Offered Quantity</div>
            <div className="text-lg font-bold text-slate-800">
              {lastOffer?.quantity ?? response.commercial_terms?.offered_unit_price ?? 0} Units
            </div>
          </div>
        </div>
      </Card>

      {/* Negotiation History Log */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ClockCircleOutlined /> Negotiation History Log ({negotiationHistory.length} Rounds)
        </div>

        {negotiationHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">No counter-offers logged yet.</div>
        ) : (
          <Timeline
            items={negotiationHistory.map((round) => {
              const isMe = round.sender_party_id === currentPartyId;
              return {
                color: isMe ? 'blue' : 'green',
                children: (
                  <div className={`p-3 rounded-lg border ${isMe ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                        <UserOutlined /> {round.sender_name} {isMe && '(You)'}
                      </span>
                      <Tag color={isMe ? 'blue' : 'green'}>Round {round.round_number}</Tag>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">
                      ${round.unit_price} / unit × {round.quantity} units = ${(round.unit_price * round.quantity).toLocaleString()}
                    </div>
                    {round.remarks && <div className="text-xs text-slate-600 mt-1.5 bg-white p-2 rounded border border-slate-200">{round.remarks}</div>}
                    <div className="text-[10px] text-slate-400 mt-2">{new Date(round.timestamp).toLocaleString()}</div>
                  </div>
                ),
              };
            })}
          />
        )}
      </div>

      {/* Form to submit new counter-offer */}
      <Card className="border-slate-200 shadow-sm bg-white" title={<span className="text-sm font-bold">Submit New Counter-Offer</span>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            unit_price: lastOffer?.unit_price ?? response.commercial_terms?.offered_unit_price ?? 1000,
            quantity: lastOffer?.quantity ?? 60,
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="unit_price" label="Target Unit Price ($)" rules={[{ required: true, message: 'Enter unit price' }]}>
              <InputNumber min={1} className="w-full" prefix="$" />
            </Form.Item>
            <Form.Item name="quantity" label="Proposed Quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
              <InputNumber min={1} className="w-full" suffix="Units" />
            </Form.Item>
          </div>

          <Form.Item name="remarks" label="Negotiation Notes / Counter Remarks">
            <Input.TextArea rows={3} placeholder="Explain reason for price/qty counter-offer..." />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={submitting} block icon={<SendOutlined />} className="bg-blue-600 hover:bg-blue-700 h-10 font-bold">
            Send Counter-Offer
          </Button>
        </Form>
      </Card>
    </Drawer>
  );
};
