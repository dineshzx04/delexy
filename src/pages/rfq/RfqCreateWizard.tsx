import React, { useState, useMemo } from 'react';
import {
  Card,
  Steps,
  Input,
  Select,
  Button,
  Table,
  Tag,
  App as AntApp,
  Drawer,
  Popconfirm,
  Checkbox,
  Pagination,
  Modal,
  Descriptions,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FileTextOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  DeleteOutlined,
  GlobalOutlined,
  ToolOutlined,
  ShopOutlined,
  CheckOutlined,
  FilterOutlined,
  EyeOutlined,
  InboxOutlined,
  DisconnectOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { rfqDb, type Rfq, type RfqItem, type RfqItemDynamicAttribute, type RfqItemSource, type SellerQuote } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const RfqCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUser, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';
  const { message: antMessage } = AntApp.useApp();

  // Live queries from Dexie IndexedDB database stores
  const allParties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const allCategories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allMasterProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];
  const allSellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray(), []) || [];
  const allAttributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  console.log(allMasterProducts);

  // Active party resolution
  const activeParty = isBusinessContext
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || allParties[0]
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || allParties.find((p) => p.id === 'pty-6') || allParties[0];

  const activePartyId = activeParty?.id || 'pty-1';
  const activePartyName = activeParty?.display_name || 'Active Party';

  const [currentStep, setCurrentStep] = useState(0);
  const [activeDrawerIndex, setActiveDrawerIndex] = useState<number | null>(null);
  const [previewProduct, setPreviewProduct] = useState<{ sellerProduct: any; variant: any; drawerIndex: number } | null>(null);
  const [variantPage, setVariantPage] = useState<number>(1);
  const VARIANTS_PER_PAGE = 10;

  // Leaf categories from catalog (categories mapped to attribute groups)
  const leafCategories = useMemo(
    () => allCategories.filter((c) => c.mappedGroupIds && c.mappedGroupIds.length > 0),
    [allCategories]
  );

  // Step 1: Global RFQ Header Information - Starts Empty
  const [globalDetails, setGlobalDetails] = useState({
    title: '',
    description: '',
    currency: 'USD',
    submission_deadline: '',
    contact_email: '',
    contact_phone: '',
    shipping_destination: '',
  });

  // Step 2: Line Items - Starts Empty
  const [items, setItems] = useState<any[]>([]);

  // Helper to compute ALL master category dynamic attribute groups, attributes, and values for a category
  const getCategoryAttributeTree = (categoryId: string) => {
    if (!categoryId) return [];
    const category = allCategories.find((c) => c.id === categoryId);
    if (!category || !category.mappedGroupIds) return [];

    return category.mappedGroupIds
      .map((groupId) => {
        const group = allAttributeGroups.find((g) => g.id === groupId);
        if (!group) return null;

        const attributes = (group.attributeIds || [])
          .map((attrId) => {
            const attr = allAttributes.find((a) => a.id === attrId);
            if (!attr) return null;

            // Fetch ALL master values from catalogDb.attributeValues for this attribute
            const values = allAttributeValues.filter(
              (v) => v.attributeId === attr.id || (attr.valueIds && attr.valueIds.includes(v.id))
            );

            return {
              id: attr.id,
              name: attr.name || attr.label,
              code: attr.code,
              values,
            };
          })
          .filter(Boolean);

        return {
          groupId: group.id,
          groupName: group.name,
          attributes,
        };
      })
      .filter(Boolean) as any[];
  };

  // Helper to check if a candidate value matches selected master filter value IDs (or value labels)
  const isValueMatched = (candidateValId: string, candidateLabel: string | undefined, selectedValIds: string[]) => {
    if (!selectedValIds || selectedValIds.length === 0) return true;
    return selectedValIds.some((selectedId) => {
      if (candidateValId === selectedId) return true;
      if (candidateLabel && candidateLabel === selectedId) return true;
      const masterValObj = allAttributeValues.find((v) => v.id === selectedId);
      if (masterValObj) {
        if (candidateValId === masterValObj.value || candidateValId === masterValObj.label) return true;
        if (candidateLabel && (candidateLabel === masterValObj.label || candidateLabel === masterValObj.value)) return true;
      }
      if (candidateValId && typeof candidateValId === 'string' && candidateValId.toLowerCase() === selectedId.toLowerCase()) return true;
      if (candidateLabel && typeof candidateLabel === 'string' && candidateLabel.toLowerCase() === selectedId.toLowerCase()) return true;
      return false;
    });
  };

  // Step 3: Review Agreements
  const [agreements, setAgreements] = useState({
    termsAgreed: false,
    shareContact: false,
    marketingConsent: false,
  });

  const handleNext = () => {
    if (currentStep === 0) {
      if (!globalDetails.title || !globalDetails.submission_deadline || !globalDetails.shipping_destination || !globalDetails.contact_email) {
        antMessage.error('Please fill in all required global RFQ fields (Title, Deadline, Contact Email, Shipping Destination)');
        return;
      }
    }
    if (currentStep === 1) {
      if (items.length === 0) {
        antMessage.error('Please add at least one line item before proceeding');
        return;
      }
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        if (!item.product_name || !item.category_id || !item.quantity) {
          antMessage.error(`Line Item #${idx + 1} requires a Specification Title, Category, and Quantity`);
          return;
        }
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => setCurrentStep((prev) => prev - 1);

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      item_source: 'CUSTOM_REQUIREMENTS' as RfqItemSource,
      seller_product_id: undefined,
      variant_id: undefined,
      variant_sku: undefined,
      product_name: '',
      category_id: undefined,
      master_product_id: undefined,
      quantity: 1,
      unit_of_measure: 'Units',
      target_unit_price: undefined,
      brand_id: undefined,
      manufacturer_id: undefined,
      country_of_origin: '',
      model_number: '',
      part_number: '',
      dimensions: { height: '', width: '', length: '', weight: '' },
      selected_dynamic_attributes: [],
      target_seller_party_ids: [],
    };
    setItems((prev) => [...prev, newItem]);
    setActiveDrawerIndex(items.length); // Open configuration drawer for the new empty item
    setVariantPage(1);
    antMessage.info('Line item added. Fill in details or select a catalog variant.');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    antMessage.info('Line item removed');
  };

  // Auto-fill line item from catalog seller product & variant (Targeted Variant Mode)
  const handleSelectCatalogSellerProduct = (drawerIdx: number, sellerProduct: any, variant?: any) => {
    const updated = [...items];
    const itemToUpdate = updated[drawerIdx];

    // Automatically set item_source to CATALOG_PRODUCT_VARIANT and bind variant keys
    itemToUpdate.item_source = 'CATALOG_PRODUCT_VARIANT';
    itemToUpdate.seller_product_id = sellerProduct.id;
    itemToUpdate.variant_id = variant?.id || `${sellerProduct.id}-base`;
    itemToUpdate.variant_sku = variant?.sku || sellerProduct.id;

    itemToUpdate.product_name = variant?.sku ? `${sellerProduct.product_name} (${variant.sku})` : sellerProduct.product_name;
    itemToUpdate.category_id = sellerProduct.category_id;
    itemToUpdate.master_product_id = sellerProduct.catalog_product_id;
    itemToUpdate.brand_id = sellerProduct.brand_id || '';
    itemToUpdate.manufacturer_id = sellerProduct.manufacturer_id || '';
    if (variant?.price) {
      itemToUpdate.target_unit_price = variant.price;
    }
    if (sellerProduct.dynamic_attributes) {
      itemToUpdate.selected_dynamic_attributes = sellerProduct.dynamic_attributes.map((da: any) => ({
        group_id: da.group_id,
        attribute_id: da.attribute_id,
        selected_value_ids: da.selected_value_ids || [],
      }));
    }

    // Auto-assign seller's party ID if no target sellers assigned yet
    if (sellerProduct.party_id && (!itemToUpdate.target_seller_party_ids || itemToUpdate.target_seller_party_ids.length === 0)) {
      itemToUpdate.target_seller_party_ids = [sellerProduct.party_id];
    }

    setItems(updated);
    antMessage.success(`Bound line item to catalog variant: ${variant?.sku || sellerProduct.product_name} (Targeted Variant Sourcing)`);
  };

  // Convert Targeted Variant item back to Open Spec RFQ item
  const handleConvertToOpenSpec = (drawerIdx: number) => {
    const updated = [...items];
    const itemToUpdate = updated[drawerIdx];
    itemToUpdate.item_source = 'CUSTOM_REQUIREMENTS';
    itemToUpdate.seller_product_id = undefined;
    itemToUpdate.variant_id = undefined;
    itemToUpdate.variant_sku = undefined;
    setItems(updated);
    antMessage.info('Converted line item to Open Spec / Custom Requirements RFQ.');
  };

  const handleIssueRfq = async () => {
    if (!agreements.termsAgreed || !agreements.shareContact) {
      antMessage.error('You must agree to the terms and consent to share contact details.');
      return;
    }

    try {
      const newRfqId = `rfq-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRfq: Rfq = {
        id: newRfqId,
        rfq_number: `RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: globalDetails.title,
        description: globalDetails.description,
        requester_id: activePartyId,
        requester_party_id: activePartyId,
        requester_party_type: isBusinessContext ? 'BUSINESS' : 'USER',
        requester_name: activePartyName,
        created_by_user_id: currentUserId || 'usr-2',
        contact_email: globalDetails.contact_email,
        contact_phone: globalDetails.contact_phone,
        shipping_destination: globalDetails.shipping_destination,
        status: 'ISSUED',
        submission_deadline: new Date(globalDetails.submission_deadline).toISOString(),
        total_items_count: items.length,
        total_estimated_budget: items.reduce((acc, i) => acc + (i.quantity || 0) * (i.target_unit_price || 0), 0),
        currency: globalDetails.currency,
        attachments: [],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            rfq_id: newRfqId,
            event_type: 'ISSUED',
            actor_name: currentUser?.full_name || 'John Doe',
            actor_id: currentUserId || 'usr-2',
            timestamp: new Date().toISOString(),
            remarks: `RFQ Container published for ${activePartyName} and issued to target suppliers.`,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newRfqItems: RfqItem[] = items.map((item, idx) => ({
        id: `rfqi-${newRfqId}-${idx + 1}`,
        rfq_id: newRfqId,
        item_index: idx + 1,
        status: 'OPEN',
        item_source: item.variant_id ? 'CATALOG_PRODUCT_VARIANT' : 'CUSTOM_REQUIREMENTS',
        category_id: item.category_id || '',
        catalog_product_id: item.master_product_id,
        seller_product_id: item.seller_product_id,
        variant_id: item.variant_id,
        variant_sku: item.variant_sku,
        product_name: item.product_name,
        brand_id: item.brand_id,
        manufacturer_id: item.manufacturer_id,
        quantity: item.quantity || 1,
        unit: item.unit_of_measure || item.unit || 'Units',
        target_unit_price: item.target_unit_price,
        dynamic_attributes: item.selected_dynamic_attributes || [],
        attachments: [],
        target_seller_party_ids: item.target_seller_party_ids || [],
        seller_assignments: (item.target_seller_party_ids || []).map((partyId: string, sIdx: number) => ({
          id: `sa-${newRfqId}-${idx + 1}-${sIdx + 1}`,
          rfq_item_id: `rfqi-${newRfqId}-${idx + 1}`,
          seller_party_id: partyId,
          assignment_type: 'DIRECT_INVITATION',
          assigned_by_user_id: currentUserId || 'usr-2',
          assigned_at: new Date().toISOString(),
          status: 'ASSIGNED',
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const newQuotes: SellerQuote[] = [];

      newRfqItems.forEach((item) => {
        const targetSellers = item.target_seller_party_ids && item.target_seller_party_ids.length > 0
          ? item.target_seller_party_ids
          : allParties.filter((p: any) => p.id !== activePartyId).map((p: any) => p.id);

        targetSellers.forEach((sellerPartyId: string) => {
          newQuotes.push({
            id: `q-${item.id}-${sellerPartyId}`,
            rfq_item_id: item.id,
            seller_id: sellerPartyId,
            status: 'DRAFT',
            unit_price: item.target_unit_price || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      });

      await rfqDb.rfqs.put(newRfq);
      await rfqDb.rfq_items.bulkPut(newRfqItems);
      if (newQuotes.length > 0) {
        await rfqDb.seller_quotes.bulkPut(newQuotes);
      }

      antMessage.success('RFQ Container issued successfully!');
      navigate(`${basePath}/${newRfqId}`);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to issue RFQ container');
    }
  };

  const steps = [
    { title: 'Global Details', icon: <FileTextOutlined /> },
    { title: 'Line Items', icon: <AppstoreOutlined /> },
    { title: 'Review & Submit', icon: <CheckCircleOutlined /> },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(basePath)}>
          Back to RFQs
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">Create Request for Quotation</h1>
          <Tag color="purple">Party: {activePartyName}</Tag>
        </div>
      </div>

      <Steps current={currentStep} items={steps} className="mb-8" />

      {/* STEP 1: Global Details */}
      {currentStep === 0 && (
        <Card className="shadow-sm border-slate-200">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-slate-800">RFQ Global Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">RFQ Title *</label>
              <Input
                size="large"
                placeholder="e.g. Q4 Enterprise Hardware Sourcing"
                value={globalDetails.title}
                onChange={(e) => setGlobalDetails({ ...globalDetails, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Currency *</label>
              <Select
                size="large"
                value={globalDetails.currency}
                onChange={(val) => setGlobalDetails({ ...globalDetails, currency: val })}
                className="w-full mt-1"
                options={[
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (€)', value: 'EUR' },
                  { label: 'GBP (£)', value: 'GBP' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Submission Deadline *</label>
              <Input
                type="date"
                size="large"
                value={globalDetails.submission_deadline}
                onChange={(e) => setGlobalDetails({ ...globalDetails, submission_deadline: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Contact Email *</label>
              <Input
                type="email"
                size="large"
                placeholder="buyer@example.com"
                value={globalDetails.contact_email}
                onChange={(e) => setGlobalDetails({ ...globalDetails, contact_email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Contact Mobile / Phone</label>
              <Input
                size="large"
                placeholder="+1-555-0199"
                value={globalDetails.contact_phone}
                onChange={(e) => setGlobalDetails({ ...globalDetails, contact_phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Shipping Destination *</label>
              <Input
                size="large"
                placeholder="e.g. Warehouse 4, Central Procurement HQ"
                value={globalDetails.shipping_destination}
                onChange={(e) => setGlobalDetails({ ...globalDetails, shipping_destination: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Detailed Sourcing Specification / General Instructions</label>
              <Input.TextArea
                rows={4}
                value={globalDetails.description}
                onChange={(e) => setGlobalDetails({ ...globalDetails, description: e.target.value })}
                className="mt-1"
                placeholder="Detailed global sourcing terms, standard specifications or delivery instructions..."
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Line Items */}
      {currentStep === 1 && (
        <Card className="shadow-sm border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 m-0">Line Items ({items.length})</h3>
              <p className="text-xs text-slate-500">Configure item-wise static specs, dynamic category attributes, targeted catalog SKUs, or open RFQ seller assignments.</p>
            </div>
            <Button type="primary" onClick={handleAddItem} icon={<PlusOutlined />} className="bg-blue-600">
              Add Item
            </Button>
          </div>

          <Table
            dataSource={items}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            bordered
            locale={{ emptyText: 'No line items added yet. Click "Add Item" to add your first line item.' }}
            columns={[
              {
                title: '#',
                width: 60,
                render: (_, __, index) => <span className="font-bold text-slate-600">#{index + 1}</span>,
              },
              {
                title: 'Sourcing Mode & Scope',
                width: 200,
                render: (_, record) => {
                  const isTargetedVariant = record.variant_id || record.item_source === 'CATALOG_PRODUCT_VARIANT';
                  const hasTargetSellers = record.target_seller_party_ids && record.target_seller_party_ids.length > 0;
                  return (
                    <div className="space-y-1">
                      <div>
                        {isTargetedVariant ? (
                          <Tag color="green" icon={<AimOutlined />}>Targeted Variant</Tag>
                        ) : (
                          <Tag color="blue" icon={<AppstoreOutlined />}>Open Spec RFQ</Tag>
                        )}
                      </div>
                      <div className="text-[11px]">
                        {hasTargetSellers ? (
                          <Tag color="purple">{record.target_seller_party_ids.length} Direct Sellers</Tag>
                        ) : (
                          <Tag color="cyan" icon={<GlobalOutlined />}>Open Marketplace</Tag>
                        )}
                      </div>
                    </div>
                  );
                },
              },
              {
                title: 'Item Spec Title & Category',
                render: (_, record) => {
                  const cat = leafCategories.find((c) => c.id === record.category_id);
                  const mProd = allMasterProducts.find((p) => p.id === record.master_product_id);
                  return (
                    <div>
                      <div className="font-bold text-slate-900">{record.product_name || <span className="text-slate-400 italic">Untitled Item</span>}</div>
                      {record.variant_sku && (
                        <div className="text-xs font-mono text-blue-700 font-semibold">SKU: {record.variant_sku}</div>
                      )}
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        Category: {cat ? <Tag color="purple">{cat.name}</Tag> : <span className="text-amber-600 italic">Select category</span>}
                        {mProd && <Tag color="cyan">Master: {mProd.name}</Tag>}
                      </div>
                    </div>
                  );
                },
              },
              {
                title: 'Quantity & Target Price',
                width: 160,
                render: (_, record) => (
                  <div>
                    <div className="font-bold text-slate-800">{record.quantity || 0} {record.unit_of_measure}</div>
                    {record.target_unit_price && <div className="text-xs font-bold text-emerald-600">${record.target_unit_price} / unit</div>}
                  </div>
                ),
              },
              {
                title: 'Action',
                width: 160,
                render: (_, __, index) => (
                  <div className="flex items-center gap-2">
                    <Button size="small" type="dashed" icon={<SettingOutlined />} onClick={() => { setActiveDrawerIndex(index); setVariantPage(1); }}>
                      Configure
                    </Button>
                    <Popconfirm title="Remove this line item?" onConfirm={() => handleRemoveItem(index)}>
                      <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* STEP 3: Review & Submit */}
      {currentStep === 2 && (
        <Card className="shadow-sm border-slate-200">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-slate-800">Review RFQ Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-500">RFQ Title:</span> <div className="font-bold text-slate-900">{globalDetails.title}</div></div>
            <div><span className="text-slate-500">Deadline:</span> <div className="font-bold text-slate-900">{globalDetails.submission_deadline}</div></div>
            <div><span className="text-slate-500">Destination:</span> <div className="font-bold text-slate-900">{globalDetails.shipping_destination}</div></div>
            <div><span className="text-slate-500">Total Items:</span> <div className="font-bold text-blue-600">{items.length} Items</div></div>
          </div>

          <Table
            dataSource={items}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
            bordered
            columns={[
              { title: 'Item #', width: 70, render: (_, __, i) => i + 1 },
              { title: 'Sourcing Mode', width: 140, render: (_, r) => r.variant_id ? <Tag color="green">Targeted SKU</Tag> : <Tag color="blue">Open Spec</Tag> },
              { title: 'Title & Category', render: (_, r) => <span><strong>{r.product_name || 'Untitled'}</strong> ({r.category_id || 'N/A'})</span> },
              { title: 'Quantity', width: 120, render: (_, r) => `${r.quantity} ${r.unit_of_measure}` },
              { title: 'Target Unit Price', width: 140, render: (_, r) => r.target_unit_price ? `$${r.target_unit_price}` : 'Unspecified' },
              { title: 'Subtotal', width: 140, render: (_, r) => r.target_unit_price ? <strong className="text-emerald-600">${(r.quantity * r.target_unit_price).toLocaleString()}</strong> : '-' },
            ]}
          />

          <div className="mt-8 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Confirm and Submit</h4>
            <Checkbox
              checked={agreements.termsAgreed}
              onChange={(e) => setAgreements({ ...agreements, termsAgreed: e.target.checked })}
            >
              I confirm that I have read and agree to the RFQ posting terms.
            </Checkbox>
            <br />
            <Checkbox
              checked={agreements.shareContact}
              onChange={(e) => setAgreements({ ...agreements, shareContact: e.target.checked })}
            >
              I agree to share my contact details with interested vendors.
            </Checkbox>
            <br />
            <Checkbox
              checked={agreements.marketingConsent}
              onChange={(e) => setAgreements({ ...agreements, marketingConsent: e.target.checked })}
            >
              I consent to receive marketing communications.
            </Checkbox>
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        {currentStep > 0 ? (
          <Button size="large" onClick={handlePrev}>
            Back
          </Button>
        ) : <div />}

        {currentStep < 2 ? (
          <Button type="primary" size="large" className="bg-blue-600 font-bold" onClick={handleNext}>
            Next Step →
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8"
            onClick={handleIssueRfq}
            icon={<SendOutlined />}
          >
            Submit RFQ Container
          </Button>
        )}
      </div>

      {/* ITEM CONFIGURATION DRAWER */}
      <Drawer
        title={
          <div className="flex items-center justify-between pr-8">
            <span className="font-bold text-slate-900">
              Configure Line Item #{activeDrawerIndex !== null ? activeDrawerIndex + 1 : ''} Specifications
            </span>
            {activeDrawerIndex !== null && items[activeDrawerIndex]?.variant_id && (
              <Tag color="green" icon={<AimOutlined />}>Targeted Variant Mode</Tag>
            )}
          </div>
        }
        width={960}
        onClose={() => setActiveDrawerIndex(null)}
        open={activeDrawerIndex !== null}
        destroyOnClose
        extra={
          <Button type="primary" onClick={() => setActiveDrawerIndex(null)} className="bg-blue-600">
            Done
          </Button>
        }
      >
        {activeDrawerIndex !== null && (() => {
          const item = items[activeDrawerIndex];
          if (!item) return null;

          const categoryAttributeTree = getCategoryAttributeTree(item.category_id);

          // Initially load ALL master products if no category is selected; filter if category is selected
          const filteredMasterProducts = item.category_id
            ? allMasterProducts.filter((p) => p.categoryId === item.category_id)
            : allMasterProducts;

          // Progressive Option Grouping & Counts for Brand & Manufacturer Dropdowns
          const baseCategoryProducts = item.category_id ? allSellerProducts.filter((sp) => sp.category_id === item.category_id) : allSellerProducts;

          const brandCounts = baseCategoryProducts.reduce((acc: Record<string, number>, sp: any) => {
            if (sp.brand_id) acc[sp.brand_id] = (acc[sp.brand_id] || 0) + 1;
            return acc;
          }, {});

          const dynamicBrandOptions = [
            {
              label: 'Available Brands',
              options: Object.entries(brandCounts).map(([bId, count]) => {
                const b = allBrands.find((brand: any) => brand.id === bId);
                return { label: `${b?.name || bId} (${count})`, value: bId };
              }),
            },
            {
              label: 'Other Brands',
              options: allBrands
                .filter((b: any) => !brandCounts[b.id])
                .map((b: any) => ({ label: `${b.name} (0)`, value: b.id })),
            },
          ].filter((g) => g.options.length > 0);

          const mfgCounts = baseCategoryProducts.reduce((acc: Record<string, number>, sp: any) => {
            if (sp.manufacturer_id) acc[sp.manufacturer_id] = (acc[sp.manufacturer_id] || 0) + 1;
            return acc;
          }, {});

          const dynamicMfgOptions = [
            {
              label: 'Available Manufacturers',
              options: Object.entries(mfgCounts).map(([mId, count]) => {
                const m = allManufacturers.find((mfg: any) => mfg.id === mId);
                return { label: `${m?.company_name || mId} (${count})`, value: mId };
              }),
            },
            {
              label: 'Other Manufacturers',
              options: allManufacturers
                .filter((m: any) => !mfgCounts[m.id])
                .map((m: any) => ({ label: `${m.company_name} (0)`, value: m.id })),
            },
          ].filter((g) => g.options.length > 0);

          // -------------------------------------------------------------
          // FLATTENED VARIANT-WISE CATALOG PRODUCTS FILTERING BY MASTER ATTRIBUTE FILTERS
          // -------------------------------------------------------------
          const matchingFlatVariants: Array<{ sellerProduct: any; variant: any }> = [];

          allSellerProducts.forEach((sp: any) => {
            // Category filter (only filter if category_id is selected)
            if (item.category_id && sp.category_id !== item.category_id) return;
            // Master product filter (only filter if master_product_id is selected)
            if (item.master_product_id && sp.catalog_product_id !== item.master_product_id) return;
            // Brand filter
            if (item.brand_id) {
              const selectedBrands = Array.isArray(item.brand_id) ? item.brand_id : [item.brand_id];
              if (selectedBrands.length > 0 && !selectedBrands.includes(sp.brand_id)) return;
            }
            // Manufacturer filter
            if (item.manufacturer_id) {
              const selectedMfgs = Array.isArray(item.manufacturer_id) ? item.manufacturer_id : [item.manufacturer_id];
              if (selectedMfgs.length > 0 && !selectedMfgs.includes(sp.manufacturer_id)) return;
            }

            const variantsList = sp.variants && sp.variants.length > 0 ? sp.variants : [{ id: `${sp.id}-base`, sku: sp.part_number || sp.id, price: undefined }];

            variantsList.forEach((v: any) => {
              // Dynamic Attribute Filters Evaluation: Compare group_id, attribute_id, value_id / value label
              const selectedFilters: RfqItemDynamicAttribute[] = item.selected_dynamic_attributes || [];
              let matchesAllAttributeFilters = true;

              for (const filter of selectedFilters) {
                if (!filter.selected_value_ids || filter.selected_value_ids.length === 0) continue;

                // 1. If variant v explicitly defines combination values for this attribute, evaluate combination values ONLY
                const comboEntry = (v.combination_values || []).find(
                  (cv: any) =>
                    cv.attribute_id === filter.attribute_id &&
                    cv.group_id === filter.group_id
                );

                let attributeMatches = false;

                if (comboEntry) {
                  // Variant explicitly defines this attribute value (e.g. val-9-1 for 512GB vs val-9-2 for 1TB)
                  attributeMatches = isValueMatched(comboEntry.value_id, comboEntry.label, filter.selected_value_ids);
                } else {
                  // Fallback to parent product dynamic attributes or specs ONLY if variant does not define a combination entry
                  const parentDynamicMatch = (sp.dynamic_attributes || []).some(
                    (da: any) =>
                      da.attribute_id === filter.attribute_id &&
                      da.group_id === filter.group_id &&
                      (da.selected_value_ids || []).some((valId: string) => isValueMatched(valId, undefined, filter.selected_value_ids))
                  );

                  const parentSpecMatch = (sp.specifications || []).some(
                    (spec: any) =>
                      spec.attribute_id === filter.attribute_id &&
                      spec.group_id === filter.group_id &&
                      (spec.values || []).some((val: any) => isValueMatched(val.id, val.label, filter.selected_value_ids))
                  );

                  attributeMatches = parentDynamicMatch || parentSpecMatch;
                }

                if (!attributeMatches) {
                  matchesAllAttributeFilters = false;
                  break;
                }
              }

              if (matchesAllAttributeFilters) {
                matchingFlatVariants.push({ sellerProduct: sp, variant: v });
              }
            });
          });

          // Paginate flat variants list with safe page clamping
          const totalVariants = matchingFlatVariants.length;
          const maxPage = Math.max(1, Math.ceil(totalVariants / VARIANTS_PER_PAGE));
          const safePage = Math.min(variantPage, maxPage);
          const startIndex = (safePage - 1) * VARIANTS_PER_PAGE;
          const paginatedVariants = matchingFlatVariants.slice(startIndex, startIndex + VARIANTS_PER_PAGE);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT SIDE: Line Item Form Inputs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">

                {/* TARGETED VARIANT FOCUS BANNER */}
                {item.variant_id && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <AimOutlined className="text-emerald-600" /> Targeted Catalog Variant Bound
                      </div>
                      <div className="text-xs text-emerald-700 font-mono mt-0.5">
                        SKU: <strong>{item.variant_sku || item.variant_id}</strong> | Product ID: {item.seller_product_id}
                      </div>
                    </div>
                    <Button
                      size="small"
                      danger
                      icon={<DisconnectOutlined />}
                      onClick={() => handleConvertToOpenSpec(activeDrawerIndex)}
                      className="text-xs font-semibold"
                    >
                      Convert to Open Spec
                    </Button>
                  </div>
                )}

                {/* 1. Line Item Basics */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <AppstoreOutlined className="text-blue-600" /> Basic Parameters & Catalog Mapping
                  </h4>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Item Specification Title *</label>
                    <Input
                      placeholder="e.g. Custom Titanium Smartphone Frame"
                      value={item.product_name}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[activeDrawerIndex].product_name = e.target.value;
                        setItems(updated);
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Leaf Category *</label>
                      <Select
                        allowClear
                        placeholder="Select Leaf Category"
                        value={item.category_id}
                        onChange={(catId) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].category_id = catId;
                          updated[activeDrawerIndex].master_product_id = undefined;
                          updated[activeDrawerIndex].selected_dynamic_attributes = [];
                          setItems(updated);
                          setVariantPage(1);
                        }}
                        className="w-full mt-1"
                        options={leafCategories.map((c) => ({ value: c.id, label: `${c.name} (${c.id})` }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Master Product</label>
                      <Select
                        allowClear
                        placeholder="Select Master Product"
                        value={item.master_product_id}
                        onChange={(masterProdId) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].master_product_id = masterProdId;
                          const mProd = allMasterProducts.find((p) => p.id === masterProdId);
                          if (mProd) {
                            // Auto-set Leaf Category to the Master Product's category if not set or different
                            updated[activeDrawerIndex].category_id = mProd.categoryId;
                            if (!updated[activeDrawerIndex].product_name) {
                              updated[activeDrawerIndex].product_name = `${mProd.name} Spec`;
                            }
                          }
                          setItems(updated);
                          setVariantPage(1);
                        }}
                        className="w-full mt-1"
                        options={filteredMasterProducts.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Target Unit Price ($)</label>
                      <Input
                        type="number"
                        placeholder="Optional target budget price"
                        value={item.target_unit_price}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].target_unit_price = e.target.value ? Number(e.target.value) : undefined;
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Quantity *</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].quantity = Number(e.target.value) || 1;
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-700">Unit of Measure</label>
                      <Select
                        value={item.unit_of_measure}
                        onChange={(val) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].unit_of_measure = val;
                          setItems(updated);
                        }}
                        className="w-full mt-1"
                        options={[
                          { label: 'Units', value: 'Units' },
                          { label: 'Pieces', value: 'Pieces' },
                          { label: 'Kg', value: 'Kg' },
                          { label: 'Boxes', value: 'Boxes' },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Static Specifications & Physical Dimensions */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ToolOutlined className="text-indigo-600" /> Static Specs & Physical Dimensions
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Preferred Brand(s)</label>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select Preferred Brand(s)"
                        value={Array.isArray(item.brand_id) ? item.brand_id : item.brand_id ? [item.brand_id] : []}
                        onChange={(val: string[]) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].brand_id = val;
                          setItems(updated);
                          setVariantPage(1);
                        }}
                        className="w-full mt-1"
                        options={dynamicBrandOptions}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Preferred Manufacturer(s)</label>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select Preferred Manufacturer(s)"
                        value={Array.isArray(item.manufacturer_id) ? item.manufacturer_id : item.manufacturer_id ? [item.manufacturer_id] : []}
                        onChange={(val: string[]) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].manufacturer_id = val;
                          setItems(updated);
                          setVariantPage(1);
                        }}
                        className="w-full mt-1"
                        options={dynamicMfgOptions}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Model Number</label>
                      <Input
                        placeholder="e.g. SM-S928B"
                        value={item.model_number}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].model_number = e.target.value;
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Part Number</label>
                      <Input
                        placeholder="e.g. GH90-15822A"
                        value={item.part_number}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].part_number = e.target.value;
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Country of Origin</label>
                      <Input
                        placeholder="e.g. South Korea (KR)"
                        value={item.country_of_origin}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].country_of_origin = e.target.value;
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Height</label>
                      <Input
                        placeholder="e.g. 162.3 mm"
                        value={item.dimensions?.height}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].dimensions = { ...updated[activeDrawerIndex].dimensions, height: e.target.value };
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Width</label>
                      <Input
                        placeholder="e.g. 79.0 mm"
                        value={item.dimensions?.width}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].dimensions = { ...updated[activeDrawerIndex].dimensions, width: e.target.value };
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Length</label>
                      <Input
                        placeholder="e.g. 8.6 mm"
                        value={item.dimensions?.length}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].dimensions = { ...updated[activeDrawerIndex].dimensions, length: e.target.value };
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Weight</label>
                      <Input
                        placeholder="e.g. 232 g"
                        value={item.dimensions?.weight}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].dimensions = { ...updated[activeDrawerIndex].dimensions, weight: e.target.value };
                          setItems(updated);
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Category Attributes */}
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-4">
                  <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                    <Tag color="purple">Master Taxonomy</Tag> Category Mapped Dynamic Attributes
                  </h4>

                  {!item.category_id ? (
                    <div className="text-xs text-amber-700 italic font-semibold">Select a Leaf Category above (or choose a Master Product) to load mapped dynamic attributes.</div>
                  ) : categoryAttributeTree.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No dynamic attribute groups mapped for this category.</div>
                  ) : (
                    categoryAttributeTree.map((group: any) => (
                      <div key={group.groupId} className="p-3 bg-white rounded-lg border border-purple-100 shadow-sm space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-purple-800">
                          {group.groupName} ({group.groupId})
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {group.attributes.map((attr: any) => {
                            const existingSelection = (item.selected_dynamic_attributes || []).find(
                              (s: RfqItemDynamicAttribute) => s.attribute_id === attr.id
                            );
                            const selectedValueIds = existingSelection?.selected_value_ids || [];

                            return (
                              <div key={attr.id}>
                                <label className="text-xs font-semibold text-slate-700">{attr.name}</label>
                                <Select
                                  mode="multiple"
                                  value={selectedValueIds}
                                  placeholder={`Select ${attr.name}`}
                                  onChange={(selectedValIds) => {
                                    const updated = [...items];
                                    const dynAttrs: RfqItemDynamicAttribute[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                    const idx = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                    if (idx >= 0) {
                                      dynAttrs[idx] = { group_id: group.groupId, attribute_id: attr.id, selected_value_ids: selectedValIds };
                                    } else {
                                      dynAttrs.push({ group_id: group.groupId, attribute_id: attr.id, selected_value_ids: selectedValIds });
                                    }
                                    updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                    setItems(updated);
                                    setVariantPage(1); // Reset side variant pagination on attribute change
                                  }}
                                  className="w-full mt-1"
                                  options={attr.values.map((v: any) => ({ value: v.id, label: `${v.label} (${v.id})` }))}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 4. Target Seller Scope (Open RFQ vs Direct Invitations) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm m-0">Target Seller Scope</h4>
                    {(!item.target_seller_party_ids || item.target_seller_party_ids.length === 0) ? (
                      <Tag color="cyan" icon={<GlobalOutlined />}>Open RFQ (All Marketplace Sellers)</Tag>
                    ) : (
                      <Tag color="purple">{item.target_seller_party_ids.length} Selected Sellers</Tag>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Leave empty to make this line item an Open RFQ for all verified marketplace suppliers, or select specific target sellers for direct invitations.
                  </p>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select Target Seller Parties (or leave empty for Open RFQ)"
                    value={item.target_seller_party_ids}
                    onChange={(selectedIds) => {
                      const updated = [...items];
                      updated[activeDrawerIndex].target_seller_party_ids = selectedIds;
                      setItems(updated);
                    }}
                    className="w-full"
                    options={allParties.map((p: any) => ({ value: p.id, label: `${p.display_name} (${p.id})` }))}
                  />
                </div>
              </div>

              {/* RIGHT SIDE: Interactive Catalog Variants Selection Panel (5 cols) */}
              <div className='lg:col-span-5 space-y-4'>
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 m-0">
                        <ShopOutlined className="text-blue-600" /> Catalog Variants ({totalVariants})
                      </h4>
                      {item.selected_dynamic_attributes && item.selected_dynamic_attributes.some((a: any) => a.selected_value_ids?.length > 0) && (
                        <Tag color="purple" icon={<FilterOutlined />}>Filtered by Specs</Tag>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 m-0">
                      Variants filtered in real-time by category, brand, mfg, and selected dynamic attributes. Click to view details or bind variant focus.
                    </p>

                    {totalVariants === 0 ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center italic">
                        No catalog variants match the current filters. You can adjust your attribute filters or raise a custom RFQ line item spec manually.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paginatedVariants.map(({ sellerProduct: sp, variant: v }) => {
                          const isBoundVariant = item.variant_id === v.id || item.variant_id === `${sp.id}-base`;

                          const party = allParties.find((p: any) => p.id === sp.party_id);

                          return (
                            <div key={`${sp.id}-${v.id}`} className="mb-2">
                              <div
                                className={`border rounded-lg p-3 transition-all bg-white flex flex-col hover:shadow-md cursor-pointer ${isBoundVariant ? 'border-2 border-emerald-500 bg-emerald-50/40' : 'border-slate-200 hover:border-blue-400'
                                  }`}
                                onClick={() => setPreviewProduct({ sellerProduct: sp, variant: v, drawerIndex: activeDrawerIndex })}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                                    {sp.product_name.charAt(0)}
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="font-semibold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                      {sp.product_name}
                                      {isBoundVariant && <Tag color="green" className="m-0 text-[10px]">Bound</Tag>}
                                    </div>
                                    <div className="font-medium text-blue-600 text-xs truncate">
                                      {v.sku ? `SKU: ${v.sku}` : (v.name || sp.model_number || 'Standard Variant')}
                                    </div>
                                  </div>
                                  <div className="font-bold text-emerald-600 text-sm flex-shrink-0">
                                    {v.price ? `$${v.price.toLocaleString()}` : 'Quote'}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-2 gap-2">
                                  <div className="text-xs text-slate-500 truncate">
                                    Seller: <span className="font-medium text-slate-700">{party?.display_name || sp.party_id}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<EyeOutlined />}
                                      onClick={() => setPreviewProduct({ sellerProduct: sp, variant: v, drawerIndex: activeDrawerIndex })}
                                      className="text-xs text-blue-600 hover:bg-blue-50 px-1.5"
                                    >
                                      Details
                                    </Button>
                                    <Button
                                      size="small"
                                      type={isBoundVariant ? 'default' : 'primary'}
                                      icon={isBoundVariant ? <CheckOutlined /> : <AimOutlined />}
                                      onClick={() => handleSelectCatalogSellerProduct(activeDrawerIndex, sp, v)}
                                      className={isBoundVariant ? 'text-emerald-700 border-emerald-500 font-semibold text-xs h-7 px-2' : 'bg-blue-600 hover:bg-blue-700 font-semibold text-xs h-7 px-2'}
                                    >
                                      {isBoundVariant ? 'Bound' : 'Bind'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls at Bottom */}
                  {totalVariants > 0 && (
                    <div className="pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span>–<span className="font-semibold text-slate-800">{Math.min(startIndex + VARIANTS_PER_PAGE, totalVariants)}</span> of <span className="font-semibold text-slate-800">{totalVariants}</span>
                      </div>
                      {totalVariants > VARIANTS_PER_PAGE && (
                        <Pagination
                          size="small"
                          current={safePage}
                          pageSize={VARIANTS_PER_PAGE}
                          total={totalVariants}
                          onChange={(page) => setVariantPage(page)}
                          showSizeChanger={false}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* PRODUCT PREVIEW MODAL (Ref from CreateRFQ.tsx) */}
      <Modal
        title={
          <span className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <ShopOutlined className="text-blue-600" /> Catalog Product & Variant Details
          </span>
        }
        open={!!previewProduct}
        onCancel={() => setPreviewProduct(null)}
        width={750}
        footer={null}
        destroyOnClose
      >
        {previewProduct && (() => {
          const { sellerProduct: sp, variant: v, drawerIndex } = previewProduct;
          const brand = allBrands.find((b: any) => b.id === sp.brand_id);
          const mfg = allManufacturers.find((m: any) => m.id === sp.manufacturer_id);
          const party = allParties.find((p: any) => p.id === sp.party_id);

          return (
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 m-0">{sp.product_name}</h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Seller Party: <strong className="text-slate-800">{party?.display_name || sp.party_id}</strong>
                  </div>
                </div>
                <Tag color="purple" className="text-xs px-3 py-1 font-bold">Category: {sp.category_id}</Tag>
              </div>

              {/* General Specs */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-2">
                  <AppstoreOutlined className="text-blue-600" /> Global Product Specifications
                </h4>
                <Descriptions bordered size="small" column={2} className="bg-slate-50">
                  <Descriptions.Item label="Master Product ID"><span className="font-mono text-xs">{sp.catalog_product_id}</span></Descriptions.Item>
                  <Descriptions.Item label="Brand">{brand?.name || sp.brand_id || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Manufacturer" span={2}>{mfg?.company_name || sp.manufacturer_id || 'N/A'}</Descriptions.Item>
                </Descriptions>
              </div>

              {/* Variant Specs */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-2">
                  <InboxOutlined className="text-emerald-600" /> Selected Variant Details
                </h4>
                <Descriptions bordered size="small" column={2} className="bg-slate-50 mb-3">
                  <Descriptions.Item label="Variant SKU" span={2}>
                    <span className="font-bold text-blue-700 text-sm font-mono">{v.sku || 'N/A'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Price">
                    <span className="font-bold text-emerald-600">{v.price ? `$${v.price.toLocaleString()}` : 'Custom Quote'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Stock Availability">{v.stock ?? 'In Stock'}</Descriptions.Item>
                </Descriptions>

                {v.combination_values && v.combination_values.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 space-y-2">
                    <div className="text-xs font-bold text-purple-900">Variant Attribute Values</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {v.combination_values.map((cv: any) => (
                        <div key={cv.value_id} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100 shadow-sm">
                          <span className="text-slate-500 font-semibold">{cv.attribute_name}</span>
                          <span className="font-bold text-slate-900">{cv.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
                <Button onClick={() => setPreviewProduct(null)}>Cancel</Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<AimOutlined />}
                  onClick={() => {
                    handleSelectCatalogSellerProduct(drawerIndex, sp, v);
                    setPreviewProduct(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 font-bold px-6"
                >
                  Select & Bind Variant Focus
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
