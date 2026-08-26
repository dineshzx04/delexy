import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input as AntInput, Button as AntButton, Select as AntSelect, Tag as AntTag, Table, Descriptions, App as AntApp, Switch, Steps, Result } from 'antd';
import { SendOutlined, ReloadOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { rfqDb, type AttributeType, type ItemAttributeValue, type SellerQuote, type SellerQuoteAttribute, type SellerQuoteVariant, type SellerQuoteComment } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

interface ProposalAttribute {
  attribute_type: AttributeType;
  group_id: string;
  attribute_id: string;
  is_deviation: boolean;
  deviation_note?: string;
  is_variant: boolean;
  req_value: ItemAttributeValue[];
  values: ItemAttributeValue[];
  buyer_accepted?: boolean;
  attributeName?: string;
  connector?: "AND" | "OR";
}

export const SupplierItemRespond: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';


  const [viewStep, setViewStep] = useState(0);

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []);
  const activeParty = React.useMemo(() => {
    if (!parties || parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const existingQuote = useLiveQuery(
    async () => {
      if (!itemId || !activePartyId) return null;
      const res = await rfqDb.seller_quotes.where({ rfq_item_id: itemId, seller_party_id: activePartyId }).first();
      return res || null;
    },
    [itemId, activePartyId]
  );
  const status = existingQuote?.status || 'NEW';
  let currentStep = 0;
  if (['DEVIATION_ACCEPTED', 'PRODUCT_SUBMIT_REVISION'].includes(status)) {
    currentStep = 1;
  } else if (['FINAL_ACKNOWLEDGE'].includes(status)) {
    currentStep = 2;
  } else if (status === 'REJECTED') {
    // If rejected, might want to show step 0 as view only or something, currently step 0 handles it.
  }
  useEffect(() => {
    setViewStep(currentStep);
  }, [currentStep]);

  const rfq = useLiveQuery(
    async () => {
      if (!rfqId) return null;
      const res = await rfqDb.rfqs.get(rfqId);
      return res || null;
    },
    [rfqId]
  );

  const item = useLiveQuery(
    async () => {
      if (!itemId) return null;
      const res = await rfqDb.rfq_items.get(itemId);
      return res || null;
    },
    [itemId]
  );

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>Sourcing Inbox</a> },
    { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'RFQ'} - Sourcing Offer</span> }
  ], [basePath, rfq?.rfq_number, navigate]);
  useBreadcrumb(breadcrumbs);

  if (parties === undefined || rfq === undefined || existingQuote === undefined || item === undefined) {
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


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card
        className="shadow-md border-slate-200"
        title={
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-tight">RFQ Item Proposal Wizard</span>
              <span className="text-xs text-slate-500 font-normal">{rfq.rfq_number} &bull; From: {rfq.requester_name || 'N/A'}</span>
            </div>
          </div>
        }
      >
        <div className="mb-10 px-8">
          <Steps
            current={viewStep}
            onChange={(step) => setViewStep(step)}
            items={[
              { title: 'Quote Proposal', description: 'Submit or revise your offer specifications.' },
              { title: 'Product Mapping', description: 'Map negotiated item to product catalog.' },
              { title: 'Final Approval', description: 'Final sign-off by both parties.' },
            ]}
          />
          <div className="flex justify-between mt-6">
            <AntButton
              disabled={viewStep === 0}
              onClick={() => setViewStep(v => v - 1)}
              icon={<ArrowLeftOutlined />}
            >
              Previous Step
            </AntButton>
            <AntButton
              disabled={viewStep === 2}
              onClick={() => setViewStep(v => v + 1)}
            >
              Next Step <ArrowRightOutlined />
            </AntButton>
          </div>
        </div>

        {viewStep === 0 && <StepQuoteProposal rfqId={rfqId!} itemId={itemId!} activePartyId={activePartyId} />}
        {viewStep === 1 && <StepProductMapping rfqId={rfqId!} itemId={itemId!} activePartyId={activePartyId} />}
        {viewStep === 2 && <StepFinalAcknowledgement rfqId={rfqId!} itemId={itemId!} activePartyId={activePartyId} />}
      </Card>
    </div>
  );
};





















const StepQuoteProposal: React.FC<{ rfqId: string; itemId: string; activePartyId: string }> = ({ rfqId, itemId, activePartyId }) => {
  const { message: antMessage } = AntApp.useApp();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  const [submitting, setSubmitting] = useState(false);
  const [attributeGroupsMap, setAttributeGroupsMap] = useState<any[]>([]);
  const [proposalAttributes, setProposalAttributes] = useState<Record<string, ProposalAttribute>>({});
  const [proposalVariants, setProposalVariants] = useState<SellerQuoteVariant[]>([]);
  const [bulkPrice, setBulkPrice] = useState<number | undefined>();

  const data = useLiveQuery(async () => {
    if (!itemId || !activePartyId || !rfqId) return undefined;

    const [
      existingQuote,
      item,
      rfq,
      itemAttributes,
      allBrands,
      allManufacturers,
      categories,
      catalogAttributes,
      catalogAttributeValues,
      attributeGroups
    ] = await Promise.all([
      rfqDb.seller_quotes.where({ rfq_item_id: itemId, seller_party_id: activePartyId }).first(),
      rfqDb.rfq_items.get(itemId),
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
      businessDb.brands.toArray(),
      businessDb.manufacturers.toArray(),
      catalogDb.categories.toArray(),
      catalogDb.attributes.toArray(),
      catalogDb.attributeValues.toArray(),
      catalogDb.attributeGroups.toArray()
    ]);

    let existingQuoteAttributes: SellerQuoteAttribute[] = [];
    let existingQuoteVariants: SellerQuoteVariant[] = [];
    let existingQuoteAttributesComments: SellerQuoteComment[] = [];
    if (existingQuote?.id) {
      [existingQuoteAttributes, existingQuoteVariants, existingQuoteAttributesComments] = await Promise.all([
        rfqDb.seller_quote_attributes.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_variants.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_comments.where('seller_quote_id').equals(existingQuote.id).toArray()
      ]);
    }

    let sellerProduct = null;
    let allVariants: any[] = [];
    if (item?.product_id) {
      sellerProduct = await catalogDb.sellerProducts.get(item.product_id);
      allVariants = sellerProduct?.variants || [];
    }

    let catalogProduct = null;
    if (item?.catalog_product_id) {
      catalogProduct = await catalogDb.products.get(item.catalog_product_id);
    }

    return {
      existingQuote: existingQuote || null,
      existingQuoteAttributes,
      existingQuoteVariants,
      existingQuoteAttributesComments,
      item: item || null,
      itemAttributes,
      rfq: rfq || null,
      allBrands,
      allManufacturers,
      categories,
      catalogAttributes,
      catalogAttributeValues,
      attributeGroups,
      sellerProduct: sellerProduct || null,
      allVariants,
      catalogProduct: catalogProduct || null
    };
  }, [itemId, activePartyId, rfqId]);

  const {
    existingQuote,
    existingQuoteAttributes,
    existingQuoteVariants,
    existingQuoteAttributesComments,
    item,
    itemAttributes,
    rfq,
    allBrands,
    allManufacturers,
    categories,
    catalogAttributes,
    catalogAttributeValues,
    attributeGroups,
    sellerProduct,
    allVariants,
    catalogProduct
  } = data || {};

  const itemVariant = React.useMemo(() => {
    if (!allVariants || !item) return null;
    return (allVariants as any[]).find((v) => v.id === item.variant_id) || null;
  }, [allVariants, item]);

  const quoteNumber = React.useMemo(() => {
    return existingQuote?.seller_quote_number || `SQ-${itemId}-${activePartyId.replace(/[^a-zA-Z0-9]/g, '')}`;
  }, [existingQuote, itemId, activePartyId]);


  useEffect(() => {
    if (!item || !itemAttributes?.length) return;

    const groups = new Map((attributeGroups || []).map(g => [g.id, g.name]));
    const attrs = new Map((catalogAttributes || []).map(a => [a.id, a.name]));

    const getValues = (ia: any) => {
      const ids = new Set((ia.values || []).map((v: any) => v.value_id));

      switch (ia.attribute_id) {
        case "manufacturer":
          return (allManufacturers || [])
            .filter(v => ids.has(v.id))
            .map(v => ({ value_id: v.id, value_label: v.company_name || "" }));

        case "brand":
          return (allBrands || [])
            .filter(v => ids.has(v.id))
            .map(v => ({ value_id: v.id, value_label: v.name || "" }));

        case "req_quantity":
          return [
            { value_id: "req-quantity", value_label: String(item.req_quantity) },
            { value_id: "req-quantity-unit", value_label: item.req_unit || "" },
          ];

        default:
          return (catalogAttributeValues || [])
            .filter(v => ids.has(v.id))
            .map(v => ({ value_id: v.id, value_label: v.value || v.label || "" }));
      }
    };

    const names: Record<string, string> = {
      req_quantity: "Requested Quantity",
      brand: "Brand",
      manufacturer: "Manufacturer",
    };

    const map = new Map<string, any>();
    const existingAttrMap = new Map();
    const initialValues: Record<string, ProposalAttribute> = {};

    if (existingQuote && existingQuoteAttributes) {
      existingQuoteAttributes.forEach(ea => existingAttrMap.set(`${ea.group_id}_${ea.attribute_id}`, ea));
    }

    itemAttributes.forEach((ia: any) => {
      const groupId = ia.group_id;
      const values = getValues(ia);
      const proposalKey = `${groupId}_${ia.attribute_id}`;
      const attributeName = names[ia.attribute_id] || attrs.get(ia.attribute_id) || "";

      if (!map.has(groupId)) {
        map.set(groupId, {
          name: groupId === "system"
            ? "System Specifications"
            : groups.get(groupId) || "",
          attributes: [],
        });
      }

      let reqViewValue = "N/A";
      if (ia.attribute_type === "SYSTEM") {
        if (ia.attribute_id === "req_quantity") {
          reqViewValue = `${item.req_quantity} ${item.req_unit}`;
        } else if (ia.attribute_id === "manufacturer" || ia.attribute_id === "brand") {
          reqViewValue = values.map((v: any) => v.value_label).join(" | ") || "N/A";
        } else {
          reqViewValue = values.map((v: any) => v.value_label).join(", ") || "N/A";
        }
      }
      else {
        const joiner = ia.connector === "AND" ? " , " : ia.connector === "OR" ? " | " : ", ";
        reqViewValue = values.map((v: any) => v.value_label).join(joiner) || "N/A";
      }

      const ea = existingAttrMap.get(proposalKey);
      if (ea) {
        initialValues[proposalKey] = {
          attribute_type: ea.attribute_type as AttributeType,
          group_id: ea.group_id,
          attribute_id: ea.attribute_id,
          attributeName: attributeName,
          is_deviation: ea.is_deviation,
          deviation_note: "",
          is_variant: ea.is_variant,
          req_value: ea.req_value,
          values: ea.values,
          buyer_accepted: ea.buyer_accepted || false,
          connector: ea.connector || ia.connector || 'OR'
        };
      } else {
        initialValues[proposalKey] = {
          attribute_type: ia.attribute_type,
          group_id: groupId,
          attribute_id: ia.attribute_id,
          attributeName: attributeName,
          is_deviation: false,
          deviation_note: "",
          is_variant: ia.is_variant,
          req_value: values,
          values: values,
          buyer_accepted: false,
          connector: ia.connector || 'OR'
        };
      }

      map.get(groupId).attributes.push({
        key: proposalKey,
        attribute_type: ia.attribute_type,
        group_id: groupId,
        attribute_id: ia.attribute_id,
        is_variant: initialValues[proposalKey].is_variant,
        attributeName: attributeName,
        description: ia.description,
        connector: initialValues[proposalKey].connector,
        values,
        reqViewValue,
      });

    });
    const entries = [...map.entries()];
    setAttributeGroupsMap(entries);
    setProposalAttributes(initialValues);

    let initialVariants: (SellerQuoteVariant & { [key: string]: any; })[] = [];

    if (existingQuoteVariants && existingQuoteVariants.length > 0) {
      initialVariants = existingQuoteVariants;
    } else {
      initialVariants = [{
        id: crypto.randomUUID(),
        seller_quote_id: existingQuote?.id || "",
        is_default: true,
        offer_price: 0,
        combinations: [],
        buyer_accepted: false
      }];
    }
    setProposalVariants(initialVariants);

  }, [item, itemAttributes, attributeGroups, catalogAttributes, catalogAttributeValues, allBrands, allManufacturers, existingQuote, existingQuoteAttributes, existingQuoteVariants]);

  const isLoading = data === undefined;

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 font-sans animate-pulse">Loading Quote Editor...</h2>
      </div>
    );
  }

  if (!rfq || !item) {
    return null;
  }

  const isViewOnly = ['SUBMITTED', "DEVIATION_ACCEPTED", "PRODUCT_SUBMIT_REVISION", "FINAL_ACKNOWLEDGE", 'REJECTED'].includes(existingQuote?.status ?? '');

  const recalculateVariants = (currentAttributes: Record<string, ProposalAttribute>) => {
    const variantAttrs = Object.values(currentAttributes).filter(attr => attr.is_variant && attr.values.length > 0);

    if (variantAttrs.length === 0) {
      setProposalVariants(prev => {
        const existingDefault = prev.find(v => v.combinations.length === 0);
        return [{
          id: existingDefault?.id || crypto.randomUUID(),
          seller_quote_id: existingQuote?.id || "",
          is_default: true,
          offer_price: existingDefault?.offer_price || 0,
          combinations: [],
          buyer_accepted: existingDefault?.buyer_accepted || false
        }];
      });
      return;
    }

    const cartesian = (arrays: any[][]) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(c => curr.map(n => [...c, n]));
      }, [[]]);
    };

    const arraysToCombine = variantAttrs.map(attr =>
      attr.values.map(v => ({ attribute_id: attr.attribute_id, value_id: v.value_id, value_label: v.value_label, attribute_name: attr.attributeName }))
    );

    const combinations = cartesian(arraysToCombine);
    setBulkPrice(undefined)
    setProposalVariants(prev => {
      return combinations.map(combo => {
        const sortedCombo = [...combo].sort((a, b) => a.attribute_id.localeCompare(b.attribute_id));
        const comboSignature = sortedCombo.map(c => `${c.attribute_id}:${c.value_id}`).join('|');

        const existingMatch = prev.find(v => {
          const sortedExisting = [...v.combinations].sort((a, b) => a.attribute_id.localeCompare(b.attribute_id));
          const existingSignature = sortedExisting.map(c => `${c.attribute_id}:${c.value_id}`).join('|');
          return existingSignature === comboSignature;
        });

        if (existingMatch) {
          return {
            ...existingMatch,
            combinations: combo
          };
        }

        return {
          id: crypto.randomUUID(),
          seller_quote_id: existingQuote?.id || "",
          is_default: false,
          offer_price: 0,
          combinations: combo,
          buyer_accepted: false
        };
      });
    });
  };

  const handleSave = async (submitMode: 'DRAFT' | 'SUBMITTED') => {
    if (!item || !rfq || !activePartyId) return;

    setSubmitting(true);
    try {
      const quoteId = existingQuote?.id || crypto.randomUUID();
      // const priceStr = proposalAttributes['system_req_unit_price']?.values.find(i => i.value_id == "req-unit-price")?.value_label || '0';
      const qtyStr = proposalAttributes['system_req_quantity']?.values.find(i => i.value_id == "req-quantity")?.value_label || '0';
      const qtyUnit = proposalAttributes['system_req_quantity']?.values.find(i => i.value_id == "req-quantity-unit")?.value_label || '0';

      // const offerPrice = parseFloat(priceStr);
      const offerQty = parseFloat(qtyStr);

      if (submitMode === 'SUBMITTED') {
        const invalidVariants = proposalVariants.filter(v => typeof v.offer_price !== 'number' || isNaN(v.offer_price) || v.offer_price <= 0);
        if (invalidVariants.length > 0) {
          antMessage.error('Please enter a valid price greater than 0 for all variants.');
          setSubmitting(false);
          return;
        }

        if (isNaN(offerQty) || offerQty <= 0) {
          antMessage.error('Please enter a valid quantity.');
          setSubmitting(false);
          return;
        }
      }

      const quoteToSave: SellerQuote = {
        id: quoteId,
        rfq_item_id: item.id,
        round: existingQuote?.round || 1,
        seller_party_id: activePartyId,
        seller_quote_number: quoteNumber,
        // offer_unit_price: offerPrice || 0,
        offer_quantity: offerQty || 0,
        offer_unit: qtyUnit,
        status: submitMode,
        created_at: existingQuote?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const attributesToSave: SellerQuoteAttribute[] = [];
      attributeGroupsMap.forEach(([groupId, group]) => {
        group.attributes.forEach((attr: any) => {
          const attributeData = proposalAttributes[`${groupId}_${attr.attribute_id}`] || null;
          if (attributeData) {
            attributesToSave.push({
              id: crypto.randomUUID(),
              seller_quote_id: quoteId,
              attribute_type: attributeData.attribute_type,
              group_id: groupId,
              attribute_id: attr.attribute_id,
              is_variant: attributeData.is_variant,
              req_value: attributeData.req_value || [],
              values: attributeData.values || [],
              is_deviation: attributeData.is_deviation,
              deviation_note: attributeData.deviation_note || '',
              buyer_accepted: attributeData.buyer_accepted || false,
              connector: attributeData.connector || 'AND'
            });
          }
        });
      });

      const commentsToSave: SellerQuoteComment[] = [];
      attributesToSave.forEach((attr) => {
        if (attr.is_deviation && attr.deviation_note) {
          commentsToSave.push({
            id: crypto.randomUUID(),
            seller_quote_id: quoteId,
            round: existingQuote?.round || 1,
            attribute_type: attr.attribute_type,
            group_id: attr.group_id,
            attribute_id: attr.attribute_id,
            comment: attr.deviation_note || '',
            actor_type: "SELLER",
            actor_id: activePartyId,
            created_at: new Date().toISOString(),
          });
        }
      });

      const variantsToSave: SellerQuoteVariant[] = proposalVariants.map(v => ({
        ...v,
        seller_quote_id: quoteId,
      }));

      await rfqDb.transaction('rw', rfqDb.seller_quotes, rfqDb.seller_quote_attributes, rfqDb.seller_quote_variants, rfqDb.seller_quote_comments, async () => {
        await rfqDb.seller_quotes.put(quoteToSave);
        const oldAttrs = await rfqDb.seller_quote_attributes.where('seller_quote_id').equals(quoteId).toArray();
        await rfqDb.seller_quote_attributes.bulkDelete(oldAttrs.map(a => a.id));
        if (attributesToSave.length > 0) {
          await rfqDb.seller_quote_attributes.bulkAdd(attributesToSave);
        }

        const oldVariants = await rfqDb.seller_quote_variants.where('seller_quote_id').equals(quoteId).toArray();
        await rfqDb.seller_quote_variants.bulkDelete(oldVariants.map(v => v.id));
        if (variantsToSave.length > 0) {
          await rfqDb.seller_quote_variants.bulkAdd(variantsToSave);
        }

        if (commentsToSave.length > 0) {
          await rfqDb.seller_quote_comments.bulkAdd(commentsToSave);
        }
      });

      antMessage.success(submitMode === 'SUBMITTED' ? 'Proposal submitted successfully!' : 'Draft saved successfully!');
      navigate(basePath);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to save proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const attributesColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      className: "w-[50px] max-w-[50px] align-top",
      render: (_: string, __: any, index: number) => <span className='pl-1.5'>{index + 1}</span>
    },
    {
      title: 'Attribute',
      dataIndex: 'attributeName',
      key: 'attributeName',
      className: "min-w-50 align-top",
      render: (text: string, record: any) => {
        const proposalKey = `${record.group_id}_${record.attribute_id}`;
        const attributeData = proposalAttributes[proposalKey];
        const showStatus = existingQuote && ['REVISION_REQUIRED', 'SUBMITTED', 'DRAFT'].includes(existingQuote.status);
        return (
          <div className="flex flex-col gap-1.5 py-0.5">
            <div className="flex flex-col gap-0.5">
              <div className="font-semibold text-slate-800 leading-tight">{text}</div>
              {record.description && (
                <div className="text-[11px] text-slate-500 leading-tight italic">{record.description}</div>
              )}
            </div>

            <div className="flex flex-wrap gap-1 items-center">
              {record.is_variant && (
                <AntTag className="inline-flex items-center m-0 leading-tight bg-blue-50 min-h-5 text-blue-600 border-blue-200" icon={<AntIconCheckCircleOutlined />}>
                  Variant
                </AntTag>
              )}
              {proposalAttributes[proposalKey]?.is_deviation && (
                <AntTag className="inline-flex items-center min-h-5 leading-tight bg-amber-50 text-amber-700 border-amber-200">Deviation</AntTag>
              )}
              {showStatus && attributeData && (
                attributeData.buyer_accepted ? (
                  <AntTag className="inline-flex items-center min-h-5 m-0 leading-tight bg-emerald-50/50 text-emerald-600 border-emerald-100">Approved</AntTag>
                ) : (
                  <AntTag className="inline-flex items-center min-h-5 m-0 leading-tight bg-red-50/10 text-red-400 border-red-100">Not Accepted</AntTag>
                )
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Requested Value',
      dataIndex: 'reqViewValue',
      key: 'reqViewValue',
      className: "w-90 max-w-90 align-top",
      render: (_: string, record: any) => {
        const isQty = record.attribute_id === 'req_quantity';
        const forceORDisabled = record.attribute_id === 'manufacturer' || record.attribute_id === 'brand';
        const itemAttr = itemAttributes?.find((a: any) => a.group_id === record.group_id && a.attribute_id === record.attribute_id);
        const reqConnector = forceORDisabled ? "OR" : (itemAttr?.connector || 'AND');
        const reqJoiner = reqConnector === "OR" ? " | " : " , ";

        let requestedContent: React.ReactNode;
        if (isQty) {
          const qtyVal = record.values?.find((v: any) => v.value_id === 'req-quantity')?.value_label || '';
          const qtyUnit = record.values?.find((v: any) => v.value_id === 'req-quantity-unit')?.value_label || '';
          requestedContent = (
            <span className="text-slate-700 font-bold text-[14px]">
              {qtyVal ? `${qtyVal} ${qtyUnit}`.trim() : 'N/A'}
            </span>
          );
        } else {
          const reqValues = record.values || [];
          if (reqValues.length === 0) {
            requestedContent = <span className="text-slate-400 italic">N/A</span>;
          } else {
            requestedContent = (
              <div className="flex flex-wrap items-center gap-y-1">
                {reqValues.map((v: any, index: number) => {
                  const isLast = index === reqValues.length - 1;
                  return (
                    <div key={v.value_id} className='flex items-center'>
                      <AntTag className="inline-flex items-center m-0 min-h-6 leading-tight bg-slate-50 text-slate-600 border-slate-200">
                        {v.value_label}
                      </AntTag>
                      {!isLast && (
                        <span className="mx-1 text-slate-500 font-bold text-[13px] select-none">
                          {reqJoiner}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
        }

        return (
          <span className="text-slate-600 font-medium">
            {requestedContent}
          </span>
        );
      }
    },

    {
      title: 'Proposal Value',
      dataIndex: 'proposalValue',
      key: 'proposalValue',
      className: "w-90 max-w-90 align-top",
      render: (_: string, attribute: any) => {
        const proposalKey = `${attribute.group_id}_${attribute.attribute_id}`
        const currentProposalAttr = proposalAttributes[proposalKey];

        const renderCustomTag = ({ label, value, closable, onClose }: any) => {
          const currentValues = currentProposalAttr?.values?.map((v: any) => v.value_id) || [];
          const index = currentValues.indexOf(value);
          const isLast = index === currentValues.length - 1;

          const forceORDisabled = attribute.attribute_id === 'manufacturer' || attribute.attribute_id === 'brand';
          const connector = forceORDisabled ? "OR" : (currentProposalAttr?.connector || 'AND');
          const propJoiner = connector === "OR" ? " | " : " , ";

          return (
            <span className="inline-flex items-center my-0.5">
              <AntTag className="inline-flex items-center m-0 min-h-6 leading-tight bg-slate-100/80 border border-slate-200 text-slate-700 pr-1 pl-2 gap-1">
                <span>{label}</span>
                {closable && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
                    className="inline-flex items-center justify-center w-4 h-4 p-0 border-0 rounded-full bg-transparent text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer transition-colors"
                    aria-label={`Remove ${label}`}
                  >
                    <Lucide.X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </AntTag>
              {!isLast && (
                <span className="mx-0.5 text-emerald-600 font-bold text-[13px] select-none">
                  {propJoiner}
                </span>
              )}
            </span>
          );
        };

        let field: any;
        const isQty = attribute.attribute_id === 'req_quantity';
        const forceORDisabled = attribute.attribute_id === 'manufacturer' || attribute.attribute_id === 'brand';

        if (isQty) {
          field = (
            <AntInput
              disabled={isViewOnly}
              value={proposalAttributes[proposalKey]?.values?.find((i: any) => i.value_id === "req-quantity")?.value_label ?? ''}
              className="w-80"
              onChange={(e) => {
                const val = Number(e.target.value);
                if (isNaN(val) || val <= 0) {
                  antMessage.error('Please enter a valid quantity.');
                  return;
                }
                const unit = attribute?.values?.find((i: any) => i.value_id === "req-quantity-unit");
                const initialAttr = existingQuoteAttributes?.find(ea => ea.group_id === attribute.group_id && ea.attribute_id === attribute.attribute_id);
                const initVal = initialAttr?.values?.find(v => v.value_id === 'req-quantity')?.value_label || '';
                const isChangedFromPrev = e.target.value !== initVal;

                setProposalAttributes(prev => {
                  const reqValStr = prev[proposalKey]?.req_value?.find((i: any) => i.value_id === "req-quantity")?.value_label || '';
                  const is_deviation = e.target.value !== reqValStr;

                  return {
                    ...prev, [proposalKey]: {
                      ...prev[proposalKey],
                      values: [{ value_id: 'req-quantity', value_label: e.target.value }, unit],
                      is_deviation: is_deviation,
                      buyer_accepted: isChangedFromPrev ? false : (initialAttr?.buyer_accepted ?? false)
                    }
                  };
                });
              }}
            />
          )
        } else if (attribute.attribute_type === 'SYSTEM' && attribute.attribute_id !== 'manufacturer' && attribute.attribute_id !== 'brand') {
          field = "Contact System admin";
        } else {
          let options: { label: string; value: string }[] = [];
          let placeholder = `Select ${attribute.attributeName}`;

          if (attribute.attribute_type === 'SYSTEM' && attribute.attribute_id === 'manufacturer') {
            options = (allManufacturers || []).map((v: any) => ({ label: v.company_name, value: v.id }));
            placeholder = "Select Preferred Manufacturer(s)";
          } else if (attribute.attribute_type === 'SYSTEM' && attribute.attribute_id === 'brand') {
            options = (allBrands || []).map((v: any) => ({ label: v.name, value: v.id }));
            placeholder = "Select Preferred Brand(s)";
          } else {
            const values = catalogAttributeValues?.filter((v) => v.attributeId === attribute.attribute_id) || [];
            options = values.map((v: any) => ({ label: v.value || v.label, value: v.id }));
          }

          field = (
            <AntSelect
              disabled={isViewOnly}
              mode="multiple"
              allowClear
              tagRender={renderCustomTag}
              placeholder={placeholder}
              className="w-80"
              value={proposalAttributes[proposalKey]?.values?.map((v: any) => v.value_id) || []}
              onChange={(val: string[]) => {
                const newValues = val.map(id => {
                  const matched = options.find((o: any) => o.value === id);
                  return { value_id: id, value_label: matched?.label || id };
                });

                const initialAttr = existingQuoteAttributes?.find(ea => ea.group_id === attribute.group_id && ea.attribute_id === attribute.attribute_id);
                const initValIds = initialAttr?.values?.map(v => v.value_id) || [];
                const isChangedFromPrev = initValIds.length !== val.length || !initValIds.every(id => val.includes(id));

                setProposalAttributes(prev => {
                  const reqValIds = prev[proposalKey]?.req_value?.map((v: any) => v.value_id) || [];
                  const sortedReq = [...reqValIds].sort();
                  const sortedNew = [...val].sort();
                  const is_deviation = sortedReq.length !== sortedNew.length || !sortedReq.every((v, i) => v === sortedNew[i]);

                  const next = {
                    ...prev, [proposalKey]: {
                      ...prev[proposalKey],
                      values: newValues,
                      is_deviation: is_deviation,
                      buyer_accepted: isChangedFromPrev ? false : (initialAttr?.buyer_accepted ?? false)
                    }
                  };
                  if (next[proposalKey].is_variant) {
                    recalculateVariants(next);
                  }
                  return next;
                });
              }}
              options={options}
            />
          );
        }

        return (
          <div className="flex gap-2 flex-col">
            <div className="w-full">
              {!isQty && !forceORDisabled && (
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded px-2 py-1 mb-1.5 w-max">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Connector</span>
                    <AntSelect
                      size='small'
                      disabled={isViewOnly || proposalAttributes[proposalKey]?.is_variant || forceORDisabled}
                      value={forceORDisabled ? 'OR' : (proposalAttributes[proposalKey]?.connector || 'AND')}
                      onChange={(val) => {
                        setProposalAttributes(prev => ({
                          ...prev,
                          [proposalKey]: {
                            ...prev[proposalKey],
                            connector: val
                          }
                        }));
                      }}
                      options={[
                        { label: 'AND', value: 'AND' },
                        { label: 'OR', value: 'OR' }
                      ]}
                      className="w-[65px]"
                    />
                  </div>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Variant</span>
                    <Switch
                      size='small'
                      disabled={isViewOnly}
                      checked={proposalAttributes[proposalKey]?.is_variant}
                      onChange={(checked) => {
                        setProposalAttributes(prev => {
                          const next = {
                            ...prev,
                            [proposalKey]: {
                              ...prev[proposalKey],
                              is_variant: checked,
                              connector: checked ? "OR" : prev[proposalKey].connector
                            }
                          };
                          recalculateVariants(next);
                          return next;
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              {field}
            </div>
            <div className="flex flex-col">
              {proposalAttributes[proposalKey]?.is_deviation && !isViewOnly && (
                <div>
                  <AntInput.TextArea
                    size='small'
                    className="w-80"
                    placeholder="Deviation Reason"
                    value={proposalAttributes[proposalKey]?.deviation_note}
                    rows={1}
                    onChange={(e) => {
                      setProposalAttributes(prev => ({
                        ...prev, [proposalKey]: {
                          ...prev[proposalKey],
                          deviation_note: e.target.value
                        }
                      }));
                    }}
                  />
                </div>
              )}
              <div className="mt-1 space-y-1 text-left w-full">
                {existingQuoteAttributesComments
                  ?.filter(c => c.attribute_id === attribute.attribute_id && c.group_id === attribute.group_id)
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((c) => {
                    const isBuyer = c.actor_type === 'BUYER';
                    const isSelf = c.actor_type === 'SELLER';
                    const name = isSelf ? 'You' : 'Requester';
                    const timeStr = c.created_at
                      ? `${new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : '';
                    return (
                      <div
                        key={c.id}
                        className={`text-[11px] px-2 py-0.5 rounded leading-normal border ${isBuyer ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'}`}
                      >
                        <span className="font-bold text-[9px] uppercase tracking-wider mr-1 opacity-70">[{name} {timeStr}]:</span>
                        <span className="font-medium whitespace-pre-wrap">{c.comment}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Request & Quote Details */}
      <Descriptions title="Request & Quote Details" bordered size="small" column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }} className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
        <Descriptions.Item label="Product / Service" span={3}>
          <strong className="text-slate-800 text-base">{catalogProduct?.name || 'Custom Specifications'}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Quote Reference">
          <AntTag color="purple" className="font-mono font-bold m-0 text-[13px]">{quoteNumber}</AntTag>
        </Descriptions.Item>
        <Descriptions.Item label="Quote Status">
          <AntTag
            color={!existingQuote ? 'default' : existingQuote.status === 'SUBMITTED' ? 'blue' : existingQuote.status === 'DRAFT' ? 'orange' : existingQuote.status === 'REJECTED' ? 'red' : 'default'}
            className="font-bold m-0"
          >
            {existingQuote?.status || 'NEW'}
          </AntTag>
        </Descriptions.Item>
        <Descriptions.Item label="Round">
          <div className="flex items-center gap-1.5">
            <ReloadOutlined className="text-blue-500 text-[13px]" />
            <span className="font-bold text-slate-800 text-[13px]">Round {existingQuote?.round ?? 1}</span>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="RFQ Number">
          <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <span className="text-slate-700">{categories?.find((c) => c.id === item.category_id)?.name || 'Unknown'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Requested Quantity">
          <AntTag color="blue" className="font-bold m-0">{item.req_quantity} {item.req_unit || 'pcs'}</AntTag>
        </Descriptions.Item>
        {existingQuote?.created_at && (
          <Descriptions.Item label="Created">
            <span className="text-slate-600 text-xs">{new Date(existingQuote.created_at).toLocaleString()}</span>
          </Descriptions.Item>
        )}
        {existingQuote?.updated_at && (
          <Descriptions.Item label="Last Updated" span={2}>
            <span className="text-slate-600 text-xs">{new Date(existingQuote.updated_at).toLocaleString()}</span>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div className="space-y-6">
        <h3 className="text-base font-bold text-slate-900 pt-3">Attribute configuration</h3>
        {attributeGroupsMap.map(([groupId, group], idx) => {
          const accentColor = ['#527EA3', '#5D9365', '#C9825A', '#8975A8'][idx % 4];

          return (
            <div key={groupId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid ${accentColor}` }}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `${accentColor}14` }}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: accentColor }}>
                    {idx + 1}
                  </span>
                  <h4 className="text-md font-bold text-slate-800">{group.name}</h4>
                </div>
                <AntTag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                  {group.attributes.length} attributes
                </AntTag>
              </div>
              <div className="p-3">
                <Table
                  dataSource={group.attributes}
                  columns={groupId === 'system' ? attributesColumns.filter(c => c.key !== 'is_variant' && c.key !== 'connector') : attributesColumns}
                  pagination={false}
                  size="small"
                  bordered
                  scroll={{ x: 768 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6 mt-6">
        <h3 className="text-base font-bold text-slate-900 pt-3">Variant Configuration</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #527EA3` }}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#527EA314` }}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#527EA3' }}>
                V
              </span>
              <h4 className="text-md font-bold text-slate-800">Variant and Price</h4>
            </div>
            {!isViewOnly && (
              <div className="flex items-center gap-2">
                <AntInput
                  type="number"
                  size="small"
                  placeholder="Bulk Price"
                  prefix="$"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-32"
                />
                <AntButton
                  size="small"
                  type="primary"
                  onClick={() => {
                    if (bulkPrice !== undefined && bulkPrice >= 0) {
                      setProposalVariants(prev => prev.map(v => ({ ...v, offer_price: bulkPrice })));
                      antMessage.success(`Bulk price applied to all variants`);
                    } else {
                      antMessage.error(`Please enter a valid price to apply`);
                    }
                  }}
                >
                  Apply to All
                </AntButton>
              </div>
            )}
          </div>
          <div className="p-3">
            <Table
              dataSource={proposalVariants}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
              bordered
              columns={[
                {
                  title: 'S.No',
                  key: 'sno',
                  className: "w-[50px] max-w-[50px] align-top",
                  render: (_: string, __: any, index: number) => <span className='pl-1.5'>{index + 1}</span>
                },
                {
                  title: 'Variant Combinations',
                  key: 'combinations',
                  className: "align-top",
                  render: (_: string, record: SellerQuoteVariant) => {
                    const showStatus = existingQuote && ['REVISION_REQUIRED', 'SUBMITTED', 'DRAFT'].includes(existingQuote.status);

                    if (!record.combinations || record.combinations.length === 0) {
                      return (
                        <div className="flex items-center">
                          <span className="text-slate-500 italic">Default Variant</span>
                          {showStatus && (
                            record.buyer_accepted ? (
                              <AntTag className="ml-2 bg-emerald-50/50 text-emerald-600 border-emerald-100">Approved</AntTag>
                            ) : (
                              <AntTag className="ml-2 bg-red-50/10 text-red-400 border-red-100">Not Accepted</AntTag>
                            )
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {record.combinations.map((c, i) => {
                            return <AntTag key={i} color="blue">
                              {/* {c.attribute_name}: */}
                              {c.value_label}</AntTag>
                          })}
                        </div>
                        <div className="">
                          {showStatus && (
                            record.buyer_accepted ? (
                              <AntTag className="bg-emerald-50/50 text-emerald-600 border-emerald-100">Approved</AntTag>
                            ) : (
                              <AntTag className="bg-red-50/10 text-red-400 border-red-100">Not Accepted</AntTag>
                            )
                          )}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  title: 'Unit Price',
                  key: 'offer_price',
                  className: "w-[250px] max-w-[250px] align-top",
                  render: (_: string, record: SellerQuoteVariant) => (
                    <AntInput
                      type="number"
                      disabled={isViewOnly}
                      value={record.offer_price || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProposalVariants(prev => prev.map(v => v.id === record.id ? { ...v, offer_price: val } : v));
                      }}
                      prefix="$"
                      placeholder="Enter price"
                    />
                  )
                }
              ]}
            />
          </div>
        </div>
      </div>

      {!isViewOnly && (
        <div className="pt-6 flex justify-end gap-3 mt-6">
          <AntButton onClick={() => navigate(basePath)}>Cancel</AntButton>
          <AntButton type="primary" icon={<SendOutlined />} onClick={() => handleSave('SUBMITTED')} loading={submitting} className="bg-blue-600 hover:bg-blue-700">
            Submit Proposal
          </AntButton>
        </div>
      )}
    </div>
  );
};





const StepProductMapping: React.FC<{ rfqId: string; itemId: string; activePartyId: string }> = ({ rfqId, itemId, activePartyId }) => {
  return (
    <div className="p-8">
      <Result
        status="info"
        title="Product Mapping & Creation"
        subTitle="This step is for mapping the negotiated item to your catalog product or creating a new product based on the accepted specifications."
        extra={[
          <AntButton type="primary" key="map">
            Map / Create Product
          </AntButton>
        ]}
      />
    </div>
  );
};






const StepFinalAcknowledgement: React.FC<{ rfqId: string; itemId: string; activePartyId: string }> = ({ rfqId, itemId, activePartyId }) => {
  return (
    <div className="p-8">
      <Result
        status="success"
        title="Final Acknowledgement"
        subTitle="Both parties have approved the product mapping and specifications. Waiting for final confirmation or Purchase Order generation."
        extra={[
          <AntButton type="primary" key="ack">
            Acknowledge
          </AntButton>
        ]}
      />
    </div>
  );
};
