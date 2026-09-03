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
  Timeline,
  message,
  notification,
  Space,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  DollarOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import {
  rfqDb,
  type Rfq,
  type RfqItem,
  type SellerQuote,
  type AwardRevisionHistory,
  type RfqAwardItem,
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

export const SellerAwardRevisionResponse: React.FC = () => {
  const navigate = useNavigate();
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const { activeWorkspace, currentUserId } = useWorkspace();

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
      awardItems,
      historyRecords,
    ] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_items.get(itemId),
      rfqDb.seller_quotes.where("rfq_item_id").equals(itemId).toArray(),
      businessDb.parties.toArray(),
      catalogDb.products.toArray(),
      catalogDb.categories.toArray(),
      rfqDb.rfq_award_items.where("rfq_item_id").equals(itemId).toArray(),
      rfqDb.award_revision_history.where("rfq_item_id").equals(itemId).toArray(),
    ]);

    return {
      rfq,
      item,
      allQuotes: allQuotes || [],
      parties: parties || [],
      catalogProducts: catalogProducts || [],
      categories: categories || [],
      awardItems: awardItems || [],
      historyRecords: historyRecords || [],
    };
  }, [rfqId, itemId]);

  const {
    rfq,
    item,
    allQuotes = [],
    parties = [],
    catalogProducts = [],
    categories = [],
    awardItems = [],
    historyRecords = [],
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

  const myAwardItem = useMemo(() => {
    if (!sellerParty?.id) return null;
    return awardItems.find(a => a.seller_party_id === sellerParty.id) || null;
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

  /*
   * 4. Breadcrumb Pattern (Rule 4A: Must be called before conditional returns)
   */
  const breadcrumbs = useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>Seller RFQs</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || "RFQ Workspace"}</a> },
    { title: <span className="text-slate-800">Item #{item?.item_index || 1} Award Revision</span> },
  ], [navigate, basePath, rfqId, rfq?.rfq_number, item?.item_index]);

  useBreadcrumb(breadcrumbs);

  /*
   * 5. Interactive Form States
   */
  const [offeredQty, setOfferedQty] = useState<number>(0);
  const [offeredPrice, setOfferedPrice] = useState<number>(0);
  const [responseNote, setResponseNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize response form with buyer target request or current quote values
  useEffect(() => {
    if (latestBuyerHistory) {
      setOfferedQty(latestBuyerHistory.quantity || item?.req_quantity || 1);
      setOfferedPrice(latestBuyerHistory.unit_price || 0);
    } else if (myAwardItem) {
      setOfferedQty(myAwardItem.buyer_target_quantity || myAwardItem.awarded_quantity || item?.req_quantity || 1);
      setOfferedPrice(myAwardItem.unit_price || 0);
    } else if (myQuote) {
      setOfferedQty(myQuote.offer_quantity || item?.req_quantity || 1);
    }
  }, [latestBuyerHistory, myAwardItem, myQuote, item?.req_quantity]);

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

  const currentAwardRound = myQuote?.award_round || 1;
  const currentProposalRound = myQuote?.round || 1;
  const currentTotal = (offeredQty || 0) * (offeredPrice || 0);

  /*
   * 7. Handlers
   */
  const handleAcceptAllocation = async () => {
    if (!myQuote) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      // Update quote status to DEVIATION_ACCEPTED / confirmed
      await rfqDb.seller_quotes.update(myQuote.id, {
        status: "DEVIATION_ACCEPTED",
        offer_quantity: offeredQty,
        updated_at: now,
      });

      // Update award item if present
      if (myAwardItem) {
        await rfqDb.rfq_award_items.update(myAwardItem.id, {
          award_item_status: "CONFIRMED",
          seller_accepted: true,
          seller_accepted_at: now,
          seller_offered_quantity: offeredQty,
          awarded_quantity: offeredQty,
          seller_response_note: responseNote || undefined,
          updated_at: now,
        });
      }

      // Record in audit trail
      await rfqDb.award_revision_history.add({
        id: `arh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        rfq_id: rfqId!,
        rfq_item_id: itemId!,
        seller_party_id: sellerParty?.id || "pty-seller",
        seller_quote_id: myQuote.id,
        award_round: currentAwardRound,
        actor_type: "SELLER",
        actor_id: currentUserId || "seller-user",
        variant_id: myAwardItem?.variant_id || "default",
        quantity: offeredQty,
        unit_price: offeredPrice,
        note: responseNote ? `Accepted: ${responseNote}` : "Seller accepted requested allocation.",
        created_at: now,
      });

      notification.success({
        message: "Award Allocation Confirmed",
        description: `You have successfully confirmed the allocation of ${offeredQty} ${item.req_unit || "PCS"} at ${formatCurrency(offeredPrice)}.`,
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
    if (offeredQty <= 0) {
      message.warning("Please enter a valid fulfillable quantity greater than 0.");
      return;
    }
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      // Update quote with new offer quantity
      await rfqDb.seller_quotes.update(myQuote.id, {
        status: "SUBMITTED",
        offer_quantity: offeredQty,
        updated_at: now,
      });

      // Update award item if present
      if (myAwardItem) {
        await rfqDb.rfq_award_items.update(myAwardItem.id, {
          award_item_status: "SELLER_REVISED",
          seller_accepted: false,
          seller_offered_quantity: offeredQty,
          unit_price: offeredPrice,
          seller_response_note: responseNote || undefined,
          updated_at: now,
        });
      }

      // Record counter-offer in audit trail
      await rfqDb.award_revision_history.add({
        id: `arh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        rfq_id: rfqId!,
        rfq_item_id: itemId!,
        seller_party_id: sellerParty?.id || "pty-seller",
        seller_quote_id: myQuote.id,
        award_round: currentAwardRound,
        actor_type: "SELLER",
        actor_id: currentUserId || "seller-user",
        variant_id: myAwardItem?.variant_id || "default",
        quantity: offeredQty,
        unit_price: offeredPrice,
        note: responseNote ? `Counter-Offer: ${responseNote}` : "Seller submitted revised counter-offer.",
        created_at: now,
      });

      notification.info({
        message: "Counter-Offer Submitted",
        description: `Your counter-offer of ${offeredQty} ${item.req_unit || "PCS"} at ${formatCurrency(offeredPrice)} has been sent to the buyer.`,
      });

      navigate(`${basePath}/${rfqId}`);
    } catch (err) {
      console.error("Failed to submit counter offer", err);
      message.error("Failed to submit counter offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* 1. Page Header Card */}
      <Card size="small" className="shadow-sm border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">
                Award Allocation Revision (Award Rev Round {currentAwardRound})
              </h1>
              <AntTag color="purple" className="font-bold text-xs">
                Award Rev R{currentAwardRound}
              </AntTag>
            </div>
            <p className="text-xs text-slate-500 mt-1 m-0">
              Review the buyer&apos;s allocated target quantity and terms for this line item. You can confirm the allocation or submit a revised counter-offer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              RFQ: {rfq.rfq_number}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Line Item & Buyer Target Request Overview */}
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
                Award Rev R{currentAwardRound}
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
            <Descriptions.Item label="Buyer Requested Allocation">
              <span className="font-bold text-indigo-700 text-sm">
                {latestBuyerHistory?.quantity || myAwardItem?.buyer_target_quantity || item.req_quantity} {item.req_unit || "PCS"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Buyer Target Price">
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(latestBuyerHistory?.unit_price || myAwardItem?.unit_price || 0)}
              </span>
            </Descriptions.Item>
          </Descriptions>

          {/* Buyer's Revision Note Callout */}
          {latestBuyerHistory?.note && (
            <Alert
              type="warning"
              showIcon
              icon={<FileTextOutlined className="text-amber-600" />}
              message={<span className="font-bold text-xs text-amber-900">Buyer&apos;s Revision Request Note:</span>}
              description={<span className="text-xs text-amber-800 italic">&ldquo;{latestBuyerHistory.note}&rdquo;</span>}
              className="bg-amber-50/70 border-amber-200"
            />
          )}
        </div>
      </Card>

      {/* 3. Negotiation History Timeline */}
      {sellerHistory.length > 0 && (
        <Card
          size="small"
          className="shadow-sm border-slate-200 bg-white"
          title={
            <div className="flex items-center gap-2">
              <HistoryOutlined className="text-indigo-600" />
              <span className="font-bold text-xs text-slate-800">Negotiation Round History</span>
            </div>
          }
        >
          <Timeline
            className="pt-2"
            items={sellerHistory.map(entry => {
              const isBuyer = entry.actor_type === "BUYER";
              return {
                color: isBuyer ? "blue" : "green",
                children: (
                  <div className="text-xs space-y-0.5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {isBuyer ? "Buyer (Allocation Request)" : "Seller (Your Response)"}
                      </span>
                      <AntTag color={isBuyer ? "purple" : "cyan"} className="text-[10px] font-semibold m-0">
                        Award Rev R{entry.award_round}
                      </AntTag>
                      <span className="text-[11px] text-slate-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      Quantity: <strong>{entry.quantity} {item.req_unit || "PCS"}</strong> | Unit Price: <strong>{formatCurrency(entry.unit_price)}</strong> | Total: <strong>{formatCurrency(entry.quantity * entry.unit_price)}</strong>
                    </div>
                    {entry.note && (
                      <div className="text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px]">
                        &ldquo;{entry.note}&rdquo;
                      </div>
                    )}
                  </div>
                ),
              };
            })}
          />
        </Card>
      )}

      {/* 4. Seller's Response Form */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={
          <div className="flex items-center gap-2">
            <ShoppingOutlined className="text-emerald-600" />
            <span className="font-bold text-xs text-slate-800">Your Allocation Response</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fulfillable Quantity ({item.req_unit || "PCS"}):
              </label>
              <InputNumber
                min={1}
                step={1}
                value={offeredQty}
                onChange={val => setOfferedQty(val || 0)}
                className="w-full font-mono font-bold"
                size="middle"
                placeholder="Enter fulfillable quantity"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Buyer requested: {latestBuyerHistory?.quantity || item.req_quantity} {item.req_unit || "PCS"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmed Unit Price (USD):
              </label>
              <InputNumber
                min={0}
                step={0.01}
                value={offeredPrice}
                onChange={val => setOfferedPrice(val || 0)}
                className="w-full font-mono font-bold"
                size="middle"
                prefix={<DollarOutlined className="text-slate-400" />}
                placeholder="Enter unit price"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Target: {formatCurrency(latestBuyerHistory?.unit_price || myAwardItem?.unit_price || 0)}
              </span>
            </div>

            <div className="flex flex-col justify-center bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Total Contract Allocation:</span>
              <span className="text-base font-mono font-bold text-emerald-700">
                {formatCurrency(currentTotal)}
              </span>
              <span className="text-[10px] text-slate-400">
                {offeredQty} {item.req_unit || "PCS"} &times; {formatCurrency(offeredPrice)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Response / Clarification Note for Buyer:
            </label>
            <Input.TextArea
              rows={3}
              placeholder="e.g. We confirm we can fulfill 300 PCS at $250.00 with shipping scheduled within 10 business days."
              value={responseNote}
              onChange={e => setResponseNote(e.target.value)}
              className="text-xs"
            />
          </div>

          <Divider className="my-2" />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              size="middle"
              onClick={() => navigate(`${basePath}/${rfqId}`)}
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>

            <Space>
              <Button
                type="default"
                size="middle"
                icon={<SendOutlined />}
                onClick={handleCounterOffer}
                loading={isSubmitting}
                className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:border-indigo-400"
              >
                Submit Counter-Offer (Revise Qty / Price)
              </Button>

              <Button
                type="primary"
                size="middle"
                icon={<CheckCircleOutlined />}
                onClick={handleAcceptAllocation}
                loading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
              >
                Accept & Confirm Allocation
              </Button>
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerAwardRevisionResponse;
