import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tag, Descriptions, Button, Form, Input, Select, App as AntApp } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const RfqAwardReleasePo: React.FC = () => {
  // const { rfqId, itemId, quoteId } = useParams<{ rfqId: string; itemId: string; quoteId: string }>();
  // const navigate = useNavigate();
  // const { activeWorkspace } = useWorkspace();
  // const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  // const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  // const { message: antMessage } = AntApp.useApp();

  // const [submittingPo, setSubmittingPo] = useState(false);
  // const [acknowledging, setAcknowledging] = useState(false);
  // const [form] = Form.useForm();

  // const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  // const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  // const quote = useLiveQuery(() => (quoteId ? rfqDb.seller_quotes.get(quoteId) : undefined), [quoteId]);
  // const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  // const sellerProduct = useLiveQuery(
  //   async () => item?.product_id ? await catalogDb.sellerProducts.get(item.product_id) : undefined,
  //   [item?.product_id]
  // );

  // const award = useLiveQuery(
  //   async () => {
  //     if (!itemId || !quoteId) return undefined;
  //     const awds = await rfqDb.rfq_awards.where('rfq_item_id').equals(itemId).toArray();
  //     return awds.find((a) => a.seller_quote_id === quoteId);
  //   },
  //   [itemId, quoteId]
  // );

  // const supplierPartyName = React.useMemo(() => {
  //   if (!quote || parties.length === 0) return '';
  //   return parties.find((p) => p.id === quote.seller_party_id)?.display_name || quote.seller_party_id;
  // }, [quote, parties]);

  // const breadcrumbs = React.useMemo(() => [
  //   { title: <a onClick={() => navigate(basePath)}>Sourcing</a> },
  //   { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || 'RFQ Details'}</a> },
  //   { title: <a onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}`)}>{sellerProduct?.product_name || 'Item details'}</a> },
  //   { title: <span className="text-slate-800 font-semibold">Release Purchase Order</span> }
  // ], [basePath, rfqId, itemId, rfq?.rfq_number, sellerProduct?.product_name, navigate]);

  // useBreadcrumb(breadcrumbs);

  // const handleAcknowledgeMapping = async () => {
  //   if (!award) return;
  //   setAcknowledging(true);
  //   try {
  //     await rfqDb.rfq_awards.update(award.id, {
  //       product_mapping_status: 'ACKNOWLEDGED'
  //     });
  //     antMessage.success('Supplier catalog mapping details acknowledged successfully!');
  //   } catch (err) {
  //     console.error(err);
  //     antMessage.error('Failed to acknowledge variant specifications.');
  //   } finally {
  //     setAcknowledging(false);
  //   }
  // };

  // const handleReleasePoSubmit = async (values: any) => {
  //   if (!award) return;
  //   setSubmittingPo(true);
  //   try {
  //     const poId = `po-${award.id}-${Date.now()}`;
  //     await rfqDb.rfq_awards.update(award.id, {
  //       award_status: 'PO_CREATED',
  //       purchase_order_id: poId,
  //       shipping_address: values.shipping_address,
  //       payment_terms: values.payment_terms,
  //       delivery_notes: values.delivery_notes,
  //       po_released_at: new Date().toISOString()
  //     });
  //     antMessage.success(`Purchase Order ${poId} released successfully!`);
  //     navigate(`${basePath}/${rfqId}/items/${itemId}`);
  //   } catch (err) {
  //     console.error(err);
  //     antMessage.error('Failed to release Purchase Order.');
  //   } finally {
  //     setSubmittingPo(false);
  //   }
  // };

  // if (!rfq || !item || !quote || !award) {
  //   return (
  //     <div className="p-12 text-center text-slate-500">
  //       <p>Loading award and PO context details...</p>
  //     </div>
  //   );
  // }

  // const mapStatus = award.product_mapping_status;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* 
      <Card className="shadow-md border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <Tag color="purple" className="font-bold">Phase 7: PO Release</Tag>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Release Purchase Order</h1>
            <p className="text-xs text-slate-500">Acknowledge technical mappings and submit formal purchase details to the supplier.</p>
          </div>
        </div>

        <div className="mt-6 border rounded-xl p-4 bg-slate-50/50">
          <Descriptions column={2} size="small" title="Award Summary">
            <Descriptions.Item label="Requested Item">{sellerProduct?.product_name || 'Custom Specifications'}</Descriptions.Item>
            <Descriptions.Item label="Supplier Name">
              <strong>{supplierPartyName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Awarded Qty">
              {award.awarded_quantity} {item.req_unit}
            </Descriptions.Item>
            <Descriptions.Item label="Price / Unit">
              <span className="font-semibold text-emerald-600">${award.unit_price}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Mapping status">
              <Tag color={mapStatus === 'ACKNOWLEDGED' ? 'success' : mapStatus === 'SUBMITTED' ? 'blue' : 'warning'}>
                {mapStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Sourcing Proposal">
              <a
                onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${quote.id}/review`)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
              >
                View Quote Proposal &rarr;
              </a>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {mapStatus === 'SUBMITTED' && (
          <Card className="mt-6 border-blue-200 bg-blue-50/10 text-left" title="Awaiting Specification Acknowledgment">
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                The supplier has proposed custom technical details for this contract. Acknowledge their proposed variant specifications (Variant ID: <strong>{award.variant_id || 'Pending'}</strong>) before PO release.
              </p>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={acknowledging}
                onClick={handleAcknowledgeMapping}
                className="bg-blue-600"
              >
                Acknowledge variant specifications
              </Button>
            </div>
          </Card>
        )}

        {(mapStatus === 'ACKNOWLEDGED' || mapStatus === 'NOT_REQUIRED') && (
          <div className="mt-6 text-left">
            <h3 className="text-md font-bold text-slate-800 mb-4 border-b pb-2">Purchase Order (PO) Details</h3>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleReleasePoSubmit}
              initialValues={{
                payment_terms: 'NET_30',
                shipping_address: rfq.shipping_destination || ''
              }}
            >
              <Form.Item
                name="shipping_address"
                label="Shipping Destination Address"
                rules={[{ required: true, message: 'Please enter shipping destination address' }]}
              >
                <Input.TextArea rows={3} placeholder="Enter delivery location details..." />
              </Form.Item>

              <Form.Item
                name="payment_terms"
                label="Payment Terms"
                rules={[{ required: true, message: 'Please select payment term conditions' }]}
              >
                <Select
                  options={[
                    { value: 'NET_30', label: 'Net 30 Days' },
                    { value: 'NET_60', label: 'Net 60 Days' },
                    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
                    { value: 'ADVANCED_50_50', label: '50% Advance / 50% on Delivery' }
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="delivery_notes"
                label="Delivery Conditions / Buyer Remarks"
              >
                <Input.TextArea rows={3} placeholder="Add specific shipping conditions or instructions..." />
              </Form.Item>

              <Button
                type="primary"
                size="large"
                block
                icon={<SendOutlined />}
                loading={submittingPo}
                htmlType="submit"
                className="bg-purple-600 hover:bg-purple-700 h-12 font-bold text-base shadow-md mt-4"
              >
                Release Purchase Order
              </Button>
            </Form>
          </div>
        )}

        {mapStatus === 'PENDING' && (
          <Card className="mt-6 border-amber-200 bg-amber-50/10">
            <p className="text-xs text-amber-800 leading-normal text-left font-medium italic">
              Awaiting supplier product variant mapping selection. The supplier needs to link a catalog SKU before you can release this PO.
            </p>
          </Card>
        )}
      </Card> */}
    </div>
  );
};
