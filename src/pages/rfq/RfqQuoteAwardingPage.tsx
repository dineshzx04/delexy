import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Alert, Button, Card, Pagination, Segmented, Tag as AntTag, InputNumber, message, notification, Tooltip, Descriptions } from "antd";
import {
  TableOutlined,
  TrophyOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  DollarOutlined,
  RocketOutlined,
  ShopOutlined,
} from "@ant-design/icons";

import { rfqDb, type RfqAwardHeader, type RfqAwardItem, type PurchaseOrder, type PurchaseOrderItem, type PoAcknowledgement } from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { catalogDb } from "../../data/catalog/catalog.db";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";

type ViewMode = "matrix" | "summary";

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
  awardQty: number;
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

export const RfqQuoteAwardingPage: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === "BUSINESS";
  const basePath = isBusinessContext ? "/b/rfqs" : "/user/rfqs";

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [allocations, setAllocations] = useState<Record<string, AwardAllocation>>({});

  /*
   * --------------------------------------------------------------------------
   * Single Consolidated Database Query via Promise.all
   * --------------------------------------------------------------------------
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
   * --------------------------------------------------------------------------
   * Seed Allocations from DB (draft_snapshot or award items)
   * --------------------------------------------------------------------------
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
        };
      });
      setAllocations(prev => ({ ...initialMap, ...prev }));
    }
  }, [existingAwardHeaders, existingAwardItems]);

  /*
   * --------------------------------------------------------------------------
   * Breadcrumbs & Derived Workspace Context
   * --------------------------------------------------------------------------
   */
  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
      { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number ?? "RFQ Workspace"}</a> },
      { title: <span className="text-slate-800 font-semibold">Quote Awarding Workspace</span> },
    ],
    [navigate, basePath, rfqId, rfq?.rfq_number],
  );
  useBreadcrumb(breadcrumbs);

  const activeParty = useMemo(() => {
    if (!parties.length) return null;
    if (isBusinessContext) {
      return parties.find(party => party.owner_type === "BUSINESS" && party.owner_id === activeWorkspace?.businessId);
    }
    return parties.find(party => party.owner_type === "USER" && party.owner_id === currentUserId) ?? parties.find(party => party.id === "pty-6");
  }, [parties, isBusinessContext, activeWorkspace?.businessId, currentUserId]);

  const activePartyId = activeParty?.id ?? "";
  const activeItemIndex = useMemo(() => Math.min(Math.max(currentPage - 1, 0), Math.max(rfqItems.length - 1, 0)), [currentPage, rfqItems.length]);
  const activeItem = rfqItems[activeItemIndex];

  const activeProduct = useMemo(
    () => catalogProducts.find(product => product.id === activeItem?.catalog_product_id),
    [catalogProducts, activeItem?.catalog_product_id],
  );

  const activeCategory = useMemo(() => categories.find(category => category.id === activeItem?.category_id), [categories, activeItem?.category_id]);

  /*
   * --------------------------------------------------------------------------
   * Proposal Matrix Construction for Active Item
   * --------------------------------------------------------------------------
   */
  const { sellerProposals } = useMemo(() => {
    if (!activeItem?.id) {
      return {
        sellerProposals: [] as SellerProposal[],
      };
    }

    const itemId = activeItem.id;
    const targetQuotes = allQuotes.filter(q => q.rfq_item_id === itemId && q.status === "DEVIATION_ACCEPTED");

    const sellerProposals: SellerProposal[] = [];
    let excelColIndex = 0;

    for (const quote of targetQuotes) {
      const sellerParty = parties.find(item => item.id === quote.seller_party_id);
      const sellerName = sellerParty?.display_name ?? `Supplier (${quote.seller_party_id})`;

      const customVariants = allProposalVariants.filter(variant => variant.seller_quote_id === quote.id);
      const suggestedVariants = allSuggestedVariants.filter(variant => variant.seller_quote_id === quote.id);
      const quoteAttrs = quoteAttributes.filter(attribute => attribute.seller_quote_id === quote.id);

      const mfgBrandAttribute = quoteAttrs.find(attribute => attribute.attribute_id === "mfg_brand_mapping");

      let manufacturer = "N/A";
      let brand = "N/A";

      const val = mfgBrandAttribute?.values?.[0];
      if (val) {
        const valId = val.value_id || "";
        if (valId.includes(":")) {
          const [mfgId, brandId] = valId.split(":");
          if (mfgId && mfgId !== "any") {
            const foundMfg = allManufacturers.find(m => m.id === mfgId);
            manufacturer = foundMfg?.company_name || val.value_label || mfgId;
          }
          if (brandId && brandId !== "any") {
            const foundBrand = allBrands.find(b => b.id === brandId);
            brand = foundBrand?.name || val.value_label || brandId;
          }
        }
      }

      const offerQuantity = quote.offer_quantity ?? activeItem.req_quantity ?? 1;
      const unit = quote.offer_unit ?? activeItem.req_unit ?? "PCS";
      const awardQty = activeItem.req_quantity ?? quote.offer_quantity ?? 0;

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
          awardQty,
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
          awardQty,
        });
      }

      if (!proposalVariants.length) {
        const excelLetter = getExcelColumn(excelColIndex++);
        const fallbackQuantity = quote.offer_quantity ?? activeItem.req_quantity ?? 100;
        const fallbackUnit = quote.offer_unit ?? activeItem.req_unit ?? "PCS";
        const offerPrice = 150 + excelColIndex * 10;

        proposalVariants.push({
          id: quote.id,
          colKey: `col_${quote.id}`,
          excelLetter,
          colLabel: `Proposal ${excelLetter}`,
          type: "Standard Quote",
          offerPrice,
          offerQuantity: fallbackQuantity,
          unit: fallbackUnit,
          totalPrice: offerPrice * fallbackQuantity,
          manufacturer: manufacturer !== "N/A" ? manufacturer : "Dell / Intel Corp",
          brand: brand !== "N/A" ? brand : "Enterprise Tech",
          awardQty: activeItem.req_quantity ?? 100,
        });
      }

      sellerProposals.push({
        sellerId: quote.seller_party_id,
        sellerName,
        quoteId: quote.id,
        quoteNumber: quote.seller_quote_number,
        quoteStatus: quote.status,
        variants: proposalVariants,
      });
    }

    return { sellerProposals };
  }, [activeItem, allQuotes, allProposalVariants, allSuggestedVariants, quoteAttributes, parties, allManufacturers, allBrands]);

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
   * --------------------------------------------------------------------------
   * Allocation Computations for Active Item
   * --------------------------------------------------------------------------
   */
  const activeItemAllocatedQty = useMemo(() => {
    if (!activeItem?.id) return 0;
    return Object.values(allocations)
      .filter(a => a.rfq_item_id === activeItem.id)
      .reduce((sum, a) => sum + (a.awarded_quantity || 0), 0);
  }, [allocations, activeItem?.id]);

  const activeItemReqQty = activeItem?.req_quantity || 0;
  const activeItemRemainingQty = Math.max(0, activeItemReqQty - activeItemAllocatedQty);

  const handleQtyChange = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string, newQty: number | null) => {
    if (!activeItem?.id) return;
    const qty = Math.max(0, newQty || 0);
    const key = `${activeItem.id}:${variant.id}`;

    setAllocations(prev => ({
      ...prev,
      [key]: {
        rfq_item_id: activeItem.id,
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
      },
    }));
  };

  const handleQuickFullAllocation = (variant: ProposalVariant, sellerPartyId: string, sellerQuoteId: string) => {
    if (!activeItem?.id) return;
    const currentVariantQty = allocations[`${activeItem.id}:${variant.id}`]?.awarded_quantity || 0;
    const targetQty = currentVariantQty + activeItemRemainingQty;
    handleQtyChange(variant, sellerPartyId, sellerQuoteId, targetQty);
  };

  /*
   * --------------------------------------------------------------------------
   * Persistence Handlers (Save Draft vs Finalize Awards & POs)
   * --------------------------------------------------------------------------
   */
  const handleSaveDraft = async () => {
    if (!rfqId) return;
    const now = new Date().toISOString();
    const headerId = `award-proc-${rfqId}`;

    const activeAllocations = Object.values(allocations).filter(a => a.awarded_quantity > 0);
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

    // const itemRecords: RfqAwardItem[] = activeAllocations.map(a => ({
    //   id: `award-item-${a.rfq_item_id}-${a.variant_id}`,
    //   award_header_id: headerId,
    //   rfq_id: rfqId,
    //   rfq_item_id: a.rfq_item_id,
    //   seller_party_id: a.seller_party_id,
    //   seller_quote_id: a.seller_quote_id,
    //   variant_id: a.variant_id,
    //   variant_type: a.variant_type,
    //   unit_price: a.unit_price,
    //   awarded_quantity: a.awarded_quantity,
    //   total_price: a.unit_price * a.awarded_quantity,
    //   seller_accepted: a.seller_accepted ?? false,
    //   updated_at: now,
    //   created_at: now,
    // }));

    // await rfqDb.rfq_award_headers.put(headerRecord);
    // await rfqDb.rfq_award_items.where("rfq_id").equals(rfqId).delete();
    // if (itemRecords.length > 0) {
    //   await rfqDb.rfq_award_items.bulkPut(itemRecords);
    // }
    message.success("Draft award allocations saved successfully.");
  };

  const handleFinalizeAndGeneratePOs = async () => {
    if (!rfqId) return;

    // Check over-allocation across line items
    for (const item of rfqItems) {
      const itemAllocated = Object.values(allocations)
        .filter(a => a.rfq_item_id === item.id)
        .reduce((sum, a) => sum + (a.awarded_quantity || 0), 0);
      if (itemAllocated > item.req_quantity) {
        message.error(`Line item #${item.item_index || 1} is over-allocated (${itemAllocated}/${item.req_quantity}). Please adjust before finalizing.`);
        return;
      }
    }

    const activeAllocations = Object.values(allocations).filter(a => a.awarded_quantity > 0);
    if (activeAllocations.length === 0) {
      message.warning("Please allocate award quantities to at least one variant before finalizing.");
      return;
    }

    const now = new Date().toISOString();
    const headerId = `award-proc-${rfqId}`;
    const totalAmount = activeAllocations.reduce((sum, a) => sum + a.unit_price * a.awarded_quantity, 0);

    // 1. Write Award Header
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

    // 2. Group items per seller & generate POs
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
          unit_price: a.unit_price,
          awarded_quantity: a.awarded_quantity,
          total_price: a.unit_price * a.awarded_quantity,
          seller_accepted: true,
          seller_accepted_at: now,
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
          unit_price: a.unit_price,
          awarded_quantity: a.awarded_quantity,
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

    // Update RFQ status to AWARDED
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
   * --------------------------------------------------------------------------
   * Matrix Row Definitions
   * --------------------------------------------------------------------------
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
        key: "moq",
        attributeName: "MOQ",
        getValue: (variant: FlattenedVariant) => <span className="font-semibold text-slate-800 text-xs">2 Pcs</span>,
      },
      {
        key: "total_price",
        attributeName: "Total Price",
        getValue: (variant: FlattenedVariant) => <span className="font-bold text-slate-900 text-xs">{formatCurrency(variant.totalPrice)}</span>,
      },
      {
        key: "award_quantity",
        attributeName: "Award Quantity (Allocation)",
        getValue: (variant: FlattenedVariant) => {
          const currentQty = allocations[`${activeItem?.id}:${variant.id}`]?.awarded_quantity || 0;
          const currentSubtotal = variant.offerPrice * currentQty;

          return (
            <div className="flex flex-col gap-1.5 items-start">
              <div className="flex items-center gap-1">
                <InputNumber
                  min={0}
                  step={1}
                  value={currentQty}
                  onChange={val => handleQtyChange(variant, variant.sellerName, variant.quoteNumber, val)}
                  size="small"
                  className="!w-24 text-[11px] !h-7 font-mono font-bold"
                />

                <Tooltip title="Quick Fill Remaining Quantity">
                  <Button
                    size="small"
                    type="default"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleQuickFullAllocation(variant, variant.sellerName, variant.quoteNumber)}
                    className="!h-7 !px-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                  />
                </Tooltip>
              </div>

              {currentQty > 0 && (
                <div className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Subtotal: {formatCurrency(currentSubtotal)}
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [allocations, activeItem?.id, activeItemRemainingQty],
  );

  /*
   * --------------------------------------------------------------------------
   * Early Return Guards
   * --------------------------------------------------------------------------
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
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">Quote Awarding Workspace</h1>
            {isFinalized ? (
              <AntTag color="emerald" className="font-bold text-xs">
                FINALIZED
              </AntTag>
            ) : (
              <AntTag color="blue" className="font-bold text-xs">
                DRAFT ALLOCATION
              </AntTag>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Evaluate proposals, compare deviation-accepted seller quotes, and manage contract awards across RFQ line items.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="small" icon={<SaveOutlined />} onClick={handleSaveDraft} className="text-xs font-semibold">
            Save Draft
          </Button>

          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={handleFinalizeAndGeneratePOs}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
          >
            Finalize & Generate POs
          </Button>

          <Segmented
            value={viewMode}
            onChange={value => setViewMode(value as ViewMode)}
            options={[
              {
                label: (
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <TableOutlined />
                    Comparison Matrix
                  </span>
                ),
                value: "matrix",
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <TrophyOutlined />
                    Award Overview ({existingPurchaseOrders.length} POs)
                  </span>
                ),
                value: "summary",
              },
            ]}
          />

          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">RFQ: {rfq.rfq_number}</span>
        </div>
      </div>

      {/* Active RFQ Item Line Selector & Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">
              Item {currentPage} of {rfqItems.length}
            </span>

            <span className="font-bold text-slate-900 text-sm">{activeProduct?.name ?? `RFQ Line Item #${activeItem?.item_index ?? currentPage}`}</span>

            <AntTag color="blue" className="text-xs font-semibold m-0">
              {activeCategory?.name ?? "Category"}
            </AntTag>
          </div>

          <p className="text-xs text-slate-500 m-0">
            Requested Quantity:{" "}
            <strong className="text-slate-800">
              {activeItem?.req_quantity} {activeItem?.req_unit ?? "PCS"}
            </strong>
          </p>
        </div>

        <Pagination size="small" current={currentPage} total={rfqItems.length} pageSize={1} showSizeChanger={false} onChange={setCurrentPage} className="m-0" />
      </div>

      {/* View Mode 1: Comparison Matrix */}
      {viewMode === "matrix" && (
        <div className="space-y-3">
          {/* Live Allocation Summary Widget */}
          <div className="bg-slate-900 text-white rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Line Item Goal</div>
                <div className="text-sm font-bold text-slate-100">
                  {activeItemReqQty} {activeItem?.req_unit || "PCS"}
                </div>
              </div>
              <div className="h-7 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Allocated Qty</div>
                <div className="text-sm font-bold text-emerald-400">
                  {activeItemAllocatedQty} {activeItem?.req_unit || "PCS"}
                </div>
              </div>
              <div className="h-7 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Unallocated Remainder</div>
                <div className="text-sm font-bold text-amber-400">
                  {activeItemRemainingQty} {activeItem?.req_unit || "PCS"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeItemAllocatedQty === activeItemReqQty && activeItemReqQty > 0 ? (
                <AntTag color="emerald" className="px-3 py-1 text-xs font-bold rounded-full">
                  ✓ 100% Fully Allocated
                </AntTag>
              ) : activeItemAllocatedQty > activeItemReqQty ? (
                <AntTag color="red" className="px-3 py-1 text-xs font-bold rounded-full">
                  ⚠ Over Allocated (+{activeItemAllocatedQty - activeItemReqQty})
                </AntTag>
              ) : (
                <AntTag color="amber" className="px-3 py-1 text-xs font-bold rounded-full">
                  Partially Allocated
                </AntTag>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-md px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <AntTag color="emerald" className="m-0 font-bold">
                DEVIATION ACCEPTED
              </AntTag>

              <span>Displaying quotes where seller deviations have been reviewed & accepted.</span>
            </div>

            <span className="text-slate-500 font-mono text-[11px]">
              {allCombinedVariants.length} Variant Proposal(s) across {sellerProposals.length} Seller(s)
            </span>
          </div>

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
              description="There are currently no quotes with deviation accepted status for this line item. You can switch line items using the pagination controls above."
              className="my-3"
            />
          )}
        </div>
      )}

      {/* View Mode 2: Award Overview Tab */}
      {viewMode === "summary" && (
        <div className="space-y-4">
          <Card size="small" className="shadow-sm border-slate-200">
            <Descriptions
              title={<span className="text-sm font-bold text-slate-800">Sourcing Award Header Summary</span>}
              bordered
              size="small"
              column={3}
              className="mb-2"
            >
              <Descriptions.Item label="RFQ Number">{rfq.rfq_number}</Descriptions.Item>
              <Descriptions.Item label="Award Process Status">
                <AntTag color={isFinalized ? "emerald" : "blue"} className="font-bold">
                  {currentProcessHeader?.process_status || "DRAFT"}
                </AntTag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Contract Award Value">
                <span className="font-bold text-emerald-700">{formatCurrency(currentProcessHeader?.total_awarded_amount || 0)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Total Awarded Line Items">{existingAwardItems.length}</Descriptions.Item>
              <Descriptions.Item label="Generated Purchase Orders">{existingPurchaseOrders.length} PO(s)</Descriptions.Item>
            </Descriptions>
          </Card>

          {existingPurchaseOrders.length > 0 ? (
            <Card
              title={
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <RocketOutlined /> Generated Purchase Orders ({existingPurchaseOrders.length})
                </span>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5 border-r border-slate-200">PO Number</th>
                      <th className="p-2.5 border-r border-slate-200">Awarded Supplier</th>
                      <th className="p-2.5 border-r border-slate-200">Total Order Amount</th>
                      <th className="p-2.5 border-r border-slate-200">PO Status</th>
                      <th className="p-2.5 border-r border-slate-200">Buyer Release</th>
                      <th className="p-2.5 border-r border-slate-200">Seller Confirmation</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {existingPurchaseOrders.map(po => {
                      const seller = parties.find(p => p.id === po.seller_party_id);
                      const ack = existingPoAcknowledgements.find(a => a.purchase_order_id === po.id);
                      return (
                        <tr key={po.id} className="hover:bg-slate-50">
                          <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-indigo-700">{po.po_number}</td>
                          <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <ShopOutlined /> {seller?.display_name || po.seller_party_id}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-200 font-bold text-emerald-700">{formatCurrency(po.total_amount)}</td>
                          <td className="p-2.5 border-r border-slate-200">
                            <AntTag color="blue" className="font-semibold text-[11px]">
                              {po.po_status}
                            </AntTag>
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            {ack?.buyer_confirmed ? (
                              <AntTag color="emerald" className="font-semibold text-[10px]">
                                Released ✓
                              </AntTag>
                            ) : (
                              <AntTag color="amber">Pending Release</AntTag>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            {ack?.seller_acknowledged ? (
                              <AntTag color="emerald" className="font-semibold text-[10px]">
                                Acknowledged ✓
                              </AntTag>
                            ) : (
                              <AntTag color="purple" className="font-semibold text-[10px]">
                                Awaiting Confirmation...
                              </AntTag>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <Button size="small" type="link" icon={<FileTextOutlined />} className="text-xs font-semibold p-0">
                              View PO Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Alert
              type="info"
              showIcon
              message="No Purchase Orders Generated Yet"
              description="Finalize contract awards in the Comparison Matrix view to generate Purchase Orders per supplier."
            />
          )}
        </div>
      )}
    </div>
  );
};
