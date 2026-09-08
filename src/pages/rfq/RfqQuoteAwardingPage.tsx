import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Alert, Button, Card, Steps, Tag as AntTag, InputNumber, message, notification, Tooltip, Descriptions, Checkbox, Modal, Input } from "antd";
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
} from "@ant-design/icons";

import {
  rfqDb,
  type RfqItem,
  type RfqQuoteAward,
  type RfqQuoteVariantAward,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PoAcknowledgement,
  type SellerQuote,
  type SellerQuoteVariant,
  type SellerQuoteSuggestedVariant,
  type SellerQuoteAttribute,
  type RfqAwardRevisionNote,
  type AwardRevisionHistory,
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
  quoteNumber: string;
  quoteStatus: string;
};

export type AwardAllocation = {
  rfq_item_id: string;
  seller_party_id: string;
  seller_quote_id: string;
  variant_id: string;
  variant_col_key: string;
  variant_type: "CUSTOM" | "SUGGESTED";
  unit_price: number;
  awarded_quantity: number;
  unit_of_measure: string;
  seller_accepted?: boolean;
  is_selected?: boolean;
};

export type RfqItemAllocation = {
  rfq_item_id: string;
  allocations: AwardAllocation[];
};

const formatCurrency = (value: number): string => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const extractMfgBrandFromQuoteAttrs = (
  quoteId: string,
  quoteAttributes: SellerQuoteAttribute[],
  allManufacturers: any[],
  allBrands: any[],
): { manufacturer: string; brand: string } => {
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
      rfqDb.rfq_quote_variant_awards.where("rfq_id").equals(rfqId).toArray(),
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

  /*
   * Seed Allocations State from DB
   */
  // useEffect(() => {
  //   const currentHeader = existingQuoteAwards[0];
  //   if (currentHeader?.draft_snapshot) {
  //     try {
  //       const parsed = JSON.parse(currentHeader.draft_snapshot);
  //       setAllocations(prev => ({ ...parsed, ...prev }));
  //       return;
  //     } catch (err) {
  //       console.error("Failed to parse draft_snapshot", err);
  //     }
  //   }

  //   if (existingQuoteVariantAwards.length > 0) {
  //     const initialMap: Record<string, AwardAllocation> = {};
  //     existingQuoteVariantAwards.forEach(item => {
  //       const key = `${item.rfq_item_id}:${item.variant_id}`;
  //       initialMap[key] = {
  //         rfq_item_id: item.rfq_item_id,
  //         seller_party_id: item.seller_party_id,
  //         seller_quote_id: item.seller_quote_id,
  //         variant_id: item.variant_id,
  //         variant_col_key: `col_${item.variant_id}`,
  //         variant_type: item.variant_type,
  //         unit_price: item.unit_price,
  //         awarded_quantity: item.awarded_quantity,
  //         unit_of_measure: item.unit_of_measure || "PCS",
  //         seller_accepted: item.seller_accepted,
  //         is_selected: item.awarded_quantity > 0 || true,
  //       };
  useEffect(() => {
    if (rfqItems && rfqItems.length > 0) {
      setAllocations(prev => {
        const existingMap = new Map(prev.map(p => [p.rfq_item_id, p.allocations]));
        return rfqItems.map(item => ({
          rfq_item_id: item.id,
          allocations: existingMap.get(item.id) || [],
        }));
      });
    }
  }, [rfqItems]);

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

  // const handleFinalizeAndGeneratePOs = async () => {
  //   if (!rfqId) return;
  //
  //   for (const item of rfqItems) {
  //     const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
  //     const itemAllocated = (itemGroup?.allocations || [])
  //       .filter(a => a.is_selected)
  //       .reduce((sum, a) => sum + (a.awarded_quantity || 0), 0);
  //     if (itemAllocated > item.req_quantity) {
  //       message.error(`Line item #${item.item_index || 1} is over-allocated (${itemAllocated}/${item.req_quantity}). Please adjust before finalizing.`);
  //       return;
  //     }
  //   }
  //
  //   const activeAllocations = allocations.flatMap(itemGroup => itemGroup.allocations).filter(a => a.is_selected && a.awarded_quantity > 0);
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
    <div className="max-w-7xl mx-auto space-y-4 pb-8">
      {/* 1. Guided Stepper Header */}
      <AwardingWorkspaceHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      // onFinalize={handleFinalizeAndGeneratePOs}
      />

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

interface AwardingWorkspaceHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // onFinalize: () => void;
}

const AwardingWorkspaceHeader: React.FC<AwardingWorkspaceHeaderProps> = ({
  viewMode,
  onViewModeChange,
  // onFinalize,
}) => {
  const currentStep = viewMode === "matrix" ? 0 : viewMode === "item_summary" ? 1 : 2;

  return (
    <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800 tracking-tight m-0">RFQ Quotes Awarding</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Item-Seller Award Revision & PO Generation: Evaluate proposals, negotiate item-wise seller allocations with revision rounds, and release Purchase
            Orders.
          </p>
        </div>

        {/* <div className="flex items-center gap-2.5">
          {viewMode === "summary" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={onFinalize}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium shadow-xs border-0"
            >
              Finalize & Generate POs
            </Button>
          )}

          <span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60">RFQ: {rfqNumber}</span>
        </div> */}
      </div>

      {/* 3-Step Stepper Navigation Bar */}
      <div className="pt-3">
        <Steps
          current={currentStep}
          onChange={step => onViewModeChange(step === 0 ? "matrix" : step === 1 ? "item_summary" : "summary")}
          size="small"
          items={[
            {
              title: <span className="font-bold text-xs">Award Line Item Variants</span>,
              description: <span className="text-[11px] text-slate-500">Evaluate proposals & allocate per product</span>,
              // icon: <TableOutlined />,
            },
            // {
            //   title: <span className="font-bold text-xs">Step 2: Item-Wise Allocations</span>,
            //   description: <span className="text-[11px] text-slate-500">Review awarded seller variants item by item</span>,
            //   icon: <UnorderedListOutlined />,
            // },
            {
              title: <span className="font-bold text-xs">Supplier Award Overview & POs</span>,
              description: <span className="text-[11px] text-slate-500">Review supplier totals & release Purchase Orders</span>,
              // icon: <TrophyOutlined />,
            },
          ]}
        />
      </div>
    </Card>
  );
};

interface MatrixComparisonSectionProps {
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
  awardRevisionNotes?: RfqAwardRevisionNote[];
  activePartyId?: string;
  currentUserId?: string;
}

const QuoteRevisionSection: React.FC<MatrixComparisonSectionProps> = ({
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
  awardRevisionNotes,
  activePartyId,
  currentUserId,
}) => {
  return (
    <div className="space-y-6">
      {rfqItems.map((item, itemIdx) => (
        <SingleItemMatrixComparisonCard
          key={itemIdx}
          item={item}
          itemIndex={item.item_index || itemIdx + 1}
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
          awardRevisionNotes={awardRevisionNotes}
          activePartyId={activePartyId}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

interface SingleItemMatrixComparisonCardProps {
  item: RfqItem;
  itemIndex: number;
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
  awardRevisionNotes?: RfqAwardRevisionNote[];
  activePartyId?: string;
  currentUserId?: string;
}

const SingleItemMatrixComparisonCard: React.FC<SingleItemMatrixComparisonCardProps> = ({
  item,
  itemIndex,
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
  awardRevisionNotes = [],
  activePartyId,
  currentUserId,
}) => {
  const [cardStep, setCardStep] = useState<0 | 1>(0);
  const hasAutoSetInitialStep = React.useRef(false);

  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [selectedSellerForRevision, setSelectedSellerForRevision] = useState<any>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const product = useMemo(() => catalogProducts.find(p => p.id === item.catalog_product_id), [catalogProducts, item.catalog_product_id]);
  const category = useMemo(() => categories.find(c => c.id === item.category_id), [categories, item.category_id]);

  const hasExistingAwardRevision = useMemo(() => {
    const itemQuotes = allQuotes.filter(q => q.rfq_item_id === item.id);
    const hasRevisionQuote = itemQuotes.some(q => (q.award_round !== undefined && q.award_round > 1) || q.status === "REVISION_REQUIRED");
    const itemAllocations = allocations.find(a => a.rfq_item_id === item.id)?.allocations || [];
    const hasAllocations = itemAllocations.some(a => a.is_selected && a.awarded_quantity > 0);
    return hasRevisionQuote || hasAllocations;
  }, [allQuotes, item.id, allocations]);

  const { sellerProposals } = useMemo(() => {
    const targetQuotes = allQuotes.filter(q => q.rfq_item_id === item.id && q.status === "DEVIATION_ACCEPTED");

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

    const sellerProposalsResult: SellerProposal[] = [];
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

      sellerProposalsResult.push({
        sellerPartyId: quote.seller_party_id,
        sellerName,
        quoteId: quote.id,
        quoteNumber: quote.seller_quote_number,
        quoteStatus: quote.status,
        variants: proposalVariants,
      });
    }

    return { sellerProposals: sellerProposalsResult };
  }, [item, allQuotes, allProposalVariants, allSuggestedVariants, quoteAttributes, parties, allManufacturers, allBrands]);

  const allCombinedVariants = useMemo<FlattenedVariant[]>(
    () =>
      sellerProposals.flatMap(seller =>
        seller.variants.map(variant => ({
          ...variant,
          sellerPartyId: seller.sellerPartyId,
          sellerName: seller.sellerName,
          quoteNumber: seller.quoteNumber,
          quoteStatus: seller.quoteStatus,
        })),
      ),
    [sellerProposals],
  );

  const activeItemInsights = useMemo(() => {
    const totalSellers = sellerProposals.length;
    const totalVariants = allCombinedVariants.length;

    const itemAllocations = (allocations.find(a => a.rfq_item_id === item.id)?.allocations || []).filter(a => a.is_selected && a.awarded_quantity > 0);

    const allocatedSellersCount = new Set(itemAllocations.map(a => a.seller_party_id)).size;
    const allocatedVariantsCount = itemAllocations.length;

    const allocatedQty = itemAllocations.reduce((sum, a) => sum + a.awarded_quantity, 0);
    const reqQty = item.req_quantity || 0;
    const remainingQty = Math.max(0, reqQty - allocatedQty);

    const allocatedTotalPrice = itemAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);

    const lowestPrice = allCombinedVariants.length > 0 ? Math.min(...allCombinedVariants.map(v => v.offerPrice)) : 0;

    return {
      totalSellers,
      totalVariants,
      allocatedSellersCount,
      allocatedVariantsCount,
      allocatedQty,
      reqQty,
      remainingQty,
      allocatedTotalPrice,
      lowestPrice,
    };
  }, [item.id, item.req_quantity, sellerProposals, allCombinedVariants, allocations]);

  const sellerAllocations = useMemo(() => {
    if (!item?.id) return [];
    const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
    const activeAllocations = (itemGroup?.allocations || []).filter(a => a.is_selected);

    if (activeAllocations.length === 0) return [];

    const groupsMap = new Map<
      string,
      {
        sellerPartyId: string;
        sellerName: string;
        sellerQuoteId: string;
        quoteNumber: string;
        awardRound: number;
        quoteStatus: string;
        totalQty: number;
        totalValue: number;
        items: Array<{
          allocation: AwardAllocation;
          variant?: FlattenedVariant;
          variantLabel: string;
          manufacturer: string;
          brand: string;
          unitPrice: number;
          awardedQty: number;
          subtotal: number;
        }>;
      }
    >();

    for (const alloc of activeAllocations) {
      const variant = allCombinedVariants.find(v => v.id === alloc.variant_id);
      const sellerParty = parties.find(p => p.id === alloc.seller_party_id);
      const quote = allQuotes.find(q => q.id === alloc.seller_quote_id);

      const sellerName = sellerParty?.display_name || `Supplier (${alloc.seller_party_id})`;
      const quoteNumber = quote?.seller_quote_number || "Quote Proposal";

      if (!groupsMap.has(alloc.seller_party_id)) {
        groupsMap.set(alloc.seller_party_id, {
          sellerPartyId: alloc.seller_party_id,
          sellerName,
          sellerQuoteId: alloc.seller_quote_id,
          quoteNumber,
          awardRound: 1,
          quoteStatus: quote?.status || "SUBMITTED",
          totalQty: 0,
          totalValue: 0,
          items: [],
        });
      }

      const group = groupsMap.get(alloc.seller_party_id)!;
      const unitPrice = alloc.unit_price || variant?.offerPrice || 0;
      const awardedQty = alloc.awarded_quantity || 0;
      const subtotal = unitPrice * awardedQty;

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
      });
    }

    return Array.from(groupsMap.values());
  }, [item, allocations, allCombinedVariants, parties, allQuotes]);

  const handleToggleVariantSelection = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string, checked: boolean) => {
    setAllocations(prev => {
      return prev.map(group => {
        if (group.rfq_item_id !== item.id) return group;
        const existing = group.allocations.find(a => a.variant_id === variant.id);
        const currentQty = existing?.awarded_quantity || 0;
        const nextQty = checked ? currentQty : 0;

        const updatedAlloc: AwardAllocation = {
          rfq_item_id: item.id,
          seller_party_id: sellerPartyId,
          seller_quote_id: sellerQuoteId,
          variant_id: variant.id,
          variant_col_key: variant.colKey,
          variant_type: variant.type.includes("Custom") ? "CUSTOM" : "SUGGESTED",
          unit_price: variant.offerPrice,
          awarded_quantity: nextQty,
          unit_of_measure: variant.unit || "PCS",
          seller_accepted: false,
          is_selected: checked,
        };

        const newAllocations = existing ? group.allocations.map(a => (a.variant_id === variant.id ? updatedAlloc : a)) : [...group.allocations, updatedAlloc];

        return { ...group, allocations: newAllocations };
      });
    });
  };

  const handleQtyChange = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string, newQty: number | null) => {
    const qty = Math.max(0, newQty || 0);

    setAllocations(prev => {
      return prev.map(group => {
        if (group.rfq_item_id !== item.id) return group;
        const existing = group.allocations.find(a => a.variant_id === variant.id);
        const currentIsSelected = existing?.is_selected;

        const updatedAlloc: AwardAllocation = {
          rfq_item_id: item.id,
          seller_party_id: sellerPartyId,
          seller_quote_id: sellerQuoteId,
          variant_id: variant.id,
          variant_col_key: variant.colKey,
          variant_type: variant.type.includes("Custom") ? "CUSTOM" : "SUGGESTED",
          unit_price: variant.offerPrice,
          awarded_quantity: qty,
          unit_of_measure: variant.unit || "PCS",
          seller_accepted: false,
          is_selected: qty > 0 ? true : (currentIsSelected ?? false),
        };

        const newAllocations = existing ? group.allocations.map(a => (a.variant_id === variant.id ? updatedAlloc : a)) : [...group.allocations, updatedAlloc];

        return { ...group, allocations: newAllocations };
      });
    });
  };

  const rowsDefinition = useMemo(
    () => [
      {
        key: "manufacturer",
        attributeName: "Manufacturer / Brand",
        getValue: (variant: FlattenedVariant) => (
          <div className="flex flex-col gap-1">
            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium border border-slate-200/60 bg-slate-50/60 text-slate-700">
              {variant.manufacturer}
            </span>
            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium border border-slate-200/60 bg-slate-50/60 text-slate-700">
              {variant.brand}
            </span>
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

          return (
            <div className="flex items-center gap-1.5">
              <Checkbox
                checked={isSelected}
                onChange={e => handleToggleVariantSelection(variant, variant.sellerPartyId, variant.quoteNumber, e.target.checked)}
                className="font-medium text-xs"
              >
                {isSelected ? (
                  <span className="text-indigo-600 font-semibold text-xs">Selected</span>
                ) : (
                  <span className="text-slate-400 text-xs">Select Option</span>
                )}
              </Checkbox>
            </div>
          );
        },
      },
    ],
    [allocations, item.id],
  );

  const handleOpenAwardRevisionModal = (sellerGroup: any) => {
    setSelectedSellerForRevision(sellerGroup);
    setRevisionNote("");
    setRevisionModalVisible(true);
  };

  const handleConfirmAwardRevision = async () => {
    if (!selectedSellerForRevision) return;
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

      const existingVariantAwards = await rfqDb.rfq_quote_variant_awards.where("quote_award_id").equals(awardId).toArray();
      const existingVariantMap = new Map(existingVariantAwards.map(v => [v.variant_id, v]));

      const awardPayload: RfqQuoteAward = {
        id: awardId,
        rfq_id: item.rfq_id,
        rfq_item_id: item.id,
        seller_quote_id: selectedSellerForRevision.sellerQuoteId,
        seller_party_id: selectedSellerForRevision.sellerPartyId,
        buyer_party_id: activePartyId || "",
        created_by_user_id: currentUserId,
        award_status: existingAward ? "BUYER_REVISED" : "AWARDED",
        award_round: nextAwardRound,
        total_awarded_amount: selectedSellerForRevision.totalValue,
        total_awarded_quantity: selectedSellerForRevision.totalQty,
        currency: "USD",
        notes: revisionNote.trim() || undefined,
        created_at: existingAward?.created_at || now,
        updated_at: now,
      };

      const variantAwardsPayload: RfqQuoteVariantAward[] = [];
      const historyPayload: AwardRevisionHistory[] = [];

      for (const allocItem of selectedSellerForRevision?.items) {
        const existingQva = existingVariantMap.get(allocItem.allocation.variant_id);
        const qvaId = existingQva?.id || `qva-${crypto.randomUUID()}`;

        variantAwardsPayload.push({
          id: qvaId,
          quote_award_id: awardId,
          rfq_id: item.rfq_id,
          rfq_item_id: item.id,
          seller_quote_id: selectedSellerForRevision.sellerQuoteId,
          seller_party_id: selectedSellerForRevision.sellerPartyId,
          variant_id: allocItem.allocation.variant_id,
          variant_type: allocItem.allocation.variant_type,
          variant_label: allocItem.variantLabel,
          award_round: nextAwardRound,
          buyer_target_quantity: allocItem.awardedQty,
          seller_offered_quantity: allocItem.awardedQty,
          awarded_quantity: allocItem.awardedQty,
          unit_price: allocItem.unitPrice,
          total_price: allocItem.subtotal,
          unit_of_measure: allocItem.allocation.unit_of_measure || item.req_unit || "PCS",
          variant_award_status: existingAward ? "BUYER_REVISED" : "AWARDED",
          seller_accepted: false,
          buyer_accepted: true,
          buyer_accepted_at: now,
          created_at: existingQva?.created_at || now,
          updated_at: now,
        });

        historyPayload.push({
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
          note: revisionNote.trim() || undefined,
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

      const quoteUpdatePayload = {
        award_round: nextAwardRound,
        status: "REVISION_REQUIRED" as const,
        updated_at: now,
      };

      await rfqDb.transaction(
        "rw",
        [rfqDb.rfq_quote_awards, rfqDb.rfq_quote_variant_awards, rfqDb.award_revision_history, rfqDb.rfq_award_revision_notes, rfqDb.seller_quotes],
        async () => {
          await rfqDb.rfq_quote_awards.put(awardPayload);
          await rfqDb.rfq_quote_variant_awards.bulkPut(variantAwardsPayload);
          if (historyPayload.length > 0) {
            await rfqDb.award_revision_history.bulkAdd(historyPayload);
          }
          if (notePayload) {
            await rfqDb.rfq_award_revision_notes.add(notePayload);
          }
          await rfqDb.seller_quotes.update(selectedSellerForRevision.sellerQuoteId, quoteUpdatePayload);
        },
      );

      message.success(`Award Revision Request (Award Rev R${nextAwardRound}) successfully sent to ${selectedSellerForRevision.sellerName}!`);
      setRevisionModalVisible(false);
      setSelectedSellerForRevision(null);
    } catch (err) {
      console.error("Failed to send award revision request:", err);
      message.error("Failed to send award revision request.");
    } finally {
      setSubmittingRevision(false);
    }
  };

  useEffect(() => {
    if (!hasAutoSetInitialStep.current && hasExistingAwardRevision) {
      setCardStep(1);
      hasAutoSetInitialStep.current = true;
    }
  }, [hasExistingAwardRevision]);

  return (
    <Card size="small" className="shadow-xs border-slate-200 bg-white rounded-xl">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-indigo-50/15 to-white -mx-3 -mt-3 p-3 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500 text-white font-semibold text-sm m-0">{item.item_index}</div>
            <h3 className="font-semibold text-slate-800 text-sm m-0">{product?.name || `RFQ Line Item #${itemIndex}`}</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
              {category?.name || "Category"}
            </span>
          </div>
          <div className="text-xs text-slate-600">
            Requested Qty:{" "}
            <span className="font-semibold text-slate-800">
              {item.req_quantity} {item.req_unit || "PCS"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/70 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Line Item Sourcing Summary</span>
              {activeItemInsights.allocatedQty === activeItemInsights.reqQty && activeItemInsights.reqQty > 0 ? (
                <span className="font-medium text-[11px] px-2 py-0.2 rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                  ✓ 100% Fully Allocated
                </span>
              ) : activeItemInsights.allocatedQty > activeItemInsights.reqQty ? (
                <span className="font-medium text-[11px] px-2 py-0.2 rounded border border-rose-200/60 bg-rose-50/70 text-rose-700 m-0">
                  ⚠ Over Allocated (+{activeItemInsights.allocatedQty - activeItemInsights.reqQty})
                </span>
              ) : (
                <span className="font-medium text-[11px] px-2 py-0.2 rounded border border-slate-200/60 bg-slate-50 text-slate-600 m-0">
                  Partially Allocated
                </span>
              )}
            </div>

            {cardStep === 0 ? (
              <Button
                type="primary"
                size="small"
                onClick={() => setCardStep(1)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs border-0 !h-6"
              >
                Proceed to Award Variants Revision <ArrowRightOutlined />
              </Button>
            ) : (
              <Button
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => setCardStep(0)}
                className="text-xs font-medium text-slate-600 hover:text-slate-800 border-slate-200/70 !h-6"
              >
                Back to Variant Choose
              </Button>
            )}
          </div>

          <Descriptions
            size="small"
            bordered
            column={{ xs: 1, sm: 2 }}
            classNames={{
              label: "!py-1 !px-2.5 !text-[11px] text-slate-500 bg-slate-50/40 font-medium",
              content: "!py-1 !px-2.5 !text-xs bg-white",
            }}
          >
            <Descriptions.Item
              label={
                <span className="flex items-center gap-1">
                  <ShopOutlined className="text-slate-400" />
                  <span>Proposals</span>
                </span>
              }
            >
              <span className="font-semibold text-slate-800">{activeItemInsights.totalSellers} Sellers</span>
              <span className="text-slate-400 text-[11px] ml-1">({activeItemInsights.totalVariants} Var)</span>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span className="flex items-center gap-1">
                  <CheckCircleOutlined className="text-slate-400" />
                  <span>Allocated</span>
                </span>
              }
            >
              <span className="font-semibold text-slate-800">{activeItemInsights.allocatedSellersCount} Sellers</span>
              <span className="text-slate-400 text-[11px] ml-1">({activeItemInsights.allocatedVariantsCount} Var)</span>
            </Descriptions.Item>

            <Descriptions.Item label="Allocated Qty">
              <strong className="text-indigo-600 font-semibold">
                {activeItemInsights.allocatedQty} / {activeItemInsights.reqQty} {item?.req_unit || "PCS"}
              </strong>
              <span className="text-slate-400 text-[11px] ml-1">(Rem: {activeItemInsights.remainingQty})</span>
            </Descriptions.Item>

            <Descriptions.Item label="Allocated Value">
              <strong className="text-emerald-600 font-semibold">{formatCurrency(activeItemInsights.allocatedTotalPrice)}</strong>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {cardStep === 0 && (
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
                          <th
                            className={`sticky left-0 z-10 ${rowBg} border-r border-b border-slate-100 px-3 py-2 text-left font-medium text-slate-700 text-xs min-w-[220px]`}
                          >
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

        {cardStep === 1 && (
          <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrophyOutlined className="text-amber-500/80 text-base" />
                <h3 className="text-xs font-semibold text-slate-700 tracking-wide m-0">Current Line Item Selection Insights (Seller-Wise Breakdown)</h3>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                  {sellerAllocations.length} Awarded Supplier(s)
                </span>
              </div>
            </div>

            {sellerAllocations.length > 0 ? (
              <div className="space-y-3">
                {sellerAllocations.map(sellerGroup => (
                  <div key={sellerGroup.sellerPartyId} className="border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShopOutlined className="text-indigo-500" />
                        <span className="font-semibold text-slate-800 text-xs">{sellerGroup.sellerName}</span>
                        <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                          {sellerGroup.quoteNumber}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50/70 text-slate-700 m-0">
                          Round-{sellerGroup.awardRound}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          Allocated Qty:{" "}
                          <strong className="text-slate-800 font-semibold">
                            {sellerGroup.totalQty} {item?.req_unit || "PCS"}
                          </strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">
                          Supplier Total: <strong className="text-emerald-600 font-semibold">{formatCurrency(sellerGroup.totalValue)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left bg-white border-collapse">
                        <thead className="bg-slate-50/40 text-slate-600 font-medium border-b border-slate-100">
                          <tr>
                            <th className="p-2 border-r border-slate-100">Variant Option</th>
                            <th className="p-2 border-r border-slate-100">Manufacturer / Brand</th>
                            <th className="p-2 border-r border-slate-100 text-right">Unit Price</th>
                            <th className="p-2 border-r border-slate-100 text-right">Awarded Qty</th>
                            <th className="p-2 border-r border-slate-100 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sellerGroup.items.map(item => (
                            <tr key={item.allocation.variant_id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-2 border-r border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-700 text-xs">{item.variantLabel}</span>
                                </div>
                              </td>
                              <td className="p-2 border-r border-slate-100">
                                <div className="flex items-center gap-1">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200/60 bg-slate-50/60 text-slate-700 m-0">
                                    {item.manufacturer}
                                  </span>
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200/60 bg-slate-50/60 text-slate-700 m-0">
                                    {item.brand}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <InputNumber
                                    min={0}
                                    step={1}
                                    value={item.awardedQty}
                                    onChange={val => {
                                      if (item.variant) {
                                        handleQtyChange(item.variant, item.allocation.seller_party_id, item.allocation.seller_quote_id, val);
                                      }
                                    }}
                                    size="small"
                                    className="!w-24 text-[11px] !h-7 font-mono font-medium border-slate-200/70"
                                    placeholder="Qty"
                                  />
                                </div>
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right font-mono font-semibold text-emerald-600">
                                {formatCurrency(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {(() => {
                      const notes = (awardRevisionNotes || [])
                        .filter(n => n.rfq_item_id === item.id && n.seller_party_id === sellerGroup.sellerPartyId)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                      const latestNote = notes[0];
                      if (!latestNote) return null;
                      const isSellerNote = latestNote.actor_type === "SELLER";
                      return (
                        <div
                          className={`px-3 py-2 border-t border-slate-100 flex items-start gap-2 text-xs ${isSellerNote ? "bg-indigo-50/50" : "bg-amber-50/40"}`}
                        >
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

                    <div className="bg-slate-50/40 px-3 py-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        {sellerGroup.quoteStatus === "REVISION_REQUIRED" ? (
                          <span className="font-medium text-xs px-2 py-0.5 rounded border border-amber-200/60 bg-amber-50/70 text-amber-700 m-0">
                            Award Revision Requested (Awaiting Seller Response)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Revise allocated quantities and send award revision request directly to this seller.
                          </span>
                        )}
                      </div>

                      <Button
                        size="small"
                        type="default"
                        icon={<SendOutlined className="text-indigo-500" />}
                        onClick={() => handleOpenAwardRevisionModal(sellerGroup)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border-indigo-200/70 hover:border-indigo-300"
                      >
                        Send Revision Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert
                type="info"
                showIcon
                message="No Variant Allocations Selected"
                description="Check the 'Select for Award' checkbox and enter quantities in the comparison matrix above to view current selection insights."
                className="my-1 border-sky-100 bg-sky-50/40 text-slate-600"
              />
            )}
          </Card>
        )}

        <Modal
          open={revisionModalVisible}
          title={
            <div className="flex items-center gap-2">
              <SendOutlined className="text-indigo-500" />
              <span className="text-slate-800 font-semibold">Send Award Revision Request</span>
            </div>
          }
          onCancel={() => {
            if (!submittingRevision) {
              setRevisionModalVisible(false);
              setSelectedSellerForRevision(null);
            }
          }}
          onOk={handleConfirmAwardRevision}
          confirmLoading={submittingRevision}
          okText={`Send Revision (Award Rev R${(selectedSellerForRevision?.awardRound || 1) + 1})`}
          okButtonProps={{ className: "bg-indigo-500 hover:bg-indigo-600 text-white font-medium border-0 shadow-xs" }}
        >
          <div className="space-y-3 py-2 text-xs">
            <Alert
              type="info"
              showIcon
              message="Negotiate Allocation with Seller"
              description={
                <span>
                  You are requesting an Award Revision for <strong>{selectedSellerForRevision?.sellerName}</strong> on Line Item #{item.item_index || itemIndex}{" "}
                  (<strong>{product?.name || "Product"}</strong>). This will initiate{" "}
                  <strong>Award Revision Round {(selectedSellerForRevision?.awardRound || 1) + 1}</strong> with this seller.
                </span>
              }
              className="border-sky-100 bg-sky-50/40 text-slate-600"
            />

            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
              <div className="flex justify-between font-medium text-slate-600">
                <span>New Award Revision Round:</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium border border-purple-200/60 bg-purple-50/70 text-purple-700">
                  {selectedSellerForRevision?.awardRound || 1}
                </span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Target Allocated Quantity:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedSellerForRevision?.totalQty} {item?.req_unit || "PCS"}
                </span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Estimated Allocation Value:</span>
                <span className="font-mono font-semibold text-emerald-600">{formatCurrency(selectedSellerForRevision?.totalValue || 0)}</span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Revision Request Note for Seller (Optional):</label>
              <Input.TextArea
                rows={3}
                placeholder="e.g. Please confirm if you can supply 300 PCS at $245 within 14 days lead time."
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                className="text-xs border-slate-200/70"
              />
            </div>
          </div>
        </Modal>
      </div>
    </Card>
  );
};

/*
 * ============================================================================
 * Step 2 Sub-Component: ItemWiseAwardOverviewSummary (Item-Wise Breakdown)
 * ============================================================================
 */
interface ItemWiseAwardOverviewSummaryProps {
  rfqItems: RfqItem[];
  allocations: RfqItemAllocation[];
  catalogProducts: any[];
  categories: any[];
  parties: any[];
  allQuotes: SellerQuote[];
  allProposalVariants: SellerQuoteVariant[];
  allSuggestedVariants: SellerQuoteSuggestedVariant[];
  quoteAttributes: SellerQuoteAttribute[];
  allManufacturers: any[];
  allBrands: any[];
}

const ItemWiseAwardOverviewSummary: React.FC<ItemWiseAwardOverviewSummaryProps> = ({
  rfqItems,
  allocations,
  catalogProducts,
  categories,
  parties,
  allQuotes,
  allProposalVariants,
  allSuggestedVariants,
  quoteAttributes,
  allManufacturers,
  allBrands,
}) => {
  const itemWiseGroups = useMemo(() => {
    const partiesMap = new Map(parties.map(p => [p.id, p.display_name]));
    const quotesMap = new Map(allQuotes.map(q => [q.id, q]));

    const variantsMap = new Map<string, { colLabel: string; manufacturer: string; brand: string }>();
    let optCount = 1;

    for (const q of allQuotes) {
      const customVars = allProposalVariants.filter(v => v.seller_quote_id === q.id);
      const suggestedVars = allSuggestedVariants.filter(v => v.seller_quote_id === q.id);

      const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(q.id, quoteAttributes, allManufacturers, allBrands);

      for (const v of customVars) {
        const optNum = optCount++;
        variantsMap.set(v.id, {
          colLabel: v.sku ? `Option #${optNum} (${v.sku})` : `Option #${optNum} (Custom)`,
          manufacturer,
          brand,
        });
      }

      for (const v of suggestedVars) {
        variantsMap.set(v.id, {
          colLabel: v.sku ? `Suggested SKU: ${v.sku}` : "Catalog Suggested SKU",
          manufacturer,
          brand,
        });
      }
    }

    return rfqItems.map((item, index) => {
      const product = catalogProducts.find(p => p.id === item.catalog_product_id);
      const category = categories.find(c => c.id === item.category_id);

      const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
      const itemAllocations = (itemGroup?.allocations || []).filter(a => a.is_selected && a.awarded_quantity > 0);

      const totalAllocatedQty = itemAllocations.reduce((sum, a) => sum + a.awarded_quantity, 0);
      const totalItemValue = itemAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);
      const reqQty = item.req_quantity || 1;

      const allocatedRows = itemAllocations.map(alloc => {
        const sellerPartyName = partiesMap.get(alloc.seller_party_id) || `Supplier (${alloc.seller_party_id})`;
        const quote = quotesMap.get(alloc.seller_quote_id);
        const variantInfo = variantsMap.get(alloc.variant_id);

        const unitPrice = alloc.unit_price || 0;
        const awardedQty = alloc.awarded_quantity || 0;
        const subtotal = unitPrice * awardedQty;

        return {
          allocation: alloc,
          sellerName: sellerPartyName,
          quoteNumber: quote?.seller_quote_number || "Quote Proposal",
          variantLabel: variantInfo?.colLabel || `Variant (${alloc.variant_type})`,
          manufacturer: variantInfo?.manufacturer || "N/A",
          brand: variantInfo?.brand || "N/A",
          unitPrice,
          awardedQty,
          subtotal,
        };
      });

      return {
        item,
        itemNumber: item.item_index || index + 1,
        productName: product?.name || `RFQ Line Item #${index + 1}`,
        categoryName: category?.name || "Category",
        reqQty,
        reqUnit: item.req_unit || "PCS",
        totalAllocatedQty,
        totalItemValue,
        allocatedRows,
      };
    });
  }, [
    rfqItems,
    allocations,
    catalogProducts,
    categories,
    parties,
    allQuotes,
    allProposalVariants,
    allSuggestedVariants,
    quoteAttributes,
    allManufacturers,
    allBrands,
  ]);

  const grandTotalValue = useMemo(() => itemWiseGroups.reduce((sum, g) => sum + g.totalItemValue, 0), [itemWiseGroups]);
  const allocatedItemsCount = useMemo(() => itemWiseGroups.filter(g => g.allocatedRows.length > 0).length, [itemWiseGroups]);

  return (
    <div className="space-y-4">
      {/* Header Summary Card */}
      <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
        <Descriptions
          title={
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <UnorderedListOutlined className="text-indigo-500" />
                Item-Wise Seller Award Allocations Overview
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded border border-sky-200/60 bg-sky-50/70 text-sky-700">
                {allocatedItemsCount} of {rfqItems.length} Line Items Allocated
              </span>
            </div>
          }
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          className="mt-2"
          classNames={{
            label: "text-xs p-1 text-slate-500",
            content: "text-xs p-1",
          }}
        >
          <Descriptions.Item label="Total RFQ Line Items">
            <span className="font-semibold text-slate-800">{rfqItems.length} Line Items</span>
          </Descriptions.Item>
          <Descriptions.Item label="Allocated Line Items">
            <span className="font-medium text-indigo-600">{allocatedItemsCount} Items</span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Awarded Value">
            <span className="font-semibold text-emerald-600">{formatCurrency(grandTotalValue)}</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* List of RFQ Items with Awarded Seller Variants */}
      {itemWiseGroups.map(group => (
        <Card key={group.item.id} size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl overflow-hidden">
          <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 mb-2 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100/60">
                Line Item #{group.itemNumber}
              </span>
              <span className="font-semibold text-slate-800 text-xs">{group.productName}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">{group.categoryName}</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Requested Qty:{" "}
                <strong className="text-slate-800 font-semibold">
                  {group.reqQty} {group.reqUnit}
                </strong>
              </span>

              <span className="text-slate-300">|</span>

              <span className="text-slate-500">
                Allocated:{" "}
                <strong className="text-indigo-600 font-semibold">
                  {group.totalAllocatedQty} / {group.reqQty} {group.reqUnit}
                </strong>
              </span>

              <span className="text-slate-300">|</span>

              <span className="text-slate-500">
                Item Value: <strong className="text-emerald-600 font-semibold">{formatCurrency(group.totalItemValue)}</strong>
              </span>

              {group.totalAllocatedQty === group.reqQty && group.reqQty > 0 ? (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">✓ 100% Allocated</span>
              ) : group.totalAllocatedQty > group.reqQty ? (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-rose-200/60 bg-rose-50/70 text-rose-700 m-0">
                  ⚠ Over Allocated
                </span>
              ) : group.totalAllocatedQty > 0 ? (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-amber-200/60 bg-amber-50/70 text-amber-700 m-0">
                  Partially Allocated
                </span>
              ) : (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50 text-slate-500 m-0">Unallocated</span>
              )}
            </div>
          </div>

          {group.allocatedRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-100">
                <thead className="bg-slate-50/40 text-slate-600 font-medium border-b border-slate-100">
                  <tr>
                    <th className="p-2 border-r border-slate-100">Supplier Name & Quote #</th>
                    <th className="p-2 border-r border-slate-100">Awarded Variant Option</th>
                    <th className="p-2 border-r border-slate-100">Manufacturer / Brand</th>
                    <th className="p-2 border-r border-slate-100 text-right">Unit Price</th>
                    <th className="p-2 border-r border-slate-100 text-right">Awarded Quantity</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {group.allocatedRows.map(row => (
                    <tr key={row.allocation.variant_id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-2 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <ShopOutlined className="text-indigo-500" />
                          <span className="font-medium text-slate-800">{row.sellerName}</span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200/60">
                            {row.quoteNumber}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">{row.variantLabel}</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200/60 bg-purple-50/60 text-purple-700 m-0">
                            {row.manufacturer}
                          </span>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/60 text-sky-700 m-0">
                            {row.brand}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">{formatCurrency(row.unitPrice)}</td>
                      <td className="p-2 border-r border-slate-100 text-right font-medium text-slate-800">
                        {row.awardedQty} {group.reqUnit}
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-emerald-600">{formatCurrency(row.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert
              type="info"
              showIcon
              message="No Variant Allocations for this Line Item"
              description="No seller variants have been selected for award on this line item yet."
              className="my-1 border-sky-100 bg-sky-50/40 text-slate-600"
            />
          )}
        </Card>
      ))}
    </div>
  );
};

/*
 * ============================================================================
 * Step 3 Sub-Component: SellerWiseAwardOverviewSummary (Supplier-Wise Summary)
 * ============================================================================
 */
interface SellerWiseAwardOverviewSummaryProps {
  rfqId?: string;
  rfq: any;
  currentProcessHeader?: RfqQuoteAward;
  isFinalized: boolean;
  allocations: RfqItemAllocation[];
  existingAwardItems: RfqQuoteVariantAward[];
  existingPurchaseOrders: PurchaseOrder[];
  existingPoAcknowledgements: PoAcknowledgement[];
  parties: any[];
  allQuotes: SellerQuote[];
  rfqItems: RfqItem[];
  catalogProducts: any[];
  categories: any[];
  allProposalVariants: SellerQuoteVariant[];
  allSuggestedVariants: SellerQuoteSuggestedVariant[];
  quoteAttributes: SellerQuoteAttribute[];
  allManufacturers: any[];
  allBrands: any[];
}

const SellerWiseAwardOverviewSummary: React.FC<SellerWiseAwardOverviewSummaryProps> = ({
  rfqId,
  rfq,
  currentProcessHeader,
  isFinalized,
  allocations,
  existingAwardItems,
  existingPurchaseOrders,
  existingPoAcknowledgements,
  parties,
  allQuotes,
  rfqItems,
  catalogProducts,
  categories,
  allProposalVariants,
  allSuggestedVariants,
  quoteAttributes,
  allManufacturers,
  allBrands,
}) => {
  const allCombinedVariants = useMemo<FlattenedVariant[]>(() => {
    const customMap = new Map<string, typeof allProposalVariants>();
    allProposalVariants.forEach(v => {
      const list = customMap.get(v.seller_quote_id) || [];
      list.push(v);
      customMap.set(v.seller_quote_id, list);
    });

    const suggestedMap = new Map<string, typeof allSuggestedVariants>();
    allSuggestedVariants.forEach(v => {
      const list = suggestedMap.get(v.seller_quote_id) || [];
      list.push(v);
      suggestedMap.set(v.seller_quote_id, list);
    });

    const partiesMap = new Map(parties.map(p => [p.id, p.display_name]));

    const result: FlattenedVariant[] = [];
    let optionCounter = 1;

    for (const quote of allQuotes) {
      const sellerName = partiesMap.get(quote.seller_party_id) ?? `Supplier (${quote.seller_party_id})`;
      const customVars = customMap.get(quote.id) || [];
      const suggestedVars = suggestedMap.get(quote.id) || [];

      const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(quote.id, quoteAttributes, allManufacturers, allBrands);

      for (const variant of customVars) {
        const offerPrice = variant.offer_price ?? 0;
        const optNum = optionCounter++;
        result.push({
          id: variant.id,
          colKey: `col_${variant.id}`,
          colLabel: variant.sku ? `Option #${optNum} (${variant.sku})` : `Option #${optNum} (Custom)`,
          type: "New proposal option",
          offerPrice,
          offerQuantity: quote.offer_quantity ?? 1,
          unit: quote.offer_unit ?? "PCS",
          totalPrice: offerPrice * (quote.offer_quantity ?? 1),
          manufacturer,
          brand,
          sellerName,
          sellerPartyId: quote.seller_party_id,
          quoteNumber: quote.seller_quote_number,
          quoteStatus: quote.status,
        });
      }

      for (const variant of suggestedVars) {
        const offerPrice = variant.offer_price ?? variant.list_price ?? 0;
        result.push({
          id: variant.id,
          colKey: `col_${variant.id}`,
          colLabel: variant.sku ? `Suggested SKU: ${variant.sku}` : "Catalog Suggested SKU",
          type: "Catalog Suggested SKU",
          offerPrice,
          offerQuantity: quote.offer_quantity ?? 1,
          unit: quote.offer_unit ?? "PCS",
          totalPrice: offerPrice * (quote.offer_quantity ?? 1),
          manufacturer,
          brand,
          sellerName,
          sellerPartyId: quote.seller_party_id,
          quoteNumber: quote.seller_quote_number,
          quoteStatus: quote.status,
        });
      }
    }
    return result;
  }, [allQuotes, allProposalVariants, allSuggestedVariants, quoteAttributes, parties, allManufacturers, allBrands]);

  const rfqAwardSummaryBySeller = useMemo(() => {
    if (!rfqId) return [];

    const activeAllocations = allocations.flatMap(itemGroup => itemGroup.allocations).filter(a => a.is_selected && a.awarded_quantity > 0);

    const sellerGroupsMap = new Map<
      string,
      {
        sellerPartyId: string;
        sellerName: string;
        quoteId: string;
        quoteNumber: string;
        purchaseOrder?: PurchaseOrder;
        poAcknowledgement?: PoAcknowledgement;
        totalAmount: number;
        items: Array<{
          rfqItemId: string;
          itemIndex: number;
          productName: string;
          categoryName: string;
          variantId: string;
          variantLabel: string;
          manufacturer: string;
          brand: string;
          unitPrice: number;
          awardedQuantity: number;
          totalPrice: number;
          unitOfMeasure: string;
        }>;
      }
    >();

    if (existingAwardItems.length > 0) {
      existingAwardItems.forEach(item => {
        const sellerParty = parties.find(p => p.id === item.seller_party_id);
        const quote = allQuotes.find(q => q.id === item.seller_quote_id);
        const po = existingPurchaseOrders.find(p => p.id === item.purchase_order_id || p.seller_party_id === item.seller_party_id);
        const ack = po ? existingPoAcknowledgements.find(a => a.purchase_order_id === po.id) : undefined;

        const rfqItem = rfqItems.find(i => i.id === item.rfq_item_id);
        const product = catalogProducts.find(p => p.id === rfqItem?.catalog_product_id);
        const category = categories.find(c => c.id === rfqItem?.category_id);
        const variant = allCombinedVariants.find(v => v.id === item.variant_id);

        if (!sellerGroupsMap.has(item.seller_party_id)) {
          sellerGroupsMap.set(item.seller_party_id, {
            sellerPartyId: item.seller_party_id,
            sellerName: sellerParty?.display_name || `Supplier (${item.seller_party_id})`,
            quoteId: item.seller_quote_id,
            quoteNumber: quote?.seller_quote_number || "Quote Proposal",
            purchaseOrder: po,
            poAcknowledgement: ack,
            totalAmount: 0,
            items: [],
          });
        }

        const group = sellerGroupsMap.get(item.seller_party_id)!;
        group.totalAmount += item.total_price || item.unit_price * item.awarded_quantity;

        group.items.push({
          rfqItemId: item.rfq_item_id,
          itemIndex: rfqItem?.item_index || 1,
          productName: product?.name || `RFQ Line Item #${rfqItem?.item_index || 1}`,
          categoryName: category?.name || "Category",
          variantId: item.variant_id,
          variantLabel: variant?.colLabel || `Variant (${item.variant_type})`,
          manufacturer: variant?.manufacturer || "N/A",
          brand: variant?.brand || "N/A",
          unitPrice: item.unit_price,
          awardedQuantity: item.awarded_quantity,
          totalPrice: item.total_price || item.unit_price * item.awarded_quantity,
          unitOfMeasure: "PCS",
        });
      });
    } else {
      activeAllocations.forEach(alloc => {
        const sellerParty = parties.find(p => p.id === alloc.seller_party_id);
        const quote = allQuotes.find(q => q.id === alloc.seller_quote_id);
        const rfqItem = rfqItems.find(i => i.id === alloc.rfq_item_id);
        const product = catalogProducts.find(p => p.id === rfqItem?.catalog_product_id);
        const category = categories.find(c => c.id === rfqItem?.category_id);
        const variant = allCombinedVariants.find(v => v.id === alloc.variant_id);

        if (!sellerGroupsMap.has(alloc.seller_party_id)) {
          sellerGroupsMap.set(alloc.seller_party_id, {
            sellerPartyId: alloc.seller_party_id,
            sellerName: sellerParty?.display_name || `Supplier (${alloc.seller_party_id})`,
            quoteId: alloc.seller_quote_id,
            quoteNumber: quote?.seller_quote_number || "Quote Proposal",
            totalAmount: 0,
            items: [],
          });
        }

        const group = sellerGroupsMap.get(alloc.seller_party_id)!;
        const itemTotal = alloc.unit_price * alloc.awarded_quantity;
        group.totalAmount += itemTotal;

        group.items.push({
          rfqItemId: alloc.rfq_item_id,
          itemIndex: rfqItem?.item_index || 1,
          productName: product?.name || `RFQ Line Item #${rfqItem?.item_index || 1}`,
          categoryName: category?.name || "Category",
          variantId: alloc.variant_id,
          variantLabel: variant?.colLabel || `Variant (${alloc.variant_type})`,
          manufacturer: variant?.manufacturer || "N/A",
          brand: variant?.brand || "N/A",
          unitPrice: alloc.unit_price,
          awardedQuantity: alloc.awarded_quantity,
          totalPrice: itemTotal,
          unitOfMeasure: alloc.unit_of_measure || "PCS",
        });
      });
    }

    return Array.from(sellerGroupsMap.values());
  }, [
    rfqId,
    existingAwardItems,
    allocations,
    existingPurchaseOrders,
    existingPoAcknowledgements,
    parties,
    allQuotes,
    rfqItems,
    catalogProducts,
    categories,
    allCombinedVariants,
  ]);

  return (
    <div className="space-y-4">
      {/* Header Award Summary Card */}
      <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
        <Descriptions
          title={
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <TrophyOutlined className="text-amber-500/80" />
                Final Sourcing Contract Award Summary (Supplier-Wise Preview)
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded border ${isFinalized ? "border-emerald-200/60 bg-emerald-50/70 text-emerald-700" : "border-sky-200/60 bg-sky-50/70 text-sky-700"}`}
              >
                {currentProcessHeader?.award_status || (rfqAwardSummaryBySeller.length > 0 ? "DRAFT ALLOCATION" : "NO AWARDS")}
              </span>
            </div>
          }
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 4 }}
          className="mt-2 text-xs"
          classNames={{
            label: "text-xs p-1 text-slate-500",
            content: "text-xs p-1",
          }}
        >
          <Descriptions.Item label="RFQ Number">
            <span className="font-mono font-semibold text-slate-800">{rfq?.rfq_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Contract Award Value">
            <span className="font-semibold text-emerald-600">
              {formatCurrency(currentProcessHeader?.total_awarded_amount || rfqAwardSummaryBySeller.reduce((s, g) => s + g.totalAmount, 0))}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Awarded Suppliers Count">
            <span className="font-medium text-slate-800">{rfqAwardSummaryBySeller.length} Supplier(s)</span>
          </Descriptions.Item>
          <Descriptions.Item label="Generated Purchase Orders">
            <span className="font-medium text-slate-800">{existingPurchaseOrders.length} PO(s)</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {rfqAwardSummaryBySeller.length > 0 ? (
        <div className="space-y-4">
          {rfqAwardSummaryBySeller.map(sellerGroup => (
            <Card key={sellerGroup.sellerPartyId} size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl overflow-hidden">
              {/* Seller Header */}
              <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 mb-2 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <ShopOutlined className="text-indigo-500 text-sm" />
                  <span className="font-semibold text-slate-800 text-xs">{sellerGroup.sellerName}</span>
                  <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                    {sellerGroup.quoteNumber}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {sellerGroup.purchaseOrder && (
                    <span className="font-mono font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100/60">
                      {sellerGroup.purchaseOrder.po_number}
                    </span>
                  )}

                  {sellerGroup.poAcknowledgement?.buyer_confirmed ? (
                    <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/60 bg-emerald-50/70 text-emerald-700 m-0">
                      PO Released ✓
                    </span>
                  ) : (
                    <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-amber-200/60 bg-amber-50/70 text-amber-700 m-0">
                      PO Pending Release
                    </span>
                  )}

                  {sellerGroup.poAcknowledgement?.seller_acknowledged ? (
                    <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/60 bg-emerald-50/70 text-emerald-700 m-0">
                      Seller Acknowledged ✓
                    </span>
                  ) : (
                    <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-purple-200/60 bg-purple-50/70 text-purple-700 m-0">
                      Awaiting Confirmation...
                    </span>
                  )}

                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    Contract Total: <strong className="text-emerald-600 font-semibold">{formatCurrency(sellerGroup.totalAmount)}</strong>
                  </span>
                </div>
              </div>

              {/* Awarded Items Table for this Seller */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-100">
                  <thead className="bg-slate-50/40 text-slate-600 font-medium border-b border-slate-100">
                    <tr>
                      <th className="p-2 border-r border-slate-100">Line Item # & Product</th>
                      <th className="p-2 border-r border-slate-100">Category</th>
                      <th className="p-2 border-r border-slate-100">Awarded Variant Option</th>
                      <th className="p-2 border-r border-slate-100">Manufacturer / Brand</th>
                      <th className="p-2 border-r border-slate-100 text-right">Unit Price</th>
                      <th className="p-2 border-r border-slate-100 text-right">Awarded Quantity</th>
                      <th className="p-2 text-right">Line Item Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sellerGroup.items.map(item => (
                      <tr key={`${item.rfqItemId}-${item.variantId}`} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-2 border-r border-slate-100">
                          <div className="font-medium text-slate-800">
                            Line Item #{item.itemIndex}: {item.productName}
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">{item.variantLabel}</span>
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <div className="flex items-center gap-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200/60 bg-purple-50/60 text-purple-700 m-0">
                              {item.manufacturer}
                            </span>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/60 text-sky-700 m-0">
                              {item.brand}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 border-r border-slate-100 text-right font-medium text-slate-800">
                          {item.awardedQuantity} {item.unitOfMeasure}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-emerald-600">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Alert
          type="info"
          showIcon
          message="No RFQ Contract Awards to Preview"
          description="Switch to Step 1 (Award Line Item Variants) above to allocate award quantities across line items and save draft or finalize contract awards."
          className="border-sky-100 bg-sky-50/40 text-slate-600"
        />
      )}
    </div>
  );
};
