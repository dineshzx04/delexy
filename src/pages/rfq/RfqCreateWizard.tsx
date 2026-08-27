import React, { useState, useMemo, useEffect } from 'react';
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
  Badge as AntBadge,
  FloatButton as AntFloatButton,
  Modal as AntModal,
  Descriptions as AntDescriptions,
  Grid as AntGrid,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Lucide from 'lucide-react';
import {
  FileTextOutlined as AntFileTextOutlined,
  AppstoreOutlined as AntAppstoreOutlined,
  CheckCircleOutlined as AntCheckCircleOutlined,
  PlusOutlined as AntPlusOutlined,
  SendOutlined as AntSendOutlined,
  ArrowLeftOutlined as AntArrowLeftOutlined,
  SettingOutlined as AntSettingOutlined,
  DeleteOutlined as AntDeleteOutlined,
  GlobalOutlined as AntGlobalOutlined,
  ToolOutlined as AntToolOutlined,
  ShopOutlined as AntShopOutlined,
  AimOutlined as AntAimOutlined,
} from '@ant-design/icons';
import {
  rfqDb,
  type Rfq,
  type RfqItem,
  type RfqItemAttribute,
  type SellerQuote,
  type SellerAssignment,
  type ItemAttributeValue,
} from '../../data/rfq';
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
    ? allParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId)
    : allParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId);

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
    <div className="  max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        {/* <AntButton icon={<AntArrowLeftOutlined />} onClick={() => navigate(basePath)}>
          Back to RFQs
        </AntButton> */}
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
            <label className="text-xs font-semibold text-slate-600">RFQ Title *</label>
            <AntInput
              size="large"
              placeholder="e.g. Q4 Enterprise Hardware Sourcing"
              value={details.title}
              onChange={(e) => setDetails({ ...details, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Currency *</label>
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
            <label className="text-xs font-semibold text-slate-600">Submission Deadline *</label>
            <AntInput
              type="date"
              size="large"
              value={details.submission_deadline}
              onChange={(e) => setDetails({ ...details, submission_deadline: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Contact Email *</label>
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
            <label className="text-xs font-semibold text-slate-600">Contact Mobile / Phone</label>
            <AntInput
              size="large"
              placeholder="+1-555-0199"
              value={details.contact_phone}
              onChange={(e) => setDetails({ ...details, contact_phone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Shipping Destination *</label>
            <AntInput
              size="large"
              placeholder="e.g. Warehouse 4, Central Procurement HQ"
              value={details.shipping_destination}
              onChange={(e) => setDetails({ ...details, shipping_destination: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Detailed Sourcing Specification / General Instructions</label>
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
  onPrev: (items: any[]) => void;
  onNext: (items: any[]) => void;
}

export interface ManufacturerBrandMapping {
  id: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  brand_id?: string;
  brand_name?: string;
}

const RfqLineItemsStep: React.FC<RfqLineItemsStepProps> = ({ initialItems, onPrev, onNext }) => {
  const { message: antMessage } = AntApp.useApp();
  const screens = AntGrid.useBreakpoint();
  const descriptionsLayout = screens.sm ? 'horizontal' : 'vertical';
  const [items, setItems] = useState<any[]>(initialItems);
  const [activeDrawerIndex, setActiveDrawerIndex] = useState<number | null>(null);
  const [variantPage, setVariantPage] = useState<number>(1);
  const [searchResults, setSearchResults] = useState<{ sellerProduct: any; variant: any }[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [viewingVariant, setViewingVariant] = useState<{ sellerProduct: any; variant: any } | null>(null);


  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allBrandParties = useLiveQuery(() => businessDb.brandParties.toArray(), []) || [];
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
      catalog_product_id: undefined,
      quantity: 1,
      unit_of_measure: 'Pcs',
      preferred_brand_manufacturers: [
        { id: `bm-${Date.now()}-1`, manufacturer_id: undefined, brand_id: undefined }
      ],
      selected_dynamic_attributes: [],
      target_seller_party_ids: [],
    };
    setItems((prev) => [...prev, newItem]);
    setActiveDrawerIndex(items.length);
    setSearchResults(null);
    antMessage.info('Line item added. Fill in details.');
  };

  useEffect(() => {
    if (activeDrawerIndex === null) {
      setSearchResults(null);
      return;
    }
    const item = items[activeDrawerIndex];
    if (!item || !item.category_id) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      let results: { sellerProduct: any; variant: any }[] = [];
      allSellerProducts.forEach(sp => {
        if (sp.category_id !== item.category_id) return;

        const mappings: ManufacturerBrandMapping[] = (item.preferred_brand_manufacturers || []).filter(
          (m: any) => m.manufacturer_id || m.brand_id
        );

        let mfgBrandMatch = true;
        if (mappings.length > 0) {
          mfgBrandMatch = mappings.some((m: any) => {
            const mfgMatch = !m.manufacturer_id || m.manufacturer_id === sp.manufacturer_id;
            const brandMatch = !m.brand_id || m.brand_id === sp.brand_id;
            return mfgMatch && brandMatch;
          });
        }

        if (!mfgBrandMatch) return;

        sp.variants?.forEach((variant: any) => {
          let variantMatches = true;

          if (item.selected_dynamic_attributes && item.selected_dynamic_attributes.length > 0) {
            for (const attrReq of item.selected_dynamic_attributes) {
              if (!attrReq.selected_value_ids || attrReq.selected_value_ids.length === 0) continue;

              const hasSpec = sp.specifications?.some((s: any) => s.attribute_id === attrReq.attribute_id && attrReq.selected_value_ids.includes(s.values[0]?.id));
              const hasComb = variant.combination_values?.some((c: any) => c.attribute_id === attrReq.attribute_id && attrReq.selected_value_ids.includes(c.value_id));

              if (!hasSpec && !hasComb) {
                variantMatches = false;
                break;
              }
            }
          }

          if (variantMatches) {
            results.push({ sellerProduct: sp, variant });
          }
        });
      });

      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeDrawerIndex, items, allSellerProducts]);

  const handleSelectVariant = (sellerProduct: any, variant: any) => {
    if (activeDrawerIndex === null) return;
    const updated = [...items];
    const current = updated[activeDrawerIndex];

    current.catalog_product_id = sellerProduct.catalog_product_id;
    current.product_id = sellerProduct.id;
    current.variant_id = variant.id;
    current.preferred_brand_manufacturers = [
      {
        id: `bm-${Date.now()}`,
        manufacturer_id: sellerProduct.manufacturer_id,
        brand_id: sellerProduct.brand_id
      }
    ];

    const snapshotAttrs: any[] = [];

    sellerProduct.specifications?.forEach((spec: any) => {
      snapshotAttrs.push({
        group_id: spec.group_id,
        attribute_id: spec.attribute_id,
        selected_value_ids: spec.values.map((v: any) => v.id),
        connector: 'OR'
      });
    });

    variant.combination_values?.forEach((comb: any) => {
      const existing = snapshotAttrs.find(s => s.attribute_id === comb.attribute_id);
      if (existing) {
        if (!existing.selected_value_ids.includes(comb.value_id)) {
          existing.selected_value_ids.push(comb.value_id);
        }
      } else {
        snapshotAttrs.push({
          group_id: comb.group_id,
          attribute_id: comb.attribute_id,
          selected_value_ids: [comb.value_id],
          connector: 'OR'
        });
      }
    });

    current.selected_dynamic_attributes = snapshotAttrs;
    setItems(updated);
    antMessage.success(`Selected variant ${variant.sku}`);
  };

  const renderSearchResults = () => {
    if (viewingVariant) {
      const { sellerProduct, variant } = viewingVariant;
      return (
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h3 className="text-md font-bold text-slate-800 leading-tight mt-3">
              {sellerProduct.product_name}
            </h3>
            <div className="text-sm text-slate-500 flex items-center gap-2 mt-2">
              <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-xs border border-slate-300 text-slate-700">SKU: {variant.sku}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 py-2 border-t border-slate-200 ">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-800 font-bold">Unit Price</div>
                <div className="text-lg text-emerald-600 font-bold">{variant.currency} {variant.price}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="text-xs font-bold text-slate-800 px-4 py-3 bg-slate-50 border-b border-slate-200">Seller & Brand Information</div>
              <AntTable
                showHeader={false}
                pagination={false}
                size="small"
                className="w-full"
                classNames={{
                  body: {
                    cell: "text-xs"
                  }
                }}
                columns={[
                  { dataIndex: 'label', key: 'label', width: '33.33%', render: (text: React.ReactNode) => <span className="text-slate-500">{text}</span> },
                  { dataIndex: 'value', key: 'value', render: (text: React.ReactNode) => <span className="font-semibold text-slate-800">{text}</span> }
                ]}
                dataSource={[
                  ...(sellerProduct.manufacturer_id ? [{
                    key: 'manufacturer',
                    label: <><AntToolOutlined className="mr-1" /> Manufacturer</>,
                    value: allManufacturers.find((m: any) => m.id === sellerProduct.manufacturer_id)?.company_name || sellerProduct.manufacturer_id
                  }] : []),
                  ...(sellerProduct.brand_id ? [{
                    key: 'brand',
                    label: <><AntAppstoreOutlined className="mr-1" /> Brand</>,
                    value: allBrands.find((b: any) => b.id === sellerProduct.brand_id)?.name || sellerProduct.brand_id
                  }] : []),
                  ...(sellerProduct.party_id ? [{
                    key: 'seller',
                    label: <><AntShopOutlined className="mr-1" /> Seller</>,
                    value: allParties.find((p: any) => p.id === sellerProduct.party_id)?.display_name || sellerProduct.seller_party_id
                  }] : []),
                ]}
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="text-xs font-bold text-slate-800 px-4 py-3 bg-slate-50 border-b border-slate-200">Variant Specifications</div>
              <AntTable
                showHeader={false}
                pagination={false}
                size="small"
                className="w-full"
                classNames={{ body: { cell: "text-xs" } }}
                columns={[
                  { dataIndex: 'label', key: 'label', width: '40%', render: (text: React.ReactNode) => <span className="text-slate-500">{text}</span> },
                  { dataIndex: 'value', key: 'value', render: (text: React.ReactNode) => <span className="font-semibold text-slate-800">{text}</span> }
                ]}
                dataSource={
                  variant.combination_values?.map((c: any, cIdx: number) => ({
                    key: cIdx,
                    label: c.attribute_name,
                    value: c.label
                  })) || []
                }
              />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="text-xs font-bold text-slate-800 px-4 py-3 bg-slate-50 border-b border-slate-200">Variant Specifications</div>
              <AntTable
                showHeader={false}
                pagination={false}
                size="small"
                className="w-full"
                classNames={{ body: { cell: "text-xs" } }}
                columns={[
                  { dataIndex: 'label', key: 'label', width: '40%', render: (text: React.ReactNode) => <span className="text-slate-500">{text}</span> },
                  { dataIndex: 'value', key: 'value', render: (text: React.ReactNode) => <span className="font-semibold text-slate-800">{text}</span> }
                ]}
                dataSource={
                  variant.combination_values?.map((c: any, cIdx: number) => ({
                    key: cIdx,
                    label: c.attribute_name,
                    value: c.label
                  })) || []
                }
              />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="text-xs font-bold text-slate-800 px-4 py-3 bg-slate-50 border-b border-slate-200">Variant Specifications</div>
              <AntTable
                showHeader={false}
                pagination={false}
                size="small"
                className="w-full"
                classNames={{ body: { cell: "text-xs" } }}
                columns={[
                  { dataIndex: 'label', key: 'label', width: '40%', render: (text: React.ReactNode) => <span className="text-slate-500">{text}</span> },
                  { dataIndex: 'value', key: 'value', render: (text: React.ReactNode) => <span className="font-semibold text-slate-800">{text}</span> }
                ]}
                dataSource={
                  variant.combination_values?.map((c: any, cIdx: number) => ({
                    key: cIdx,
                    label: c.attribute_name,
                    value: c.label
                  })) || []
                }
              />
            </div>

            {sellerProduct.specifications && sellerProduct.specifications.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="text-xs font-bold text-slate-800 px-4 py-3 bg-slate-50 border-b border-slate-200">Product Specifications</div>
                <AntTable
                  showHeader={false}
                  pagination={false}
                  size="small"
                  className="w-full"
                  classNames={{ body: { cell: "text-xs" } }}
                  columns={[
                    { dataIndex: 'label', key: 'label', width: '40%', render: (text: React.ReactNode) => <span className="text-slate-500">{text}</span> },
                    { dataIndex: 'value', key: 'value', render: (text: React.ReactNode) => <span className="font-semibold text-slate-800">{text}</span> }
                  ]}
                  dataSource={
                    sellerProduct.specifications.map((s: any, sIdx: number) => ({
                      key: sIdx,
                      label: allAttributes.find(a => a.id === s.attribute_id)?.name || s.attribute_id,
                      value: s.values.map((v: any) => allAttributeValues.find(av => av.id === v.id)?.label || v.label || v.id).join(', ')
                    }))
                  }
                />
              </div>
            )}

          </div>

          <div className="sticky bottom-0 bg-slate-50 pt-2 border-t border-slate-200 z-10 mt-auto flex gap-2">
            <AntButton
              size="medium"
              icon={<Lucide.ArrowLeft size={16} />}
              onClick={() => setViewingVariant(null)}
              className="w-full"
            >
              Back to Results
            </AntButton>
            <AntButton
              size="medium"
              variant='solid'
              color='blue'
              className="w-full  "
              onClick={() => {
                handleSelectVariant(sellerProduct, variant);
                setSearchModalOpen(false);
                setViewingVariant(null);
              }}
            >
              Select this Product
            </AntButton>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <AntAimOutlined className="text-blue-600" />
            Live Matching
          </h3>
          {isSearching && <AntBadge status="processing" text="Searching..." />}
        </div>

        {!searchResults ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm">
            Select a category to view variants.
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-slate-200 border-dashed rounded-xl bg-white">
            <div className="text-slate-400 mb-2">
              <AntFileTextOutlined className="text-3xl" />
            </div>
            <div className="text-slate-600 font-semibold">No matches found</div>
            <div className="text-slate-500 text-xs mt-1">Try relaxing your attribute constraints.</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              {searchResults.length} Results
            </div>
            <div className="space-y-2">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 border border-slate-200 rounded-xl bg-white hover:border-blue-400 transition-all flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 pr-16">
                      <div className="font-bold text-slate-800 text-xs leading-tight">{res.sellerProduct.product_name}</div>
                      {(res.sellerProduct.party_id || res.sellerProduct.seller_party_id) && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <AntShopOutlined className="text-slate-400" /> {allParties.find((p: any) => p.id === (res.sellerProduct.party_id || res.sellerProduct.seller_party_id))?.display_name || res.sellerProduct.party_id || res.sellerProduct.seller_party_id}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <AntButton type="default" size="small" className="text-blue-600 border-blue-600 text-[10px] font-semibold" onClick={() => setViewingVariant(res)}>
                        View
                      </AntButton>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">{res.variant.sku}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{res.variant.currency} {res.variant.price}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {res.variant.combination_values?.map((c: any, cIdx: number) => (
                      <AntTag key={cIdx} className="text-[10px] m-0 border-slate-200 text-slate-600 bg-slate-50">{c.attribute_name}: {c.label}</AntTag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
      if (!item.category_id || !item.catalog_product_id || !item.quantity) {
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
                      <AntTag color="blue" icon={<AntAppstoreOutlined />}>{record.variant_id ? "Variant Product" : "Open Spec"}</AntTag>
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
                const mProd = allMasterProducts.find((p) => p.id === record.catalog_product_id);
                return (
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{cat?.name || record.category_id || <span className="text-slate-400 italic">No Category</span>}</div>
                    {(mProd) && (
                      <div className="text-xs text-slate-500">
                        {mProd && <span>Product: {mProd.name}</span>}
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              title: 'Quantity',
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
                    Add Specifications
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
          <div className="flex items-center justify-between px-8">
            <span className="font-bold text-slate-900">
              #{activeDrawerIndex !== null ? activeDrawerIndex + 1 : ''} - Configure Line Item Specifications
            </span>
            {/* {activeDrawerIndex !== null && items[activeDrawerIndex]?.variant_id && (
              <AntTag color="green" icon={<AntAimOutlined />}>Product Selected</AntTag>
            )} */}
          </div>
        }
        size={1200}
        onClose={() => setActiveDrawerIndex(null)}
        open={activeDrawerIndex !== null}
        destroyOnHidden
        closable={false}
        classNames={{ body: "p-3", header: "p-2" }}
        extra={
          <div className="pr-3">
            <AntButton type="primary" onClick={() => setActiveDrawerIndex(null)} className="bg-blue-600">
              Done
            </AntButton>
          </div>
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

          const isVerifiedManufacturerBrandPair = (manufacturerId?: string, brandId?: string) => {
            if (!manufacturerId || !brandId) return true;
            const inSellerProducts = allSellerProducts.some(
              (sellerProduct: any) => sellerProduct.manufacturer_id === manufacturerId && sellerProduct.brand_id === brandId
            );
            if (inSellerProducts) return true;

            const mfgObj = allManufacturers.find((m: any) => m.id === manufacturerId);
            if (mfgObj?.manufacturer_party_id) {
              const inBrandParties = allBrandParties.some(
                (brandParty: any) => brandParty.brand_id === brandId && brandParty.party_id === mfgObj.manufacturer_party_id
              );
              if (inBrandParties) return true;
            }
            return false;
          };

          const getAvailableManufacturerOptionsForBrand = (selectedBrandId?: string) => {
            if (!selectedBrandId) return dynamicMfgOptions;

            const mfgIdsForBrand = new Set<string>();
            allSellerProducts.forEach((sellerProduct: any) => {
              if (sellerProduct.brand_id === selectedBrandId && sellerProduct.manufacturer_id) {
                mfgIdsForBrand.add(sellerProduct.manufacturer_id);
              }
            });

            const brandPartiesForBrand = allBrandParties.filter((brandParty: any) => brandParty.brand_id === selectedBrandId);
            const partyIds = new Set(brandPartiesForBrand.map((brandParty: any) => brandParty.party_id));
            allManufacturers.forEach((m: any) => {
              if (m.manufacturer_party_id && partyIds.has(m.manufacturer_party_id)) {
                mfgIdsForBrand.add(m.id);
              }
            });

            if (mfgIdsForBrand.size === 0) return dynamicMfgOptions;

            const brandObj = allBrands.find((b: any) => b.id === selectedBrandId);
            const brandName = brandObj?.name || selectedBrandId;

            const mappedOpts = Array.from(mfgIdsForBrand).map((mId: string) => {
              const m = allManufacturers.find((mfg: any) => mfg.id === mId);
              return { label: `${m?.company_name || mId}`, value: mId };
            });

            const otherOpts = allManufacturers
              .filter((m: any) => !mfgIdsForBrand.has(m.id))
              .map((m: any) => ({ label: m.company_name, value: m.id }));

            return [
              { label: `Available Manufacturers for ${brandName}`, options: mappedOpts },
              { label: `Other Manufacturers`, options: otherOpts },
            ].filter((g) => g.options.length > 0);
          };

          const getAvailableBrandOptionsForManufacturer = (selectedManufacturerId?: string) => {
            if (!selectedManufacturerId) return dynamicBrandOptions;

            const brandIdsForMfg = new Set<string>();
            allSellerProducts.forEach((sellerProduct: any) => {
              if (sellerProduct.manufacturer_id === selectedManufacturerId && sellerProduct.brand_id) {
                brandIdsForMfg.add(sellerProduct.brand_id);
              }
            });

            const selectedMfgObj = allManufacturers.find((m: any) => m.id === selectedManufacturerId);
            if (selectedMfgObj?.manufacturer_party_id) {
              const partyId = selectedMfgObj.manufacturer_party_id;
              const matchingBrandParties = allBrandParties.filter((brandParty: any) => brandParty.party_id === partyId);
              matchingBrandParties.forEach((brandParty: any) => {
                if (brandParty.brand_id) brandIdsForMfg.add(brandParty.brand_id);
              });
            }

            if (brandIdsForMfg.size === 0) return dynamicBrandOptions;

            const mfgObj = allManufacturers.find((m: any) => m.id === selectedManufacturerId);
            const mfgName = mfgObj?.company_name || selectedManufacturerId;

            const mappedOpts = Array.from(brandIdsForMfg).map((bId: string) => {
              const b = allBrands.find((brand: any) => brand.id === bId);
              return { label: `${b?.name || bId}`, value: bId };
            });

            const otherOpts = allBrands
              .filter((b: any) => !brandIdsForMfg.has(b.id))
              .map((b: any) => ({ label: b.name, value: b.id }));

            return [
              { label: `Available Brands for ${mfgName}`, options: mappedOpts },
              { label: `Other Brands`, options: otherOpts },
            ].filter((g) => g.options.length > 0);
          };

          return (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12">
              {/* Left Pane: Attributes Form */}
              <div className="lg:col-span-7 xl:col-span-8 overflow-y-auto rounded-xl lg:pr-2  ">
                <div className="w-full max-w-4xl mx-auto space-y-6 ">
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className=" border-b border-slate-200 px-4 py-3 bg-slate-50"  >
                        <AntAppstoreOutlined className="text-blue-600" /> Product Details
                      </div>
                      <div className="p-3">
                        <AntDescriptions layout={descriptionsLayout} bordered size="small" column={1} labelStyle={{ width: '40%', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '12px', color: '#475569' }} contentStyle={{ backgroundColor: '#ffffff' }}>

                          <AntDescriptions.Item label="Category *">
                            <AntSelect
                              allowClear
                              placeholder="Select Category"
                              value={item.category_id}
                              onChange={(catId) => {
                                const updated = [...items];
                                updated[activeDrawerIndex].category_id = catId;
                                updated[activeDrawerIndex].catalog_product_id = null;
                                updated[activeDrawerIndex].variant_id = null;
                                updated[activeDrawerIndex].product_id = null;
                                updated[activeDrawerIndex].selected_dynamic_attributes = [];
                                setItems(updated);
                                setVariantPage(1);
                              }}
                              className="w-full"
                              options={leafCategories.map((c) => ({ value: c.id, label: `${c.name} (${c.id})` }))}
                            />
                          </AntDescriptions.Item>
                          <AntDescriptions.Item label="Master Product *">
                            <AntSelect
                              allowClear
                              placeholder="Select Master Product"
                              value={item.catalog_product_id}
                              onChange={(masterProdId) => {
                                const updated = [...items];
                                updated[activeDrawerIndex].catalog_product_id = masterProdId;
                                const masterProd = allMasterProducts.find((p) => p.id === masterProdId);
                                if (masterProd) {
                                  updated[activeDrawerIndex].category_id = masterProd.categoryId;
                                }
                                updated[activeDrawerIndex].variant_id = null;
                                updated[activeDrawerIndex].product_id = null;
                                setItems(updated);
                                setVariantPage(1);
                              }}
                              className="w-full"
                              options={filteredMasterProducts.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` }))}
                            />
                          </AntDescriptions.Item>
                          <AntDescriptions.Item label="Quantity *">
                            <AntInput
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...items];
                                updated[activeDrawerIndex].quantity = Number(e.target.value) || 1;
                                setItems(updated);
                              }}
                              className="w-full"
                            />
                          </AntDescriptions.Item>
                          <AntDescriptions.Item label="Unit of Measure">
                            <AntSelect
                              value={item.unit_of_measure}
                              onChange={(val) => {
                                const updated = [...items];
                                updated[activeDrawerIndex].unit_of_measure = val;
                                setItems(updated);
                              }}
                              className="w-full"
                              options={[
                                { label: 'Pcs', value: 'Pcs' },
                                { label: 'Kg', value: 'Kg' },
                                { label: 'Boxes', value: 'Boxes' },
                              ]}
                            />
                          </AntDescriptions.Item>
                        </AntDescriptions>
                      </div>
                    </div>

                    {!!item.category_id && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #2a79adff` }}>
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#2a79ad14` }}>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#2a79adff' }}>
                              1
                            </span>
                            <h4 className="text-xs font-semibold text-slate-800">Manufacturer & Brand</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <AntTag color="default" style={{ borderColor: "#2a79adff", color: "#2a79adff", fontWeight: 700 }}>
                              {(item.preferred_brand_manufacturers || []).length} Manufacturer & Brand Pair(s)
                            </AntTag>
                          </div>
                        </div>
                        <div className="p-3 space-y-3">
                          {(!item.preferred_brand_manufacturers ||
                            item.preferred_brand_manufacturers.length === 0) ? (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-600">
                                  No Manufacturer & Brand preference set
                                </div>
                                <div className="truncate text-[10px] text-slate-400">
                                  All manufacturers and brands accepted
                                </div>
                              </div>

                              <AntButton
                                size="small"
                                type="dashed"
                                icon={<AntPlusOutlined />}
                                className="shrink-0"
                                onClick={() => {
                                  const updated = [...items];

                                  updated[activeDrawerIndex].preferred_brand_manufacturers ??= [];

                                  updated[activeDrawerIndex].preferred_brand_manufacturers.push({
                                    id: `bm-${Date.now()}`,
                                    manufacturer_id: undefined,
                                    brand_id: undefined
                                  });

                                  setItems(updated);
                                }}
                              >
                                Add Pair
                              </AntButton>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {item.preferred_brand_manufacturers.map(
                                (mfgBrandPair: ManufacturerBrandMapping, pairIndex: number) => (
                                  <div
                                    key={mfgBrandPair.id || pairIndex}
                                    className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm"
                                  >
                                    {/* Header */}
                                    <div className="mb-2 flex items-center justify-between">
                                      <div className="flex min-w-0 items-center gap-1.5">
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
                                          {pairIndex + 1}
                                        </span>

                                        <span className="truncate text-[11px] font-semibold text-slate-700">
                                          Manufacturer × Brand
                                        </span>
                                      </div>

                                      {item.preferred_brand_manufacturers.length > 1 && (
                                        <AntButton
                                          type="text"
                                          danger
                                          size="small"
                                          className="!h-6 !w-6 !p-0"
                                          icon={<Lucide.Trash2 size={13} />}
                                          onClick={() => {
                                            const updated = [...items];
                                            if (updated[activeDrawerIndex].preferred_brand_manufacturers.length > 1) {
                                              updated[activeDrawerIndex].preferred_brand_manufacturers =
                                                updated[activeDrawerIndex].preferred_brand_manufacturers.filter(
                                                  (_: any, idx: number) => idx !== pairIndex
                                                );
                                              setItems(updated);
                                            }
                                          }}
                                        />
                                      )}
                                    </div>

                                    {/* Manufacturer + Brand */}
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {/* Manufacturer */}
                                      <div className="min-w-0">
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                          Manufacturer
                                        </label>

                                        <AntSelect
                                          allowClear
                                          showSearch
                                          optionFilterProp="label"
                                          placeholder="Select manufacturer"
                                          value={mfgBrandPair.manufacturer_id}
                                          onChange={(val: string) => {
                                            const updated = [...items];
                                            const pair =
                                              updated[activeDrawerIndex]
                                                .preferred_brand_manufacturers[pairIndex];

                                            pair.manufacturer_id = val;

                                            if (val && pair.brand_id && !isVerifiedManufacturerBrandPair(val, pair.brand_id)) {
                                              pair.brand_id = undefined;
                                            }

                                            updated[activeDrawerIndex].variant_id = null;
                                            updated[activeDrawerIndex].product_id = null;

                                            setItems(updated);
                                          }}
                                          options={getAvailableManufacturerOptionsForBrand(mfgBrandPair.brand_id)}
                                          className="w-full"
                                          popupMatchSelectWidth={false}
                                        />
                                      </div>

                                      {/* Brand */}
                                      <div className="min-w-0">
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                          Brand
                                        </label>

                                        <AntSelect
                                          allowClear
                                          showSearch
                                          optionFilterProp="label"
                                          placeholder="Select brand"
                                          value={mfgBrandPair.brand_id}
                                          onChange={(val: string) => {
                                            const updated = [...items];
                                            const pair =
                                              updated[activeDrawerIndex]
                                                .preferred_brand_manufacturers[pairIndex];

                                            pair.brand_id = val;

                                            if (
                                              val &&
                                              pair.manufacturer_id &&
                                              !isVerifiedManufacturerBrandPair(pair.manufacturer_id, val)
                                            ) {
                                              pair.manufacturer_id = undefined;
                                            }

                                            updated[activeDrawerIndex].variant_id = null;
                                            updated[activeDrawerIndex].product_id = null;

                                            setItems(updated);
                                          }}
                                          options={getAvailableBrandOptionsForManufacturer(mfgBrandPair.manufacturer_id)}
                                          className="w-full"
                                          popupMatchSelectWidth={false}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}

                              {/* Add button */}
                              <AntButton
                                type="dashed"
                                size="small"
                                icon={<AntPlusOutlined />}
                                className="!h-8 w-full !text-xs"
                                onClick={() => {
                                  const updated = [...items];

                                  updated[activeDrawerIndex].preferred_brand_manufacturers ??= [];

                                  updated[activeDrawerIndex].preferred_brand_manufacturers.push({
                                    id: `bm-${Date.now()}`,
                                    manufacturer_id: undefined,
                                    brand_id: undefined
                                  });

                                  setItems(updated);
                                }}
                              >
                                Add Pair
                              </AntButton>

                              {/* Global Note / Description for Manufacturer & Brand Mappings */}
                              {(item.mfg_brand_show_description || item.mfg_brand_description) ? (
                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                                  <AntInput
                                    size="small"
                                    placeholder="Can add note for Manufacturer & Brand"
                                    value={item.mfg_brand_description || ''}
                                    onChange={(e) => {
                                      const updated = [...items];
                                      updated[activeDrawerIndex].mfg_brand_description = e.target.value;
                                      setItems(updated);
                                    }}
                                    className="text-xs bg-slate-50 border-slate-200"
                                  />
                                  <AntButton
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<Lucide.Trash2 size={14} />}
                                    onClick={() => {
                                      const updated = [...items];
                                      updated[activeDrawerIndex].mfg_brand_description = '';
                                      updated[activeDrawerIndex].mfg_brand_show_description = false;
                                      setItems(updated);
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="text-[10px] text-blue-600 cursor-pointer hover:underline self-start font-medium flex items-center gap-1 mt-2"
                                  onClick={() => {
                                    const updated = [...items];
                                    updated[activeDrawerIndex].mfg_brand_show_description = true;
                                    setItems(updated);
                                  }}
                                >
                                  <AntPlusOutlined /> Add Note / Description
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!item.category_id ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-amber-700 italic font-semibold">Select a Category above (or choose a Master Product) to load attributes.</div>
                      </div>
                    ) : categoryAttributeTree.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 italic">No attributes defined for this category.</div>
                      </div>
                    ) : (
                      categoryAttributeTree.map((group: any, idx: number) => {
                        const accentColor = ['#527EA3', '#5D9365', '#C9825A', '#8975A8'][(idx + 1) % 4];
                        return (
                          <div key={group.groupId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid ${accentColor}` }}>
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `${accentColor}14` }}>
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: accentColor }}>
                                  {idx + 2}
                                </span>
                                <h4 className="text-xs font-semibold text-slate-800">{group.groupName}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <AntTag color="default" style={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}>
                                  {group.attributes?.length || 0} attributes
                                </AntTag>
                              </div>
                            </div>
                            <div className="p-3">
                              <AntDescriptions layout={descriptionsLayout} bordered size="small" column={1} labelStyle={{ width: '40%', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '12px', color: '#475569' }} contentStyle={{ backgroundColor: '#ffffff' }}>
                                {group.attributes.map((attr: any) => {
                                  const existingSelection = (item.selected_dynamic_attributes || []).find((s: any) => s.attribute_id === attr.id);
                                  const selectedValueIds = existingSelection?.selected_value_ids || [];

                                  return (
                                    <AntDescriptions.Item
                                      key={attr.id}
                                      label={
                                        <div className="flex flex-col gap-1">
                                          <span>{attr.name}</span>
                                          {selectedValueIds.length > 1 && (
                                            <AntSelect
                                              size="small"
                                              value={existingSelection?.connector || 'OR'}
                                              onChange={(conn) => {
                                                const updated = [...items];
                                                const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                                const index = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                                if (index >= 0) {
                                                  dynAttrs[index].connector = conn;
                                                  updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                                  setItems(updated);
                                                }
                                              }}
                                              options={[
                                                { label: 'Match ANY (OR)', value: 'OR' },
                                                { label: 'Match ALL (AND)', value: 'AND' }
                                              ]}
                                              className="w-full text-[10px]"
                                            />
                                          )}
                                        </div>
                                      }
                                    >
                                      <div className="flex flex-col gap-2">
                                        <AntSelect
                                          mode="multiple"
                                          allowClear
                                          value={selectedValueIds}
                                          variant='underlined'
                                          maxTagCount={"responsive"}
                                          placeholder={`Select ${attr.name}`}
                                          onChange={(selectedValIds) => {
                                            const updated = [...items];
                                            const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                            const index = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                            if (index >= 0) {
                                              dynAttrs[index] = { ...dynAttrs[index], selected_value_ids: selectedValIds };
                                            } else {
                                              dynAttrs.push({ group_id: group.groupId, attribute_id: attr.id, selected_value_ids: selectedValIds, connector: 'OR' });
                                            }
                                            updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                            updated[activeDrawerIndex].variant_id = null;
                                            updated[activeDrawerIndex].product_id = null;
                                            setItems(updated);
                                          }}
                                          className="w-full"
                                          options={attr.values.map((v: any) => ({ value: v.id, label: `${v.label}` }))}
                                        />
                                        {(existingSelection?.show_description || existingSelection?.description) ? (
                                          <div className="flex items-start gap-2 mt-1">
                                            <AntInput
                                              key={`desc-input-${activeDrawerIndex}-${attr.id}`}
                                              placeholder={`Can add note for ${attr.name}...`}
                                              defaultValue={existingSelection?.description || ''}
                                              onBlur={(e) => {
                                                const updated = [...items];
                                                const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                                const index = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                                if (index >= 0) {
                                                  dynAttrs[index] = { ...dynAttrs[index], description: e.target.value };
                                                } else {
                                                  dynAttrs.push({ group_id: group.groupId, attribute_id: attr.id, selected_value_ids: [], connector: 'OR', description: e.target.value, show_description: true });
                                                }
                                                updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                                setItems(updated);
                                              }}
                                              size="small"
                                              className="text-xs bg-slate-50 border-slate-200"
                                            />
                                            <AntButton
                                              type="text"
                                              size="small"
                                              danger
                                              icon={<Lucide.Trash2 size={14} />}
                                              onClick={() => {
                                                const updated = [...items];
                                                const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                                const index = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                                if (index >= 0) {
                                                  dynAttrs[index] = { ...dynAttrs[index], description: '', show_description: false };
                                                  updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                                  setItems(updated);
                                                }
                                              }}
                                            />
                                          </div>
                                        ) : (
                                          <div
                                            className="text-[10px] text-blue-600 cursor-pointer hover:underline self-start font-medium flex items-center gap-1 mt-0.5"
                                            onClick={() => {
                                              const updated = [...items];
                                              const dynAttrs: any[] = [...(updated[activeDrawerIndex].selected_dynamic_attributes || [])];
                                              const index = dynAttrs.findIndex((s) => s.attribute_id === attr.id);
                                              if (index >= 0) {
                                                dynAttrs[index] = { ...dynAttrs[index], show_description: true };
                                              } else {
                                                dynAttrs.push({ group_id: group.groupId, attribute_id: attr.id, selected_value_ids: [], connector: 'OR', show_description: true });
                                              }
                                              updated[activeDrawerIndex].selected_dynamic_attributes = dynAttrs;
                                              setItems(updated);
                                            }}
                                          >
                                            <AntPlusOutlined /> Add Note / Description
                                          </div>
                                        )}
                                      </div>
                                    </AntDescriptions.Item>
                                  );
                                })}
                              </AntDescriptions>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {!!item.category_id && (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className=" border-b border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between"  >
                          <div className="flex items-center gap-2">
                            <AntAimOutlined className="text-blue-600" /> Target Sellers
                          </div>
                          {(!item.target_seller_party_ids || item.target_seller_party_ids.length === 0) ? (
                            <AntTag color="cyan" icon={<AntGlobalOutlined />}>Open RFQ (All Marketplace Sellers)</AntTag>
                          ) : (
                            <AntTag color="purple">{item.target_seller_party_ids.length} Selected Sellers</AntTag>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 px-3 py-2 m-0">
                          (Leave empty to make this line item an Open RFQ for all verified marketplace suppliers, or select specific target sellers for direct invitations.)
                        </p>
                        <div className="px-3 pb-3">
                          <AntSelect
                            mode="multiple"
                            allowClear
                            placeholder="Select Preferred Seller (or leave empty for Open RFQ)"
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
                    )}
                    {item.variant_id && (
                      <div className='bg-white sticky bottom-0 z-100'>
                        <div className=" p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AntCheckCircleOutlined className="text-blue-600 text-lg" />
                            <div>
                              <div className="text-sm font-bold text-blue-900">Catalog Variant Selected</div>
                              <div className="text-xs text-blue-700">The RFQ item is now populated with the specifications of the selected product variant.</div>
                            </div>
                          </div>
                          <AntButton
                            size="medium"
                            variant='dashed'
                            color='danger'
                            onClick={() => {
                              const updated = [...items];
                              updated[activeDrawerIndex].variant_id = null;
                              updated[activeDrawerIndex].product_id = null;
                              updated[activeDrawerIndex].catalog_product_id = null;
                              setItems(updated);
                            }}>Clear Selected variant</AntButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane: Desktop Live Search Results */}
              <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col pl-2 h-full sticky top-0 bg-white overflow-y-auto">
                <div className='h-full p-2 border border-slate-200 rounded-xl'>
                  {renderSearchResults()}
                </div>
              </div>

              {/* Mobile Float Button */}
              <AntFloatButton
                className="lg:hidden w-12"
                type="primary"
                onClick={() => setSearchModalOpen(true)}
                badge={{ count: searchResults?.length || 0, color: 'blue' }}
                style={{ zIndex: 1050, bottom: '100px', right: '50px', }}
                icon={<AntAimOutlined />}
                content="Results"
                shape="square"
              />

              {/* Mobile Nested Search Modal */}
              <AntModal
                title={null}
                footer={null}
                closable={{
                  afterClose: () => {
                    setSearchModalOpen(false); setViewingVariant(null);
                  }
                }}
                onCancel={() => { setSearchModalOpen(false); setViewingVariant(null); }}
                open={searchModalOpen}
                className="lg:hidden"
                styles={{ body: { padding: 0, height: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
                width="100%"
                style={{ top: 20, margin: 0, maxWidth: '100vw', padding: 16 }}
              >
                {/* <div className="absolute top-2 right-2 z-10">
                  <AntButton type="text" shape="circle" onClick={() => { setSearchModalOpen(false); setViewingVariant(null); }} className="bg-white/80 hover:bg-slate-200">
                    <span className="text-xl">&times;</span>
                  </AntButton>
                </div> */}
                {renderSearchResults()}
              </AntModal>
            </div>
          );
        })()}
      </AntDrawer>
    </div >
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

  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allCategories = useLiveQuery(() => catalogDb.categories.toArray(), []) || [];
  const allMasterProducts = useLiveQuery(() => catalogDb.products.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];

  const screens = AntGrid.useBreakpoint();
  const descriptionsLayout = screens.sm ? 'horizontal' : 'vertical';

  const [viewItemIndex, setViewItemIndex] = useState<number | null>(null);

  const handleIssueRfq = async () => {
    if (!agreements.termsAgreed || !agreements.shareContact) {
      antMessage.error('You must agree to the terms and consent to share contact details.');
      return;
    }
    if (!currentUserId) {
      antMessage.error('You must be logged in to issue an RFQ.');
      return;
    }
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item.category_id || !item.catalog_product_id) {
        antMessage.warning(`Line Item #${idx + 1} requires a Category and Product ID.`);
        return;
      }
    }

    try {
      const now = new Date().toISOString();
      const newRfqId = `rfq-${Date.now()}`;
      const rfqNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRfq: Rfq = {
        id: newRfqId,
        rfq_number: rfqNumber,
        title: globalDetails.title,
        description: globalDetails.description || undefined,
        status: 'ISSUED',
        requester_id: activePartyId,
        requester_name: activePartyName,
        requester_party_id: activePartyId,
        requester_party_type: isBusinessContext ? 'BUSINESS' : 'USER',
        created_by_user_id: currentUserId || 'usr-2',
        contact_email: globalDetails.contact_email || undefined,
        contact_phone: globalDetails.contact_phone || undefined,
        shipping_destination: globalDetails.shipping_destination || undefined,
        submission_deadline: globalDetails.submission_deadline
          ? new Date(globalDetails.submission_deadline).toISOString()
          : now,
        currency: globalDetails.currency || 'USD',
        created_at: now,
        updated_at: now,
      };

      const newRfqItems: RfqItem[] = [];
      const newRfqItemAttributes: RfqItemAttribute[] = [];
      const newQuotes: SellerQuote[] = [];

      items.forEach((item, idx) => {
        const itemId = `${newRfqId}-rfqi-${idx + 1}`;

        // Determine target sellers for this item
        const targetSellers: string[] =
          item.target_seller_party_ids && item.target_seller_party_ids.length > 0
            ? item.target_seller_party_ids
            : allParties.filter((p: any) => p.id !== activePartyId).map((p: any) => p.id);

        const sellerAssignments: SellerAssignment[] = targetSellers.map((partyId: string) => ({
          rfq_item_id: itemId,
          seller_party_id: partyId,
          assignment_type: item.target_seller_party_ids && item.target_seller_party_ids.length > 0
            ? 'DIRECT_INVITATION'
            : "PUBLIC_MARKETPLACE",
          assigned_by_user_id: currentUserId,
          assigned_at: now,
        }));

        newRfqItems.push({
          id: itemId,
          item_index: idx + 1,
          rfq_id: newRfqId,
          category_id: item.category_id,
          catalog_product_id: item.catalog_product_id,
          product_id: item.product_id || null,
          variant_id: item.variant_id || null,
          req_quantity: Number(item.quantity) || 1,
          req_unit: item.unit_of_measure || 'Pcs',
          status: 'OPEN',
          seller_assignments: sellerAssignments,
          created_at: now,
          updated_at: now,
        });

        // 1. System Attribute: Manufacturer & Brand Mapped Pairs
        const mappings: ManufacturerBrandMapping[] = item.preferred_brand_manufacturers || [];
        if (mappings.length > 0) {
          const mappingValues: ItemAttributeValue[] = mappings.map((m: any) => {
            const matchedMfg = allManufacturers.find((mfg) => mfg.id === m.manufacturer_id);
            const matchedBrand = allBrands.find((b) => b.id === m.brand_id);
            const mfgLabel = matchedMfg?.company_name || m.manufacturer_name || m.manufacturer_id || 'Any Manufacturer';
            const brandLabel = matchedBrand?.name || m.brand_name || m.brand_id || 'Any Brand';

            return {
              value_id: `${m.manufacturer_id || 'any'}:${m.brand_id || 'any'}`,
              value_label: `${mfgLabel} — ${brandLabel}`,
            };
          });

          newRfqItemAttributes.push({
            id: `ia-${itemId}-mfg-brand-mapping`,
            rfq_item_id: itemId,
            attribute_type: 'SYSTEM',
            group_id: 'system',
            attribute_id: 'mfg_brand_mapping',
            description: item.mfg_brand_description || '',
            connector: 'OR',
            values: mappingValues,
            created_at: now,
            updated_at: now,
          });
        }

        // 2. Custom Dynamic Attributes
        if (item.selected_dynamic_attributes && Array.isArray(item.selected_dynamic_attributes)) {
          item.selected_dynamic_attributes.forEach((da: any, daIdx: number) => {
            if ((da.selected_value_ids && da.selected_value_ids.length > 0) || (da.description && da.description.trim() !== '')) {
              const dynamicValues: ItemAttributeValue[] = (da.selected_value_ids || []).map((vid: string) => {
                const matchedVal = allAttributeValues.find((v) => v.id === vid);
                return {
                  value_id: vid,
                  value_label: matchedVal?.label || vid,
                };
              });

              newRfqItemAttributes.push({
                id: `ia-${itemId}-custom-${daIdx}`,
                rfq_item_id: itemId,
                attribute_type: 'CUSTOM',
                group_id: da.group_id,
                attribute_id: da.attribute_id,
                description: da.description || '',
                connector: (da.connector === 'AND' ? 'AND' : 'OR') as 'AND' | 'OR',
                values: dynamicValues,
                created_at: now,
                updated_at: now,
              });
            }
          });
        }

        // 3. Generate Initial Target Seller Quotes (DRAFT round 1)
        targetSellers.forEach((sellerPartyId: string) => {
          newQuotes.push({
            id: `q-${itemId}-${sellerPartyId}`,
            rfq_item_id: itemId,
            round: 1,
            seller_party_id: sellerPartyId,
            seller_quote_number: `SQ-${itemId}-${sellerPartyId.replace(/[^a-zA-Z0-9]/g, '')}`,
            offer_quantity: Number(item.quantity) || 1,
            offer_unit: item.unit_of_measure || 'Pcs',
            status: 'NOT_SUBMITTED',
            created_at: now,
            updated_at: now,
          });
        });
      });

      await rfqDb.transaction(
        'rw',
        [rfqDb.rfqs, rfqDb.rfq_items, rfqDb.rfq_item_attributes, rfqDb.seller_quotes],
        async () => {
          await rfqDb.rfqs.put(newRfq);
          await rfqDb.rfq_items.bulkPut(newRfqItems);
          if (newRfqItemAttributes.length > 0) {
            await rfqDb.rfq_item_attributes.bulkPut(newRfqItemAttributes);
          }
          if (newQuotes.length > 0) {
            await rfqDb.seller_quotes.bulkPut(newQuotes);
          }
        }
      );

      antMessage.success('RFQ Container issued successfully!');
      onSuccess(newRfqId);
    } catch (err) {
      console.error('Failed to issue RFQ container:', err);
      antMessage.error('Failed to issue RFQ container');
    }
  };

  return (
    <div className="space-y-6">
      <AntCard className="shadow-sm border-slate-200">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-slate-800">Review RFQ Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div><span className="text-slate-500 block text-xs">RFQ Title</span> <div className="font-bold text-slate-900">{globalDetails.title}</div></div>
          <div><span className="text-slate-500 block text-xs">Deadline</span> <div className="font-bold text-slate-900">{globalDetails.submission_deadline}</div></div>
          <div><span className="text-slate-500 block text-xs">Destination</span> <div className="font-bold text-slate-900">{globalDetails.shipping_destination}</div></div>
          <div><span className="text-slate-500 block text-xs">Contact Email</span> <div className="font-bold text-slate-900">{globalDetails.contact_email}</div></div>
          <div><span className="text-slate-500 block text-xs">Currency</span> <div className="font-bold text-slate-900">{globalDetails.currency}</div></div>
          <div><span className="text-slate-500 block text-xs">Total Items</span> <div className="font-bold text-blue-600">{items.length} Items</div></div>
        </div>

        <AntTable
          dataSource={items}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
          bordered
          columns={[
            { title: 'Item #', width: 70, render: (_, __, i) => i + 1 },
            {
              title: 'Category & Details',
              render: (_, r) => {
                const cat = allCategories.find((c) => c.id === r.category_id);
                const mProd = allMasterProducts.find((p) => p.id === r.catalog_product_id);
                return (
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{cat?.name || r.category_id || <span className="text-slate-400 italic">No Category</span>}</div>
                    {(mProd) && (
                      <div className="text-xs text-slate-500">
                        {mProd && <span>Master: {mProd.name}</span>}
                      </div>
                    )}
                  </div>
                );
              }
            },
            { title: 'Quantity', width: 120, render: (_, r) => `${r.quantity} ${r.unit_of_measure}` },
            { title: 'Sourcing Mode', width: 140, render: (_, r) => <AntTag color="blue">{r.variant_id ? "Variant Product" : "Open Spec"}</AntTag> },
            {
              title: 'Action',
              width: 100,
              render: (_, __, i) => (
                <AntButton size="small" type="primary" ghost onClick={() => setViewItemIndex(i)}>
                  View
                </AntButton>
              )
            }
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

      <AntModal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <AntAppstoreOutlined className="text-blue-600" />
            <span>Review Line Item #{viewItemIndex !== null ? viewItemIndex + 1 : ''}</span>
          </div>
        }
        open={viewItemIndex !== null}
        onCancel={() => setViewItemIndex(null)}
        footer={[
          <AntButton key="close" type="primary" className='mt-2' onClick={() => setViewItemIndex(null)}>
            Close
          </AntButton>
        ]}
        classNames={{
          container: "pb-2",
          footer: "border-t border-slate-200"
        }}
        width={800}
        destroyOnClose
      >
        {viewItemIndex !== null && items[viewItemIndex] && (() => {
          const item = items[viewItemIndex];
          const cat = allCategories.find((c) => c.id === item.category_id);
          const mProd = allMasterProducts.find((p) => p.id === item.catalog_product_id);
          return (
            <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3 bg-slate-50 flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <AntAppstoreOutlined className="text-blue-600" /> Product Details
                </div>
                <div className="p-3">
                  <AntDescriptions layout={descriptionsLayout} bordered size="small" column={1} labelStyle={{ width: '40%', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '12px', color: '#475569' }} contentStyle={{ backgroundColor: '#ffffff' }}>
                    <AntDescriptions.Item label="Category">
                      <span className="text-slate-900">{cat?.name || item.category_id}</span>
                    </AntDescriptions.Item>
                    <AntDescriptions.Item label="Master Product">
                      <span className="text-slate-900">{mProd?.name || item.catalog_product_id || 'N/A'}</span>
                    </AntDescriptions.Item>
                    <AntDescriptions.Item label="Quantity">
                      <span className="text-slate-900">{item.quantity} {item.unit_of_measure}</span>
                    </AntDescriptions.Item>
                    <AntDescriptions.Item label="Target Sellers">
                      <span className="text-slate-900">
                        {item.target_seller_party_ids?.length ? `${item.target_seller_party_ids.length} Selected` : 'Open Marketplace'}
                      </span>
                    </AntDescriptions.Item>
                  </AntDescriptions>
                </div>
              </div>

              {/* Target Brands / Manufacturers Mappings */}
              {item.preferred_brand_manufacturers && item.preferred_brand_manufacturers.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #2a79adff` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#2a79ad14` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white" style={{ backgroundColor: '#2a79adff' }}>
                        1
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 m-0">Manufacturer & Brand</h4>
                    </div>
                  </div>
                  <div className="p-3">
                    <AntDescriptions layout={descriptionsLayout} bordered size="small" column={1} labelStyle={{ width: '40%', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '12px', color: '#475569' }} contentStyle={{ backgroundColor: '#ffffff' }}>
                      {item.preferred_brand_manufacturers && item.preferred_brand_manufacturers.length > 0 ? (
                        item.preferred_brand_manufacturers.map((mPair: ManufacturerBrandMapping, pIdx: number) => {
                          const mfg = allManufacturers.find(m => m.id === mPair.manufacturer_id);
                          const brand = allBrands.find(b => b.id === mPair.brand_id);
                          return (
                            <AntDescriptions.Item key={pIdx} label={`Pair #${pIdx + 1}`}>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <AntTag color="purple" className="m-0">Mfg: {mfg?.company_name || mPair.manufacturer_id || 'Any'}</AntTag>
                                  <AntTag color="blue" className="m-0">Brand: {brand?.name || mPair.brand_id || 'Any'}</AntTag>
                                </div>
                              </div>
                            </AntDescriptions.Item>
                          );
                        })
                      ) : (
                        <AntDescriptions.Item label="Mappings">
                          <span className="text-xs text-slate-500 italic">All Manufacturers & Brands accepted</span>
                        </AntDescriptions.Item>
                      )}
                      {item.mfg_brand_description && (
                        <AntDescriptions.Item label="Section Note">
                          <span className="text-xs text-slate-500 italic">{item.mfg_brand_description}</span>
                        </AntDescriptions.Item>
                      )}
                    </AntDescriptions>
                  </div>
                </div>
              )}

              {/* Dynamic Attributes */}
              {item.selected_dynamic_attributes?.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ borderLeft: `4px solid #10b981` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: `#10b98114` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white" style={{ backgroundColor: '#10b981' }}>
                        2
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 m-0">Custom Specifications</h4>
                    </div>
                  </div>
                  <div className="p-3">
                    <AntDescriptions layout={descriptionsLayout} bordered size="small" column={1} labelStyle={{ width: '40%', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '12px', color: '#475569' }} contentStyle={{ backgroundColor: '#ffffff' }}>
                      {item.selected_dynamic_attributes.map((da: any, idx: number) => {
                        const attr = allAttributes.find((a: any) => a.id === da.attribute_id);
                        const valLabels = da.selected_value_ids.map((vId: string) => {
                          const val = allAttributeValues.find((v: any) => v.id === vId);
                          return val?.label || vId;
                        });
                        return (
                          <AntDescriptions.Item key={idx} label={<span className="font-semibold">{attr?.name || da.attribute_id}</span>}>
                            <div className="flex flex-col gap-1">
                              {valLabels.length > 0 && (
                                <span className="text-slate-900">
                                  {valLabels.map((vl: string, vIdx: number) => (
                                    <span key={vIdx}>
                                      {vl}
                                      {vIdx < valLabels.length - 1 && (
                                        <span className="mx-1 text-slate-400 font-bold">
                                          {(da.connector || 'OR') === 'OR' ? '|' : ','}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </span>
                              )}
                              {da.description?.trim() && (
                                <span className="text-xs text-slate-500 italic mt-0.5">{da.description}</span>
                              )}
                            </div>
                          </AntDescriptions.Item>
                        );
                      })}
                    </AntDescriptions>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </AntModal>
    </div>
  );
};
