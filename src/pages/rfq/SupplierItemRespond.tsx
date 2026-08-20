import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input as AntInput, InputNumber as AntInputNumber, Button as AntButton, Select as AntSelect, Tag as AntTag, Table, Descriptions, App as AntApp, Alert } from 'antd';
import { SendOutlined, ArrowLeftOutlined, SaveOutlined, ReloadOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined } from '@ant-design/icons';
import { rfqDb, type AttributeType, type ItemAttributeValue, type SellerQuoteAttribute } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';


export const SupplierItemRespond: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [submitting, setSubmitting] = useState(false);
  const [proposalAttributes, setProposalAttributes] = useState<Record<string, { attribute_type: AttributeType, group_id: string, attribute_id: string, is_deviation: boolean, values: ItemAttributeValue[] }>>({});


  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const existingQuote = useLiveQuery(
    () => (itemId && activePartyId ? rfqDb.seller_quotes.where({ rfq_item_id: itemId, seller_party_id: activePartyId }).first() : undefined),
    [itemId, activePartyId]
  );

  const existingQuoteAttributes = useLiveQuery(
    () => (existingQuote?.id ? rfqDb.seller_quote_attributes.where('seller_quote_id').equals(existingQuote.id).toArray() : []),
    [existingQuote?.id]
  );

  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);

  const itemAttributes = useLiveQuery(
    () => (itemId ? rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const sellerProduct = useLiveQuery(
    async () => item?.product_id ? await catalogDb.sellerProducts.get(item.product_id) : undefined,
    [item?.product_id]
  );
  const allVariants = useLiveQuery(
    async () => item?.product_id ? (await catalogDb.sellerProducts.get(item.product_id))?.variants : [],
    [item?.product_id]
  ) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const itemVariant = allVariants.find((v) => v.id === item?.variant_id);
  const catalogProduct = useLiveQuery(
    async () => (item?.catalog_product_id ? await catalogDb.products.get(item.catalog_product_id) : undefined),
    [item?.catalog_product_id]
  );
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const catalogAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];

  const quoteNumber = React.useMemo(() => {
    return existingQuote?.seller_quote_number || `SQ-${itemId?.replace('item-', '') || 'NEW'}-${activePartyId?.replace('pty-', '') || 'UNK'}`;
  }, [existingQuote, itemId, activePartyId]);

  const brandAttribute = itemAttributes.find((ia) => ia.attribute_type === 'SYSTEM' && ia.attribute_id === 'brand');
  const manufacturerAttribute = itemAttributes.find((ia) => ia.attribute_type === 'SYSTEM' && ia.attribute_id === 'manufacturer');

  const attributeGroupsMap = React.useMemo(() => {
    const map: Record<string, { name: string; attributes: any[] }> = {};
    const customAttributes = sellerProduct?.dynamic_attributes?.filter((ia: any) => ia.is_variant !== true);
    if (item) {
      map["system"] = {
        name: 'System Specifications',
        attributes: [
          {
            key: 'brand',
            attribute_type: "SYSTEM",
            group_id: "system",
            attribute_id: "brand",
            attributeName: 'Brand Preference',
            is_variant: false,
            values: brandAttribute?.values,
          },
          {
            key: 'manufacturer',
            attribute_type: "SYSTEM",
            group_id: "system",
            attribute_id: "manufacturer",
            attributeName: 'Manufacturer Preference',
            is_variant: false,
            values: manufacturerAttribute?.values,
          },
          {
            key: 'req_unit_price',
            attribute_type: "SYSTEM",
            group_id: "system",
            attribute_id: "req_unit_price",
            attributeName: 'Unit Price ($)',
            is_variant: false,
            values: [
              {
                value_id: "req-unit-price",
                value_label: item.req_unit_price ?
                  `${item.req_unit_price}` : 'N/A'
              }
            ]
          },
          {
            key: 'req_quantity',
            attribute_type: "SYSTEM",
            group_id: "system",
            attribute_id: "req_quantity",
            attributeName: 'Requested Quantity',
            is_variant: false,
            values: [
              {
                value_id: "req-quantity",
                value_label: item.req_quantity
              },
              {
                value_id: "req-quantity-unit",
                value_label: item.req_unit
              }
            ]
          }
        ]
      };
    }
    customAttributes?.forEach((ia: any) => {
      const groupId = ia.group_id || 'ungrouped';
      if (!map[groupId]) {
        const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'General Specifications';
        map[groupId] = { name: groupName, attributes: [] };
      }

      const hydratedValues = catalogAttributeValues
        .filter((av) => ia?.selected_value_ids?.includes(av.id))
        .map((v) => ({
          value_id: v.id,
          value_label: v.value || v.label,
        }));
      delete ia.selected_value_ids
      map[groupId].attributes.push({
        ...ia,
        attribute_type: "CUSTOM",
        values: hydratedValues
      });
    });

    const currentVariant = sellerProduct?.variants?.find((v: any) => v.id === item?.variant_id);
    currentVariant?.combination_values?.forEach((cv: any) => {
      const groupId = cv.group_id || 'ungrouped';
      if (!map[groupId]) {
        const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'Variant Specifications';
        map[groupId] = { name: groupName, attributes: [] };
      }

      map[groupId].attributes.push({
        group_id: cv.group_id,
        attribute_id: cv.attribute_id,
        is_variant: true,
        attribute_type: "CUSTOM",
        values: [
          {
            value_id: cv.value_id,
            value_label: cv.label || cv.value_id
          }
        ]
      });
    });

    return Object.entries(map);
  }, [attributeGroups, sellerProduct, catalogAttributeValues, item?.variant_id]);

  useEffect(() => {
    const initialValues: Record<string, {
      attribute_type: AttributeType;
      group_id: string;
      attribute_id: string;
      is_deviation: boolean;
      values: ItemAttributeValue[]
    }> = {};

    if (existingQuote && existingQuoteAttributes !== undefined) {
      // Load price and quantity
      // initialValues['req_unit_price'] = [{ value_id: 'req-unit-price', value_label: existingQuote.offer_unit_price.toString() }];
      // initialValues['req_quantity'] = [{ value_id: 'req-quantity', value_label: existingQuote.offer_quantity.toString() }];
      // // Load other attributes
      // existingQuoteAttributes.forEach(attr => {
      //   initialValues[attr.attribute_id] = attr.values;
      // });
    } else {
      for (const [groupId, groupData] of attributeGroupsMap) {
        for (const attr of groupData.attributes) {
          const propsalKey = `${groupId}_${attr.attribute_id}`
          initialValues[propsalKey] = {
            attribute_type: attr.attribute_type,
            group_id: groupId,
            attribute_id: attr.attribute_id,
            is_deviation: false,
            values: attr.values
          }
        }
      }
    }

    setProposalAttributes(initialValues);
  }, [existingQuote, existingQuoteAttributes, attributeGroupsMap]);
  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>Sourcing Inbox</a> },
    { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'RFQ'} - Sourcing Offer</span> }
  ], [basePath, rfq?.rfq_number, navigate]);
  useBreadcrumb(breadcrumbs);

  if (rfq === undefined || item === undefined || parties.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 font-sans animate-pulse">Loading Sourcing Workspace...</h2>
      </div>
    );
  }

  if (!rfq || !item || !item.seller_assignments?.some((a) => a.seller_party_id === activePartyId)) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">Sourcing response container not found or unauthorized</h2>
        <AntButton className="mt-4" onClick={() => navigate(basePath)}>
          Back to Sourcing Inbox
        </AntButton>
      </div>
    );
  }

  const isViewOnly = ['SUBMITTED', 'ACCEPTED', 'REJECTED'].includes(existingQuote?.status ?? '');

  const handleSave = async (submitMode: 'DRAFT' | 'SUBMITTED') => {
    // if (!item || !rfq || !activePartyId) return;

    // setSubmitting(true);
    // try {
    //   const quoteId = existingQuote?.id || crypto.randomUUID();

    //   const priceStr = proposalAttributes['req_unit_price']?.[0]?.value_label || '0';
    //   const qtyStr = proposalAttributes['req_quantity']?.[0]?.value_label || '0';

    //   const offerPrice = parseFloat(priceStr);
    //   const offerQty = parseFloat(qtyStr);

    //   if (submitMode === 'SUBMITTED') {
    //     if (isNaN(offerPrice) || offerPrice <= 0) {
    //       antMessage.error('Please enter a valid unit price.');
    //       setSubmitting(false);
    //       return;
    //     }
    //     if (isNaN(offerQty) || offerQty <= 0) {
    //       antMessage.error('Please enter a valid quantity.');
    //       setSubmitting(false);
    //       return;
    //     }
    //   }

    //   const quoteToSave = {
    //     id: quoteId,
    //     rfq_item_id: item.id,
    //     round: existingQuote?.round || 1,
    //     seller_party_id: activePartyId,
    //     seller_quote_number: quoteNumber,
    //     offer_unit_price: offerPrice || 0,
    //     offer_quantity: offerQty || 0,
    //     status: submitMode,
    //     created_at: existingQuote?.created_at || new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //   };

    //   const attributesToSave: SellerQuoteAttribute[] = [];

    //   attributeGroupsMap.forEach(([groupId, group]) => {
    //     group.attributes.forEach((attr: any) => {
    //       if (attr.attributeId === 'req_unit_price' || attr.attributeId === 'req_quantity') return;

    //       const vals = proposalAttributes[attr.attributeId];
    //       if (vals && vals.length > 0) {
    //         attributesToSave.push({
    //           id: crypto.randomUUID(),
    //           seller_quote_id: quoteId,
    //           attribute_type: attr.attribute_type,
    //           group_id: groupId,
    //           attribute_id: attr.attributeId,
    //           values: vals,
    //           is_deviation: false,
    //         });
    //       }
    //     });
    //   });

    //   await rfqDb.transaction('rw', rfqDb.seller_quotes, rfqDb.seller_quote_attributes, async () => {
    //     await rfqDb.seller_quotes.put(quoteToSave);

    //     if (existingQuote) {
    //       const oldAttrs = await rfqDb.seller_quote_attributes.where('seller_quote_id').equals(quoteId).toArray();
    //       await rfqDb.seller_quote_attributes.bulkDelete(oldAttrs.map(a => a.id));
    //     }

    //     if (attributesToSave.length > 0) {
    //       await rfqDb.seller_quote_attributes.bulkAdd(attributesToSave);
    //     }
    //   });

    //   antMessage.success(submitMode === 'SUBMITTED' ? 'Proposal submitted successfully!' : 'Draft saved successfully!');
    //   navigate(basePath);

    // } catch (err) {
    //   console.error(err);
    //   antMessage.error('Failed to save proposal');
    // } finally {
    //   setSubmitting(false);
    // }
  };

  const attributesColumns = [
    {
      title: 'Attribute',
      dataIndex: 'attributeName',
      key: 'attributeName',
      width: 320,
      render: (text: string, record: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 leading-tight">
            {text}
            {record.isVariant && (
              <AntTag
                color="blue"
                className="leading-tight italic ml-2"
                icon={<AntIconCheckCircleOutlined />}
              >
                Variant Attribute
              </AntTag>
            )}
          </span>
          {record.description && (
            <span className="text-xs text-slate-400 leading-tight italic">{record.description}</span>
          )}
        </div>
      )
    },
    {
      title: 'Requested Value',
      dataIndex: 'reqViewValue',
      key: 'reqViewValue',
      render: (text: string) => <span className="text-slate-600 font-medium">{text}</span>
    },
    {
      title: 'Proposal Value',
      dataIndex: 'proposalValue',
      key: 'proposalValue',
      render: (_: string, attribute: any) => {
        const propsalKey = `${attribute.groupId}_${attribute.attributeId}`
        if (attribute.attribute_type === 'SYSTEM') {
          switch (attribute.attributeId) {
            case "req_unit_price":
              return (
                <AntInput
                  disabled={isViewOnly}
                  value={proposalAttributes[propsalKey]?.values?.[0]?.value_label ?? ''}
                  onChange={(e) => {
                    setProposalAttributes(prev => ({
                      ...prev,
                      [propsalKey]: {
                        ...prev[propsalKey],
                        values: [{
                          value_id: 'req-unit-price',
                          value_label: e.target.value
                        }]
                      }
                    }));
                  }}
                />
              )
            case "req_quantity":
              return (
                <AntInput
                  disabled={isViewOnly}
                  value={proposalAttributes[propsalKey]?.values?.[0]?.value_label ?? ''}
                  onChange={(e) => {
                    setProposalAttributes(prev => ({
                      ...prev, [propsalKey]: {
                        ...prev[propsalKey],
                        values: [{ value_id: 'req-quantity', value_label: e.target.value }]
                      }
                    }));
                  }}
                />
              )
            case "brand":
              return (
                <AntSelect
                  disabled={isViewOnly}
                  mode="multiple"
                  allowClear
                  placeholder="Select Preferred Brand(s)"
                  value={proposalAttributes[propsalKey]?.values?.map((v: any) => v.value_id) || []}
                  onChange={(val: string[]) => {
                    const newValues = val.map(id => {
                      const matched = allBrands.find((v: any) => v.id === id);
                      return { value_id: id, value_label: matched?.name || id };
                    });
                    setProposalAttributes(prev => ({
                      ...prev, [propsalKey]: {
                        ...prev[propsalKey],
                        values: newValues
                      }
                    }));
                  }}
                  className="w-full mt-1"
                  options={allBrands.map((v: any) => ({ label: v.name, value: v.id }))}
                />
              )
            case "manufacturer":
              return (
                <AntSelect
                  disabled={isViewOnly}
                  mode="multiple"
                  allowClear
                  placeholder="Select Preferred Manufacturer(s)"
                  value={proposalAttributes[propsalKey]?.values?.map((v: any) => v.value_id) || []}
                  onChange={(val: string[]) => {
                    const newValues = val.map(id => {
                      const matched = allManufacturers.find((v: any) => v.id === id);
                      return { value_id: id, value_label: matched?.company_name || id };
                    });
                    setProposalAttributes(prev => ({
                      ...prev, [propsalKey]: {
                        ...prev[propsalKey],
                        values: newValues
                      }
                    }));
                  }}

                  className="w-full mt-1"
                  options={allManufacturers.map((v: any) => ({ label: v.company_name, value: v.id }))}
                />
              )
            default:
              return "Contact System admin"
          }
        } else {
          const values = catalogAttributeValues.filter((v) => v.attributeId === attribute.attributeId);
          return (
            <AntSelect
              disabled={isViewOnly}
              mode="multiple"
              allowClear
              placeholder={`Select ${attribute.attributeName}`}
              className="w-full mt-1"
              value={proposalAttributes[propsalKey]?.values?.map((v: any) => v.value_id) || []}
              onChange={(val: string[]) => {
                const newValues = val.map(id => {
                  const matched = values.find((v: any) => v.id === id);
                  return { value_id: id, value_label: matched?.value || matched?.label || id };
                });
                setProposalAttributes(prev => ({
                  ...prev, [propsalKey]: {
                    ...prev[propsalKey],
                    values: newValues
                  }
                }));
              }}
              options={values.map((v: any) => ({ label: v.value || v.label, value: v.id }))}
            />
          )
        }
      }
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card
        className="shadow-md border-slate-200"
        title={
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-tight">RFQ Item Proposal</span>
              <span className="text-xs text-slate-500 font-normal">{rfq.rfq_number} &bull; From: {rfq.requester_name || 'N/A'}</span>
            </div>
          </div>
        }
      >
        {/* Proposal Status Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 mb-5 flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Quote Reference</span>
            <AntTag color="purple" className="font-mono font-bold text-sm mt-0.5">{quoteNumber}</AntTag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Status</span>
            <AntTag
              color={!existingQuote ? 'default' : existingQuote.status === 'SUBMITTED' ? 'blue' : existingQuote.status === 'DRAFT' ? 'orange' : existingQuote.status === 'ACCEPTED' ? 'green' : existingQuote.status === 'REJECTED' ? 'red' : 'default'}
              className="mt-0.5 font-bold"
            >
              {existingQuote?.status || 'NEW'}
            </AntTag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Round</span>
            <div className="flex items-center gap-1 mt-0.5">
              <ReloadOutlined className="text-blue-500 text-xs" />
              <span className="font-bold text-slate-800 text-sm">Round {existingQuote?.round ?? 1}</span>
            </div>
          </div>
          {existingQuote?.created_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Created</span>
              <span className="text-xs text-slate-600 mt-0.5">{new Date(existingQuote.created_at).toLocaleString()}</span>
            </div>
          )}
          {existingQuote?.updated_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Last Updated</span>
              <span className="text-xs text-slate-600 mt-0.5">{new Date(existingQuote.updated_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Requested Item Details */}
        <Descriptions title="Requested Item Details" bordered size="small" column={2} className="mb-6">
          <Descriptions.Item label="Product / Service" span={2}>
            <strong className="text-slate-800">{catalogProduct?.name || 'Custom Specifications'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Number">
            <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Category">{categories.find((c) => c.id === item.category_id)?.name || 'Unknown'}</Descriptions.Item>
          <Descriptions.Item label="Variant">{itemVariant?.sku}</Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <AntTag color="blue" className="font-bold">{item.req_quantity} {item.req_unit || 'pcs'}</AntTag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested Unit Price">
            {item.req_unit_price ? <span className="text-emerald-600 font-bold">${item.req_unit_price}</span> : 'N/A'}
          </Descriptions.Item>
        </Descriptions>

        <div className="space-y-6">

          <h3 className="text-base font-bold text-slate-900 pt-3">Attribute configuration</h3>

          {attributeGroupsMap.map(([groupId, group], idx) => {
            const groupAttributes = group.attributes.map((ia: any) => {
              const attrName = ia.attributeName || catalogAttributes.find((a) => a.id === ia.attribute_id)?.name || ia.attribute_id;
              let reqViewValue = 'N/A';

              switch (ia.attribute_id) {
                case 'req_quantity':
                  reqViewValue = `${item.req_quantity} ${item.req_unit}` || 'N/A'
                  break;
                case 'req_unit_price':
                  reqViewValue = item.req_unit_price ? `$${item.req_unit_price}` : 'N/A'
                  break;
                default:
                  reqViewValue = (ia.values || []).map((v: any) => v.value_label).join(', ') || 'N/A';
                  break;
              }

              return {
                key: ia.id || ia.attribute_id,
                attribute_type: ia.attribute_type,
                groupId: groupId,
                attributeId: ia.attribute_id,
                attributeName: attrName,
                isVariant: ia.is_variant,
                description: ia.description || null,
                reqViewValue: reqViewValue,
                values: ia.values
              };
            });

            const accentColor = ['#10b981', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'][idx % 5];

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
                    <h4 className="text-md font-bold text-slate-800">{group.name}</h4>
                  </div>
                  <AntTag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                    {groupAttributes.length} attributes
                  </AntTag>
                </div>
                <div className="p-3">
                  <Table
                    dataSource={groupAttributes}
                    columns={attributesColumns}
                    pagination={false}
                    size="small"
                    bordered
                  />
                </div>
              </div>
            );
          })}
        </div>

        {!isViewOnly && (
          <div className="pt-6 flex justify-end gap-3 mt-6">
            <AntButton onClick={() => navigate(basePath)}>Cancel</AntButton>
            <AntButton
              icon={<SaveOutlined />}
              onClick={() => handleSave('DRAFT')}
              loading={submitting}
            >
              Save as Draft
            </AntButton>
            <AntButton
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSave('SUBMITTED')}
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Proposal
            </AntButton>
          </div>
        )}
      </Card>
    </div>
  );
};
