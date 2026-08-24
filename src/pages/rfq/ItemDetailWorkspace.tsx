import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag as AntTag, Button, Table, Descriptions, Modal, InputNumber, App as AntApp, Drawer, Form, Input, Select } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge } from './RfqStatusBadge';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

interface TabProps {
  itemId: string;
}

// ============================================================================
// MAIN CONTAINER COMPONENT: ItemDetailWorkspace
// ============================================================================
export const ItemDetailWorkspace: React.FC = () => {

  const navigate = useNavigate();

  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const [activeTab, setActiveTab] = useState('quotes');

  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';


  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  const itemProduct = useLiveQuery(() => (item?.catalog_product_id ? catalogDb.products.get(item.catalog_product_id) : undefined), [item])
  const quotesCount = useLiveQuery(
    () => (itemId ? rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).count() : 0),
    [itemId]
  ) || 0;

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allVariants = useLiveQuery(
    async () => item?.product_id ? (await catalogDb.sellerProducts.get(item.product_id))?.variants : [],
    [item?.product_id]
  ) || [];
  const itemVariant = allVariants.find((v) => v.id === item?.variant_id);

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQs Workspace</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfq?.id}`)}>{rfq?.rfq_number || 'RFQ Details'}</a> },
    { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'Item Details'}-item-{item?.item_index}</span> }
  ], [basePath, rfq?.id, rfq?.rfq_number, item?.item_index, navigate]);

  useBreadcrumb(breadcrumbs);

  if (!rfq || rfq.requester_id !== activePartyId || !item || !itemId) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">RFQ Item Container Not Found</h2>
        <Button className="mt-4" onClick={() => navigate(basePath)}>
          Back to RFQs List
        </Button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === item.category_id)?.name || 'Unknown';

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{itemProduct?.name}</h1>
              <RfqItemStatusBadge status={item.status} />
            </div>
            <p className="text-slate-600 text-sm mt-1">Sourcing Line Item evaluation for container {rfq.rfq_number}.</p>
          </div>
        </div>

        <Descriptions title="Requested Item Details" bordered size="small" column={2} className="mb-2">
          <Descriptions.Item label="Product / Service" span={2}>
            <strong className="text-slate-800">{itemProduct?.name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Number" >
            <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Category">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="Variant">{itemVariant?.sku}</Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <AntTag color="blue" className="font-bold">{item.req_quantity} {item.req_unit}</AntTag>
          </Descriptions.Item>
          {/* <Descriptions.Item label="Requested Unit Price">
            {item.req_unit_price ? <span className="text-emerald-600 font-bold">${item.req_unit_price}</span> : 'N/A'}
          </Descriptions.Item> */}
        </Descriptions>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab} items={[

            {
              key: 'quotes',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <FileTextOutlined /> Supplier Quotes ({quotesCount})
                </span>
              ),
              children: <SupplierQuotesTab itemId={itemId} />
            },
            {
              key: 'attributes',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <AppstoreOutlined /> Requested Attributes
                </span>
              ),
              children: <RequestedAttributesTab itemId={itemId} />
            },

            {
              key: 'sellers',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <TeamOutlined /> Assigned Sellers ({(item.seller_assignments || []).length})
                </span>
              ),
              children: <AssignedSellersTab itemId={itemId} />
            }
          ]}
        />
      </Card>
    </div>
  );
};













// ============================================================================
// SUB-COMPONENT 1: Requested Attributes Tab (General preferences + custom specs)
// ============================================================================
const RequestedAttributesTab: React.FC<TabProps> = ({ itemId }) => {
  const item = useLiveQuery(() => rfqDb.rfq_items.get(itemId), [itemId]);

  const itemAttributes = useLiveQuery(
    () => rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray(),
    [itemId]
  ) || [];

  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const attributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const attributesValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];

  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  const attributeGroupsMap = React.useMemo(() => {
    if (!item || !itemAttributes?.length) return [];

    const groups = new Map((attributeGroups || []).map(g => [g.id, g.name]));
    const attrs = new Map((attributes || []).map(a => [a.id, a.name]));

    const getValues = (ia: any) => {
      const ids = new Set((ia.values || []).map((v: any) => v.value_id));

      switch (ia.attribute_id) {
        case "manufacturer":
          return (allManufacturers || [])
            .filter(v => ids.has(v.id))
            .map(v => ({ value_id: v.id, value_label: v.company_name }));

        case "brand":
          return (allBrands || [])
            .filter(v => ids.has(v.id))
            .map(v => ({ value_id: v.id, value_label: v.name }));

        case "req_quantity":
          return [
            { value_id: "req-quantity", value_label: item.req_quantity },
            { value_id: "req-quantity-unit", value_label: item.req_unit },
          ];

        default:
          return (attributesValues || [])
            .filter(v => ids.has(v.id))
            .map(v => ({ value_id: v.id, value_label: v.value || v.label }));
      }
    };

    const names: Record<string, string> = {
      req_quantity: "Requested Quantity",
      brand: "Brand",
      manufacturer: "Manufacturer",
    };

    const map = new Map<string, any>();

    itemAttributes.forEach((ia: any) => {
      const groupId = ia.group_id;
      const values = getValues(ia);

      if (!map.has(groupId)) {
        map.set(groupId, {
          name: groupId === "system"
            ? "System Specifications"
            : groups.get(groupId) || "",
          attributes: [],
        });
      }

      let reqViewValue = "N/A";
      if (ia.attribute_type === "SYSTEM") {
        if (ia.attribute_id === "req_quantity") {
          reqViewValue = `${item.req_quantity} ${item.req_unit}`;
        } else if (ia.attribute_id === "manufacturer" || ia.attribute_id === "brand") {
          reqViewValue = values.map((v: any) => v.value_label).join(" | ") || "N/A";
        } else {
          reqViewValue = values.map((v: any) => v.value_label).join(", ") || "N/A";
        }
      } else {
        const joiner = ia.connector === "AND" ? " AND " : ia.connector === "OR" ? " | " : ", ";
        reqViewValue = values.map((v: any) => v.value_label).join(joiner) || "N/A";
      }

      map.get(groupId).attributes.push({
        key: `${groupId}_${ia.attribute_id}`,
        attribute_type: ia.attribute_type,
        group_id: groupId,
        attribute_id: ia.attribute_id,
        attributeName: names[ia.attribute_id] || attrs.get(ia.attribute_id) || "",
        values,
        reqViewValue,
      });
    });

    return [...map.entries()];
  }, [item, itemAttributes, attributeGroups, attributes, attributesValues, allBrands, allManufacturers]);

  if (!item) return null;


  const attributesColumns = [
    {
      title: 'Attribute',
      dataIndex: 'attributeName',
      key: 'attributeName',
      width: 320,
      render: (text: string, record: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 leading-tight">
            {text}
          </span>
          {record.description && (
            <span className="text-xs text-slate-400 leading-tight italic">{record.description}</span>
          )}
        </div>
      )
    },
    {
      title: 'Requested / Required Value',
      dataIndex: 'reqViewValue',
      key: 'reqViewValue',
      render: (text: string) => <span className="text-slate-600 font-medium">{text}</span>
    }
  ];

  return (
    <div className="space-y-6">

      {attributeGroupsMap.map(([groupId, group], idx) => {
        const groupRows = group.attributes;

        const accentColor = ['#10b981', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'][idx % 5];

        return (
          <div
            key={groupId}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            style={{ borderLeft: `4px solid ${accentColor}` }}
          >
            <div
              className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-1.5"
              style={{ backgroundColor: `${accentColor}14` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {idx + 1}
                </span>
                <h4 className="text-md font-bold text-slate-800">{group.name}</h4>
              </div>
              <AntTag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                {groupRows.length} attributes
              </AntTag>
            </div>
            <div className="p-2">
              <Table
                dataSource={groupRows}
                columns={attributesColumns}
                pagination={false}
                size="small"
                bordered
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT 2: Supplier Quotes Tab
// ============================================================================
const SupplierQuotesTab: React.FC<TabProps> = ({ itemId }) => {
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const quotes = useLiveQuery(
    () => rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).toArray(),
    [itemId]
  ) || [];

  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const { message: antMessage } = AntApp.useApp();
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  const awards = useLiveQuery(() => (itemId ? rfqDb.rfq_awards.where('rfq_item_id').equals(itemId).toArray() : []), [itemId]) || [];

  const [awardModalVisible, setAwardModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [awardQty, setAwardQty] = useState<number>(1);
  const [savingAward, setSavingAward] = useState(false);

  const handleAwardClick = (quoteRecord: any) => {
    setSelectedQuote(quoteRecord);
    // Suggest remaining quantity to award
    const totalAwarded = awards.reduce((sum, a) => sum + a.awarded_quantity, 0);
    const remaining = Math.max(0, (item?.req_quantity || 0) - totalAwarded);
    setAwardQty(remaining || 1);
    setAwardModalVisible(true);
  };

  const submitAward = async () => {
    // if (!selectedQuote || !item) return;
    // if (awardQty <= 0) {
    //   antMessage.error('Please enter a valid quantity to award.');
    //   return;
    // }

    // setSavingAward(true);
    // try {
    //   const awardId = `awd-${item.id}-${selectedQuote.seller_party_id}-${Date.now()}`;

    //   // Determine if a catalog product variant already exists

    //   const awardPayload = {
    //     id: awardId,
    //     rfq_id: rfqId!,
    //     rfq_item_id: itemId!,
    //     seller_quote_id: selectedQuote.id,
    //     seller_party_id: selectedQuote.seller_party_id,
    //     awarded_quantity: awardQty,
    //     unit_price: selectedQuote.unit_price,
    //     award_status: 'AWARDED' as const,
    //     product_mapping_status: 'PENDING' as const,
    //     awarded_at: new Date().toISOString(),
    //     awarded_by_user_id: activeWorkspace?.userId
    //   };

    //   await rfqDb.rfq_awards.put(awardPayload);

    //   // Check if total awarded quantity meets requested quantity
    //   const newTotalAwarded = awards.reduce((sum, a) => sum + a.awarded_quantity, 0) + awardQty;
    //   if (newTotalAwarded >= item.quantity) {
    //     await rfqDb.rfq_items.update(item.id, { status: 'AWARDED', awarded_quantity_total: newTotalAwarded });
    //   } else {
    //     await rfqDb.rfq_items.update(item.id, { awarded_quantity_total: newTotalAwarded });
    //   }

    //   antMessage.success(`Quote successfully awarded to supplier!`);
    //   setAwardModalVisible(false);
    // } catch (err) {
    //   console.error(err);
    //   antMessage.error('Failed to register rfq award.');
    // } finally {
    //   setSavingAward(false);
    // }
  };

  const quotesColumns = [
    {
      title: 'Quote Reference',
      dataIndex: 'seller_quote_number',
      key: 'seller_quote_number',
      render: (text: string, record: any) => (
        <a
          onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/review`)}
          className="font-bold text-blue-600 hover:text-blue-800"
        >
          {text}
        </a>
      )
    },
    {
      title: 'Seller ID',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id',
      render: (sellerId: string) => {
        const p = parties.find((party) => party.id === sellerId);
        return <span>{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Offered Price',
      dataIndex: 'offer_unit_price',
      key: 'offer_unit_price',
      render: (val: number) => <span className="font-bold text-emerald-600">${val}</span>
    },
    {
      title: 'Round',
      dataIndex: 'round',
      key: 'round',
      render: (val: number) => <AntTag color="blue">Round #{val}</AntTag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {

        return <AntTag color={status === 'DEVIATION_ACCEPTED' ? 'success' : 'default'}>{status}</AntTag>;
      }
    },
    {
      title: 'Action / Award',
      key: 'action',
      render: (_: any, record: any) => {
        const matchingAward = awards.find((a) => a.seller_quote_id === record.id);

        if (matchingAward) {
          const mapStatus = matchingAward.product_mapping_status;
          const poStatus = matchingAward.award_status;

          if (poStatus === 'PO_RECEIVED') {
            return (
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold text-emerald-600">Active Order Ready</span>
                <span className="text-[10px] text-slate-400 font-mono">PO: {matchingAward.purchase_order_id}</span>
              </div>
            );
          }

          if (poStatus === 'PO_CREATED') {
            return (
              <div className="flex flex-col gap-0.5 text-left">
                <AntTag color="cyan" className="font-bold w-fit">PO Released</AntTag>
                <span className="text-[10px] text-slate-400 font-mono">{matchingAward.purchase_order_id}</span>
              </div>
            );
          }

          if (mapStatus === 'PENDING') {
            return <span className="text-xs text-amber-600 font-medium italic text-left">Awaiting Supplier Product Mapping...</span>;
          }
          if (mapStatus === 'SUBMITTED') {
            return (
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-xs text-blue-600 font-medium italic">Specs Submitted (ID: {matchingAward.variant_id || 'Pending'})</span>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/award/check-mapping`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Acknowledge Specs
                </Button>
              </div>
            );
          }

          // Mapped and Approved (ACKNOWLEDGED or NOT_REQUIRED)
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/award/release-po`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Release PO
            </Button>
          );
        }

        return (
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}/quotes/${record.id}/review`)}
            >
              Review
            </Button>
            {/* {record.status === 'DEVIATION_ACCEPTED' && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleAwardClick(record)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Award Quote
              </Button>
            )} */}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <Table
        dataSource={quotes}
        columns={quotesColumns}
        rowKey="id"
        pagination={false}
        size="small"
        locale={{ emptyText: 'No quotes received yet for this item.' }}
      />

      <Modal
        title="Award Sourcing Contract"
        open={awardModalVisible}
        onOk={submitAward}
        onCancel={() => setAwardModalVisible(false)}
        confirmLoading={savingAward}
        okText="Confirm Award"
        cancelText="Cancel"
      >
        <div className="space-y-4 pt-3">
          <p className="text-sm text-slate-500 leading-normal">
            You are about to award a commercial sourcing contract to <strong className="text-slate-800">{selectedQuote ? (parties.find((p) => p.id === selectedQuote.seller_party_id)?.display_name || selectedQuote.seller_party_id) : ''}</strong> at a unit price of <strong className="text-emerald-700">${selectedQuote?.unit_price}</strong>.
          </p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Enter Award Quantity:</span>
            <InputNumber
              min={1}
              max={item?.req_quantity || 1}
              value={awardQty}
              onChange={(val) => setAwardQty(val || 1)}
              className="w-32"
            />
            <span className="text-xs text-slate-400">(Max requested: {item?.req_quantity})</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ============================================================================
// SUB-COMPONENT 3: Assigned Sellers Tab
// ============================================================================
const AssignedSellersTab: React.FC<TabProps> = ({ itemId }) => {
  const item = useLiveQuery(() => rfqDb.rfq_items.get(itemId), [itemId]);
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const assignmentsColumns = [
    {
      title: 'Seller Party',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id',
      render: (sellerId: string) => {
        const p = parties.find((party) => party.id === sellerId);
        return <span className="font-bold text-slate-800">{p?.display_name || sellerId}</span>;
      }
    },
    {
      title: 'Party ID',
      dataIndex: 'seller_party_id',
      key: 'seller_party_id_raw',
      render: (sellerId: string) => <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600">{sellerId}</code>
    },
    {
      title: 'Invitation Mode',
      dataIndex: 'assignment_type',
      key: 'assignment_type',
      render: (type: string) => (
        <AntTag color={type === 'DIRECT_INVITATION' ? 'blue' : 'orange'}>
          {type === 'DIRECT_INVITATION' ? 'Direct Invitation' : 'Public Marketplace'}
        </AntTag>
      )
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      render: (date: string) => <span className="text-slate-600 text-sm">{new Date(date).toLocaleString()}</span>
    }
  ];

  if (!item) return null;

  return (
    <Table
      dataSource={item.seller_assignments || []}
      columns={assignmentsColumns}
      rowKey="id"
      pagination={false}
      size="small"
      locale={{ emptyText: 'No sellers assigned to this RFQ item.' }}
    />
  );
};