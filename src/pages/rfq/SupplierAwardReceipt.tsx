import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tag, Descriptions, Button, Form, Input, Alert, App as AntApp } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const SupplierAwardReceipt: React.FC = () => {
  const { rfqId, itemId, awardId } = useParams<{ rfqId: string; itemId: string; awardId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [confirmingPo, setConfirmingPo] = useState(false);
  const [poAckNote, setPoAckNote] = useState('');

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  const award = useLiveQuery(() => (awardId ? rfqDb.rfq_awards.get(awardId) : undefined), [awardId]);
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const quote = useLiveQuery(() => (award?.seller_quote_id ? rfqDb.seller_quotes.get(award.seller_quote_id) : undefined), [award?.seller_quote_id]);
  const sellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray(), []) || [];
  const catalogBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const catalogManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const catalogAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];

  const mappingDetails = React.useMemo(() => {
    if (!award || !sellerProducts.length) {
      return {
        mappedProduct: undefined,
        mappedVariant: undefined,
        brandName: undefined,
        manufacturerName: undefined,
        groupedVariantSpecs: []
      };
    }

    const mappedProduct = sellerProducts.find((p) =>
      p.variants && p.variants.some((v: any) => v.id === award.variant_id)
    );
    const mappedVariant = mappedProduct?.variants?.find((v: any) => v.id === award.variant_id);

    const brandName = mappedProduct ? catalogBrands.find((b) => b.id === mappedProduct.brand_id)?.name : undefined;
    const manufacturerName = mappedProduct ? catalogManufacturers.find((m) => m.id === mappedProduct.manufacturer_id)?.company_name : undefined;

    const groupsMap: Record<string, { name: string; rows: any[] }> = {};
    if (mappedVariant && mappedVariant.combination_values) {
      mappedVariant.combination_values.forEach((cv: any) => {
        const groupId = cv.group_id || 'ungrouped';
        if (!groupsMap[groupId]) {
          const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'General Specifications';
          groupsMap[groupId] = { name: groupName, rows: [] };
        }

        const attrName = catalogAttributes.find((a) => a.id === cv.attribute_id)?.name || cv.attribute_id;
        const valLabel = catalogAttributeValues.find((v) => v.id === cv.value_id)?.label || cv.value_label || cv.value_id;

        groupsMap[groupId].rows.push({
          key: cv.attribute_id,
          specification: attrName,
          value: valLabel
        });
      });
    }

    return {
      mappedProduct,
      mappedVariant,
      brandName,
      manufacturerName,
      groupedVariantSpecs: Object.entries(groupsMap)
    };
  }, [award, sellerProducts, catalogBrands, catalogManufacturers, attributeGroups, catalogAttributes, catalogAttributeValues]);

  const buyerPartyName = React.useMemo(() => {
    if (!rfq || parties.length === 0) return '';
    return parties.find((p) => p.id === rfq.requester_party_id)?.display_name || rfq.requester_name;
  }, [rfq, parties]);

  const sellerPartyName = React.useMemo(() => {
    if (!award || parties.length === 0) return '';
    return parties.find((p) => p.id === award.seller_party_id)?.display_name || award.seller_party_id;
  }, [award, parties]);

  const categoryName = React.useMemo(() => {
    if (!item || categories.length === 0) return 'Custom Category';
    return categories.find((c) => c.id === item.category_id)?.name || 'Custom Category';
  }, [item, categories]);

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>Supplier Inbox</a> },
    { title: <span className="text-slate-800 font-semibold">Confirm PO Receipt</span> }
  ], [basePath, navigate]);

  useBreadcrumb(breadcrumbs);

  const handleConfirmPoReceipt = async () => {
    if (!award) return;
    setConfirmingPo(true);
    try {
      await rfqDb.rfq_awards.update(award.id, {
        award_status: 'PO_RECEIVED',
        po_received_at: new Date().toISOString(),
        supplier_acknowledgement_note: poAckNote
      });
      antMessage.success('Purchase Order receipt confirmed! Sourcing contract is now converted to an active Order.');
      navigate(basePath);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to confirm Purchase Order receipt.');
    } finally {
      setConfirmingPo(false);
    }
  };

  if (!rfq || !item || !award) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Loading award and PO details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <Card className="shadow-md border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <Tag color="purple" className="font-bold">Phase 8: PO Receipt Confirmation</Tag>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Confirm Purchase Order Receipt</h1>
            <p className="text-xs text-slate-500">Review buyer shipping terms and acknowledge receipt to convert this contract to an active Order.</p>
          </div>
        </div>

        <div className="mt-6 border-purple-200 bg-purple-50/10 rounded-xl p-5 border text-left">
          <h3 className="text-md font-bold text-purple-900 mb-4 flex items-center gap-2">
            <CheckCircleOutlined /> Released Purchase Order Details
          </h3>
          <Descriptions bordered size="small" column={1} className="bg-white mb-4">
            <Descriptions.Item label="PO Reference Number">
              <strong className="text-slate-800 font-mono">{award.purchase_order_id}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="RFQ Number">
              {rfq ? `${rfq.rfq_number} - ${rfq.title}` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Buyer / Requester">
              {buyerPartyName}
            </Descriptions.Item>
            <Descriptions.Item label="Supplier / Vendor">
              {sellerPartyName}
            </Descriptions.Item>
            <Descriptions.Item label="Awarded Quantity">
              {award.awarded_quantity} {item.req_unit}
            </Descriptions.Item>
            <Descriptions.Item label="Price / Unit">
              <strong className="text-emerald-700">${award.unit_price}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              <strong className="text-emerald-800 text-lg">${(award.awarded_quantity * (award.unit_price || 0)).toLocaleString()}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Quote Number">
              <div className="flex items-center justify-between w-full">
                <span>{quote ? `${quote.seller_quote_number} (Round ${quote.round})` : 'N/A'}</span>
                <a
                  onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/respond`)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  View Original Quote Proposal &rarr;
                </a>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Shipping Address">
              {award.shipping_address || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              <Tag color="purple">{award.payment_terms || 'NET_30'}</Tag>
            </Descriptions.Item>
            {award.delivery_notes && (
              <Descriptions.Item label="Delivery Notes / Instructions">
                {award.delivery_notes}
              </Descriptions.Item>
            )}
          </Descriptions>

          <div className="mt-8 border-t border-purple-200 pt-6">
            <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircleOutlined className="text-blue-500" /> Mapped Product & Award Details
            </h3>

            {mappingDetails.mappedVariant ? (
              <div className="space-y-4">
                <Descriptions bordered size="small" column={2} className="bg-white">
                  <Descriptions.Item label="Category Name">
                    <span className="font-semibold">{categoryName}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Catalog Product Name">
                    <span className="font-semibold text-slate-800">{mappingDetails.mappedProduct?.product_name || 'Custom Specifications'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Variant Platform ID">
                    <Tag color="blue">{mappingDetails.mappedVariant.id}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Brand">
                    {mappingDetails.brandName || <span className="text-slate-400">N/A</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Manufacturer">
                    {mappingDetails.manufacturerName || <span className="text-slate-400">N/A</span>}
                  </Descriptions.Item>
                </Descriptions>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {mappingDetails.groupedVariantSpecs.map(([groupId, group]: [string, any], idx: number) => {
                    const accentColors = ['#10b981', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'];
                    const accentColor = accentColors[idx % accentColors.length];
                    return (
                      <Card
                        key={groupId}
                        size="small"
                        title={<span style={{ color: accentColor }}>{group.name}</span>}
                        className="shadow-sm border-slate-200"
                        style={{ borderLeft: `4px solid ${accentColor}` }}
                      >
                        <table className="w-full text-xs text-left">
                          <tbody>
                            {group.rows.map((row: any) => (
                              <tr key={row.key} className="border-b border-slate-100 last:border-0">
                                <td className="py-1.5 font-medium text-slate-500 w-1/2">{row.specification}</td>
                                <td className="py-1.5 font-semibold text-slate-800">{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Alert type="info" showIcon message="No product variant mapped for this award." />
            )}
          </div>

          {award.award_status === 'PO_CREATED' ? (
            <div className="space-y-4 mt-6">
              <Alert
                type="info"
                showIcon
                message="Awaiting PO Receipt Confirmation"
                description="Verify the shipping coordinates and payment details above. Submitting receipt confirmation completes the workflow."
              />
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Acknowledgement Comments / Remarks</label>
                <Input.TextArea
                  rows={3}
                  placeholder="e.g. PO received and terms accepted. Scheduling production dispatch..."
                  value={poAckNote}
                  onChange={(e) => setPoAckNote(e.target.value)}
                />
              </div>
              <Button
                type="primary"
                size="large"
                block
                className="bg-purple-600 hover:bg-purple-700 h-12 font-bold text-base shadow-md"
                loading={confirmingPo}
                onClick={handleConfirmPoReceipt}
              >
                Acknowledge & Confirm PO Receipt
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              <Alert
                type="success"
                showIcon
                message="Purchase Order Acknowledged & Received"
                description={`Confirmed on ${award.po_received_at ? new Date(award.po_received_at).toLocaleString() : ''}. Sourcing contract is now converted to an active Order.`}
              />
              {award.supplier_acknowledgement_note && (
                <div className="p-3 bg-slate-50 border rounded text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">Your Acknowledgment Note:</span>
                  {award.supplier_acknowledgement_note}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
