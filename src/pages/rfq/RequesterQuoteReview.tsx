import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Button, Tag as AntTag, Table, Descriptions, App as AntApp, Alert, Input, Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined, UndoOutlined, ReloadOutlined, CheckCircleOutlined as AntIconCheckCircleOutlined } from '@ant-design/icons';
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
  const [acceptedVariants, setAcceptedVariants] = useState<Record<string, boolean>>({});

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
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []);
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []);

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

  const quoteVariants = useLiveQuery(
    async () => {
      if (!quoteId) return [];
      return await rfqDb.seller_quote_variants.where('seller_quote_id').equals(quoteId).toArray();
    },
    [quoteId]
  );

  const isLoading =
    rfq === undefined ||
    item === undefined ||
    quote === undefined ||
    quoteAttributes === undefined ||
    quoteVariants === undefined ||
    existingComments === undefined ||
    parties === undefined ||
    categories === undefined ||
    catalogProducts === undefined ||
    catalogAttributes === undefined ||
    attributeGroups === undefined ||
    sellerProduct === undefined ||
    allVariants === undefined ||
    itemAttributes === undefined ||
    allManufacturers === undefined ||
    allBrands === undefined;

  const allAccepted = React.useMemo(() => {
    if (!quoteAttributes || quoteAttributes.length === 0) return false;
    const attrsAccepted = quoteAttributes.every((attr) => acceptedAttributes[attr.id] === true);
    const variantsAccepted = !quoteVariants || quoteVariants.length === 0 || quoteVariants.every((v) => acceptedVariants[v.id] === true);
    return attrsAccepted && variantsAccepted;
  }, [quoteAttributes, acceptedAttributes, quoteVariants, acceptedVariants]);

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}`)}>{rfq?.rfq_number || 'RFQ'}</a> },
    { title: <a onClick={() => navigate(`${basePath}/${rfqId}/items/${itemId}`)}>Item Review</a> },
    { title: <span className="text-slate-800 font-semibold">Quote Review</span> }
  ], [navigate, basePath, rfqId, itemId, rfq?.rfq_number]);
  useBreadcrumb(breadcrumbs);

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

  React.useEffect(() => {
    if (quoteVariants && quoteVariants.length > 0) {
      const initialAccepted: Record<string, boolean> = {};
      quoteVariants.forEach((v) => {
        initialAccepted[v.id] = !!v.buyer_accepted;
      });
      setAcceptedVariants(initialAccepted);
    }
  }, [quoteVariants]);


  const attributeGroupsMap = React.useMemo(() => {
    if (!quoteAttributes) return [];
    const map: Record<string, { name: string; attributes: any[] }> = {};

    quoteAttributes.forEach(qa => {
      if (qa.attribute_type === 'SYSTEM' && qa.attribute_id !== 'mfg_brand_mapping') {
        return;
      }

      const groupId = qa.group_id;
      const isVariant = qa.attribute_id.startsWith('var-') || (qa as any).is_variant || false;

      if (!map[groupId]) {
        let groupName = "";
        if (groupId === 'system') {
          groupName = 'System Specifications';
        } else {
          groupName = attributeGroups?.find(g => g.id === groupId)?.name ||
            (isVariant ? 'Variant Specifications' : 'General Specifications');
        }
        map[groupId] = { name: groupName, attributes: [] };
      }

      let attrName = "";
      if (qa.attribute_id === 'mfg_brand_mapping') attrName = 'Manufacturer & Brand Mappings';
      else {
        attrName = catalogAttributes?.find(a => a.id === qa.attribute_id)?.name || qa.attribute_id;
      }

      // Determine what the buyer requested for comparison
      const ia = itemAttributes?.find((a: any) => a.group_id === qa.group_id && a.attribute_id === qa.attribute_id);
      const reqJoiner = ia?.connector === "AND" ? " , " : ia?.connector === "OR" ? " | " : ", ";
      const reqViewValue = (qa.req_value || []).map(v => v.value_label).join(reqJoiner) || 'N/A';

      // Determine what the supplier proposed for comparison
      const propJoiner = (qa as any).connector === "AND" ? " , " : (qa as any).connector === "OR" ? " | " : ", ";
      const proposalViewValue = (qa.values || []).map(v => v.value_label).join(propJoiner) || '—';

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
        const order = ['mfg_brand_mapping', 'manufacturer', 'brand', 'req_quantity'];
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
      await rfqDb.transaction('rw', [rfqDb.seller_quote_attributes, rfqDb.seller_quote_variants], async () => {
        for (const [attrId, accepted] of Object.entries(acceptedAttributes)) {
          await rfqDb.seller_quote_attributes.update(attrId, { buyer_accepted: accepted });
        }
        for (const [variantId, accepted] of Object.entries(acceptedVariants)) {
          await rfqDb.seller_quote_variants.update(variantId, { buyer_accepted: accepted });
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

  const handleToggleVariantAcceptance = (variants: any[], accept: boolean) => {
    setAcceptedVariants((prev) => {
      const updated = { ...prev };
      variants.forEach((v) => {
        updated[v.id] = accept;
      });
      return updated;
    });
  };

  const attributesColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      className: "w-[50px] max-w-[50px] align-top",
      render: (_: string, __: any, index: number) => <span className='pl-1.5'>{index + 1}</span>
    },
    {
      title: 'Attribute',
      dataIndex: 'attributeName',
      key: 'attributeName',
      className: "min-w-50 align-top",
      render: (text: string, record: any) => (
        <div className="flex flex-col gap-1.5 py-0.5">
          <div className="flex flex-col gap-0.5">
            <div className="font-semibold text-slate-800 leading-tight">{text}</div>
            {record.description && (
              <div className="text-[11px] text-slate-500 leading-tight italic">{record.description}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            {(record.is_variant || record.isVariant) && (
              <AntTag className="inline-flex items-center m-0 leading-tight bg-blue-50 min-h-5 text-blue-600 border-blue-200" icon={<AntIconCheckCircleOutlined />}>
                Variant
              </AntTag>
            )}
            {record.is_deviation && (
              <AntTag className="inline-flex items-center m-0 leading-tight min-h-5 bg-amber-50 text-amber-700 border-amber-200">
                Deviation
              </AntTag>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Requested Value',
      dataIndex: 'reqViewValue',
      key: 'reqViewValue',
      className: "w-90 max-w-90 align-top",
      render: (_: string, attribute: any) => {
        const forceORDisabled = attribute.attribute_id === 'mfg_brand_mapping';
        const ia = itemAttributes?.find((a: any) => a.group_id === attribute.group_id && a.attribute_id === attribute.attribute_id);
        const reqConnector = forceORDisabled ? "OR" : (ia?.connector || 'AND');
        const reqJoiner = reqConnector === "OR" ? " | " : " , ";

        if (attribute.attribute_id === 'mfg_brand_mapping') {
          const reqValues = attribute.req_value || [];
          if (reqValues.length === 0) {
            return <span className="text-slate-400 italic">No manufacturer-brand mapping</span>;
          }
          return (
            <div className="space-y-1.5">
              {reqValues.map((v: any, index: number) => {
                const parts = (v.value_id || '').split(':');
                const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                const brand = (allBrands || []).find((b: any) => b.id === brandId);
                const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Manufacturer');
                const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                return (
                  <div key={v.value_id || index} className="flex flex-wrap items-center gap-1 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs">
                    <AntTag color="purple" className="m-0 text-[11px]">Mfg: {mfgName}</AntTag>
                    <span className="text-slate-400 font-bold">×</span>
                    <AntTag color="blue" className="m-0 text-[11px]">Brand: {brandName}</AntTag>
                  </div>
                );
              })}
            </div>
          );
        }

        const reqValues = attribute.req_value || [];
        if (reqValues.length === 0) {
          return <span className="text-slate-400 italic">N/A</span>;
        }

        return (
          <div className="flex flex-wrap items-center">
            {reqValues.map((v: any, index: number) => {
              const isLast = index === reqValues.length - 1;
              return (
                <div key={v.value_id} className='flex items-center'>
                  <AntTag className="inline-flex items-center m-0 min-h-6 leading-tight bg-slate-50 text-slate-600 border-slate-200">
                    {v.value_label}
                  </AntTag>
                  {!isLast && (
                    <span className="mx-1 text-slate-500 font-bold text-[13px] select-none">
                      {reqJoiner}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    },
    {
      title: 'Proposal Value & Feedback',
      dataIndex: 'proposalViewValue',
      key: 'proposalValue',
      className: "w-90 max-w-90 align-top",
      render: (_: string, attribute: any) => {
        const threadComments = existingComments
          .filter((c) => c.group_id === attribute.group_id && c.attribute_id === attribute.attribute_id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const forceORDisabled = attribute.attribute_id === 'mfg_brand_mapping';
        const connector = forceORDisabled ? "OR" : (attribute.connector || 'AND');
        const propJoiner = connector === "OR" ? " | " : " , ";

        let proposalContent: React.ReactNode;
        if (attribute.attribute_id === 'mfg_brand_mapping') {
          const valuesArray = attribute.values || [];
          if (valuesArray.length === 0) {
            proposalContent = <span className="text-slate-400 italic">No manufacturer-brand mapping offered</span>;
          } else {
            proposalContent = (
              <div className="space-y-1.5">
                {valuesArray.map((v: any, index: number) => {
                  const parts = (v.value_id || '').split(':');
                  const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                  const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                  const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                  const brand = (allBrands || []).find((b: any) => b.id === brandId);
                  const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Manufacturer');
                  const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                  return (
                    <div key={v.value_id || index} className="flex flex-wrap items-center gap-1 bg-slate-50/50 border border-slate-200/70 rounded p-1.5 text-xs">
                      <AntTag color="purple" className="m-0 text-[11px]">Mfg: {mfgName}</AntTag>
                      <span className="text-slate-400 font-bold">×</span>
                      <AntTag color="blue" className="m-0 text-[11px]">Brand: {brandName}</AntTag>
                    </div>
                  );
                })}
              </div>
            );
          }
        } else {
          const valuesArray = attribute.values || [];
          if (valuesArray.length === 0) {
            proposalContent = <span className="text-slate-400 italic">—</span>;
          } else {
            proposalContent = (
              <div className="flex flex-wrap items-center gap-y-1">
                {valuesArray.map((v: any, index: number) => {
                  const isLast = index === valuesArray.length - 1;
                  return (
                    <div key={v.value_id} className='flex items-center'>
                      <AntTag className="inline-flex items-center m-0 min-h-6 leading-tight bg-slate-50 text-slate-700 border-slate-200">
                        {v.value_label}
                      </AntTag>
                      {!isLast && (
                        <span className="mx-1 text-emerald-600 font-bold text-[13px] select-none">
                          {propJoiner}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
        }

        return (
          <div className="flex gap-2 flex-col">
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {proposalContent}
              </div>
              {attribute.is_deviation && attribute.deviation_note && (
                <div className="text-[12px] bg-amber-50/50 text-amber-800 border border-amber-100/70 rounded px-2.5 py-1 leading-normal italic mt-0.5">
                  <span className="font-bold not-italic mr-1 text-[10px] uppercase tracking-wider text-amber-700">[Seller Reason]:</span>
                  {attribute.deviation_note}
                </div>
              )}
            </div>
            <div className="flex flex-col w-full">
              {quote.status === 'SUBMITTED' && (
                <Input.TextArea
                  rows={2}
                  className="mb-1 text-[13px]"
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
      },
    },
    {
      title: 'Accept',
      dataIndex: 'buyer_accepted',
      key: 'buyer_accepted',
      className: "w-10 text-center align-top",
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
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Professional Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">Review Sourcing Quote Proposal</h1>
            <AntTag color="purple" className="font-mono font-bold text-xs m-0">{quote.seller_quote_number}</AntTag>
            <AntTag
              color={quote.status === 'SUBMITTED' ? 'blue' : quote.status === 'DRAFT' ? 'orange' : quote.status === 'DEVIATION_ACCEPTED' ? 'green' : quote.status === 'REJECTED' ? 'red' : 'default'}
              className="font-bold text-xs m-0"
            >
              {quote.status}
            </AntTag>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Supplier: <strong className="text-slate-700">{sellerParty?.display_name || quote.seller_party_id}</strong> &bull; RFQ: <span className="font-mono font-bold text-slate-700">{rfq?.rfq_number}</span>
          </p>
        </div>
      </div>

      <Card size="small" className="shadow-sm border-slate-200">
        {/* Request & Quote Details */}
        <Descriptions title="Request & Quote Details" bordered size="small" column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }} className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <Descriptions.Item label="Product / Service" span={3}>
            <strong className="text-slate-800 text-base">{sellerProduct?.product_name || 'Custom Specifications'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Quote Reference">
            <AntTag color="purple" className="font-mono font-bold m-0 text-[13px]">{quote.seller_quote_number}</AntTag>
          </Descriptions.Item>
          <Descriptions.Item label="Quote Status">
            <AntTag
              color={quote.status === 'SUBMITTED' ? 'blue' : quote.status === 'DRAFT' ? 'orange' : quote.status === 'DEVIATION_ACCEPTED' ? 'green' : quote.status === 'REJECTED' ? 'red' : 'default'}
              className="font-bold m-0"
            >
              {quote.status}
            </AntTag>
          </Descriptions.Item>
          <Descriptions.Item label="Round">
            <div className="flex items-center gap-1.5">
              <ReloadOutlined className="text-blue-500 text-[13px]" />
              <span className="font-bold text-slate-800 text-[13px]">Round {quote.round ?? 1}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Number">
            <span className="font-mono font-bold text-slate-700">{rfq.rfq_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            <span className="text-slate-700">{categoryName}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Requested Quantity">
            <AntTag color="blue" className="font-bold m-0">{item.req_quantity} {item.req_unit || 'pcs'}</AntTag>
          </Descriptions.Item>
          {item.catalog_product_id && (
            <Descriptions.Item label="Catalog Product">
              {catalogProducts.find((p) => p.id === item.catalog_product_id)?.name || item.catalog_product_id}
            </Descriptions.Item>
          )}
          {itemVariant?.sku && (
            <Descriptions.Item label="Variant">{itemVariant.sku}</Descriptions.Item>
          )}
          {quote.created_at && (
            <Descriptions.Item label="Submitted">
              <span className="text-slate-600 text-xs">{new Date(quote.created_at).toLocaleString()}</span>
            </Descriptions.Item>
          )}
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
            const accentColor = ['#527EA3', '#5D9365', '#C9825A', '#8975A8'][idx % 4];

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

        {quoteVariants && quoteVariants.length > 0 && (
          <div className="space-y-6 mt-8">
            <div>
              <h3 className="text-base font-bold text-slate-900">Offered Proposal Options & Prices</h3>
              <p className="text-xs text-slate-500">
                Review the specific proposal options offered by the supplier along with unit offer prices. Mark options for acceptance.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #527EA3` }}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#527EA314` }}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#527EA3' }}>
                    $
                  </span>
                  <h4 className="text-md font-bold text-slate-800">Offered Proposal Options & Unit Prices</h4>
                </div>
                <div className="flex items-center gap-2">
                  {quote?.status === 'SUBMITTED' && (
                    <div className="flex gap-1.5 mr-2">
                      <Button
                        size="small"
                        type="dashed"
                        onClick={() => handleToggleVariantAcceptance(quoteVariants, true)}
                        className="text-[11px] h-6 px-2 text-emerald-600 border-emerald-200 hover:text-emerald-700 hover:border-emerald-300"
                      >
                        Approve All
                      </Button>
                      <Button
                        size="small"
                        type="dashed"
                        onClick={() => handleToggleVariantAcceptance(quoteVariants, false)}
                        className="text-[11px] h-6 px-2 text-slate-500 border-slate-200 hover:text-slate-600 hover:border-slate-300"
                      >
                        Reject All
                      </Button>
                    </div>
                  )}
                  <AntTag color="default" style={{ borderColor: '#527EA3', color: '#527EA3', fontWeight: 700 }}>
                    {quoteVariants.length} {quoteVariants.length === 1 ? 'offered option' : 'offered options'}
                  </AntTag>
                </div>
              </div>
              <div className="p-3">
                <Table
                  dataSource={quoteVariants}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  size="small"
                  bordered
                  scroll={{ x: 768 }}
                  columns={[
                    {
                      title: 'S.No',
                      key: 'sno',
                      className: "w-[50px] max-w-[50px] align-top",
                      render: (_: string, __: any, index: number) => <span className='pl-1.5'>{index + 1}</span>
                    },
                    {
                      title: 'Offered Option Combinations & Specifications',
                      key: 'combinations',
                      className: "align-top",
                      render: (_: string, record: any) => {
                        if (!record.combinations || record.combinations.length === 0) {
                          return <span className="text-slate-500 italic">Default Option</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-2">
                            {record.combinations.map((c: any, i: number) => {
                              if (c.attribute_id === 'mfg_brand_mapping') {
                                const parts = (c.value_id || '').split(':');
                                const mfgId = parts[0] !== 'any' ? parts[0] : undefined;
                                const brandId = parts[1] !== 'any' ? parts[1] : undefined;
                                const mfg = (allManufacturers || []).find((m: any) => m.id === mfgId);
                                const brand = (allBrands || []).find((b: any) => b.id === brandId);
                                const mfgName = mfg?.company_name || (mfgId ? mfgId : 'Any Mfg');
                                const brandName = brand?.name || (brandId ? brandId : 'Any Brand');
                                return (
                                  <AntTag key={i} color="purple">
                                    Mfg: {mfgName} × Brand: {brandName}
                                  </AntTag>
                                );
                              }
                              return (
                                <AntTag key={i} color="blue">
                                  {c.value_label}
                                </AntTag>
                              );
                            })}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'Unit Offer Price',
                      dataIndex: 'offer_price',
                      key: 'offer_price',
                      className: "w-35 max-w-35 align-top",
                      render: (price: number) => (
                        <div className="text-end pr-2 font-bold text-emerald-600">${price}</div>
                      )
                    },
                    {
                      title: 'Accept Option',
                      dataIndex: 'buyer_accepted',
                      key: 'buyer_accepted',
                      className: "w-30 text-center align-top",
                      render: (_: boolean, record: any) => (
                        <Checkbox
                          checked={!!acceptedVariants[record.id]}
                          disabled={quote?.status !== 'SUBMITTED'}
                          onChange={(e) => {
                            setAcceptedVariants((prev) => ({
                              ...prev,
                              [record.id]: e.target.checked
                            }));
                          }}
                        />
                      )
                    }
                  ]}
                />
              </div>
            </div>
          </div>
        )}

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
