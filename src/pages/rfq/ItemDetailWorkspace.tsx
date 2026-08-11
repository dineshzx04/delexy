import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Tabs, Tag, Button, Breadcrumb, Table, Space, App as AntApp } from 'antd';
import {
  ToolOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge, ItemSupplierStatusBadge } from '../../components/rfq/RfqStatusBadge';
import { TechnicalComparisonTable } from '../../components/rfq/TechnicalComparisonTable';
import { BuyerTechnicalReviewDrawer } from '../../components/rfq/BuyerTechnicalReviewDrawer';
import { SplitOrderAwardDrawer } from '../../components/rfq/SplitOrderAwardDrawer';
import { businessDb } from '../../data/business/business.db';
import type { ItemSupplierResponseStatus } from '../../data/rfq';

export const ItemDetailWorkspace: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [activeTab, setActiveTab] = useState('item-attributes');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isTechReviewReadOnly, setIsTechReviewReadOnly] = useState(false);
  const [techReviewDrawerOpen, setTechReviewDrawerOpen] = useState(false);
  const [awardDrawerOpen, setAwardDrawerOpen] = useState(false);

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);
  const quotes = useLiveQuery(() => (itemId ? rfqDb.seller_quotes.where('rfq_item_id').equals(itemId).toArray() : []), [itemId]) || [];
  const quoteRevisions = useLiveQuery(() => rfqDb.seller_quote_revisions.toArray(), []) || [];
  const quoteAttributes = useLiveQuery(() => rfqDb.seller_quote_attributes.toArray(), []) || [];
  const quoteComments = useLiveQuery(() => rfqDb.seller_quote_comments.toArray(), []) || [];
  const allItemAttributes = useLiveQuery(() => rfqDb.rfq_item_attributes.toArray(), []) || [];
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allAttributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const categoryName = categories.find((c) => c.id === item?.category_id)?.name;
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  const currentItemAttributes = React.useMemo(() => {
    if (!itemId) return [];
    return allItemAttributes.filter((attr) => attr.rfq_item_id === itemId);
  }, [allItemAttributes, itemId]);

  const itemAttributeGroups = React.useMemo(() => {
    const groupedMap: Record<string, { groupName: string; rows: any[] }> = {};

    currentItemAttributes.forEach((attr) => {
      const groupId = attr.group_id || 'ungrouped';
      const groupName = allAttributeGroups.find((g) => g.id === attr.group_id)?.name || 'Ungrouped Attributes';

      if (!groupedMap[groupId]) {
        groupedMap[groupId] = { groupName, rows: [] };
      }

      groupedMap[groupId].rows.push({
        key: attr.id,
        attribute_name: attr.attribute_name,
        description: attr.description || '-',
        requested_values: (attr.values || []).map((v: any) => v.value_label || v.value_id).join(', ') || '-',
        value_count: (attr.values || []).length,
      });
    });

    return Object.entries(groupedMap).sort((a, b) => a[1].groupName.localeCompare(b[1].groupName));
  }, [currentItemAttributes, allAttributeGroups]);

  const brandLookup = React.useMemo(() => {
    const map = new Map<string, string>();
    allBrands.forEach((brand: any) => {
      map.set(brand.id, brand.name || brand.brand_name || brand.id);
    });
    return map;
  }, [allBrands]);

  const manufacturerLookup = React.useMemo(() => {
    const map = new Map<string, string>();
    allManufacturers.forEach((mfg: any) => {
      map.set(mfg.id, mfg.name || mfg.manufacturer_name || mfg.id);
    });
    return map;
  }, [allManufacturers]);

  const normalizeToArray = (value: string | string[] | null | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const staticItemDetails = React.useMemo(() => {
    const brandIds = normalizeToArray(item?.brand_id);
    const manufacturerIds = normalizeToArray(item?.manufacturer_id);

    const brandNames = brandIds.map((id) => brandLookup.get(id) || id).join(', ') || '-';
    const manufacturerNames = manufacturerIds.map((id) => manufacturerLookup.get(id) || id).join(', ') || '-';

    return [
      { key: 'category', detail: 'Category', value: categoryName || '-' },
      { key: 'qty', detail: 'Required Quantity', value: `${item?.quantity || '-'} ${item?.unit || ''}`.trim() },
      { key: 'target', detail: 'Target Unit Price', value: item?.target_unit_price ? `$${item.target_unit_price}` : '-' },
      { key: 'brand', detail: 'Preferred Brand', value: brandNames },
      { key: 'manufacturer', detail: 'Preferred Manufacturer', value: manufacturerNames },
      { key: 'source', detail: 'Item Source', value: item?.item_source || '-' },
    ];
  }, [categoryName, item, brandLookup, manufacturerLookup]);

  const submittedResponses = React.useMemo(() => {
    const deriveQuoteStatus = (quoteId: string, quoteStatus: string): ItemSupplierResponseStatus => {
      if (quoteStatus === 'ACCEPTED' || quoteStatus === 'PARTIALLY_ACCEPTED') return 'AWARDED';
      if (quoteStatus === 'NEGOTIATION') return 'TECHNICAL_APPROVED';
      if (quoteStatus === 'REVISED') return 'TECHNICAL_REVISION_REQUESTED';
      if (quoteStatus === 'SUBMITTED') return 'TECHNICAL_SUBMITTED';
      if (quoteStatus === 'REJECTED') return 'REJECTED';
      return 'ASSIGNED';
    };

    return quotes
      .filter((q) => {
        if (q.status === 'SUBMITTED' || q.status === 'NEGOTIATION' || q.status === 'ACCEPTED' || q.status === 'PARTIALLY_ACCEPTED') return true;
        if (q.status === 'REVISED') return true;
        return false;
      })
      .map((q) => {
        const party = parties.find((p) => p.id === q.seller_id) || { display_name: `Seller ${q.seller_id}` };

        const mappedStatus = deriveQuoteStatus(q.id, q.status);

        return {
          ...q,
          seller_party_name: party.display_name,
          mapped_status: mappedStatus,
        };
      });
  }, [quotes, parties, quoteRevisions, quoteAttributes, quoteComments]);

  const assignedSuppliers = React.useMemo(() => {
    if (!item) return [];

    const mapAssignmentToSupplierStatus = (
      assignmentStatus?: 'ASSIGNED' | 'VIEWED' | 'RESPONDED' | 'DECLINED'
    ): ItemSupplierResponseStatus => {
      if (assignmentStatus === 'VIEWED') return 'VIEWED';
      if (assignmentStatus === 'RESPONDED') return 'TECHNICAL_SUBMITTED';
      if (assignmentStatus === 'DECLINED') return 'REJECTED';
      return 'ASSIGNED';
    };

    return (item.target_seller_party_ids || []).map((sellerId: string) => {
      const activeQuote = quotes.find((q) => q.seller_id === sellerId);
      const party = parties.find((p) => p.id === sellerId) || { display_name: `Seller ${sellerId}` };
      const assignmentStatus = item.seller_assignments?.find((a) => a.seller_party_id === sellerId)?.status;

      let mappedStatus: ItemSupplierResponseStatus = mapAssignmentToSupplierStatus(assignmentStatus);
      if (activeQuote) {
        if (activeQuote.status === 'ACCEPTED' || activeQuote.status === 'PARTIALLY_ACCEPTED') {
          mappedStatus = 'AWARDED';
        } else if (activeQuote.status === 'NEGOTIATION') {
          mappedStatus = 'TECHNICAL_APPROVED';
        } else if (activeQuote.status === 'REVISED') {
          mappedStatus = 'TECHNICAL_REVISION_REQUESTED';
        } else if (activeQuote.status === 'SUBMITTED') {
          mappedStatus = 'TECHNICAL_SUBMITTED';
        } else if (activeQuote.status === 'REJECTED') {
          mappedStatus = 'REJECTED';
        }
      }

      return {
        id: activeQuote?.id || `no-quote-${item.id}-${sellerId}`,
        seller_party_name: party.display_name,
        status: mappedStatus,
      };
    });
  }, [item, quotes, parties]);

  if (!rfq || !item) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">Sourcing Item Not Found</h2>
        <Button className="mt-4" onClick={() => navigate(`${basePath}/${rfqId}`)}>
          Back to RFQ Workspace
        </Button>
      </div>
    );
  }

  const handleGrantSplitAwards = async (allocations: { quoteId: string; awardedQty: number; unitPrice: number }[]) => {
    try {
      let totalQty = 0;
      for (const alloc of allocations) {
        if (alloc.awardedQty > 0) {
          totalQty += alloc.awardedQty;
          const awardId = `award-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const activeQuote = quotes.find((q) => q.id === alloc.quoteId);

          await rfqDb.rfq_awards.put({
            id: awardId,
            rfq_id: rfq.id,
            rfq_item_id: item.id,
            seller_party_id: activeQuote?.seller_id || 'pty-4',
            seller_product_id: 'sprod-1',
            variant_id: 'sprod-1-v1',
            awarded_quantity: alloc.awardedQty,
            unit_price: alloc.unitPrice,
            currency: 'USD',
            awarded_by_user_id: 'usr-2',
            awarded_at: new Date().toISOString(),
            status: 'PO_CREATED',
            purchase_order_id: `po-2026-${Math.floor(100 + Math.random() * 900)}`,
          });

          await rfqDb.seller_quotes.update(alloc.quoteId, {
            status: 'ACCEPTED',
            updated_at: new Date().toISOString()
          });
        }
      }

      await rfqDb.rfq_items.update(item.id, {
        status: totalQty >= item.quantity ? 'FULLY_AWARDED' : 'PARTIALLY_AWARDED',
        awarded_quantity_total: totalQty,
      });

      antMessage.success('Multi-supplier split order awards granted!');
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to process split order awards');
    }
  };
 
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(basePath)}>RFQs</a> },
          { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq.rfq_number}</a> },
          { title: `Item ${item.item_index}: ${item.product_name}` },
        ]}
      />

      <Card className="shadow-md border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-md font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                Line Item #{item.item_index}
              </span>
              <h1 className="text-xl font-black text-slate-900">{item.product_name}</h1>
              <RfqItemStatusBadge status={item.status} />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-600 font-medium">
              <div>Category: <Tag color="purple">{categoryName}</Tag></div>
              <div>Required Qty: <strong className="text-blue-600 font-bold">{item.quantity} {item.unit}</strong></div>
              <div>Target Unit Price: <strong className="text-emerald-600 font-bold">${item.target_unit_price}</strong></div>
            </div>
          </div>

          {/* <Button
            type="primary"
            size="large"
            onClick={() => setAwardDrawerOpen(true)}
            icon={<TrophyOutlined />}
            className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5 font-bold shadow-md"
          >
            Split Award Hub
          </Button> */}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'item-attributes',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <ToolOutlined /> Item Attributes ({currentItemAttributes.length})
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Table
                    dataSource={staticItemDetails}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Detail',
                        dataIndex: 'detail',
                        key: 'detail',
                        width: 260,
                        render: (text: string) => <span className="font-semibold text-slate-700">{text}</span>,
                      },
                      {
                        title: 'Value',
                        dataIndex: 'value',
                        key: 'value',
                        render: (text: string) => <span className="text-slate-900">{text || '-'}</span>,
                      },
                    ]}
                  />

                  {itemAttributeGroups.length === 0 ? (
                    <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
                      No item attributes found for current item revision.
                    </div>
                  ) : (
                    itemAttributeGroups.map(([groupId, group]) => (
                      <Card
                        key={groupId}
                        size="small"
                        title={
                          <span className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-800 font-extrabold tracking-wide shadow-sm">
                            {group.groupName}
                          </span>
                        }
                        className="border-slate-200"
                      >
                        <Table
                          dataSource={group.rows}
                          rowKey="key"
                          pagination={false}
                          size="small"
                          tableLayout="fixed"
                          scroll={{ x: 980 }}
                          columns={[
                            {
                              title: 'Attribute',
                              dataIndex: 'attribute_name',
                              key: 'attribute_name',
                              width: 240,
                              render: (text: string) => <span className="font-semibold text-slate-800">{text}</span>,
                            },
                            {
                              title: 'Description',
                              dataIndex: 'description',
                              key: 'description',
                              width: 280,
                              render: (text: string) => <span className="text-slate-600">{text || '-'}</span>,
                            },
                            {
                              title: 'Requested Values',
                              dataIndex: 'requested_values',
                              key: 'requested_values',
                              width: 460,
                              render: (text: string) => <span className="text-slate-900">{text || '-'}</span>,
                            }
                          ]}
                        />
                      </Card>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: 'responses',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <MessageOutlined /> Responses ({submittedResponses.length})
                </span>
              ),
              children: <Table
                dataSource={submittedResponses}
                rowKey="id" pagination={false}
                columns={
                  [
                    {
                      title: 'Supplier Party',
                      dataIndex: 'seller_party_name',
                      key: 'seller_party_name',
                      render: (text: string) => <span className="font-bold text-slate-900">{text}</span>,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'mapped_status',
                      key: 'status',
                      width: 220,
                      render: (status: any) => <ItemSupplierStatusBadge status={status} />,
                    },
                    {
                      title: 'Technical Round',
                      key: 'round',
                      width: 140,
                      render: (_: any, record: any) => {
                        const revisions = quoteRevisions.filter((r) => r.seller_quote_id === record.id);
                        const maxRound = revisions.length > 0 ? Math.max(...revisions.map((r) => r.revision_number)) : 1;
                        return <Tag color="cyan">Round #{maxRound}</Tag>;
                      },
                    },
                    {
                      title: 'Offered Price ($)',
                      dataIndex: 'unit_price',
                      key: 'price',
                      width: 140,
                      render: (price: number) => {
                        return <span className="font-bold text-emerald-600">${price || '-'}</span>;
                      },
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      width: 160,
                      render: (_: any, record: any) => {
                        const canEdit = record.status === 'SUBMITTED';

                        return (
                          <Space size="small">
                            <Button
                              type={canEdit ? 'primary' : 'default'}
                              size="small"
                              onClick={() => {
                                setSelectedQuoteId(record.id);
                                setIsTechReviewReadOnly(!canEdit);
                                setTechReviewDrawerOpen(true);
                              }}
                              icon={<CheckCircleOutlined />}
                            >
                              {canEdit ? 'Review Tech' : 'View Tech'}
                            </Button>
                          </Space>
                        );
                      },
                    },
                  ]
                }
              />,
            },
            {
              key: 'suppliers',
              label: (
                <span className="font-bold flex items-center gap-2">
                  <SafetyCertificateOutlined /> Assigned Suppliers ({assignedSuppliers.length})
                </span>
              ),
              children: <Table
                dataSource={assignedSuppliers}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Supplier Party',
                    dataIndex: 'seller_party_name',
                    key: 'seller_party_name',
                    render: (text: string) => <span className="font-bold text-slate-900">{text}</span>,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    width: 220,
                    render: (status: any) => <ItemSupplierStatusBadge status={status} />,
                  },
                ]}
              />,
            },
            // {
            //   key: 'comparison',
            //   label: (
            //     <span className="font-bold flex items-center gap-2">
            //       <ToolOutlined /> Technical Comparison
            //     </span>
            //   ),
            //   children: (
            //     <TechnicalComparisonTable
            //       item={item}
            //       onReviewTechnical={(quoteId) => {
            //         setIsTechReviewReadOnly(false);
            //         setSelectedQuoteId(quoteId);
            //         setTechReviewDrawerOpen(true);
            //       }}
            //     />
            //   ),
            // },
          ]}
        />
      </Card>

      <BuyerTechnicalReviewDrawer
        open={techReviewDrawerOpen}
        onClose={() => {
          setTechReviewDrawerOpen(false);
          setIsTechReviewReadOnly(false);
        }}
        quoteId={selectedQuoteId}
        itemTitle={item.product_name}
        forceReadOnly={isTechReviewReadOnly}
      />

      <SplitOrderAwardDrawer
        visible={awardDrawerOpen}
        onClose={() => setAwardDrawerOpen(false)}
        item={item}
        quotes={quotes}
        onGrantSplitAwards={handleGrantSplitAwards}
      />
    </div>
  );
};
