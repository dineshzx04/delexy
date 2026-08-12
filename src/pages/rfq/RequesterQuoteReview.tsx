import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Button, Tag, Table, Descriptions, App as AntApp, Alert, Input } from 'antd';
import { CheckOutlined, CloseOutlined, UndoOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RfqItemStatusBadge } from '../../components/rfq/RfqStatusBadge';

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
  const catalogBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const catalogManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const catalogProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];

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

  // Load existing buyer comments if any
  React.useEffect(() => {
    if (existingComments.length > 0) {
      const initialComments: Record<string, string> = {};
      existingComments
        .filter((c) => c.actor_type === 'BUYER')
        .forEach((c) => {
          const key = c.group_id === 'SYSTEM' ? `SYSTEM_${c.attribute_id}` : `${c.group_id}_${c.attribute_id}`;
          initialComments[key] = c.comment || '';
        });
      setBuyerComments(initialComments);
    }
  }, [existingComments]);



  // Normalize comment key: SYSTEM attrs use 'SYSTEM_<id>', custom use '<group_id>_<attr_id>'
  const getCommentKey = (attributeType: string | undefined, groupId: string, attributeId: string) =>
    attributeType === 'SYSTEM' ? `SYSTEM_${attributeId}` : `${groupId}_${attributeId}`;

  const getBrandNames = (ids: string[] | null | undefined): string => {
    if (!ids || ids.length === 0) return 'Any Brand';
    return ids.map((id) => catalogBrands.find((b) => b.id === id)?.name || id).join(', ');
  };

  const getManufacturerNames = (ids: string[] | null | undefined): string => {
    if (!ids || ids.length === 0) return 'Any Manufacturer';
    return ids.map((id) => catalogManufacturers.find((m) => m.id === id)?.company_name || id).join(', ');
  };

  const getSupplierCommentText = (groupId: string, attributeId: string) => {
    const normGroupId = groupId === 'system-preferences' ? 'SYSTEM' : groupId;
    const found = existingComments.find(
      (c) => c.actor_type === 'SELLER' && c.group_id === normGroupId && c.attribute_id === attributeId
    );
    return found?.comment || '';
  };

  // Decision trigger
  const handleDecision = async (statusDecision: 'ACCEPTED' | 'REJECTED' | 'REVISION_REQUIRED') => {
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
          const isSystem = key.startsWith('SYSTEM_');
          const attributeId = isSystem ? key.replace('SYSTEM_', '') : key.split('_')[1];
          const groupId = isSystem ? 'SYSTEM' : key.split('_')[0];

          return rfqDb.seller_quote_comments.put({
            id: `qc-buyer-${quote.id}-${groupId}-${attributeId}-${Date.now()}`,
            seller_quote_id: quote.id,
            group_id: groupId,
            attribute_id: attributeId,
            comment: commentVal.trim(),
            actor_type: 'BUYER',
            actor_id: rfq.requester_id,
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
    const map: Record<string, { name: string; items: typeof itemAttributes }> = {};
    const customAttributes = itemAttributes.filter((ia) => ia.attribute_type !== 'SYSTEM');
    customAttributes.forEach((ia) => {
      const groupId = ia.group_id || 'ungrouped';
      if (!map[groupId]) {
        const groupName = attributeGroups.find((g) => g.id === groupId)?.name || 'General Specifications';
        map[groupId] = { name: groupName, items: [] };
      }
      map[groupId].items.push(ia);
    });
    return Object.entries(map);
  }, [itemAttributes, attributeGroups]);

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

  // Build General preferences comparison rows
  const generalPreferencesData = [
    {
      key: 'brand',
      specification: 'Brand Preference',
      buyerAsked: getBrandNames(item.brand_id),
      offered: getBrandNames(quote.brand_id),
      supplierComment: getSupplierCommentText('system-preferences', 'brand'),
      commentKey: 'SYSTEM_brand'
    },
    {
      key: 'manufacturer',
      specification: 'Manufacturer Preference',
      buyerAsked: getManufacturerNames(item.manufacturer_id),
      offered: getManufacturerNames(quote.manufacturer_id),
      supplierComment: getSupplierCommentText('system-preferences', 'manufacturer'),
      commentKey: 'SYSTEM_manufacturer'
    },
    {
      key: 'unit_price',
      specification: 'Target Unit Price / Price Offer ($)',
      buyerAsked: item.target_unit_price ? `$${item.target_unit_price}` : 'N/A',
      offered: `$${quote.unit_price.toFixed(2)}`,
      supplierComment: getSupplierCommentText('system-preferences', 'unit_price'),
      commentKey: 'SYSTEM_unit_price'
    }
  ];

  const columns = [
    {
      title: 'Specification / Attribute',
      dataIndex: 'specification',
      key: 'specification',
      width: 200,
      render: (text: string, record: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 leading-tight">{text}</span>
          {record.description && (
            <span className="text-xs text-slate-400 leading-tight italic">{record.description}</span>
          )}
        </div>
      )
    },
    {
      title: 'Requested By You',
      dataIndex: 'buyerAsked',
      key: 'buyerAsked',
      width: 220,
      render: (text: string) => <span className="text-slate-600 font-medium">{text}</span>
    },
    {
      title: 'Supplier Offer',
      dataIndex: 'offered',
      key: 'offered',
      width: 220,
      render: (text: string, record: any) => {
        // Find if there is a deviation/mismatch
        const cleanAsked = String(record.buyerAsked || '').trim().toLowerCase();
        const cleanOffered = String(record.offered || '').trim().toLowerCase();
        const isAnyPreference = cleanAsked === 'any brand' || cleanAsked === 'any manufacturer' || cleanAsked === 'n/a';

        const hasDeviation = !isAnyPreference && cleanAsked !== cleanOffered;

        return (
          <div className="flex flex-col gap-1">
            <span className="text-emerald-700 font-bold">{text}</span>
            {hasDeviation && (
              <Tag color="warning" className="w-fit text-[10px] font-bold py-0 px-1 border-amber-300 text-amber-700 bg-amber-50">
                DEVIATION
              </Tag>
            )}
          </div>
        );
      }
    },
    {
      title: 'Supplier Remark',
      dataIndex: 'supplierComment',
      key: 'supplierComment',
      width: 240,
      render: (text: string) => <span className="text-slate-500 italic text-sm">{text || '—'}</span>
    },
    {
      title: 'Your Feedback / Comment',
      key: 'buyerFeedback',
      render: (_: any, record: any) => (
        <Input.TextArea
          rows={2}
          placeholder="Leave feedback on this specification..."
          value={buyerComments[record.commentKey] || ''}
          onChange={(e) => setBuyerComments((prev) => ({ ...prev, [record.commentKey]: e.target.value }))}
          disabled={quote.status !== 'SUBMITTED'}
        />
      )
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
            <Tag color="purple" className="font-mono font-bold text-sm mt-0.5">{quote.seller_quote_number}</Tag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Quote Status</span>
            <Tag
              color={quote.status === 'SUBMITTED' ? 'blue' : quote.status === 'DRAFT' ? 'orange' : quote.status === 'ACCEPTED' ? 'green' : quote.status === 'REJECTED' ? 'red' : 'default'}
              className="mt-0.5 font-bold"
            >
              {quote.status}
            </Tag>
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
            <strong className="text-slate-800">{item.product_name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Category">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <Tag color="blue" className="font-bold">{item.quantity} {item.unit}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Target Unit Price">
            {item.target_unit_price ? <span className="text-emerald-600 font-bold">${item.target_unit_price}</span> : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Supplier Proposed Price">
            <span className="text-emerald-700 font-bold">${quote.unit_price.toFixed(2)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Catalog Product">
            {item.catalog_product_id
              ? catalogProducts.find((p) => p.id === item.catalog_product_id)?.name || item.catalog_product_id
              : 'N/A'}
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

          <h3 className="text-base font-bold text-slate-900 pt-3">Side-by-Side Sourcing Configuration</h3>

          {/* 1. General Sourcing Preferences Card */}
          <div
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            style={{ borderLeft: `4px solid #2563eb` }}
          >
            <div
              className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
              style={{ backgroundColor: `#2563eb14` }}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-blue-600">
                  1
                </span>
                <h4 className="text-md font-bold text-slate-800">General Sourcing Preferences</h4>
              </div>
              <Tag color="default" style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}>
                {generalPreferencesData.length} attributes
              </Tag>
            </div>
            <div className="p-3">
              <Table
                dataSource={generalPreferencesData}
                columns={columns}
                pagination={false}
                size="small"
                bordered
              />
            </div>
          </div>

          {/* 2. Custom Specifications (Groups) */}
          {attributeGroupsMap.map(([groupId, group], idx) => {
            const groupRows = group.items.map((ia) => {
              const attrName = catalogAttributes.find((a) => a.id === ia.attribute_id)?.name || ia.attribute_id;
              const requestedVals = (ia.values || []).map((v) => v.value_label).join(', ') || 'N/A';

              // Resolve what supplier offered
              const key = `${ia.group_id}_${ia.attribute_id}`;
              const foundAttr = quoteAttributes.find((qa) => qa.group_id === ia.group_id && qa.attribute_id === ia.attribute_id);
              const supplierOffered = (foundAttr?.offered_values || []).map((v) => v.value_label).join(', ') || '—';

              return {
                key: ia.id,
                specification: attrName,
                description: ia.description || null,
                buyerAsked: requestedVals,
                offered: supplierOffered,
                supplierComment: getSupplierCommentText(ia.group_id, ia.attribute_id),
                commentKey: key
              };
            });

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
                      {idx + 2}
                    </span>
                    <h4 className="text-md font-bold text-slate-800">{group.name}</h4>
                  </div>
                  <Tag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                    {groupRows.length} attributes
                  </Tag>
                </div>
                <div className="p-3">
                  <Table
                    dataSource={groupRows}
                    columns={columns}
                    pagination={false}
                    size="small"
                    bordered
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
