import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Button, Tag as AntTag, Table, Descriptions, App as AntApp, Alert, Input } from 'antd';
import { CheckOutlined, CloseOutlined, UndoOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined } from '@ant-design/icons';
import { rfqDb, type SellerQuote, type SellerQuoteAttribute, type SellerQuoteComment } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const CommentThread: React.FC<{
  comments: any[];
  viewerPartyId: string;
}> = ({ comments, viewerPartyId }) => {
  if (comments.length === 0) return null;

  return (
    <div className="mt-1 space-y-1 text-left w-full">
      {comments.map((c) => {
        const isBuyer = c.actor_type === 'BUYER';
        const isSelf = c.actor_id === viewerPartyId;
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
  );
};

export const RequesterQuoteReview: React.FC = () => {
  const { rfqId, itemId, quoteId } = useParams<{ rfqId: string; itemId: string; quoteId: string }>();

  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [processing, setProcessing] = useState(false);
  const [buyerComments, setBuyerComments] = useState<Record<string, string>>({});

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = React.useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfq = useLiveQuery(() => (rfqId ? rfqDb.rfqs.get(rfqId) : undefined), [rfqId]);
  const item = useLiveQuery(() => (itemId ? rfqDb.rfq_items.get(itemId) : undefined), [itemId]);

  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const catalogProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];

  const sellerProduct = useLiveQuery(
    async () => item?.product_id ? await catalogDb.sellerProducts.get(item.product_id) : undefined,
    [item?.product_id]
  );
  
  const allVariants = useLiveQuery(
    async () => item?.product_id ? (await catalogDb.sellerProducts.get(item.product_id))?.variants : [],
    [item?.product_id]
  ) || [];
  const itemVariant = allVariants.find((v) => v.id === item?.variant_id);

  const itemAttributes = useLiveQuery(
    () => (itemId ? rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const quote = useLiveQuery(() => (quoteId ? rfqDb.seller_quotes.get(quoteId) : undefined), [quoteId]);

  const quoteAttributes = useLiveQuery(
    () => (quoteId ? rfqDb.seller_quote_attributes.where('seller_quote_id').equals(quoteId).toArray() : []),
    [quoteId]
  ) || [];

  const existingComments = useLiveQuery(
    () => (quoteId ? rfqDb.seller_quote_comments.where('seller_quote_id').equals(quoteId).toArray() : []),
    [quoteId]
  ) || [];

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || 'RFQ'}</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}`)}>Item Review</a> },
    { title: <span className="text-slate-800 font-semibold">Quote Review</span> }
  ], [navigate, basePath, rfqId, itemId, rfq?.rfq_number]);
  useBreadcrumb(breadcrumbs);

  // Load existing buyer comments if any
  React.useEffect(() => {
    if (existingComments.length > 0) {
      const initialComments: Record<string, string> = {};
      existingComments
        .filter((c) => c.actor_type === 'BUYER')
        .forEach((c) => {
          const key = `${c.group_id}_${c.attribute_id}`;
          initialComments[key] = c.comment || '';
        });
      setBuyerComments(initialComments);
    }
  }, [existingComments]);


  // Decision trigger
  const handleDecision = async (statusDecision: 'ACCEPTED' | 'REJECTED' | 'REVISION_REQUIRED') => {
    if (!quote || !rfq) return;
    setProcessing(true);
    try {
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

  const attributeGroupsMap = React.useMemo(() => {
    const map: Record<string, { name: string; attributes: any[] }> = {};
    
    quoteAttributes.forEach(qa => {
      const groupId = qa.group_id;
      if (!map[groupId]) {
        let groupName = 'General Specifications';
        if (groupId === 'system') {
          groupName = 'System Specifications';
        } else {
          groupName = attributeGroups.find(g => g.id === groupId)?.name || 'General Specifications';
        }
        map[groupId] = { name: groupName, attributes: [] };
      }

      let attrName = qa.attribute_id;
      if (qa.attribute_id === 'req_unit_price') attrName = 'Unit Price ($)';
      else if (qa.attribute_id === 'req_quantity') attrName = 'Requested Quantity';
      else if (qa.attribute_id === 'brand') attrName = 'Brand Preference';
      else if (qa.attribute_id === 'manufacturer') attrName = 'Manufacturer Preference';
      else {
        attrName = catalogAttributes.find(a => a.id === qa.attribute_id)?.name || qa.attribute_id;
      }

      // Determine what the buyer requested for comparison
      let reqViewValue = 'N/A';
      if (qa.attribute_id === 'req_quantity' && item) {
          reqViewValue = `${item.req_quantity} ${item.req_unit || 'pcs'}`;
      } else if (qa.attribute_id === 'req_unit_price' && item) {
          reqViewValue = item.req_unit_price ? `$${item.req_unit_price}` : 'N/A';
      } else {
          const matchedReqAttr = itemAttributes.find(ia => ia.attribute_id === qa.attribute_id);
          reqViewValue = (matchedReqAttr?.values || []).map(v => v.value_label).join(', ') || 'N/A';
      }

      const proposalKey = `${qa.group_id}_${qa.attribute_id}`;
      const isVariant = qa.attribute_id.startsWith('var-') || false;

      map[groupId].attributes.push({
        ...qa,
        attributeName: attrName,
        isVariant: isVariant,
        reqViewValue: reqViewValue,
        proposalKey: proposalKey
      });
    });
    
    return Object.entries(map);
  }, [quoteAttributes, attributeGroups, catalogAttributes, itemAttributes, item]);

  if (rfq === undefined || item === undefined || quote === undefined || parties.length === 0) {
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
            {record.isVariant && (
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
      title: 'Deviation',
      dataIndex: 'is_deviation',
      key: 'deviation',
      className: "w-[80px] text-center align-top",
      render: (is_deviation: boolean) => (
        is_deviation ? <AntTag color="warning" className="font-bold m-0 border-amber-300 text-amber-700 bg-amber-50 text-[10px]">YES</AntTag> : <span className="text-slate-400">-</span>
      )
    },
    {
      title: 'Proposal Value & Feedback',
      dataIndex: 'proposalValue',
      key: 'proposalValue',
      className: "w-[400px] max-w-[400px] align-top",
      render: (_: string, attribute: any) => {
        const proposalValue = (attribute.values || []).map((v: any) => v.value_label).join(', ') || '—';
        
        const threadComments = existingComments
          .filter((c) => c.group_id === attribute.group_id && c.attribute_id === attribute.attribute_id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return (
          <div className="flex gap-2 flex-col">
            <div className="w-full text-emerald-700 font-bold">
              {proposalValue}
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
              <CommentThread comments={threadComments} viewerPartyId={activePartyId} />
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
              color={quote.status === 'SUBMITTED' ? 'blue' : quote.status === 'DRAFT' ? 'orange' : quote.status === 'ACCEPTED' ? 'green' : quote.status === 'REJECTED' ? 'red' : 'default'}
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
          {quote.status === 'ACCEPTED' && (
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
                  <AntTag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                    {group.attributes.length} attributes
                  </AntTag>
                </div>
                <div className="p-3">
                  <Table
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
              icon={<UndoOutlined />}
              onClick={() => handleDecision('REVISION_REQUIRED')}
              loading={processing}
              className="border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
            >
              Request Revision
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleDecision('REJECTED')}
              loading={processing}
            >
              Reject Proposal
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleDecision('ACCEPTED')}
              loading={processing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Accept Proposal
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
