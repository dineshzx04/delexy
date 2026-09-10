import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Card,
  Descriptions,
  Button,
  Tag as AntTag,
  Alert,
  InputNumber,
  Input,
  Space,
  Divider,
  Table,
  App as AntApp,
} from "antd";
import {
  CheckCircleOutlined,
  SendOutlined,
  DollarOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import {
  rfqDb,
  type RfqQuoteItemAwardRevision,
  type RfqAwardRevisionNote,
} from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { catalogDb } from "../../data/catalog/catalog.db";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";

const formatCurrency = (amount: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

interface VariantResponseRow {
  variantAwardId: string;
  variantId: string;
  variantType: "CUSTOM" | "SUGGESTED";
  variantLabel: string;
  uom: string;
  buyerTargetQty: number;
  buyerUnitPrice: number;
  offeredQty: number;
  offeredPrice: number;
}

export const SellerAwardRevisionResponse: React.FC = () => {
  const navigate = useNavigate();
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const { message, notification } = AntApp.useApp();

  const isBusinessContext = activeWorkspace?.type === "BUSINESS";
  const basePath = isBusinessContext ? "/b/seller/rfqs" : "/user/seller/rfqs";

  /*
   * 1. Data Fetching via useLiveQuery Hooks
   */
  const pageData = useLiveQuery(async () => {
    if (!rfqId || !itemId) return null;

    const [
      rfq,
      item,
      allQuotes,
      parties,
      catalogProducts,
      categories,
      quoteAwards,
      awardItems,
      historyRecords,
      revisionNotes,
    ] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_items.get(itemId),
      rfqDb.seller_quotes.where("rfq_item_id").equals(itemId).toArray(),
      businessDb.parties.toArray(),
      catalogDb.products.toArray(),
      catalogDb.categories.toArray(),
      rfqDb.rfq_quote_awards.where("rfq_item_id").equals(itemId).toArray(),
      rfqDb.rfq_quote_item_awards.where("rfq_item_id").equals(itemId).toArray(),
      rfqDb.rfq_quote_item_award_revisions.where("rfq_item_id").equals(itemId).toArray(),
      rfqDb.rfq_award_revision_notes.where("rfq_item_id").equals(itemId).toArray(),
    ]);

    return {
      rfq,
      item,
      allQuotes: allQuotes || [],
      parties: parties || [],
      catalogProducts: catalogProducts || [],
      categories: categories || [],
      quoteAwards: quoteAwards || [],
      awardItems: awardItems || [],
      historyRecords: historyRecords || [],
      revisionNotes: revisionNotes || [],
    };
  }, [rfqId, itemId]);

  const {
    rfq,
    item,
    allQuotes = [],
    parties = [],
    catalogProducts = [],
    categories = [],
    quoteAwards = [],
    awardItems = [],
    historyRecords = [],
    revisionNotes = [],
  } = pageData ?? {};

  /*
   * 2. Active Seller Party Resolution
   */
  const sellerParty = useMemo(() => {
    if (!parties.length) return null;
    if (isBusinessContext) {
      return parties.find(p => p.owner_type === "BUSINESS" && p.owner_id === activeWorkspace?.businessId) || null;
    }
    return parties.find(p => p.owner_type === "USER" && p.owner_id === currentUserId) || parties.find(p => p.id === "pty-6") || null;
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  /*
   * 3. Seller's Target Quote & Award Info for this Line Item
   */
  const myQuote = useMemo(() => {
    if (!sellerParty?.id) return null;
    return allQuotes.find(q => q.seller_party_id === sellerParty.id) || null;
  }, [allQuotes, sellerParty]);

  const myAward = useMemo(() => {
    if (!sellerParty?.id) return null;
    return quoteAwards.find(a => a.seller_party_id === sellerParty.id) || null;
  }, [quoteAwards, sellerParty]);

  const myAwardItems = useMemo(() => {
    if (!sellerParty?.id) return [];
    return awardItems.filter(a => a.seller_party_id === sellerParty.id);
  }, [awardItems, sellerParty]);

  const product = useMemo(() => {
    if (!item?.catalog_product_id) return null;
    return catalogProducts.find(p => p.id === item.catalog_product_id) || null;
  }, [catalogProducts, item?.catalog_product_id]);

  const category = useMemo(() => {
    if (!item?.category_id) return null;
    return categories.find(c => c.id === item.category_id) || null;
  }, [categories, item?.category_id]);

  // Filter history records for this specific seller
  const sellerHistory = useMemo(() => {
    if (!sellerParty?.id) return [];
    return historyRecords
      .filter(h => h.seller_party_id === sellerParty.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [historyRecords, sellerParty]);

  const latestBuyerHistory = useMemo(() => {
    return sellerHistory.find(h => h.actor_type === "BUYER") || null;
  }, [sellerHistory]);

  const latestBuyerNoteInfo = useMemo(() => {
    // 1. Check dedicated rfq_award_revision_notes for this quote / seller
    const quoteRevisionNotes = (revisionNotes || [])
      .filter(n => (n.seller_quote_id === myQuote?.id || n.seller_party_id === sellerParty?.id) && n.actor_type === "BUYER")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const noteRecord = quoteRevisionNotes[0];

    // 2. Check myAward.notes (entered by buyer when awarding in RfqQuoteAwardingPage)
    const awardNote = myAward?.notes?.trim();

    // 3. Check latest buyer history audit record
    const historyNote = latestBuyerHistory?.note?.trim();
    const isCustomHistoryNote = historyNote && !historyNote.startsWith("Buyer awarded allocation for Round");

    const noteText = noteRecord?.note?.trim() || awardNote || (isCustomHistoryNote ? historyNote : undefined);

    if (!noteText) return null;

    const round = noteRecord?.award_round || myAward?.award_round || latestBuyerHistory?.award_round || 1;
    const timestamp = noteRecord?.created_at || myAward?.updated_at || myAward?.created_at || latestBuyerHistory?.created_at;

    return {
      note: noteText,
      round,
      timestamp,
      quoteNumber: myQuote?.seller_quote_number,
    };
  }, [revisionNotes, myQuote, sellerParty, myAward, latestBuyerHistory]);

  /*
   * 4. Breadcrumb Pattern (Rule 4A: Must be called before conditional returns)
   */
  const breadcrumbs = useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>Seller RFQs</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || "RFQ Workspace"}</a> },
    { title: <span className="text-slate-800 font-semibold">Item #{item?.item_index || 1} Award Allocation</span> },
  ], [navigate, basePath, rfqId, rfq?.rfq_number, item?.item_index]);

  useBreadcrumb(breadcrumbs);

  /*
   * 5. Interactive Multi-Variant Form States
   */
  const [variantResponses, setVariantResponses] = useState<VariantResponseRow[]>([]);
  const [responseNote, setResponseNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize response form with awarded variants or single fallback
  useEffect(() => {
    if (myAwardItems.length > 0) {
      setVariantResponses(
        myAwardItems.map(itemAward => {
          const variantHistory = sellerHistory.find(h => h.variant_id === itemAward.variant_id);
          const initialQty =
            itemAward.seller_offered_quantity ||
            itemAward.awarded_quantity ||
            itemAward.buyer_target_quantity ||
            variantHistory?.quantity ||
            1;
          const initialPrice =
            itemAward.unit_price ||
            variantHistory?.unit_price ||
            0;

          return {
            variantAwardId: itemAward.id,
            variantId: itemAward.variant_id,
            variantType: itemAward.variant_type || "CUSTOM",
            variantLabel: itemAward.variant_label || itemAward.sku || `Variant (${itemAward.variant_id})`,
            uom: itemAward.unit_of_measure || item?.req_unit || "PCS",
            buyerTargetQty: itemAward.buyer_target_quantity || itemAward.awarded_quantity || 1,
            buyerUnitPrice: itemAward.unit_price || 0,
            offeredQty: initialQty,
            offeredPrice: initialPrice,
          };
        })
      );
    } else if (myQuote) {
      const initialQty = latestBuyerHistory?.quantity || myQuote.offer_quantity || item?.req_quantity || 1;
      const initialPrice = latestBuyerHistory?.unit_price || 0;
      setVariantResponses([
        {
          variantAwardId: "fallback",
          variantId: "default",
          variantType: "CUSTOM",
          variantLabel: "Standard Line Item",
          uom: item?.req_unit || "PCS",
          buyerTargetQty: latestBuyerHistory?.quantity || item?.req_quantity || 1,
          buyerUnitPrice: initialPrice,
          offeredQty: initialQty,
          offeredPrice: initialPrice,
        },
      ]);
    }
  }, [myAwardItems, sellerHistory, myQuote, item?.req_quantity, item?.req_unit, latestBuyerHistory]);

  /*
   * 6. Loading & Guard Checks (Rule 4B: after all hooks)
   */
  if (!pageData || !rfq || !item) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-slate-500">
        <ClockCircleOutlined className="text-2xl animate-spin mb-2" />
        <div>Loading Award Revision details...</div>
      </div>
    );
  }

  const currentAwardRound = myAward?.award_round || 1;
  const currentProposalRound = myQuote?.round || 1;
  const awardStatus = myAward?.award_status || "AWARDED";
  const isConfirmed = awardStatus === "CONFIRMED";
  const isRevised = awardStatus === "SELLER_REVISED";

  const totalOfferedUnits = variantResponses.reduce((sum, r) => sum + (r.offeredQty || 0), 0);
  const totalOfferedAmount = variantResponses.reduce((sum, r) => sum + ((r.offeredQty || 0) * (r.offeredPrice || 0)), 0);
  const totalBuyerTargetUnits = variantResponses.reduce((sum, r) => sum + (r.buyerTargetQty || 0), 0);
  const totalBuyerTargetAmount = variantResponses.reduce((sum, r) => sum + ((r.buyerTargetQty || 0) * (r.buyerUnitPrice || 0)), 0);

  const handleRowQtyChange = (variantId: string, val: number | null) => {
    setVariantResponses(prev =>
      prev.map(row => (row.variantId === variantId ? { ...row, offeredQty: val || 0 } : row))
    );
  };

  const handleRowPriceChange = (variantId: string, val: number | null) => {
    setVariantResponses(prev =>
      prev.map(row => (row.variantId === variantId ? { ...row, offeredPrice: val || 0 } : row))
    );
  };

  /*
   * 7. Handlers
   */
  const handleAcceptAllocation = async () => {
    if (!myQuote) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      await rfqDb.transaction(
        "rw",
        [
          rfqDb.seller_quotes,
          rfqDb.rfq_quote_awards,
          rfqDb.rfq_quote_item_awards,
          rfqDb.rfq_quote_item_award_revisions,
          rfqDb.rfq_award_revision_notes,
        ],
        async () => {
          // 1. Update quote status to DEVIATION_ACCEPTED
          await rfqDb.seller_quotes.update(myQuote.id, {
            status: "DEVIATION_ACCEPTED",
            offer_quantity: totalBuyerTargetUnits || totalOfferedUnits,
            updated_at: now,
          });

          // 2. Update quote award
          if (myAward) {
            await rfqDb.rfq_quote_awards.update(myAward.id, {
              award_status: "CONFIRMED",
              seller_accepted_at: now,
              updated_at: now,
            });
          }

          // 3. Update each quote item award
          for (const row of variantResponses) {
            if (row.variantAwardId !== "fallback") {
              await rfqDb.rfq_quote_item_awards.update(row.variantAwardId, {
                variant_award_status: "CONFIRMED",
                seller_accepted: true,
                seller_accepted_at: now,
                seller_offered_quantity: row.buyerTargetQty,
                awarded_quantity: row.buyerTargetQty,
                unit_price: row.buyerUnitPrice,
                total_price: row.buyerTargetQty * row.buyerUnitPrice,
                updated_at: now,
              });
            }
          }

          // 4. Record audit revisions
          const revisions: RfqQuoteItemAwardRevision[] = variantResponses.map(row => ({
            id: `arh-${crypto.randomUUID()}`,
            quote_award_id: myAward?.id || "",
            quote_variant_award_id: row.variantAwardId !== "fallback" ? row.variantAwardId : undefined,
            rfq_id: rfqId!,
            rfq_item_id: itemId!,
            seller_party_id: sellerParty?.id || "pty-seller",
            seller_quote_id: myQuote.id,
            award_round: currentAwardRound,
            actor_type: "SELLER",
            actor_id: currentUserId || "seller-user",
            variant_id: row.variantId,
            quantity: row.buyerTargetQty,
            unit_price: row.buyerUnitPrice,
            note: responseNote.trim() ? `Accepted: ${responseNote.trim()}` : "Seller accepted requested allocation.",
            created_at: now,
          }));

          if (revisions.length > 0) {
            await rfqDb.rfq_quote_item_award_revisions.bulkAdd(revisions);
          }

          // 5. Record note if provided
          if (responseNote.trim()) {
            await rfqDb.rfq_award_revision_notes.add({
              id: `arn-${crypto.randomUUID()}`,
              rfq_id: rfqId!,
              rfq_item_id: itemId!,
              seller_party_id: sellerParty?.id || "pty-seller",
              seller_quote_id: myQuote.id,
              buyer_party_id: rfq.requester_party_id || rfq.requester_id || "pty-buyer",
              quote_award_id: myAward?.id,
              award_round: currentAwardRound,
              actor_type: "SELLER",
              actor_id: currentUserId || "seller-user",
              note_type: "SELLER_ACCEPTANCE",
              note: responseNote.trim(),
              created_at: now,
            });
          }
        }
      );

      notification.success({
        message: "Award Allocation Confirmed",
        description: `You have successfully confirmed the allocation of ${totalBuyerTargetUnits} units totaling ${formatCurrency(totalBuyerTargetAmount)}.`,
      });

      navigate(`${basePath}/${rfqId}`);
    } catch (err) {
      console.error("Failed to accept allocation", err);
      message.error("Failed to accept allocation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!myQuote) return;

    for (const row of variantResponses) {
      if (row.offeredQty <= 0) {
        message.warning(`Please enter a valid fulfillable quantity greater than 0 for ${row.variantLabel}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      await rfqDb.transaction(
        "rw",
        [
          rfqDb.seller_quotes,
          rfqDb.rfq_quote_awards,
          rfqDb.rfq_quote_item_awards,
          rfqDb.rfq_quote_item_award_revisions,
          rfqDb.rfq_award_revision_notes,
        ],
        async () => {
          // 1. Update quote
          await rfqDb.seller_quotes.update(myQuote.id, {
            status: "SUBMITTED",
            offer_quantity: totalOfferedUnits,
            updated_at: now,
          });

          // 2. Update quote award
          if (myAward) {
            await rfqDb.rfq_quote_awards.update(myAward.id, {
              award_status: "SELLER_REVISED",
              total_awarded_quantity: totalOfferedUnits,
              total_awarded_amount: totalOfferedAmount,
              updated_at: now,
            });
          }

          // 3. Update each quote item award
          for (const row of variantResponses) {
            if (row.variantAwardId !== "fallback") {
              await rfqDb.rfq_quote_item_awards.update(row.variantAwardId, {
                variant_award_status: "SELLER_REVISED",
                seller_accepted: false,
                seller_offered_quantity: row.offeredQty,
                unit_price: row.offeredPrice,
                total_price: row.offeredQty * row.offeredPrice,
                updated_at: now,
              });
            }
          }

          // 4. Record counter-offer in audit trail
          const revisions: RfqQuoteItemAwardRevision[] = variantResponses.map(row => ({
            id: `arh-${crypto.randomUUID()}`,
            quote_award_id: myAward?.id || "",
            quote_variant_award_id: row.variantAwardId !== "fallback" ? row.variantAwardId : undefined,
            rfq_id: rfqId!,
            rfq_item_id: itemId!,
            seller_party_id: sellerParty?.id || "pty-seller",
            seller_quote_id: myQuote.id,
            award_round: currentAwardRound,
            actor_type: "SELLER",
            actor_id: currentUserId || "seller-user",
            variant_id: row.variantId,
            quantity: row.offeredQty,
            unit_price: row.offeredPrice,
            note: responseNote.trim() ? `Counter-Offer: ${responseNote.trim()}` : "Seller submitted revised counter-offer.",
            created_at: now,
          }));

          if (revisions.length > 0) {
            await rfqDb.rfq_quote_item_award_revisions.bulkAdd(revisions);
          }

          // 5. Record note if provided
          if (responseNote.trim()) {
            await rfqDb.rfq_award_revision_notes.add({
              id: `arn-${crypto.randomUUID()}`,
              rfq_id: rfqId!,
              rfq_item_id: itemId!,
              seller_party_id: sellerParty?.id || "pty-seller",
              seller_quote_id: myQuote.id,
              buyer_party_id: rfq.requester_party_id || rfq.requester_id || "pty-buyer",
              quote_award_id: myAward?.id,
              award_round: currentAwardRound,
              actor_type: "SELLER",
              actor_id: currentUserId || "seller-user",
              note_type: "SELLER_COUNTER_OFFER",
              note: responseNote.trim(),
              created_at: now,
            });
          }
        }
      );

      notification.info({
        message: "Counter-Offer Submitted",
        description: `Your counter-offer of ${totalOfferedUnits} units totaling ${formatCurrency(totalOfferedAmount)} has been sent to the buyer.`,
      });

      navigate(`${basePath}/${rfqId}`);
    } catch (err) {
      console.error("Failed to submit counter offer", err);
      message.error("Failed to submit counter offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    {
      title: "Variant / Option",
      dataIndex: "variantLabel",
      key: "variantLabel",
      render: (label: string, record: VariantResponseRow) => (
        <div>
          <div className="font-bold text-xs text-slate-800">{label}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <AntTag color={record.variantType === "CUSTOM" ? "blue" : "purple"} className="text-[10px] m-0">
              {record.variantType}
            </AntTag>
            <span className="text-[10px] text-slate-400 font-mono">ID: {record.variantId}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Buyer Requested Allocation",
      key: "buyerTarget",
      align: "right" as const,
      render: (_: any, record: VariantResponseRow) => (
        <div className="text-right">
          <div className="font-bold text-xs text-indigo-700">
            {record.buyerTargetQty} {record.uom}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            @ {formatCurrency(record.buyerUnitPrice)}
          </div>
        </div>
      ),
    },
    {
      title: "Fulfillable Quantity",
      key: "offeredQty",
      width: 180,
      render: (_: any, record: VariantResponseRow) => (
        <div className="space-y-1">
          <InputNumber
            min={1}
            step={1}
            disabled={isConfirmed || isSubmitting}
            value={record.offeredQty}
            onChange={val => handleRowQtyChange(record.variantId, val)}
            className="w-full font-mono font-bold"
            size="middle"
            addonAfter={record.uom}
          />
          {record.offeredQty !== record.buyerTargetQty && (
            <span className="text-[10px] text-amber-600 block font-medium">
              Requested: {record.buyerTargetQty} {record.uom} ({record.offeredQty - record.buyerTargetQty > 0 ? `+${record.offeredQty - record.buyerTargetQty}` : record.offeredQty - record.buyerTargetQty})
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Confirmed Unit Price",
      key: "offeredPrice",
      width: 180,
      render: (_: any, record: VariantResponseRow) => (
        <div className="space-y-1">
          <InputNumber
            min={0}
            step={0.01}
            disabled={isConfirmed || isSubmitting}
            value={record.offeredPrice}
            onChange={val => handleRowPriceChange(record.variantId, val)}
            className="w-full font-mono font-bold"
            size="middle"
            prefix={<DollarOutlined className="text-slate-400" />}
          />
          {record.offeredPrice !== record.buyerUnitPrice && (
            <span className="text-[10px] text-amber-600 block font-medium">
              Target: {formatCurrency(record.buyerUnitPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Line Subtotal",
      key: "subtotal",
      align: "right" as const,
      render: (_: any, record: VariantResponseRow) => {
        const subtotal = (record.offeredQty || 0) * (record.offeredPrice || 0);
        return (
          <div className="text-right">
            <div className="font-mono font-bold text-xs text-emerald-700">
              {formatCurrency(subtotal)}
            </div>
            <div className="text-[10px] text-slate-400">
              {record.offeredQty} &times; {formatCurrency(record.offeredPrice)}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* 1. Page Header Card */}
      <Card size="small" className="shadow-sm border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">
                Award Allocation Review
              </h1>
              <AntTag color="purple" className="font-bold text-xs">
                Award Round {currentAwardRound}
              </AntTag>
              {isConfirmed && (
                <AntTag color="emerald" className="font-bold text-xs">
                  CONFIRMED
                </AntTag>
              )}
              {isRevised && (
                <AntTag color="orange" className="font-bold text-xs">
                  COUNTER-OFFER SUBMITTED
                </AntTag>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 m-0">
              The buyer has awarded line item allocation to your quote across variant options. Review the requested quantities and pricing, then confirm or counter-propose revised allocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`${basePath}/${rfqId}`)}
              className="text-xs"
            >
              Back to RFQ
            </Button>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              RFQ: {rfq.rfq_number}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Status Alerts */}
      {isConfirmed && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined className="text-emerald-600" />}
          message={<span className="font-bold text-xs text-emerald-900">Award Allocation Confirmed & Accepted</span>}
          description={
            <span className="text-xs text-emerald-800">
              You have confirmed and accepted this award allocation{myAward?.seller_accepted_at ? ` on ${new Date(myAward.seller_accepted_at).toLocaleString()}` : ""}. The buyer can now proceed with Purchase Order issuance.
            </span>
          }
          className="bg-emerald-50 border-emerald-200 shadow-sm"
        />
      )}

      {isRevised && (
        <Alert
          type="info"
          showIcon
          message={<span className="font-bold text-xs text-blue-900">Counter-Offer Sent to Buyer</span>}
          description={
            <span className="text-xs text-blue-800">
              Your revised counter-offer is currently under review by the buyer. You will be notified once the buyer responds or re-issues the award allocation.
            </span>
          }
          className="bg-blue-50 border-blue-200 shadow-sm"
        />
      )}

      {/* 3. Line Item Overview */}
      <Card size="small" className="shadow-sm border-slate-200 bg-white">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                Line Item #{item.item_index || 1}
              </span>
              <h3 className="font-bold text-slate-800 text-sm m-0">
                {product?.name || category?.name || "RFQ Product Item"}
              </h3>
              <AntTag color="blue" className="text-[11px] font-medium m-0">
                {category?.name || "Category"}
              </AntTag>
            </div>

            <div className="flex items-center gap-2">
              <AntTag color="cyan" className="font-semibold text-xs">
                Proposal R{currentProposalRound}
              </AntTag>
              <AntTag color="purple" className="font-semibold text-xs">
                Award Round {currentAwardRound}
              </AntTag>
            </div>
          </div>

          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, md: 3 }}
            classNames={{
              label: "text-xs font-medium text-slate-600 bg-slate-50 p-2",
              content: "text-xs font-semibold text-slate-800 p-2",
            }}
          >
            <Descriptions.Item label="Original RFQ Quantity">
              <span>{item.req_quantity} {item.req_unit || "PCS"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Buyer Total Requested Allocation">
              <span className="font-bold text-indigo-700 text-sm">
                {totalBuyerTargetUnits} {item.req_unit || "PCS"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Buyer Total Target Value">
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(totalBuyerTargetAmount)}
              </span>
            </Descriptions.Item>
          </Descriptions>

          {/* Buyer's Latest Note Callout */}
          {latestBuyerNoteInfo && (
            <Alert
              type="warning"
              showIcon
              icon={<FileTextOutlined className="text-amber-600 text-sm mt-0.5" />}
              message={
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-xs text-amber-900">
                    Latest Buyer&apos;s Note for Quote {latestBuyerNoteInfo.quoteNumber ? `(${latestBuyerNoteInfo.quoteNumber})` : ""} (Round {latestBuyerNoteInfo.round}):
                  </span>
                  {latestBuyerNoteInfo.timestamp && (
                    <span className="text-[11px] text-amber-700/80 font-normal font-mono">
                      {new Date(latestBuyerNoteInfo.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              }
              description={
                <div className="mt-1 bg-amber-100/40 p-2 rounded border border-amber-200/60">
                  <span className="text-xs text-amber-950 italic font-medium leading-relaxed">
                    &ldquo;{latestBuyerNoteInfo.note}&rdquo;
                  </span>
                </div>
              }
              className="bg-amber-50/80 border-amber-200 shadow-xs"
            />
          )}
        </div>
      </Card>

      {/* 4. Multi-Variant Allocation Response Table */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingOutlined className="text-emerald-600" />
              <span className="font-bold text-xs text-slate-800">Your Allocation Response</span>
            </div>
            <span className="text-xs text-slate-500 font-normal">
              {variantResponses.length} Awarded Variant Option{variantResponses.length !== 1 ? "s" : ""}
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          <Table
            dataSource={variantResponses}
            columns={tableColumns}
            rowKey="variantId"
            pagination={false}
            size="small"
            bordered
            className="border border-slate-200 rounded-md overflow-hidden"
          />

          {/* Allocation Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Fulfillable Quantity:</span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {totalOfferedUnits} {item.req_unit || "PCS"}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Buyer Target: {totalBuyerTargetUnits} {item.req_unit || "PCS"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Total Contract Allocation:</span>
                <span className="text-base font-mono font-bold text-emerald-700">
                  {formatCurrency(totalOfferedAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Buyer Target Total: {formatCurrency(totalBuyerTargetAmount)}
                </span>
              </div>
            </div>

            {totalOfferedUnits !== totalBuyerTargetUnits && (
              <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded border border-amber-200 font-medium">
                Note: Total offered quantity differs by {Math.abs(totalOfferedUnits - totalBuyerTargetUnits)} {item.req_unit || "PCS"} from requested allocation.
              </div>
            )}
          </div>

          {!isConfirmed && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Response / Clarification Note for Buyer:
              </label>
              <Input.TextArea
                rows={3}
                placeholder="e.g. We confirm we can fulfill the requested variants at the agreed schedule, with shipping within 10 business days."
                value={responseNote}
                onChange={e => setResponseNote(e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
          )}

          <Divider className="my-2" />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              size="middle"
              onClick={() => navigate(`${basePath}/${rfqId}`)}
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              Back to RFQ
            </Button>

            {!isConfirmed ? (
              <Space>
                <Button
                  type="default"
                  size="middle"
                  icon={<SendOutlined />}
                  onClick={handleCounterOffer}
                  loading={isSubmitting}
                  className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:border-indigo-400"
                >
                  Send as Revised (Counter-Offer)
                </Button>

                <Button
                  type="primary"
                  size="middle"
                  icon={<CheckCircleOutlined />}
                  onClick={handleAcceptAllocation}
                  loading={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold border-0"
                >
                  Accept & Confirm Award
                </Button>
              </Space>
            ) : (
              <Button
                type="primary"
                size="middle"
                onClick={() => navigate(`${basePath}/${rfqId}`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold border-0"
              >
                Done (Confirmed)
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerAwardRevisionResponse;
