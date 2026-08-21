import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Button, Tag as AntTag, Table, Descriptions, App as AntApp, Alert, Input, Switch, Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined, UndoOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined } from '@ant-design/icons';
import { rfqDb, type SellerQuote, type SellerQuoteAttribute, type SellerQuoteComment } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';


export const RequesterQuoteReview: React.FC = () => {
  const { rfqId, itemId, quoteId } = useParams<{ rfqId: string; itemId: string; quoteId: string }>();

  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [processing, setProcessing] = useState(false);
  const [buyerComments, setBuyerComments] = useState<Record<string, string>>({});
  const [acceptedAttributes, setAcceptedAttributes] = useState<Record<string, boolean>>({});

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []);
  const activeParty = React.useMemo(() => {
    if (!parties || parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfq = useLiveQuery(
    async () => {
      if (!rfqId) return null;
      const res = await rfqDb.rfqs.get(rfqId);
      return res || null;
    },
    [rfqId]
  );

  const item = useLiveQuery(
    async () => {
      if (!itemId) return null;
      const res = await rfqDb.rfq_items.get(itemId);
      return res || null;
    },
    [itemId]
  );

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []);
  const catalogProducts = useLiveQuery(() => catalogDb.products.toArray(), []);
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []);
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []);

  const sellerProduct = useLiveQuery(
    async () => {
      if (item === undefined) return undefined;
      if (!item?.product_id) return null;
      const res = await catalogDb.sellerProducts.get(item.product_id);
      return res || null;
    },
    [item]
  );

  const allVariants = useLiveQuery(
    async () => {
      if (item === undefined) return undefined;
      if (!item?.product_id) return [];
      const sprod = await catalogDb.sellerProducts.get(item.product_id);
      return sprod?.variants || [];
    },
    [item]
  );
  const itemVariant = React.useMemo(() => {
    if (!allVariants || !item) return null;
    return allVariants.find((v) => v.id === item.variant_id) || null;
  }, [allVariants, item]);

  const itemAttributes = useLiveQuery(
    () => (itemId ? rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  );

  const quote = useLiveQuery(
    async () => {
      if (!quoteId) return null;
      const res = await rfqDb.seller_quotes.get(quoteId);
      return res || null;
    },
    [quoteId]
  );

  const quoteAttributes = useLiveQuery(
    async () => {
      if (!quoteId) return [];
      return await rfqDb.seller_quote_attributes.where('seller_quote_id').equals(quoteId).toArray();
    },
    [quoteId]
  );

  const existingComments = useLiveQuery(
    async () => {
      if (!quoteId) return [];
      return await rfqDb.seller_quote_comments.where('seller_quote_id').equals(quoteId).toArray();
    },
    [quoteId]
  );

  const isLoading =
    rfq === undefined ||
    item === undefined ||
    quote === undefined ||
    quoteAttributes === undefined ||
    existingComments === undefined ||
    parties === undefined ||
    categories === undefined ||
    catalogProducts === undefined ||
    catalogAttributes === undefined ||
    attributeGroups === undefined ||
    sellerProduct === undefined ||
    allVariants === undefined ||
    itemAttributes === undefined;

  const allAccepted = React.useMemo(() => {
    if (!quoteAttributes || quoteAttributes.length === 0) return false;
    return quoteAttributes.every((attr) => acceptedAttributes[attr.id] === true);
  }, [quoteAttributes, acceptedAttributes]);

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || 'RFQ'}</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}`)}>Item Review</a> },
    { title: <span className="text-slate-800 font-semibold">Quote Review</span> }
  ], [navigate, basePath, rfqId, itemId, rfq?.rfq_number]);
  useBreadcrumb(breadcrumbs);

  // // Load existing buyer comments if any
  // React.useEffect(() => {
  //   if (existingComments && existingComments.length > 0) {
  //     const initialComments: Record<string, string> = {};
  //     existingComments
  //       .filter((c) => c.actor_type === 'BUYER')
  //       .forEach((c) => {
  //         const key = `${c.group_id}_${c.attribute_id}`;
  //         initialComments[key] = c.comment || '';
  //       });
  //     setBuyerComments(initialComments);
  //   }
  // }, [existingComments]);

  // Initialize accepted attributes state from DB
  React.useEffect(() => {
    if (quoteAttributes && quoteAttributes.length > 0) {
      const initialAccepted: Record<string, boolean> = {};
      quoteAttributes.forEach((attr) => {
        initialAccepted[attr.id] = !!attr.buyer_accepted;
      });
      setAcceptedAttributes(initialAccepted);
    }
  }, [quoteAttributes]);


  const attributeGroupsMap = React.useMemo(() => {
    if (!quoteAttributes) return [];
    const map: Record<string, { name: string; attributes: any[] }> = {};

    quoteAttributes.forEach(qa => {
      const groupId = qa.group_id;
      const isVariant = qa.attribute_id.startsWith('var-') || (qa as any).is_variant || false;

      if (!map[groupId]) {
        let groupName = "";
        if (groupId === 'system') {
          groupName = 'System Specifications';
        } else {
          groupName = attributeGroups.find(g => g.id === groupId)?.name ||
            (isVariant ? 'Variant Specifications' : 'General Specifications');
        }
        map[groupId] = { name: groupName, attributes: [] };
      }

      let attrName = "";
      if (qa.attribute_id === 'req_unit_price') attrName = 'Unit Price ($)';
      else if (qa.attribute_id === 'req_quantity') attrName = 'Requested Quantity';
      else if (qa.attribute_id === 'brand') attrName = 'Brand';
      else if (qa.attribute_id === 'manufacturer') attrName = 'Manufacturer';
      else {
        attrName = catalogAttributes.find(a => a.id === qa.attribute_id)?.name || qa.attribute_id;
      }

      // Determine what the buyer requested for comparison (taken from the snapshotted req_value)
      let reqViewValue = 'N/A';
      if (qa.attribute_id === 'req_quantity') {
        const qtyVal = qa.req_value?.find(v => v.value_id === 'req-quantity')?.value_label || '';
        const qtyUnit = qa.req_value?.find(v => v.value_id === 'req-quantity-unit')?.value_label || '';
        reqViewValue = qtyVal ? `${qtyVal} ${qtyUnit}`.trim() : 'N/A';
      } else if (qa.attribute_id === 'req_unit_price') {
        const priceVal = qa.req_value?.find(v => v.value_id === 'req-unit-price')?.value_label || 'N/A';
        reqViewValue = priceVal !== 'N/A' ? `$${priceVal}` : 'N/A';
      } else {
        reqViewValue = (qa.req_value || []).map(v => v.value_label).join(', ') || 'N/A';
      }

      // Determine what the supplier proposed for comparison
      let proposalViewValue = 'N/A';
      if (qa.attribute_id === 'req_quantity') {
        const qtyVal = qa.values?.find(v => v.value_id === 'req-quantity')?.value_label || '';
        const qtyUnit = qa.values?.find(v => v.value_id === 'req-quantity-unit')?.value_label || '';
        proposalViewValue = qtyVal ? `${qtyVal} ${qtyUnit}`.trim() : 'N/A';
      } else if (qa.attribute_id === 'req_unit_price') {
        const priceVal = qa.values?.find(v => v.value_id === 'req-unit-price')?.value_label || '';
        proposalViewValue = priceVal ? `$${priceVal}` : 'N/A';
      } else {
        proposalViewValue = (qa.values || []).map(v => v.value_label).join(', ') || '—';
      }

      const proposalKey = `${qa.group_id}_${qa.attribute_id}`;

      map[groupId].attributes.push({
        ...qa,
        key: proposalKey,
        attribute_type: qa.attribute_type || (groupId === 'system' ? 'SYSTEM' : 'CUSTOM'),
        attributeName: attrName,
        attribute_id: qa.attribute_id,
        group_id: qa.group_id,
        is_variant: isVariant,
        reqViewValue: reqViewValue,
        proposalViewValue: proposalViewValue,
        proposalKey: proposalKey
      });
    });

    // Sort attributes within each group (especially system group)
    Object.keys(map).forEach(groupId => {
      if (groupId === 'system') {
        const order = ['manufacturer', 'brand', 'req_unit_price', 'req_quantity'];
        map[groupId].attributes.sort((a, b) => {
          return order.indexOf(a.attribute_id) - order.indexOf(b.attribute_id);
        });
      }
    });

    return Object.entries(map).sort((a, b) => {
      if (a[0] === 'system') return -1;
      if (b[0] === 'system') return 1;
      return 0;
    });
  }, [quoteAttributes, attributeGroups, catalogAttributes, itemAttributes, item]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 font-sans animate-pulse">Loading Sourcing Evaluation...</h2>
      </div>
    );
  }

  if (!rfq || !item || !quote || rfq.requester_id !== activePartyId) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">Sourcing quote review target not found or unauthorized</h2>
        <Button className="mt-4" onClick={() => navigate(basePath)}>
          Back to RFQs List
        </Button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === item.category_id)?.name || 'Unknown';
  const sellerParty = parties.find((p) => p.id === quote.seller_party_id);

  // Decision trigger
  const handleDecision = async (statusDecision: 'DEVIATION_ACCEPTED' | 'REJECTED' | 'REVISION_REQUIRED') => {
    if (!quote || !rfq) return;
    setProcessing(true);
    try {
      // 0. Persist buyer_accepted status of attributes in DB
      await rfqDb.transaction('rw', rfqDb.seller_quote_attributes, async () => {
        for (const [attrId, accepted] of Object.entries(acceptedAttributes)) {
          await rfqDb.seller_quote_attributes.update(attrId, { buyer_accepted: accepted });
        }
      });

      // 1. Update Quote status and increment round if revision is required
      const updatedQuote = {
        ...quote,
        status: statusDecision,
        round: statusDecision === 'REVISION_REQUIRED' ? quote.round + 1 : quote.round,
        updated_at: new Date().toISOString()
      };
      await rfqDb.seller_quotes.put(updatedQuote);

      // 2. Save Buyer comments
      const commentPromises = Object.entries(buyerComments)
        .filter(([_, val]) => !!val.trim())
        .map(([key, commentVal]) => {
          const groupId = key.split('_')[0];
          const attributeId = key.split('_').slice(1).join('_');

          const round = quote.round;
          const commentId = `qc-buyer-${quote.id}-${groupId}-${attributeId}-r${round}`;
          return rfqDb.seller_quote_comments.put({
            id: commentId,
            seller_quote_id: quote.id,
            group_id: groupId,
            attribute_id: attributeId,
            comment: commentVal.trim(),
            actor_type: 'BUYER',
            actor_id: rfq.requester_id,
            round: quote.round,
            created_at: new Date().toISOString()
          });
        });
      await Promise.all(commentPromises);

      antMessage.success(`Quote decision set to ${statusDecision} successfully.`);
      navigate(`${basePath}/${rfqId}/items/${itemId}`);
    } catch (e: any) {
      console.error(e);
      antMessage.error('Failed to submit quote evaluation decision.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleGroupAcceptance = (attributes: any[], accept: boolean) => {
    setAcceptedAttributes((prev) => {
      const updated = { ...prev };
      attributes.forEach((attr) => {
        updated[attr.id] = accept;
      });
      return updated;
    });
  };

  const attributesColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50,
      className: "align-top",
      render: (_: string, __: any, index: number) => <span className='pl-1.5'>{index + 1}</span>
    },
    {
      title: 'Attribute',
      dataIndex: 'attributeName',
      key: 'attributeName',
      width: 320,
      className: "align-top",
      render: (text: string, record: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 leading-tight">
            {text}
            {(record.is_variant || record.isVariant) && (
              <AntTag
                color="blue"
                className="leading-tight italic ml-2"
                icon={<AntIconCheckCircleOutlined />}
              >
                Variant Attribute
              </AntTag>
            )}
          </span>
          {record.description && (
            <span className="text-xs text-slate-400 leading-tight italic">{record.description}</span>
          )}
        </div>
      )
    },
    {
      title: 'Requested Value',
      dataIndex: 'reqViewValue',
      key: 'reqViewValue',
      className: "align-top",
      render: (text: string) => <span className="text-slate-600 font-medium">{text}</span>
    },
    {
      title: 'Accept',
      dataIndex: 'buyer_accepted',
      key: 'buyer_accepted',
      className: "w-[80px] text-center align-top",
      render: (_: boolean, record: any) => (
        <Checkbox
          checked={!!acceptedAttributes[record.id]}
          disabled={quote?.status !== 'SUBMITTED'}
          onChange={(e) => {
            setAcceptedAttributes((prev) => ({
              ...prev,
              [record.id]: e.target.checked
            }));
          }}
        />
      )
    },
    {
      title: 'Proposal Value & Feedback',
      dataIndex: 'proposalViewValue',
      key: 'proposalValue',
      className: "w-[400px] max-w-[400px] align-top",
      render: (_: string, attribute: any) => {
        const threadComments = existingComments
          .filter((c) => c.group_id === attribute.group_id && c.attribute_id === attribute.attribute_id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return (
          <div className="flex gap-2 flex-col">
            <div className="w-full flex items-center gap-2">
              <span className="text-emerald-700 font-bold">{attribute.proposalViewValue}</span>
              {attribute.is_deviation && (
                <AntTag color="warning" className="font-bold m-0 border-amber-300 text-amber-700 bg-amber-50 text-[10px]">
                  DEVIATION
                </AntTag>
              )}
            </div>
            <div className="flex flex-col w-full">
              {quote.status === 'SUBMITTED' && (
                <Input.TextArea
                  rows={2}
                  className="mb-1"
                  placeholder="Leave feedback on this specification..."
                  value={buyerComments[attribute.proposalKey] || ''}
                  onChange={(e) => setBuyerComments((prev) => ({ ...prev, [attribute.proposalKey]: e.target.value }))}
                />
              )}

              <div className="mt-1 space-y-1 text-left w-full">
                {threadComments.map((c) => {
                  const isBuyer = c.actor_type === 'BUYER';
                  const isSelf = c.actor_id === activePartyId;
                  const name = isSelf ? 'You' : (isBuyer ? 'Requester' : 'Seller');
                  const timeStr = c.created_at
                    ? `${new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : '';
                  return (
                    <div
                      key={c.id}
                      className={`text-[11px] px-2 py-0.5 rounded leading-normal border ${isBuyer
                        ? 'bg-blue-50/50 border-blue-100 text-blue-900'
                        : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                        }`}
                    >
                      <span className="font-bold text-[9px] uppercase tracking-wider mr-1 opacity-70">
                        [{name} {timeStr}]:
                      </span>
                      <span className="font-medium whitespace-pre-wrap">{c.comment}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card
        className="shadow-md border-slate-200"
        title={
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-tight">Review Sourcing Quote Proposal</span>
              <span className="text-xs text-slate-500 font-normal">{quote.seller_quote_number} &bull; Supplier: {sellerParty?.display_name || quote.seller_party_id}</span>
            </div>
          </div>
        }
      >
        {/* Proposal Status Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 mb-5 flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Quote Reference</span>
            <AntTag color="purple" className="font-mono font-bold text-sm mt-0.5">{quote.seller_quote_number}</AntTag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Quote Status</span>
            <AntTag
              color={quote.status === 'SUBMITTED' ? 'blue' : quote.status === 'DRAFT' ? 'orange' : quote.status === 'DEVIATION_ACCEPTED' ? 'green' : quote.status === 'REJECTED' ? 'red' : 'default'}
              className="mt-0.5 font-bold"
            >
              {quote.status}
            </AntTag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Round</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5">Round #{quote.round}</span>
          </div>
          {quote.created_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Submitted</span>
              <span className="text-xs text-slate-600 mt-0.5">{new Date(quote.created_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Requested Item Details */}
        <Descriptions title="Requested Item Details" bordered size="small" column={2} className="mb-6">
          <Descriptions.Item label="Product / Service" span={2}>
            <strong className="text-slate-800">{sellerProduct?.product_name || 'Custom Specifications'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Catalog Product">
            {item.catalog_product_id
              ? catalogProducts.find((p) => p.id === item.catalog_product_id)?.name || item.catalog_product_id
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Category">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="Variant">{itemVariant?.sku || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <AntTag color="blue" className="font-bold">{item.req_quantity} {item.req_unit || 'pcs'}</AntTag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested Unit Price">
            {item.req_unit_price ? <span className="text-emerald-600 font-bold">${item.req_unit_price}</span> : 'N/A'}
          </Descriptions.Item>
        </Descriptions>

        <div className="space-y-6">
          {/* Status Decision Alerts */}
          {quote.status === 'DEVIATION_ACCEPTED' && (
            <Alert
              type="success"
              showIcon
              message="Proposal Accepted"
              description="You have accepted this sourcing quote proposal."
              className="rounded-xl"
            />
          )}
          {quote.status === 'REJECTED' && (
            <Alert
              type="error"
              showIcon
              message="Proposal Rejected"
              description="You have rejected this sourcing quote proposal."
              className="rounded-xl"
            />
          )}
          {quote.status === 'REVISION_REQUIRED' && (
            <Alert
              type="warning"
              showIcon
              message="Revision Requested"
              description="Revisions have been requested. A new proposal response round is now open for this supplier."
              className="rounded-xl"
            />
          )}

          <h3 className="text-base font-bold text-slate-900 pt-3">Attribute configuration</h3>

          {attributeGroupsMap.map(([groupId, group], idx) => {
            const accentColor = ['#10b981', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'][idx % 5];

            return (
              <div
                key={groupId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                style={{ borderLeft: `4px solid ${accentColor}` }}
              >
                <div
                  className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
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
                  <div className="flex items-center gap-2">
                    {quote?.status === 'SUBMITTED' && (
                      <div className="flex gap-1.5 mr-2">
                        <Button
                          size="small"
                          type="dashed"
                          onClick={() => handleToggleGroupAcceptance(group.attributes, true)}
                          className="text-[11px] h-6 px-2 text-emerald-600 border-emerald-200 hover:text-emerald-700 hover:border-emerald-300"
                        >
                          Approve All
                        </Button>
                        <Button
                          size="small"
                          type="dashed"
                          onClick={() => handleToggleGroupAcceptance(group.attributes, false)}
                          className="text-[11px] h-6 px-2 text-slate-500 border-slate-200 hover:text-slate-600 hover:border-slate-300"
                        >
                          Reject All
                        </Button>
                      </div>
                    )}
                    <AntTag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                      {group.attributes.length} attributes
                    </AntTag>
                  </div>
                </div>
                <div className="p-3">
                  <Table
                    rowKey="proposalKey"
                    dataSource={group.attributes}
                    columns={attributesColumns}
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ x: 768 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {quote.status === 'SUBMITTED' && (
          <div className="pt-6 flex justify-end gap-3 border-t mt-6">
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleDecision('REJECTED')}
              loading={processing}
            >
              Reject Proposal
            </Button>
            {!allAccepted && (
              <Button
                icon={<UndoOutlined />}
                onClick={() => handleDecision('REVISION_REQUIRED')}
                loading={processing}
                className="border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
              >
                Request Revision
              </Button>
            )}
            {allAccepted && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleDecision('DEVIATION_ACCEPTED')}
                loading={processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Accept Proposal
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
