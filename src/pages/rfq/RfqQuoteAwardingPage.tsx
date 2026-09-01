import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Alert, Button, Card, Pagination, Segmented, Tag as AntTag, InputNumber } from "antd";
import { TableOutlined, TrophyOutlined } from "@ant-design/icons";

import { rfqDb } from "../../data/rfq";
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

const VALID_QUOTE_STATUSES = ["SUBMITTED", "ACCEPTED", "FINAL_ACKNOWLEDGE", "DEVIATION_ACCEPTED"] as const;

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
  } = pageData ?? {};

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

  const rowsDefinition = useMemo(
    () => [
      // {
      //   key: "seller_name",
      //   attributeName: "Seller Name",
      //   getValue: (variant: FlattenedVariant) => <span className="font-bold text-slate-900 text-xs">{variant.sellerName}</span>,
      // },
      // {
      //   key: "quote_number",
      //   attributeName: "Quote Number & Status",
      //   getValue: (variant: FlattenedVariant) => (
      //     <div className="space-y-0.5">
      //       <span className="font-mono text-xs text-slate-800">{variant.quoteNumber}</span>
      //       <div>
      //         <AntTag color={variant.quoteStatus === "DEVIATION_ACCEPTED" ? "emerald" : "blue"} className="text-[10px] m-0 font-medium">
      //           {variant.quoteStatus}
      //         </AntTag>
      //       </div>
      //     </div>
      //   ),
      // },
      // {
      //   key: "proposal_type",
      //   attributeName: "Proposal Type",
      //   getValue: (variant: FlattenedVariant) => (
      //     <AntTag color={variant.type.includes("Catalog") ? "indigo" : "purple"} className="text-xs m-0 font-medium">
      //       {variant.type}
      //     </AntTag>
      //   ),
      // },
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
      // {
      //   key: "unit",
      //   attributeName: "Unit of Measure",
      //   getValue: (variant: FlattenedVariant) => <span className="text-slate-600 text-xs font-mono">{variant.unit}</span>,
      // },
      {
        key: "total_price",
        attributeName: "Total Price",
        getValue: (variant: FlattenedVariant) => <span className="font-bold text-slate-900 text-xs">{formatCurrency(variant.totalPrice)}</span>,
      },
      {
        key: "award_quantity",
        attributeName: "Award Quantity (Allocation)",
        getValue: (variant: FlattenedVariant) => (
          <div className="flex flex-col gap-1">
            <InputNumber
              min={0}
              // max={variant.offerQuantity}
              step={1}
              // value={variant.awardQty}
              value={0}
              // onChange={value => handleAwardQtyChange(variant.id, value)}
              size="small"
              className="!w-20 text-[11px] !h-7 font-mono"
            />
            {/* <span className="font-semibold text-indigo-700 text-xs">
              {variant.awardQty} {variant.unit}
            </span> */}
          </div>
        ),
      },
    ],
    [],
  );

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
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">Quote Awarding Workspace</h1>

          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Evaluate proposals, compare deviation-accepted seller quotes, and manage contract awards across RFQ line items.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
                    Award Overview
                  </span>
                ),
                value: "summary",
              },
            ]}
          />

          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">RFQ: {rfq.rfq_number}</span>
        </div>
      </div>

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
            Requested Quantity:
            <strong className="text-slate-800">
              {activeItem?.req_quantity} {activeItem?.req_unit ?? "PCS"}
            </strong>
          </p>
        </div>

        <Pagination size="small" current={currentPage} total={rfqItems.length} pageSize={1} showSizeChanger={false} onChange={setCurrentPage} className="m-0" />
      </div>

      {viewMode === "matrix" && (
        <div className="space-y-3">
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
                      //  shadow-[3px_0_5px_-2px_rgba(0,0,0,0.12)]
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
                          className={`sticky left-0 z-10 ${rowBg} border-r border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 text-xs min-w-[220px] `}
                          // shadow-[3px_0_5px_-2px_rgba(0,0,0,0.1)]
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

      {viewMode === "summary" && (
        <Card size="small" className="shadow-sm border-slate-200">
          <div className="p-6 text-center space-y-3">
            <span className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 text-xl">
              <TrophyOutlined />
            </span>

            <h3 className="text-sm font-bold text-slate-800 m-0">Award Decision & Quantity Allocation</h3>

            <p className="text-xs text-slate-500 max-w-lg mx-auto m-0">
              This section displays overall contract award allocations, line item split orders, and supplier contract confirmations for line item #
              {activeItem?.item_index ?? currentPage}.
            </p>

            <div className="pt-2">
              <AntTag color="purple" className="px-3 py-1 text-xs font-semibold">
                Line Item Status: {activeItem?.status ?? "OPEN"}
              </AntTag>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
