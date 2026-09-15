import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Alert, Button, Card, Steps, Tag as AntTag, InputNumber, Tooltip, Checkbox, Modal, Input, App as AntApp } from "antd";
import {
  TableOutlined,
  TrophyOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ShopOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  UnorderedListOutlined,
  SendOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";

import {
  rfqDb,
  type RfqItem,
  type RfqQuoteAward,
  type RfqQuoteItemAward,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PoAcknowledgement,
  type SellerQuote,
  type SellerQuoteVariant,
  type SellerQuoteSuggestedVariant,
  type SellerQuoteAttribute,
  type RfqAwardRevisionNote,
  type RfqQuoteItemAwardRevision,
} from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { catalogDb } from "../../data/catalog/catalog.db";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";

type ViewMode = "matrix" | "item_summary" | "summary";

type ProposalVariant = {
  id: string;
  colKey: string;
  colLabel: string;
  type: string;
  offerPrice: number;
  offerQuantity: number;
  unit: string;
  totalPrice: number;
  manufacturer: string;
  brand: string;
};

type SellerProposal = {
  sellerPartyId: string;
  sellerName: string;
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
  variants: ProposalVariant[];
};

type FlattenedVariant = ProposalVariant & {
  sellerPartyId: string;
  sellerName: string;
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
};

type AwardAllocation = {
  rfq_item_id: string;
  seller_party_id: string;
  seller_quote_id: string;
  variant_id: string;
  variant_col_key: string;
  variant_type: "CUSTOM" | "SUGGESTED";
  unit_price: number;
  buyer_target_quantity: number;
  unit_of_measure: string;
  seller_accepted?: boolean;
  is_selected?: boolean;
};

type RfqItemAllocation = {
  rfq_item_id: string;
  allocations: AwardAllocation[];
};

const formatCurrency = (value: number): string => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const extractMfgBrandFromQuoteAttrs = (quoteId: string, quoteAttributes: SellerQuoteAttribute[], allManufacturers: any[], allBrands: any[]): { manufacturer: string; brand: string } => {
  const quoteAttrs = quoteAttributes.filter(a => a.seller_quote_id === quoteId);
  const mfgBrandAttribute = quoteAttrs.find(attribute => attribute.attribute_id === "mfg_brand_mapping");

  let manufacturer = "N/A";
  let brand = "N/A";

  const val = mfgBrandAttribute?.values?.[0];
  if (val) {
    const valId = val.value_id || "";
    if (valId.includes(":")) {
      const [mfgId, brandId] = valId.split(":");
      const mfgMap = new Map(allManufacturers.map(m => [m.id, m.company_name]));
      const brandMap = new Map(allBrands.map(b => [b.id, b.name]));
      if (mfgId && mfgId !== "any") {
        manufacturer = mfgMap.get(mfgId) || val.value_label || mfgId;
      }
      if (brandId && brandId !== "any") {
        brand = brandMap.get(brandId) || val.value_label || brandId;
      }
    }
  }

  return { manufacturer, brand };
};

export const RfqQuoteAwardingPage: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === "BUSINESS";
  const basePath = isBusinessContext ? "/b/rfqs" : "/user/rfqs";

  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [allocations, setAllocations] = useState<RfqItemAllocation[]>([]);

  const pageData = useLiveQuery(async () => {
    if (!rfqId) return null;

    const [
      rfq,
      rfqItems,
      parties,
      allManufacturers,
      allBrands,
      catalogProducts,
      categories,
      allQuotes,
      allProposalVariants,
      allSuggestedVariants,
      quoteAttributes,
      existingQuoteAwards,
      existingQuoteVariantAwards,
      awardRevisionNotes,
    ] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_items.where("rfq_id").equals(rfqId).toArray(),
      businessDb.parties.toArray(),
      businessDb.manufacturers.toArray(),
      businessDb.brands.toArray(),
      catalogDb.products.toArray(),
      catalogDb.categories.toArray(),
      rfqDb.seller_quotes.toArray(),
      rfqDb.seller_quote_variants.toArray(),
      rfqDb.seller_quote_suggested_variants.toArray(),
      rfqDb.seller_quote_attributes.toArray(),
      rfqDb.rfq_quote_awards.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.rfq_quote_item_awards.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.rfq_award_revision_notes.where("rfq_id").equals(rfqId).toArray(),
    ]);

    return {
      rfq,
      rfqItems,
      parties,
      catalogProducts,
      categories,
      allQuotes,
      allProposalVariants,
      allSuggestedVariants,
      allManufacturers,
      allBrands,
      quoteAttributes,
      existingQuoteAwards: existingQuoteAwards || [],
      existingQuoteVariantAwards: existingQuoteVariantAwards || [],
      awardRevisionNotes: awardRevisionNotes || [],
    };
  }, [rfqId]);

  const {
    rfq,
    rfqItems = [],
    parties = [],
    catalogProducts = [],
    categories = [],
    allQuotes = [],
    allProposalVariants = [],
    allSuggestedVariants = [],
    allManufacturers = [],
    allBrands = [],
    quoteAttributes = [],
    existingQuoteAwards = [],
    existingQuoteVariantAwards = [],
    awardRevisionNotes = [],
  } = pageData ?? {};

  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
      { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number ?? "RFQ Workspace"}</a> },
      { title: <span className="text-slate-800">Quote Award Revision</span> },
    ],
    [navigate, basePath, rfqId, rfq?.rfq_number],
  );
  useBreadcrumb(breadcrumbs);

  const activePartyId = useMemo(() => {
    if (!parties.length) return "";
    if (isBusinessContext) {
      return parties.find(party => party.owner_type === "BUSINESS" && party.owner_id === activeWorkspace?.businessId)?.id ?? "";
    }
    return parties.find(party => party.owner_type === "USER" && party.owner_id === currentUserId)?.id ?? parties.find(party => party.id === "pty-6")?.id ?? "";
  }, [parties, isBusinessContext, activeWorkspace?.businessId, currentUserId]);

  useEffect(() => {
    if (rfqItems && rfqItems.length > 0) {
      setAllocations(prev => {
        const existingMap = new Map(prev.map(p => [p.rfq_item_id, p.allocations]));
        return rfqItems.map(item => {
          const inMemoryAllocations = existingMap.get(item.id);
          const itemVariantAwards = (existingQuoteVariantAwards || []).filter(v => v.rfq_item_id === item.id);

          // If no in-memory state exists yet for this item, seed from existingQuoteVariantAwards
          if (!inMemoryAllocations || inMemoryAllocations.length === 0) {
            if (itemVariantAwards.length > 0) {
              const seededAllocations: AwardAllocation[] = itemVariantAwards.map(v => ({
                rfq_item_id: item.id,
                seller_party_id: v.seller_party_id,
                seller_quote_id: v.seller_quote_id,
                variant_id: v.variant_id,
                variant_col_key: `col_${v.variant_id}`,
                variant_type: v.variant_type,
                unit_price: v.unit_price,
                buyer_target_quantity: v.buyer_target_quantity,
                unit_of_measure: v.unit_of_measure || item.req_unit || "PCS",
                seller_accepted: v.seller_accepted,
                is_selected: true,
              }));

              return {
                rfq_item_id: item.id,
                allocations: seededAllocations,
              };
            }

            return {
              rfq_item_id: item.id,
              allocations: [],
            };
          }

          // If in-memory state already exists, merge with DB awards to keep user edits and sync latest DB status
          const seededVariantMap = new Map(itemVariantAwards.map(v => [v.variant_id, v]));
          const mergedAllocations: AwardAllocation[] = inMemoryAllocations.map(alloc => {
            const dbAward = seededVariantMap.get(alloc.variant_id);
            if (dbAward) {
              return {
                ...alloc,
                seller_accepted: dbAward.seller_accepted,
                unit_of_measure: alloc.unit_of_measure || dbAward.unit_of_measure || item.req_unit || "PCS",
              };
            }
            return alloc;
          });

          // Add any DB awards that weren't in inMemoryAllocations
          const inMemoryVariantIds = new Set(inMemoryAllocations.map(a => a.variant_id));
          itemVariantAwards.forEach(v => {
            if (!inMemoryVariantIds.has(v.variant_id)) {
              mergedAllocations.push({
                rfq_item_id: item.id,
                seller_party_id: v.seller_party_id,
                seller_quote_id: v.seller_quote_id,
                variant_id: v.variant_id,
                variant_col_key: `col_${v.variant_id}`,
                variant_type: v.variant_type,
                unit_price: v.unit_price,
                buyer_target_quantity: v.buyer_target_quantity,
                unit_of_measure: v.unit_of_measure || item.req_unit || "PCS",
                seller_accepted: v.seller_accepted,
                is_selected: true,
              });
            }
          });

          return {
            rfq_item_id: item.id,
            allocations: mergedAllocations,
          };
        });
      });
    }
  }, [rfqItems, existingQuoteVariantAwards]);

  // const handleFinalizeAndGeneratePOs = async () => {
  //   if (!rfqId) return;
  //
  //   for (const item of rfqItems) {
  //     const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
  //     const itemAllocated = (itemGroup?.allocations || [])
  //       .filter(a => a.is_selected)
  //       .reduce((sum, a) => sum + (a.buyer_target_quantity || 0), 0);
  //     if (itemAllocated > item.req_quantity) {
  //       message.error(`Line item #${item.item_index || 1} is over-allocated (${itemAllocated}/${item.req_quantity}). Please adjust before finalizing.`);
  //       return;
  //     }
  //   }
  //
  //   const activeAllocations = allocations.flatMap(itemGroup => itemGroup.allocations).filter(a => a.is_selected && a.buyer_target_quantity > 0);
  //   if (activeAllocations.length === 0) {
  //     message.warning("Please allocate award quantities to at least one variant before finalizing.");
  //     return;
  //   }

  /*
   * Early Return Loading Guards
   */
  if (!pageData) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-sm font-semibold text-slate-600">Loading Awarding Workspace...</h2>
      </div>
    );
  }

  if (!rfq || (rfq.requester_id !== activePartyId && activePartyId !== "")) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-lg font-bold text-slate-800">RFQ Sourcing Container Not Found</h2>
        <Button size="small" className="mt-3" onClick={() => navigate(basePath)}>
          Back to RFQs List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* 1. Guided Stepper Header */}
      <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-800 tracking-tight m-0">RFQ Quotes Awarding</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 m-0">
              Item-Seller Award Revision & PO Generation: Evaluate proposals, negotiate item-wise seller allocations with revision rounds, and release Purchase Orders.
            </p>
          </div>
        </div>

        {/* 3-Step Stepper Navigation Bar */}
        <div className="pt-3">
          <Steps
            current={viewMode === "matrix" ? 0 : viewMode === "item_summary" ? 1 : 2}
            onChange={step => setViewMode(step === 0 ? "matrix" : step === 1 ? "item_summary" : "summary")}
            size="small"
            items={[
              {
                title: <span className="font-bold text-xs">Award Line Item Variants</span>,
                description: <span className="text-[11px] text-slate-500">Evaluate proposals & allocate per product</span>,
              },
              {
                title: <span className="font-bold text-xs">Supplier Award Overview & POs</span>,
                description: <span className="text-[11px] text-slate-500">Review supplier totals & release Purchase Orders</span>,
              },
            ]}
          />
        </div>
      </Card>

      {/* 2. Step 1: Award Line Item Variants View (Unified Component) */}
      {viewMode === "matrix" && (
        <div className="space-y-4">
          <QuoteRevisionSection
            rfqItems={rfqItems}
            catalogProducts={catalogProducts}
            categories={categories}
            allQuotes={allQuotes}
            allProposalVariants={allProposalVariants}
            allSuggestedVariants={allSuggestedVariants}
            quoteAttributes={quoteAttributes}
            parties={parties}
            allManufacturers={allManufacturers}
            allBrands={allBrands}
            allocations={allocations}
            setAllocations={setAllocations}
            existingQuoteAwards={existingQuoteAwards}
            existingQuoteVariantAwards={existingQuoteVariantAwards}
            awardRevisionNotes={awardRevisionNotes}
            activePartyId={activePartyId}
            currentUserId={currentUserId}
          />

          {/* Step 1 Footer Action Bar */}
          <div className="flex items-center justify-between bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs">
            <Button
              type="primary"
              size="middle"
              onClick={() => setViewMode("item_summary")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs border-0"
            >
              Next: Item-Wise Allocations <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      )}

      {/* 3. Step 2: Item-Wise Allocations Review View */}
      {/* {viewMode === "item_summary" && (
        <div className="space-y-4">
          <ItemWiseAwardOverviewSummary
            rfqItems={rfqItems}
            allocations={allocations}
            catalogProducts={catalogProducts}
            categories={categories}
            parties={parties}
            allQuotes={allQuotes}
            allProposalVariants={allProposalVariants}
            allSuggestedVariants={allSuggestedVariants}
            quoteAttributes={quoteAttributes}
            allManufacturers={allManufacturers}
            allBrands={allBrands}
          />

          <div className="flex items-center justify-between bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs">
            <Button
              size="middle"
              icon={<ArrowLeftOutlined />}
              onClick={() => setViewMode("matrix")}
              className="text-xs font-medium text-slate-600 hover:text-slate-800 border-slate-200/70"
            >
              Back to Line Items Matrix
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="primary"
                size="middle"
                onClick={() => setViewMode("summary")}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs border-0"
              >
                Next: Supplier Award Overview <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        </div>
      )
      } */}

      {/* 4. Step 3: Supplier-Wise Final Award Overview Summary View */}
      {/* {viewMode === "summary" && (
        <div className="space-y-4">
          <SellerWiseAwardOverviewSummary
            rfqId={rfqId}
            rfq={rfq}
            currentProcessHeader={currentQuoteAward}
            isFinalized={isFinalized}
            allocations={allocations}
            existingAwardItems={existingQuoteVariantAwards}
            existingPurchaseOrders={existingPurchaseOrders}
            existingPoAcknowledgements={existingPoAcknowledgements}
            parties={parties}
            allQuotes={allQuotes}
            rfqItems={rfqItems}
            catalogProducts={catalogProducts}
            categories={categories}
            allProposalVariants={allProposalVariants}
            allSuggestedVariants={allSuggestedVariants}
            quoteAttributes={quoteAttributes}
            allManufacturers={allManufacturers}
            allBrands={allBrands}
          />

           <div className="flex items-center justify-between bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs">
            <Button
              size="middle"
              icon={<ArrowLeftOutlined />}
              onClick={() => setViewMode("item_summary")}
              className="text-xs font-medium text-slate-600 hover:text-slate-800 border-slate-200/70"
            >
              Back to Item-Wise Allocations
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="primary"
                size="middle"
                icon={<CheckCircleOutlined />}
                onClick={handleFinalizeAndGeneratePOs}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs shadow-xs border-0"
              >
                Finalize Award & Generate Purchase Orders
              </Button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

interface QuoteRevisionSectionProps {
  rfqItems: RfqItem[];
  catalogProducts: any[];
  categories: any[];
  allQuotes: SellerQuote[];
  allProposalVariants: SellerQuoteVariant[];
  allSuggestedVariants: SellerQuoteSuggestedVariant[];
  quoteAttributes: SellerQuoteAttribute[];
  parties: any[];
  allManufacturers: any[];
  allBrands: any[];
  allocations: RfqItemAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<RfqItemAllocation[]>>;
  existingQuoteAwards?: RfqQuoteAward[];
  existingQuoteVariantAwards?: RfqQuoteItemAward[];
  awardRevisionNotes?: RfqAwardRevisionNote[];
  activePartyId?: string;
  currentUserId?: string;
}

const QuoteRevisionSection: React.FC<QuoteRevisionSectionProps> = props => {
  const {
    rfqItems,
    catalogProducts,
    categories,
    allQuotes,
    allProposalVariants,
    allSuggestedVariants,
    quoteAttributes,
    parties,
    allManufacturers,
    allBrands,
    allocations,
    setAllocations,
    existingQuoteAwards = [],
    existingQuoteVariantAwards = [],
    awardRevisionNotes = [],
    activePartyId,
    currentUserId,
  } = props;

  const { message } = AntApp.useApp();
  const [cardSteps, setCardSteps] = useState<Record<string, 0 | 1>>({});
  const [revisionModalState, setRevisionModalState] = useState<{
    visible: boolean;
    item: RfqItem | null;
    sellerQuoteAllocation: any;
  }>({
    visible: false,
    item: null,
    sellerQuoteAllocation: null,
  });
  const [revisionNote, setRevisionNote] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const hasItemExistingAwardRevision = (item: RfqItem) => {
    const hasRevisionAward = (existingQuoteAwards || []).some(a => a.rfq_item_id === item.id && (a.award_round > 1 || a.award_status === "SELLER_REVISED"));
    const itemAllocations = allocations.find(a => a.rfq_item_id === item.id)?.allocations || [];
    const hasAllocations = itemAllocations.some(a => a.is_selected && a.buyer_target_quantity > 0);
    const hasExistingDbAward = (existingQuoteAwards || []).some(a => a.rfq_item_id === item.id);
    return hasRevisionAward || hasAllocations || hasExistingDbAward;
  };

  const getCardStep = (item: RfqItem): 0 | 1 => {
    return cardSteps[item.id] ?? (hasItemExistingAwardRevision(item) ? 1 : 0);
  };

  const setCardStep = (itemId: string, step: 0 | 1) => {
    setCardSteps(prev => ({ ...prev, [itemId]: step }));
  };

  const handleToggleVariantSelection = (itemId: string, variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string, checked: boolean) => {
    setAllocations(prev => {
      return prev.map(group => {
        if (group.rfq_item_id !== itemId) return group;
        const existing = group.allocations.find(a => a.variant_id === variant.id);
        const currentQty = existing?.buyer_target_quantity || 0;
        const nextQty = checked ? currentQty : 0;

        const updatedAlloc: AwardAllocation = {
          rfq_item_id: itemId,
          seller_party_id: sellerPartyId,
          seller_quote_id: sellerQuoteId,
          variant_id: variant.id,
          variant_col_key: variant.colKey,
          variant_type: variant.type.includes("Custom") ? "CUSTOM" : "SUGGESTED",
          unit_price: variant.offerPrice,
          buyer_target_quantity: nextQty,
          unit_of_measure: variant.unit || "PCS",
          seller_accepted: false,
          is_selected: checked,
        };

        const newAllocations = existing ? group.allocations.map(a => (a.variant_id === variant.id ? updatedAlloc : a)) : [...group.allocations, updatedAlloc];

        return { ...group, allocations: newAllocations };
      });
    });
  };

  const handleQtyChange = (
    itemId: string,
    variantOrId: ProposalVariant | string,
    sellerPartyId: string,
    sellerQuoteId: string,
    newQty: number | null,
    allCombinedVariants: FlattenedVariant[],
    reqUnit?: string,
  ) => {
    const qty = Math.max(0, newQty || 0);
    const variantId = typeof variantOrId === "string" ? variantOrId : variantOrId.id;
    const variantObj = typeof variantOrId === "string" ? allCombinedVariants.find(v => v.id === variantOrId) : variantOrId;

    setAllocations(prev => {
      return prev.map(group => {
        if (group.rfq_item_id !== itemId) return group;
        const existing = group.allocations.find(a => a.variant_id === variantId);
        const currentIsSelected = existing?.is_selected;

        const unitPrice = variantObj?.offerPrice ?? existing?.unit_price ?? 0;
        const unit = variantObj?.unit ?? existing?.unit_of_measure ?? reqUnit ?? "PCS";
        const variantType = variantObj ? (variantObj.type.includes("Custom") ? "CUSTOM" : "SUGGESTED") : (existing?.variant_type ?? "CUSTOM");
        const colKey = variantObj?.colKey ?? existing?.variant_col_key ?? `col_${variantId}`;

        const updatedAlloc: AwardAllocation = {
          rfq_item_id: itemId,
          seller_party_id: sellerPartyId,
          seller_quote_id: sellerQuoteId,
          variant_id: variantId,
          variant_col_key: colKey,
          variant_type: variantType,
          unit_price: unitPrice,
          buyer_target_quantity: qty,
          unit_of_measure: unit,
          seller_accepted: existing?.seller_accepted ?? false,
          is_selected: qty > 0 ? true : (currentIsSelected ?? false),
        };

        const newAllocations = existing ? group.allocations.map(a => (a.variant_id === variantId ? updatedAlloc : a)) : [...group.allocations, updatedAlloc];

        return { ...group, allocations: newAllocations };
      });
    });
  };

  const handleOpenAwardRevisionModal = (item: RfqItem, sellerQuoteAllocation: any) => {
    setRevisionModalState({
      visible: true,
      item,
      sellerQuoteAllocation,
    });
    setRevisionNote("");
  };

  const handleConfirmAwardRevision = async () => {
    const { item, sellerQuoteAllocation: selectedSellerForRevision } = revisionModalState;
    if (!item || !selectedSellerForRevision) return;
    setSubmittingRevision(true);
    try {
      const now = new Date().toISOString();

      const existingAward = await rfqDb.rfq_quote_awards
        .where("rfq_item_id")
        .equals(item.id)
        .and(a => a.seller_quote_id === selectedSellerForRevision.sellerQuoteId)
        .first();

      const nextAwardRound = (existingAward?.award_round || 0) + 1;
      const awardId = existingAward?.id || `qaward-${crypto.randomUUID()}`;

      const existingVariantAwards = await rfqDb.rfq_quote_item_awards.where("quote_award_id").equals(awardId).toArray();
      const existingVariantMap = new Map(existingVariantAwards.map(v => [v.variant_id, v]));

      const quoteAwardPayload: RfqQuoteAward = {
        id: awardId,
        rfq_id: item.rfq_id,
        rfq_item_id: item.id,
        seller_quote_id: selectedSellerForRevision.sellerQuoteId,
        seller_party_id: selectedSellerForRevision.sellerPartyId,
        buyer_party_id: activePartyId || "",
        created_by_user_id: currentUserId,
        award_status: "AWARDED",
        award_round: nextAwardRound,
        // total_awarded_amount: selectedSellerForRevision.totalValue,
        // total_awarded_quantity: selectedSellerForRevision.totalQty,
        currency: "USD",
        notes: revisionNote.trim() || undefined,
        created_at: existingAward?.created_at || now,
        updated_at: now,
      };

      const quoteItemAwardPayload: RfqQuoteItemAward[] = [];
      const quoteItemRevisionsPayload: RfqQuoteItemAwardRevision[] = [];

      for (const allocItem of selectedSellerForRevision?.items) {
        const existingQva = existingVariantMap.get(allocItem.allocation.variant_id);
        const qvaId = existingQva?.id || `qva-${crypto.randomUUID()}`;

        quoteItemAwardPayload.push({
          id: qvaId,
          quote_award_id: awardId,
          rfq_id: item.rfq_id,
          rfq_item_id: item.id,
          seller_quote_id: selectedSellerForRevision.sellerQuoteId,
          seller_party_id: selectedSellerForRevision.sellerPartyId,
          variant_id: allocItem.allocation.variant_id,
          variant_type: allocItem.allocation.variant_type,
          variant_label: allocItem.variantLabel,
          buyer_target_quantity: allocItem.awardedQty,
          seller_offered_quantity: allocItem.awardedQty,
          unit_price: allocItem.unitPrice,
          total_price: allocItem.subtotal,
          unit_of_measure: allocItem.allocation.unit_of_measure || item.req_unit || "PCS",
          variant_award_status: "AWARDED",
          seller_accepted: false,
          buyer_accepted: true,
          buyer_accepted_at: now,
          created_at: existingQva?.created_at || now,
          updated_at: now,
        });

        quoteItemRevisionsPayload.push({
          id: `arh-${crypto.randomUUID()}`,
          quote_award_id: awardId,
          quote_variant_award_id: qvaId,
          rfq_id: item.rfq_id,
          rfq_item_id: item.id,
          seller_party_id: selectedSellerForRevision.sellerPartyId,
          seller_quote_id: selectedSellerForRevision.sellerQuoteId,
          award_round: nextAwardRound,
          actor_type: "BUYER",
          actor_id: currentUserId || "",
          variant_id: allocItem.allocation.variant_id,
          quantity: allocItem.awardedQty,
          unit_price: allocItem.unitPrice,
          note: revisionNote.trim() || `Buyer awarded allocation for Round ${nextAwardRound}`,
          created_at: now,
        });
      }

      const notePayload: RfqAwardRevisionNote | null =
        revisionNote && revisionNote.trim()
          ? {
            id: `arn-${crypto.randomUUID()}`,
            rfq_id: item.rfq_id,
            rfq_item_id: item.id,
            seller_quote_id: selectedSellerForRevision.sellerQuoteId,
            seller_party_id: selectedSellerForRevision.sellerPartyId,
            buyer_party_id: activePartyId || "",
            quote_award_id: awardId,
            award_round: nextAwardRound,
            actor_type: "BUYER",
            actor_id: currentUserId || "",
            note_type: "BUYER_REVISION_REQUEST",
            note: revisionNote.trim(),
            created_at: now,
          }
          : null;

      await rfqDb.transaction("rw", [rfqDb.rfq_quote_awards, rfqDb.rfq_quote_item_awards, rfqDb.rfq_quote_item_award_revisions, rfqDb.rfq_award_revision_notes], async () => {
        await rfqDb.rfq_quote_awards.put(quoteAwardPayload);
        await rfqDb.rfq_quote_item_awards.bulkPut(quoteItemAwardPayload);
        if (quoteItemRevisionsPayload.length > 0) {
          await rfqDb.rfq_quote_item_award_revisions.bulkAdd(quoteItemRevisionsPayload);
        }
        if (notePayload) {
          await rfqDb.rfq_award_revision_notes.add(notePayload);
        }
      });

      message.success(`Award Allocation (Round ${nextAwardRound}) successfully sent to ${selectedSellerForRevision.sellerName}!`);
      setRevisionModalState({ visible: false, item: null, sellerQuoteAllocation: null });
    } catch (err) {
      console.error("Failed to send award allocation:", err);
      message.error("Failed to send award allocation.");
    } finally {
      setSubmittingRevision(false);
    }
  };

  const itemsComputedData = useMemo(() => {
    const customVariantsMap = new Map<string, typeof allProposalVariants>();
    allProposalVariants.forEach(v => {
      const list = customVariantsMap.get(v.seller_quote_id) || [];
      list.push(v);
      customVariantsMap.set(v.seller_quote_id, list);
    });

    const suggestedVariantsMap = new Map<string, typeof allSuggestedVariants>();
    allSuggestedVariants.forEach(v => {
      const list = suggestedVariantsMap.get(v.seller_quote_id) || [];
      list.push(v);
      suggestedVariantsMap.set(v.seller_quote_id, list);
    });

    const partiesMap = new Map(parties.map(p => [p.id, p.display_name]));

    return rfqItems.map((item, itemIdx) => {
      const product = catalogProducts.find(p => p.id === item.catalog_product_id);
      const category = categories.find(c => c.id === item.category_id);

      const targetQuotes = allQuotes.filter(q => q.rfq_item_id === item.id && q.status === "DEVIATION_ACCEPTED");
      const sellerProposals: SellerProposal[] = [];
      let optionCounter = 1;

      for (const quote of targetQuotes) {
        const sellerName = partiesMap.get(quote.seller_party_id) ?? `Supplier (${quote.seller_party_id})`;
        const customVariants = customVariantsMap.get(quote.id) || [];
        const suggestedVariants = suggestedVariantsMap.get(quote.id) || [];
        const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(quote.id, quoteAttributes, allManufacturers, allBrands);
        const offerQuantity = quote.offer_quantity ?? item.req_quantity ?? 1;
        const unit = quote.offer_unit ?? item.req_unit ?? "PCS";

        const proposalVariants: ProposalVariant[] = [];

        for (const variant of customVariants) {
          const offerPrice = variant.offer_price ?? 0;
          const optNum = optionCounter++;
          proposalVariants.push({
            id: variant.id,
            colKey: `col_${variant.id}`,
            colLabel: variant.sku ? `Option #${optNum} (${variant.sku})` : `Option #${optNum} (Custom)`,
            type: "New proposal option",
            offerPrice,
            offerQuantity,
            unit,
            totalPrice: offerPrice * offerQuantity,
            manufacturer,
            brand,
          });
        }

        for (const variant of suggestedVariants) {
          const offerPrice = variant.offer_price ?? variant.list_price ?? 0;
          proposalVariants.push({
            id: variant.id,
            colKey: `col_${variant.id}`,
            colLabel: variant.sku ? `Suggested SKU: ${variant.sku}` : "Catalog Suggested SKU",
            type: "Catalog Suggested SKU",
            offerPrice,
            offerQuantity,
            unit,
            totalPrice: offerPrice * offerQuantity,
            manufacturer,
            brand,
          });
        }

        sellerProposals.push({
          sellerPartyId: quote.seller_party_id,
          sellerName,
          quoteId: quote.id,
          quoteNumber: quote.seller_quote_number,
          quoteStatus: quote.status,
          variants: proposalVariants,
        });
      }

      const allCombinedVariants: FlattenedVariant[] = sellerProposals.flatMap(seller =>
        seller.variants.map(variant => ({
          ...variant,
          sellerPartyId: seller.sellerPartyId,
          sellerName: seller.sellerName,
          quoteId: seller.quoteId,
          quoteNumber: seller.quoteNumber,
          quoteStatus: seller.quoteStatus,
        })),
      );

      const itemAllocations = (allocations.find(a => a.rfq_item_id === item.id)?.allocations || []).filter(a => a.is_selected && a.buyer_target_quantity > 0);
      const allocatedSellersCount = new Set(itemAllocations.map(a => a.seller_party_id)).size;
      const allocatedVariantsCount = itemAllocations.length;
      const allocatedQty = itemAllocations.reduce((sum, a) => sum + a.buyer_target_quantity, 0);
      const reqQty = item.req_quantity || 0;
      const remainingQty = Math.max(0, reqQty - allocatedQty);
      const allocatedTotalPrice = itemAllocations.reduce((sum, a) => sum + a.unit_price * a.buyer_target_quantity, 0);
      const lowestPrice = allCombinedVariants.length > 0 ? Math.min(...allCombinedVariants.map(v => v.offerPrice)) : 0;

      const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
      const activeAllocations = (itemGroup?.allocations || []).filter(a => a.is_selected);
      const sellerQuoteAllocationsMap = new Map<string, any>();

      for (const alloc of activeAllocations) {
        const variant = allCombinedVariants.find(v => v.id === alloc.variant_id);
        const sellerParty = parties.find(p => p.id === alloc.seller_party_id);
        const quote = allQuotes.find(q => q.id === alloc.seller_quote_id);
        const sellerName = sellerParty?.display_name || `Supplier (${alloc.seller_party_id})`;
        const quoteNumber = quote?.seller_quote_number || "Quote Proposal";

        if (!sellerQuoteAllocationsMap.has(alloc.seller_party_id)) {
          const existingAward = (existingQuoteAwards || []).find(
            a => a.rfq_item_id === item.id && (a.seller_quote_id === alloc.seller_quote_id || a.seller_party_id === alloc.seller_party_id),
          );
          const awardRound = existingAward?.award_round || 1;
          const awardStatus = existingAward ? existingAward.award_status : quote?.status || "SUBMITTED";

          const isPendingSeller = awardStatus === "AWARDED";
          const isConfirmed = awardStatus === "CONFIRMED";
          const isSellerRevised = awardStatus === "SELLER_REVISED";
          const isDraft = !existingAward || (awardStatus !== "AWARDED" && awardStatus !== "CONFIRMED" && awardStatus !== "SELLER_REVISED");

          sellerQuoteAllocationsMap.set(alloc.seller_party_id, {
            sellerPartyId: alloc.seller_party_id,
            sellerName,
            sellerQuoteId: alloc.seller_quote_id,
            quoteNumber,
            awardRound,
            quoteStatus: awardStatus,
            awardStatus,
            isPendingSeller,
            isConfirmed,
            isSellerRevised,
            isDraft,
            totalQty: 0,
            totalValue: 0,
            items: [],
          });
        }

        const group = sellerQuoteAllocationsMap.get(alloc.seller_party_id)!;
        const unitPrice = alloc.unit_price || variant?.offerPrice || 0;
        const awardedQty = alloc.buyer_target_quantity || 0;
        const subtotal = unitPrice * awardedQty;

        const existingQva = (existingQuoteVariantAwards || []).find(v => v.rfq_item_id === item.id && v.seller_party_id === alloc.seller_party_id && v.variant_id === alloc.variant_id);
        const sellerOfferedQty = existingQva?.seller_offered_quantity;
        const sellerOfferedPrice = existingQva?.unit_price;

        group.totalQty += awardedQty;
        group.totalValue += subtotal;

        group.items.push({
          allocation: alloc,
          variant,
          variantLabel: variant?.colLabel || `Variant (${alloc.variant_type})`,
          manufacturer: variant?.manufacturer || "N/A",
          brand: variant?.brand || "N/A",
          unitPrice,
          awardedQty,
          subtotal,
          sellerOfferedQty,
          sellerOfferedPrice,
        });
      }

      const sellerQuoteAllocations = Array.from(sellerQuoteAllocationsMap.values());

      return {
        item,
        itemIndex: item.item_index || itemIdx + 1,
        product,
        category,
        sellerProposals,
        allCombinedVariants,
        insights: {
          totalSellers: sellerProposals.length,
          totalVariants: allCombinedVariants.length,
          allocatedSellersCount,
          allocatedVariantsCount,
          allocatedQty,
          reqQty,
          remainingQty,
          allocatedTotalPrice,
          lowestPrice,
        },
        sellerQuoteAllocations,
      };
    });
  }, [
    rfqItems,
    catalogProducts,
    categories,
    allQuotes,
    allProposalVariants,
    allSuggestedVariants,
    quoteAttributes,
    parties,
    allManufacturers,
    allBrands,
    allocations,
    existingQuoteAwards,
    existingQuoteVariantAwards,
  ]);

  const modalProduct = revisionModalState.item ? catalogProducts.find(p => p.id === revisionModalState.item?.catalog_product_id) : null;

  return (
    <div className="space-y-12">
      {itemsComputedData.map(itemData => {
        const { item, itemIndex, product, category, sellerProposals, allCombinedVariants, insights, sellerQuoteAllocations } = itemData;
        const currentCardStep = getCardStep(item);

        const rowsDefinition = [
          {
            key: "manufacturer",
            attributeName: "Manufacturer / Brand",
            getValue: (variant: FlattenedVariant) => (
              <div className="flex flex-col gap-1">
                <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium border border-slate-200/60 bg-slate-50/60 text-slate-700">{variant.manufacturer}</span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium border border-slate-200/60 bg-slate-50/60 text-slate-700">{variant.brand}</span>
              </div>
            ),
          },
          {
            key: "offer_price",
            attributeName: "Offer Price (Unit)",
            getValue: (variant: FlattenedVariant) => <span className="font-semibold text-emerald-600 text-xs">{formatCurrency(variant.offerPrice)}</span>,
          },
          {
            key: "offer_quantity",
            attributeName: "Offer Quantity",
            getValue: (variant: FlattenedVariant) => (
              <span className="font-medium text-slate-700 text-xs">
                {variant.offerQuantity} {variant.unit}
              </span>
            ),
          },
          {
            key: "total_price",
            attributeName: "Total Price",
            getValue: (variant: FlattenedVariant) => <span className="font-semibold text-slate-800 text-xs">{formatCurrency(variant.totalPrice)}</span>,
          },
          {
            key: "select_variant",
            attributeName: "Select for Award",
            getValue: (variant: FlattenedVariant) => {
              const itemAllocations = allocations.find(a => a.rfq_item_id === item.id)?.allocations || [];
              const alloc = itemAllocations.find(a => a.variant_id === variant.id);
              const isSelected = !!alloc?.is_selected;

              // 1. Quote-level award
              const sellerAward = (existingQuoteAwards || []).find(
                a => a.rfq_item_id === item.id && (a.seller_quote_id === variant.quoteId || a.seller_party_id === variant.sellerPartyId),
              );

              // 2. Specific variant-level award
              const variantAward = (existingQuoteVariantAwards || []).find(
                v => v.rfq_item_id === item.id && v.variant_id === variant.id && (v.seller_quote_id === variant.quoteId || v.seller_party_id === variant.sellerPartyId),
              );

              const awardRound = sellerAward?.award_round || 1;

              // Case 1: Quote is awarded AND this specific variant was awarded
              if (sellerAward && variantAward) {
                if (sellerAward.award_status === "AWARDED" || variantAward.variant_award_status === "AWARDED") {
                  return (
                    <Tooltip title={`Award allocation of ${variantAward.buyer_target_quantity} ${variant.unit} has been sent to ${variant.sellerName} (Round ${awardRound}). Pending supplier response.`}>
                      <div className="flex items-center gap-1.5 cursor-not-allowed">
                        <AntTag color="blue" className="text-[11px] m-0 font-medium flex items-center gap-1">
                          <ClockCircleOutlined /> Awarded (R{awardRound})
                        </AntTag>
                      </div>
                    </Tooltip>
                  );
                }

                if (sellerAward.award_status === "CONFIRMED" || variantAward.variant_award_status === "CONFIRMED") {
                  return (
                    <Tooltip title={`Award allocation confirmed by ${variant.sellerName} (Round ${awardRound}). Finalized.`}>
                      <div className="flex items-center gap-1.5">
                        <AntTag color="emerald" className="text-[11px] m-0 font-semibold flex items-center gap-1">
                          <CheckCircleOutlined /> Confirmed
                        </AntTag>
                      </div>
                    </Tooltip>
                  );
                }

                if (sellerAward.award_status === "SELLER_REVISED" || variantAward.variant_award_status === "SELLER_REVISED") {
                  return (
                    <div className="flex flex-col gap-1">
                      <Checkbox
                        checked={isSelected}
                        onChange={e => handleToggleVariantSelection(item.id, variant, variant.sellerPartyId, variant.quoteId, e.target.checked)}
                        className="font-medium text-xs"
                      >
                        {isSelected ? <span className="text-amber-600 font-semibold text-xs">Selected</span> : <span className="text-slate-400 text-xs">Select Option</span>}
                      </Checkbox>
                      <div className="flex items-center gap-1 flex-wrap">
                        <AntTag color="orange" className="text-[10px] m-0 font-bold w-fit">
                          Award Revision
                        </AntTag>
                        {variantAward.seller_offered_quantity !== undefined && (
                          <span className="text-[10px] text-amber-700 font-mono font-medium">
                            {variantAward.seller_offered_quantity} {variant.unit} @ {formatCurrency(variantAward.unit_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                if (sellerAward.award_status === "PO_CREATED" || sellerAward.award_status === "PO_RECEIVED") {
                  return (
                    <AntTag color="purple" className="text-[11px] m-0 font-semibold flex items-center gap-1">
                      <CheckCircleOutlined /> PO Released
                    </AntTag>
                  );
                }
              }

              // Case 2: Quote has been awarded, but THIS specific variant was NOT awarded
              if (sellerAward && !variantAward) {
                return (
                  <Tooltip title={`This variant was not included in the award allocation sent to ${variant.sellerName} (Round ${awardRound}).`}>
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="text-slate-300 font-bold text-sm leading-none">—</span>
                      <span className="text-slate-400 text-[11px] italic">Not Awarded</span>
                    </div>
                  </Tooltip>
                );
              }

              // Case 3: New / unawarded quote - show standard selection checkbox
              return (
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    checked={isSelected}
                    onChange={e => handleToggleVariantSelection(item.id, variant, variant.sellerPartyId, variant.quoteId, e.target.checked)}
                    className="font-medium text-xs"
                  >
                    {isSelected ? <span className="text-indigo-600 font-semibold text-xs">Selected</span> : <span className="text-slate-400 text-xs">Select Option</span>}
                  </Checkbox>
                </div>
              );
            },
          },
        ];

        return (
          <Card key={item.id} size="small" className="shadow-xs border-slate-200 bg-white rounded-xl">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-indigo-50/15 to-white -mx-3 -mt-3 p-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500 text-white font-semibold text-sm m-0">{item.item_index}</div>
                  <h3 className="font-semibold text-slate-800 text-sm m-0">{product?.name || `RFQ Line Item #${itemIndex}`}</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">{category?.name || "Category"}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Requested Qty:{" "}
                  <span className="font-semibold text-slate-800">
                    {item.req_quantity} {item.req_unit || "PCS"}
                  </span>
                </div>
              </div>

              {/* Compact Inline Sourcing Metrics Bar */}
              <div className="bg-slate-50/80 border border-slate-200/60 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <ShopOutlined className="text-slate-400" />
                    <span className="text-slate-500">Proposals:</span>
                    <strong className="text-slate-800 font-semibold">{insights.totalSellers} Sellers</strong>
                    <span className="text-slate-400 text-[11px]">({insights.totalVariants} Var)</span>
                  </div>

                  <span className="text-slate-300">|</span>

                  <div className="flex items-center gap-1.5">
                    <CheckCircleOutlined className="text-slate-400" />
                    <span className="text-slate-500">Allocated:</span>
                    <strong className="text-indigo-600 font-semibold">
                      {insights.allocatedQty} / {insights.reqQty} {item?.req_unit || "PCS"}
                    </strong>
                    <span className="text-slate-400 text-[11px]">(Rem: {insights.remainingQty})</span>
                    {insights.allocatedQty === insights.reqQty && insights.reqQty > 0 ? (
                      <span className="font-medium text-[10px] px-1.5 py-0.2 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 ml-0.5">✓ 100% Fully Allocated</span>
                    ) : insights.allocatedQty > insights.reqQty ? (
                      <span className="font-medium text-[10px] px-1.5 py-0.2 rounded border border-rose-200 bg-rose-50 text-rose-700 ml-0.5">
                        ⚠ Over Allocated (+{insights.allocatedQty - insights.reqQty})
                      </span>
                    ) : (
                      <span className="font-medium text-[10px] px-1.5 py-0.2 rounded border border-slate-200 bg-white text-slate-600 ml-0.5">Partially Allocated</span>
                    )}
                  </div>

                  <span className="text-slate-300">|</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Allocated Value:</span>
                    <strong className="text-emerald-600 font-semibold">{formatCurrency(insights.allocatedTotalPrice)}</strong>
                  </div>
                </div>

                <div>
                  {currentCardStep === 0 ? (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => setCardStep(item.id, 1)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs border-0 !h-6"
                    >
                      Proceed to Quote Allocation <ArrowRightOutlined />
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setCardStep(item.id, 0)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-800 border-slate-200/80 !h-6"
                    >
                      Back to Variant Comparison
                    </Button>
                  )}
                </div>
              </div>

              {currentCardStep === 0 && (
                <div className="space-y-3">
                  {allCombinedVariants.length > 0 ? (
                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border border-slate-200/60 rounded-xl shadow-xs bg-white">
                      <table className="w-full border-separate border-spacing-0 text-xs text-left">
                        <thead className="bg-slate-50/80 text-slate-700">
                          <tr>
                            <th
                              rowSpan={2}
                              className="sticky left-0 top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-r border-b border-slate-100 px-3 py-2 text-left font-semibold text-slate-700 text-xs min-w-[220px]"
                            >
                              Basic Attribute
                            </th>
                            {sellerProposals.map(seller => (
                              <th
                                key={seller.sellerPartyId}
                                colSpan={seller.variants.length}
                                className="sticky top-0 z-20 text-center font-semibold text-slate-800 bg-white border-r border-b border-slate-100 py-1.5 px-3 text-xs"
                              >
                                <div>{seller.sellerName}</div>
                                <div className="text-[10px] font-mono text-slate-400 font-normal">{seller.quoteNumber}</div>
                              </th>
                            ))}
                          </tr>

                          <tr>
                            {sellerProposals.map(seller =>
                              seller.variants.map(variant => (
                                <th
                                  key={variant.id}
                                  className="sticky top-[38px] z-20 text-center font-medium text-slate-700 bg-slate-50/80 border-r border-b border-slate-100 py-1 px-3 text-xs min-w-[180px]"
                                >
                                  <div className="flex items-center justify-center gap-1.5 py-0.5">
                                    <span className="font-medium text-slate-700 text-xs">{variant.colLabel}</span>
                                  </div>
                                </th>
                              )),
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {rowsDefinition.map((row, rowIndex) => {
                            const rowBg = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
                            return (
                              <tr key={row.key} className={rowBg}>
                                <th className={`sticky left-0 z-10 ${rowBg} border-r border-b border-slate-100 px-3 py-2 text-left font-medium text-slate-700 text-xs min-w-[220px]`}>
                                  {row.attributeName}
                                </th>

                                {allCombinedVariants.map(variant => (
                                  <td key={variant.colKey} className="border-r border-b border-slate-100 text-xs px-3 py-2 min-w-[180px]">
                                    {row.getValue(variant)}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert
                      type="info"
                      showIcon
                      message="No Deviation Accepted Quotes Available"
                      description="There are currently no quotes with deviation accepted status for this line item."
                      className="my-3 border-sky-100 bg-sky-50/40 text-slate-600"
                    />
                  )}
                </div>
              )}

              {currentCardStep === 1 && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <TrophyOutlined className="text-amber-500 text-sm" />
                      <h4 className="text-xs font-semibold text-slate-700 tracking-wide m-0">Quote-Wise Item Allocation Details</h4>
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                        {sellerQuoteAllocations.length} Allocated Quote(s)
                      </span>
                    </div>
                  </div>

                  {sellerQuoteAllocations.length > 0 ? (
                    <div className="space-y-3">
                      {sellerQuoteAllocations.map(sellerQuoteAllocation => (
                        <div key={sellerQuoteAllocation.sellerPartyId} className="border border-slate-200/70 rounded-xl overflow-hidden bg-white shadow-xs">
                          <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShopOutlined className="text-indigo-500" />
                              <span className="font-semibold text-slate-800 text-xs">{sellerQuoteAllocation.sellerName}</span>
                              <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">{sellerQuoteAllocation.quoteNumber}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50/70 text-slate-700 m-0">
                                Round-{sellerQuoteAllocation.awardRound}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-500">
                                Allocated Qty:{" "}
                                <strong className="text-slate-800 font-semibold">
                                  {sellerQuoteAllocation.totalQty} {item?.req_unit || "PCS"}
                                </strong>
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-500">
                                Supplier Total: <strong className="text-emerald-600 font-semibold">{formatCurrency(sellerQuoteAllocation.totalValue)}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] table-fixed text-xs text-left bg-white border-collapse">
                              <colgroup>
                                <col className="w-3/6" />
                                <col className="w-1/6" />
                                <col className="w-1/6" />
                                <col className="w-1/6" />
                              </colgroup>
                              {/* <thead className="bg-slate-50/40 text-slate-600 font-medium border-b border-slate-100">
                                <tr>
                                  <th className="py-1.5 px-3 border-r border-slate-100">Variant Option</th>
                                  <th className="py-1.5 px-3 border-r border-slate-100 text-right">Unit Price</th>
                                  <th className="py-1.5 px-3 border-r border-slate-100 text-right">Awarded Qty</th>
                                  <th className="py-1.5 px-3 border-r border-slate-100 text-right">Subtotal</th>
                                </tr>
                              </thead> */}
                              <tbody className="divide-y divide-slate-100">
                                {sellerQuoteAllocation.items.map((allocItem: any) => (
                                  <tr key={allocItem.allocation.variant_id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="py-1.5 px-3 border-r border-slate-100">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-slate-700 text-xs truncate" title={allocItem.variantLabel}>
                                          {allocItem.variantLabel}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-3 border-r border-slate-100 text-right font-mono font-medium text-slate-700">{formatCurrency(allocItem.unitPrice)}</td>
                                    <td className="py-1.5 px-3 border-r border-slate-100 text-right">
                                      {sellerQuoteAllocation.isPendingSeller ? (
                                        <div className="flex items-center justify-end gap-1.5">
                                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70 text-xs">
                                            {allocItem.awardedQty} {item.req_unit || "PCS"}
                                          </span>
                                          <Tooltip title={`Award allocation sent (Round ${sellerQuoteAllocation.awardRound}) — awaiting supplier response`}>
                                            <LockOutlined className="text-slate-400 text-xs" />
                                          </Tooltip>
                                        </div>
                                      ) : sellerQuoteAllocation.isConfirmed ? (
                                        <div className="flex items-center justify-end gap-1.5">
                                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                                            ✓ {allocItem.awardedQty} {item.req_unit || "PCS"}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-end gap-0.5">
                                          <div className="flex items-center justify-end gap-1">
                                            <InputNumber
                                              min={0}
                                              step={1}
                                              value={allocItem.awardedQty}
                                              onChange={val => {
                                                handleQtyChange(
                                                  item.id,
                                                  allocItem.variant || allocItem.allocation.variant_id,
                                                  allocItem.allocation.seller_party_id,
                                                  allocItem.allocation.seller_quote_id,
                                                  val,
                                                  allCombinedVariants,
                                                  item.req_unit,
                                                );
                                              }}
                                              size="small"
                                              className={`!w-24 text-[11px] !h-7 font-mono font-medium ${sellerQuoteAllocation.isSellerRevised ? "border-amber-400 bg-amber-50/40" : "border-slate-200/70"
                                                }`}
                                              placeholder="Qty"
                                            />
                                          </div>
                                          {sellerQuoteAllocation.isSellerRevised && allocItem.sellerOfferedQty !== undefined && (
                                            <span className="text-[10px] text-amber-700 font-medium">
                                              Offered: {allocItem.sellerOfferedQty} {item.req_unit || "PCS"}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-3 border-r border-slate-100 text-right font-mono font-semibold text-emerald-600">{formatCurrency(allocItem.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {(() => {
                            const notes = (awardRevisionNotes || [])
                              .filter(n => n.rfq_item_id === item.id && n.seller_party_id === sellerQuoteAllocation.sellerPartyId)
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                            const latestNote = notes[0];
                            if (!latestNote) return null;
                            const isSellerNote = latestNote.actor_type === "SELLER";
                            return (
                              <div className={`px-3 py-2 border-t border-slate-100 flex items-start gap-2 text-xs ${isSellerNote ? "bg-indigo-50/50" : "bg-amber-50/40"}`}>
                                <FileTextOutlined className={isSellerNote ? "text-indigo-600 mt-0.5" : "text-amber-600 mt-0.5"} />
                                <div>
                                  <span className={`font-semibold ${isSellerNote ? "text-indigo-900" : "text-amber-900"}`}>
                                    {isSellerNote ? "Supplier Response Note" : "Revision Request Note"} (Round {latestNote.award_round}):
                                  </span>
                                  <span className="text-slate-700 italic ml-1">&ldquo;{latestNote.note}&rdquo;</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Combined Status & Action Footer Bar */}
                          <div
                            className={`px-3 py-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${sellerQuoteAllocation.isSellerRevised
                              ? "bg-amber-50/90 border-amber-200 text-amber-950"
                              : sellerQuoteAllocation.isPendingSeller
                                ? "bg-blue-50/80 border-blue-100 text-blue-900"
                                : sellerQuoteAllocation.isConfirmed
                                  ? "bg-emerald-50/80 border-emerald-100 text-emerald-900"
                                  : "bg-slate-50/60 border-slate-100 text-slate-600"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {sellerQuoteAllocation.isPendingSeller && (
                                <div className="flex items-center gap-1.5 font-medium text-blue-900">
                                  <ClockCircleOutlined className="text-blue-500" />
                                  <span>Award Allocation Sent (Round {sellerQuoteAllocation.awardRound}) — Awaiting Supplier to Confirm or Revise</span>
                                </div>
                              )}

                              {sellerQuoteAllocation.isSellerRevised && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                    <ExclamationCircleOutlined className="text-amber-600" />
                                    <span>Supplier Proposed Award Revision (Round {sellerQuoteAllocation.awardRound})</span>
                                  </div>
                                  <AntTag color="orange" className="font-bold text-[10px] m-0">
                                    Action Required
                                  </AntTag>
                                </div>
                              )}

                              {sellerQuoteAllocation.isConfirmed && (
                                <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                                  <CheckCircleOutlined className="text-emerald-600" />
                                  <span>Award Allocation Confirmed by Supplier (Round {sellerQuoteAllocation.awardRound}) — Finalized for Purchase Order</span>
                                </div>
                              )}

                              {sellerQuoteAllocation.isDraft && <span className="text-slate-500 text-[11px]">Select allocated quantities and send award allocation to this seller.</span>}
                            </div>

                            <div>
                              {sellerQuoteAllocation.isSellerRevised ? (
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<SendOutlined className="text-white" />}
                                  onClick={() => handleOpenAwardRevisionModal(item, sellerQuoteAllocation)}
                                  className="text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-xs"
                                >
                                  Send Revised Award (Round {(sellerQuoteAllocation.awardRound || 1) + 1})
                                </Button>
                              ) : sellerQuoteAllocation.isPendingSeller ? (
                                <Button size="small" disabled className="text-xs font-medium text-slate-400 border-slate-200 bg-slate-50">
                                  Awaiting Seller Response
                                </Button>
                              ) : sellerQuoteAllocation.isConfirmed ? (
                                <Button size="small" disabled className="text-xs font-medium text-emerald-700 border-emerald-200 bg-emerald-50/50">
                                  Award Confirmed ✓
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<SendOutlined />}
                                  onClick={() => handleOpenAwardRevisionModal(item, sellerQuoteAllocation)}
                                  className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-xs"
                                >
                                  Send Award Allocation
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert
                      type="info"
                      showIcon
                      message="No Variant Allocations Selected"
                      description="Check the 'Select Option' checkbox and enter quantities in the comparison matrix above to view current selection insights."
                      className="my-1 border-sky-100 bg-sky-50/40 text-slate-600"
                    />
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      <Modal
        open={revisionModalState.visible}
        title={
          <div className="flex items-center gap-2">
            <SendOutlined className="text-indigo-500" />
            <span className="text-slate-800 font-semibold">
              {revisionModalState.sellerQuoteAllocation?.quoteStatus === "SELLER_REVISED" ? "Send Revised Award Allocation" : "Send Award Allocation to Seller"}
            </span>
          </div>
        }
        onCancel={() => {
          if (!submittingRevision) {
            setRevisionModalState({ visible: false, item: null, sellerQuoteAllocation: null });
          }
        }}
        onOk={handleConfirmAwardRevision}
        confirmLoading={submittingRevision}
        okText={`Send Award Allocation (Round ${(revisionModalState.sellerQuoteAllocation?.awardRound || 1) + 1})`}
        okButtonProps={{ className: "bg-indigo-500 hover:bg-indigo-600 text-white font-medium border-0 shadow-xs" }}
      >
        <div className="space-y-3 py-2 text-xs">
          <Alert
            type="info"
            showIcon
            message="Award Allocation Commitment"
            description={
              <span>
                You are issuing an Award Allocation to <strong>{revisionModalState.sellerQuoteAllocation?.sellerName}</strong> for Line Item #{revisionModalState.item?.item_index || 1} (
                <strong>{modalProduct?.name || "Product"}</strong>). This will send the award allocation (<strong>Award Round {(revisionModalState.sellerQuoteAllocation?.awardRound || 1) + 1}</strong>
                ) to the seller to either <strong>Confirm</strong> or submit an <strong>Award Revision</strong>.
              </span>
            }
            className="border-sky-100 bg-sky-50/40 text-slate-600"
          />

          <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
            <div className="flex justify-between font-medium text-slate-600">
              <span>Award Round:</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium border border-purple-200/60 bg-purple-50/70 text-purple-700">
                Round {(revisionModalState.sellerQuoteAllocation?.awardRound || 1) + 1}
              </span>
            </div>
            <div className="flex justify-between font-medium text-slate-600">
              <span>Target Allocated Quantity:</span>
              <span className="font-mono font-semibold text-slate-800">
                {revisionModalState.sellerQuoteAllocation?.totalQty} {revisionModalState.item?.req_unit || "PCS"}
              </span>
            </div>
            <div className="flex justify-between font-medium text-slate-600">
              <span>Estimated Allocation Value:</span>
              <span className="font-mono font-semibold text-emerald-600">{formatCurrency(revisionModalState.sellerQuoteAllocation?.totalValue || 0)}</span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Award Note / Instructions for Seller (Optional):</label>
            <Input.TextArea
              rows={3}
              placeholder="e.g. Awarding 300 PCS based on your proposal specs. Please confirm delivery timeline."
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              className="text-xs border-slate-200/70"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

/*
 * ============================================================================
 * Step 2 Sub-Component: ItemWiseAwardOverviewSummary (Item-Wise Breakdown)
 * ============================================================================
 */
// interface ItemWiseAwardOverviewSummaryProps {
//   rfqItems: RfqItem[];
//   allocations: RfqItemAllocation[];
//   catalogProducts: any[];
//   categories: any[];
//   parties: any[];
//   allQuotes: SellerQuote[];
//   allProposalVariants: SellerQuoteVariant[];
//   allSuggestedVariants: SellerQuoteSuggestedVariant[];
//   quoteAttributes: SellerQuoteAttribute[];
//   allManufacturers: any[];
//   allBrands: any[];
// }

// const ItemWiseAwardOverviewSummary: React.FC<ItemWiseAwardOverviewSummaryProps> = ({
//   rfqItems,
//   allocations,
//   catalogProducts,
//   categories,
//   parties,
//   allQuotes,
//   allProposalVariants,
//   allSuggestedVariants,
//   quoteAttributes,
//   allManufacturers,
//   allBrands,
// }) => {
//   const itemWiseGroups = useMemo(() => {
//     const partiesMap = new Map(parties.map(p => [p.id, p.display_name]));
//     const quotesMap = new Map(allQuotes.map(q => [q.id, q]));

//     const variantsMap = new Map<string, { colLabel: string; manufacturer: string; brand: string }>();
//     let optCount = 1;

//     for (const q of allQuotes) {
//       const customVars = allProposalVariants.filter(v => v.seller_quote_id === q.id);
//       const suggestedVars = allSuggestedVariants.filter(v => v.seller_quote_id === q.id);

//       const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(q.id, quoteAttributes, allManufacturers, allBrands);

//       for (const v of customVars) {
//         const optNum = optCount++;
//         variantsMap.set(v.id, {
//           colLabel: v.sku ? `Option #${optNum} (${v.sku})` : `Option #${optNum} (Custom)`,
//           manufacturer,
//           brand,
//         });
//       }

//       for (const v of suggestedVars) {
//         variantsMap.set(v.id, {
//           colLabel: v.sku ? `Suggested SKU: ${v.sku}` : "Catalog Suggested SKU",
//           manufacturer,
//           brand,
//         });
//       }
//     }

//     return rfqItems.map((item, index) => {
//       const product = catalogProducts.find(p => p.id === item.catalog_product_id);
//       const category = categories.find(c => c.id === item.category_id);

//       const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
//       const itemAllocations = (itemGroup?.allocations || []).filter(a => a.is_selected && a.buyer_target_quantity > 0);

//       const totalAllocatedQty = itemAllocations.reduce((sum, a) => sum + a.buyer_target_quantity, 0);
//       const totalItemValue = itemAllocations.reduce((sum, a) => sum + a.unit_price * a.buyer_target_quantity, 0);
//       const reqQty = item.req_quantity || 1;

//       const allocatedRows = itemAllocations.map(alloc => {
//         const sellerPartyName = partiesMap.get(alloc.seller_party_id) || `Supplier (${alloc.seller_party_id})`;
//         const quote = quotesMap.get(alloc.seller_quote_id);
//         const variantInfo = variantsMap.get(alloc.variant_id);

//         const unitPrice = alloc.unit_price || 0;
//         const awardedQty = alloc.buyer_target_quantity || 0;
//         const subtotal = unitPrice * awardedQty;

//         return {
//           allocation: alloc,
//           sellerName: sellerPartyName,
//           quoteNumber: quote?.seller_quote_number || "Quote Proposal",
//           variantLabel: variantInfo?.colLabel || `Variant (${alloc.variant_type})`,
//           manufacturer: variantInfo?.manufacturer || "N/A",
//           brand: variantInfo?.brand || "N/A",
//           unitPrice,
//           awardedQty,
//           subtotal,
//         };
//       });

//       return {
//         item,
//         itemNumber: item.item_index || index + 1,
//         productName: product?.name || `RFQ Line Item #${index + 1}`,
//         categoryName: category?.name || "Category",
//         reqQty,
//         reqUnit: item.req_unit || "PCS",
//         totalAllocatedQty,
//         totalItemValue,
//         allocatedRows,
//       };
//     });
//   }, [
//     rfqItems,
//     allocations,
//     catalogProducts,
//     categories,
//     parties,
//     allQuotes,
//     allProposalVariants,
//     allSuggestedVariants,
//     quoteAttributes,
//     allManufacturers,
//     allBrands,
//   ]);

//   const grandTotalValue = useMemo(() => itemWiseGroups.reduce((sum, g) => sum + g.totalItemValue, 0), [itemWiseGroups]);
//   const allocatedItemsCount = useMemo(() => itemWiseGroups.filter(g => g.allocatedRows.length > 0).length, [itemWiseGroups]);

//   return (
//     <div className="space-y-4">
//       {/* Header Summary Card */}
//       <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
//         <Descriptions
//           title={
//             <div className="flex items-center justify-between pb-1 border-b border-slate-100">
//               <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
//                 <UnorderedListOutlined className="text-indigo-500" />
//                 Item-Wise Seller Award Allocations Overview
//               </span>
//               <span className="px-2 py-0.5 text-xs font-medium rounded border border-sky-200/60 bg-sky-50/70 text-sky-700">
//                 {allocatedItemsCount} of {rfqItems.length} Line Items Allocated
//               </span>
//             </div>
//           }
//           bordered
//           size="small"
//           column={{ xs: 1, sm: 2, md: 3 }}
//           className="mt-2"
//           classNames={{
//             label: "text-xs p-1 text-slate-500",
//             content: "text-xs p-1",
//           }}
//         >
//           <Descriptions.Item label="Total RFQ Line Items">
//             <span className="font-semibold text-slate-800">{rfqItems.length} Line Items</span>
//           </Descriptions.Item>
//           <Descriptions.Item label="Allocated Line Items">
//             <span className="font-medium text-indigo-600">{allocatedItemsCount} Items</span>
//           </Descriptions.Item>
//           <Descriptions.Item label="Total Awarded Value">
//             <span className="font-semibold text-emerald-600">{formatCurrency(grandTotalValue)}</span>
//           </Descriptions.Item>
//         </Descriptions>
//       </Card>

//       {/* List of RFQ Items with Awarded Seller Variants */}
//       {itemWiseGroups.map(group => (
//         <Card key={group.item.id} size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl overflow-hidden">
//           <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 mb-2 rounded-t-xl">
//             <div className="flex items-center gap-2">
//               <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100/60">
//                 Line Item #{group.itemNumber}
//               </span>
//               <span className="font-semibold text-slate-800 text-xs">{group.productName}</span>
//               <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">{group.categoryName}</span>
//             </div>

//             <div className="flex items-center gap-3 text-xs">
//               <span className="text-slate-500">
//                 Requested Qty:{" "}
//                 <strong className="text-slate-800 font-semibold">
//                   {group.reqQty} {group.reqUnit}
//                 </strong>
//               </span>

//               <span className="text-slate-300">|</span>

//               <span className="text-slate-500">
//                 Allocated:{" "}
//                 <strong className="text-indigo-600 font-semibold">
//                   {group.totalAllocatedQty} / {group.reqQty} {group.reqUnit}
//                 </strong>
//               </span>

//               <span className="text-slate-300">|</span>

//               <span className="text-slate-500">
//                 Item Value: <strong className="text-emerald-600 font-semibold">{formatCurrency(group.totalItemValue)}</strong>
//               </span>

//               {group.totalAllocatedQty === group.reqQty && group.reqQty > 0 ? (
//                 <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">✓ 100% Allocated</span>
//               ) : group.totalAllocatedQty > group.reqQty ? (
//                 <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-rose-200/60 bg-rose-50/70 text-rose-700 m-0">
//                   ⚠ Over Allocated
//                 </span>
//               ) : group.totalAllocatedQty > 0 ? (
//                 <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-amber-200/60 bg-amber-50/70 text-amber-700 m-0">
//                   Partially Allocated
//                 </span>
//               ) : (
//                 <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50 text-slate-500 m-0">Unallocated</span>
//               )}
//             </div>
//           </div>

//           {group.allocatedRows.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="w-full text-xs text-left border-collapse border border-slate-100">
//                 <thead className="bg-slate-50/40 text-slate-600 font-medium border-b border-slate-100">
//                   <tr>
//                     <th className="p-2 border-r border-slate-100">Supplier Name & Quote #</th>
//                     <th className="p-2 border-r border-slate-100">Awarded Variant Option</th>
//                     <th className="p-2 border-r border-slate-100">Manufacturer / Brand</th>
//                     <th className="p-2 border-r border-slate-100 text-right">Unit Price</th>
//                     <th className="p-2 border-r border-slate-100 text-right">Awarded Quantity</th>
//                     <th className="p-2 text-right">Subtotal</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100 bg-white">
//                   {group.allocatedRows.map(row => (
//                     <tr key={row.allocation.variant_id} className="hover:bg-slate-50/30 transition-colors">
//                       <td className="p-2 border-r border-slate-100">
//                         <div className="flex items-center gap-1.5">
//                           <ShopOutlined className="text-indigo-500" />
//                           <span className="font-medium text-slate-800">{row.sellerName}</span>
//                           <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200/60">
//                             {row.quoteNumber}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="p-2 border-r border-slate-100">
//                         <div className="flex items-center gap-1.5">
//                           <span className="font-medium text-slate-700">{row.variantLabel}</span>
//                         </div>
//                       </td>
//                       <td className="p-2 border-r border-slate-100">
//                         <div className="flex items-center gap-1">
//                           <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200/60 bg-purple-50/60 text-purple-700 m-0">
//                             {row.manufacturer}
//                           </span>
//                           <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/60 text-sky-700 m-0">
//                             {row.brand}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">{formatCurrency(row.unitPrice)}</td>
//                       <td className="p-2 border-r border-slate-100 text-right font-medium text-slate-800">
//                         {row.awardedQty} {group.reqUnit}
//                       </td>
//                       <td className="p-2 text-right font-mono font-semibold text-emerald-600">{formatCurrency(row.subtotal)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <Alert
//               type="info"
//               showIcon
//               message="No Variant Allocations for this Line Item"
//               description="No seller variants have been selected for award on this line item yet."
//               className="my-1 border-sky-100 bg-sky-50/40 text-slate-600"
//             />
//           )}
//         </Card>
//       ))}
//     </div>
//   );
// };

/*
 * ============================================================================
 * Step 3 Sub-Component: SellerWiseAwardOverviewSummary (Supplier-Wise Summary)
 * ============================================================================
 */
// interface SellerWiseAwardOverviewSummaryProps {
//   rfqId?: string;
//   rfq: any;
//   currentProcessHeader?: RfqQuoteAward;
//   isFinalized: boolean;
//   allocations: RfqItemAllocation[];
//   existingAwardItems: RfqQuoteItemAward[];
//   existingPurchaseOrders: PurchaseOrder[];
//   existingPoAcknowledgements: PoAcknowledgement[];
//   parties: any[];
//   allQuotes: SellerQuote[];
//   rfqItems: RfqItem[];
//   catalogProducts: any[];
//   categories: any[];
//   allProposalVariants: SellerQuoteVariant[];
//   allSuggestedVariants: SellerQuoteSuggestedVariant[];
//   quoteAttributes: SellerQuoteAttribute[];
//   allManufacturers: any[];
//   allBrands: any[];
// }

// const SellerWiseAwardOverviewSummary: React.FC<SellerWiseAwardOverviewSummaryProps> = ({
//   rfqId,
//   rfq,
//   currentProcessHeader,
//   isFinalized,
//   allocations,
//   existingAwardItems,
//   existingPurchaseOrders,
//   existingPoAcknowledgements,
//   parties,
//   allQuotes,
//   rfqItems,
//   catalogProducts,
//   categories,
//   allProposalVariants,
//   allSuggestedVariants,
//   quoteAttributes,
//   allManufacturers,
//   allBrands,
// }) => {
//   const allCombinedVariants = useMemo<FlattenedVariant[]>(() => {
//     const customMap = new Map<string, typeof allProposalVariants>();
//     allProposalVariants.forEach(v => {
//       const list = customMap.get(v.seller_quote_id) || [];
//       list.push(v);
//       customMap.set(v.seller_quote_id, list);
//     });

//     const suggestedMap = new Map<string, typeof allSuggestedVariants>();
//     allSuggestedVariants.forEach(v => {
//       const list = suggestedMap.get(v.seller_quote_id) || [];
//       list.push(v);
//       suggestedMap.set(v.seller_quote_id, list);
//     });

//     const partiesMap = new Map(parties.map(p => [p.id, p.display_name]));

//     const result: FlattenedVariant[] = [];
//     let optionCounter = 1;

//     for (const quote of allQuotes) {
//       const sellerName = partiesMap.get(quote.seller_party_id) ?? `Supplier (${quote.seller_party_id})`;
//       const customVars = customMap.get(quote.id) || [];
//       const suggestedVars = suggestedMap.get(quote.id) || [];

//       const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(quote.id, quoteAttributes, allManufacturers, allBrands);

//       for (const variant of customVars) {
//         const offerPrice = variant.offer_price ?? 0;
//         const optNum = optionCounter++;
//         result.push({
//           id: variant.id,
//           colKey: `col_${variant.id}`,
//           colLabel: variant.sku ? `Option #${optNum} (${variant.sku})` : `Option #${optNum} (Custom)`,
//           type: "New proposal option",
//           offerPrice,
//           offerQuantity: quote.offer_quantity ?? 1,
//           unit: quote.offer_unit ?? "PCS",
//           totalPrice: offerPrice * (quote.offer_quantity ?? 1),
//           manufacturer,
//           brand,
//           sellerName,
//           sellerPartyId: quote.seller_party_id,
//           quoteId: quote.id,
//           quoteNumber: quote.seller_quote_number,
//           quoteStatus: quote.status,
//         });
//       }

//       for (const variant of suggestedVars) {
//         const offerPrice = variant.offer_price ?? variant.list_price ?? 0;
//         result.push({
//           id: variant.id,
//           colKey: `col_${variant.id}`,
//           colLabel: variant.sku ? `Suggested SKU: ${variant.sku}` : "Catalog Suggested SKU",
//           type: "Catalog Suggested SKU",
//           offerPrice,
//           offerQuantity: quote.offer_quantity ?? 1,
//           unit: quote.offer_unit ?? "PCS",
//           totalPrice: offerPrice * (quote.offer_quantity ?? 1),
//           manufacturer,
//           brand,
//           sellerName,
//           sellerPartyId: quote.seller_party_id,
//           quoteId: quote.id,
//           quoteNumber: quote.seller_quote_number,
//           quoteStatus: quote.status,
//         });
//       }
//     }
//     return result;
//   }, [allQuotes, allProposalVariants, allSuggestedVariants, quoteAttributes, parties, allManufacturers, allBrands]);

//   const rfqAwardSummaryBySeller = useMemo(() => {
//     if (!rfqId) return [];

//     const activeAllocations = allocations.flatMap(itemGroup => itemGroup.allocations).filter(a => a.is_selected && a.buyer_target_quantity > 0);

//     const sellerGroupsMap = new Map<
//       string,
//       {
//         sellerPartyId: string;
//         sellerName: string;
//         quoteId: string;
//         quoteNumber: string;
//         purchaseOrder?: PurchaseOrder;
//         poAcknowledgement?: PoAcknowledgement;
//         totalAmount: number;
//         items: Array<{
//           rfqItemId: string;
//           itemIndex: number;
//           productName: string;
//           categoryName: string;
//           variantId: string;
//           variantLabel: string;
//           manufacturer: string;
//           brand: string;
//           unitPrice: number;
//           awardedQuantity: number;
//           totalPrice: number;
//           unitOfMeasure: string;
//         }>;
//       }
//     >();

//     if (existingAwardItems.length > 0) {
//       existingAwardItems.forEach(item => {
//         const sellerParty = parties.find(p => p.id === item.seller_party_id);
//         const quote = allQuotes.find(q => q.id === item.seller_quote_id);
//         const po = existingPurchaseOrders.find(p => p.id === item.purchase_order_id || p.seller_party_id === item.seller_party_id);
//         const ack = po ? existingPoAcknowledgements.find(a => a.purchase_order_id === po.id) : undefined;

//         const rfqItem = rfqItems.find(i => i.id === item.rfq_item_id);
//         const product = catalogProducts.find(p => p.id === rfqItem?.catalog_product_id);
//         const category = categories.find(c => c.id === rfqItem?.category_id);
//         const variant = allCombinedVariants.find(v => v.id === item.variant_id);

//         if (!sellerGroupsMap.has(item.seller_party_id)) {
//           sellerGroupsMap.set(item.seller_party_id, {
//             sellerPartyId: item.seller_party_id,
//             sellerName: sellerParty?.display_name || `Supplier (${item.seller_party_id})`,
//             quoteId: item.seller_quote_id,
//             quoteNumber: quote?.seller_quote_number || "Quote Proposal",
//             purchaseOrder: po,
//             poAcknowledgement: ack,
//             totalAmount: 0,
//             items: [],
//           });
//         }

//         const group = sellerGroupsMap.get(item.seller_party_id)!;
//         group.totalAmount += item.total_price || item.unit_price * item.buyer_target_quantity;

//         group.items.push({
//           rfqItemId: item.rfq_item_id,
//           itemIndex: rfqItem?.item_index || 1,
//           productName: product?.name || `RFQ Line Item #${rfqItem?.item_index || 1}`,
//           categoryName: category?.name || "Category",
//           variantId: item.variant_id,
//           variantLabel: variant?.colLabel || `Variant (${item.variant_type})`,
//           manufacturer: variant?.manufacturer || "N/A",
//           brand: variant?.brand || "N/A",
//           unitPrice: item.unit_price,
//           awardedQuantity: item.buyer_target_quantity,
//           totalPrice: item.total_price || item.unit_price * item.buyer_target_quantity,
//           unitOfMeasure: "PCS",
//         });
//       });
//     } else {
//       activeAllocations.forEach(alloc => {
//         const sellerParty = parties.find(p => p.id === alloc.seller_party_id);
//         const quote = allQuotes.find(q => q.id === alloc.seller_quote_id);
//         const rfqItem = rfqItems.find(i => i.id === alloc.rfq_item_id);
//         const product = catalogProducts.find(p => p.id === rfqItem?.catalog_product_id);
//         const category = categories.find(c => c.id === rfqItem?.category_id);
//         const variant = allCombinedVariants.find(v => v.id === alloc.variant_id);

//         if (!sellerGroupsMap.has(alloc.seller_party_id)) {
//           sellerGroupsMap.set(alloc.seller_party_id, {
//             sellerPartyId: alloc.seller_party_id,
//             sellerName: sellerParty?.display_name || `Supplier (${alloc.seller_party_id})`,
//             quoteId: alloc.seller_quote_id,
//             quoteNumber: quote?.seller_quote_number || "Quote Proposal",
//             totalAmount: 0,
//             items: [],
//           });
//         }

//         const group = sellerGroupsMap.get(alloc.seller_party_id)!;
//         const itemTotal = alloc.unit_price * alloc.buyer_target_quantity;
//         group.totalAmount += itemTotal;

//         group.items.push({
//           rfqItemId: alloc.rfq_item_id,
//           itemIndex: rfqItem?.item_index || 1,
//           productName: product?.name || `RFQ Line Item #${rfqItem?.item_index || 1}`,
//           categoryName: category?.name || "Category",
//           variantId: alloc.variant_id,
//           variantLabel: variant?.colLabel || `Variant (${alloc.variant_type})`,
//           manufacturer: variant?.manufacturer || "N/A",
//           brand: variant?.brand || "N/A",
//           unitPrice: alloc.unit_price,
//           awardedQuantity: alloc.buyer_target_quantity,
//           totalPrice: itemTotal,
//           unitOfMeasure: alloc.unit_of_measure || "PCS",
//         });
//       });
//     }

//     return Array.from(sellerGroupsMap.values());
//   }, [
//     rfqId,
//     existingAwardItems,
//     allocations,
//     existingPurchaseOrders,
//     existingPoAcknowledgements,
//     parties,
//     allQuotes,
//     rfqItems,
//     catalogProducts,
//     categories,
//     allCombinedVariants,
//   ]);

//   return (
//     <div className="space-y-4">
//       {/* Header Award Summary Card */}
//       <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
//         <Descriptions
//           title={
//             <div className="flex items-center justify-between pb-1 border-b border-slate-100">
//               <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
//                 <TrophyOutlined className="text-amber-500/80" />
//                 Final Sourcing Contract Award Summary (Supplier-Wise Preview)
//               </span>
//               <span
//                 className={`px-2 py-0.5 text-xs font-semibold rounded border ${isFinalized ? "border-emerald-200/60 bg-emerald-50/70 text-emerald-700" : "border-sky-200/60 bg-sky-50/70 text-sky-700"}`}
//               >
//                 {currentProcessHeader?.award_status || (rfqAwardSummaryBySeller.length > 0 ? "DRAFT ALLOCATION" : "NO AWARDS")}
//               </span>
//             </div>
//           }
//           bordered
//           size="small"
//           column={{ xs: 1, sm: 2, md: 4 }}
//           className="mt-2 text-xs"
//           classNames={{
//             label: "text-xs p-1 text-slate-500",
//             content: "text-xs p-1",
//           }}
//         >
//           <Descriptions.Item label="RFQ Number">
//             <span className="font-mono font-semibold text-slate-800">{rfq?.rfq_number}</span>
//           </Descriptions.Item>
//           <Descriptions.Item label="Total Contract Award Value">
//             <span className="font-semibold text-emerald-600">
//               {formatCurrency(currentProcessHeader?.total_awarded_amount || rfqAwardSummaryBySeller.reduce((s, g) => s + g.totalAmount, 0))}
//             </span>
//           </Descriptions.Item>
//           <Descriptions.Item label="Awarded Suppliers Count">
//             <span className="font-medium text-slate-800">{rfqAwardSummaryBySeller.length} Supplier(s)</span>
//           </Descriptions.Item>
//           <Descriptions.Item label="Generated Purchase Orders">
//             <span className="font-medium text-slate-800">{existingPurchaseOrders.length} PO(s)</span>
//           </Descriptions.Item>
//         </Descriptions>
//       </Card>

//       {rfqAwardSummaryBySeller.length > 0 ? (
//         <div className="space-y-4">
//           {rfqAwardSummaryBySeller.map(sellerGroup => (
//             <Card key={sellerGroup.sellerPartyId} size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl overflow-hidden">
//               {/* Seller Header */}
//               <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 mb-2 rounded-t-xl">
//                 <div className="flex items-center gap-2">
//                   <ShopOutlined className="text-indigo-500 text-sm" />
//                   <span className="font-semibold text-slate-800 text-xs">{sellerGroup.sellerName}</span>
//                   <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
//                     {sellerGroup.quoteNumber}
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-3 text-xs">
//                   {sellerGroup.purchaseOrder && (
//                     <span className="font-mono font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100/60">
//                       {sellerGroup.purchaseOrder.po_number}
//                     </span>
//                   )}

//                   {sellerGroup.poAcknowledgement?.buyer_confirmed ? (
//                     <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/60 bg-emerald-50/70 text-emerald-700 m-0">
//                       PO Released ✓
//                     </span>
//                   ) : (
//                     <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-amber-200/60 bg-amber-50/70 text-amber-700 m-0">
//                       PO Pending Release
//                     </span>
//                   )}

//                   {sellerGroup.poAcknowledgement?.seller_acknowledged ? (
//                     <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/60 bg-emerald-50/70 text-emerald-700 m-0">
//                       Seller Acknowledged ✓
//                     </span>
//                   ) : (
//                     <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-purple-200/60 bg-purple-50/70 text-purple-700 m-0">
//                       Awaiting Confirmation...
//                     </span>
//                   )}

//                   <span className="text-slate-300">|</span>
//                   <span className="text-slate-500">
//                     Contract Total: <strong className="text-emerald-600 font-semibold">{formatCurrency(sellerGroup.totalAmount)}</strong>
//                   </span>
//                 </div>
//               </div>

//               {/* Awarded Items Table for this Seller */}
//               <div className="overflow-x-auto">
//                 <table className="w-full text-xs text-left border-collapse border border-slate-100">
//                   <thead className="bg-slate-50/40 text-slate-600 font-medium border-b border-slate-100">
//                     <tr>
//                       <th className="p-2 border-r border-slate-100">Line Item # & Product</th>
//                       <th className="p-2 border-r border-slate-100">Category</th>
//                       <th className="p-2 border-r border-slate-100">Awarded Variant Option</th>
//                       <th className="p-2 border-r border-slate-100">Manufacturer / Brand</th>
//                       <th className="p-2 border-r border-slate-100 text-right">Unit Price</th>
//                       <th className="p-2 border-r border-slate-100 text-right">Awarded Quantity</th>
//                       <th className="p-2 text-right">Line Item Subtotal</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100 bg-white">
//                     {sellerGroup.items.map(item => (
//                       <tr key={`${item.rfqItemId}-${item.variantId}`} className="hover:bg-slate-50/30 transition-colors">
//                         <td className="p-2 border-r border-slate-100">
//                           <div className="font-medium text-slate-800">
//                             Line Item #{item.itemIndex}: {item.productName}
//                           </div>
//                         </td>
//                         <td className="p-2 border-r border-slate-100">
//                           <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
//                             {item.categoryName}
//                           </span>
//                         </td>
//                         <td className="p-2 border-r border-slate-100">
//                           <div className="flex items-center gap-1.5">
//                             <span className="font-medium text-slate-700">{item.variantLabel}</span>
//                           </div>
//                         </td>
//                         <td className="p-2 border-r border-slate-100">
//                           <div className="flex items-center gap-1">
//                             <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200/60 bg-purple-50/60 text-purple-700 m-0">
//                               {item.manufacturer}
//                             </span>
//                             <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/60 text-sky-700 m-0">
//                               {item.brand}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">{formatCurrency(item.unitPrice)}</td>
//                         <td className="p-2 border-r border-slate-100 text-right font-medium text-slate-800">
//                           {item.awardedQuantity} {item.unitOfMeasure}
//                         </td>
//                         <td className="p-2 text-right font-mono font-semibold text-emerald-600">{formatCurrency(item.totalPrice)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Alert
//           type="info"
//           showIcon
//           message="No RFQ Contract Awards to Preview"
//           description="Switch to Step 1 (Award Line Item Variants) above to allocate award quantities across line items and save draft or finalize contract awards."
//           className="border-sky-100 bg-sky-50/40 text-slate-600"
//         />
//       )}
//     </div>
//   );
// };
