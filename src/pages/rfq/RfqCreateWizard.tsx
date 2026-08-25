import React, { useState, useMemo } from 'react';
import {
  Card as AntCard,
  Steps as AntSteps,
  Input as AntInput,
  Select as AntSelect,
  Button as AntButton,
  Table as AntTable,
  Tag as AntTag,
  App as AntApp,
  Drawer as AntDrawer,
  Popconfirm as AntPopconfirm,
  Checkbox as AntCheckbox,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FileTextOutlined as AntFileTextOutlined,
  AppstoreOutlined as AntAppstoreOutlined,
  CheckCircleOutlined as AntCheckCircleOutlined,
  PlusOutlined as AntPlusOutlined,
  SendOutlined as AntSendOutlined  ,
  ArrowLeftOutlined as AntArrowLeftOutlined  ,
  SettingOutlined as AntSettingOutlined  ,
  DeleteOutlined as AntDeleteOutlined,
  GlobalOutlined as AntGlobalOutlined,
  ToolOutlined as AntToolOutlined,
  ShopOutlined as AntShopOutlined,
  CheckOutlined as AntCheckOutlined,
  FilterOutlined as AntFilterOutlined,
  EyeOutlined as AntEyeOutlined,
  InboxOutlined as AntInboxOutlined,
  DisconnectOutlined as AntDisconnectOutlined,
  AimOutlined as AntAimOutlined,
} from '@ant-design/icons';
import { rfqDb, type Rfq, type RfqItem, type RfqItemAttribute, type SellerQuote } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { catalogDb } from '../../data/catalog/catalog.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';


// ============================================================================
// MAIN WIZARD ORCHESTRATOR
// ============================================================================

export const RfqCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUser, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

  const allParties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  
  const activeParty = isBusinessContext
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId) || allParties[0]
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || allParties.find((p) => p.id === 'pty-6') || allParties[0];

  const activePartyId = activeParty?.id || 'pty-1';
  const activePartyName = activeParty?.display_name || 'Active Party';

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate(basePath)}>RFQ Sourcing</a> },
    { title: <span className="text-slate-800 font-semibold">Create New RFQ</span> }
  ], [navigate, basePath]);
  useBreadcrumb(breadcrumbs);

  const [currentStep, setCurrentStep] = useState(0);

  const [globalDetails, setGlobalDetails] = useState({
    title: '',
    description: '',
    currency: 'USD',
    submission_deadline: '',
    contact_email: '',
    contact_phone: '',
    shipping_destination: '',
  });

  const [items, setItems] = useState<any[]>([]);

  const steps = [
    { title: 'Global Details', icon: <AntFileTextOutlined /> },
    { title: 'Line Items', icon: <AntAppstoreOutlined /> },
    { title: 'Review & Submit', icon: <AntCheckCircleOutlined /> },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <AntButton icon={<AntArrowLeftOutlined />} onClick={() => navigate(basePath)}>
          Back to RFQs
        </AntButton>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">Create Request for Quotation</h1>
          <AntTag color="purple">Party: {activePartyName}</AntTag>
        </div>
      </div>

      <AntSteps current={currentStep} items={steps} className="mb-8" />

      {currentStep === 0 && (
        <RfqGlobalDetailsStep
          initialData={globalDetails}
          onNext={(data) => {
            setGlobalDetails(data);
            setCurrentStep(1);
          }}
        />
      )}

      {currentStep === 1 && (
        <RfqLineItemsStep
          initialItems={items}
          activePartyId={activePartyId}
          onPrev={(data) => {
            setItems(data);
            setCurrentStep(0);
          }}
          onNext={(data) => {
            setItems(data);
            setCurrentStep(2);
          }}
        />
      )}

      {currentStep === 2 && (
        <RfqReviewSubmitStep
          globalDetails={globalDetails}
          items={items}
          isBusinessContext={isBusinessContext}
          activePartyId={activePartyId}
          activePartyName={activePartyName}
          currentUser={currentUser}
          currentUserId={currentUserId}
          basePath={basePath}
          allParties={allParties}
          onPrev={() => setCurrentStep(1)}
          onSuccess={(newRfqId) => navigate(`${basePath}/${newRfqId}`)}
        />
      )}
    </div>
  );
};


// ============================================================================
// STEP 1: GLOBAL DETAILS
// ============================================================================

interface RfqGlobalDetailsStepProps {
  initialData: any;
  onNext: (data: any) => void;
}

const RfqGlobalDetailsStep: React.FC<RfqGlobalDetailsStepProps> = ({ initialData, onNext }) => {
  const { message: antMessage } = AntApp.useApp();
  const [details, setDetails] = useState(initialData);

  const handleNext = () => {
    if (!details.title || !details.submission_deadline || !details.shipping_destination || !details.contact_email) {
      antMessage.error('Please fill in all required global RFQ fields (Title, Deadline, Contact Email, Shipping Destination)');
      return;
    }
    onNext(details);
  };

  return (
    <div className="space-y-6">
      <AntCard className="shadow-sm border-slate-200">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-slate-800">RFQ Global Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">RFQ Title *</label>
            <AntInput
              size="large"
              placeholder="e.g. Q4 Enterprise Hardware Sourcing"
              value={details.title}
              onChange={(e) => setDetails({ ...details, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Currency *</label>
            <AntSelect
              size="large"
              value={details.currency}
              onChange={(val) => setDetails({ ...details, currency: val })}
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
            <AntInput
              type="date"
              size="large"
              value={details.submission_deadline}
              onChange={(e) => setDetails({ ...details, submission_deadline: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Contact Email *</label>
            <AntInput
              type="email"
              size="large"
              placeholder="buyer@example.com"
              value={details.contact_email}
              onChange={(e) => setDetails({ ...details, contact_email: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Contact Mobile / Phone</label>
            <AntInput
              size="large"
              placeholder="+1-555-0199"
              value={details.contact_phone}
              onChange={(e) => setDetails({ ...details, contact_phone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Shipping Destination *</label>
            <AntInput
              size="large"
              placeholder="e.g. Warehouse 4, Central Procurement HQ"
              value={details.shipping_destination}
              onChange={(e) => setDetails({ ...details, shipping_destination: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Detailed Sourcing Specification / General Instructions</label>
            <AntInput.TextArea
              rows={4}
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              className="mt-1"
              placeholder="Detailed global sourcing terms, standard specifications or delivery instructions..."
            />
          </div>
        </div>
      </AntCard>

      <div className="flex justify-between">
        <div />
        <AntButton type="primary" size="large" className="bg-blue-600 font-bold" onClick={handleNext}>
          Next Step →
        </AntButton>
      </div>
    </div>
  );
};


// ============================================================================
// STEP 2: LINE ITEMS
// ============================================================================

interface RfqLineItemsStepProps {
  initialItems: any[];
  activePartyId: string;
  onPrev: (items: any[]) => void;
  onNext: (items: any[]) => void;
}

const RfqLineItemsStep: React.FC<RfqLineItemsStepProps> = ({ initialItems, activePartyId, onPrev, onNext }) => {
  const { message: antMessage } = AntApp.useApp();
  const [items, setItems] = useState<any[]>(initialItems);
  const [activeDrawerIndex, setActiveDrawerIndex] = useState<number | null>(null);
  const [previewProduct, setPreviewProduct] = useState<{ sellerProduct: any; variant: any; drawerIndex: number } | null>(null);
  const [variantPage, setVariantPage] = useState<number>(1);
  const VARIANTS_PER_PAGE = 10;

  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const allCategories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allMasterProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];
  const allSellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray(), []) || [];
  const allAttributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allParties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];

  const leafCategories = useMemo(
    () => allCategories.filter((c) => c.mappedGroupIds && c.mappedGroupIds.length > 0),
    [allCategories]
  );

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

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      category_id: undefined,
      master_product_id: undefined,
      quantity: 1,
      unit_of_measure: 'Units',
      brand_id: undefined,
      manufacturer_id: undefined,
      selected_dynamic_attributes: [],
      target_seller_party_ids: [],
    };
    setItems((prev) => [...prev, newItem]);
    setActiveDrawerIndex(items.length);
    antMessage.info('Line item added. Fill in details.');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    antMessage.info('Line item removed');
  };

  const handleNext = () => {
    if (items.length === 0) {
      antMessage.error('Please add at least one line item before proceeding');
      return;
    }
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item.category_id || !item.quantity) {
        antMessage.error(`Line Item #${idx + 1} requires a Category and Quantity`);
        return;
      }
    }
    onNext(items);
  };

  return (
    <div className="space-y-6">
      <AntCard className="shadow-sm border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 m-0">Line Items ({items.length})</h3>
            <p className="text-xs text-slate-500">Configure item-wise static specs, dynamic category attributes, targeted catalog SKUs, or open RFQ seller assignments.</p>
          </div>
          <AntButton type="primary" onClick={handleAddItem} icon={<AntPlusOutlined />} className="bg-blue-600">
            Add Item
          </AntButton>
        </div>

        <AntTable
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
                const hasTargetSellers = record.target_seller_party_ids && record.target_seller_party_ids.length > 0;
                return (
                  <div className="space-y-1">
                    <div>
                      <AntTag color="blue" icon={<AntAppstoreOutlined />}>Open Spec RFQ</AntTag>
                    </div>
                    <div className="text-[11px]">
                      {hasTargetSellers ? (
                        <AntTag color="purple">{record.target_seller_party_ids.length} Direct Sellers</AntTag>
                      ) : (
                        <AntTag color="cyan" icon={<AntGlobalOutlined />}>Open Marketplace</AntTag>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              title: 'Item Category & Details',
              render: (_, record) => {
                const cat = leafCategories.find((c) => c.id === record.category_id);
                const mProd = allMasterProducts.find((p) => p.id === record.master_product_id);
                return (
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{cat?.name || record.category_id || <span className="text-slate-400 italic">No Category</span>}</div>
                    {(mProd) && (
                      <div className="text-xs text-slate-500">
                        {mProd && <span>Master: {mProd.name}</span>}
                      </div>
                    )}
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
                </div>
              ),
            },
            {
              title: 'Action',
              width: 160,
              render: (_, __, index) => (
                <div className="flex items-center gap-2">
                  <AntButton size="small" type="dashed" icon={<AntSettingOutlined />} onClick={() => { setActiveDrawerIndex(index); setVariantPage(1); }}>
                    Configure
                  </AntButton>
                  <AntPopconfirm title="Remove this line item?" onConfirm={() => handleRemoveItem(index)}>
                    <AntButton size="small" danger type="text" icon={<AntDeleteOutlined />} />
                  </AntPopconfirm>
                </div>
              ),
            },
          ]}
        />
      </AntCard>

      <div className="flex justify-between">
        <AntButton size="large" onClick={() => onPrev(items)}>
          Back
        </AntButton>
        <AntButton type="primary" size="large" className="bg-blue-600 font-bold" onClick={handleNext}>
          Next Step →
        </AntButton>
      </div>

      {/* ITEM CONFIGURATION DRAWER */}
      <AntDrawer
        title={
          <div className="flex items-center justify-between pr-8">
            <span className="font-bold text-slate-900">
              Configure Line Item #{activeDrawerIndex !== null ? activeDrawerIndex + 1 : ''} Specifications
            </span>
            {activeDrawerIndex !== null && items[activeDrawerIndex]?.variant_id && (
              <AntTag color="green" icon={<AntAimOutlined />}>Targeted Variant Mode</AntTag>
            )}
          </div>
        }
        width={960}
        onClose={() => setActiveDrawerIndex(null)}
        open={activeDrawerIndex !== null}
        destroyOnClose
        extra={
          <AntButton type="primary" onClick={() => setActiveDrawerIndex(null)} className="bg-blue-600">
            Done
          </AntButton>
        }
      >
        {activeDrawerIndex !== null && (() => {
          const item = items[activeDrawerIndex];
          if (!item) return null;

          const categoryAttributeTree = getCategoryAttributeTree(item.category_id);

          const filteredMasterProducts = item.category_id
            ? allMasterProducts.filter((p) => p.categoryId === item.category_id)
            : allMasterProducts;

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

          return (
            <div className="w-full max-w-4xl mx-auto space-y-6">
              <div className="space-y-6">

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #3b82f6` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#3b82f614` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white bg-blue-500">
                        1
                      </span>
                      <h4 className="text-md font-bold text-slate-800">Basic Parameters & Catalog Mapping</h4>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Leaf Category *</label>
                      <AntSelect
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
                      <AntSelect
                        allowClear
                        placeholder="Select Master Product"
                        value={item.master_product_id}
                        onChange={(masterProdId) => {
                          const updated = [...items];
                          updated[activeDrawerIndex].master_product_id = masterProdId;
                          const mProd = allMasterProducts.find((p) => p.id === masterProdId);
                          if (mProd) {
                            updated[activeDrawerIndex].category_id = mProd.categoryId;
                          }
                          setItems(updated);
                          setVariantPage(1);
                        }}
                        className="w-full mt-1"
                        options={filteredMasterProducts.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))}
                      />
                    </div>


                    <div>
                      <label className="text-xs font-semibold text-slate-700">Quantity *</label>
                      <AntInput
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

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Unit of Measure</label>
                      <AntSelect
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

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #8b5cf6` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#8b5cf614` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#8b5cf6' }}>
                        2
                      </span>
                      <h4 className="text-md font-bold text-slate-800">Static Specs & Physical Dimensions</h4>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Preferred Brand(s)</label>
                      <AntSelect
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
                      <AntSelect
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
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #f59e0b` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#f59e0b14` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#f59e0b' }}>
                        3
                      </span>
                      <h4 className="text-md font-bold text-slate-800">Master Taxonomy Mapped Attributes</h4>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">

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
                              (s: any) => s.attribute_id === attr.id
                            );
                            const selectedValueIds = existingSelection?.selected_value_ids || [];

                            return (
                              <div key={attr.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-slate-700">{attr.name}</label>
                                  {selectedValueIds.length > 1 && (
                                    <AntSelect
                                      size="small"
                                      value={existingSelection?.connector || 'OR'}
                                      onChange={(conn) => {
                                        const updated = [...items];
                                        const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                        const idx = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                        if (idx >= 0) {
                                          dynAttrs[idx].connector = conn;
                                          updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                          setItems(updated);
                                        }
                                      }}
                                      options={[
                                        { label: 'Match ANY (OR)', value: 'OR' },
                                        { label: 'Match ALL (AND)', value: 'AND' }
                                      ]}
                                      className="w-40 text-[10px]"
                                    />
                                  )}
                                </div>
                                <AntSelect
                                  mode="multiple"
                                  value={selectedValueIds}
                                  placeholder={`Select ${attr.name}`}
                                  onChange={(selectedValIds) => {
                                    const updated = [...items];
                                    const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                    const idx = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                    if (idx >= 0) {
                                      dynAttrs[idx] = { ...dynAttrs[idx], selected_value_ids: selectedValIds };
                                    } else {
                                      dynAttrs.push({ group_id: group.groupId, attribute_id: attr.id, selected_value_ids: selectedValIds, connector: 'OR' });
                                    }
                                    updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                    setItems(updated);
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
              </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #10b981` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#10b98114` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#10b981' }}>
                        4
                      </span>
                      <h4 className="text-md font-bold text-slate-800">Target Seller Scope</h4>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm m-0">Supplier Reach</h4>
                    {(!item.target_seller_party_ids || item.target_seller_party_ids.length === 0) ? (
                      <AntTag color="cyan" icon={<AntGlobalOutlined />}>Open RFQ (All Marketplace Sellers)</AntTag>
                    ) : (
                      <AntTag color="purple">{item.target_seller_party_ids.length} Selected Sellers</AntTag>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Leave empty to make this line item an Open RFQ for all verified marketplace suppliers, or select specific target sellers for direct invitations.
                  </p>
                  <AntSelect
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
            </div>
          </div>
          );
        })()}
      </AntDrawer>
    </div>
  );
};


// ============================================================================
// STEP 3: REVIEW & SUBMIT
// ============================================================================

interface RfqReviewSubmitStepProps {
  globalDetails: any;
  items: any[];
  isBusinessContext: boolean;
  activePartyId: string;
  activePartyName: string;
  currentUser: any;
  currentUserId: string;
  basePath: string;
  allParties: any[];
  onPrev: () => void;
  onSuccess: (newRfqId: string) => void;
}

const RfqReviewSubmitStep: React.FC<RfqReviewSubmitStepProps> = ({
  globalDetails,
  items,
  isBusinessContext,
  activePartyId,
  activePartyName,
  currentUser,
  currentUserId,
  basePath,
  allParties,
  onPrev,
  onSuccess,
}) => {
  const { message: antMessage } = AntApp.useApp();
  const [agreements, setAgreements] = useState({
    termsAgreed: false,
    shareContact: false,
    marketingConsent: false,
  });

  const handleIssueRfq = async () => {
    if (!agreements.termsAgreed || !agreements.shareContact) {
      antMessage.error('You must agree to the terms and consent to share contact details.');
      return;
    }

    try {
      const newRfqId = `rfq-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRfq: any = {
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
        status: 'PUBLISHED',
        published_at: new Date().toISOString(),
        submission_deadline: new Date(globalDetails.submission_deadline).toISOString(),
        total_items_count: items.length,
        currency: globalDetails.currency,
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


      const newRfqItems: any[] = [];
      const newRfqItemAttributes: RfqItemAttribute[] = [];
      const newQuotes: SellerQuote[] = [];

      items.forEach((item, idx) => {
        const itemId = `rfqi-${newRfqId}-${idx + 1}`;
        
        newRfqItems.push({
          id: itemId,
          rfq_id: newRfqId,
          item_index: idx + 1,
          status: 'OPEN',
          category_id: item.category_id || '',
          catalog_product_id: item.master_product_id || null,
          product_id: null,
          variant_id: null,
          req_quantity: item.quantity || 1,
          req_unit: item.unit_of_measure || 'Units',
          seller_assignments: (item.target_seller_party_ids || []).map((partyId: string, sIdx: number) => ({
            id: `sa-${newRfqId}-${idx + 1}-${sIdx + 1}`,
            rfq_item_id: itemId,
            seller_party_id: partyId,
            assignment_type: 'DIRECT_INVITATION',
            assigned_by_user_id: currentUserId || 'usr-2',
            assigned_at: new Date().toISOString(),
            status: 'ASSIGNED',
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // System Attributes
        if (item.brand_id && item.brand_id.length > 0) {
          newRfqItemAttributes.push({
            id: `attr-${itemId}-brand`,
            rfq_item_id: itemId,
            attribute_type: 'SYSTEM',
            group_id: 'system',
            attribute_id: 'brand',
            connector: 'OR',
            values: item.brand_id.map((b: string) => ({ value_id: b, value_label: b })),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (item.manufacturer_id && item.manufacturer_id.length > 0) {
          newRfqItemAttributes.push({
            id: `attr-${itemId}-mfg`,
            rfq_item_id: itemId,
            attribute_type: 'SYSTEM',
            group_id: 'system',
            attribute_id: 'manufacturer',
            connector: 'OR',
            values: item.manufacturer_id.map((m: string) => ({ value_id: m, value_label: m })),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        newRfqItemAttributes.push({
          id: `attr-${itemId}-qty`,
          rfq_item_id: itemId,
          attribute_type: 'SYSTEM',
          group_id: 'system',
          attribute_id: 'req_quantity',
          connector: 'AND',
          values: [
             { value_id: 'req-quantity', value_label: String(item.quantity || 1) },
             { value_id: 'req-quantity-unit', value_label: item.unit_of_measure || 'Units' }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Custom Dynamic Attributes
        if (item.selected_dynamic_attributes) {
          item.selected_dynamic_attributes.forEach((da: any, daIdx: number) => {
             if (da.selected_value_ids && da.selected_value_ids.length > 0) {
               newRfqItemAttributes.push({
                 id: `attr-${itemId}-custom-${daIdx}`,
                 rfq_item_id: itemId,
                 attribute_type: 'CUSTOM',
                 group_id: da.group_id,
                 attribute_id: da.attribute_id,
                 connector: da.connector || 'OR',
                 values: da.selected_value_ids.map((vid: string) => ({ value_id: vid, value_label: vid })),
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString(),
               });
             }
          });
        }

        // Generate Target Seller Quotes
        const targetSellers = item.target_seller_party_ids && item.target_seller_party_ids.length > 0
          ? item.target_seller_party_ids
          : allParties.filter((p: any) => p.id !== activePartyId).map((p: any) => p.id);

        targetSellers.forEach((sellerPartyId: string) => {
          newQuotes.push({
            id: `q-${itemId}-${sellerPartyId}`,
            rfq_item_id: itemId,
            seller_party_id: sellerPartyId,
            seller_quote_number: `SQ-${itemId.replace('rfqi-', '')}-${sellerPartyId.replace('pty-', '')}`,
            status: 'DRAFT',
            round: 1,
            offer_quantity: item.quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      });

      await rfqDb.rfqs.put(newRfq as Rfq);
      await rfqDb.rfq_items.bulkPut(newRfqItems as RfqItem[]);
      if (newRfqItemAttributes.length > 0) {
        await rfqDb.rfq_item_attributes.bulkPut(newRfqItemAttributes);
      }
      if (newQuotes.length > 0) {
        await rfqDb.seller_quotes.bulkPut(newQuotes);
      }

      antMessage.success('RFQ Container issued successfully!');
      onSuccess(newRfqId);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to issue RFQ container');
    }
  };

  return (
    <div className="space-y-6">
      <AntCard className="shadow-sm border-slate-200">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-slate-800">Review RFQ Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div><span className="text-slate-500">RFQ Title:</span> <div className="font-bold text-slate-900">{globalDetails.title}</div></div>
          <div><span className="text-slate-500">Deadline:</span> <div className="font-bold text-slate-900">{globalDetails.submission_deadline}</div></div>
          <div><span className="text-slate-500">Destination:</span> <div className="font-bold text-slate-900">{globalDetails.shipping_destination}</div></div>
          <div><span className="text-slate-500">Total Items:</span> <div className="font-bold text-blue-600">{items.length} Items</div></div>
        </div>

        <AntTable
          dataSource={items}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
          bordered
          columns={[
            { title: 'Item #', width: 70, render: (_, __, i) => i + 1 },
            { title: 'Sourcing Mode', width: 140, render: () => <AntTag color="blue">Open Spec</AntTag> },
            { title: 'Category', render: (_, r) => <span><strong>{r.category_id || 'N/A'}</strong></span> },
            { title: 'Quantity', width: 120, render: (_, r) => `${r.quantity} ${r.unit_of_measure}` },
          ]}
        />

        <div className="mt-8 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2">Confirm and Submit</h4>
          <AntCheckbox
            checked={agreements.termsAgreed}
            onChange={(e) => setAgreements({ ...agreements, termsAgreed: e.target.checked })}
          >
            I confirm that I have read and agree to the RFQ posting terms.
          </AntCheckbox>
          <br />
          <AntCheckbox
            checked={agreements.shareContact}
            onChange={(e) => setAgreements({ ...agreements, shareContact: e.target.checked })}
          >
            I agree to share my contact details with interested vendors.
          </AntCheckbox>
          <br />
          <AntCheckbox
            checked={agreements.marketingConsent}
            onChange={(e) => setAgreements({ ...agreements, marketingConsent: e.target.checked })}
          >
            I consent to receive marketing communications.
          </AntCheckbox>
        </div>
      </AntCard>

      <div className="flex justify-between">
        <AntButton size="large" onClick={onPrev}>
          Back
        </AntButton>
        <AntButton
          type="primary"
          size="large"
          className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8"
          onClick={handleIssueRfq}
          icon={<AntSendOutlined />}
        >
          Submit RFQ Container
        </AntButton>
      </div>
    </div>
  );
};
