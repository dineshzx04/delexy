import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Alert,
  Button,
  Card,
  Steps,
  Tag as AntTag,
  InputNumber,
  message,
  notification,
  Tooltip,
  Descriptions,
  Checkbox,
  Modal,
  Input,
} from "antd";
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
} from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { catalogDb } from "../../data/catalog/catalog.db";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";

type ViewMode = "matrix" | "item_summary" | "summary";

type ProposalVariant = {
  id: string;
  colKey: string;
  excelLetter: string;
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
  sellerId: string;
  sellerName: string;
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
  variants: ProposalVariant[];
};

type FlattenedVariant = ProposalVariant & {
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
  excel_letter: string;
  variant_type: "CUSTOM" | "SUGGESTED";
  unit_price: number;
  awarded_quantity: number;
  unit_of_measure: string;
  seller_accepted?: boolean;
  is_selected?: boolean;
};

const getExcelColumn = (index: number): string => {
  let result = "";
  let value = index;

  do {
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return result;
};

const formatCurrency = (value: number): string => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const extractMfgBrandFromQuoteAttrs = (
  quoteId: string,
  quoteAttributes: SellerQuoteAttribute[],
  allManufacturers: any[],
  allBrands: any[]
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
  const [allocations, setAllocations] = useState<Record<string, AwardAllocation>>({});

  /*
   * Consolidated Dexie DB Queries
   */
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
      existingPurchaseOrders,
      existingPoAcknowledgements,
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
      rfqDb.purchase_orders.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.po_acknowledgements.toArray(),
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
      existingPurchaseOrders,
      existingPoAcknowledgements,
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
    existingPurchaseOrders = [],
    existingPoAcknowledgements = [],
  } = pageData ?? {};

  /*
   * Seed Allocations State from DB
   */
  useEffect(() => {
    const currentHeader = existingQuoteAwards[0];
    if (currentHeader?.draft_snapshot) {
      try {
        const parsed = JSON.parse(currentHeader.draft_snapshot);
        setAllocations(prev => ({ ...parsed, ...prev }));
        return;
      } catch (err) {
        console.error("Failed to parse draft_snapshot", err);
      }
    }

    if (existingQuoteVariantAwards.length > 0) {
      const initialMap: Record<string, AwardAllocation> = {};
      existingQuoteVariantAwards.forEach(item => {
        const key = `${item.rfq_item_id}:${item.variant_id}`;
        initialMap[key] = {
          rfq_item_id: item.rfq_item_id,
          seller_party_id: item.seller_party_id,
          seller_quote_id: item.seller_quote_id,
          variant_id: item.variant_id,
          variant_col_key: `col_${item.variant_id}`,
          excel_letter: item.excel_letter || "",
          variant_type: item.variant_type,
          unit_price: item.unit_price,
          awarded_quantity: item.awarded_quantity,
          unit_of_measure: item.unit_of_measure || "PCS",
          seller_accepted: item.seller_accepted,
          is_selected: item.awarded_quantity > 0 || true,
        };
      });
      setAllocations(prev => ({ ...initialMap, ...prev }));
    }
  }, [existingQuoteAwards, existingQuoteVariantAwards]);

  /*
   * Breadcrumbs & Active Party Lookup
   */
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

  /*
   * Global Persistence Handlers (Save Draft vs Finalize Award POs)
   */
  const handleSaveDraft = async () => {
    if (!rfqId) return;
    const now = new Date().toISOString();

    const activeAllocations = Object.values(allocations).filter(a => a.is_selected && a.awarded_quantity > 0);
    const totalAmount = activeAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);

    // Group active allocations by seller quote
    const quoteGroups: Record<string, AwardAllocation[]> = {};
    activeAllocations.forEach(a => {
      if (!quoteGroups[a.seller_quote_id]) quoteGroups[a.seller_quote_id] = [];
      quoteGroups[a.seller_quote_id].push(a);
    });

    const quoteAwardRecords: RfqQuoteAward[] = [];
    const quoteVariantAwardRecords: RfqQuoteVariantAward[] = [];

    Object.entries(quoteGroups).forEach(([quoteId, qAllocations]) => {
      const quoteAwardId = `quote-award-${quoteId}`;
      const firstAlloc = qAllocations[0];
      const qTotalAmount = qAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);
      const qTotalQty = qAllocations.reduce((sum, a) => sum + a.awarded_quantity, 0);

      quoteAwardRecords.push({
        id: quoteAwardId,
        rfq_id: rfqId,
        rfq_item_id: firstAlloc.rfq_item_id,
        seller_quote_id: quoteId,
        seller_party_id: firstAlloc.seller_party_id,
        buyer_party_id: activePartyId || "pty-buyer",
        created_by_user_id: currentUserId || "usr-1",
        award_status: "DRAFT",
        award_round: 1,
        total_awarded_amount: qTotalAmount,
        total_awarded_quantity: qTotalQty,
        currency: rfq?.currency || "USD",
        draft_snapshot: JSON.stringify(allocations),
        updated_at: now,
        created_at: now,
      });

      qAllocations.forEach(a => {
        const qvaId = `qva-${quoteAwardId}-${a.variant_id}`;
        quoteVariantAwardRecords.push({
          id: qvaId,
          quote_award_id: quoteAwardId,
          rfq_id: rfqId,
          rfq_item_id: a.rfq_item_id,
          seller_quote_id: a.seller_quote_id,
          seller_party_id: a.seller_party_id,
          variant_id: a.variant_id,
          variant_type: a.variant_type,
          variant_label: `Option ${a.excel_letter || "A"}`,
          excel_letter: a.excel_letter,
          award_round: 1,
          buyer_target_quantity: a.awarded_quantity,
          seller_offered_quantity: a.awarded_quantity,
          awarded_quantity: a.awarded_quantity,
          unit_price: a.unit_price,
          total_price: a.unit_price * a.awarded_quantity,
          unit_of_measure: a.unit_of_measure || "PCS",
          variant_award_status: "DRAFT",
          seller_accepted: a.seller_accepted ?? false,
          buyer_accepted: true,
          product_mapping_status: a.variant_type === "SUGGESTED" ? "NOT_REQUIRED" : "PENDING",
          updated_at: now,
          created_at: now,
        });
      });
    });

    // Save to primary quote award tables
    await rfqDb.rfq_quote_awards.where("rfq_id").equals(rfqId).delete();
    if (quoteAwardRecords.length > 0) {
      await rfqDb.rfq_quote_awards.bulkPut(quoteAwardRecords);
    }
    await rfqDb.rfq_quote_variant_awards.where("rfq_id").equals(rfqId).delete();
    if (quoteVariantAwardRecords.length > 0) {
      await rfqDb.rfq_quote_variant_awards.bulkPut(quoteVariantAwardRecords);
    }

    message.success("Draft quote award allocations saved successfully.");
  };

  const handleFinalizeAndGeneratePOs = async () => {
    if (!rfqId) return;

    for (const item of rfqItems) {
      const itemAllocated = Object.values(allocations)
        .filter(a => a.rfq_item_id === item.id && a.is_selected)
        .reduce((sum, a) => sum + (a.awarded_quantity || 0), 0);
      if (itemAllocated > item.req_quantity) {
        message.error(`Line item #${item.item_index || 1} is over-allocated (${itemAllocated}/${item.req_quantity}). Please adjust before finalizing.`);
        return;
      }
    }

    const activeAllocations = Object.values(allocations).filter(a => a.is_selected && a.awarded_quantity > 0);
    if (activeAllocations.length === 0) {
      message.warning("Please allocate award quantities to at least one variant before finalizing.");
      return;
    }

    const now = new Date().toISOString();
    const totalAmount = activeAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);
    const buyerPartyId = activePartyId || "pty-buyer";

    // Group active allocations by seller quote
    const quoteGroups: Record<string, AwardAllocation[]> = {};
    activeAllocations.forEach(a => {
      if (!quoteGroups[a.seller_quote_id]) quoteGroups[a.seller_quote_id] = [];
      quoteGroups[a.seller_quote_id].push(a);
    });

    const quoteAwardRecords: RfqQuoteAward[] = [];
    const quoteVariantAwardRecords: RfqQuoteVariantAward[] = [];
    const poRecords: PurchaseOrder[] = [];
    const poItemRecords: PurchaseOrderItem[] = [];
    const poAckRecords: PoAcknowledgement[] = [];

    let poCounter = existingPurchaseOrders.length + 1;

    for (const [quoteId, qAllocations] of Object.entries(quoteGroups)) {
      const quoteAwardId = `quote-award-${quoteId}`;
      const firstAlloc = qAllocations[0];
      const sellerPartyId = firstAlloc.seller_party_id;
      const qTotalAmount = qAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);
      const qTotalQty = qAllocations.reduce((sum, a) => sum + a.awarded_quantity, 0);

      const poId = `po-${rfqId}-${sellerPartyId}-${quoteId}`;
      const poNumber = `PO-2026-${String(poCounter++).padStart(3, "0")}`;

      quoteAwardRecords.push({
        id: quoteAwardId,
        rfq_id: rfqId,
        rfq_item_id: firstAlloc.rfq_item_id,
        seller_quote_id: quoteId,
        seller_party_id: sellerPartyId,
        buyer_party_id: buyerPartyId,
        created_by_user_id: currentUserId || "usr-1",
        award_status: "AWARDED",
        award_round: 1,
        total_awarded_amount: qTotalAmount,
        total_awarded_quantity: qTotalQty,
        currency: rfq?.currency || "USD",
        payment_terms: "Net 30 Days",
        shipping_address: rfq?.shipping_destination || "Corporate HQ Logistics",
        purchase_order_id: poId,
        awarded_at: now,
        created_at: now,
        updated_at: now,
      });

      poRecords.push({
        id: poId,
        po_number: poNumber,
        rfq_id: rfqId,
        quote_award_id: quoteAwardId,
        buyer_party_id: buyerPartyId,
        seller_party_id: sellerPartyId,
        total_amount: qTotalAmount,
        currency: rfq?.currency || "USD",
        po_status: "RELEASED",
        shipping_address: rfq?.shipping_destination || "Corporate HQ Logistics",
        payment_terms: "Net 30 Days",
        po_released_at: now,
        created_at: now,
        updated_at: now,
      });

      poAckRecords.push({
        id: `ack-${poId}`,
        purchase_order_id: poId,
        seller_party_id: sellerPartyId,
        seller_acknowledged: false,
        buyer_confirmed: true,
        buyer_confirmed_at: now,
        buyer_note: "Purchase order released automatically upon contract award finalization.",
        updated_at: now,
      });

      qAllocations.forEach(a => {
        const qvaId = `qva-${quoteAwardId}-${a.variant_id}`;
        const poItemId = `po-item-${poId}-${a.variant_id}`;

        quoteVariantAwardRecords.push({
          id: qvaId,
          quote_award_id: quoteAwardId,
          rfq_id: rfqId,
          rfq_item_id: a.rfq_item_id,
          seller_quote_id: a.seller_quote_id,
          seller_party_id: a.seller_party_id,
          variant_id: a.variant_id,
          variant_type: a.variant_type,
          variant_label: `Option ${a.excel_letter || "A"}`,
          excel_letter: a.excel_letter,
          award_round: 1,
          buyer_target_quantity: a.awarded_quantity,
          seller_offered_quantity: a.awarded_quantity,
          awarded_quantity: a.awarded_quantity,
          unit_price: a.unit_price,
          total_price: a.unit_price * a.awarded_quantity,
          unit_of_measure: a.unit_of_measure || "PCS",
          variant_award_status: "CONFIRMED",
          seller_accepted: true,
          seller_accepted_at: now,
          buyer_accepted: true,
          buyer_accepted_at: now,
          product_mapping_status: a.variant_type === "SUGGESTED" ? "NOT_REQUIRED" : "PENDING",
          purchase_order_id: poId,
          purchase_order_item_id: poItemId,
          updated_at: now,
          created_at: now,
        });

        poItemRecords.push({
          id: poItemId,
          purchase_order_id: poId,
          quote_variant_award_id: qvaId,
          rfq_item_id: a.rfq_item_id,
          variant_id: a.variant_id,
          variant_label: `Option ${a.excel_letter || "A"}`,
          unit_price: a.unit_price,
          awarded_quantity: a.awarded_quantity,
          unit_of_measure: a.unit_of_measure || "PCS",
          total_price: a.unit_price * a.awarded_quantity,
        });
      });
    }

    // Persist to primary quote award tables
    await rfqDb.rfq_quote_awards.where("rfq_id").equals(rfqId).delete();
    await rfqDb.rfq_quote_awards.bulkPut(quoteAwardRecords);
    await rfqDb.rfq_quote_variant_awards.where("rfq_id").equals(rfqId).delete();
    await rfqDb.rfq_quote_variant_awards.bulkPut(quoteVariantAwardRecords);

    // Purchase orders
    await rfqDb.purchase_orders.where("rfq_id").equals(rfqId).delete();
    await rfqDb.purchase_orders.bulkPut(poRecords);
    await rfqDb.purchase_order_items.bulkPut(poItemRecords);
    await rfqDb.po_acknowledgements.bulkPut(poAckRecords);

    await rfqDb.rfqs.update(rfqId, { status: "AWARDED", updated_at: now });
    for (const item of rfqItems) {
      await rfqDb.rfq_items.update(item.id, { status: "AWARDED", updated_at: now });
    }

    notification.success({
      message: "Contract Awards Finalized!",
      description: `Successfully awarded ${quoteAwardRecords.length} quote(s) and generated ${poRecords.length} Purchase Order(s).`,
    });

    setViewMode("summary");
  };

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

  const currentQuoteAward = existingQuoteAwards[0];
  const isFinalized = existingQuoteAwards.some(a => a.award_status === "AWARDED" || a.award_status === "CONFIRMED" || a.award_status === "PO_CREATED" || a.award_status === "AWARD_FINALIZED" || a.award_status === "PO_GENERATED");

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-8">
      {/* 1. Guided Stepper Header */}
      <AwardingWorkspaceHeader
        rfqNumber={rfq.rfq_number}
        isFinalized={isFinalized}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSaveDraft={handleSaveDraft}
        onFinalize={handleFinalizeAndGeneratePOs}
      />

      {/* 2. Step 1: Award Line Item Variants View (Unified Component) */}
      {viewMode === "matrix" && (
        <div className="space-y-4">
          <MatrixComparisonSection
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
          />

          {/* Step 1 Footer Action Bar */}
          <div className="flex items-center justify-between bg-white p-3 border border-slate-200/60 rounded-xl shadow-xs">
            <Button size="small" icon={<SaveOutlined />} onClick={handleSaveDraft} className="text-xs font-medium text-slate-600 hover:text-slate-800 border-slate-200/70">
              Save Allocation Draft
            </Button>

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
      {viewMode === "item_summary" && (
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

          {/* Step 2 Footer Action Bar */}
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
      )}

      {/* 4. Step 3: Supplier-Wise Final Award Overview Summary View */}
      {viewMode === "summary" && (
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

          {/* Step 3 Footer Action Bar */}
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
      )}
    </div>
  );
};

interface AwardingWorkspaceHeaderProps {
  rfqNumber: string;
  isFinalized: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSaveDraft: () => void;
  onFinalize: () => void;
}

const AwardingWorkspaceHeader: React.FC<AwardingWorkspaceHeaderProps> = ({
  rfqNumber,
  isFinalized,
  viewMode,
  onViewModeChange,
  onSaveDraft,
  onFinalize,
}) => {
  const currentStep = viewMode === "matrix" ? 0 : viewMode === "item_summary" ? 1 : 2;

  return (
    <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800 tracking-tight m-0">Quote Award Revision Workspace</h1>
            {isFinalized ? (
              <AntTag className="px-2 py-0.5 text-[11px] font-medium rounded border border-emerald-200/60 bg-emerald-50/70 text-emerald-700 m-0">
                FINALIZED
              </AntTag>
            ) : (
              <AntTag className="px-2 py-0.5 text-[11px] font-medium rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                AWARD REVISION
              </AntTag>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Item-Seller Award Revision & PO Generation: Evaluate proposals, negotiate item-wise seller allocations with revision rounds, and release Purchase Orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
        </div>
      </div>

      {/* 3-Step Stepper Navigation Bar */}
      <div className="pt-3">
        <Steps
          current={currentStep}
          onChange={step => onViewModeChange(step === 0 ? "matrix" : step === 1 ? "item_summary" : "summary")}
          size="small"
          items={[
            {
              title: <span className="font-bold text-xs">Step 1: Award Line Item Variants</span>,
              description: <span className="text-[11px] text-slate-500">Evaluate proposals & allocate per product</span>,
              icon: <TableOutlined />,
            },
            // {
            //   title: <span className="font-bold text-xs">Step 2: Item-Wise Allocations</span>,
            //   description: <span className="text-[11px] text-slate-500">Review awarded seller variants item by item</span>,
            //   icon: <UnorderedListOutlined />,
            // },
            {
              title: <span className="font-bold text-xs">Step 2: Supplier Award Overview & POs</span>,
              description: <span className="text-[11px] text-slate-500">Review supplier totals & release Purchase Orders</span>,
              icon: <TrophyOutlined />,
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
  allocations: Record<string, AwardAllocation>;
  setAllocations: React.Dispatch<React.SetStateAction<Record<string, AwardAllocation>>>;
}

const MatrixComparisonSection: React.FC<MatrixComparisonSectionProps> = ({
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
}) => {
  return (
    <div className="space-y-6">
      {rfqItems.map((item, itemIdx) => (
        <SingleItemMatrixComparisonCard
          key={item.id}
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
  allocations: Record<string, AwardAllocation>;
  setAllocations: React.Dispatch<React.SetStateAction<Record<string, AwardAllocation>>>;
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
}) => {
  const product = useMemo(() => catalogProducts.find(p => p.id === item.catalog_product_id), [catalogProducts, item.catalog_product_id]);
  const category = useMemo(() => categories.find(c => c.id === item.category_id), [categories, item.category_id]);

  /*
   * Proposal Matrix Construction for this Line Item
   */
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
    let excelColIndex = 0;

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
        const excelLetter = getExcelColumn(excelColIndex++);

        proposalVariants.push({
          id: variant.id,
          colKey: `col_${variant.id}`,
          excelLetter,
          colLabel: `Variant ${excelLetter} (Custom)`,
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
        const excelLetter = getExcelColumn(excelColIndex++);

        proposalVariants.push({
          id: variant.id,
          colKey: `col_${variant.id}`,
          excelLetter,
          colLabel: `Variant ${excelLetter} (${variant.sku ?? "Suggested SKU"})`,
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
        sellerId: quote.seller_party_id,
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
          sellerName: seller.sellerName,
          quoteNumber: seller.quoteNumber,
          quoteStatus: seller.quoteStatus,
        })),
      ),
    [sellerProposals],
  );

  /*
   * Allocation Insights for this Item
   */
  const activeItemInsights = useMemo(() => {
    const totalSellers = sellerProposals.length;
    const totalVariants = allCombinedVariants.length;

    const itemAllocations = Object.values(allocations).filter(a => a.rfq_item_id === item.id && a.is_selected && a.awarded_quantity > 0);

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

  /*
   * Matrix Selection Handlers
   */
  const handleToggleVariantSelection = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string, checked: boolean) => {
    const key = `${item.id}:${variant.id}`;

    setAllocations(prev => {
      const existing = prev[key];
      const currentQty = existing?.awarded_quantity || 0;
      const nextQty = checked ? currentQty : 0;

      return {
        ...prev,
        [key]: {
          rfq_item_id: item.id,
          seller_party_id: sellerPartyId,
          seller_quote_id: sellerQuoteId,
          variant_id: variant.id,
          variant_col_key: variant.colKey,
          excel_letter: variant.excelLetter,
          variant_type: variant.type.includes("Custom") ? "CUSTOM" : "SUGGESTED",
          unit_price: variant.offerPrice,
          awarded_quantity: nextQty,
          unit_of_measure: variant.unit || "PCS",
          seller_accepted: false,
          is_selected: checked,
        },
      };
    });
  };

  const handleQtyChange = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string, newQty: number | null) => {
    const qty = Math.max(0, newQty || 0);
    const key = `${item.id}:${variant.id}`;

    setAllocations(prev => {
      const currentIsSelected = prev[key]?.is_selected;
      return {
        ...prev,
        [key]: {
          rfq_item_id: item.id,
          seller_party_id: sellerPartyId,
          seller_quote_id: sellerQuoteId,
          variant_id: variant.id,
          variant_col_key: variant.colKey,
          excel_letter: variant.excelLetter,
          variant_type: variant.type.includes("Custom") ? "CUSTOM" : "SUGGESTED",
          unit_price: variant.offerPrice,
          awarded_quantity: qty,
          unit_of_measure: variant.unit || "PCS",
          seller_accepted: false,
          is_selected: qty > 0 ? true : (currentIsSelected ?? false),
        },
      };
    });
  };

  const handleQuickFullAllocation = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string) => {
    const key = `${item.id}:${variant.id}`;
    const currentVariantQty = allocations[key]?.awarded_quantity || 0;
    const targetQty = currentVariantQty + activeItemInsights.remainingQty;

    setAllocations(prev => ({
      ...prev,
      [key]: {
        rfq_item_id: item.id,
        seller_party_id: sellerPartyId,
        seller_quote_id: sellerQuoteId,
        variant_id: variant.id,
        variant_col_key: variant.colKey,
        excel_letter: variant.excelLetter,
        variant_type: variant.type.includes("Custom") ? "CUSTOM" : "SUGGESTED",
        unit_price: variant.offerPrice,
        awarded_quantity: targetQty,
        unit_of_measure: variant.unit || "PCS",
        seller_accepted: false,
        is_selected: true,
      },
    }));
  };

  /*
   * Matrix Row Definitions
   */
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
          const key = `${item.id}:${variant.id}`;
          const isSelected = !!allocations[key]?.is_selected;

          return (
            <div className="flex items-center gap-1.5">
              <Checkbox
                checked={isSelected}
                onChange={e => handleToggleVariantSelection(variant, variant.sellerName, variant.quoteNumber, e.target.checked)}
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

  const sellerAllocationsGrouped = useMemo(() => {
    if (!item?.id) return [];

    const activeAllocations = Object.values(allocations).filter(a => a.rfq_item_id === item.id && a.is_selected);

    if (activeAllocations.length === 0) return [];

    const reqQty = item.req_quantity || 1;

    const groupsMap = new Map<
      string,
      {
        sellerPartyId: string;
        sellerName: string;
        sellerQuoteId: string;
        quoteNumber: string;
        proposalRound: number;
        awardRound: number;
        quoteStatus: string;
        totalQty: number;
        totalValue: number;
        items: Array<{
          allocation: AwardAllocation;
          variant?: FlattenedVariant;
          excelLetter: string;
          variantLabel: string;
          manufacturer: string;
          brand: string;
          unitPrice: number;
          awardedQty: number;
          subtotal: number;
          sharePct: number;
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
          proposalRound: quote?.round || 1,
          awardRound: quote?.award_round || 1,
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
      const sharePct = Math.round((awardedQty / reqQty) * 100);

      group.totalQty += awardedQty;
      group.totalValue += subtotal;

      group.items.push({
        allocation: alloc,
        variant,
        excelLetter: alloc.excel_letter || variant?.excelLetter || "A",
        variantLabel: variant?.colLabel || `Variant (${alloc.variant_type})`,
        manufacturer: variant?.manufacturer || "N/A",
        brand: variant?.brand || "N/A",
        unitPrice,
        awardedQty,
        subtotal,
        sharePct,
      });
    }

    return Array.from(groupsMap.values()).map(g => ({
      ...g,
      sellerSharePct: Math.round((g.totalQty / reqQty) * 100),
    }));
  }, [item, allocations, allCombinedVariants, parties, allQuotes]);

  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [selectedSellerForRevision, setSelectedSellerForRevision] = useState<any>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const handleOpenAwardRevisionModal = (sellerGroup: any) => {
    setSelectedSellerForRevision(sellerGroup);
    setRevisionNote("");
    setRevisionModalVisible(true);
  };

  const handleConfirmAwardRevision = async () => {
    if (!selectedSellerForRevision) return;
    setSubmittingRevision(true);
    try {
      const nextAwardRound = (selectedSellerForRevision.awardRound || 1) + 1;

      await rfqDb.seller_quotes.update(selectedSellerForRevision.sellerQuoteId, {
        award_round: nextAwardRound,
        status: "REVISION_REQUIRED",
        updated_at: new Date().toISOString(),
      });

      for (const allocItem of selectedSellerForRevision.items) {
        await rfqDb.award_revision_history.add({
          id: `arh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          rfq_id: item.rfq_id,
          rfq_item_id: item.id,
          seller_party_id: selectedSellerForRevision.sellerPartyId,
          seller_quote_id: selectedSellerForRevision.sellerQuoteId,
          award_round: nextAwardRound,
          actor_type: "BUYER",
          actor_id: "buyer-user",
          variant_id: allocItem.allocation.variant_id,
          quantity: allocItem.awardedQty,
          unit_price: allocItem.unitPrice,
          note: revisionNote || undefined,
          created_at: new Date().toISOString(),
        });
      }

      message.success(
        `Award Revision Request (Award Rev R${nextAwardRound}) successfully sent to ${selectedSellerForRevision.sellerName}!`
      );
      setRevisionModalVisible(false);
      setSelectedSellerForRevision(null);
    } catch (err) {
      console.error("Failed to send award revision request:", err);
      message.error("Failed to send award revision request.");
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleClearActiveItemAllocations = () => {
    if (!item?.id) return;
    setAllocations(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.startsWith(`${item.id}:`)) {
          next[key] = {
            ...next[key],
            awarded_quantity: 0,
            is_selected: false,
          };
        }
      });
      return next;
    });
    message.info("Cleared all variant allocations for this line item.");
  };

  const hasExistingAwardRevision = useMemo(() => {
    const itemQuotes = allQuotes.filter(q => q.rfq_item_id === item.id);
    const hasRevisionQuote = itemQuotes.some(
      q => (q.award_round !== undefined && q.award_round > 1) || q.status === "REVISION_REQUIRED"
    );
    const hasAllocations = Object.values(allocations).some(
      a => a.rfq_item_id === item.id && a.is_selected && a.awarded_quantity > 0
    );
    return hasRevisionQuote || hasAllocations;
  }, [allQuotes, item.id, allocations]);

  const [cardStep, setCardStep] = useState<0 | 1>(hasExistingAwardRevision ? 1 : 0);
  const hasInitializedStep = React.useRef(false);

  useEffect(() => {
    if (!hasInitializedStep.current && hasExistingAwardRevision) {
      setCardStep(1);
      hasInitializedStep.current = true;
    }
  }, [hasExistingAwardRevision]);

  return (
    <Card size="small" className="shadow-xs border-slate-200 bg-white rounded-xl">
      <div className="space-y-3">
        {/* Product Line Item Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-indigo-50/15 to-white -mx-3 -mt-3 p-3 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/80 border border-indigo-100/60 px-2 py-0.5 rounded">
              Line Item #{item.item_index || itemIndex}
            </span>
            <h3 className="font-semibold text-slate-800 text-sm m-0">{product?.name || `RFQ Line Item #${itemIndex}`}</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
              {category?.name || "Category"}
            </span>
          </div>
          <div className="text-xs text-slate-600">
            Requested Qty: <span className="font-semibold text-slate-800">{item.req_quantity} {item.req_unit || "PCS"}</span>
          </div>
        </div>

        {/* Insights Overview Bar */}
        {/* Combined Insights & Step Navigation Header (Ant Design Descriptions with Compact Size) */}
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
            column={{ xs: 1, sm: 2, }}
            classNames={{
              label: "!py-1 !px-2.5 !text-[11px] text-slate-500 bg-slate-50/40 font-medium",
              content: "!py-1 !px-2.5 !text-xs bg-white"
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
              <strong className="text-emerald-600 font-semibold">
                {formatCurrency(activeItemInsights.allocatedTotalPrice)}
              </strong>
            </Descriptions.Item>

            {/* <Descriptions.Item label="Min Price">
              {activeItemInsights.lowestPrice > 0 ? (
                <span>
                  <span className="font-semibold text-slate-800">{formatCurrency(activeItemInsights.lowestPrice)}</span>
                  <span className="text-slate-400 text-[11px] ml-0.5">/ {item?.req_unit || "unit"}</span>
                </span>
              ) : (
                <span className="text-slate-400 text-xs">N/A</span>
              )}
            </Descriptions.Item> */}
          </Descriptions>
        </div>

        {/* Step 1: Award Variant Choose (Comparison Matrix Table) */}
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
                          key={seller.sellerId}
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
                            <div className="flex items-center justify-center gap-1 py-0.5">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 font-mono font-medium text-[10px]">
                                {variant.excelLetter}
                              </span>
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

        {/* Step 2: Award Variants Revision (Selection Insights & Seller-Wise Breakdown) */}
        {cardStep === 1 && (
          <Card size="small" className="shadow-xs border-slate-200/60 bg-white rounded-xl">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrophyOutlined className="text-amber-500/80 text-base" />
                <h3 className="text-xs font-semibold text-slate-700 tracking-wide m-0">Current Line Item Selection Insights (Seller-Wise Breakdown)</h3>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                  {sellerAllocationsGrouped.length} Awarded Supplier(s)
                </span>
              </div>
            </div>

            {sellerAllocationsGrouped.length > 0 ? (
              <div className="space-y-3">

                {/* Seller-Wise Cards List */}
                {sellerAllocationsGrouped.map(sellerGroup => (
                  <div key={sellerGroup.sellerPartyId} className="border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShopOutlined className="text-indigo-500" />
                        <span className="font-semibold text-slate-800 text-xs">{sellerGroup.sellerName}</span>
                        <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">{sellerGroup.quoteNumber}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50/70 text-slate-700 m-0">
                          Round-{sellerGroup.awardRound}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          Allocated Qty:{" "}
                          <strong className="text-slate-800 font-semibold">
                            {sellerGroup.totalQty} {item?.req_unit || "PCS"}
                          </strong>{" "}
                          <span className="text-slate-400 font-normal">({sellerGroup.sellerSharePct}% Share)</span>
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
                            {/* <th className="p-2 text-center">Line Share</th> */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sellerGroup.items.map(item => (
                            <tr key={item.allocation.variant_id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-2 border-r border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 font-mono font-medium text-[10px]">{item.excelLetter}</span>
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
                              <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">{formatCurrency(item.unitPrice)}</td>
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
                                  <Tooltip title="Quick Fill Remaining Quantity">
                                    <Button
                                      size="small"
                                      type="default"
                                      icon={<ThunderboltOutlined />}
                                      onClick={() => {
                                        if (item.variant) {
                                          handleQuickFullAllocation(item.variant, item.allocation.seller_party_id, item.allocation.seller_quote_id);
                                        }
                                      }}
                                      className="!h-7 !px-1.5 text-[10px] text-indigo-500 hover:text-indigo-600 font-medium bg-indigo-50/50 border border-indigo-100/60 rounded"
                                    />
                                  </Tooltip>
                                </div>
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right font-mono font-semibold text-emerald-600">{formatCurrency(item.subtotal)}</td>
                              {/* <td c 
                              
                              
                              
                              lassName="p-2 text-center font-mono font-medium text-indigo-600">{item.sharePct}%</td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Item-Supplier Award Revision Action Bar */}
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

        {/* Item-Supplier Award Revision Modal */}
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
                  You are requesting an Award Revision for <strong>{selectedSellerForRevision?.sellerName}</strong> on Line Item #{item.item_index || itemIndex} (
                  <strong>{product?.name || "Product"}</strong>). This will initiate <strong>Award Revision Round {(selectedSellerForRevision?.awardRound || 1) + 1}</strong> with this seller.
                </span>
              }
              className="border-sky-100 bg-sky-50/40 text-slate-600"
            />

            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Proposal Round:</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium border border-cyan-200/60 bg-cyan-50/70 text-cyan-700">Proposal R{selectedSellerForRevision?.proposalRound}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>New Award Revision Round:</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium border border-purple-200/60 bg-purple-50/70 text-purple-700">Award Rev R{(selectedSellerForRevision?.awardRound || 1) + 1}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Target Allocated Quantity:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedSellerForRevision?.totalQty} {item?.req_unit || "PCS"}
                </span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Estimated Allocation Value:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(selectedSellerForRevision?.totalValue || 0)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Revision Request Note for Seller (Optional):
              </label>
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
  allocations: Record<string, AwardAllocation>;
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

    const variantsMap = new Map<string, { colLabel: string; excelLetter: string; manufacturer: string; brand: string }>();
    let excelIdx = 0;

    for (const q of allQuotes) {
      const customVars = allProposalVariants.filter(v => v.seller_quote_id === q.id);
      const suggestedVars = allSuggestedVariants.filter(v => v.seller_quote_id === q.id);

      const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(q.id, quoteAttributes, allManufacturers, allBrands);

      for (const v of customVars) {
        const excelLetter = getExcelColumn(excelIdx++);
        variantsMap.set(v.id, {
          colLabel: `Variant ${excelLetter} (Custom)`,
          excelLetter,
          manufacturer,
          brand,
        });
      }

      for (const v of suggestedVars) {
        const excelLetter = getExcelColumn(excelIdx++);
        variantsMap.set(v.id, {
          colLabel: `Variant ${excelLetter} (${v.sku ?? "Suggested SKU"})`,
          excelLetter,
          manufacturer,
          brand,
        });
      }
    }

    return rfqItems.map((item, index) => {
      const product = catalogProducts.find(p => p.id === item.catalog_product_id);
      const category = categories.find(c => c.id === item.category_id);

      const itemAllocations = Object.values(allocations).filter(a => a.rfq_item_id === item.id && a.is_selected && a.awarded_quantity > 0);

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
        const sharePct = Math.round((awardedQty / reqQty) * 100);

        return {
          allocation: alloc,
          sellerName: sellerPartyName,
          quoteNumber: quote?.seller_quote_number || "Quote Proposal",
          excelLetter: alloc.excel_letter || variantInfo?.excelLetter || "A",
          variantLabel: variantInfo?.colLabel || `Variant (${alloc.variant_type})`,
          manufacturer: variantInfo?.manufacturer || "N/A",
          brand: variantInfo?.brand || "N/A",
          unitPrice,
          awardedQty,
          subtotal,
          sharePct,
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
  }, [rfqItems, allocations, catalogProducts, categories, parties, allQuotes, allProposalVariants, allSuggestedVariants, quoteAttributes, allManufacturers, allBrands]);

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
            content: "text-xs p-1"
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
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                {group.categoryName}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Requested Qty: <strong className="text-slate-800 font-semibold">{group.reqQty} {group.reqUnit}</strong>
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
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-sky-200/60 bg-sky-50/70 text-sky-700 m-0">
                  ✓ 100% Allocated
                </span>
              ) : group.totalAllocatedQty > group.reqQty ? (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-rose-200/60 bg-rose-50/70 text-rose-700 m-0">
                  ⚠ Over Allocated
                </span>
              ) : group.totalAllocatedQty > 0 ? (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-amber-200/60 bg-amber-50/70 text-amber-700 m-0">
                  Partially Allocated
                </span>
              ) : (
                <span className="font-medium text-[10px] px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50 text-slate-500 m-0">
                  Unallocated
                </span>
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
                    <th className="p-2 border-r border-slate-100 text-right">Subtotal</th>
                    <th className="p-2 text-center">Line Share</th>
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
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 font-mono font-medium text-[10px]">
                            {row.excelLetter}
                          </span>
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
                      <td className="p-2 border-r border-slate-100 text-right font-mono font-medium text-slate-700">
                        {formatCurrency(row.unitPrice)}
                      </td>
                      <td className="p-2 border-r border-slate-100 text-right font-medium text-slate-800">
                        {row.awardedQty} {group.reqUnit}
                      </td>
                      <td className="p-2 border-r border-slate-100 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(row.subtotal)}
                      </td>
                      <td className="p-2 text-center font-mono font-medium text-indigo-600">{row.sharePct}%</td>
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
  allocations: Record<string, AwardAllocation>;
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
    let excelIndex = 0;

    for (const quote of allQuotes) {
      const sellerName = partiesMap.get(quote.seller_party_id) ?? `Supplier (${quote.seller_party_id})`;
      const customVars = customMap.get(quote.id) || [];
      const suggestedVars = suggestedMap.get(quote.id) || [];

      const { manufacturer, brand } = extractMfgBrandFromQuoteAttrs(quote.id, quoteAttributes, allManufacturers, allBrands);

      for (const variant of customVars) {
        const offerPrice = variant.offer_price ?? 0;
        const excelLetter = getExcelColumn(excelIndex++);
        result.push({
          id: variant.id,
          colKey: `col_${variant.id}`,
          excelLetter,
          colLabel: `Variant ${excelLetter} (Custom)`,
          type: "New proposal option",
          offerPrice,
          offerQuantity: quote.offer_quantity ?? 1,
          unit: quote.offer_unit ?? "PCS",
          totalPrice: offerPrice * (quote.offer_quantity ?? 1),
          manufacturer,
          brand,
          sellerName,
          quoteNumber: quote.seller_quote_number,
          quoteStatus: quote.status,
        });
      }

      for (const variant of suggestedVars) {
        const offerPrice = variant.offer_price ?? variant.list_price ?? 0;
        const excelLetter = getExcelColumn(excelIndex++);
        result.push({
          id: variant.id,
          colKey: `col_${variant.id}`,
          excelLetter,
          colLabel: `Variant ${excelLetter} (${variant.sku ?? "Suggested SKU"})`,
          type: "Catalog Suggested SKU",
          offerPrice,
          offerQuantity: quote.offer_quantity ?? 1,
          unit: quote.offer_unit ?? "PCS",
          totalPrice: offerPrice * (quote.offer_quantity ?? 1),
          manufacturer,
          brand,
          sellerName,
          quoteNumber: quote.seller_quote_number,
          quoteStatus: quote.status,
        });
      }
    }
    return result;
  }, [allQuotes, allProposalVariants, allSuggestedVariants, quoteAttributes, parties, allManufacturers, allBrands]);

  const rfqAwardSummaryBySeller = useMemo(() => {
    if (!rfqId) return [];

    const activeAllocations = Object.values(allocations).filter(a => a.is_selected && a.awarded_quantity > 0);

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
          excelLetter: string;
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
          excelLetter: variant?.excelLetter || "A",
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
          excelLetter: alloc.excel_letter || variant?.excelLetter || "A",
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
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${isFinalized ? "border-emerald-200/60 bg-emerald-50/70 text-emerald-700" : "border-sky-200/60 bg-sky-50/70 text-sky-700"}`}>
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
            content: "text-xs p-1"
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
                  <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">{sellerGroup.quoteNumber}</span>
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
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 font-mono font-medium text-[10px]">{item.excelLetter}</span>
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
