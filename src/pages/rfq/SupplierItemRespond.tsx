import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Input, InputNumber, Button, Select, Tag, Table, Descriptions, App as AntApp, Alert } from 'antd';
import { SendOutlined, ArrowLeftOutlined, SaveOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { rfqDb, type ItemAttributeValue } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const CommentThread: React.FC<{
  comments: any[];
  parties: any[];
  viewerPartyId: string;
}> = ({ comments, parties, viewerPartyId }) => {
  if (comments.length === 0) return null;

  return (
    <div className="mt-1 space-y-1 text-left">
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

export const SupplierItemRespond: React.FC = () => {
  const { rfqId, itemId } = useParams<{ rfqId: string; itemId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/supplier/rfqs' : '/user/supplier/rfqs';
  const { message: antMessage } = AntApp.useApp();

  const [submitting, setSubmitting] = useState(false);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);

  // Sourcing selections
  const [offeredBrands, setOfferedBrands] = useState<string[]>([]);
  const [offeredManufacturers, setOfferedManufacturers] = useState<string[]>([]);

  // Custom specifications offered values (key: group_id_attribute_id, value: array of values)
  const [offeredAttrValues, setOfferedAttrValues] = useState<Record<string, ItemAttributeValue[]>>({});
  // Per-attribute supplier comments (key: group_id_attribute_id, value: comment string)
  const [offeredComments, setOfferedComments] = useState<Record<string, string>>({});

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
  const categories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const catalogBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const catalogManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const catalogAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const catalogAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const catalogProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];

  const itemAttributes = useLiveQuery(
    () => (itemId ? rfqDb.rfq_item_attributes.where('rfq_item_id').equals(itemId).toArray() : []),
    [itemId]
  ) || [];

  const existingQuote = useLiveQuery(
    () => (itemId && activePartyId ? rfqDb.seller_quotes.where({ rfq_item_id: itemId, seller_party_id: activePartyId }).first() : undefined),
    [itemId, activePartyId]
  );

  const existingQuoteAttributes = useLiveQuery(
    () => (existingQuote ? rfqDb.seller_quote_attributes.where('seller_quote_id').equals(existingQuote.id).toArray() : []),
    [existingQuote]
  ) || [];

  const existingQuoteComments = useLiveQuery(
    () => (existingQuote ? rfqDb.seller_quote_comments.where('seller_quote_id').equals(existingQuote.id).toArray() : []),
    [existingQuote]
  ) || [];

  const award = useLiveQuery(
    async () => {
      if (!itemId || !activePartyId) return undefined;
      const awds = await rfqDb.rfq_awards.where('rfq_item_id').equals(itemId).toArray();
      return awds.find((a) => a.seller_party_id === activePartyId);
    },
    [itemId, activePartyId]
  );

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>Sourcing Inbox</a> },
    { title: <span className="text-slate-800 font-semibold">{rfq?.rfq_number || 'RFQ'} - Sourcing Offer</span> }
  ], [basePath, rfq?.rfq_number, navigate]);

  useBreadcrumb(breadcrumbs);

  // Auto-generate or load the quote number
  const quoteNumber = React.useMemo(() => {
    return existingQuote?.seller_quote_number || `SQ-${itemId?.replace('item-', '') || 'NEW'}-${activePartyId?.replace('pty-', '') || 'UNK'}`;
  }, [existingQuote, itemId, activePartyId]);

  React.useEffect(() => {
    if (existingQuote) {
      if (existingQuote.status === 'DRAFT' && existingQuote.draft_snapshot) {
        try {
          const snapshot = JSON.parse(existingQuote.draft_snapshot);
          if (snapshot.unitPrice !== undefined) setUnitPrice(snapshot.unitPrice);
          if (snapshot.offeredBrands) setOfferedBrands(snapshot.offeredBrands);
          if (snapshot.offeredManufacturers) setOfferedManufacturers(snapshot.offeredManufacturers);
          if (snapshot.offeredAttrValues) setOfferedAttrValues(snapshot.offeredAttrValues);
          if (snapshot.offeredComments) setOfferedComments(snapshot.offeredComments);
        } catch (e) {
          console.error("Error parsing draft snapshot:", e);
        }
      } else {
        setUnitPrice(existingQuote.unit_price);
        setOfferedBrands(existingQuote.brand_id || []);
        setOfferedManufacturers(existingQuote.manufacturer_id || []);
      }
    }
  }, [existingQuote]);

  React.useEffect(() => {
    if (existingQuote && existingQuote.status !== 'DRAFT' && existingQuoteAttributes.length > 0) {
      const initialAttrs: Record<string, ItemAttributeValue[]> = {};
      existingQuoteAttributes.forEach((qa) => {
        const key = `${qa.group_id}_${qa.attribute_id}`;
        initialAttrs[key] = qa.offered_values || [];
      });
      setOfferedAttrValues(initialAttrs);
    }
  }, [existingQuoteAttributes, existingQuote]);

  const buyerComments = React.useMemo(() => {
    const map: Record<string, string> = {};
    existingQuoteComments
      .filter((qc) => qc.actor_type === 'BUYER')
      .forEach((qc) => {
        const key = qc.group_id === 'SYSTEM'
          ? `SYSTEM_${qc.attribute_id}`
          : `${qc.group_id}_${qc.attribute_id}`;
        map[key] = qc.comment || '';
      });
    return map;
  }, [existingQuoteComments]);

  React.useEffect(() => {
    if (existingQuote && existingQuote.status !== 'DRAFT' && existingQuoteComments.length > 0) {
      const initialComments: Record<string, string> = {};
      existingQuoteComments
        .filter((qc) => qc.actor_type === 'SELLER')
        .forEach((qc) => {
          // group_id stored as 'SYSTEM' for SYSTEM attrs, group_id otherwise
          const key = qc.group_id === 'SYSTEM'
            ? `SYSTEM_${qc.attribute_id}`
            : `${qc.group_id}_${qc.attribute_id}`;
          initialComments[key] = qc.comment || '';
        });
      setOfferedComments(initialComments);
    }
  }, [existingQuoteComments, existingQuote]);

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

  // Normalize comment key: SYSTEM attrs use 'SYSTEM_<id>', custom use '<group_id>_<attr_id>'
  const getCommentKey = (attributeType: string | undefined, groupId: string, attributeId: string) =>
    attributeType === 'SYSTEM' ? `SYSTEM_${attributeId}` : `${groupId}_${attributeId}`;


  if (rfq === undefined || item === undefined || parties.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 font-sans animate-pulse">Loading Sourcing Workspace...</h2>
      </div>
    );
  }

  if (!rfq || !item || !item.seller_assignments?.some((a) => a.seller_party_id === activePartyId)) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">Sourcing response container not found or unauthorized</h2>
        <Button className="mt-4" onClick={() => navigate(basePath)}>
          Back to Sourcing Inbox
        </Button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === item.category_id)?.name || 'Unknown';

  // Mode: SUBMITTED, ACCEPTED, REJECTED → view-only (locked)
  // NEW, DRAFT, REVISION_REQUIRED → actionable (editable)
  const isViewOnly = ['SUBMITTED', 'ACCEPTED', 'REJECTED'].includes(existingQuote?.status ?? '');



  const handleSave = async (submitMode: 'DRAFT' | 'SUBMITTED') => {
    if (submitMode === 'SUBMITTED' && (!unitPrice || unitPrice <= 0)) {
      antMessage.error('Please enter a valid offered unit price.');
      return;
    }
    if (!quoteNumber.trim()) {
      antMessage.error('Please enter a quote reference/number.');
      return;
    }

    setSubmitting(true);
    try {
      const quoteId = existingQuote?.id || `q-${itemId}-${activePartyId}`;
      // For DRAFT mode: serialize everything to JSON and skip writing to seller_quote_attributes
      const draftSnapshot = submitMode === 'DRAFT' ? JSON.stringify({ unitPrice, offeredBrands, offeredManufacturers, offeredAttrValues, offeredComments }) : null;

      const quotePayload = {
        id: quoteId,
        rfq_item_id: itemId!,
        seller_party_id: activePartyId,
        seller_quote_number: quoteNumber.trim(),
        unit_price: unitPrice || 0,
        round: existingQuote ? existingQuote.round : 1,
        status: submitMode,
        brand_id: offeredBrands,
        manufacturer_id: offeredManufacturers,
        created_at: existingQuote ? existingQuote.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        draft_snapshot: draftSnapshot
      };

      // Put Seller Quote
      await rfqDb.seller_quotes.put(quotePayload);

      // For SUBMITTED mode: write individual attribute records to seller_quote_attributes
      if (submitMode === 'SUBMITTED') {
        const qaPromises = itemAttributes.map((ia) => {
          const key = `${ia.group_id}_${ia.attribute_id}`;
          let offered = offeredAttrValues[key] || [];
          if (ia.attribute_type === 'SYSTEM') {
            if (ia.attribute_id === 'brand') {
              offered = offeredBrands.map((id) => ({
                value_id: id,
                value_label: catalogBrands.find((b) => b.id === id)?.name || id
              }));
            } else if (ia.attribute_id === 'manufacturer') {
              offered = offeredManufacturers.map((id) => ({
                value_id: id,
                value_label: catalogManufacturers.find((m) => m.id === id)?.company_name || id
              }));
            } else if (ia.attribute_id === 'unit_price') {
              offered = [{
                value_id: 'price-offer',
                value_label: String(unitPrice || 0)
              }];
            }
          }
          const qaPayload = {
            id: `qa-${quoteId}-${ia.attribute_id}`,
            seller_quote_id: quoteId,
            group_id: ia.group_id,
            attribute_id: ia.attribute_id,
            offered_values: offered,
            attribute_type: ia.attribute_type
          };
          return rfqDb.seller_quote_attributes.put(qaPayload);
        });
        await Promise.all(qaPromises);

        // Write seller_quote_comments for each attribute that has a comment (SYSTEM + custom)
        const commentPromises = itemAttributes
          .filter((ia) => {
            const key = getCommentKey(ia.attribute_type, ia.group_id, ia.attribute_id);
            return !!offeredComments[key]?.trim();
          })
          .map((ia) => {
            const key = getCommentKey(ia.attribute_type, ia.group_id, ia.attribute_id);
            // Store group_id as 'SYSTEM' for SYSTEM attrs so the load effect can reconstruct the correct key
            const storedGroupId = ia.attribute_type === 'SYSTEM' ? 'SYSTEM' : ia.group_id;
            const round = existingQuote ? existingQuote.round : 1;
            const commentId = `qc-${quoteId}-${storedGroupId}-${ia.attribute_id}-r${round}`;
            return rfqDb.seller_quote_comments.put({
              id: commentId,
              seller_quote_id: quoteId,
              group_id: storedGroupId,
              attribute_id: ia.attribute_id,
              comment: offeredComments[key].trim(),
              actor_type: 'SELLER',
              actor_id: activePartyId,
              created_at: new Date().toISOString(),
              attribute_type: ia.attribute_type
            });
          });
        await Promise.all(commentPromises);
      }

      antMessage.success(submitMode === 'DRAFT' ? 'Draft saved successfully!' : 'Quotation proposal submitted successfully!');
      navigate(basePath);
    } catch (error: any) {
      console.error('Error saving proposal:', error);
      antMessage.error('Failed to save sourcing proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBrandNames = (ids: string[] | null | undefined): string => {
    if (!ids || ids.length === 0) return 'Any Brand';
    return ids.map((id) => catalogBrands.find((b) => b.id === id)?.name || id).join(', ');
  };

  const getManufacturerNames = (ids: string[] | null | undefined): string => {
    if (!ids || ids.length === 0) return 'Any Manufacturer';
    return ids.map((id) => catalogManufacturers.find((m) => m.id === id)?.company_name || id).join(', ');
  };
  // Build general preference rows
  const generalPreferencesData = [
    {
      key: 'brand',
      specification: 'Brand Preference',
      buyerAsked: getBrandNames(item.brand_id),
      renderOffers: () => (
        <Select
          mode="multiple"
          placeholder="Select proposed brands"
          className="w-full"
          value={offeredBrands}
          onChange={setOfferedBrands}
          options={catalogBrands.map((b) => ({ value: b.id, label: b.name }))}
        />
      ),
      renderViewOffers: () => (
        <span className="text-slate-700">
          {offeredBrands.length > 0 ? getBrandNames(offeredBrands) : <span className="text-slate-400 italic">Not specified</span>}
        </span>
      ),
      renderComment: () => {
        const key = 'SYSTEM_brand';
        return (
          <Input.TextArea
            rows={2}
            placeholder="Optional remark about brand offer..."
            value={offeredComments[key] || ''}
            onChange={(e) => setOfferedComments((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        );
      },
      renderViewComment: () => (
        <span className="text-slate-600 text-sm">{offeredComments['SYSTEM_brand'] || <span className="text-slate-300">—</span>}</span>
      )
    },
    {
      key: 'manufacturer',
      specification: 'Manufacturer Preference',
      buyerAsked: getManufacturerNames(item.manufacturer_id),
      renderOffers: () => (
        <Select
          mode="multiple"
          placeholder="Select proposed manufacturers"
          className="w-full"
          value={offeredManufacturers}
          onChange={setOfferedManufacturers}
          options={catalogManufacturers.map((m) => ({ value: m.id, label: m.company_name }))}
        />
      ),
      renderViewOffers: () => (
        <span className="text-slate-700">
          {offeredManufacturers.length > 0 ? getManufacturerNames(offeredManufacturers) : <span className="text-slate-400 italic">Not specified</span>}
        </span>
      ),
      renderComment: () => {
        const key = 'SYSTEM_manufacturer';
        return (
          <Input.TextArea
            rows={2}
            placeholder="Optional remark about manufacturer offer..."
            value={offeredComments[key] || ''}
            onChange={(e) => setOfferedComments((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        );
      },
      renderViewComment: () => (
        <span className="text-slate-600 text-sm">{offeredComments['SYSTEM_manufacturer'] || <span className="text-slate-300">—</span>}</span>
      )
    },
    {
      key: 'unit_price',
      specification: 'Offered Unit Price ($)',
      buyerAsked: item.target_unit_price ? `$${item.target_unit_price}` : 'N/A',
      renderOffers: () => (
        <InputNumber
          value={unitPrice}
          onChange={(val) => setUnitPrice(val)}
          min={0.01}
          precision={2}
          placeholder="e.g. 1050.00"
          className="w-full"
        />
      ),
      renderViewOffers: () => (
        <span className="font-bold text-emerald-600">
          {unitPrice ? `$${unitPrice.toFixed(2)}` : <span className="text-slate-400 italic">Not specified</span>}
        </span>
      ),
      renderComment: () => {
        const key = 'SYSTEM_unit_price';
        return (
          <Input.TextArea
            rows={2}
            placeholder="Optional remark about pricing..."
            value={offeredComments[key] || ''}
            onChange={(e) => setOfferedComments((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        );
      },
      renderViewComment: () => (
        <span className="text-slate-600 text-sm">{offeredComments['SYSTEM_unit_price'] || <span className="text-slate-300">—</span>}</span>
      )
    }
  ];

  const specAttrColumn = {
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
  };

  const buyerAskedColumn = {
    title: 'What Buyer Asked',
    dataIndex: 'buyerAsked',
    key: 'buyerAsked',
    width: 260,
    render: (text: string) => <span className="text-slate-600 font-medium">{text}</span>
  };

  // Actionable columns (interactive inputs)
  const editableColumns = [
    specAttrColumn,
    buyerAskedColumn,
    {
      title: 'Your Offer',
      key: 'supplierOffer',
      width: 260,
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-1">
          {record.renderOffers()}
        </div>
      )
    },
    {
      title: 'Supplier Comment & History',
      key: 'supplierComment',
      render: (_: any, record: any) => {
        const key = record.commentKey || (record.key === 'brand' ? 'SYSTEM_brand' : record.key === 'manufacturer' ? 'SYSTEM_manufacturer' : record.key === 'unit_price' ? 'SYSTEM_unit_price' : '');
        const normGroupId = key.startsWith('SYSTEM_') ? 'SYSTEM' : key.split('_')[0];
        const attrId = key.startsWith('SYSTEM_') ? key.replace('SYSTEM_', '') : key.split('_')[1];

        const threadComments = existingQuoteComments
          .filter((c) => c.group_id === normGroupId && c.attribute_id === attrId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return (
          <div className="space-y-2">
            {record.renderComment ? record.renderComment() : null}
            <CommentThread comments={threadComments} parties={parties} viewerPartyId={activePartyId} />
          </div>
        );
      }
    }
  ];

  // Read-only columns (static display)
  const readOnlyColumns = [
    specAttrColumn,
    buyerAskedColumn,
    {
      title: 'Offered',
      key: 'supplierOffer',
      width: 260,
      render: (_: any, record: any) => record.renderViewOffers ? record.renderViewOffers() : record.renderOffers()
    },
    {
      title: 'Comments Thread',
      key: 'supplierComment',
      render: (_: any, record: any) => {
        const key = record.commentKey || (record.key === 'brand' ? 'SYSTEM_brand' : record.key === 'manufacturer' ? 'SYSTEM_manufacturer' : record.key === 'unit_price' ? 'SYSTEM_unit_price' : '');
        const normGroupId = key.startsWith('SYSTEM_') ? 'SYSTEM' : key.split('_')[0];
        const attrId = key.startsWith('SYSTEM_') ? key.replace('SYSTEM_', '') : key.split('_')[1];

        const threadComments = existingQuoteComments
          .filter((c) => c.group_id === normGroupId && c.attribute_id === attrId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return <CommentThread comments={threadComments} parties={parties} viewerPartyId={activePartyId} />;
      }
    }
  ];

  const activeColumns = isViewOnly ? readOnlyColumns : editableColumns;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <Card
        className="shadow-md border-slate-200"
        title={
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-tight">Configure Sourcing Proposal</span>
              <span className="text-xs text-slate-500 font-normal">{rfq.rfq_number} &bull; From: {rfq.requester_name || 'N/A'} </span>
            </div>
          </div>
        }
      >

        {/* Proposal Status Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 mb-5 flex flex-wrap gap-6 items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Quote Reference</span>
            <Tag color="purple" className="font-mono font-bold text-sm mt-0.5">{quoteNumber}</Tag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Status</span>
            <Tag
              color={!existingQuote ? 'default' : existingQuote.status === 'SUBMITTED' ? 'blue' : existingQuote.status === 'DRAFT' ? 'orange' : existingQuote.status === 'ACCEPTED' ? 'green' : existingQuote.status === 'REJECTED' ? 'red' : 'default'}
              className="mt-0.5 font-bold"
            >
              {existingQuote?.status || 'NEW'}
            </Tag>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Round</span>
            <div className="flex items-center gap-1 mt-0.5">
              <ReloadOutlined className="text-blue-500 text-xs" />
              <span className="font-bold text-slate-800 text-sm">Round {existingQuote?.round ?? 1}</span>
            </div>
          </div>
          {existingQuote?.created_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Created</span>
              <span className="text-xs text-slate-600 mt-0.5">{new Date(existingQuote.created_at).toLocaleString()}</span>
            </div>
          )}
          {existingQuote?.updated_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Last Updated</span>
              <span className="text-xs text-slate-600 mt-0.5">{new Date(existingQuote.updated_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Requested Item Details */}
        <Descriptions title="Requested Item Details" bordered size="small" column={2} className="mb-6">
          <Descriptions.Item label="Product / Service" span={2}>
            <strong className="text-slate-800">{item.product_name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Catalog Product">
            {item.catalog_product_id
              ? catalogProducts.find((p) => p.id === item.catalog_product_id)?.name || item.catalog_product_id
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Category">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <Tag color="blue" className="font-bold">{item.quantity} {item.unit}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Target Unit Price">
            {item.target_unit_price ? <span className="text-emerald-600 font-bold">${item.target_unit_price}</span> : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Item Source">
            <Tag>{item.item_source || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Number">
            <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span>
          </Descriptions.Item>
        </Descriptions>

        <div className="space-y-6">

          {/* Status Notice Banners */}
          {existingQuote?.status === 'REVISION_REQUIRED' && (
            <Alert
              type="warning"
              showIcon
              message="Revision Requested"
              description="The buyer has reviewed your quote and requested changes. Please update your proposal and re-submit."
              className="rounded-xl"
            />
          )}
          {existingQuote?.status === 'SUBMITTED' && (
            <Alert
              type="info"
              showIcon
              message="Quote Under Review"
              description="Your quote has been submitted and is currently under buyer review. No further edits are allowed."
              className="rounded-xl"
            />
          )}
          {existingQuote?.status === 'ACCEPTED' && (
            <Alert
              type="success"
              showIcon
              message="Quote Accepted"
              description="Congratulations! Your quote has been accepted by the buyer. Await further instructions."
              className="rounded-xl"
            />
          )}
          {existingQuote?.status === 'REJECTED' && (
            <Alert
              type="error"
              showIcon
              message="Quote Rejected"
              description="This quote has been rejected by the buyer. No further action is available for this submission."
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
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-blue-600"
                >
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
                columns={activeColumns}
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
              const valueOptions = catalogAttributeValues
                .filter((val) => val.attributeId === ia.attribute_id)
                .map((val) => ({ value: val.id, label: val.label }));
              const key = `${ia.group_id}_${ia.attribute_id}`;
              const currentValIds = (offeredAttrValues[key] || []).map((v) => v.value_id);

              return {
                key: ia.id,
                commentKey: key,
                specification: attrName,
                description: ia.description || null,
                buyerAsked: requestedVals,
                renderOffers: () => (
                  <Select
                    mode="multiple"
                    placeholder={`Select proposed ${attrName}`}
                    className="w-full"
                    value={currentValIds}
                    onChange={(selectedIds: string[]) => {
                      const updatedVals: ItemAttributeValue[] = selectedIds.map((id) => {
                        const foundVal = catalogAttributeValues.find((cav) => cav.id === id);
                        return {
                          value_id: id,
                          value_label: foundVal?.label || id
                        };
                      });
                      setOfferedAttrValues((prev) => ({
                        ...prev,
                        [key]: updatedVals
                      }));
                    }}
                    options={valueOptions}
                  />
                ),
                renderViewOffers: () => (
                  <span className="text-slate-700">
                    {(offeredAttrValues[key] || []).length > 0
                      ? (offeredAttrValues[key] || []).map((v) => v.value_label).join(', ')
                      : <span className="text-slate-400 italic">Not specified</span>}
                  </span>
                ),
                renderComment: () => (
                  <Input.TextArea
                    rows={2}
                    placeholder={`Optional remark about ${attrName}...`}
                    value={offeredComments[key] || ''}
                    onChange={(e) => setOfferedComments((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                ),
                renderViewComment: () => (
                  <span className="text-slate-600 text-sm">{offeredComments[key] || <span className="text-slate-300">—</span>}</span>
                )
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
                    columns={activeColumns}
                    pagination={false}
                    size="small"
                    bordered
                  />
                </div>
              </div>
            );
          })}
        </div>



        {!isViewOnly && (
          <div className="pt-6 flex justify-end gap-3 mt-6">
            <>
              <Button onClick={() => navigate(basePath)}>Cancel</Button>
              <Button
                icon={<SaveOutlined />}
                onClick={() => handleSave('DRAFT')}
                loading={submitting}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSave('SUBMITTED')}
                loading={submitting}
                className="bg-blue-600"
              >
                Submit Proposal
              </Button>
            </>
          </div>
        )}
      </Card>
    </div>
  );
};
