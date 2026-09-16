import React, { useMemo, useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Alert,
  Button,
  Card,
  Tag as AntTag,
  InputNumber,
  Tooltip,
  Checkbox,
  Modal,
  Input,
  App as AntApp,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  ShopOutlined,
  SendOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import {
  rfqDb,
  type RfqItem,
  type RfqQuoteAward,
  type RfqQuoteItemAward,
  type SellerQuoteAttribute,
  type RfqAwardRevisionNote,
  type RfqQuoteItemAwardRevision,
} from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { catalogDb } from "../../data/catalog/catalog.db";
import { useWorkspace } from "../../contexts/WorkspaceContext";

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

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

interface RfqQuoteAwardingTabProps {
  rfqId: string;
}

export const RfqQuoteAwardingTab: React.FC<RfqQuoteAwardingTabProps> = ({ rfqId }) => {
  const { message } = AntApp.useApp();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === "BUSINESS";

  const [allocations, setAllocations] = useState<RfqItemAllocation[]>([]);
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

  const handleToggleVariantSelection = (
    itemId: string,
    variant: ProposalVariant,
    sellerPartyId: string,
    sellerQuoteId: string,
    checked: boolean,
  ) => {
    setAllocations(prev => {
      return prev.map(group => {
        if (group.rfq_item_id !== itemId) return group;
        const existing = group.allocations.find(a => a.variant_id === variant.id);
        const currentQty = existing?.buyer_target_quantity || 0;
        const nextQty = checked ? (currentQty > 0 ? currentQty : 1) : 0;

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

        const newAllocations = existing
          ? group.allocations.map(a => (a.variant_id === variant.id ? updatedAlloc : a))
          : [...group.allocations, updatedAlloc];

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
        const variantType = variantObj
          ? variantObj.type.includes("Custom")
            ? "CUSTOM"
            : "SUGGESTED"
          : existing?.variant_type ?? "CUSTOM";
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
          is_selected: qty > 0 ? true : currentIsSelected ?? false,
        };

        const newAllocations = existing
          ? group.allocations.map(a => (a.variant_id === variantId ? updatedAlloc : a))
          : [...group.allocations, updatedAlloc];

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

      await rfqDb.transaction(
        "rw",
        [rfqDb.rfq_quote_awards, rfqDb.rfq_quote_item_awards, rfqDb.rfq_quote_item_award_revisions, rfqDb.rfq_award_revision_notes],
        async () => {
          await rfqDb.rfq_quote_awards.put(quoteAwardPayload);
          await rfqDb.rfq_quote_item_awards.bulkPut(quoteItemAwardPayload);
          if (quoteItemRevisionsPayload.length > 0) {
            await rfqDb.rfq_quote_item_award_revisions.bulkAdd(quoteItemRevisionsPayload);
          }
          if (notePayload) {
            await rfqDb.rfq_award_revision_notes.add(notePayload);
          }
        },
      );

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
        const sellerName = partiesMap.get(quote.seller_party_id) ?? `Seller (${quote.seller_party_id})`;
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

      const itemAllocations = (allocations.find(a => a.rfq_item_id === item.id)?.allocations || []).filter(
        a => a.is_selected && a.buyer_target_quantity > 0,
      );
      const allocatedQty = itemAllocations.reduce((sum, a) => sum + a.buyer_target_quantity, 0);
      const reqQty = item.req_quantity || 0;
      const remainingQty = Math.max(0, reqQty - allocatedQty);
      const allocatedTotalPrice = itemAllocations.reduce((sum, a) => sum + a.unit_price * a.buyer_target_quantity, 0);

      const itemGroup = allocations.find(a => a.rfq_item_id === item.id);
      const activeAllocations = (itemGroup?.allocations || []).filter(a => a.is_selected);
      const sellerQuoteAllocationsMap = new Map<string, any>();

      for (const alloc of activeAllocations) {
        const variant = allCombinedVariants.find(v => v.id === alloc.variant_id);
        const sellerParty = parties.find(p => p.id === alloc.seller_party_id);
        const quote = allQuotes.find(q => q.id === alloc.seller_quote_id);
        const sellerName = sellerParty?.display_name || `Seller (${alloc.seller_party_id})`;
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
            totalQty: 0,
            totalValue: 0,
            items: [],
          });
        }

        const group = sellerQuoteAllocationsMap.get(alloc.seller_party_id)!;
        const unitPrice = alloc.unit_price || variant?.offerPrice || 0;
        const awardedQty = alloc.buyer_target_quantity || 0;
        const subtotal = unitPrice * awardedQty;

        const existingQva = (existingQuoteVariantAwards || []).find(
          v => v.rfq_item_id === item.id && v.seller_party_id === alloc.seller_party_id && v.variant_id === alloc.variant_id,
        );
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
        sellerQuoteAllocations,
        allocatedQty,
        reqQty,
        remainingQty,
        allocatedTotalPrice,
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

  // Overall Cumulative RFQ Metrics
  const rfqCumulativeMetrics = useMemo(() => {
    let totalTargetQty = 0;
    let totalAllocatedQty = 0;
    let totalAllocatedValue = 0;
    let itemsFullyAllocated = 0;

    itemsComputedData.forEach(itemData => {
      totalTargetQty += itemData.reqQty;
      totalAllocatedQty += itemData.allocatedQty;
      totalAllocatedValue += itemData.allocatedTotalPrice;
      if (itemData.allocatedQty === itemData.reqQty && itemData.reqQty > 0) {
        itemsFullyAllocated++;
      }
    });

    return {
      totalItems: itemsComputedData.length,
      totalTargetQty,
      totalAllocatedQty,
      totalAllocatedValue,
      itemsFullyAllocated,
    };
  }, [itemsComputedData]);

  const modalProduct = revisionModalState.item
    ? catalogProducts.find(p => p.id === revisionModalState.item?.catalog_product_id)
    : null;

  if (!pageData) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Spin size="large" tip="Loading Quotes Awarding Workspace..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RFQ Overall Cumulative Status Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Line Items Progress</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {rfqCumulativeMetrics.itemsFullyAllocated} / {rfqCumulativeMetrics.totalItems} Items Fully Allocated
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Total Target Quantity</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {rfqCumulativeMetrics.totalAllocatedQty.toLocaleString()} / {rfqCumulativeMetrics.totalTargetQty.toLocaleString()} Units
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Total Awarded Commitment</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatCurrency(rfqCumulativeMetrics.totalAllocatedValue)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rfqCumulativeMetrics.itemsFullyAllocated === rfqCumulativeMetrics.totalItems && rfqCumulativeMetrics.totalItems > 0 ? (
            <AntTag color="green" className="font-semibold text-xs m-0">
              <CheckCircleOutlined /> Target Met
            </AntTag>
          ) : (
            <AntTag className="font-medium text-xs m-0 bg-white border-slate-300 text-slate-700">
              Allocation In Progress
            </AntTag>
          )}
        </div>
      </div>

      {/* Line Items Workspace */}
      <div className="space-y-6">
        {itemsComputedData.map(itemData => {
          const {
            item,
            itemIndex,
            product,
            category,
            sellerProposals,
            allCombinedVariants,
            sellerQuoteAllocations,
            allocatedQty,
            reqQty,
            remainingQty,
            allocatedTotalPrice,
          } = itemData;

          const isFullyAllocated = allocatedQty === reqQty && reqQty > 0;
          const isOverAllocated = allocatedQty > reqQty;

          const rowsDefinition = [
            {
              key: "manufacturer",
              attributeName: "Manufacturer / Brand",
              getValue: (variant: FlattenedVariant) => (
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-700">
                    {variant.manufacturer}
                  </span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-700">
                    {variant.brand}
                  </span>
                </div>
              ),
            },
            {
              key: "offer_price",
              attributeName: "Proposed Unit Price",
              getValue: (variant: FlattenedVariant) => (
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  {formatCurrency(variant.offerPrice)}
                </span>
              ),
            },
            {
              key: "offer_quantity",
              attributeName: "Offer Quantity / MOQ",
              getValue: (variant: FlattenedVariant) => (
                <span className="font-mono text-slate-700 text-xs">
                  {variant.offerQuantity} {variant.unit}
                </span>
              ),
            },
            {
              key: "total_price",
              attributeName: "Total Offer Value",
              getValue: (variant: FlattenedVariant) => (
                <span className="font-mono font-semibold text-slate-800 text-xs">
                  {formatCurrency(variant.totalPrice)}
                </span>
              ),
            },
            {
              key: "select_variant",
              attributeName: "Select for Award",
              getValue: (variant: FlattenedVariant) => {
                const itemAllocations = allocations.find(a => a.rfq_item_id === item.id)?.allocations || [];
                const alloc = itemAllocations.find(a => a.variant_id === variant.id);
                const isSelected = !!alloc?.is_selected;

                const sellerAward = (existingQuoteAwards || []).find(
                  a => a.rfq_item_id === item.id && (a.seller_quote_id === variant.quoteId || a.seller_party_id === variant.sellerPartyId),
                );

                const variantAward = (existingQuoteVariantAwards || []).find(
                  v => v.rfq_item_id === item.id && v.variant_id === variant.id && (v.seller_quote_id === variant.quoteId || v.seller_party_id === variant.sellerPartyId),
                );

                const awardRound = sellerAward?.award_round || 1;

                if (sellerAward && variantAward) {
                  if (sellerAward.award_status === "AWARDED" || variantAward.variant_award_status === "AWARDED") {
                    return (
                      <Tooltip title={`Award allocation of ${variantAward.buyer_target_quantity} ${variant.unit} has been sent to ${variant.sellerName} (Round ${awardRound}). Pending seller response.`}>
                        <div className="flex items-center justify-center gap-1.5 cursor-not-allowed">
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
                        <div className="flex items-center justify-center gap-1.5">
                          <AntTag color="green" className="text-[11px] m-0 font-semibold flex items-center gap-1">
                            <CheckCircleOutlined /> Confirmed
                          </AntTag>
                        </div>
                      </Tooltip>
                    );
                  }

                  if (sellerAward.award_status === "SELLER_REVISED" || variantAward.variant_award_status === "SELLER_REVISED") {
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <Checkbox
                          checked={isSelected}
                          onChange={e => handleToggleVariantSelection(item.id, variant, variant.sellerPartyId, variant.quoteId, e.target.checked)}
                          className="font-medium text-xs"
                        >
                          <span className={isSelected ? "text-slate-900 font-semibold" : "text-slate-500"}>
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </Checkbox>
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                          <AntTag color="orange" className="text-[10px] m-0 font-bold">
                            Award Revision
                          </AntTag>
                          {variantAward.seller_offered_quantity !== undefined && (
                            <span className="text-[10px] text-slate-600 font-mono font-medium">
                              {variantAward.seller_offered_quantity} {variant.unit} @ {formatCurrency(variantAward.unit_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (sellerAward.award_status === "PO_CREATED" || sellerAward.award_status === "PO_RECEIVED") {
                    return (
                      <div className="flex items-center justify-center">
                        <AntTag color="purple" className="text-[11px] m-0 font-semibold flex items-center gap-1">
                          <CheckCircleOutlined /> PO Released
                        </AntTag>
                      </div>
                    );
                  }
                }

                if (sellerAward && !variantAward) {
                  return (
                    <Tooltip title={`This variant was not included in the award allocation sent to ${variant.sellerName} (Round ${awardRound}).`}>
                      <div className="text-slate-400 text-[11px] italic text-center">— Not Awarded</div>
                    </Tooltip>
                  );
                }

                return (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isSelected}
                      onChange={e => handleToggleVariantSelection(item.id, variant, variant.sellerPartyId, variant.quoteId, e.target.checked)}
                    >
                      <span className={isSelected ? "text-slate-900 font-semibold text-xs" : "text-slate-500 text-xs"}>
                        {isSelected ? "Selected" : "Select Option"}
                      </span>
                    </Checkbox>
                  </div>
                );
              },
            },
          ];

          return (
            <Card
              key={item.id}
              size="small"
              className="border-slate-200 shadow-xs rounded-xl bg-white overflow-hidden"
            >
              {/* Line Item Header Strip */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 -mx-3 -mt-3 mb-4 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-white font-bold text-xs">
                    {itemIndex}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {product?.name || `RFQ Line Item #${itemIndex}`}
                    </span>
                    {category && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200 bg-white text-slate-600">
                        {category.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Requested Target:{" "}
                    <strong className="font-mono text-slate-900 font-bold">
                      {item.req_quantity} {item.req_unit || "PCS"}
                    </strong>
                  </span>
                </div>
              </div>

              {sellerProposals.length > 0 ? (
                <div className="space-y-5">
                  {/* Part A: Quote Proposal & Variant Specification Matrix Table */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShopOutlined className="text-slate-500" />
                      <span>Seller Proposals & Variant Specification Matrix</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          {/* Level 1 Header: Grouped by Seller Quote */}
                          <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                            <th className="p-3 border-r border-slate-200 font-semibold text-slate-700 min-w-[200px] w-1/4">
                              Basic Attribute / Specification
                            </th>
                            {sellerProposals.map(seller => (
                              <th
                                key={seller.quoteId}
                                colSpan={seller.variants.length}
                                className="p-2 border-r border-slate-200 text-center bg-slate-50/80"
                              >
                                <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 text-xs">
                                  <ShopOutlined className="text-slate-500" />
                                  <span>{seller.sellerName}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-0.5">
                                  <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {seller.quoteNumber}
                                  </span>
                                </div>
                              </th>
                            ))}
                          </tr>

                          {/* Level 2 Header: Variant Sub-Columns */}
                          <tr className="bg-slate-50/50 text-slate-600 border-b border-slate-200">
                            <th className="p-2 border-r border-slate-200 font-medium text-slate-500 text-[11px]">
                              Proposed Options
                            </th>
                            {sellerProposals.map(seller =>
                              seller.variants.map(variant => (
                                <th
                                  key={variant.id}
                                  className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700 min-w-[160px]"
                                >
                                  <span className="text-slate-800">{variant.colLabel}</span>
                                </th>
                              )),
                            )}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {rowsDefinition.map(row => (
                            <tr key={row.key} className="hover:bg-slate-50/50">
                              <td className="p-2.5 border-r border-slate-200 font-medium text-slate-700">
                                {row.attributeName}
                              </td>
                              {allCombinedVariants.map(variant => (
                                <td key={variant.colKey} className="p-2.5 border-r border-slate-200 text-center">
                                  {row.getValue(variant)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Part B: Seller Quote Allocations (Grouped by Seller Quote) */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarOutlined className="text-slate-500" />
                        <span>Seller Contract Allocations & Award Dispatch</span>
                      </div>
                      <span className="text-slate-400 font-normal text-[11px]">
                        {sellerQuoteAllocations.length} Selected Seller Quote(s)
                      </span>
                    </div>

                    {sellerQuoteAllocations.length > 0 ? (
                      <div className="space-y-3">
                        {sellerQuoteAllocations.map(sellerQuoteAlloc => (
                          <div
                            key={sellerQuoteAlloc.sellerQuoteId}
                            className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden"
                          >
                            {/* Seller Quote Banner */}
                            <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <ShopOutlined className="text-slate-600" />
                                <span className="font-bold text-slate-800 text-xs">{sellerQuoteAlloc.sellerName}</span>
                                <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {sellerQuoteAlloc.quoteNumber}
                                </span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700">
                                  Round-{sellerQuoteAlloc.awardRound}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-500">
                                  Allocated Qty:{" "}
                                  <strong className="font-mono font-bold text-slate-800">
                                    {sellerQuoteAlloc.totalQty} {item.req_unit || "PCS"}
                                  </strong>
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500">
                                  Seller Total:{" "}
                                  <strong className="font-mono font-bold">
                                    {formatCurrency(sellerQuoteAlloc.totalValue)}
                                  </strong>
                                </span>

                                {/* Action Dispatch Button for this Seller Quote */}
                                <div className="ml-2">
                                  {sellerQuoteAlloc.isConfirmed ? (
                                    <AntTag color="green" className="font-semibold text-xs m-0">
                                      <CheckCircleOutlined /> Confirmed ✓
                                    </AntTag>
                                  ) : sellerQuoteAlloc.isPendingSeller ? (
                                    <AntTag color="blue" className="font-medium text-xs m-0 flex items-center gap-1">
                                      <ClockCircleOutlined /> Awaiting Seller (Round {sellerQuoteAlloc.awardRound})
                                    </AntTag>
                                  ) : sellerQuoteAlloc.isSellerRevised ? (
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<SendOutlined />}
                                      onClick={() => handleOpenAwardRevisionModal(item, sellerQuoteAlloc)}
                                      className="text-xs font-semibold"
                                    >
                                      Send Revised Award (Round {(sellerQuoteAlloc.awardRound || 1) + 1})
                                    </Button>
                                  ) : (
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<SendOutlined />}
                                      disabled={sellerQuoteAlloc.totalQty <= 0}
                                      onClick={() => handleOpenAwardRevisionModal(item, sellerQuoteAlloc)}
                                      className="text-xs font-semibold"
                                    >
                                      Send Award Allocation
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Variants in this Quote */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50/40 text-slate-500 border-b border-slate-100 font-medium">
                                    <th className="py-2 px-3 border-r border-slate-100">Variant Option</th>
                                    <th className="py-2 px-3 border-r border-slate-100 text-right">Unit Price</th>
                                    <th className="py-2 px-3 border-r border-slate-100 text-right">Awarded Qty</th>
                                    <th className="py-2 px-3 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {sellerQuoteAlloc.items.map((allocItem: any) => (
                                    <tr key={allocItem.allocation.variant_id} className="hover:bg-slate-50/30">
                                      <td className="py-2 px-3 border-r border-slate-100">
                                        <div className="font-semibold text-slate-800">{allocItem.variantLabel}</div>
                                        <div className="text-[10px] text-slate-400">
                                          {allocItem.manufacturer} • {allocItem.brand}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 border-r border-slate-100 text-right font-mono font-medium text-slate-700">
                                        {formatCurrency(allocItem.unitPrice)}
                                      </td>
                                      <td className="py-2 px-3 border-r border-slate-100 text-right">
                                        {sellerQuoteAlloc.isPendingSeller ? (
                                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                            {allocItem.awardedQty} {item.req_unit || "PCS"}
                                          </span>
                                        ) : sellerQuoteAlloc.isConfirmed ? (
                                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                            {allocItem.awardedQty} {item.req_unit || "PCS"}
                                          </span>
                                        ) : (
                                          <div className="flex flex-col items-end gap-1">
                                            <InputNumber
                                              min={0}
                                              step={1}
                                              value={allocItem.awardedQty}
                                              onChange={val =>
                                                handleQtyChange(
                                                  item.id,
                                                  allocItem.variant || allocItem.allocation.variant_id,
                                                  allocItem.allocation.seller_party_id,
                                                  allocItem.allocation.seller_quote_id,
                                                  val,
                                                  allCombinedVariants,
                                                  item.req_unit,
                                                )
                                              }
                                              size="small"
                                              className="!w-24 text-xs font-mono font-bold border-slate-300"
                                            />
                                            {sellerQuoteAlloc.isSellerRevised && allocItem.sellerOfferedQty !== undefined && (
                                              <span className="text-[10px] text-slate-600 font-medium">
                                                Offered: {allocItem.sellerOfferedQty} {item.req_unit || "PCS"}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                        {formatCurrency(allocItem.subtotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Latest Revision Note preview if any */}
                            {(() => {
                              const notes = (awardRevisionNotes || [])
                                .filter(n => n.rfq_item_id === item.id && n.seller_party_id === sellerQuoteAlloc.sellerPartyId)
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                              const latestNote = notes[0];
                              if (!latestNote) return null;
                              const isSellerNote = latestNote.actor_type === "SELLER";
                              return (
                                <div className="px-3 py-2 border-t border-slate-100 flex items-start gap-2 text-xs bg-slate-50">
                                  <FileTextOutlined className="text-slate-500 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      {isSellerNote ? "Seller Response Note" : "Revision Request Note"} (Round {latestNote.award_round}):
                                    </span>
                                    <span className="text-slate-700 italic ml-1">&ldquo;{latestNote.note}&rdquo;</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert
                        type="info"
                        showIcon
                        message="No Variant Allocations Selected"
                        description="Check the 'Select Option' checkbox and enter quantities in the comparison matrix above to view current selection insights."
                        className="border-slate-200 bg-slate-50/60 text-slate-600 rounded-xl"
                      />
                    )}
                  </div>

                  {/* Part C: Summary & Variance Strip */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-medium">Item Allocation:</span>
                      <strong className="font-mono text-sm text-slate-900 font-bold">
                        {allocatedQty} / {reqQty} {item.req_unit || "PCS"}
                      </strong>
                      <span className="text-slate-400 text-[11px]">(Rem: {remainingQty})</span>
                      {isFullyAllocated ? (
                        <AntTag color="green" className="font-semibold text-xs m-0">
                          <CheckCircleOutlined /> Target Met
                        </AntTag>
                      ) : isOverAllocated ? (
                        <AntTag color="red" className="font-semibold text-xs m-0">
                          <ExclamationCircleOutlined /> Over Allocated (+{allocatedQty - reqQty})
                        </AntTag>
                      ) : (
                        <AntTag className="font-medium text-xs m-0 bg-white border-slate-300 text-slate-700">
                          Under Allocated (-{remainingQty})
                        </AntTag>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-medium">Allocated Line Total:</span>
                      <strong className="font-mono text-sm text-slate-900 font-bold">
                        {formatCurrency(allocatedTotalPrice)}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="No Deviation Accepted Quotes Available"
                  description="There are currently no quotes with deviation accepted status for this line item."
                  className="border-slate-200 bg-slate-50/60 text-slate-600 rounded-xl"
                />
              )}
            </Card>
          );
        })}
      </div>

      {/* Award Revision Dispatch Modal */}
      <Modal
        open={revisionModalState.visible}
        title={
          <div className="flex items-center gap-2">
            <SendOutlined className="text-slate-700" />
            <span className="font-bold text-slate-800">
              {revisionModalState.sellerQuoteAllocation?.quoteStatus === "SELLER_REVISED"
                ? "Send Revised Award Allocation"
                : "Send Award Allocation to Seller"}
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
            className="border-slate-200 bg-slate-50 text-slate-600"
          />

          <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
            <div className="flex justify-between font-medium text-slate-600">
              <span>Award Round:</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium border border-slate-200 bg-white text-slate-700">
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
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(revisionModalState.sellerQuoteAllocation?.totalValue || 0)}
              </span>
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
