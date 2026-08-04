import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input, InputNumber, Button, Switch, Alert, message, Divider, Breadcrumb } from 'antd';
import { SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { rfqDb, type TechnicalAttributeResponse } from '../../data/rfq';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const SupplierItemRespond: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/supplier' : '/user/supplier';

  const [submitting, setSubmitting] = useState(false);

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfqItems.get(itemId) : undefined), [itemId]);
  const response = useLiveQuery(
    () => (itemId ? rfqDb.itemSupplierResponses.where('rfq_item_id').equals(itemId).first() : undefined),
    [itemId]
  );

  // Dynamic specs map populated from item & previous response
  const [offeredSpecs, setOfferedSpecs] = useState<Record<string, { offered: string; isDeviated: boolean; reason: string }>>({});
  const [commercialTerms, setCommercialTerms] = useState({
    offered_unit_price: 1000,
    offered_quantity: 60,
    lead_time_days: 5,
  });

  useEffect(() => {
    if (item) {
      const initialSpecs: Record<string, { offered: string; isDeviated: boolean; reason: string }> = {};

      // Load from manufacturing inputs
      (item.manufacturing_inputs || []).forEach((input) => {
        initialSpecs[input.field_id] = {
          offered: String(input.value),
          isDeviated: false,
          reason: '',
        };
      });

      // Load existing supplier responses if present
      if (response && response.technical_revision_rounds && response.technical_revision_rounds.length > 0) {
        const lastRound = response.technical_revision_rounds[response.technical_revision_rounds.length - 1];
        (lastRound.supplier_response || []).forEach((resp) => {
          initialSpecs[resp.attribute_key] = {
            offered: String(resp.offered_value),
            isDeviated: resp.is_deviated,
            reason: resp.deviation_reason || '',
          };
        });
      }

      setOfferedSpecs(initialSpecs);

      if (response?.commercial_terms) {
        setCommercialTerms({
          offered_unit_price: response.commercial_terms.offered_unit_price || 1000,
          offered_quantity: response.awarded_quantity || 60,
          lead_time_days: response.commercial_terms.lead_time_days || 5,
        });
      }
    }
  }, [item, response]);

  if (!rfq || !item) {
    return <div className="p-12 text-center text-slate-500">Loading Sourcing Request...</div>;
  }

  const handleSubmitResponse = async () => {
    setSubmitting(true);
    try {
      const techResponses: TechnicalAttributeResponse[] = Object.entries(offeredSpecs).map(([key, val]) => {
        const inputField = (item.manufacturing_inputs || []).find((i) => i.field_id === key);
        return {
          attribute_key: key,
          attribute_name: inputField?.field_name || key,
          requested_value: inputField?.value || '',
          offered_value: val.offered,
          is_deviated: val.isDeviated,
          deviation_reason: val.reason,
        };
      });

      if (response) {
        await rfqDb.itemSupplierResponses.update(response.id, {
          status: 'TECHNICAL_SUBMITTED',
          current_technical_round: (response.current_technical_round || 1) + 1,
          technical_revision_rounds: [
            ...(response.technical_revision_rounds || []),
            {
              round_number: (response.current_technical_round || 1) + 1,
              submitted_by_user_id: 'usr-3',
              submitted_at: new Date().toISOString(),
              buyer_requirement_snapshot: techResponses,
              supplier_response: techResponses,
              round_status: 'PENDING',
            },
          ],
          commercial_terms: {
            offered_unit_price: commercialTerms.offered_unit_price,
            lead_time_days: commercialTerms.lead_time_days,
            moq: 10,
            payment_terms: 'Net 30 Days',
            freight_terms: 'FOB Destination',
            warranty_terms: '2 Years Factory Warranty',
            total_commercial_amount: commercialTerms.offered_unit_price * commercialTerms.offered_quantity,
          },
          updated_at: new Date().toISOString(),
        });
      }

      message.success('Technical response submitted to buyer for review!');
      navigate(basePath);
    } catch (err) {
      console.error(err);
      message.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>Supplier Inbox</a> },
          { title: `${rfq.rfq_number} - Technical Response` },
        ]}
      />

      <Card className="shadow-md border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Phase 3: Technical Response</span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{item.product_name}</h1>
            <p className="text-xs text-slate-500">Provide technical specification responses WITHOUT selecting a catalog product initially.</p>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(basePath)}>
            Back to Inbox
          </Button>
        </div>

        <Divider />

        <Alert
          type="info"
          showIcon
          message="Catalog Product Mapping Unlocks After Technical Approval"
          description="In Enterprise Sourcing, you do not select your catalog product or SKU at this stage. First respond to technical attributes and deviations. Once approved, you can map your product."
          className="mb-6"
        />

        {/* Manufacturing & Dynamic Attributes Matrix */}
        <Card title={<span className="font-bold text-slate-900">Technical Specification Response Matrix</span>} className="mb-6 border-slate-200">
          <div className="space-y-6">
            {(item.manufacturing_inputs || []).map((input) => {
              const spec = offeredSpecs[input.field_id] || { offered: String(input.value), isDeviated: false, reason: '' };
              return (
                <div key={input.field_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{input.field_name}</span>
                      <div className="text-xs text-slate-500">Buyer Requested: <strong className="text-slate-900">{input.value}</strong></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Deviated from requested?</span>
                      <Switch
                        checked={spec.isDeviated}
                        onChange={(checked) =>
                          setOfferedSpecs({
                            ...offeredSpecs,
                            [input.field_id]: { ...spec, isDeviated: checked },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Offered Value</label>
                      <Input
                        value={spec.offered}
                        onChange={(e) =>
                          setOfferedSpecs({
                            ...offeredSpecs,
                            [input.field_id]: { ...spec, offered: e.target.value },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    {spec.isDeviated && (
                      <div>
                        <label className="text-xs font-semibold text-amber-700">Deviation Reason / Equivalent Grade Remarks</label>
                        <Input
                          value={spec.reason}
                          placeholder="e.g. Equivalent grade SS316 proposed"
                          onChange={(e) =>
                            setOfferedSpecs({
                              ...offeredSpecs,
                              [input.field_id]: { ...spec, reason: e.target.value },
                            })
                          }
                          className="mt-1 border-amber-300 bg-amber-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Commercial Terms Initial Quote */}
        <Card title={<span className="font-bold text-slate-900">Commercial Quote (Initial Terms)</span>} className="mb-6 border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Offered Unit Price ($)</label>
              <InputNumber
                min={1}
                value={commercialTerms.offered_unit_price}
                onChange={(val) => setCommercialTerms({ ...commercialTerms, offered_unit_price: val || 0 })}
                className="w-full mt-1"
                prefix="$"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Offered Quantity</label>
              <InputNumber
                min={1}
                value={commercialTerms.offered_quantity}
                onChange={(val) => setCommercialTerms({ ...commercialTerms, offered_quantity: val || 0 })}
                className="w-full mt-1"
                suffix="Units"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Lead Time (Days)</label>
              <InputNumber
                min={1}
                value={commercialTerms.lead_time_days}
                onChange={(val) => setCommercialTerms({ ...commercialTerms, lead_time_days: val || 0 })}
                className="w-full mt-1"
                suffix="Days"
              />
            </div>
          </div>
        </Card>

        <Button
          type="primary"
          size="large"
          block
          loading={submitting}
          onClick={handleSubmitResponse}
          icon={<SendOutlined />}
          className="bg-emerald-600 hover:bg-emerald-700 h-12 font-bold text-base shadow-md"
        >
          Submit Technical Response to Buyer
        </Button>
      </Card>
    </div>
  );
};
