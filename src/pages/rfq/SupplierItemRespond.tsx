import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input as AntInput, Button as AntButton, Select as AntSelect, Tag as AntTag, Table, Descriptions, App as AntApp, Switch, Steps, Result } from 'antd';
import { SendOutlined, ReloadOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined, PlusOutlined as AntPlusOutlined } from '@ant-design/icons';
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
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Professional Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">RFQ Item Proposal Wizard</h1>
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {rfq.rfq_number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Sourcing proposal and offer response for <strong className="text-slate-700">{rfq.requester_name || 'Requester'}</strong>
          </p>
        </div>
      </div>

      <Card size="small" className="shadow-sm border-slate-200">
        <div className="pt-2 px-2">
          <Steps
            current={viewStep}
            onChange={(step) => setViewStep(step)}
            titlePlacement="vertical"
            ellipsis
            items={[
              { title: 'Quote Proposal' },
              { title: 'Product Mapping' },
              { title: 'Final Approval' },
            ]}
          />
          <div className="py-2.5 border-b border-slate-100 text-center">
            {viewStep === 0 && (
              <p className="text-xs text-slate-500 m-0">Submit or revise your offer specifications and proposal pricing options.</p>
            )}
            {viewStep === 1 && (
              <p className="text-xs text-slate-500 m-0">Map negotiated item to your product catalog SKU.</p>
            )}
            {viewStep === 2 && (
              <p className="text-xs text-slate-500 m-0">Final sign-off by both parties.</p>
            )}
          </div>

          <div className="flex items-center justify-between py-3 mb-2">
            <AntButton
              size="small"
              disabled={viewStep === 0}
              onClick={() => setViewStep(v => v - 1)}
              icon={<ArrowLeftOutlined />}
            >
              Previous Step
            </AntButton>
            <AntButton
              size="small"
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
      allBrandParties,
      allManufacturers,
      allSellerProducts,
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
      businessDb.brandParties.toArray(),
      businessDb.manufacturers.toArray(),
      catalogDb.sellerProducts.toArray(),
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
      allBrandParties,
      allManufacturers,
      allSellerProducts,
      categories,
      catalogAttributes,
      catalogAttributeValues,
      attributeGroups,
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
    allBrandParties,
    allManufacturers,
    allSellerProducts,
    categories,
    catalogAttributes,
    catalogAttributeValues,
    attributeGroups,
    catalogProduct
  } = data || {};

  const parsePairValues = (values: ItemAttributeValue[] = []) => {
    return values.map((v, idx) => {
      const parts = (v.value_id || '').split(':');
      const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
      const brandId = parts[1] !== 'any' ? parts[1] : undefined;
      return {
        id: `pair-${idx}-${v.value_id}`,
        manufacturer_id: mfgId,
        brand_id: brandId,
        description: (v as any).description || ''
      };
    });
  };

  const pairsToAttributeValues = (pairs: { manufacturer_id?: string; brand_id?: string; description?: string }[]): ItemAttributeValue[] => {
    return pairs.map(p => {
      const mfg = (allManufacturers || []).find((m: any) => m.id === p.manufacturer_id);
      const brand = (allBrands || []).find((b: any) => b.id === p.brand_id);
      const mfgLabel = mfg?.company_name || p.manufacturer_id || 'Any Manufacturer';
      const brandLabel = brand?.name || p.brand_id || 'Any Brand';
      const noteLabel = p.description ? ` (${p.description})` : '';

      return {
        value_id: `${p.manufacturer_id || 'any'}:${p.brand_id || 'any'}`,
        value_label: `${mfgLabel} — ${brandLabel}${noteLabel}`,
        description: p.description
      } as any;
    });
  };

  const isMappedPair = (mfgId?: string, brandId?: string) => {
    if (!mfgId || !brandId) return true;
    const inSellerProducts = (allSellerProducts || []).some(
      (sp: any) => sp.manufacturer_id === mfgId && sp.brand_id === brandId
    );
    if (inSellerProducts) return true;

    const mfgObj = (allManufacturers || []).find((m: any) => m.id === mfgId);
    if (mfgObj?.manufacturer_party_id) {
      const inBrandParties = (allBrandParties || []).some(
        (bp: any) => bp.brand_id === brandId && bp.party_id === mfgObj.manufacturer_party_id
      );
      if (inBrandParties) return true;
    }
    return false;
  };

  const getRowMfgOptions = (selectedBrandId?: string) => {
    const dynamicMfgOptions = [
      {
        label: 'Manufacturers',
        options: (allManufacturers || []).map((m: any) => ({ label: m.company_name, value: m.id }))
      }
    ];

    if (!selectedBrandId) return dynamicMfgOptions;

    const mfgIdsForBrand = new Set<string>();
    (allSellerProducts || []).forEach((sp: any) => {
      if (sp.brand_id === selectedBrandId && sp.manufacturer_id) {
        mfgIdsForBrand.add(sp.manufacturer_id);
      }
    });

    const brandPartiesForBrand = (allBrandParties || []).filter((bp: any) => bp.brand_id === selectedBrandId);
    const partyIds = new Set(brandPartiesForBrand.map((bp: any) => bp.party_id));
    (allManufacturers || []).forEach((m: any) => {
      if (m.manufacturer_party_id && partyIds.has(m.manufacturer_party_id)) {
        mfgIdsForBrand.add(m.id);
      }
    });

    if (mfgIdsForBrand.size === 0) return dynamicMfgOptions;

    const brandObj = (allBrands || []).find((b: any) => b.id === selectedBrandId);
    const brandName = brandObj?.name || selectedBrandId;

    const mappedOpts = Array.from(mfgIdsForBrand).map((mId: string) => {
      const m = (allManufacturers || []).find((mfg: any) => mfg.id === mId);
      return { label: `${m?.company_name || mId}`, value: mId };
    });

    const otherOpts = (allManufacturers || [])
      .filter((m: any) => !mfgIdsForBrand.has(m.id))
      .map((m: any) => ({ label: m.company_name, value: m.id }));

    return [
      { label: `Available Manufacturers for ${brandName}`, options: mappedOpts },
      { label: `Other Manufacturers`, options: otherOpts },
    ].filter((g) => g.options.length > 0);
  };

  const getRowBrandOptions = (selectedMfgId?: string) => {
    const dynamicBrandOptions = [
      {
        label: 'Brands',
        options: (allBrands || []).map((b: any) => ({ label: b.name, value: b.id }))
      }
    ];

    if (!selectedMfgId) return dynamicBrandOptions;

    const brandIdsForMfg = new Set<string>();
    (allSellerProducts || []).forEach((sp: any) => {
      if (sp.manufacturer_id === selectedMfgId && sp.brand_id) {
        brandIdsForMfg.add(sp.brand_id);
      }
    });

    const selectedMfgObj = (allManufacturers || []).find((m: any) => m.id === selectedMfgId);
    if (selectedMfgObj?.manufacturer_party_id) {
      const partyId = selectedMfgObj.manufacturer_party_id;
      const matchingBrandParties = (allBrandParties || []).filter((bp: any) => bp.party_id === partyId);
      matchingBrandParties.forEach((bp: any) => {
        if (bp.brand_id) brandIdsForMfg.add(bp.brand_id);
      });
    }

    if (brandIdsForMfg.size === 0) return dynamicBrandOptions;

    const mfgObj = (allManufacturers || []).find((m: any) => m.id === selectedMfgId);
    const mfgName = mfgObj?.company_name || selectedMfgId;

    const mappedOpts = Array.from(brandIdsForMfg).map((bId: string) => {
      const b = (allBrands || []).find((brand: any) => brand.id === bId);
      return { label: `${b?.name || bId}`, value: bId };
    });

    const otherOpts = (allBrands || [])
      .filter((b: any) => !brandIdsForMfg.has(b.id))
      .map((b: any) => ({ label: b.name, value: b.id }));

    return [
      { label: `Available Brands for ${mfgName}`, options: mappedOpts },
      { label: `Other Brands`, options: otherOpts },
    ].filter((g) => g.options.length > 0);
  };

  const quoteNumber = React.useMemo(() => {
    return existingQuote?.seller_quote_number;
  }, [existingQuote, itemId, activePartyId]);

  const computeSignature = (combinations: any[]): string => {
    if (!combinations || combinations.length === 0) return 'default';
    const sortedCombo = [...combinations].sort((a, b) => (a.attribute_id || '').localeCompare(b.attribute_id || ''));
    return sortedCombo.map(c => `${c.attribute_id}:${c.value_id}`).join('|');
  };

  const generateVariantsFromAttributes = (
    currentAttributes: Record<string, ProposalAttribute>,
    prevVariants: SellerQuoteVariant[] = [],
    existingQuoteId: string = ''
  ): SellerQuoteVariant[] => {
    const variantAttrs = Object.values(currentAttributes).filter(
      attr => (attr.is_variant || attr.attribute_id === 'mfg_brand_mapping') && attr.values.length > 0
    );

    let customVariants: SellerQuoteVariant[] = [];

    if (variantAttrs.length === 0) {
      const existingDefault = prevVariants.find(v => v.combinations.length === 0 && (!v.option_type || v.option_type === 'CUSTOM_GENERATED'));
      const sig = 'default';
      customVariants = [{
        id: existingDefault?.id || crypto.randomUUID(),
        seller_quote_id: existingQuoteId,
        is_default: true,
        offer_price: existingDefault?.offer_price || 0,
        combinations: [],
        buyer_accepted: existingDefault?.buyer_accepted || false,
        option_type: 'CUSTOM_GENERATED',
        satisfaction_status: 'CUSTOM',
        signature: sig,
        is_selected: existingDefault?.is_selected !== undefined ? existingDefault.is_selected : true
      }];
    } else {
      const cartesian = (arrays: any[][]) => {
        return arrays.reduce((acc, curr) => {
          return acc.flatMap(c => curr.map(n => [...c, n]));
        }, [[]]);
      };

      const arraysToCombine = variantAttrs.map(attr =>
        attr.values.map(v => ({
          attribute_id: attr.attribute_id,
          value_id: v.value_id,
          value_label: v.value_label,
          attribute_name: attr.attributeName
        }))
      );

      const combinations = cartesian(arraysToCombine);

      customVariants = combinations.map(combo => {
        const comboSignature = computeSignature(combo);

        const existingMatch = prevVariants.find(v => {
          const existingSignature = v.signature || computeSignature(v.combinations);
          return existingSignature === comboSignature;
        });

        if (existingMatch) {
          return {
            ...existingMatch,
            combinations: combo,
            signature: comboSignature,
            is_selected: existingMatch.is_selected !== undefined ? existingMatch.is_selected : false,
            option_type: 'CUSTOM_GENERATED',
            satisfaction_status: 'CUSTOM'
          };
        }

        return {
          id: crypto.randomUUID(),
          seller_quote_id: existingQuoteId,
          is_default: false,
          offer_price: 0,
          combinations: combo,
          buyer_accepted: false,
          option_type: 'CUSTOM_GENERATED',
          satisfaction_status: 'CUSTOM',
          signature: comboSignature,
          is_selected: false
        };
      });
    }

    const catalogOptionsInPrev = prevVariants.filter(v => v.option_type === 'CATALOG_SKU').map(v => ({
      ...v,
      signature: v.signature || v.catalog_variant_id || v.id,
      is_selected: v.is_selected !== undefined ? v.is_selected : false
    }));

    return [...customVariants, ...catalogOptionsInPrev];
  };

  useEffect(() => {
    if (!item || !itemAttributes?.length) return;

    const groups = new Map((attributeGroups || []).map(g => [g.id, g.name]));
    const attrs = new Map((catalogAttributes || []).map(a => [a.id, a.name]));

    const getValues = (ia: any) => {
      if (ia.attribute_id === "mfg_brand_mapping") {
        return (ia.values || []).map((v: any) => ({ value_id: v.value_id, value_label: v.value_label }));
      }
      const ids = new Set((ia.values || []).map((v: any) => v.value_id));
      return (catalogAttributeValues || [])
        .filter(v => ids.has(v.id))
        .map(v => ({ value_id: v.id, value_label: v.value || v.label || "" }));
    };

    const names: Record<string, string> = {
      mfg_brand_mapping: "Manufacturer & Brand",
    };

    const map = new Map<string, any>();
    const existingAttrMap = new Map();
    const initialValues: Record<string, ProposalAttribute> = {};

    if (existingQuote && existingQuoteAttributes) {
      existingQuoteAttributes.forEach(ea => existingAttrMap.set(`${ea.group_id}_${ea.attribute_id}`, ea));
    }

    itemAttributes.forEach((ia: any) => {
      // Only include manufacturer-brand mapping and custom/catalog attributes
      if (ia.attribute_type === 'SYSTEM' && ia.attribute_id !== 'mfg_brand_mapping') {
        return;
      }

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
      if (ia.attribute_id === "mfg_brand_mapping") {
        reqViewValue = values.map((v: any) => v.value_label).join(" | ") || "N/A";
      } else {
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

    if (map.has('system')) {
      const systemGroup = map.get('system');
      const order = ['mfg_brand_mapping'];
      systemGroup.attributes.sort((a: any, b: any) => {
        const idxA = order.indexOf(a.attribute_id);
        const idxB = order.indexOf(b.attribute_id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    const entries = [...map.entries()].sort(([aId], [bId]) => {
      if (aId === 'system') return -1;
      if (bId === 'system') return 1;
      return 0;
    });

    setAttributeGroupsMap(entries);
    setProposalAttributes(initialValues);

    const generated = generateVariantsFromAttributes(initialValues, existingQuoteVariants || [], existingQuote?.id || '');

    if (existingQuoteVariants && existingQuoteVariants.length > 0) {
      const initialVariants = generated.map(v => {
        const sig = v.signature || computeSignature(v.combinations);
        const savedMatch = existingQuoteVariants.find(ev => (ev.signature || computeSignature(ev.combinations)) === sig);
        if (savedMatch) {
          return {
            ...v,
            ...savedMatch,
            signature: sig,
            is_selected: savedMatch.is_selected !== undefined ? savedMatch.is_selected : true
          };
        }
        return {
          ...v,
          signature: sig,
          is_selected: false
        };
      });
      setProposalVariants(initialVariants);
    } else {
      setProposalVariants(generated);
    }

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
    setBulkPrice(undefined);
    setProposalVariants(prev => generateVariantsFromAttributes(currentAttributes, prev, existingQuote?.id || ''));
  };

  const handleSave = async (submitMode: 'DRAFT' | 'SUBMITTED') => {
    if (!item || !rfq || !activePartyId) return;

    setSubmitting(true);
    try {
      const quoteId = existingQuote?.id || crypto.randomUUID();
      const offerQty = item.req_quantity || 0;
      const qtyUnit = item.req_unit || 'pcs';

      const selectedVariants = proposalVariants.filter(v => v.is_selected);

      // Validation 1: Minimum one selected variant required
      if (selectedVariants.length === 0) {
        antMessage.error('Please select at least one proposal option to include in your offer.');
        setSubmitting(false);
        return;
      }

      // Validation 2: Price for each selected variant option must be strictly greater than zero
      const invalidVariants = selectedVariants.filter(
        v => typeof v.offer_price !== 'number' || isNaN(v.offer_price) || v.offer_price <= 0
      );
      if (invalidVariants.length > 0) {
        antMessage.error('Price for all selected proposal options must be greater than 0.');
        setSubmitting(false);
        return;
      }

      if (submitMode === 'SUBMITTED') {
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

      const variantsToSave: SellerQuoteVariant[] = selectedVariants.map(v => ({
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
        const forceORDisabled = record.attribute_id === 'mfg_brand_mapping';
        const itemAttr = itemAttributes?.find((a: any) => a.group_id === record.group_id && a.attribute_id === record.attribute_id);
        const reqConnector = forceORDisabled ? "OR" : (itemAttr?.connector || 'AND');
        const reqJoiner = reqConnector === "OR" ? " | " : " , ";

        let requestedContent: React.ReactNode;
        if (record.attribute_id === 'mfg_brand_mapping') {
          const reqValues = record.values || [];
          if (reqValues.length === 0) {
            requestedContent = <span className="text-slate-400 italic">No manufacturer-brand mapping</span>;
          } else {
            requestedContent = (
              <div className="space-y-1.5">
                {reqValues.map((v: any, index: number) => {
                  const parts = (v.value_id || '').split(':');
                  const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                  const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                  const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                  const brand = (allBrands || []).find((b: any) => b.id === brandId);
                  const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Manufacturer');
                  const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                  return (
                    <div key={v.value_id || index} className="flex flex-wrap items-center gap-1 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs">
                      <AntTag color="purple" className="m-0 text-[11px]">Mfg: {mfgName}</AntTag>
                      <span className="text-slate-400 font-bold">×</span>
                      <AntTag color="blue" className="m-0 text-[11px]">Brand: {brandName}</AntTag>
                    </div>
                  );
                })}
              </div>
            );
          }
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

        const forceORDisabled = attribute.attribute_id === 'mfg_brand_mapping';
        const renderCustomTag = ({ label, value, closable, onClose }: any) => {
          const currentValues = currentProposalAttr?.values?.map((v: any) => v.value_id) || [];
          const index = currentValues.indexOf(value);
          const isLast = index === currentValues.length - 1;

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

        if (attribute.attribute_type === 'SYSTEM' && attribute.attribute_id === 'mfg_brand_mapping') {
          const currentValues = proposalAttributes[proposalKey]?.values || [];
          const pairs = parsePairValues(currentValues);

          const updateProposalValues = (newValues: ItemAttributeValue[]) => {
            const initialAttr = existingQuoteAttributes?.find(ea => ea.group_id === attribute.group_id && ea.attribute_id === attribute.attribute_id);
            const initValIds = initialAttr?.values?.map(v => v.value_id) || [];
            const newValIds = newValues.map(v => v.value_id);
            const isChangedFromPrev = initValIds.length !== newValIds.length || !initValIds.every(id => newValIds.includes(id));

            setProposalAttributes(prev => {
              const reqValIds = prev[proposalKey]?.req_value?.map((v: any) => v.value_id) || [];
              const sortedReq = [...reqValIds].sort();
              const sortedNew = [...newValIds].sort();
              const is_deviation = sortedReq.length !== sortedNew.length || !sortedReq.every((v, i) => v === sortedNew[i]);

              const next = {
                ...prev,
                [proposalKey]: {
                  ...prev[proposalKey],
                  values: newValues,
                  is_deviation: is_deviation,
                  buyer_accepted: isChangedFromPrev ? false : (initialAttr?.buyer_accepted ?? false)
                }
              };
              recalculateVariants(next);
              return next;
            });
          };

          field = (
            <div className="space-y-2 w-full max-w-lg">
              {pairs.length === 0 ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-600">No manufacturer-brand mapping offered</div>
                    <div className="truncate text-[10px] text-slate-400">All manufacturers and brands accepted</div>
                  </div>
                  {!isViewOnly && (
                    <AntButton
                      size="small"
                      type="dashed"
                      icon={<AntPlusOutlined />}
                      onClick={() => {
                        const newPairs = [...pairs, { id: `bm-${Date.now()}`, manufacturer_id: undefined, brand_id: undefined, description: '' }];
                        const newVals = pairsToAttributeValues(newPairs);
                        updateProposalValues(newVals);
                      }}
                    >
                      Add Pair
                    </AntButton>
                  )}
                </div>
              ) : (
                <div className="space-y-2 w-full max-w-xl">
                  {pairs.map((mapPair, pairIdx) => (
                    <div key={mapPair.id || pairIdx} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-4 min-w-4 items-center justify-center rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-600">
                            #{pairIdx + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">Manufacturer & Brand Pair</span>
                        </div>
                        {!isViewOnly && (
                          <AntButton
                            type="text"
                            danger
                            size="small"
                            className="!h-5 !w-5 !p-0"
                            icon={<Lucide.Trash2 size={12} />}
                            onClick={() => {
                              const newPairs = pairs.filter((_, idx) => idx !== pairIdx);
                              const newVals = pairsToAttributeValues(newPairs);
                              updateProposalValues(newVals);
                            }}
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <AntSelect
                          disabled={isViewOnly}
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select Manufacturer..."
                          value={mapPair.manufacturer_id}
                          onChange={(val: string) => {
                            const newPairs = [...pairs];
                            newPairs[pairIdx].manufacturer_id = val;
                            if (val && newPairs[pairIdx].brand_id && !isMappedPair(val, newPairs[pairIdx].brand_id)) {
                              newPairs[pairIdx].brand_id = undefined;
                            }
                            const newVals = pairsToAttributeValues(newPairs);
                            updateProposalValues(newVals);
                          }}
                          options={getRowMfgOptions(mapPair.brand_id)}
                          className="w-full text-xs"
                          popupMatchSelectWidth={false}
                        />

                        <AntSelect
                          disabled={isViewOnly}
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select Brand..."
                          value={mapPair.brand_id}
                          onChange={(val: string) => {
                            const newPairs = [...pairs];
                            newPairs[pairIdx].brand_id = val;
                            if (val && newPairs[pairIdx].manufacturer_id && !isMappedPair(newPairs[pairIdx].manufacturer_id, val)) {
                              newPairs[pairIdx].manufacturer_id = undefined;
                            }
                            const newVals = pairsToAttributeValues(newPairs);
                            updateProposalValues(newVals);
                          }}
                          options={getRowBrandOptions(mapPair.manufacturer_id)}
                          className="w-full text-xs"
                          popupMatchSelectWidth={false}
                        />
                      </div>
                    </div>
                  ))}

                  {!isViewOnly && (
                    <AntButton
                      type="dashed"
                      size="small"
                      icon={<AntPlusOutlined />}
                      className="!h-8 w-full !text-xs"
                      onClick={() => {
                        const newPairs = [...pairs, { id: `bm-${Date.now()}`, manufacturer_id: undefined, brand_id: undefined, description: '' }];
                        const newVals = pairsToAttributeValues(newPairs);
                        updateProposalValues(newVals);
                      }}
                    >
                      Add Pair
                    </AntButton>
                  )}
                </div>
              )}
            </div>
          );
        } else {
          const values = catalogAttributeValues?.filter((v) => v.attributeId === attribute.attribute_id) || [];
          const options = values.map((v: any) => ({ label: v.value || v.label, value: v.id }));
          const placeholder = `Select ${attribute.attributeName}`;

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
              {
                !forceORDisabled && (
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
                )
              }
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

  let variantSku = '';
  if (item?.variant_id && allSellerProducts) {
    const sp = allSellerProducts.find((p: any) => p.variants?.some((v: any) => v.id === item.variant_id));
    if (sp) {
      const v = sp.variants?.find((v: any) => v.id === item.variant_id);
      variantSku = v?.sku || item.variant_id;
    } else {
      variantSku = item.variant_id;
    }
  }

  return (
    <div className="space-y-6">

      {/* Request & Quote Details */}
      <Descriptions
        title={<span className="text-xs font-bold text-slate-800">Request & Quote Details</span>}
        bordered
        size="small"
        column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}
        labelStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }}
        contentStyle={{ fontSize: '12px', color: '#1e293b' }}
        className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <Descriptions.Item label="RFQ Number" span={3}>
          <span className="font-mono font-bold text-slate-700 text-xs">{rfq.rfq_number}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Quote Reference">
          <AntTag color="purple" className="font-mono font-bold m-0 text-xs">{quoteNumber}</AntTag>
        </Descriptions.Item>
        <Descriptions.Item label="Quote Status">
          <AntTag
            color={!existingQuote ? 'default' : existingQuote.status === 'SUBMITTED' ? 'blue' : existingQuote.status === 'DRAFT' ? 'orange' : existingQuote.status === 'REJECTED' ? 'red' : 'default'}
            className="m-0 text-xs"
          >
            {existingQuote?.status || 'NEW'}
          </AntTag>
        </Descriptions.Item>
        <Descriptions.Item label="Round">
          <div className="flex items-center gap-1.5">
            <ReloadOutlined className="text-blue-500 text-xs" />
            <span className="font-semibold text-slate-800 text-xs">Round {existingQuote?.round ?? 1}</span>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <span className="text-slate-700 text-xs">{categories?.find((c) => c.id === item.category_id)?.name || 'Unknown'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Product / Service">
          <span className="text-slate-900 font-semibold text-xs">{catalogProduct?.name || 'Custom Specifications'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="SKU">
          {item?.variant_id ? (
            <AntTag color="purple" className="font-mono font-semibold m-0 text-xs">{variantSku || item.variant_id}</AntTag>
          ) : (
            <AntTag color="orange" className="font-semibold m-0 text-xs">Custom Product</AntTag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Requested Quantity">
          <AntTag color="blue" className="font-bold m-0 text-xs">{item.req_quantity} {item.req_unit || 'pcs'}</AntTag>
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

      {/* Section 1: Auto-Generated Combinations Pool */}
      <div className="space-y-6 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Auto-Generated Option Combinations Matrix</h3>
            <p className="text-xs text-slate-500">
              System auto-generates option combinations based on configured variant attributes and manufacturer/brand pairs. Choose which options to include in your quote offer.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #6366f1` }}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 bg-indigo-50/40">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-indigo-600">
                M
              </span>
              <h4 className="text-md font-bold text-slate-800">Generated Combinations Matrix</h4>
            </div>
            <div className="inline-flex gap-2">
              {!isViewOnly && (
                <div className="flex gap-2">
                  <AntButton size="small" type="default" onClick={() => {
                    setProposalVariants(prev => prev.map(v => ({ ...v, is_selected: true })));
                    antMessage.success('Included all generated options');
                  }}>
                    Select All Options
                  </AntButton>
                  <AntButton size="small" danger onClick={() => {
                    setProposalVariants(prev => prev.map(v => ({ ...v, is_selected: false })));
                    antMessage.info('Deselected all options');
                  }}>
                    Deselect All
                  </AntButton>
                </div>
              )}
              <AntTag color="indigo" className="font-bold">
                {proposalVariants.length} {proposalVariants.length === 1 ? 'combination' : 'combinations'}
              </AntTag>
            </div>
          </div>
          <div className="p-3">
            <Table
              dataSource={proposalVariants}
              rowKey={(r) => r.signature || r.id}
              pagination={{ pageSize: 5, showSizeChanger: true }}
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
                  title: 'Option Combinations & Specifications',
                  key: 'combinations',
                  className: "align-top",
                  render: (_: string, record: SellerQuoteVariant) => {
                    if (!record.combinations || record.combinations.length === 0) {
                      return <span className="text-slate-500 italic">Default Option</span>;
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {record.combinations.map((c: any, i: number) => {
                          if (c.attribute_id === 'mfg_brand_mapping') {
                            const parts = (c.value_id || '').split(':');
                            const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                            const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                            const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                            const brand = (allBrands || []).find((b: any) => b.id === brandId);
                            const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Mfg');
                            const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                            return (
                              <AntTag key={i} color="purple">
                                Mfg: {mfgName} × Brand: {brandName}
                              </AntTag>
                            );
                          }
                          return (
                            <AntTag key={i} color="blue">
                              {c.value_label}
                            </AntTag>
                          );
                        })}
                      </div>
                    );
                  }
                },
                {
                  title: 'Status',
                  key: 'status',
                  className: "w-[150px] max-w-[150px] align-top",
                  render: (_: string, record: SellerQuoteVariant) => {
                    return record.is_selected ? (
                      <AntTag color="emerald" className="font-semibold">Included in Quote</AntTag>
                    ) : (
                      <AntTag color="default" className="font-normal">Not Included</AntTag>
                    );
                  }
                },
                {
                  title: 'Action',
                  key: 'action',
                  className: "w-[140px] max-w-[140px] align-top text-center",
                  render: (_: string, record: SellerQuoteVariant) => {
                    if (isViewOnly) return null;
                    return (
                      <AntButton
                        size="small"
                        type={record.is_selected ? "default" : "primary"}
                        danger={record.is_selected}
                        onClick={() => {
                          setProposalVariants(prev => prev.map(v => v.id === record.id ? { ...v, is_selected: !record.is_selected } : v));
                        }}
                      >
                        {record.is_selected ? "Remove Option" : "Include in Quote"}
                      </AntButton>
                    );
                  }
                }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Selected Offered Options & Pricing Matrix */}
      <div className="space-y-6 mt-8">
        <div>
          <h3 className="text-base font-bold text-slate-900">2. Selected Offered Proposal Options & Prices</h3>
          <p className="text-xs text-slate-500">
            Only these selected proposal options will be submitted to the buyer. Enter your offer price ($) for each option.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #527EA3` }}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#527EA314` }}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#527EA3' }}>
                $
              </span>
              <h4 className="text-md font-bold text-slate-800">Offered Options & Unit Offer Prices</h4>
            </div>
            <div className="flex items-center gap-3">
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
                        setProposalVariants(prev => prev.map(v => v.is_selected ? { ...v, offer_price: bulkPrice } : v));
                        antMessage.success(`Bulk price applied to all selected options`);
                      } else {
                        antMessage.error(`Please enter a valid price to apply`);
                      }
                    }}
                  >
                    Apply to All
                  </AntButton>
                </div>
              )}
              <AntTag color="default" style={{ borderColor: '#527EA3', color: '#527EA3', fontWeight: 700 }}>
                {proposalVariants.filter(v => v.is_selected).length} {proposalVariants.filter(v => v.is_selected).length === 1 ? 'selected option' : 'selected options'}
              </AntTag>
            </div>
          </div>
          <div className="p-3">
            {proposalVariants.filter(v => v.is_selected).length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">
                No proposal options selected. Please include options from the matrix above to submit your offer to the buyer.
              </div>
            ) : (
              <Table
                dataSource={proposalVariants.filter(v => v.is_selected)}
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
                    title: 'Offered Option Combinations & Specifications',
                    key: 'combinations',
                    className: "align-top",
                    render: (_: string, record: SellerQuoteVariant) => {
                      const showStatus = existingQuote && ['REVISION_REQUIRED', 'SUBMITTED', 'DRAFT'].includes(existingQuote.status);

                      if (!record.combinations || record.combinations.length === 0) {
                        return (
                          <div className="flex items-center">
                            <span className="text-slate-500 italic">Default Option</span>
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
                              if (c.attribute_id === 'mfg_brand_mapping') {
                                const parts = (c.value_id || '').split(':');
                                const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                                const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                                const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                                const brand = (allBrands || []).find((b: any) => b.id === brandId);
                                const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Mfg');
                                const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                                return (
                                  <AntTag key={i} color="purple">
                                    Mfg: {mfgName} × Brand: {brandName}
                                  </AntTag>
                                );
                              }
                              return (
                                <AntTag key={i} color="blue">
                                  {c.value_label}
                                </AntTag>
                              );
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
                    title: 'Unit Offer Price',
                    key: 'offer_price',
                    className: "w-[180px] max-w-[180px] align-top",
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
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    className: "w-[70px] max-w-[70px] align-top text-center",
                    render: (_: string, record: SellerQuoteVariant) => {
                      if (isViewOnly) return null;
                      return (
                        <AntButton
                          type="text"
                          danger
                          size="small"
                          icon={<Lucide.Trash2 size={14} />}
                          onClick={() => {
                            setProposalVariants(prev => prev.map(v => v.id === record.id ? { ...v, is_selected: false } : v));
                          }}
                        />
                      );
                    }
                  }
                ]}
              />
            )}
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
  const { message: antMessage } = AntApp.useApp();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  const [submitting, setSubmitting] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const data = useLiveQuery(async () => {
    if (!itemId || !activePartyId || !rfqId) return undefined;

    const [
      existingQuote,
      item,
      rfq,
      allBrands,
      allManufacturers,
      categories,
      catalogAttributes,
      catalogAttributeValues
    ] = await Promise.all([
      rfqDb.seller_quotes.where({ rfq_item_id: itemId, seller_party_id: activePartyId }).first(),
      rfqDb.rfq_items.get(itemId),
      rfqDb.rfqs.get(rfqId),
      businessDb.brands.toArray(),
      businessDb.manufacturers.toArray(),
      catalogDb.categories.toArray(),
      catalogDb.attributes.toArray(),
      catalogDb.attributeValues.toArray()
    ]);

    let existingQuoteAttributes: SellerQuoteAttribute[] = [];
    let existingQuoteVariants: SellerQuoteVariant[] = [];
    if (existingQuote?.id) {
      [existingQuoteAttributes, existingQuoteVariants] = await Promise.all([
        rfqDb.seller_quote_attributes.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_variants.where('seller_quote_id').equals(existingQuote.id).toArray()
      ]);
    }

    let sellerProducts: any[] = [];
    let allVariants: any[] = [];
    if (item?.catalog_product_id) {
      sellerProducts = await catalogDb.sellerProducts.where('catalog_product_id').equals(item.catalog_product_id).toArray();
      allVariants = sellerProducts.flatMap((sp) => sp.variants || []) || [];
    }

    let catalogProduct = null;
    if (item?.catalog_product_id) {
      catalogProduct = await catalogDb.products.get(item.catalog_product_id);
    }

    return {
      existingQuote: existingQuote || null,
      existingQuoteAttributes,
      existingQuoteVariants,
      item: item || null,
      rfq: rfq || null,
      allBrands,
      allManufacturers,
      categories,
      catalogAttributes,
      catalogAttributeValues,
      sellerProducts,
      allVariants,
      catalogProduct: catalogProduct || null
    };
  }, [itemId, activePartyId, rfqId]);

  const {
    existingQuote,
    existingQuoteAttributes,
    existingQuoteVariants,
    allVariants,
    catalogProduct
  } = data || {};

  const checkVariantSatisfaction = (catalogVariant: any) => {
    if (!catalogVariant || !existingQuoteAttributes) return { isSatisfied: false, matchCount: 0, totalCount: 0 };
    const comboValues = catalogVariant.combination_values || catalogVariant.specifications || [];
    let matchCount = 0;
    let totalCount = 0;

    existingQuoteAttributes.forEach((attr) => {
      if (attr.attribute_type !== 'SYSTEM' && attr.values && attr.values.length > 0) {
        totalCount++;
        const reqValIds = new Set(attr.values.map(v => v.value_id));
        const matchedInVariant = comboValues.some((cv: any) => cv.attribute_id === attr.attribute_id && reqValIds.has(cv.value_id));
        if (matchedInVariant) matchCount++;
      }
    });

    const isSatisfied = totalCount === 0 || matchCount >= totalCount;
    return { isSatisfied, matchCount, totalCount };
  };

  const handleSaveProductMapping = async () => {
    if (!selectedVariantId) {
      antMessage.error('Please select a catalog SKU to map.');
      return;
    }

    setSubmitting(true);
    try {
      if (existingQuote) {
        await rfqDb.seller_quotes.update(existingQuote.id, {
          status: 'PRODUCT_SUBMIT_REVISION',
          updated_at: new Date().toISOString()
        });
      }

      antMessage.success('Catalog Product SKU mapped successfully!');
      navigate(basePath);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to submit product mapping.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 font-sans animate-pulse">Loading Product Mapping Workspace...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Accepted Specs Overview */}
      <Card title={<span className="font-bold text-slate-800 text-base">Negotiated Quote & Accepted Specifications</span>} className="shadow-sm border-slate-200">
        <Descriptions bordered size="small" column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Target Catalog Product" span={3}>
            <strong className="text-slate-800 text-base">{catalogProduct?.name || 'Custom Product'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Quote Reference">
            <AntTag color="purple" className="font-mono font-bold m-0">{existingQuote?.seller_quote_number || 'N/A'}</AntTag>
          </Descriptions.Item>
          <Descriptions.Item label="Quote Status">
            <AntTag color="emerald" className="font-bold m-0">{existingQuote?.status || 'DEVIATION_ACCEPTED'}</AntTag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Catalog SKU Selection & Spec Inspector Workspace */}
      <Card title={<span className="font-bold text-slate-800 text-base">Select Existing Catalog Product SKU</span>} className="shadow-sm border-slate-200">
        <p className="text-xs text-slate-500 mb-4">
          Select an existing catalog SKU to fulfill the negotiated RFQ item. SKUs are validated against accepted quote specifications in real time.
        </p>

        {(allVariants || []).length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic">
            No existing catalog product variants found for this category/product.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(allVariants || []).map((cv: any) => {
              const satisfaction = checkVariantSatisfaction(cv);
              const isSelected = selectedVariantId === cv.id;

              return (
                <div
                  key={cv.id}
                  onClick={() => setSelectedVariantId(cv.id)}
                  className={`p-4 border rounded-xl bg-white shadow-sm cursor-pointer transition-all ${isSelected ? 'border-2 border-indigo-600 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="catalog_sku_selection"
                        checked={isSelected}
                        onChange={() => setSelectedVariantId(cv.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-800 text-sm font-mono">{cv.sku || cv.id}</span>
                    </div>
                    {satisfaction.isSatisfied ? (
                      <AntTag color="emerald" className="m-0 font-medium">Satisfies Specs (100% Match)</AntTag>
                    ) : (
                      <AntTag color="amber" className="m-0 font-medium">Partial Match ({satisfaction.matchCount}/{satisfaction.totalCount})</AntTag>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(cv.combination_values || cv.specifications || []).map((v: any, idx: number) => (
                      <AntTag key={idx} color="blue" className="text-[11px] m-0">{v.value_label || v.value_id}</AntTag>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600">List Price: ${cv.price || 0}</span>
                    {isSelected && <span className="font-bold text-indigo-600">Selected for Mapping</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="pt-4 flex justify-end gap-3">
        <AntButton onClick={() => navigate(basePath)}>Cancel</AntButton>
        <AntButton
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSaveProductMapping}
          loading={submitting}
          disabled={!selectedVariantId}
          className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
        >
          Submit Product Mapping
        </AntButton>
      </div>
    </div>
  );
};






const StepFinalAcknowledgement: React.FC<{ rfqId: string; itemId: string; activePartyId: string }> = ({ rfqId, itemId, activePartyId }) => {
  return (
    <div className="p-4">

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
