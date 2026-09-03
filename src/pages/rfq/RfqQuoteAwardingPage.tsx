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
} from "@ant-design/icons";

import {
  rfqDb,
  type RfqItem,
  type RfqAwardHeader,
  type RfqAwardItem,
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
      existingAwardHeaders,
      existingAwardItems,
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
      rfqDb.rfq_award_headers.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.rfq_award_items.where("rfq_id").equals(rfqId).toArray(),
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
      existingAwardHeaders,
      existingAwardItems,
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
    existingAwardHeaders = [],
    existingAwardItems = [],
    existingPurchaseOrders = [],
    existingPoAcknowledgements = [],
  } = pageData ?? {};

  /*
   * Seed Allocations State from DB
   */
  useEffect(() => {
    const currentHeader = existingAwardHeaders[0];
    if (currentHeader?.draft_snapshot) {
      try {
        const parsed = JSON.parse(currentHeader.draft_snapshot);
        setAllocations(prev => ({ ...parsed, ...prev }));
        return;
      } catch (err) {
        console.error("Failed to parse draft_snapshot", err);
      }
    }

    if (existingAwardItems.length > 0) {
      const initialMap: Record<string, AwardAllocation> = {};
      existingAwardItems.forEach(item => {
        const key = `${item.rfq_item_id}:${item.variant_id}`;
        initialMap[key] = {
          rfq_item_id: item.rfq_item_id,
          seller_party_id: item.seller_party_id,
          seller_quote_id: item.seller_quote_id,
          variant_id: item.variant_id,
          variant_col_key: `col_${item.variant_id}`,
          excel_letter: "",
          variant_type: item.variant_type,
          unit_price: item.unit_price,
          awarded_quantity: item.awarded_quantity,
          unit_of_measure: "PCS",
          seller_accepted: item.seller_accepted,
          is_selected: item.awarded_quantity > 0 || true,
        };
      });
      setAllocations(prev => ({ ...initialMap, ...prev }));
    }
  }, [existingAwardHeaders, existingAwardItems]);

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
    const headerId = `award-proc-${rfqId}`;

    const activeAllocations = Object.values(allocations).filter(a => a.is_selected && a.awarded_quantity > 0);
    const totalAmount = activeAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);

    const headerRecord: RfqAwardHeader = {
      id: headerId,
      rfq_id: rfqId,
      process_status: "DRAFT",
      created_by_user_id: currentUserId || "usr-1",
      total_awarded_amount: totalAmount,
      draft_snapshot: JSON.stringify(allocations),
      updated_at: now,
      created_at: existingAwardHeaders[0]?.created_at || now,
    };

    const itemRecords: RfqAwardItem[] = activeAllocations.map(a => ({
      id: `award-item-${a.rfq_item_id}-${a.variant_id}`,
      award_header_id: headerId,
      rfq_id: rfqId,
      rfq_item_id: a.rfq_item_id,
      seller_party_id: a.seller_party_id,
      seller_quote_id: a.seller_quote_id,
      variant_id: a.variant_id,
      variant_type: a.variant_type,
      unit_price: a.unit_price,
      awarded_quantity: a.awarded_quantity,
      total_price: a.unit_price * a.awarded_quantity,
      seller_accepted: a.seller_accepted ?? false,
      updated_at: now,
      created_at: now,
    }));

    await rfqDb.rfq_award_headers.put(headerRecord);
    await rfqDb.rfq_award_items.where("rfq_id").equals(rfqId).delete();
    if (itemRecords.length > 0) {
      await rfqDb.rfq_award_items.bulkPut(itemRecords);
    }
    message.success("Draft award allocations saved successfully.");
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
    const headerId = `award-proc-${rfqId}`;
    const totalAmount = activeAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);

    const headerRecord: RfqAwardHeader = {
      id: headerId,
      rfq_id: rfqId,
      process_status: "AWARD_FINALIZED",
      created_by_user_id: currentUserId || "usr-1",
      total_awarded_amount: totalAmount,
      updated_at: now,
      created_at: existingAwardHeaders[0]?.created_at || now,
    };
    await rfqDb.rfq_award_headers.put(headerRecord);

    const sellerGroups: Record<string, AwardAllocation[]> = {};
    activeAllocations.forEach(a => {
      if (!sellerGroups[a.seller_party_id]) sellerGroups[a.seller_party_id] = [];
      sellerGroups[a.seller_party_id].push(a);
    });

    const poRecords: PurchaseOrder[] = [];
    const poItemRecords: PurchaseOrderItem[] = [];
    const poAckRecords: PoAcknowledgement[] = [];
    const itemRecords: RfqAwardItem[] = [];

    let poCounter = existingPurchaseOrders.length + 1;

    for (const [sellerPartyId, sellerAllocations] of Object.entries(sellerGroups)) {
      const poId = `po-${rfqId}-${sellerPartyId}`;
      const poNumber = `PO-2026-${String(poCounter++).padStart(3, "0")}`;
      const sellerTotal = sellerAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);

      const buyerPartyId = activePartyId || "pty-buyer";

      poRecords.push({
        id: poId,
        po_number: poNumber,
        rfq_id: rfqId,
        award_header_id: headerId,
        buyer_party_id: buyerPartyId,
        seller_party_id: sellerPartyId,
        total_amount: sellerTotal,
        currency: "USD",
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

      sellerAllocations.forEach(a => {
        const awardItemId = `award-item-${a.rfq_item_id}-${a.variant_id}`;
        itemRecords.push({
          id: awardItemId,
          award_header_id: headerId,
          rfq_id: rfqId,
          rfq_item_id: a.rfq_item_id,
          seller_party_id: a.seller_party_id,
          seller_quote_id: a.seller_quote_id,
          variant_id: a.variant_id,
          variant_type: a.variant_type,
          award_round: 1,
          buyer_target_quantity: a.awarded_quantity,
          seller_offered_quantity: a.awarded_quantity,
          unit_price: a.unit_price,
          awarded_quantity: a.awarded_quantity,
          total_price: a.unit_price * a.awarded_quantity,
          unit_of_measure: a.unit_of_measure || "PCS",
          award_item_status: "CONFIRMED",
          seller_accepted: true,
          seller_accepted_at: now,
          buyer_accepted: true,
          buyer_accepted_at: now,
          purchase_order_id: poId,
          updated_at: now,
          created_at: now,
        });

        poItemRecords.push({
          id: `po-item-${poId}-${a.variant_id}`,
          purchase_order_id: poId,
          award_item_id: awardItemId,
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

    await rfqDb.rfq_award_items.where("rfq_id").equals(rfqId).delete();
    await rfqDb.rfq_award_items.bulkPut(itemRecords);

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
      description: `Successfully generated ${poRecords.length} Purchase Order(s) for awarded suppliers.`,
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

  const currentProcessHeader = existingAwardHeaders[0];
  const isFinalized = currentProcessHeader?.process_status === "AWARD_FINALIZED" || currentProcessHeader?.process_status === "PO_GENERATED";

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
          <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
            <Button size="small" icon={<SaveOutlined />} onClick={handleSaveDraft} className="text-xs font-semibold">
              Save Allocation Draft
            </Button>

            <Button
              type="primary"
              size="middle"
              onClick={() => setViewMode("item_summary")}
              className="bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs flex items-center gap-1.5"
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
          <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
            <Button
              size="middle"
              icon={<ArrowLeftOutlined />}
              onClick={() => setViewMode("matrix")}
              className="text-xs font-semibold"
            >
              Back to Line Items Matrix
            </Button>

            <div className="flex items-center gap-2">
              {/* <Button size="small" icon={<SaveOutlined />} onClick={handleSaveDraft} className="text-xs font-semibold">
                Save Draft
              </Button> */}

              <Button
                type="primary"
                size="middle"
                onClick={() => setViewMode("summary")}
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs flex items-center gap-1.5"
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
            currentProcessHeader={currentProcessHeader}
            isFinalized={isFinalized}
            allocations={allocations}
            existingAwardItems={existingAwardItems}
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
          <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
            <Button
              size="middle"
              icon={<ArrowLeftOutlined />}
              onClick={() => setViewMode("item_summary")}
              className="text-xs font-semibold"
            >
              Back to Item-Wise Allocations
            </Button>

            <div className="flex items-center gap-2">
              {/* <Button size="small" icon={<SaveOutlined />} onClick={handleSaveDraft} className="text-xs font-semibold">
                Save Draft
              </Button> */}

              <Button
                type="primary"
                size="middle"
                icon={<CheckCircleOutlined />}
                onClick={handleFinalizeAndGeneratePOs}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs"
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
    <Card size="small" className="shadow-sm border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">Quote Award Revision Workspace</h1>
            {isFinalized ? (
              <AntTag color="emerald" className="font-bold text-xs">
                FINALIZED
              </AntTag>
            ) : (
              <AntTag color="blue" className="font-bold text-xs">
                AWARD REVISION
              </AntTag>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Item-Seller Award Revision & PO Generation: Evaluate proposals, negotiate item-wise seller allocations with revision rounds, and release Purchase Orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* <Button size="small" icon={<SaveOutlined />} onClick={onSaveDraft} className="text-xs font-semibold">
            Save Draft
          </Button> */}

          {viewMode === "summary" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={onFinalize}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
            >
              Finalize & Generate POs
            </Button>
          )}

          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">RFQ: {rfqNumber}</span>
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
            <AntTag color="purple" className="text-xs font-medium m-0">
              {variant.manufacturer}
            </AntTag>
            <AntTag color="blue" className="text-xs font-medium m-0">
              {variant.brand}
            </AntTag>
          </div>
        ),
      },
      {
        key: "offer_price",
        attributeName: "Offer Price (Unit)",
        getValue: (variant: FlattenedVariant) => <span className="font-bold text-emerald-700 text-xs">{formatCurrency(variant.offerPrice)}</span>,
      },
      {
        key: "offer_quantity",
        attributeName: "Offer Quantity",
        getValue: (variant: FlattenedVariant) => (
          <span className="font-semibold text-slate-800 text-xs">
            {variant.offerQuantity} {variant.unit}
          </span>
        ),
      },
      {
        key: "total_price",
        attributeName: "Total Price",
        getValue: (variant: FlattenedVariant) => <span className="font-bold text-slate-900 text-xs">{formatCurrency(variant.totalPrice)}</span>,
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
                  <span className="text-indigo-600 font-bold text-xs">Selected</span>
                ) : (
                  <span className="text-slate-500 text-xs">Select Option</span>
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

  return (
    <Card size="small" className="shadow-sm border-slate-200 bg-white">
      <div className="space-y-3">
        {/* Product Line Item Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 bg-slate-50/80 -mx-3 -mt-3 p-3 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Line Item #{item.item_index || itemIndex}
            </span>
            <h3 className="font-bold text-slate-900 text-sm m-0">{product?.name || `RFQ Line Item #${itemIndex}`}</h3>
            <AntTag color="blue" className="text-[11px] font-medium m-0">
              {category?.name || "Category"}
            </AntTag>
          </div>
          <div className="text-xs font-semibold text-slate-700">
            Requested Qty: <span className="font-bold text-slate-900">{item.req_quantity} {item.req_unit || "PCS"}</span>
          </div>
        </div>

        {/* Insights Overview Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3.5 text-slate-700">
            <span className="flex items-center gap-1 font-medium">
              <ShopOutlined className="text-slate-400" />
              <span>Proposals:</span>
              <strong className="text-slate-900">{activeItemInsights.totalSellers} Sellers</strong>
              <span className="text-slate-400 font-normal">({activeItemInsights.totalVariants} Var)</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1 font-medium">
              <CheckCircleOutlined className="text-slate-400" />
              <span>Allocated:</span>
              <strong className="text-slate-900">{activeItemInsights.allocatedSellersCount} Sellers</strong>
              <span className="text-slate-400 font-normal">({activeItemInsights.allocatedVariantsCount} Var)</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1 font-medium">
              <span>Qty:</span>
              <strong className="text-slate-900">
                {activeItemInsights.allocatedQty} / {activeItemInsights.reqQty} {item?.req_unit || "PCS"}
              </strong>
              <span className="text-slate-400 font-normal text-xs">(Rem: {activeItemInsights.remainingQty})</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1 font-medium">
              <span>Value:</span>
              <strong className="text-slate-900">{formatCurrency(activeItemInsights.allocatedTotalPrice)}</strong>
            </span>

            {activeItemInsights.lowestPrice > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 font-medium">
                  <span>Min Price:</span>
                  <strong className="text-slate-900">{formatCurrency(activeItemInsights.lowestPrice)}</strong>
                  <span className="text-slate-400 font-normal">/ {item?.req_unit || "unit"}</span>
                </span>
              </>
            )}
          </div>

          <div>
            {activeItemInsights.allocatedQty === activeItemInsights.reqQty && activeItemInsights.reqQty > 0 ? (
              <AntTag color="blue" className="px-2 py-0 text-[11px] font-medium rounded m-0 border-blue-200 bg-blue-50 text-blue-700">
                ✓ 100% Fully Allocated
              </AntTag>
            ) : activeItemInsights.allocatedQty > activeItemInsights.reqQty ? (
              <AntTag color="red" className="px-2 py-0 text-[11px] font-medium rounded m-0 border-red-200 bg-red-50 text-red-700">
                ⚠ Over Allocated (+{activeItemInsights.allocatedQty - activeItemInsights.reqQty})
              </AntTag>
            ) : (
              <AntTag color="default" className="px-2 py-0 text-[11px] font-medium rounded m-0 border-slate-200 bg-slate-100 text-slate-700">
                Partially Allocated
              </AntTag>
            )}
          </div>
        </div>

        {/* Comparison Matrix Table */}
        {allCombinedVariants.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border border-slate-200 rounded-lg shadow-sm bg-white">
            <table className="w-full border-separate border-spacing-0 text-xs text-left">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 top-0 z-30 bg-slate-100 border-r border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-800 text-xs min-w-[220px]"
                  >
                    Basic Attribute
                  </th>
                  {sellerProposals.map(seller => (
                    <th
                      key={seller.sellerId}
                      colSpan={seller.variants.length}
                      className="sticky top-0 z-20 text-center font-bold text-slate-900 bg-slate-100 border-r border-b border-slate-200 py-1.5 px-3 text-xs"
                    >
                      <div>{seller.sellerName}</div>
                      <div className="text-[10px] font-mono text-slate-500 font-normal">{seller.quoteNumber}</div>
                    </th>
                  ))}
                </tr>

                <tr>
                  {sellerProposals.map(seller =>
                    seller.variants.map(variant => (
                      <th
                        key={variant.id}
                        className="sticky top-[38px] z-20 text-center font-medium text-slate-800 bg-slate-50 border-r border-b border-slate-200 py-1 px-3 text-xs min-w-[180px]"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]">
                            {variant.excelLetter}
                          </span>
                          <span className="font-medium text-slate-800 text-xs">{variant.colLabel}</span>
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
                        className={`sticky left-0 z-10 ${rowBg} border-r border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 text-xs min-w-[220px]`}
                      >
                        {row.attributeName}
                      </th>

                      {allCombinedVariants.map(variant => (
                        <td key={variant.colKey} className="border-r border-b border-slate-200 text-xs px-3 py-2 min-w-[180px]">
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
            className="my-3"
          />
        )}

        <Card size="small" className="shadow-sm border-slate-200 bg-white">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrophyOutlined className="text-amber-500 text-base" />
              <h3 className="text-xs font-bold text-slate-800 tracking-wider m-0">Current Line Item Selection Insights (Seller-Wise Breakdown)</h3>
              <AntTag color="blue" className="text-[11px] font-semibold m-0">
                {sellerAllocationsGrouped.length} Awarded Supplier(s)
              </AntTag>
            </div>

            {sellerAllocationsGrouped.length > 0 && (
              <Button size="small" type="text" danger onClick={handleClearActiveItemAllocations} className="text-xs font-semibold">
                Clear Line Allocations
              </Button>
            )}
          </div>

          {sellerAllocationsGrouped.length > 0 ? (
            <div className="space-y-3">

              {/* Grand Total Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-md">
                <div className="flex items-center gap-3 text-slate-700">
                  <span>
                    Awarded Sellers: <strong className="text-slate-900">{sellerAllocationsGrouped.length} Sellers</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Awarded Variants: <strong className="text-slate-900">{activeItemInsights.allocatedVariantsCount} Variants</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Grand Total Qty:{" "}
                    <strong className="text-indigo-700">
                      {activeItemInsights.allocatedQty} / {activeItemInsights.reqQty} {item?.req_unit || "PCS"}
                    </strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Grand Total Value: <strong className="text-emerald-700">{formatCurrency(activeItemInsights.allocatedTotalPrice)}</strong>
                  </span>
                </div>

                <div>
                  {activeItemInsights.allocatedQty === activeItemInsights.reqQty && activeItemInsights.reqQty > 0 ? (
                    <AntTag color="blue" className="font-semibold text-xs m-0">
                      ✓ 100% Fully Allocated
                    </AntTag>
                  ) : activeItemInsights.allocatedQty > activeItemInsights.reqQty ? (
                    <AntTag color="red" className="font-semibold text-xs m-0">
                      ⚠ Over Allocated (+{activeItemInsights.allocatedQty - activeItemInsights.reqQty})
                    </AntTag>
                  ) : (
                    <AntTag color="default" className="font-semibold text-xs m-0">
                      Partially Allocated
                    </AntTag>
                  )}
                </div>
              </div>

              {/* Seller-Wise Cards List */}
              {sellerAllocationsGrouped.map(sellerGroup => (
                <div key={sellerGroup.sellerPartyId} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShopOutlined className="text-indigo-600" />
                      <span className="font-bold text-slate-900 text-xs">{sellerGroup.sellerName}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{sellerGroup.quoteNumber}</span>
                      <AntTag color="cyan" className="text-[10px] font-semibold m-0">
                        Proposal R{sellerGroup.proposalRound}
                      </AntTag>
                      <AntTag color="purple" className="text-[10px] font-semibold m-0">
                        Award Rev R{sellerGroup.awardRound}
                      </AntTag>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-600">
                        Allocated Qty:{" "}
                        <strong className="text-slate-900">
                          {sellerGroup.totalQty} {item?.req_unit || "PCS"}
                        </strong>{" "}
                        <span className="text-slate-400 font-normal">({sellerGroup.sellerSharePct}% Share)</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-600">
                        Supplier Total: <strong className="text-emerald-700">{formatCurrency(sellerGroup.totalValue)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left bg-white border-collapse">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2 border-r border-slate-200">Variant Option</th>
                          <th className="p-2 border-r border-slate-200">Manufacturer / Brand</th>
                          <th className="p-2 border-r border-slate-200 text-right">Unit Price</th>
                          <th className="p-2 border-r border-slate-200 text-right">Awarded Qty</th>
                          <th className="p-2 border-r border-slate-200 text-right">Subtotal</th>
                          <th className="p-2 text-center">Line Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sellerGroup.items.map(item => (
                          <tr key={item.allocation.variant_id}>
                            <td className="p-2 border-r border-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px]">{item.excelLetter}</span>
                                <span className="font-semibold text-slate-800 text-xs">{item.variantLabel}</span>
                              </div>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <div className="flex items-center gap-1">
                                <AntTag color="purple" className="text-[10px] m-0">
                                  {item.manufacturer}
                                </AntTag>
                                <AntTag color="blue" className="text-[10px] m-0">
                                  {item.brand}
                                </AntTag>
                              </div>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-800">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 border-r border-slate-200 text-right">
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
                                  className="!w-24 text-[11px] !h-7 font-mono font-bold"
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
                                    className="!h-7 !px-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                                  />
                                </Tooltip>
                              </div>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">{formatCurrency(item.subtotal)}</td>
                            <td className="p-2 text-center font-mono font-semibold text-indigo-600">{item.sharePct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Item-Supplier Award Revision Action Bar */}
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      {sellerGroup.quoteStatus === "REVISION_REQUIRED" ? (
                        <AntTag color="orange" className="font-semibold text-xs m-0">
                          Award Revision Requested (Awaiting Seller Response)
                        </AntTag>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          Revise allocated quantities and send award revision request directly to this seller.
                        </span>
                      )}
                    </div>

                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<SendOutlined />}
                      onClick={() => handleOpenAwardRevisionModal(sellerGroup)}
                      className="text-xs font-semibold"
                    >
                      Send Award Revision Request to {sellerGroup.sellerName} (Award Rev R{sellerGroup.awardRound + 1})
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
              className="my-1"
            />
          )}
        </Card>

        {/* Item-Supplier Award Revision Modal */}
        <Modal
          open={revisionModalVisible}
          title={
            <div className="flex items-center gap-2">
              <SendOutlined className="text-indigo-600" />
              <span>Send Award Revision Request</span>
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
          okButtonProps={{ className: "bg-indigo-600 hover:bg-indigo-700 font-semibold" }}
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
            />

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Proposal Round:</span>
                <AntTag color="cyan">Proposal R{selectedSellerForRevision?.proposalRound}</AntTag>
              </div>
              <div className="flex justify-between font-semibold text-slate-700">
                <span>New Award Revision Round:</span>
                <AntTag color="purple">Award Rev R{(selectedSellerForRevision?.awardRound || 1) + 1}</AntTag>
              </div>
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Target Allocated Quantity:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedSellerForRevision?.totalQty} {item?.req_unit || "PCS"}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Estimated Allocation Value:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(selectedSellerForRevision?.totalValue || 0)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Revision Request Note for Seller (Optional):
              </label>
              <Input.TextArea
                rows={3}
                placeholder="e.g. Please confirm if you can supply 300 PCS at $245 within 14 days lead time."
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                className="text-xs"
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
      <Card size="small" className="shadow-sm border-slate-200 bg-white">
        <Descriptions
          title={
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UnorderedListOutlined className="text-indigo-600" />
                Item-Wise Seller Award Allocations Overview
              </span>
              <AntTag color="blue" className="font-bold">
                {allocatedItemsCount} of {rfqItems.length} Line Items Allocated
              </AntTag>
            </div>
          }
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          className="mt-2"
          classNames={{
            label: "text-xs p-1",
            content: "text-xs p-1"
          }}
        >
          <Descriptions.Item label="Total RFQ Line Items">
            <span className="font-bold text-slate-800">{rfqItems.length} Line Items</span>
          </Descriptions.Item>
          <Descriptions.Item label="Allocated Line Items">
            <span className="font-semibold text-indigo-700">{allocatedItemsCount} Items</span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Awarded Value">
            <span className="font-bold text-emerald-700">{formatCurrency(grandTotalValue)}</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* List of RFQ Items with Awarded Seller Variants */}
      {itemWiseGroups.map(group => (
        <Card key={group.item.id} size="small" className="shadow-sm border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-100/90 px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 mb-2 rounded-t-md">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                Line Item #{group.itemNumber}
              </span>
              <span className="font-bold text-slate-900 text-xs">{group.productName}</span>
              <AntTag color="blue" className="text-[10px] m-0">
                {group.categoryName}
              </AntTag>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600">
                Requested Qty: <strong className="text-slate-900">{group.reqQty} {group.reqUnit}</strong>
              </span>

              <span className="text-slate-300">|</span>

              <span className="text-slate-600">
                Allocated:{" "}
                <strong className="text-indigo-700">
                  {group.totalAllocatedQty} / {group.reqQty} {group.reqUnit}
                </strong>
              </span>

              <span className="text-slate-300">|</span>

              <span className="text-slate-600">
                Item Value: <strong className="text-emerald-700">{formatCurrency(group.totalItemValue)}</strong>
              </span>

              {group.totalAllocatedQty === group.reqQty && group.reqQty > 0 ? (
                <AntTag color="blue" className="font-semibold text-[10px] m-0">
                  ✓ 100% Allocated
                </AntTag>
              ) : group.totalAllocatedQty > group.reqQty ? (
                <AntTag color="red" className="font-semibold text-[10px] m-0">
                  ⚠ Over Allocated
                </AntTag>
              ) : group.totalAllocatedQty > 0 ? (
                <AntTag color="amber" className="font-semibold text-[10px] m-0">
                  Partially Allocated
                </AntTag>
              ) : (
                <AntTag color="default" className="font-semibold text-[10px] m-0">
                  Unallocated
                </AntTag>
              )}
            </div>
          </div>

          {group.allocatedRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Supplier Name & Quote #</th>
                    <th className="p-2 border-r border-slate-200">Awarded Variant Option</th>
                    <th className="p-2 border-r border-slate-200">Manufacturer / Brand</th>
                    <th className="p-2 border-r border-slate-200 text-right">Unit Price</th>
                    <th className="p-2 border-r border-slate-200 text-right">Awarded Quantity</th>
                    <th className="p-2 border-r border-slate-200 text-right">Subtotal</th>
                    <th className="p-2 text-center">Line Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {group.allocatedRows.map(row => (
                    <tr key={row.allocation.variant_id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <ShopOutlined className="text-indigo-600" />
                          <span className="font-semibold text-slate-900">{row.sellerName}</span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                            {row.quoteNumber}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px]">
                            {row.excelLetter}
                          </span>
                          <span className="font-medium text-slate-800">{row.variantLabel}</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="flex items-center gap-1">
                          <AntTag color="purple" className="text-[10px] m-0">
                            {row.manufacturer}
                          </AntTag>
                          <AntTag color="blue" className="text-[10px] m-0">
                            {row.brand}
                          </AntTag>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(row.unitPrice)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-semibold text-slate-900">
                        {row.awardedQty} {group.reqUnit}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(row.subtotal)}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold text-indigo-600">{row.sharePct}%</td>
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
              className="my-1"
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
  currentProcessHeader?: RfqAwardHeader;
  isFinalized: boolean;
  allocations: Record<string, AwardAllocation>;
  existingAwardItems: RfqAwardItem[];
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
      <Card size="small" className="shadow-sm border-slate-200 bg-white">
        <Descriptions
          title={
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrophyOutlined className="text-amber-500" />
                Final Sourcing Contract Award Summary (Supplier-Wise Preview)
              </span>
              <AntTag color={isFinalized ? "emerald" : "blue"} className="font-bold">
                {currentProcessHeader?.process_status || (rfqAwardSummaryBySeller.length > 0 ? "DRAFT ALLOCATION" : "NO AWARDS")}
              </AntTag>
            </div>
          }
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 4 }}
          className="mt-2 text-xs"
        >
          <Descriptions.Item label="RFQ Number">
            <span className="font-mono font-bold text-slate-800">{rfq?.rfq_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Contract Award Value">
            <span className="font-bold text-emerald-700">
              {formatCurrency(currentProcessHeader?.total_awarded_amount || rfqAwardSummaryBySeller.reduce((s, g) => s + g.totalAmount, 0))}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Awarded Suppliers Count">
            <span className="font-semibold text-slate-900">{rfqAwardSummaryBySeller.length} Supplier(s)</span>
          </Descriptions.Item>
          <Descriptions.Item label="Generated Purchase Orders">
            <span className="font-semibold text-slate-900">{existingPurchaseOrders.length} PO(s)</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {rfqAwardSummaryBySeller.length > 0 ? (
        <div className="space-y-4">
          {rfqAwardSummaryBySeller.map(sellerGroup => (
            <Card key={sellerGroup.sellerPartyId} size="small" className="shadow-sm border-slate-200 bg-white overflow-hidden">
              {/* Seller Header */}
              <div className="bg-slate-100/90 px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 mb-2 rounded-t-md">
                <div className="flex items-center gap-2">
                  <ShopOutlined className="text-indigo-600 text-sm" />
                  <span className="font-bold text-slate-900 text-xs">{sellerGroup.sellerName}</span>
                  <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{sellerGroup.quoteNumber}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {sellerGroup.purchaseOrder && (
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {sellerGroup.purchaseOrder.po_number}
                    </span>
                  )}

                  {sellerGroup.poAcknowledgement?.buyer_confirmed ? (
                    <AntTag color="emerald" className="font-semibold text-[10px] m-0">
                      PO Released ✓
                    </AntTag>
                  ) : (
                    <AntTag color="amber" className="font-semibold text-[10px] m-0">
                      PO Pending Release
                    </AntTag>
                  )}

                  {sellerGroup.poAcknowledgement?.seller_acknowledged ? (
                    <AntTag color="emerald" className="font-semibold text-[10px] m-0">
                      Seller Acknowledged ✓
                    </AntTag>
                  ) : (
                    <AntTag color="purple" className="font-semibold text-[10px] m-0">
                      Awaiting Confirmation...
                    </AntTag>
                  )}

                  <span className="text-slate-300">|</span>
                  <span className="text-slate-700">
                    Contract Total: <strong className="text-emerald-700">{formatCurrency(sellerGroup.totalAmount)}</strong>
                  </span>
                </div>
              </div>

              {/* Awarded Items Table for this Seller */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Line Item # & Product</th>
                      <th className="p-2 border-r border-slate-200">Category</th>
                      <th className="p-2 border-r border-slate-200">Awarded Variant Option</th>
                      <th className="p-2 border-r border-slate-200">Manufacturer / Brand</th>
                      <th className="p-2 border-r border-slate-200 text-right">Unit Price</th>
                      <th className="p-2 border-r border-slate-200 text-right">Awarded Quantity</th>
                      <th className="p-2 text-right">Line Item Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {sellerGroup.items.map(item => (
                      <tr key={`${item.rfqItemId}-${item.variantId}`} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-semibold text-slate-900">
                            Line Item #{item.itemIndex}: {item.productName}
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <AntTag color="blue" className="text-[10px] m-0">
                            {item.categoryName}
                          </AntTag>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px]">{item.excelLetter}</span>
                            <span className="font-medium text-slate-800">{item.variantLabel}</span>
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="flex items-center gap-1">
                            <AntTag color="purple" className="text-[10px] m-0">
                              {item.manufacturer}
                            </AntTag>
                            <AntTag color="blue" className="text-[10px] m-0">
                              {item.brand}
                            </AntTag>
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-800">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 border-r border-slate-200 text-right font-semibold text-slate-900">
                          {item.awardedQuantity} {item.unitOfMeasure}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatCurrency(item.totalPrice)}</td>
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
        />
      )}
    </div>
  );
};
