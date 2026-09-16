import React, { useState, useMemo } from "react";
import { Card, Descriptions, Button, Tag as AntTag, Space, Spin, Tabs } from "antd";
import {
  FileDoneOutlined,
  OrderedListOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";
import { rfqDb } from "../../data/rfq";
import { businessDb } from "../../data/business/business.db";
import { RfqQuoteAwardingTab } from "./RfqQuoteAwardingTab";
import { RfqPurchaseOrderTab } from "./RfqPurchaseOrderTab";

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export interface RfqQuoteAwardingPageProps {
  defaultTab?: "awarding" | "pending" | "issued";
}

export const RfqQuoteAwardingPage: React.FC<RfqQuoteAwardingPageProps> = ({ defaultTab = "awarding" }) => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === "BUSINESS";
  const basePath = isBusinessContext ? "/b/rfqs" : "/user/rfqs";

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // LiveQuery for Page Overview & Badge Metrics
  const pageData = useLiveQuery(async () => {
    if (!rfqId) return null;

    const [rfq, parties, quoteItemAwards, purchaseOrders] = await Promise.all([
      rfqDb.rfqs.get(rfqId),
      businessDb.parties.toArray(),
      rfqDb.rfq_quote_item_awards.where("rfq_id").equals(rfqId).toArray(),
      rfqDb.purchase_orders.where("rfq_id").equals(rfqId).toArray(),
    ]);

    return {
      rfq,
      parties: parties || [],
      quoteItemAwards: quoteItemAwards || [],
      purchaseOrders: purchaseOrders || [],
    };
  }, [rfqId]);

  const { rfq, parties = [], quoteItemAwards = [], purchaseOrders = [] } = pageData ?? {};

  // Compute RFQ Overview Summary & Tab Badge Counts
  const { rfqOverview, pendingItemCount, issuedPoCount } = useMemo(() => {
    if (!rfq) {
      return {
        rfqOverview: {
          rfqNumber: "RFQ-0000",
          buyerAccount: "Buyer Account",
          sourcingTitle: "Contract Sourcing",
          submissionDeadline: "Standard Schedule",
          currency: "USD",
          totalIssuedOrders: 0,
          totalPendingPackages: 0,
          totalCommittedValue: 0,
        },
        pendingItemCount: 0,
        issuedPoCount: 0,
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

    const requesterParty = parties.find(p => p.id === (partyId || rfq.requester_party_id || rfq.requester_id));

    // Pending PO items
    const nonPoAwards = quoteItemAwards.filter(
      award => award.buyer_target_quantity > 0 && !award.purchase_order_id && award.variant_award_status !== "PO_CREATED" && award.variant_award_status !== "PO_RECEIVED",
    );

    const sellerGroups = new Set(nonPoAwards.map(a => a.seller_party_id));
    const pendingTotalValue = nonPoAwards.reduce((sum, a) => sum + (a.total_price || (a.unit_price || 0) * a.buyer_target_quantity), 0);
    const issuedTotalValue = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);

    const overview = {
      rfqNumber: rfq.rfq_number || "RFQ-0000",
      buyerAccount: requesterParty?.display_name || rfq.requester_name || "Buyer Account",
      sourcingTitle: rfq.title || "Contract Sourcing",
      submissionDeadline: rfq.submission_deadline || "Standard Schedule",
      currency: rfq.currency || "USD",
      totalIssuedOrders: purchaseOrders.length,
      totalPendingPackages: sellerGroups.size,
      totalCommittedValue: pendingTotalValue + issuedTotalValue,
    };

    return {
      rfqOverview: overview,
      pendingItemCount: nonPoAwards.length,
      issuedPoCount: purchaseOrders.length,
    };
  }, [rfq, parties, isBusinessContext, activeWorkspace?.businessId, currentUserId, quoteItemAwards, purchaseOrders]);

  // Global Breadcrumb Integration
  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(isBusinessContext ? "/b/dashboard" : "/user/dashboard")}>Dashboard</a> },
      { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
      { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || "RFQ"}</a> },
      { title: <span className="text-slate-800 font-semibold">Quotes Awarding & Purchase Orders</span> },
    ],
    [navigate, basePath, rfqId, isBusinessContext, rfq?.rfq_number],
  );
  useBreadcrumb(breadcrumbs);

  // Loading Guard
  if (!pageData || !rfq) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading Sourcing & Purchase Order Workspace..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Tier 1: Static Semantic Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Quotes Awarding & Purchase Orders</h1>
          <p className="text-slate-500 text-sm mt-1 m-0">Review quote allocations, negotiate award rounds, generate seller-based purchase orders, and track issued contracts.</p>
        </div>
        <Space>
          <Button onClick={() => navigate(`${basePath}/${rfqId}`)} className="text-slate-600 font-medium border-slate-200 shadow-xs hover:text-slate-900">
            Return to RFQ Workspace
          </Button>
        </Space>
      </div>

      {/* Tier 3: Entity Overview Card */}
      <Card size="small" className="border-slate-200/80 shadow-xs rounded-xl bg-white">
        <Descriptions
          bordered
          size="small"
          column={{ md: 3, sm: 2, xs: 1 }}
          classNames={{
            label: "text-xs px-3 py-1.5 font-semibold text-slate-600 bg-slate-50",
          }}
          className="bg-white"
        >
          <Descriptions.Item label="RFQ Identifier">
            <span className="font-mono font-bold text-slate-900 text-xs">{rfqOverview.rfqNumber}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Buyer Organization">
            <span className="font-medium text-slate-800 text-xs">{rfqOverview.buyerAccount}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Sourcing Title">
            <span className="font-medium text-slate-800 text-xs">{rfqOverview.sourcingTitle}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Orders Status">
            <span className="font-semibold text-slate-900 text-xs">
              {rfqOverview.totalIssuedOrders} Issued POs • {rfqOverview.totalPendingPackages} Pending Seller Packages
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Committed Value">
            <strong className="font-mono font-bold text-slate-900 text-xs">
              {formatCurrency(rfqOverview.totalCommittedValue)} {rfqOverview.currency}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Procurement Stage">
            <AntTag color="processing" className="font-semibold m-0 text-[10px] px-2 py-0">
              AWARDING & PO TRACKING
            </AntTag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tier 4: Primary Workspace Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="po-management-tabs"
        items={[
          {
            key: "awarding",
            label: (
              <span className="flex items-center gap-2 font-semibold text-xs">
                <FileDoneOutlined />
                Quotes Awarding & Allocations
              </span>
            ),
            children: <RfqQuoteAwardingTab rfqId={rfqId!} />,
          },
          {
            key: "pending",
            label: (
              <span className="flex items-center gap-2 font-semibold text-xs">
                <OrderedListOutlined />
                Waiting for PO Creation ({pendingItemCount} Items)
              </span>
            ),
            children: (
              <RfqPurchaseOrderTab
                rfqId={rfqId!}
                mode="pending"
                onPoCreated={() => setActiveTab("issued")}
                onNavigateToTab={setActiveTab}
              />
            ),
          },
          {
            key: "issued",
            label: (
              <span className="flex items-center gap-2 font-semibold text-xs">
                <FileTextOutlined />
                Issued Purchase Orders ({issuedPoCount})
              </span>
            ),
            children: (
              <RfqPurchaseOrderTab
                rfqId={rfqId!}
                mode="issued"
                onNavigateToTab={setActiveTab}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default RfqQuoteAwardingPage;
