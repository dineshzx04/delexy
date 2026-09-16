import React, { useState, useMemo } from "react";
import { Card, Table, Button, Tag as AntTag, Modal, Space, App as AntApp, Spin, Empty } from "antd";
import {
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { rfqDb, type PurchaseOrder, type PurchaseOrderItem, type SellerQuoteAttribute } from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { catalogDb } from "../../data/catalog/catalog.db";

// Helper to format currency
const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper to extract Manufacturer & Brand from Quote Attributes
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

// Pending Award Item Representation
interface PendingAwardItem {
  id: string; // rfq_quote_item_awards.id
  rfqItemId: string;
  itemIndex: number;
  productName: string;
  categoryName: string;
  sku: string;
  specifications: string;
  manufacturer: string;
  brand: string;
  sellerQuoteId: string;
  sellerQuoteNumber: string;
  confirmedQty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  deliveryLeadTime: string;
  targetDeliveryDate: string;
}

// Pending Seller Package
interface PendingSellerAwardPackage {
  sellerPartyId: string;
  sellerName: string;
  sellerTaxId: string;
  sellerContact: string;
  sellerEmail: string;
  sellerAddress: string;
  items: PendingAwardItem[];
  totalQty: number;
  totalAmount: number;
}

// Issued Purchase Order Representation
interface IssuedPurchaseOrderView {
  id: string;
  poNumber: string;
  sellerPartyId: string;
  sellerName: string;
  sellerTaxId: string;
  sellerContact: string;
  sellerAddress: string;
  sellerEmail: string;
  sellerQuoteIds: string[];
  sellerQuoteNumbers: string[];
  poStatus: "DRAFT" | "RELEASED" | "SELLER_ACKNOWLEDGED" | "COMPLETED" | "CANCELLED";
  paymentTerms: string;
  incoterms: string;
  shippingMethod: string;
  currency: string;
  issuedAt?: string;
  acknowledgedAt?: string;
  items: PurchaseOrderItem[];
  totalQty: number;
  totalAmount: number;
  notesToSeller?: string;
}

export interface RfqPurchaseOrderTabProps {
  rfqId: string;
  mode: "pending" | "issued";
  onPoCreated?: () => void;
  onNavigateToTab?: (tabKey: string) => void;
}

export const RfqPurchaseOrderTab: React.FC<RfqPurchaseOrderTabProps> = ({
  rfqId,
  mode,
  onPoCreated,
  onNavigateToTab,
}) => {
  const { message } = AntApp.useApp();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === "BUSINESS";

  const [selectedPoForPreview, setSelectedPoForPreview] = useState<IssuedPurchaseOrderView | null>(null);
  const [issuingSellerId, setIssuingSellerId] = useState<string | null>(null);

  // Single Cumulative Reactive LiveQuery for DB Records
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
      quoteAttributes,
      quoteAwards,
      quoteItemAwards,
      purchaseOrders,
      purchaseOrderItems,
      poAcknowledgements,
    ] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      rfqDb.rfq_items.where("rfq_id").equals(rfqId).toArray(),
      businessDb.parties.toArray(),
      businessDb.manufacturers.toArray(),
      businessDb.brands.toArray(),
      catalogDb.products.toArray(),
      catalogDb.categories.toArray(),
      rfqDb.seller_quotes.toArray(),
      rfqDb.seller_quote_attributes.toArray(),
      rfqDb.rfq_quote_awards.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.rfq_quote_item_awards.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.purchase_orders.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.purchase_order_items.toArray(),
      rfqDb.po_acknowledgements.toArray(),
    ]);

    return {
      rfq,
      rfqItems: rfqItems || [],
      parties: parties || [],
      allManufacturers: allManufacturers || [],
      allBrands: allBrands || [],
      catalogProducts: catalogProducts || [],
      categories: categories || [],
      allQuotes: allQuotes || [],
      quoteAttributes: quoteAttributes || [],
      quoteAwards: quoteAwards || [],
      quoteItemAwards: quoteItemAwards || [],
      purchaseOrders: purchaseOrders || [],
      purchaseOrderItems: purchaseOrderItems || [],
      poAcknowledgements: poAcknowledgements || [],
    };
  }, [rfqId]);

  const {
    rfq,
    rfqItems = [],
    parties = [],
    catalogProducts = [],
    categories = [],
    allQuotes = [],
    allManufacturers = [],
    allBrands = [],
    quoteAttributes = [],
    quoteAwards = [],
    quoteItemAwards = [],
    purchaseOrders = [],
    purchaseOrderItems = [],
    poAcknowledgements = [],
  } = pageData ?? {};

  // Cumulative Memo Data
  const { activePartyId, pendingSellerAwards, issuedPurchaseOrders, buyerAccountName } = useMemo(() => {
    if (!rfq) {
      return {
        activePartyId: "",
        pendingSellerAwards: [] as PendingSellerAwardPackage[],
        issuedPurchaseOrders: [] as IssuedPurchaseOrderView[],
        buyerAccountName: "Buyer Account",
      };
    }

    let partyId = "";
    if (parties.length > 0) {
      if (isBusinessContext) {
        partyId = parties.find(p => p.owner_type === "BUSINESS" && p.owner_id === activeWorkspace?.businessId)?.id ?? "";
      } else {
        partyId = parties.find(p => p.owner_type === "USER" && p.owner_id === currentUserId)?.id ?? parties.find(p => p.id === "pty-6")?.id ?? "";
      }
    }

    const partiesMap = new Map(parties.map(p => [p.id, p]));
    const rfqItemsMap = new Map(rfqItems.map(i => [i.id, i]));
    const productsMap = new Map(catalogProducts.map(p => [p.id, p]));
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const quotesMap = new Map(allQuotes.map(q => [q.id, q]));

    // 1. Pending Seller Packages
    const nonPoAwards = quoteItemAwards.filter(
      award => award.buyer_target_quantity > 0 && !award.purchase_order_id && award.variant_award_status !== "PO_CREATED" && award.variant_award_status !== "PO_RECEIVED",
    );

    const sellerGroups = new Map<string, typeof nonPoAwards>();
    nonPoAwards.forEach(award => {
      const list = sellerGroups.get(award.seller_party_id) || [];
      list.push(award);
      sellerGroups.set(award.seller_party_id, list);
    });

    const pendingPackages: PendingSellerAwardPackage[] = [];
    sellerGroups.forEach((awards, sellerPartyId) => {
      const party = partiesMap.get(sellerPartyId);
      const sellerDisplayName = party?.display_name || `Seller ${sellerPartyId}`;
      const sellerCleanSlug = sellerDisplayName.toLowerCase().replace(/[^a-z0-9]/g, "");

      const items: PendingAwardItem[] = awards.map(award => {
        const item = rfqItemsMap.get(award.rfq_item_id);
        const product = item?.catalog_product_id ? productsMap.get(item.catalog_product_id) : undefined;
        const category = item?.category_id ? categoriesMap.get(item.category_id) : undefined;
        const quote = quotesMap.get(award.seller_quote_id);

        const mfgBrand = extractMfgBrandFromQuoteAttrs(award.seller_quote_id, quoteAttributes, allManufacturers, allBrands);

        const sku = `SKU-${product?.id?.toUpperCase() || award.variant_id?.slice(0, 8).toUpperCase() || "STD"}`;
        const targetDeliveryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        return {
          id: award.id,
          rfqItemId: award.rfq_item_id,
          itemIndex: item?.item_index || 1,
          productName: product?.name || award.variant_label || "Procurement Line Item",
          categoryName: category?.name || "Standard Procurement",
          sku,
          specifications: award.variant_label || product?.description || "Standard OEM Specifications",
          manufacturer: mfgBrand.manufacturer !== "N/A" ? mfgBrand.manufacturer : "OEM Manufacturer",
          brand: mfgBrand.brand !== "N/A" ? mfgBrand.brand : "OEM Brand",
          sellerQuoteId: award.seller_quote_id,
          sellerQuoteNumber: quote?.seller_quote_number || `QUO-${award.seller_quote_id.slice(0, 6)}`,
          confirmedQty: award.buyer_target_quantity,
          unit: award.unit_of_measure || item?.req_unit || "PCS",
          unitPrice: award.unit_price || 0,
          subtotal: award.total_price || (award.unit_price || 0) * (award.buyer_target_quantity || 0),
          deliveryLeadTime: "3-4 Weeks",
          targetDeliveryDate,
        };
      });

      const totalQty = items.reduce((sum, it) => sum + it.confirmedQty, 0);
      const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);

      pendingPackages.push({
        sellerPartyId,
        sellerName: sellerDisplayName,
        sellerTaxId: `TAX-${sellerPartyId.toUpperCase()}-8821`,
        sellerContact: `${sellerDisplayName} Commercial Operations (+1 555-019-2834)`,
        sellerEmail: `orders@${sellerCleanSlug || "seller"}.com`,
        sellerAddress: "Suite 100, Enterprise Industrial Zone, Birmingham, UK",
        items,
        totalQty,
        totalAmount,
      });
    });

    // 2. Issued Purchase Orders
    const issuedOrders: IssuedPurchaseOrderView[] = purchaseOrders.map(po => {
      const party = partiesMap.get(po.seller_party_id);
      const sellerDisplayName = party?.display_name || `Seller ${po.seller_party_id}`;
      const sellerCleanSlug = sellerDisplayName.toLowerCase().replace(/[^a-z0-9]/g, "");

      const poItems = purchaseOrderItems.filter(item => item.purchase_order_id === po.id);
      const quoteIds = po.seller_quote_ids || (Array.from(new Set(poItems.map(i => i.seller_quote_id).filter(Boolean))) as string[]);
      const quoteNumbers = quoteIds.map(qid => quotesMap.get(qid)?.seller_quote_number || `QUO-${qid.slice(0, 6)}`);

      const poAck = poAcknowledgements.find(ack => ack.purchase_order_id === po.id);

      const totalQty = poItems.reduce((sum, it) => sum + it.buyer_target_quantity, 0);
      const totalAmount = po.total_amount || poItems.reduce((sum, it) => sum + it.total_price, 0);

      return {
        id: po.id,
        poNumber: po.po_number,
        sellerPartyId: po.seller_party_id,
        sellerName: sellerDisplayName,
        sellerTaxId: `TAX-${po.seller_party_id.toUpperCase()}-8821`,
        sellerContact: `${sellerDisplayName} Commercial Operations (+1 555-019-2834)`,
        sellerEmail: `orders@${sellerCleanSlug || "seller"}.com`,
        sellerAddress: po.shipping_address || "Suite 100, Enterprise Industrial Zone, Birmingham, UK",
        sellerQuoteIds: quoteIds,
        sellerQuoteNumbers: quoteNumbers,
        poStatus: po.po_status,
        paymentTerms: po.payment_terms || "Net 30 Days from Invoice Date",
        incoterms: po.incoterms || "FOB Port of Origin (Standard Incoterms 2020)",
        shippingMethod: po.shipping_method || "Express Commercial Freight / Direct Delivery",
        currency: po.currency || rfq.currency || "USD",
        issuedAt: po.po_released_at ? new Date(po.po_released_at).toLocaleString() : new Date(po.created_at).toLocaleString(),
        acknowledgedAt: poAck?.seller_acknowledged_at ? new Date(poAck.seller_acknowledged_at).toLocaleString() : undefined,
        items: poItems,
        totalQty,
        totalAmount,
        notesToSeller: po.delivery_notes || "All items must include standard quality inspection certificates and protective commercial packaging.",
      };
    });

    const requesterParty = parties.find(p => p.id === (partyId || rfq.requester_party_id || rfq.requester_id));
    const buyerAccount = requesterParty?.display_name || rfq.requester_name || "Acme Industrial Systems Ltd";

    return {
      activePartyId: partyId,
      pendingSellerAwards: pendingPackages,
      issuedPurchaseOrders: issuedOrders,
      buyerAccountName: buyerAccount,
    };
  }, [
    rfq,
    parties,
    isBusinessContext,
    activeWorkspace?.businessId,
    currentUserId,
    rfqItems,
    catalogProducts,
    categories,
    allQuotes,
    quoteAttributes,
    allManufacturers,
    allBrands,
    quoteItemAwards,
    purchaseOrders,
    purchaseOrderItems,
    poAcknowledgements,
  ]);

  // Loading Guard
  if (!pageData || !rfq) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spin size="large" tip="Loading Purchase Order Data..." />
      </div>
    );
  }

  // Handler: Generate Purchase Order for Seller Package
  const handleCreatePoForSeller = async (sellerPackage: PendingSellerAwardPackage) => {
    if (!sellerPackage.items || sellerPackage.items.length === 0) {
      message.warning("No line items available in this seller package.");
      return;
    }

    setIssuingSellerId(sellerPackage.sellerPartyId);
    try {
      const now = new Date().toISOString();
      const poId = `po-${crypto.randomUUID()}`;

      const nextSeqNumber = (issuedPurchaseOrders.length + 1).toString().padStart(2, "0");
      const poNumber = `PO-${rfq?.rfq_number ? rfq.rfq_number.replace("RFQ-", "") : "2026"}-${nextSeqNumber}`;

      const distinctQuoteIds = Array.from(new Set(sellerPackage.items.map(i => i.sellerQuoteId)));
      const totalPoAmount = sellerPackage.totalAmount;

      const poPayload: PurchaseOrder = {
        id: poId,
        po_number: poNumber,
        rfq_id: rfqId,
        buyer_party_id: activePartyId || rfq?.requester_party_id || "pty-buyer",
        seller_party_id: sellerPackage.sellerPartyId,
        seller_quote_ids: distinctQuoteIds,
        total_amount: totalPoAmount,
        currency: rfq?.currency || "USD",
        po_status: "RELEASED",
        payment_terms: "Net 30 Days from Invoice Date",
        incoterms: "FOB Port of Origin (Standard Incoterms 2020)",
        shipping_method: "Express Commercial Freight / Direct Delivery",
        shipping_address: sellerPackage.sellerAddress,
        delivery_notes: "All items must comply with certified engineering specifications and include inspection reports.",
        issued_by_user_id: currentUserId,
        po_released_at: now,
        created_at: now,
        updated_at: now,
      };

      const poItemsPayload: PurchaseOrderItem[] = sellerPackage.items.map(item => ({
        id: `poi-${crypto.randomUUID()}`,
        purchase_order_id: poId,
        quote_item_award_id: item.id,
        seller_quote_id: item.sellerQuoteId,
        seller_quote_number: item.sellerQuoteNumber,
        rfq_item_id: item.rfqItemId,
        item_index: item.itemIndex,
        product_name: item.productName,
        category_name: item.categoryName,
        sku: item.sku,
        specifications: item.specifications,
        manufacturer: item.manufacturer,
        brand: item.brand,
        variant_id: item.sku,
        variant_label: item.productName,
        buyer_target_quantity: item.confirmedQty,
        unit_of_measure: item.unit,
        unit_price: item.unitPrice,
        total_price: item.subtotal,
        delivery_lead_time: item.deliveryLeadTime,
        target_delivery_date: item.targetDeliveryDate,
        created_at: now,
        updated_at: now,
      }));

      await rfqDb.transaction("rw", [rfqDb.purchase_orders, rfqDb.purchase_order_items, rfqDb.rfq_quote_item_awards, rfqDb.rfq_quote_awards], async () => {
        await rfqDb.purchase_orders.put(poPayload);
        await rfqDb.purchase_order_items.bulkPut(poItemsPayload);

        for (const item of sellerPackage.items) {
          await rfqDb.rfq_quote_item_awards.update(item.id, {
            variant_award_status: "PO_CREATED" as const,
            purchase_order_id: poId,
            updated_at: now,
          });
        }

        const affectedAwards = quoteAwards.filter(a => distinctQuoteIds.includes(a.seller_quote_id));
        for (const award of affectedAwards) {
          await rfqDb.rfq_quote_awards.update(award.id, {
            award_status: "PO_CREATED" as const,
            updated_at: now,
          });
        }
      });

      message.success(`Purchase Order ${poNumber} successfully generated for ${sellerPackage.sellerName}!`);
      if (onPoCreated) {
        onPoCreated();
      }
    } catch (err) {
      console.error("Failed to generate Purchase Order:", err);
      message.error("Failed to generate Purchase Order.");
    } finally {
      setIssuingSellerId(null);
    }
  };

  // Render Mode: Pending PO Creation
  if (mode === "pending") {
    return (
      <div className="space-y-6">
        {pendingSellerAwards.length === 0 ? (
          <Card size="small" className="border-slate-200/80 shadow-xs rounded-xl bg-white p-8 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 text-sm block">All Awarded Quotes Have Been Converted into Purchase Orders</span>
                  <span className="text-xs text-slate-500">There are currently no pending awarded allocations waiting for PO creation.</span>
                </div>
              }
            >
              {onNavigateToTab && (
                <Button type="primary" onClick={() => onNavigateToTab("issued")} className="text-xs font-semibold mt-2">
                  View Issued Purchase Orders
                </Button>
              )}
            </Empty>
          </Card>
        ) : (
          pendingSellerAwards.map((sellerPackage, index) => (
            <Card key={sellerPackage.sellerPartyId} size="small" className="border-slate-200/90 shadow-xs rounded-xl bg-white overflow-hidden">
              {/* Seller Card Header */}
              <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 -mx-3 -mt-3 mb-3 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-white font-bold text-xs">{index + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <ShopOutlined className="text-slate-500" />
                      <span className="font-bold text-slate-900 text-sm">{sellerPackage.sellerName}</span>
                      <AntTag color="warning" className="text-[10px] font-semibold m-0">
                        {sellerPackage.items.length} Awarded Items Ready
                      </AntTag>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Contact: <span className="text-slate-700">{sellerPackage.sellerContact}</span> • Tax ID:{" "}
                      <span className="font-mono text-slate-700">{sellerPackage.sellerTaxId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Eligible</span>
                    <strong className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(sellerPackage.totalAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <Table
                  dataSource={sellerPackage.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered
                  scroll={{ x: 800 }}
                  columns={[
                    {
                      title: "#",
                      dataIndex: "itemIndex",
                      key: "itemIndex",
                      width: 50,
                      align: "center" as const,
                      render: (val: number) => <span className="font-semibold text-xs text-slate-500">#{val}</span>,
                    },
                    {
                      title: "Item & Specifications",
                      key: "product",
                      render: (_: any, record: PendingAwardItem) => (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{record.productName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{record.specifications}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {record.sku} • {record.manufacturer} ({record.brand})
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Source Quote",
                      key: "quote",
                      width: 140,
                      render: (_: any, record: PendingAwardItem) => (
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{record.sellerQuoteNumber}</span>
                      ),
                    },
                    {
                      title: "Awarded Qty",
                      key: "quantity",
                      width: 110,
                      align: "right" as const,
                      render: (_: any, record: PendingAwardItem) => (
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {record.confirmedQty.toLocaleString()} {record.unit}
                        </span>
                      ),
                    },
                    {
                      title: "Unit Price",
                      dataIndex: "unitPrice",
                      key: "unitPrice",
                      width: 110,
                      align: "right" as const,
                      render: (price: number) => <span className="font-mono font-medium text-slate-700 text-xs">{formatCurrency(price)}</span>,
                    },
                    {
                      title: "Subtotal",
                      dataIndex: "subtotal",
                      key: "subtotal",
                      width: 120,
                      align: "right" as const,
                      render: (subtotal: number) => <strong className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(subtotal)}</strong>,
                    },
                  ]}
                />

                {/* Seller PO Action Strip */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-lg px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="font-medium">
                      Seller Package: <strong className="text-slate-900">{sellerPackage.items.length}</strong> Line Item(s)
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium">
                      Package Value: <strong className="font-mono text-slate-900">{formatCurrency(sellerPackage.totalAmount)}</strong>
                    </span>
                  </div>

                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    loading={issuingSellerId === sellerPackage.sellerPartyId}
                    onClick={() => handleCreatePoForSeller(sellerPackage)}
                    className="text-xs font-semibold"
                  >
                    Generate Purchase Order ({sellerPackage.items.length} Items)
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }

  // Render Mode: Issued Purchase Orders
  return (
    <div className="space-y-6">
      {issuedPurchaseOrders.length === 0 ? (
        <Card size="small" className="border-slate-200/80 shadow-xs rounded-xl bg-white p-8 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-sm block">No Purchase Orders Issued Yet</span>
                <span className="text-xs text-slate-500">Select awarded quote items in the "Waiting for PO Creation" tab to issue formal purchase orders.</span>
              </div>
            }
          >
            {onNavigateToTab && (
              <Button type="primary" onClick={() => onNavigateToTab("pending")} className="text-xs font-semibold mt-2">
                Go to Waiting for PO Creation
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        issuedPurchaseOrders.map((po, index) => {
          const isAcknowledged = po.poStatus === "SELLER_ACKNOWLEDGED";

          return (
            <Card key={po.id} size="small" className="border-slate-200/90 shadow-xs rounded-xl bg-white overflow-hidden">
              {/* PO Header Strip */}
              <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 -mx-3 -mt-3 mb-3 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-white font-bold text-xs">{index + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <ShopOutlined className="text-slate-500" />
                      <span className="font-bold text-slate-900 text-sm">{po.sellerName}</span>
                      <span className="font-mono text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{po.poNumber}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Quotes:</span>
                      {po.sellerQuoteNumbers.map(qnum => (
                        <span key={qnum} className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {qnum}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Tag */}
                  {isAcknowledged ? (
                    <AntTag color="success" className="font-semibold text-xs m-0 flex items-center gap-1 py-0.5 px-2">
                      <CheckCircleOutlined /> Acknowledged by Seller
                    </AntTag>
                  ) : (
                    <AntTag color="processing" className="font-medium text-xs m-0 flex items-center gap-1 py-0.5 px-2">
                      <ClockCircleOutlined /> Issued • Awaiting Receipt
                    </AntTag>
                  )}

                  {/* PO Total Amount */}
                  <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <strong className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(po.totalAmount, po.currency)}</strong>
                  </div>
                </div>
              </div>

              {/* PO Line Items Table */}
              <div className="space-y-3">
                <Table
                  dataSource={po.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered
                  scroll={{ x: 750 }}
                  columns={[
                    {
                      title: "#",
                      key: "sno",
                      width: 45,
                      align: "center" as const,
                      render: (_: any, __: any, idx: number) => <span className="font-semibold text-xs text-slate-500">#{idx + 1}</span>,
                    },
                    {
                      title: "Item & Specifications",
                      key: "product",
                      render: (_: any, record: PurchaseOrderItem) => (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{record.product_name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{record.specifications}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {record.sku} • {record.manufacturer} ({record.brand})
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Source Quote",
                      key: "quote",
                      width: 140,
                      render: (_: any, record: PurchaseOrderItem) => (
                        <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {record.seller_quote_number || "Standard Quote"}
                        </span>
                      ),
                    },
                    {
                      title: "Qty",
                      key: "quantity",
                      width: 110,
                      align: "right" as const,
                      render: (_: any, record: PurchaseOrderItem) => (
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {record.buyer_target_quantity.toLocaleString()} {record.unit_of_measure || "PCS"}
                        </span>
                      ),
                    },
                    {
                      title: "Unit Price",
                      dataIndex: "unit_price",
                      key: "unit_price",
                      width: 120,
                      align: "right" as const,
                      render: (price: number) => <span className="font-mono font-medium text-slate-700 text-xs">{formatCurrency(price, po.currency)}</span>,
                    },
                    {
                      title: "Subtotal",
                      dataIndex: "total_price",
                      key: "total_price",
                      width: 120,
                      align: "right" as const,
                      render: (total: number) => <strong className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(total, po.currency)}</strong>,
                    },
                  ]}
                />

                {/* Commercial Terms Strip */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Payment:</span> <span className="font-semibold text-slate-800">{po.paymentTerms}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Incoterms:</span> <span className="font-semibold text-slate-800">{po.incoterms}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Shipping:</span> <span className="font-semibold text-slate-800">{po.shippingMethod}</span>
                    </div>
                    {po.issuedAt && (
                      <div>
                        <span className="text-slate-400 font-medium">Issued:</span> <span className="font-semibold text-slate-800">{po.issuedAt}</span>
                      </div>
                    )}
                    {po.acknowledgedAt && (
                      <div>
                        <span className="text-slate-400 font-medium">Acknowledged:</span> <span className="font-semibold text-slate-800">{po.acknowledgedAt}</span>
                      </div>
                    )}
                  </div>

                  <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedPoForPreview(po)} className="text-xs font-medium text-slate-700 hover:text-slate-900">
                      Preview Document
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => message.info(`Downloading PDF document for ${po.poNumber}...`)}
                      className="text-xs font-medium text-slate-700"
                    >
                      PDF
                    </Button>
                    <Button
                      size="small"
                      icon={<PrinterOutlined />}
                      onClick={() => {
                        setSelectedPoForPreview(po);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="text-xs font-medium text-slate-700"
                    >
                      Print
                    </Button>
                  </Space>
                </div>
              </div>
            </Card>
          );
        })
      )}

      {/* Enterprise Purchase Order Formal Document Preview Modal */}
      <Modal
        open={!!selectedPoForPreview}
        onCancel={() => setSelectedPoForPreview(null)}
        width={820}
        footer={[
          <Button key="close" onClick={() => setSelectedPoForPreview(null)} className="text-xs font-semibold">
            Close
          </Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} className="text-xs font-semibold">
            Print
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              message.success(`Official Purchase Order PDF generated for ${selectedPoForPreview?.poNumber}`);
              setSelectedPoForPreview(null);
            }}
            className="text-xs font-semibold"
          >
            Download Signed PDF
          </Button>,
        ]}
      >
        {selectedPoForPreview && (
          <div className="p-4 bg-white text-slate-900 space-y-5">
            {/* Letterhead */}
            <div className="border-b border-slate-300 pb-3 flex justify-between items-start">
              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight">PURCHASE ORDER</div>
                <div className="text-xs font-mono text-slate-800 font-bold mt-0.5">PO: {selectedPoForPreview.poNumber}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ref RFQ: <span className="font-mono">{rfq?.rfq_number || "RFQ"}</span> • Associated Quotes:{" "}
                  <span className="font-mono font-semibold text-slate-700">{selectedPoForPreview.sellerQuoteNumbers.join(", ")}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-800">DELEXY ENTERPRISE PROCUREMENT</div>
                <div className="text-slate-500">Date Issued: {selectedPoForPreview.issuedAt || "2026-09-16"}</div>
              </div>
            </div>

            {/* Buyer & Seller Address */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">BUYER:</span>
                <div className="font-bold text-slate-900">{buyerAccountName}</div>
                <div className="text-slate-600">100 Enterprise Boulevard, Procurement Suite 400</div>
                <div className="text-slate-500 font-mono mt-0.5">Tax ID: GB-882319401</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">SELLER:</span>
                <div className="font-bold text-slate-900">{selectedPoForPreview.sellerName}</div>
                <div className="text-slate-600">{selectedPoForPreview.sellerAddress}</div>
                <div className="text-slate-600">Contact: {selectedPoForPreview.sellerContact}</div>
                <div className="text-slate-500 font-mono mt-0.5">Tax ID: {selectedPoForPreview.sellerTaxId}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200 w-10 text-center">#</th>
                  <th className="p-2 border-r border-slate-200">Item & Specifications</th>
                  <th className="p-2 border-r border-slate-200">Source Quote</th>
                  <th className="p-2 border-r border-slate-200 text-right w-20">Qty</th>
                  <th className="p-2 border-r border-slate-200 text-right w-24">Unit Price</th>
                  <th className="p-2 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedPoForPreview.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{item.product_name}</div>
                      <div className="text-[11px] text-slate-600">{item.specifications}</div>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700">{item.seller_quote_number || "Standard Quote"}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-800">
                      {item.buyer_target_quantity.toLocaleString()} {item.unit_of_measure || "PCS"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">{formatCurrency(item.unit_price, selectedPoForPreview.currency)}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total_price, selectedPoForPreview.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 font-bold bg-slate-50">
                  <td colSpan={5} className="p-2 text-right text-slate-700 border-r border-slate-200">
                    Grand Total ({selectedPoForPreview.currency}):
                  </td>
                  <td className="p-2 text-right font-mono text-xs text-slate-900 font-bold">{formatCurrency(selectedPoForPreview.totalAmount, selectedPoForPreview.currency)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Commercial Terms */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-0.5">
              <div>
                <strong>Payment Terms:</strong> {selectedPoForPreview.paymentTerms}
              </div>
              <div>
                <strong>Incoterms:</strong> {selectedPoForPreview.incoterms} • <strong>Shipping Method:</strong> {selectedPoForPreview.shippingMethod}
              </div>
              {selectedPoForPreview.notesToSeller && (
                <div>
                  <strong>Seller Instructions:</strong> {selectedPoForPreview.notesToSeller}
                </div>
              )}
            </div>

            {/* Sign-off Block */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div>
                <div className="border-b border-slate-300 pb-6 text-slate-400 italic">Buyer Authorized Signature</div>
                <div className="font-bold text-slate-800 mt-1">{buyerAccountName}</div>
              </div>
              <div>
                <div className="border-b border-slate-300 pb-6 text-slate-400 italic">Seller Acceptance & Date</div>
                <div className="font-bold text-slate-800 mt-1">{selectedPoForPreview.sellerName}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
