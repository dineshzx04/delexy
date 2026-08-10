import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Select, Button, Alert, App as AntApp, Breadcrumb, Tag, Divider } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { businessDb } from '../../data/business/business.db';

export const SupplierProductMapping: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/supplier' : '/user/supplier';
  const { message: antMessage } = AntApp.useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('sprod-1');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('sprod-1-v2');
  const [submitting, setSubmitting] = useState(false);

  // Live query from catalogDb indexed database store
  const sellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray(), []) || [];
  const item = useLiveQuery(() => (itemId ? rfqDb.rfqItems.get(itemId) : undefined), [itemId]);
  
  // Active seller party resolution
  const allParties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = isBusinessContext
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId)
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId);
  const activePartyId = activeParty?.id || 'pty-4';

  const quote = useLiveQuery(
    async () => {
      if (!itemId) return undefined;
      const quotes = await rfqDb.sellerQuote.where('itemId').equals(itemId).toArray();
      return quotes.find((q) => q.sellerId === activePartyId);
    },
    [itemId, activePartyId]
  );

  const selectedProduct = sellerProducts.find((p) => p.id === selectedProductId);

  const handleSaveMapping = async () => {
    setSubmitting(true);
    try {
      if (quote) {
        await rfqDb.sellerQuote.update(quote.id, {
          sellerProductMapping: {
            seller_product_id: selectedProductId,
            variant_id: selectedVariantId,
            mapped_at: new Date().toISOString(),
            is_buyer_approved: false,
          },
        });
      }

      antMessage.success('Catalog product & variant mapped successfully!');
      navigate(basePath);
    } catch (err) {
      antMessage.error('Failed to map product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>Supplier Inbox</a> },
          { title: 'Catalog Product Mapping' },
        ]}
      />

      <Card className="shadow-md border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <Tag color="geekblue">Phase 6: Product Mapping</Tag>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Map Approved Spec to Supplier Catalog Product</h1>
            <p className="text-xs text-slate-500">Link your approved technical specification to your catalog product and SKU variant.</p>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(basePath)}>
            Back
          </Button>
        </div>

        <Divider />

        <Alert
          type="success"
          showIcon
          message="Technical Specification Approved!"
          description={`Your technical response for item "${item?.product_name || 'Item'}" has been approved by the buyer. Select the catalog product and variant SKU below.`}
          className="mb-6"
        />

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Select Catalog Product</label>
            <Select
              value={selectedProductId}
              onChange={setSelectedProductId}
              className="w-full mt-1"
              options={sellerProducts.map((sp) => ({
                value: sp.id,
                label: `${sp.product_name} (${sp.id})`,
              }))}
            />
          </div>

          {selectedProduct && (
            <div>
              <label className="text-xs font-semibold text-slate-700">Select Variant SKU</label>
              <Select
                value={selectedVariantId}
                onChange={setSelectedVariantId}
                className="w-full mt-1"
                options={(selectedProduct.variants || []).map((v: any) => ({
                  value: v.id,
                  label: `Variant: ${v.id} - ${v.sku || v.id}`,
                }))}
              />
            </div>
          )}

          <Button
            type="primary"
            size="large"
            block
            loading={submitting}
            onClick={handleSaveMapping}
            icon={<CheckCircleOutlined />}
            className="bg-purple-600 hover:bg-purple-700 h-12 font-bold text-base shadow-md mt-4"
          >
            Save Product Mapping & Send to Buyer for Approval
          </Button>
        </div>
      </Card>
    </div>
  );
};
