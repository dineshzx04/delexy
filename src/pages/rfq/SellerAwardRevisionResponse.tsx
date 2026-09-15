import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, Descriptions, Button, Tag as AntTag, Alert, InputNumber, Input, Space, Divider, Table, App as AntApp } from "antd";
import { CheckCircleOutlined, SendOutlined, ShoppingOutlined, FileTextOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { rfqDb, type RfqQuoteItemAwardRevision } from "../../data/rfq";
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

  const { isBusinessContext, basePath } = useMemo(() => {
    const isBusiness = activeWorkspace?.type === "BUSINESS";
    return {
      isBusinessContext: isBusiness,
      basePath: isBusiness ? "/b/seller/rfqs" : "/user/seller/rfqs",
    };
  }, [activeWorkspace?.type]);

  const [variantResponses, setVariantResponses] = useState<VariantResponseRow[]>([]);
  const [responseNote, setResponseNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const pageData = useLiveQuery(async () => {
    if (!rfqId || !itemId) return null;

    const [rfq, item, allQuotes, parties, catalogProducts, categories, quoteAwards, awardItems, historyRecords, revisionNotes] = await Promise.all([
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

  const { rfq, item, allQuotes = [], parties = [], catalogProducts = [], categories = [], quoteAwards = [], awardItems = [], historyRecords = [], revisionNotes = [] } = pageData ?? {};

  const {
    sellerParty,
    myQuote,
    myAward,
    myAwardItems,
    product,
    category,
    sellerHistory,
    latestBuyerHistory,
    latestBuyerNoteInfo,
    currentAwardRound,
    currentProposalRound,
    awardStatus,
    isConfirmed,
    isRevised,
    isViewMode,
    latestSellerNoteInfo,
  } = useMemo(() => {
    const party = parties.length
      ? isBusinessContext
        ? parties.find(p => p.owner_type === "BUSINESS" && p.owner_id === activeWorkspace?.businessId) || null
        : parties.find(p => p.owner_type === "USER" && p.owner_id === currentUserId) || parties.find(p => p.id === "pty-6") || null
      : null;

    const sellerId = party?.id;
    const quote = sellerId ? allQuotes.find(q => q.seller_party_id === sellerId) || null : null;
    const award = sellerId ? quoteAwards.find(a => a.seller_party_id === sellerId) || null : null;
    const items = sellerId ? awardItems.filter(a => a.seller_party_id === sellerId) : [];

    const prod = item?.catalog_product_id ? catalogProducts.find(p => p.id === item.catalog_product_id) || null : null;
    const cat = item?.category_id ? categories.find(c => c.id === item.category_id) || null : null;

    const history = sellerId ? historyRecords.filter(h => h.seller_party_id === sellerId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
    const buyerHistory = history.find(h => h.actor_type === "BUYER") || null;

    const quoteRevisionNotes = (revisionNotes || [])
      .filter(n => (n.seller_quote_id === quote?.id || n.seller_party_id === sellerId) && n.actor_type === "BUYER")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const noteRecord = quoteRevisionNotes[0];
    const awardNote = award?.notes?.trim();
    const historyNote = buyerHistory?.note?.trim();
    const isCustomHistoryNote = historyNote && !historyNote.startsWith("Buyer awarded allocation for Round");
    const noteText = noteRecord?.note?.trim() || awardNote || (isCustomHistoryNote ? historyNote : undefined);

    const buyerNoteInfo = noteText
      ? {
        note: noteText,
        round: noteRecord?.award_round || award?.award_round || buyerHistory?.award_round || 1,
        timestamp: noteRecord?.created_at || award?.updated_at || award?.created_at || buyerHistory?.created_at,
        quoteNumber: quote?.seller_quote_number,
      }
      : null;

    const sellerRevisionNotes = (revisionNotes || [])
      .filter(n => (n.seller_quote_id === quote?.id || n.seller_party_id === sellerId) && n.actor_type === "SELLER")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const sellerNoteRecord = sellerRevisionNotes[0];
    const sellerNoteText = sellerNoteRecord?.note?.trim();
    const sellerNoteInfo = sellerNoteText
      ? {
        note: sellerNoteText,
        round: sellerNoteRecord?.award_round || award?.award_round || 1,
        timestamp: sellerNoteRecord?.created_at,
        noteType: sellerNoteRecord?.note_type,
      }
      : null;

    const currentAwardRound = award?.award_round || 1;
    const currentProposalRound = quote?.round || 1;
    const status = award?.award_status || "AWARDED";
    const isConfirmed = status === "CONFIRMED";
    const isRevised = status === "SELLER_REVISED";
    const isViewMode = isConfirmed || isRevised;

    return {
      sellerParty: party,
      myQuote: quote,
      myAward: award,
      myAwardItems: items,
      product: prod,
      category: cat,
      sellerHistory: history,
      latestBuyerHistory: buyerHistory,
      latestBuyerNoteInfo: buyerNoteInfo,
      latestSellerNoteInfo: sellerNoteInfo,
      currentAwardRound,
      currentProposalRound,
      awardStatus: status,
      isConfirmed,
      isRevised,
      isViewMode,
    };
  }, [
    parties,
    isBusinessContext,
    activeWorkspace?.businessId,
    currentUserId,
    allQuotes,
    quoteAwards,
    awardItems,
    item?.catalog_product_id,
    item?.category_id,
    catalogProducts,
    categories,
    historyRecords,
    revisionNotes,
  ]);

  const { totalOfferedUnits, totalOfferedAmount, totalBuyerTargetUnits, totalBuyerTargetAmount, isQtyChanged, isPriceChanged, canAcceptAllocation } = useMemo(() => {
    let offeredUnits = 0;
    let offeredAmount = 0;
    let buyerUnits = 0;
    let buyerAmount = 0;
    let qtyChanged = false;
    let priceChanged = false;

    for (const r of variantResponses) {
      const oQty = r.offeredQty || 0;
      const oPrice = r.offeredPrice || 0;
      const bQty = r.buyerTargetQty || 0;
      const bPrice = r.buyerUnitPrice || 0;

      offeredUnits += oQty;
      offeredAmount += oQty * oPrice;
      buyerUnits += bQty;
      buyerAmount += bQty * bPrice;

      if (r.offeredQty !== r.buyerTargetQty) qtyChanged = true;
      if (r.offeredPrice !== r.buyerUnitPrice) priceChanged = true;
    }

    return {
      totalOfferedUnits: offeredUnits,
      totalOfferedAmount: offeredAmount,
      totalBuyerTargetUnits: buyerUnits,
      totalBuyerTargetAmount: buyerAmount,
      isQtyChanged: qtyChanged,
      isPriceChanged: priceChanged,
      canAcceptAllocation: !qtyChanged && !priceChanged,
    };
  }, [variantResponses]);

  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(basePath)}>Seller RFQs</a> },
      { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || "RFQ Workspace"}</a> },
      { title: <span className="text-slate-800 font-semibold">Item #{item?.item_index || 1} Award Allocation</span> },
    ],
    [navigate, basePath, rfqId, rfq?.rfq_number, item?.item_index],
  );

  useBreadcrumb(breadcrumbs);

  useEffect(() => {
    if (myAwardItems.length > 0) {
      setVariantResponses(
        myAwardItems.map(itemAward => {
          const initialQty = itemAward?.seller_offered_quantity || itemAward?.buyer_target_quantity || 1;
          const initialPrice = itemAward.unit_price || 0;

          return {
            variantAwardId: itemAward.id,
            variantId: itemAward.variant_id,
            variantType: itemAward.variant_type,
            variantLabel: itemAward.variant_label || itemAward.sku || `Variant (${itemAward.variant_id})`,
            uom: itemAward.unit_of_measure || item?.req_unit || "PCS",
            buyerTargetQty: itemAward?.buyer_target_quantity || 1,
            buyerUnitPrice: itemAward.unit_price || 0,
            offeredQty: initialQty,
            offeredPrice: initialPrice,
          };
        }),
      );
    }
  }, [myAwardItems, sellerHistory, item?.req_unit]);

  const handleRowQtyChange = (variantId: string, val: number | null) => {
    setVariantResponses(prev => prev.map(row => (row.variantId === variantId ? { ...row, offeredQty: val || 0 } : row)));
  };

  const tableColumns = useMemo(
    () => [
      {
        title: "Variant / Option",
        dataIndex: "variantLabel",
        key: "variantLabel",
        render: (label: string, record: VariantResponseRow) => (
          <div>
            <div className="font-semibold text-xs text-slate-800">{label}</div>
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
            <div className="text-[11px] text-slate-500 font-medium">@ {formatCurrency(record.buyerUnitPrice)}</div>
          </div>
        ),
      },
      {
        title: "Fulfillable Quantity",
        key: "offeredQty",
        width: 180,
        render: (_: any, record: VariantResponseRow) => (
          isViewMode ? (
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-800 font-mono">
                {record.offeredQty} {record.uom}
              </div>
              {record.offeredQty !== record.buyerTargetQty ? (
                <span className="text-[10px] text-amber-600 block font-medium">
                  Requested: {record.buyerTargetQty} {record.uom} (
                  {record.offeredQty - record.buyerTargetQty > 0 ? `+${record.offeredQty - record.buyerTargetQty}` : record.offeredQty - record.buyerTargetQty})
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 block font-medium">Matches requested ✓</span>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <InputNumber
                min={1}
                step={1}
                disabled={isSubmitting}
                value={record.offeredQty}
                onChange={val => handleRowQtyChange(record.variantId, val)}
                className="w-full font-mono font-bold"
                size="middle"
                addonAfter={record.uom}
              />
              {record.offeredQty !== record.buyerTargetQty && (
                <span className="text-[10px] text-amber-600 block font-medium">
                  Requested: {record.buyerTargetQty} {record.uom} (
                  {record.offeredQty - record.buyerTargetQty > 0 ? `+${record.offeredQty - record.buyerTargetQty}` : record.offeredQty - record.buyerTargetQty})
                </span>
              )}
            </div>
          )
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
              <div className="font-mono font-bold text-xs text-emerald-700">{formatCurrency(subtotal)}</div>
              <div className="text-[10px] text-slate-400">
                {record.offeredQty} &times; {formatCurrency(record.offeredPrice)}
              </div>
            </div>
          );
        },
      },
    ],
    [isViewMode, isSubmitting],
  );

  if (!pageData || !rfq || !item) {
    return (
      <div className="mx-auto p-8 text-center text-slate-500">
        <ClockCircleOutlined className="text-2xl animate-spin mb-2" />
        <div>Loading Award Revision details...</div>
      </div>
    );
  }

  if (!myAward || myAwardItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-white rounded-lg border border-slate-200 mt-8 space-y-3">
        <h2 className="text-base font-bold text-slate-800">No Award Allocation Found</h2>
        <p className="text-xs text-slate-500">There are no awarded items or allocations assigned to your account for this line item.</p>
        <Button type="primary" size="small" onClick={() => navigate(basePath)}>
          Back to Seller RFQs
        </Button>
      </div>
    );
  }

  const handleSubmitAwardAllocation = async () => {
    if (!myQuote) return;

    if (isQtyChanged) {
      message.warning("Fulfillable quantity differs from the requested allocation. Please submit as an award revision.");
      return;
    }

    if (isPriceChanged) {
      message.warning("Unit price differs from the buyer's target price. Please submit as an award revision.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      await rfqDb.transaction(
        "rw",
        [rfqDb.seller_quotes, rfqDb.rfq_quote_awards, rfqDb.rfq_quote_item_awards, rfqDb.rfq_quote_item_award_revisions, rfqDb.rfq_award_revision_notes],
        async () => {
          await rfqDb.seller_quotes.update(myQuote.id, {
            status: "DEVIATION_ACCEPTED",
            offer_quantity: totalBuyerTargetUnits || totalOfferedUnits,
            updated_at: now,
          });

          if (myAward) {
            await rfqDb.rfq_quote_awards.update(myAward.id, {
              award_status: "CONFIRMED",
              seller_accepted_at: now,
              updated_at: now,
            });
          }

          for (const row of variantResponses) {
            await rfqDb.rfq_quote_item_awards.update(row.variantAwardId, {
              variant_award_status: "CONFIRMED",
              seller_accepted: true,
              seller_accepted_at: now,
              seller_offered_quantity: row.buyerTargetQty,
              buyer_target_quantity: row.buyerTargetQty,
              unit_price: row.buyerUnitPrice,
              total_price: row.buyerTargetQty * row.buyerUnitPrice,
              updated_at: now,
            });
          }

          const revisions: RfqQuoteItemAwardRevision[] = variantResponses.map(row => ({
            id: `arh-${crypto.randomUUID()}`,
            quote_award_id: myAward?.id || "",
            quote_variant_award_id: row.variantAwardId,
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
        },
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

  const handleSubmitAwardRevision = async () => {
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
        [rfqDb.rfq_quote_awards, rfqDb.rfq_quote_item_awards, rfqDb.rfq_quote_item_award_revisions, rfqDb.rfq_award_revision_notes],
        async () => {
          if (myAward) {
            await rfqDb.rfq_quote_awards.update(myAward.id, {
              award_status: "SELLER_REVISED",
              updated_at: now,
            });
          }

          for (const row of variantResponses) {
            await rfqDb.rfq_quote_item_awards.update(row.variantAwardId, {
              variant_award_status: "SELLER_REVISED",
              seller_accepted: false,
              seller_offered_quantity: row.offeredQty,
              total_price: row.offeredQty * row.offeredPrice,
              updated_at: now,
            });
          }

          const sellerPartyId = sellerParty?.id || myQuote.seller_party_id;
          const currentActorId = currentUserId || "seller-user";

          const revisions: RfqQuoteItemAwardRevision[] = variantResponses.map(row => ({
            id: `arh-${crypto.randomUUID()}`,
            quote_award_id: myAward?.id || "",
            quote_variant_award_id: row.variantAwardId,
            rfq_id: rfqId!,
            rfq_item_id: itemId!,
            seller_party_id: sellerPartyId,
            seller_quote_id: myQuote.id,
            award_round: currentAwardRound,
            actor_type: "SELLER",
            actor_id: currentActorId,
            variant_id: row.variantId,
            quantity: row.offeredQty,
            unit_price: row.offeredPrice,
            note: responseNote.trim() ? `Award Revision: ${responseNote.trim()}` : "Seller submitted award revision.",
            created_at: now,
          }));

          if (revisions.length > 0) {
            await rfqDb.rfq_quote_item_award_revisions.bulkAdd(revisions);
          }

          if (responseNote.trim()) {
            await rfqDb.rfq_award_revision_notes.add({
              id: `arn-${crypto.randomUUID()}`,
              rfq_id: rfqId!,
              rfq_item_id: itemId!,
              seller_party_id: sellerPartyId,
              seller_quote_id: myQuote.id,
              buyer_party_id: rfq.requester_party_id || rfq.requester_id,
              quote_award_id: myAward?.id,
              award_round: currentAwardRound,
              actor_type: "SELLER",
              actor_id: currentActorId,
              note_type: "SELLER_AWARD_REVISION",
              note: responseNote.trim(),
              created_at: now,
            });
          }
        },
      );

      notification.info({
        message: "Award Revision Submitted",
        description: `Your award revision of ${totalOfferedUnits} units totaling ${formatCurrency(totalOfferedAmount)} has been sent to the buyer.`,
      });

      navigate(`${basePath}/${rfqId}`);
    } catch (err) {
      console.error("Failed to submit award revision", err);
      message.error("Failed to submit award revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 pb-12">
      {/* Structural Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">
            Award Allocation Response
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Review line item award details, manage fulfillable variant allocations, and submit your response or revision.
          </p>
        </div>
      </div>
      {isConfirmed && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined className="text-emerald-600" />}
          message={<span className="font-bold text-xs text-emerald-900">Award Allocation Confirmed & Accepted</span>}
          description={
            <span className="text-xs text-emerald-800">
              You have confirmed this award allocation{myAward?.seller_accepted_at ? ` on ${new Date(myAward.seller_accepted_at).toLocaleString()}` : ""}. The buyer can now proceed with Purchase Order issuance.
            </span>
          }
          className="bg-emerald-50 border-emerald-200"
        />
      )}

      {isRevised && (
        <Alert
          type="info"
          showIcon
          message={<span className="font-bold text-xs text-blue-900">Award Revision Sent to Buyer</span>}
          description={
            <span className="text-xs text-blue-800">
              Your award revision is currently under review by the buyer. You will be notified once the buyer responds or re-issues the allocation.
            </span>
          }
          className="bg-blue-50 border-blue-200"
        />
      )}
      <Card size="small" className="shadow-sm border-slate-200 bg-white" title={<span className="font-bold text-xs text-slate-800">Line Item Award Overview</span>}>
        <div className="space-y-3">
          <Descriptions
            bordered
            size="small"
            column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            labelStyle={{ fontSize: "12px", fontWeight: 600, color: "#475569", backgroundColor: "#f8fafc", width: "150px" }}
            contentStyle={{ fontSize: "12px", color: "#1e293b" }}
          >
            <Descriptions.Item label="Line Item">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Item #{item.item_index || 1}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Product / Category">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-800 text-xs">
                  {product?.name || category?.name || "RFQ Product Item"}
                </span>
                {category?.name && (
                  <AntTag color="blue" className="text-[10px] m-0">
                    {category.name}
                  </AntTag>
                )}
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="RFQ Number">
              <span className="font-mono font-bold text-slate-700 text-xs">
                {rfq.rfq_number}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Proposal Round">
              <AntTag color="cyan" className="font-semibold text-xs m-0">
                Round {currentProposalRound}
              </AntTag>
            </Descriptions.Item>

            <Descriptions.Item label="Award Round">
              <AntTag color="purple" className="font-semibold text-xs m-0">
                Award Round {currentAwardRound}
              </AntTag>
            </Descriptions.Item>

            <Descriptions.Item label="Award Status">
              {isConfirmed ? (
                <AntTag color="emerald" className="font-bold text-xs m-0">
                  CONFIRMED
                </AntTag>
              ) : isRevised ? (
                <AntTag color="orange" className="font-bold text-xs m-0">
                  AWARD REVISION SUBMITTED
                </AntTag>
              ) : (
                <AntTag color="blue" className="font-bold text-xs m-0">
                  ACTION REQUIRED
                </AntTag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Original RFQ Quantity">
              <span className="font-semibold text-slate-700 font-mono text-xs">
                {item.req_quantity} {item.req_unit || "PCS"}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Buyer Requested Allocation">
              <span className="font-bold text-indigo-700 font-mono text-xs">
                {totalBuyerTargetUnits} {item.req_unit || "PCS"}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Buyer Total Target Value">
              <span className="font-bold text-emerald-700 font-mono text-xs">
                {formatCurrency(totalBuyerTargetAmount)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Card>

      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingOutlined className="text-indigo-600" />
              <span className="font-bold text-xs text-slate-800">Awarded Variant Quantity Allocation</span>
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
            classNames={{ header: { cell: "text-[12px]" } }}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center gap-6">
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
                <span className="text-base font-mono font-bold text-emerald-700">{formatCurrency(totalOfferedAmount)}</span>
                <span className="text-[10px] text-slate-400 block">Buyer Target Total: {formatCurrency(totalBuyerTargetAmount)}</span>
              </div>
            </div>

            {totalOfferedUnits !== totalBuyerTargetUnits && (
              <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded border border-amber-200 font-medium">
                Note: Total offered quantity differs by {Math.abs(totalOfferedUnits - totalBuyerTargetUnits)} {item.req_unit || "PCS"} from requested allocation.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Communication Thread & Action Card */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-indigo-600" />
            <span className="font-bold text-xs text-slate-800">Award Revision Notes & Communication Thread</span>
          </div>
        }
      >
        <div className="space-y-4">
          {(latestBuyerNoteInfo || (isViewMode ? latestSellerNoteInfo : true)) ? (
            <div className="space-y-3">
              {/* Buyer Note Thread Item */}
              {latestBuyerNoteInfo && (
                <div className="bg-white p-3 rounded-md border border-amber-200/90 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                        Buyer Note
                      </span>
                      <span className="text-slate-600 font-medium text-[11px]">
                        Quote {latestBuyerNoteInfo.quoteNumber ? `(${latestBuyerNoteInfo.quoteNumber})` : ""} &bull; Round {latestBuyerNoteInfo.round}
                      </span>
                    </div>
                    {latestBuyerNoteInfo.timestamp && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(latestBuyerNoteInfo.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-800 bg-amber-50/50 p-2.5 rounded border border-amber-100 leading-relaxed italic">
                    &ldquo;{latestBuyerNoteInfo.note}&rdquo;
                  </div>
                </div>
              )}

              {/* Seller Note / Response Thread Item */}
              {isViewMode ? (
                latestSellerNoteInfo && (
                  <div className="bg-white p-3 rounded-md border border-indigo-200/90 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                          Your Response
                        </span>
                        <span className="text-slate-600 font-medium text-[11px]">
                          Round {latestSellerNoteInfo.round}
                        </span>
                      </div>
                      {latestSellerNoteInfo.timestamp && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(latestSellerNoteInfo.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 bg-indigo-50/40 p-2.5 rounded border border-indigo-100 leading-relaxed italic">
                      &ldquo;{latestSellerNoteInfo.note}&rdquo;
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-white p-3 rounded-md border border-indigo-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                        Your Response
                      </span>
                      <span className="text-slate-500 font-medium text-[11px]">
                        Round {currentAwardRound} (Drafting Clarification / Revision Note)
                      </span>
                    </div>
                  </div>
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
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No notes or communication records for this award allocation.
            </div>
          )}

          <Divider className="my-2" />

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {isViewMode ? (
              <Button
                type="primary"
                size="middle"
                onClick={() => navigate(`${basePath}/${rfqId}`)}
                className="text-xs font-semibold"
              >
                Back to RFQ Workspace
              </Button>
            ) : (
              <Space>
                <Button
                  type="default"
                  size="middle"
                  icon={<SendOutlined />}
                  onClick={handleSubmitAwardRevision}
                  loading={isSubmitting}
                  className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:border-indigo-400"
                >
                  Submit Award Revision
                </Button>

                {canAcceptAllocation && (
                  <Button
                    type="primary"
                    size="middle"
                    icon={<CheckCircleOutlined />}
                    onClick={handleSubmitAwardAllocation}
                    loading={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold border-0"
                  >
                    Accept & Confirm Award
                  </Button>
                )}
              </Space>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerAwardRevisionResponse;
