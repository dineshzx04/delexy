import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Button, Descriptions, Tag, Alert, Table, App as AntApp } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const RfqAwardCheckMapping: React.FC = () => {
  // const { rfqId, itemId, quoteId } = useParams<{ rfqId: string; itemId: string; quoteId: string }>();
  // const navigate = useNavigate();
  // const { activeWorkspace } = useWorkspace();
  // const { message: antMessage } = AntApp.useApp();

  // const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  // const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  // const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  // const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  // const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  // const award = useLiveQuery(
  //   async () => {
  //     if (!itemId || !quoteId) return undefined;
  //     const awds = await rfqDb.rfq_awards.where('rfq_item_id').equals(itemId).toArray();
  //     return awds.find((a) => a.seller_quote_id === quoteId);
  //   },
  //   [itemId, quoteId]
  // );

  // const existingQuote = useLiveQuery(
  //   () => (quoteId ? rfqDb.seller_quotes.get(quoteId) : undefined),
  //   [quoteId]
  // );

  // const sellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray(), []) || [];
  // const catalogBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  // const catalogManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  // const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  // const catalogAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  // const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];

  // const [approving, setApproving] = useState(false);

  // // Compute all mapping details inside a safe useMemo at the top level
  // const mappingDetails = React.useMemo(() => {
  //   if (!award || !sellerProducts.length) {
  //     return {
  //       mappedProduct: undefined,
  //       mappedVariant: undefined,
  //       supplierPartyName: '',
  //       brandName: undefined,
  //       manufacturerName: undefined,
  //       groupedVariantSpecs: []
  //     };
  //   }

  //   const mappedProduct = sellerProducts.find((p) =>
  //     p.variants && p.variants.some((v: any) => v.id === award.variant_id)
  //   );
  //   const mappedVariant = mappedProduct?.variants?.find((v: any) => v.id === award.variant_id);

  //   const supplierPartyName = parties.find((p) => p.id === award.seller_party_id)?.display_name || award.seller_party_id;
  //   const brandName = mappedProduct ? catalogBrands.find((b) => b.id === mappedProduct.brand_id)?.name : undefined;
  //   const manufacturerName = mappedProduct ? catalogManufacturers.find((m) => m.id === mappedProduct.manufacturer_id)?.company_name : undefined;

  //   const groupsMap: Record<string, { name: string; rows: any[] }> = {};
  //   if (mappedVariant && mappedVariant.combination_values) {
  //     mappedVariant.combination_values.forEach((cv: any) => {
  //       const groupId = cv.group_id || 'ungrouped';
  //       if (!groupsMap[groupId]) {
  //         const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'General Specifications';
  //         groupsMap[groupId] = { name: groupName, rows: [] };
  //       }

  //       const attrName = catalogAttributes.find((a) => a.id === cv.attribute_id)?.name || cv.attribute_id;
  //       const valLabel = catalogAttributeValues.find((v) => v.id === cv.value_id)?.label || cv.value_label || cv.value_id;

  //       groupsMap[groupId].rows.push({
  //         key: cv.attribute_id,
  //         specification: attrName,
  //         value: valLabel
  //       });
  //     });
  //   }

  //   return {
  //     mappedProduct,
  //     mappedVariant,
  //     supplierPartyName,
  //     brandName,
  //     manufacturerName,
  //     groupedVariantSpecs: Object.entries(groupsMap)
  //   };
  // }, [award, sellerProducts, parties, catalogBrands, catalogManufacturers, attributeGroups, catalogAttributes, catalogAttributeValues]);

  // const breadcrumbs = React.useMemo(() => [
  //   { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
  //   { title: <a onClick={() => navigate(`${basePath}/${rfq?.id}`)}>{rfq?.rfq_number || 'RFQ Details'}</a> },
  //   { title: <a onClick={() => navigate(`${basePath}/${rfq?.id}/items/${itemId}`)}>{mappingDetails.mappedProduct?.product_name || 'Item Detail'}</a> },
  //   { title: <span className="text-slate-800 font-semibold">Check Spec Mapping</span> }
  // ], [basePath, rfq?.id, rfq?.rfq_number, itemId, mappingDetails.mappedProduct?.product_name, navigate]);

  // useBreadcrumb(breadcrumbs);

  // if (!rfq || !item || !award || !existingQuote) {
  //   return (
  //     <div className="p-12 text-center text-slate-500">
  //       <h2 className="text-xl font-bold text-slate-800">Award / Specification Details Not Found</h2>
  //       <Button className="mt-4" onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}`)}>
  //         Back to Item Workspace
  //       </Button>
  //     </div>
  //   );
  // }

  // const handleAcknowledgeSpecs = async () => {
  //   setApproving(true);
  //   try {
  //     await rfqDb.rfq_awards.update(award.id, {
  //       product_mapping_status: 'ACKNOWLEDGED'
  //     });
  //     antMessage.success('Supplier catalog product mapping specifications approved & acknowledged!');
  //     navigate(`${basePath}/${rfqId}/items/${itemId}`);
  //   } catch (err) {
  //     console.error(err);
  //     antMessage.error('Failed to approve specifications.');
  //   } finally {
  //     setApproving(false);
  //   }
  // };

  // const variantSpecsColumns = [
  //   {
  //     title: 'Specification / Attribute',
  //     dataIndex: 'specification',
  //     key: 'specification',
  //     width: 320,
  //     render: (text: string) => <span className="font-bold text-slate-800">{text}</span>
  //   },
  //   {
  //     title: 'Value',
  //     dataIndex: 'value',
  //     key: 'value',
  //     render: (text: string) => <span className="text-slate-700 font-medium">{text}</span>
  //   }
  // ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black text-slate-900">Check Product Specification Mapping</h1>
      </div>


      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex flex-wrap gap-6 items-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Quote Reference</span>
          <Tag color="purple" className="font-mono font-bold text-sm mt-0.5">{existingQuote.seller_quote_number}</Tag>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Supplier Name</span>
          <span className="font-bold text-slate-800 text-sm mt-0.5">{mappingDetails.supplierPartyName}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Target Price</span>
          <span className="font-bold text-slate-700 text-sm mt-0.5">${award.unit_price} / unit</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Original Sourcing Proposal</span>
          <a
            onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${quoteId}/review`)}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline mt-1.5 block"
          >
            View Quote Proposal &rarr;
          </a>
        </div>
      </div>

      <Alert
        type="warning"
        showIcon
        message="Awaiting Specification Acknowledgment"
        description="Verify the catalog variant and technical parameters submitted by the seller below. You must approve the spec details before a formal Purchase Order (PO) can be released."
      />

      <Card
        className="shadow-md border-slate-200"
        title={<span className="text-slate-800 font-extrabold text-base">Submitted Catalog Product Variant Details</span>}
      >
        <Descriptions bordered size="small" column={2} className="mb-6 bg-white">
          <Descriptions.Item label="Catalog Product Name" span={2}>
            <strong className="text-slate-800 text-base">{mappingDetails.mappedProduct?.product_name || 'N/A'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Brand">{mappingDetails.brandName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Manufacturer">{mappingDetails.manufacturerName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Variant SKU / Part No.">
            <code className="text-xs bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 text-indigo-700 font-mono font-bold">
              {mappingDetails.mappedVariant?.sku || award.variant_id || 'N/A'}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label="Variant ID">
            <code className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-mono">
              {award.variant_id}
            </code>
          </Descriptions.Item>
        </Descriptions>

        {mappingDetails.groupedVariantSpecs.length > 0 ? (
          <div className="space-y-6">
            <h4 className="text-base font-extrabold text-slate-900 border-b pb-2">Technical Variant Specifications</h4>
            {mappingDetails.groupedVariantSpecs.map(([groupId, group], idx) => {
              const accentColor = ['#527EA3', '#5D9365', '#C9825A', '#8975A8'][idx % 4];
              return (
                <div
                  key={groupId}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  style={{ borderLeft: `4px solid ${accentColor}` }}
                >
                  <div
                    className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
                    style={{ backgroundColor: `${accentColor}14` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {idx + 1}
                      </span>
                      <h5 className="text-md font-bold text-slate-800 m-0">{group.name}</h5>
                    </div>
                    <Tag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                      {group.rows.length} attributes
                    </Tag>
                  </div>
                  <div className="p-3">
                    <Table
                      dataSource={group.rows}
                      columns={variantSpecsColumns}
                      pagination={false}
                      size="small"
                      bordered
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-400 italic text-center py-6 border rounded-lg bg-slate-50">
            No dynamic variant combination specifications defined for this product variant.
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t pt-5">
          <Button onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}`)}>Cancel</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={approving}
            onClick={handleAcknowledgeSpecs}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold h-10 px-5"
          >
            Acknowledge & Approve Specs
          </Button>
        </div>
      </Card> */}
    </div>
  );
};
