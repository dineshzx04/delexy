import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input as AntInput, Button as AntButton, Select as AntSelect, Tag as AntTag, Table, Descriptions, App as AntApp, Switch, Steps, Result, Checkbox as AntCheckbox, Modal as AntModal, Grid } from 'antd';
import { SendOutlined, ReloadOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined, PlusOutlined as AntPlusOutlined } from '@ant-design/icons';
import { rfqDb, type AttributeType, type ItemAttributeValue, type SellerQuote, type SellerQuoteAttribute, type SellerQuoteVariant, type SellerQuoteSuggestedVariant, type SellerQuoteAttributeComment, type SellerQuoteVariantComment, type SellerQuoteComment } from '../../data/rfq';
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
  if (['FINAL_ACKNOWLEDGE'].includes(status)) {
    currentStep = 1;
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
              { title: 'Proposal & Product Mapping' },
              { title: 'Final Approval' },
            ]}
          />
          <div className="py-2.5 border-b border-slate-100 text-center">
            {viewStep === 0 && (
              <p className="text-xs text-slate-500 m-0">Submit or revise your offer specifications, custom options, catalog product mapping, and pricing.</p>
            )}
            {viewStep === 1 && (
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
              disabled={viewStep === 1}
              onClick={() => setViewStep(v => v + 1)}
            >
              Next Step <ArrowRightOutlined />
            </AntButton>
          </div>
        </div>


        {viewStep === 0 && <StepQuoteProposal rfqId={rfqId!} itemId={itemId!} activePartyId={activePartyId} />}
        {viewStep === 1 && <StepFinalAcknowledgement rfqId={rfqId!} itemId={itemId!} activePartyId={activePartyId} />}
      </Card>
    </div>
  );
};











/* ============================================================================
 * SUBCOMPONENT 1: Section1AttributeConfig
 * 1. Attribute Configuration & Specifications
 * ============================================================================ */
interface Section1Props {
  rfqId: string;
  itemId: string;
  activePartyId: string;
  isViewOnly: boolean;
  proposalAttributes: Record<string, ProposalAttribute>;
  setProposalAttributes: React.Dispatch<React.SetStateAction<Record<string, ProposalAttribute>>>;
  recalculateVariants: (currentAttributes: Record<string, ProposalAttribute>) => void;
  attributeComments: SellerQuoteAttributeComment[];
  newAttributeComments: Record<string, string>;
  setNewAttributeComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  existingQuote: SellerQuote | null;
  existingQuoteAttributes: SellerQuoteAttribute[];
}

const Section1AttributeConfig: React.FC<Section1Props> = ({
  itemId,
  isViewOnly,
  proposalAttributes,
  setProposalAttributes,
  recalculateVariants,
  attributeComments,
  newAttributeComments,
  setNewAttributeComments,
  existingQuote,
  existingQuoteAttributes
}) => {
  const data = useLiveQuery(async () => {
    if (!itemId) return undefined;
    const [
      itemAttributes,
      allBrands,
      allBrandParties,
      allManufacturers,
      allSellerProducts,
      catalogAttributes,
      catalogAttributeValues,
      attributeGroups
    ] = await Promise.all([
      rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
      businessDb.brands.toArray(),
      businessDb.brandParties.toArray(),
      businessDb.manufacturers.toArray(),
      catalogDb.sellerProducts.toArray(),
      catalogDb.attributes.toArray(),
      catalogDb.attributeValues.toArray(),
      catalogDb.attributeGroups.toArray()
    ]);

    return {
      itemAttributes,
      allBrands,
      allBrandParties,
      allManufacturers,
      allSellerProducts,
      catalogAttributes,
      catalogAttributeValues,
      attributeGroups
    };
  }, [itemId]);

  const {
    itemAttributes,
    allBrands,
    allBrandParties,
    allManufacturers,
    allSellerProducts,
    catalogAttributes,
    catalogAttributeValues,
    attributeGroups
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

  const attributeGroupsMap = React.useMemo(() => {
    if (!itemAttributes?.length) return [];

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

    itemAttributes.forEach((ia: any) => {
      if (ia.attribute_type === 'SYSTEM' && ia.attribute_id !== 'mfg_brand_mapping') return;

      const groupId = ia.group_id;
      const values = getValues(ia);
      const proposalKey = `${groupId}_${ia.attribute_id}`;
      const attributeName = names[ia.attribute_id] || attrs.get(ia.attribute_id) || "";

      if (!map.has(groupId)) {
        map.set(groupId, {
          name: groupId === "system" ? "System Specifications" : groups.get(groupId) || "",
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

      map.get(groupId).attributes.push({
        key: proposalKey,
        attribute_type: ia.attribute_type,
        group_id: groupId,
        attribute_id: ia.attribute_id,
        is_variant: proposalAttributes[proposalKey]?.is_variant || false,
        attributeName: attributeName,
        description: ia.description,
        connector: proposalAttributes[proposalKey]?.connector || ia.connector || 'OR',
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

    return [...map.entries()].sort(([aId], [bId]) => {
      if (aId === 'system') return -1;
      if (bId === 'system') return 1;
      return 0;
    });
  }, [itemAttributes, attributeGroups, catalogAttributes, catalogAttributeValues, proposalAttributes]);

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
      title: 'Proposal Value & Remarks',
      dataIndex: 'proposalValue',
      key: 'proposalValue',
      className: "w-90 max-w-90 align-top",
      render: (_: string, attribute: any) => {
        const proposalKey = `${attribute.group_id}_${attribute.attribute_id}`;
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

        const existingAttrComms = attributeComments.filter(c => c.attribute_id === attribute.attribute_id && c.group_id === attribute.group_id);

        return (
          <div className="flex gap-2 flex-col">
            <div className="w-full">
              {!forceORDisabled && (
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

            {/* Inline Attribute Comments Thread */}
            <div className="mt-1 space-y-1 text-left w-full max-w-md">
              {existingAttrComms
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((c) => {
                  const isBuyer = c.actor_type === 'BUYER';
                  const name = isBuyer ? 'Requester' : 'You';
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

              {!isViewOnly && (
                <AntInput.TextArea
                  size="small"
                  className="w-full text-xs mt-1"
                  placeholder="Add attribute remark..."
                  rows={1}
                  value={newAttributeComments[proposalKey] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewAttributeComments(prev => ({ ...prev, [proposalKey]: val }));
                  }}
                />
              )}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-slate-900 pt-3">1. Attribute configuration & Specifications</h3>
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
  );
};


/* ============================================================================
 * SUBCOMPONENT 2: Section2CombinationsMatrix
 * 2. Auto-Generated Option Combinations Matrix
 * ============================================================================ */
interface Section2Props {
  isViewOnly: boolean;
  proposalVariants: SellerQuoteVariant[];
  setProposalVariants: React.Dispatch<React.SetStateAction<SellerQuoteVariant[]>>;
}

const Section2CombinationsMatrix: React.FC<Section2Props> = ({
  isViewOnly,
  proposalVariants,
  setProposalVariants
}) => {
  const { message: antMessage } = AntApp.useApp();

  const data = useLiveQuery(async () => {
    const [allBrands, allManufacturers] = await Promise.all([
      businessDb.brands.toArray(),
      businessDb.manufacturers.toArray()
    ]);
    return { allBrands, allManufacturers };
  }, []);

  const { allBrands, allManufacturers } = data || {};

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">2. Auto-Generated Option Combinations Matrix</h3>
          <p className="text-xs text-slate-500">
            System auto-generates option combinations based on configured variant attributes and manufacturer/brand pairs. Choose which options to include in your offer.
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
                            {c.value_label || c.label || c.value_id}
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
  );
};


/* ============================================================================
 * SUBCOMPONENT 3: Section3SuggestedCatalog
 * 3. Suggested Existing Catalog Products
 * ============================================================================ */
interface Section3Props {
  itemId: string;
  activePartyId: string;
  isViewOnly: boolean;
  proposalSuggestedVariants: SellerQuoteSuggestedVariant[];
  setProposalSuggestedVariants: React.Dispatch<React.SetStateAction<SellerQuoteSuggestedVariant[]>>;
}

const Section3SuggestedCatalog: React.FC<Section3Props> = ({
  itemId,
  activePartyId,
  isViewOnly,
  proposalSuggestedVariants,
  setProposalSuggestedVariants
}) => {
  const { message: antMessage } = AntApp.useApp();

  const data = useLiveQuery(async () => {
    if (!itemId || !activePartyId) return undefined;

    const [item, allSellerProducts, allBrands, allManufacturers] = await Promise.all([
      rfqDb.rfq_items.get(itemId),
      catalogDb.sellerProducts.where('party_id').equals(activePartyId).toArray(),
      businessDb.brands.toArray(),
      businessDb.manufacturers.toArray()
    ]);

    return { item, allSellerProducts, allBrands, allManufacturers };
  }, [itemId, activePartyId]);

  const { allBrands, allManufacturers } = data || {};

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h3 className="text-base font-bold text-slate-900">3. Suggested Existing Catalog Products</h3>
        <p className="text-xs text-slate-500">
          Select suggested catalog SKUs from your existing catalog products matching product attributes to include in this proposal.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #4f46e5` }}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 bg-indigo-50/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-indigo-600">
              S
            </span>
            <h4 className="text-md font-bold text-slate-800">Available Catalog Product SKUs</h4>
          </div>
          <div className="inline-flex gap-2">
            {!isViewOnly && (
              <div className="flex gap-2">
                <AntButton size="small" type="default" onClick={() => {
                  setProposalSuggestedVariants(prev => prev.map(sv => ({ ...sv, is_selected: true })));
                  antMessage.success('Included all catalog SKUs');
                }}>
                  Select All Catalog SKUs
                </AntButton>
                <AntButton size="small" danger onClick={() => {
                  setProposalSuggestedVariants(prev => prev.map(sv => ({ ...sv, is_selected: false })));
                  antMessage.info('Deselected all catalog SKUs');
                }}>
                  Deselect All
                </AntButton>
              </div>
            )}
            <AntTag color="indigo" className="font-bold">
              {proposalSuggestedVariants.length} {proposalSuggestedVariants.length === 1 ? 'catalog SKU' : 'catalog SKUs'}
            </AntTag>
          </div>
        </div>
        <div className="p-3">
          {proposalSuggestedVariants.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">
              No matching catalog SKUs found in your catalog.
            </div>
          ) : (
            <Table
              dataSource={proposalSuggestedVariants}
              rowKey="variant_id"
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
                  title: 'SKU & Specifications',
                  key: 'details',
                  className: "align-top",
                  render: (_: string, record: SellerQuoteSuggestedVariant) => (
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-xs text-slate-800 mb-1">SKU: {record.sku}</div>
                      <div className="flex flex-wrap gap-1">
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
                              {c.value_label || c.label || c.value_id}
                            </AntTag>
                          );
                        })}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'List Price',
                  key: 'list_price',
                  className: "w-[110px] max-w-[110px] align-top text-right",
                  render: (_: string, record: SellerQuoteSuggestedVariant) => (
                    <div className="font-semibold text-slate-700 text-xs pr-1">${record.list_price}</div>
                  )
                },
                {
                  title: 'Status',
                  key: 'status',
                  className: "w-[150px] max-w-[150px] align-top",
                  render: (_: string, record: SellerQuoteSuggestedVariant) => (
                    record.is_selected ? (
                      <AntTag color="indigo" className="font-semibold">Included in Quote</AntTag>
                    ) : (
                      <AntTag color="default" className="font-normal">Not Included</AntTag>
                    )
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  className: "w-[140px] max-w-[140px] align-top text-center",
                  render: (_: string, record: SellerQuoteSuggestedVariant) => {
                    if (isViewOnly) return null;
                    return (
                      <AntButton
                        size="small"
                        type={record.is_selected ? "default" : "primary"}
                        danger={record.is_selected}
                        onClick={() => {
                          setProposalSuggestedVariants(prev => prev.map(sv => sv.variant_id === record.variant_id ? { ...sv, is_selected: !record.is_selected } : sv));
                        }}
                      >
                        {record.is_selected ? "Remove Option" : "Include in Quote"}
                      </AntButton>
                    );
                  }
                }
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};


/* ============================================================================
 * SUBCOMPONENT 4: Section4OfferedPricing
 * 4. Selected Offered Proposal Options & Pricing Matrix
 * ============================================================================ */
interface Section4Props {
  isViewOnly: boolean;
  selectedOfferedItems: any[];
  proposalVariants: SellerQuoteVariant[];
  setProposalVariants: React.Dispatch<React.SetStateAction<SellerQuoteVariant[]>>;
  proposalSuggestedVariants: SellerQuoteSuggestedVariant[];
  setProposalSuggestedVariants: React.Dispatch<React.SetStateAction<SellerQuoteSuggestedVariant[]>>;
  variantComments: SellerQuoteVariantComment[];
  newVariantComments: Record<string, string>;
  setNewVariantComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  bulkPrice: number | undefined;
  setBulkPrice: React.Dispatch<React.SetStateAction<number | undefined>>;
  existingQuote: SellerQuote | null;
}

const Section4OfferedPricing: React.FC<Section4Props> = ({
  isViewOnly,
  selectedOfferedItems,
  proposalVariants,
  setProposalVariants,
  proposalSuggestedVariants,
  setProposalSuggestedVariants,
  variantComments,
  newVariantComments,
  setNewVariantComments,
  bulkPrice,
  setBulkPrice,
  existingQuote
}) => {
  const { message: antMessage } = AntApp.useApp();

  const data = useLiveQuery(async () => {
    const [allBrands, allManufacturers] = await Promise.all([
      businessDb.brands.toArray(),
      businessDb.manufacturers.toArray()
    ]);
    return { allBrands, allManufacturers };
  }, []);

  const { allBrands, allManufacturers } = data || {};

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h3 className="text-base font-bold text-slate-900">4. Selected Offered Proposal Options & Pricing Matrix</h3>
        <p className="text-xs text-slate-500">
          Only these selected proposal options (custom combinations & catalog SKUs) will be submitted to the buyer. Enter your unit offer price ($) for each option.
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
                      setProposalSuggestedVariants(prev => prev.map(sv => sv.is_selected ? { ...sv, offer_price: bulkPrice } : sv));
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
              {selectedOfferedItems.length} {selectedOfferedItems.length === 1 ? 'selected option' : 'selected options'}
            </AntTag>
          </div>
        </div>
        <div className="p-3">
          {selectedOfferedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">
              No proposal options selected. Please include options from the matrix tables above to submit your offer.
            </div>
          ) : (
            <Table
              dataSource={selectedOfferedItems}
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
                  title: 'Offered Option & Specifications',
                  key: 'combinations',
                  className: "align-top",
                  render: (_: string, record: any) => {
                    const showStatus = existingQuote && ['REVISION_REQUIRED', 'SUBMITTED', 'DRAFT'].includes(existingQuote.status);

                    return (
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {record.type === 'SUGGESTED' ? (
                              <AntTag color="blue-inverse" className="font-mono font-bold text-xs m-0">SKU: {record.title}</AntTag>
                            ) : (
                              <AntTag color="blue" className="font-semibold text-xs m-0">Custom Combination</AntTag>
                            )}
                            {record.type === 'SUGGESTED' && record.list_price !== undefined && (
                              <span className="text-xs text-slate-500">List: ${record.list_price}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(!record.combinations || record.combinations.length === 0) ? (
                              <span className="text-slate-500 italic text-xs">Default Specifications</span>
                            ) : (
                              record.combinations.map((c: any, i: number) => {
                                if (c.attribute_id === 'mfg_brand_mapping') {
                                  const parts = (c.value_id || '').split(':');
                                  const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                                  const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                                  const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                                  const brand = (allBrands || []).find((b: any) => b.id === brandId);
                                  const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Mfg');
                                  const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                                  return (
                                    <AntTag key={i} color="purple" className="text-[11px] m-0">
                                      Mfg: {mfgName} × Brand: {brandName}
                                    </AntTag>
                                  );
                                }
                                return (
                                  <AntTag key={i} color="blue" className="text-[11px] m-0">
                                    {c.value_label || c.label || c.value_id}
                                  </AntTag>
                                );
                              })
                            )}
                          </div>
                        </div>
                        <div>
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
                  className: "w-[160px] max-w-[160px] align-top",
                  render: (_: string, record: any) => (
                    <AntInput
                      type="number"
                      disabled={isViewOnly}
                      value={record.offer_price || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (record.type === 'CUSTOM') {
                          setProposalVariants(prev => prev.map(v => v.id === record.id ? { ...v, offer_price: val } : v));
                        } else {
                          setProposalSuggestedVariants(prev => prev.map(sv => sv.id === record.id ? { ...sv, offer_price: val } : sv));
                        }
                      }}
                      prefix="$"
                      placeholder="Enter price"
                    />
                  )
                },
                {
                  title: 'Remarks & Variant Comments',
                  key: 'remarks',
                  className: "w-[240px] max-w-[240px] align-top",
                  render: (_: string, record: any) => {
                    const existingComms = variantComments.filter(c => c.variant_id === record.id);
                    return (
                      <div className="space-y-1">
                        {existingComms.map((c) => {
                          const isBuyer = c.actor_type === 'BUYER';
                          const name = isBuyer ? 'Requester' : 'You';
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

                        {!isViewOnly && (
                          <AntInput.TextArea
                            placeholder="Add option remark..."
                            size="small"
                            className="text-xs mt-1"
                            rows={1}
                            value={newVariantComments[record.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewVariantComments(prev => ({ ...prev, [record.id]: val }));
                            }}
                          />
                        )}
                      </div>
                    );
                  }
                },
                {
                  title: 'Action',
                  key: 'action',
                  className: "w-[70px] max-w-[70px] align-top text-center",
                  render: (_: string, record: any) => {
                    if (isViewOnly) return null;
                    return (
                      <AntButton
                        type="text"
                        danger
                        size="small"
                        icon={<Lucide.Trash2 size={14} />}
                        onClick={() => {
                          if (record.type === 'CUSTOM') {
                            setProposalVariants(prev => prev.map(v => v.id === record.id ? { ...v, is_selected: false } : v));
                          } else {
                            setProposalSuggestedVariants(prev => prev.map(sv => sv.id === record.id ? { ...sv, is_selected: false } : sv));
                          }
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
  );
};


/* ============================================================================
 * SUBCOMPONENT 5: ComparisonMatrixModal
 * Group-wise Attribute & Variant Comparison Modal
 * ============================================================================ */
interface ComparisonModalProps {
  visible: boolean;
  onCancel: () => void;
  itemId: string;
  selectedOfferedItems: any[];
  proposalAttributes: Record<string, ProposalAttribute>;
}

const ComparisonMatrixModal: React.FC<ComparisonModalProps> = ({ visible, onCancel, itemId, selectedOfferedItems, proposalAttributes }) => {
  const screens = Grid.useBreakpoint();

  const data = useLiveQuery(async () => {
    if (!itemId) return undefined;
    const [
      itemAttributes, attributeGroups, catalogAttributes, catalogAttributeValues, allManufacturers, allBrands
    ] = await Promise.all([
      rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
      catalogDb.attributeGroups.toArray(),
      catalogDb.attributes.toArray(),
      catalogDb.attributeValues.toArray(),
      businessDb.manufacturers.toArray(),
      businessDb.brands.toArray()
    ]);
    return {
      itemAttributes,
      attributeGroups,
      catalogAttributes,
      catalogAttributeValues,
      allManufacturers,
      allBrands
    };
  }, [itemId]);

  const { itemAttributes, attributeGroups, catalogAttributes, catalogAttributeValues, allManufacturers, allBrands } = data || {};

  const selectedComparisonItems = selectedOfferedItems.map(item => {


    return {
      id: item.id,
      title: item.type === 'SUGGESTED' ? (item.sku || item.id) : 'Custom Option',
      typeBadge: item.type === 'SUGGESTED'
        ? <AntTag color="indigo" className="font-semibold text-xs m-0">Suggested Catalog SKU</AntTag>
        : <AntTag color="purple" className="font-semibold text-xs m-0">Custom Option</AntTag>,
      price: item.offer_price || 0,
      product_attributes: item.product_attributes || []
    }
  });

  const comparisonGroups = React.useMemo(() => {
    if (!itemAttributes || !itemAttributes.length) return [];
    const groups = new Map((attributeGroups || []).map(g => [g.id, g.name]));
    const attrs = new Map((catalogAttributes || []).map(a => [a.id, a.name]));

    const groupMap = new Map<string, { id: string; name: string; attributes: { id: string; name: string }[] }>();

    itemAttributes.forEach((ia: any) => {
      if (ia.attribute_type === 'SYSTEM' && ia.attribute_id !== 'mfg_brand_mapping') return;
      const groupId = ia.group_id;
      const groupName = groupId === 'system' ? 'System Specifications' : (groups.get(groupId) || groupId);
      const attrName = ia.attribute_id === 'mfg_brand_mapping' ? 'Manufacturer & Brand' : (attrs.get(ia.attribute_id) || ia.attribute_id);

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, { id: groupId, name: groupName, attributes: [] });
      }
      groupMap.get(groupId)!.attributes.push({ id: ia.attribute_id, name: attrName });
    });

    const groupList = Array.from(groupMap.values());
    groupList.sort((a, b) => {
      if (a.id === 'system' || a.attributes.some(at => at.id === 'mfg_brand_mapping')) return -1;
      if (b.id === 'system' || b.attributes.some(at => at.id === 'mfg_brand_mapping')) return 1;
      return 0;
    });

    return groupList;
  }, [itemAttributes, attributeGroups, catalogAttributes]);

  const matrixRows = React.useMemo(() => {
    const rows: {
      key: string;
      groupId: string;
      groupName: string;
      groupRowSpan: number;
      attrId: string;
      attrName: string;
    }[] = [];

    comparisonGroups.forEach((group) => {
      group.attributes.forEach((attr, idx) => {
        rows.push({
          key: `${group.id}_${attr.id}`,
          groupId: group.id,
          groupName: group.name,
          groupRowSpan: idx === 0 ? group.attributes.length : 0,
          attrId: attr.id,
          attrName: attr.name
        });
      });
    });

    return rows;
  }, [comparisonGroups]);

  const isMobile = !screens.md;

  return (
    <AntModal
      title={
        <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base m-0">Group-wise Attribute Comparison Matrix</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 m-0">Side-by-side comparison of selected custom proposal options and suggested catalog SKUs</p>
          </div>
          <AntTag color="blue" className="font-bold text-xs">{selectedComparisonItems.length} options selected</AntTag>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={isMobile ? '98%' : '85%'}
      style={{ top: isMobile ? 8 : 20 }}
      destroyOnClose
      styles={{
        body: { height: isMobile ? 'calc(100vh - 18vh)' : 'calc(100vh - 140px)', overflow: 'hidden', padding: '4px' }
      }}
      classNames={{ body: "overflow-hidden" }}
    >
      <div className="p-0.5 h-full flex flex-col overflow-hidden">
        <Table
          dataSource={matrixRows}
          rowKey="key"
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 'max-content', y: isMobile ? 'calc(95vh - 110px)' : 'calc(95vh - 130px)' }}
          className="h-full"
          columns={[
            {
              title: 'Attribute Group',
              dataIndex: 'groupName',
              key: 'groupName',
              fixed: isMobile ? undefined : 'left',
              width: isMobile ? 120 : 160,
              className: 'align-top bg-slate-50 font-bold text-slate-700 text-xs',
              onCell: (record: any) => ({
                rowSpan: record.groupRowSpan,
              }),
              render: (text: string) => (
                <span className="font-bold text-slate-800 text-xs">{text}</span>
              )
            },
            {
              title: 'Attribute Name',
              dataIndex: 'attrName',
              key: 'attrName',
              fixed: isMobile ? undefined : 'left',
              width: isMobile ? 140 : 180,
              className: 'align-top font-semibold text-slate-700 text-xs bg-white',
              render: (text: string) => (
                <span className="font-semibold text-slate-700 text-xs">{text}</span>
              )
            },
            ...selectedComparisonItems.map((colItem) => ({
              title: (
                <div className="space-y-1.5 py-1 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono font-bold text-slate-800 text-xs truncate">{colItem.title}</div>
                    <span className="font-bold text-emerald-600 text-xs">${colItem.price}</span>
                  </div>
                  <div>{colItem.typeBadge}</div>
                </div>
              ),
              key: colItem.id,
              width: 220,
              className: 'align-top text-xs min-w-[220px]',
              render: (_: any, record: any) => {
                const prodAttrs = colItem.product_attributes || [];
                const attribute = prodAttrs.find((a: any) => a.attribute_id === record.attrId);
                if (!attribute || !attribute.values || attribute.values.length === 0) {
                  return <span className="text-slate-400 italic">—</span>;
                }

                if (record.attrId === 'mfg_brand_mapping') {
                  const valObj = attribute.values[0];
                  const valId = valObj?.value_id || valObj?.id || '';
                  if (!valId) return <span className="text-slate-400 italic">—</span>;

                  const parts = valId.split(':');
                  const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                  const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                  const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                  const brand = (allBrands || []).find((b: any) => b.id === brandId);
                  const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Mfg');
                  const brandName = brand?.name || (brandId ? brandId : 'Any Brand');

                  return (
                    <AntTag color="purple" className="text-[11px] m-0">
                      Mfg: {mfgName} × Brand: {brandName}
                    </AntTag>
                  );
                }

                const proposalKey = `${record.groupId}_${record.attrId}`;
                const forceORDisabled = record.attrId === 'mfg_brand_mapping';
                const connector = forceORDisabled
                  ? "OR"
                  : (attribute.connector || proposalAttributes?.[proposalKey]?.connector || itemAttributes?.find((ia: any) => ia.group_id === record.groupId && ia.attribute_id === record.attrId)?.connector || 'AND');
                const propJoiner = connector === "OR" ? " | " : " , ";

                return (
                  <div className="flex flex-wrap items-center">
                    {attribute.values.map((v: any, vIdx: number) => {
                      const valId = v.value_id || v.id;
                      const valLabel = catalogAttributeValues?.find((cv: any) => cv.id === valId)?.value
                        || v.value_label
                        || v.label
                        || v.value
                        || valId;
                      const isLast = vIdx === attribute.values.length - 1;

                      return (
                        <span key={vIdx} className="inline-flex items-center my-0.5">
                          <AntTag color="blue" className="text-[11px] m-0">
                            {valLabel}
                          </AntTag>
                          {!isLast && (
                            <span className="mx-0.5 text-emerald-600 font-bold text-[13px] select-none">
                              {propJoiner}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                );
              }
            }))
          ]}
        />
      </div>
    </AntModal>
  );
};


/* ============================================================================
 * PARENT STEP COMPONENT: StepQuoteProposal
 * Orchestrates subcomponents, state initialization & DB mutations
 * ============================================================================ */
const StepQuoteProposal: React.FC<{ rfqId: string; itemId: string; activePartyId: string }> = ({ rfqId, itemId, activePartyId }) => {
  // 1. Context & Routing Navigation
  const { message: antMessage } = AntApp.useApp();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  // 2. Component State Declarations
  const [submitting, setSubmitting] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<number | undefined>();

  const [proposalAttributes, setProposalAttributes] = useState<Record<string, ProposalAttribute>>({});
  const [dbVariants, setDbVariants] = useState<SellerQuoteVariant[]>([]);
  const [proposalVariants, setProposalVariants] = useState<SellerQuoteVariant[]>([]);
  const [proposalSuggestedVariants, setProposalSuggestedVariants] = useState<SellerQuoteSuggestedVariant[]>([]);

  const [attributeComments, setAttributeComments] = useState<SellerQuoteAttributeComment[]>([]);
  const [variantComments, setVariantComments] = useState<SellerQuoteVariantComment[]>([]);
  const [newAttributeComments, setNewAttributeComments] = useState<Record<string, string>>({});
  const [newVariantComments, setNewVariantComments] = useState<Record<string, string>>({});

  // 3. Data Layer: Dexie Live Queries
  const data = useLiveQuery(async () => {
    if (!itemId || !activePartyId || !rfqId) return undefined;

    const [
      existingQuote,
      item,
      rfq,
      itemAttributes,
      allSellerProducts,
      categories,
      catalogAttributes,
      catalogAttributeValues
    ] = await Promise.all([
      rfqDb.seller_quotes.where({ rfq_item_id: itemId, seller_party_id: activePartyId }).first(),
      rfqDb.rfq_items.get(itemId),
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
      catalogDb.sellerProducts.toArray(),
      catalogDb.categories.toArray(),
      catalogDb.attributes.toArray(),
      catalogDb.attributeValues.toArray()
    ]);

    let existingQuoteAttributes: SellerQuoteAttribute[] = [];
    let existingQuoteVariants: SellerQuoteVariant[] = [];
    let existingQuoteSuggestedVariants: SellerQuoteSuggestedVariant[] = [];
    let existingQuoteAttributeComments: SellerQuoteAttributeComment[] = [];
    let existingQuoteVariantComments: SellerQuoteVariantComment[] = [];

    if (existingQuote?.id) {
      const [attrs, vars, sVars, attrComms, varComms, oldComms] = await Promise.all([
        rfqDb.seller_quote_attributes.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_variants.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_suggested_variants.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_attribute_comments.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_variant_comments.where('seller_quote_id').equals(existingQuote.id).toArray(),
        rfqDb.seller_quote_comments.where('seller_quote_id').equals(existingQuote.id).toArray()
      ]);

      existingQuoteAttributes = attrs;
      existingQuoteVariants = vars;
      existingQuoteSuggestedVariants = sVars;
      existingQuoteAttributeComments = attrComms.length > 0 ? attrComms : oldComms;
      existingQuoteVariantComments = varComms;
    }

    let catalogProduct = null;
    if (item?.catalog_product_id) {
      catalogProduct = await catalogDb.products.get(item.catalog_product_id);
    }
    let variantSKU = '';
    if (item?.variant_id && allSellerProducts) {
      const sp = allSellerProducts.find((p: any) => p.variants?.some((v: any) => v.id === item.variant_id));
      if (sp) {
        const v = sp.variants?.find((v: any) => v.id === item.variant_id);
        variantSKU = v?.sku || item.variant_id;
      } else {
        variantSKU = item.variant_id;
      }
    }
    return {
      existingQuote: existingQuote || null,
      existingQuoteAttributes,
      existingQuoteVariants,
      existingQuoteSuggestedVariants,
      existingQuoteAttributeComments,
      existingQuoteVariantComments,
      item: item || null,
      itemAttributes,
      rfq: rfq || null,
      allSellerProducts,
      categories,
      catalogAttributes,
      catalogAttributeValues,
      catalogProduct: catalogProduct || null,
      variantSKU: variantSKU
    };
  }, [itemId, activePartyId, rfqId]);

  const {
    existingQuote,
    existingQuoteAttributes,
    existingQuoteVariants,
    existingQuoteSuggestedVariants,
    existingQuoteAttributeComments,
    existingQuoteVariantComments,
    item,
    itemAttributes,
    rfq,
    allSellerProducts,
    categories,
    catalogAttributes,
    catalogAttributeValues,
    catalogProduct,
    variantSKU
  } = data || {};

  // 4. Render Loading & Auth Guards
  const isLoading = data === undefined;

  // 5. Derived Selectors & Memos

  const isViewOnly = ['SUBMITTED', "DEVIATION_ACCEPTED", "PRODUCT_SUBMIT_REVISION", "FINAL_ACKNOWLEDGE", 'REJECTED'].includes(existingQuote?.status ?? '');

  const totalSelectedCustom = proposalVariants.filter(v => v.is_selected).length;
  const totalSelectedSuggested = proposalSuggestedVariants.filter(sv => sv.is_selected).length;
  const totalSelected = totalSelectedCustom + totalSelectedSuggested;

  const parentSpecs = Object.values(proposalAttributes)
    .filter(attr => !attr.is_variant && attr.attribute_id !== 'mfg_brand_mapping' && attr.values && attr.values.length > 0)
    .map(attr => ({
      group_id: attr.group_id,
      attribute_id: attr.attribute_id,
      attribute_name: attr.attributeName,
      connector: attr.connector,
      value_id: attr.values[0]?.value_id,
      value_label: attr.values[0]?.value_label,
      values: attr.values
    }));

  const selectedOfferedItems = [
    ...proposalVariants.filter(v => v.is_selected).map(v => ({
      id: v.id,
      type: 'CUSTOM' as const,
      title: 'Custom Option Combination',
      sku: undefined,
      list_price: undefined,
      offer_price: v.offer_price,
      combinations: v.combinations,
      product_attributes: [...(v.combinations || []), ...parentSpecs],
      buyer_accepted: v.buyer_accepted
    })),
    ...proposalSuggestedVariants.filter(sv => sv.is_selected).map(sv => ({
      id: sv.id,
      type: 'SUGGESTED' as const,
      title: sv.sku || sv.id,
      sku: sv.sku,
      list_price: sv.list_price,
      offer_price: sv.offer_price,
      combinations: sv.combinations,
      product_attributes: (sv as any).product_attributes || [],
      buyer_accepted: sv.buyer_accepted
    }))
  ];

  // 6. Helper Utility Functions
  const computeSignature = (combinations: any[]): string => {
    if (!combinations || combinations.length === 0) return 'default';
    const sortedCombo = [...combinations].sort((a, b) => (a.attribute_id || '').localeCompare(b.attribute_id || ''));
    return sortedCombo.map(c => `${c.attribute_id}:${c.value_id}`).join('|');
  };

  function cartesian(arrays: any[][]) {
    let result: any[][] = [[]];

    for (let arr of arrays) {
      let temp: any[][] = [];

      for (let x of result) {
        for (let y of arr) {
          temp.push([...x, y]);
        }
      }

      result = temp;
    }

    return result;
  }

  const generateVariantsFromAttributes = (currentAttributes: Record<string, ProposalAttribute>, prevVariants: SellerQuoteVariant[] = []): SellerQuoteVariant[] => {
    const quoteId = existingQuote?.id || '';
    const variantMap = new Map<string, SellerQuoteVariant>();

    const variantAttrs = Object.values(currentAttributes)
      .filter(attr => (attr.is_variant || attr.attribute_id === 'mfg_brand_mapping') && attr.values.length > 0)
      .sort((a, b) => {
        if (a.attribute_id === 'mfg_brand_mapping') return -1;
        if (b.attribute_id === 'mfg_brand_mapping') return 1;
        return 0;
      });

    if (variantAttrs.length === 0) {
      const existingDefault = prevVariants.find(v => v.combinations.length === 0);
      const combination = [{
        id: existingDefault?.id || crypto.randomUUID(),
        seller_quote_id: quoteId,
        is_default: true,
        offer_price: existingDefault?.offer_price || 0,
        combinations: [],
        buyer_accepted: existingDefault?.buyer_accepted || false,
        signature: 'default',
        is_selected: existingDefault?.is_selected !== undefined ? existingDefault.is_selected : false
      }]
      // console.log(combination)
      return combination;
    }

    prevVariants.forEach(v => {
      const sig = v.signature || computeSignature(v.combinations);
      variantMap.set(sig, v);
    });


    const arraysToCombine = variantAttrs.map(attr =>
      attr.values.map(v => ({
        group_id: attr.group_id,
        attribute_id: attr.attribute_id,
        attribute_name: attr.attributeName,
        connector: attr.connector,
        value_id: v.value_id,
        value_label: v.value_label,
        values: [{ value_id: v.value_id, value_label: v.value_label }]
      }))
    );

    const combinations = cartesian(arraysToCombine).map(combo => {
      const sig = computeSignature(combo);
      const existingMatch = variantMap.get(sig);

      if (existingMatch) {
        return {
          ...existingMatch,
          combinations: combo,
          signature: sig,
          is_selected: existingMatch.is_selected !== undefined ? existingMatch.is_selected : false
        };
      }

      return {
        id: crypto.randomUUID(),
        seller_quote_id: quoteId,
        is_default: false,
        offer_price: 0,
        combinations: combo,
        buyer_accepted: false,
        signature: sig,
        is_selected: false
      };
    });
    // console.log(combinations)
    return combinations;
  };

  // 7. Action Handlers
  const recalculateVariants = (currentAttributes: Record<string, ProposalAttribute>) => {
    setBulkPrice(undefined);
    setProposalVariants(prev => generateVariantsFromAttributes(currentAttributes, prev));
  };

  const handleSave = async (submitMode: 'DRAFT' | 'SUBMITTED') => {
    if (!item || !rfq || !activePartyId) return;

    setSubmitting(true);
    try {
      const quoteId = existingQuote?.id || crypto.randomUUID();
      const offerQty = item.req_quantity || 0;
      const qtyUnit = item.req_unit || 'pcs';

      const selectedCustomVariants = proposalVariants.filter(v => v.is_selected);
      const selectedSuggestedVariants = proposalSuggestedVariants.filter(sv => sv.is_selected);

      if (totalSelected === 0) {
        antMessage.error('Please select at least one proposal option or catalog SKU to include in your offer.');
        setSubmitting(false);
        return;
      }

      const invalidCustom = selectedCustomVariants.filter(v => typeof v.offer_price !== 'number' || isNaN(v.offer_price) || v.offer_price <= 0);
      const invalidSuggested = selectedSuggestedVariants.filter(sv => typeof sv.offer_price !== 'number' || isNaN(sv.offer_price) || sv.offer_price <= 0);

      if (invalidCustom.length > 0 || invalidSuggested.length > 0) {
        antMessage.error('Offer price for all selected options must be greater than $0.');
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
        seller_quote_number: existingQuote?.seller_quote_number || 'SQ-DRAFT',
        offer_quantity: offerQty || 0,
        offer_unit: qtyUnit,
        status: submitMode,
        created_at: existingQuote?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const attributesToSave: SellerQuoteAttribute[] = [];
      Object.entries(proposalAttributes).forEach(([key, attributeData]) => {
        if (attributeData) {
          attributesToSave.push({
            id: crypto.randomUUID(),
            seller_quote_id: quoteId,
            attribute_type: attributeData.attribute_type,
            group_id: attributeData.group_id,
            attribute_id: attributeData.attribute_id,
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

      const attributeCommentsToSave: SellerQuoteAttributeComment[] = [];
      attributesToSave.forEach((attr) => {
        const key = `${attr.group_id}_${attr.attribute_id}`;
        const newCommText = newAttributeComments[key]?.trim();
        if (newCommText) {
          attributeCommentsToSave.push({
            id: crypto.randomUUID(),
            seller_quote_id: quoteId,
            round: existingQuote?.round || 1,
            attribute_type: attr.attribute_type,
            group_id: attr.group_id,
            attribute_id: attr.attribute_id,
            comment: newCommText,
            actor_type: "SELLER",
            actor_id: activePartyId,
            created_at: new Date().toISOString(),
          });
        }
      });

      const variantsToSave: SellerQuoteVariant[] = selectedCustomVariants.map(v => {
        const sig = v.signature || computeSignature(v.combinations);
        const dbMatch = dbVariants.find(dbV => dbV.id === v.id || (dbV.signature || computeSignature(dbV.combinations)) === sig);
        return {
          ...dbMatch,
          ...v,
          id: dbMatch?.id || v.id,
          seller_quote_id: quoteId,
          offer_price: v.offer_price,
          is_selected: true
        };
      });

      const suggestedVariantsToSave: SellerQuoteSuggestedVariant[] = selectedSuggestedVariants.map(sv => ({
        id: sv.id || crypto.randomUUID(),
        seller_quote_id: quoteId,
        seller_product_id: sv.seller_product_id,
        variant_id: sv.variant_id,
        sku: sv.sku,
        list_price: sv.list_price,
        offer_price: sv.offer_price,
        combinations: sv.combinations,
        specifications: sv.specifications,
        is_selected: true,
        buyer_accepted: sv.buyer_accepted || false
      }));

      const variantCommentsToSave: SellerQuoteVariantComment[] = [];
      selectedOfferedItems.forEach((opt) => {
        const newCommText = newVariantComments[opt.id]?.trim();
        if (newCommText) {
          variantCommentsToSave.push({
            id: crypto.randomUUID(),
            seller_quote_id: quoteId,
            round: existingQuote?.round || 1,
            variant_id: opt.id,
            variant_type: opt.type,
            comment: newCommText,
            actor_type: "SELLER",
            actor_id: activePartyId,
            created_at: new Date().toISOString(),
          });
        }
      });

      await rfqDb.transaction('rw', [
        rfqDb.seller_quotes,
        rfqDb.seller_quote_attributes,
        rfqDb.seller_quote_variants,
        rfqDb.seller_quote_suggested_variants,
        rfqDb.seller_quote_attribute_comments,
        rfqDb.seller_quote_variant_comments,
        rfqDb.seller_quote_comments
      ], async () => {
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

        const oldSuggested = await rfqDb.seller_quote_suggested_variants.where('seller_quote_id').equals(quoteId).toArray();
        await rfqDb.seller_quote_suggested_variants.bulkDelete(oldSuggested.map(sv => sv.id));
        if (suggestedVariantsToSave.length > 0) {
          await rfqDb.seller_quote_suggested_variants.bulkAdd(suggestedVariantsToSave);
        }

        if (attributeCommentsToSave.length > 0) {
          await rfqDb.seller_quote_attribute_comments.bulkAdd(attributeCommentsToSave);
          await rfqDb.seller_quote_comments.bulkAdd(attributeCommentsToSave);
        }

        if (variantCommentsToSave.length > 0) {
          await rfqDb.seller_quote_variant_comments.bulkAdd(variantCommentsToSave);
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

  // 8. State Hydration Effect
  useEffect(() => {
    if (!item || !itemAttributes?.length) return;

    const attrs = new Map((catalogAttributes || []).map(a => [a.id, a.name]));
    const existingQuoteAttrMap = new Map();
    const initialValues: Record<string, ProposalAttribute> = {};
    const names: Record<string, string> = {
      mfg_brand_mapping: "Manufacturer & Brand",
    };

    if (existingQuote && existingQuoteAttributes) {
      existingQuoteAttributes.forEach(ea => existingQuoteAttrMap.set(`${ea.group_id}_${ea.attribute_id}`, ea));
    }

    const getValues = (ia: any) => {
      if (ia.attribute_id === "mfg_brand_mapping") {
        return (ia.values || []).map((v: any) => ({ value_id: v.value_id, value_label: v.value_label }));
      }
      const ids = new Set((ia.values || []).map((v: any) => v.value_id));
      return (catalogAttributeValues || []).filter(v => ids.has(v.id)).map(v => ({ value_id: v.id, value_label: v.value || v.label || "" }));
    };

    itemAttributes.forEach((ia: any) => {
      if (ia.attribute_type === 'SYSTEM' && ia.attribute_id !== 'mfg_brand_mapping') return;

      const groupId = ia.group_id;
      const values = getValues(ia);
      const proposalKey = `${groupId}_${ia.attribute_id}`;
      const attributeName = names[ia.attribute_id] || attrs.get(ia.attribute_id) || "";

      const ea = existingQuoteAttrMap.get(proposalKey);
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
    });

    const storedInDb = existingQuoteVariants || [];

    setDbVariants(storedInDb);
    setProposalAttributes(initialValues);
    setAttributeComments(existingQuoteAttributeComments || []);
    setVariantComments(existingQuoteVariantComments || []);

    const generated = generateVariantsFromAttributes(initialValues, storedInDb);

    if (storedInDb.length > 0) {
      const initialVariants = generated.map(v => {
        const sig = v.signature || computeSignature(v.combinations);
        const savedMatch = storedInDb.find(ev => (ev.signature || computeSignature(ev.combinations)) === sig);

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

    // Catalog Suggested Variants
    const myProducts = (allSellerProducts || []).filter((sp: any) => sp.party_id === activePartyId);
    let filteredSellerProducts: any[] = [];
    if (item?.catalog_product_id) {
      const matching = myProducts.filter((sp: any) => sp.catalog_product_id === item.catalog_product_id);
      if (matching.length > 0) filteredSellerProducts = matching;
    }

    const catalogVariants = filteredSellerProducts.flatMap((sp: any) => {
      const mfgBrandPair = sp.manufacturer_id && sp.brand_id ? [{
        attribute_id: 'mfg_brand_mapping',
        group_id: "system",
        attribute_name: "Manufacturer & Brand",
        value_id: `${sp.manufacturer_id || "any"}:${sp.brand_id || "any"}`,
        value_label: undefined
      }] : [];

      return (sp.variants || []).map((v: any) => {
        const comboVals = [...mfgBrandPair, ...(v.combination_values || [])];
        const sortedComboVals = [...comboVals].sort((a: any, b: any) => {
          if (a.attribute_id === 'mfg_brand_mapping') return -1;
          if (b.attribute_id === 'mfg_brand_mapping') return 1;
          return 0;
        });
        const combinations = sortedComboVals.map((cv: any) => ({ ...cv, values: [{ value_label: cv.label, value_id: cv.value_id }] }));
        const parentSpecs = sp.specifications || [];

        const savedMatch = (existingQuoteSuggestedVariants || []).find((sv: any) => sv.variant_id === v.id);

        return {
          id: savedMatch?.id || crypto.randomUUID(),
          seller_quote_id: existingQuote?.id || '',
          seller_product_id: sp.id,
          variant_id: v.id,
          sku: v.sku || v.id,
          list_price: v.price || 0,
          offer_price: savedMatch?.offer_price ?? (v.price || 0),
          combinations: combinations,
          specifications: parentSpecs,
          product_attributes: [...combinations, ...parentSpecs],
          is_selected: savedMatch ? savedMatch.is_selected : false,
          buyer_accepted: savedMatch ? savedMatch.buyer_accepted : false
        };
      });
    }) || [];

    setProposalSuggestedVariants(catalogVariants);

  }, [item, itemAttributes, catalogAttributes, catalogAttributeValues, allSellerProducts, existingQuote, existingQuoteAttributes, existingQuoteVariants, existingQuoteSuggestedVariants, existingQuoteAttributeComments, existingQuoteVariantComments]);


  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 font-sans animate-pulse">Loading Quote Workspace...</h2>
      </div>
    );
  }

  if (!rfq || !item) {
    return null;
  }

  return (
    <div className="space-y-6">

      {/* Request & Proposal Details */}
      <Descriptions
        title={
          <div className="flex items-center justify-between px-3 w-full py-2">
            <span className="text-sm font-bold text-slate-800">Request & Proposal Details</span>
            {/* <AntButton
              size="small"
              icon={<Lucide.Columns size={14} />}
              onClick={() => setCompareModalVisible(true)}
              disabled={totalSelected === 0}
              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold"
            >
              Compare Selected ({totalSelected})
            </AntButton> */}
          </div>
        }
        bordered
        size="small"
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        labelStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', backgroundColor: '#f8fafc' }}
        contentStyle={{ fontSize: '12px', color: '#1e293b' }}
        classNames={{ header: "mb-1" }}
        className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200"
      >
        <Descriptions.Item label="RFQ Number">
          <span className="font-mono font-bold text-slate-700 text-xs">{rfq.rfq_number}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Quote Reference">
          <AntTag color="purple" className="font-mono font-bold m-0 text-xs">
            {existingQuote?.seller_quote_number || 'N/A'}{existingQuote?.id ? ` | ${existingQuote.id}` : ''}
          </AntTag>
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
        <Descriptions.Item label="Product / Service">
          <span className="text-slate-900 font-semibold text-xs">{catalogProduct?.name || 'Custom Specifications'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <span className="text-slate-700 text-xs">{categories?.find((c) => c.id === item.category_id)?.name || 'Unknown'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="SKU">
          {item?.variant_id ? (
            <AntTag color="purple" className="font-mono font-semibold m-0 text-xs">{variantSKU || item.variant_id}</AntTag>
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
          <Descriptions.Item label="Last Updated">
            <span className="text-slate-600 text-xs">{new Date(existingQuote.updated_at).toLocaleString()}</span>
          </Descriptions.Item>
        )}
      </Descriptions>
      {/* Section 1: Attribute Configuration & Specifications */}
      <Section1AttributeConfig
        rfqId={rfqId}
        itemId={itemId}
        activePartyId={activePartyId}
        isViewOnly={isViewOnly}
        proposalAttributes={proposalAttributes}
        setProposalAttributes={setProposalAttributes}
        recalculateVariants={recalculateVariants}
        attributeComments={attributeComments}
        newAttributeComments={newAttributeComments}
        setNewAttributeComments={setNewAttributeComments}
        existingQuote={existingQuote || null}
        existingQuoteAttributes={existingQuoteAttributes || []}
      />

      {/* Section 2: Auto-Generated Combinations Pool */}
      <Section2CombinationsMatrix
        isViewOnly={isViewOnly}
        proposalVariants={proposalVariants}
        setProposalVariants={setProposalVariants}
      />

      {/* Section 3: Suggested Catalog Product Variants */}
      <Section3SuggestedCatalog
        itemId={itemId}
        activePartyId={activePartyId}
        isViewOnly={isViewOnly}
        proposalSuggestedVariants={proposalSuggestedVariants}
        setProposalSuggestedVariants={setProposalSuggestedVariants}
      />

      {/* Section 4: Selected Offered Proposal Options & Pricing Matrix */}
      <Section4OfferedPricing
        isViewOnly={isViewOnly}
        selectedOfferedItems={selectedOfferedItems}
        proposalVariants={proposalVariants}
        setProposalVariants={setProposalVariants}
        proposalSuggestedVariants={proposalSuggestedVariants}
        setProposalSuggestedVariants={setProposalSuggestedVariants}
        variantComments={variantComments}
        newVariantComments={newVariantComments}
        setNewVariantComments={setNewVariantComments}
        bulkPrice={bulkPrice}
        setBulkPrice={setBulkPrice}
        existingQuote={existingQuote || null}
      />

      {/* Comparison Modal */}
      <ComparisonMatrixModal
        visible={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        itemId={itemId}
        selectedOfferedItems={selectedOfferedItems}
        proposalAttributes={proposalAttributes}
      />

      <div className="pt-6 flex justify-end gap-3 mt-6 border-t border-slate-200">
        <AntButton
          icon={<Lucide.Columns size={15} />}
          onClick={() => setCompareModalVisible(true)}
          disabled={totalSelected === 0}
        >
          Compare Selected ({totalSelected})
        </AntButton>
        {!isViewOnly && (
          <>
            <AntButton onClick={() => navigate(basePath)}>Cancel</AntButton>
            <AntButton
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSave('SUBMITTED')}
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Proposal
            </AntButton>
          </>
        )}
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
