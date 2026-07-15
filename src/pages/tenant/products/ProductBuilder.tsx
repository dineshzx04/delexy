import React, { useState, useMemo, useEffect } from 'react';
import { Input as AntInput, Button as AntButton, Select as AntSelect, Card as AntCard, Table as AntTable, notification, Tooltip, Modal as AntModal, Descriptions as AntDescriptions } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import WorkflowTimeline, { type ProductStatus } from '../../../components/common/WorkflowTimeline';
import CategoryPicker from '../../../components/common/CategoryPicker';
import FormItem from '../../../components/common/FormItem';

// Mock Platform Products for the selector
const PLATFORM_PRODUCTS = [
  { id: 'pp-1', name: 'Master iPhone 14', categoryId: 'c-1-1-1-1', categoryName: 'Smartphones' },
  { id: 'pp-2', name: 'Master MacBook Pro', categoryId: 'c-1-1-1-2', categoryName: 'Laptops' },
  { id: 'pp-3', name: 'Industrial Servo Motor Type-A', categoryId: 'c-2-2-1-1', categoryName: 'Motors' },
];

// Mock dynamic attribute groups based on category
const getDynamicAttributeGroups = (categoryId: string) => {
  if (!categoryId) return [];
  return [
    {
      groupId: 'g-1',
      groupName: 'Technical Specifications',
      attributes: [
        { id: 'attr-1', name: 'Material Grade', options: ['Standard', 'Premium', 'Industrial', 'Aerospace', 'Military Spec'] },
        { id: 'attr-2', name: 'Power Source', options: ['AC 110V', 'AC 220V', 'DC 12V', 'DC 24V', 'DC 48V', 'Solar'] },
        { id: 'attr-3', name: 'Mounting Type', options: ['Surface Mount', 'Panel Mount', 'DIN Rail', 'Rack Mount'] },
      ]
    },
    {
      groupId: 'g-2',
      groupName: 'Environmental Conditions',
      attributes: [
        { id: 'attr-4', name: 'Operating Temperature', options: ['0°C to 40°C', '-20°C to 60°C', '-40°C to 85°C', '-55°C to 125°C'] },
        { id: 'attr-5', name: 'IP Rating', options: ['IP54', 'IP65', 'IP67', 'IP68', 'IP69K'] },
        { id: 'attr-6', name: 'Humidity Tolerance', options: ['0-80% Non-condensing', '0-95% Non-condensing', '100% Condensing'] },
      ]
    },
    {
      groupId: 'g-3',
      groupName: 'Performance Metrics',
      attributes: [
        { id: 'attr-7', name: 'Energy Efficiency', options: ['80 PLUS', '80 PLUS Gold', '80 PLUS Titanium', 'IE3 Premium', 'IE4 Super Premium'] },
        { id: 'attr-8', name: 'Max RPM', options: ['1000 RPM', '1500 RPM', '3000 RPM', '10000 RPM'] },
      ]
    },
    {
      groupId: 'g-4',
      groupName: 'Compliance & Standards',
      attributes: [
        { id: 'attr-9', name: 'Certifications', options: ['ISO 9001', 'CE', 'UL Listed', 'FCC', 'CSA'] },
        { id: 'attr-10', name: 'RoHS Compliant', options: ['Yes', 'No', 'Pending'] },
      ]
    }
  ];
};

// Local component to prevent full table re-render on keystrokes
const VariantInput = ({ value, onChange, prefix }: { value: number, onChange: (val: number) => void, prefix?: string }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <AntInput
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value as any)}
      onBlur={() => onChange(Number(localValue))}
      prefix={prefix}
    />
  );
};

const ProductBuilder: React.FC = () => {
  const { control, setValue, getValues, trigger, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [currentStatus, setCurrentStatus] = useState<ProductStatus>('Draft');
  const [selectedPlatformProduct, setSelectedPlatformProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Dynamic Variant State
  const dynamicAttributesValues = watch('dynamicAttributes') || {};
  const [variants, setVariants] = useState<{ id: string; name: string; sku: string; price: number; stock: number; minOrder: number }[]>([]);
  const [globalSpecs, setGlobalSpecs] = useState<{ name: string; value: string }[]>([]);
  const [bulkValues, setBulkValues] = useState({ price: '', stock: '', minOrder: '' });

  // Modal State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProductStatus | null>(null);

  const applyBulkValues = () => {
    const p = Number(bulkValues.price);
    const s = Number(bulkValues.stock);
    const m = Number(bulkValues.minOrder);

    setVariants(prev => prev.map(v => ({
      ...v,
      price: bulkValues.price !== '' ? p : v.price,
      stock: bulkValues.stock !== '' ? s : v.stock,
      minOrder: bulkValues.minOrder !== '' ? m : v.minOrder,
    })));
    notification.success({ message: `Bulk values applied to ${variants.length} variants.` });
    setBulkValues({ price: '', stock: '', minOrder: '' });
  };

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to="/products" className="text-gray-500 hover:text-sky-600 transition-colors">Products</Link>, url: '/products' },
    { title: <span className="text-gray-900 font-semibold">Product Builder</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const dynamicAttributeGroups = useMemo(() => {
    return getDynamicAttributeGroups(selectedCategory || '');
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedPlatformProduct || !dynamicAttributeGroups.length) {
      setVariants([]);
      setGlobalSpecs([]);
      return;
    }

    const axes: { name: string; values: string[] }[] = [];
    const specs: { name: string; value: string }[] = [];

    const attrMap = new Map<string, string>();
    dynamicAttributeGroups.forEach(group => {
      group.attributes.forEach(attr => attrMap.set(attr.id, attr.name));
    });

    Object.entries(dynamicAttributesValues).forEach(([attrId, values]) => {
      const valArray = Array.isArray(values) ? values : [];
      const attrName = attrMap.get(attrId) || attrId;

      if (valArray.length === 1) {
        specs.push({ name: attrName, value: valArray[0] });
      } else if (valArray.length > 1) {
        axes.push({ name: attrName, values: valArray });
      }
      // OR

      // if (valArray.length > 0) {
      //   axes.push({ name: attrName, values: valArray });
      // }
    });

    setGlobalSpecs(specs);

    if (axes.length > 0) {
      const combinations = axes.reduce((a, b) =>
        a.flatMap(x => b.values.map(y => [...x, y])),
        [[]] as string[][]
      );

      setVariants(prev => {
        return combinations.map((combo, index) => {
          const name = combo.join(' / ');
          const id = `v-${combo.join('-').replace(/[^a-zA-Z0-9]/g, '-')}`;
          const sku = `${selectedPlatformProduct.id}-V${index + 1}`.toUpperCase();

          const existing = prev.find(v => v.id === id);
          return existing ? { ...existing, sku } : { id, name, sku, price: 0, stock: 0, minOrder: 1 };
        });
      });
    } else {
      setVariants([]);
    }
  }, [JSON.stringify(dynamicAttributesValues), selectedPlatformProduct, dynamicAttributeGroups]);

  useEffect(() => {
    // Mock loading an existing product's status
    if (id) {
      if (id === 'tp-2') setCurrentStatus('Under Review');
      else if (id === 'tp-3') setCurrentStatus('Changes Requested');
      else if (id === 'tp-5') setCurrentStatus('Resubmitted');
      else setCurrentStatus('Draft');
    }
  }, [id]);

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setValue('platformProductId', undefined); // Reset product when category changes
    setSelectedPlatformProduct(null);
  };

  const availablePlatformProducts = useMemo(() => {
    if (!selectedCategory) return [];

    // Try predefined
    const predefined = PLATFORM_PRODUCTS.filter(p => p.categoryId === selectedCategory);
    if (predefined.length > 0) return predefined;

    // Generate dynamic mock data for any other category
    return [
      { id: `dyn-1-${selectedCategory}`, name: `Standard Master Template`, categoryId: selectedCategory, categoryName: 'Dynamic Category' },
      { id: `dyn-2-${selectedCategory}`, name: `Premium Master Template`, categoryId: selectedCategory, categoryName: 'Dynamic Category' },
      { id: `dyn-3-${selectedCategory}`, name: `Industrial Master Template`, categoryId: selectedCategory, categoryName: 'Dynamic Category' },
    ];
  }, [selectedCategory]);

  const handlePlatformProductSelect = (value: string) => {
    const pp = availablePlatformProducts.find(p => p.id === value);
    setSelectedPlatformProduct(pp);

    // Auto-fill some base info if desired
    if (pp) {
      setValue('name', pp.name);
    }
  };

  const updateVariant = (id: string, field: string, value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleInitiateSave = async (status: ProductStatus) => {
    const isValid = await trigger();
    if (isValid) {
      setPendingStatus(status);
      setIsReviewModalVisible(true);
    } else {
      notification.error({ message: 'Please complete all required fields.' });
    }
  };

  const confirmSave = () => {
    if (!pendingStatus) return;
    const values = getValues();
    const mockPayload = {
      productData: values,
      globalSpecs: globalSpecs,
      variants: variants,
      status: pendingStatus
    };

    console.log('Product Data Saved:', mockPayload);
    notification.success({
      message: pendingStatus === 'Draft' ? 'Saved as Draft' : 'Submitted for Review',
      description: `Product has been successfully processed to ${pendingStatus}.`
    });
    setIsReviewModalVisible(false);
    navigate('/products');
  };

  const variantColumns = [
    { title: 'Variant', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-gray-700">{text}</span> },
    { title: 'Platform SKU', dataIndex: 'sku', key: 'sku', render: (text: string) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">{text}</span> },
    {
      title: 'Min Price ($)',
      key: 'price',
      render: (_: any, record: any) => (
        <VariantInput
          value={record.price}
          onChange={(val: number) => updateVariant(record.id, 'price', val)}
          prefix="$"
        />
      )
    },
    {
      title: 'Stock (Qty)',
      key: 'stock',
      render: (_: any, record: any) => (
        <VariantInput
          value={record.stock}
          onChange={(val: number) => updateVariant(record.id, 'stock', val)}
        />
      )
    },
    {
      title: 'Min Order Qty',
      key: 'minOrder',
      render: (_: any, record: any) => (
        <VariantInput
          value={record.minOrder}
          onChange={(val: number) => updateVariant(record.id, 'minOrder', val)}
        />
      )
    }
  ];

  return (
    <div className="w-full max-w-5xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Builder</h1>
        <p className="text-gray-500">Create or revise a product based on platform templates.</p>
      </div>

      {id && <WorkflowTimeline currentStatus={currentStatus} />}

      <form className="space-y-6">

        {/* STEP 1: PLATFORM PRODUCT SELECTION */}
        <AntCard className="mb-6 shadow-sm border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-sky-600">
            <Lucide.Link size={20} />
            <h2 className="text-lg font-semibold m-0">1. Select Platform Master</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Select a category to load the corresponding platform master products.
          </p>

          <FormItem label="Filter by Category" className="mb-4">
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <CategoryPicker
                  value={field.value}
                  onChange={(id, name) => {
                    handleCategorySelect(id);
                    field.onChange(id);
                  }}
                />
              )}
            />
          </FormItem>

          {selectedCategory && (
            <FormItem label="Platform Master Product" required error={errors.platformProductId?.message as string}>
              <Controller
                name="platformProductId"
                control={control}
                rules={{ required: 'Please select a platform product' }}
                render={({ field }) => (
                  <AntSelect
                    {...field}
                    size="large"
                    placeholder="Select a platform product..."
                    onChange={(val) => {
                      field.onChange(val);
                      handlePlatformProductSelect(val);
                    }}
                    options={availablePlatformProducts.map(p => ({ label: p.name, value: p.id }))}
                    showSearch
                    disabled={availablePlatformProducts.length === 0}
                    status={errors.platformProductId ? 'error' : ''}
                    className='w-full'
                  />
                )}
              />
            </FormItem>
          )}
        </AntCard>

        {/* STEP 2: DIMENSIONS & WEIGHT */}
        <div className={selectedPlatformProduct ? "opacity-100 transition-opacity" : "opacity-50 pointer-events-none transition-opacity"}>
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Lucide.Ruler size={20} />
              <h2 className="text-lg font-semibold m-0">2. Dimensions & Weight</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <FormItem label="Height">
                <Controller
                  name="height"
                  control={control}
                  render={({ field }) => <AntInput {...field} size="large" />}
                />
              </FormItem>
              <FormItem label="Width">
                <Controller
                  name="width"
                  control={control}
                  render={({ field }) => <AntInput {...field} size="large" />}
                />
              </FormItem>
              <FormItem label="Empty Weight">
                <Controller
                  name="emptyWeight"
                  control={control}
                  render={({ field }) => <AntInput {...field} size="large" />}
                />
              </FormItem>
            </div>
          </AntCard>

          {/* STEP 3: PRODUCTION DETAILS */}
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Lucide.Factory size={20} />
              <h2 className="text-lg font-semibold m-0">3. Production Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <FormItem label="Product Name" required error={errors.name?.message as string}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => <AntInput {...field} size="large" status={errors.name ? 'error' : ''} />}
                />
              </FormItem>
              <FormItem label="Model number">
                <Controller
                  name="modelNumber"
                  control={control}
                  render={({ field }) => <AntInput {...field} size="large" />}
                />
              </FormItem>
              <FormItem label="Part number" required error={errors.partNumber?.message as string}>
                <Controller
                  name="partNumber"
                  control={control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => <AntInput {...field} size="large" status={errors.partNumber ? 'error' : ''} />}
                />
              </FormItem>
              <FormItem label="Year of Manufacture">
                <Controller
                  name="yearOfManufacture"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      size="large"
                      placeholder="Select year"
                      options={Array.from({ length: 30 }, (_, i) => ({ value: new Date().getFullYear() - i, label: `${new Date().getFullYear() - i}` }))}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Country of Origin">
                <Controller
                  name="countryOfOrigin"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      size="large"
                      placeholder="Select country"
                      showSearch
                      options={[{ label: 'United States', value: 'US' }, { label: 'China', value: 'CN' }, { label: 'Germany', value: 'DE' }, { label: 'Japan', value: 'JP' }]}
                      className='w-full'
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Manufacturer">
                <Controller
                  name="manufacturer"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      size="large"
                      placeholder="Select manufacturer"
                      options={[{ label: 'Acme Corp', value: 'acme' }, { label: 'GlobalTech Industries', value: 'globaltech' }]}
                      className='w-full'

                    />
                  )}
                />
              </FormItem>
              <FormItem label="Brand">
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      size="large"
                      placeholder="Select brand"
                      options={[{ label: 'Brand X', value: 'brand-x' }, { label: 'Premium Line', value: 'premium' }]}
                      className='w-full'
                    />
                  )}
                />
              </FormItem>
            </div>
          </AntCard>

          {/* STEP 3: SELLER DETAILS */}
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Lucide.FileText size={20} />
              <h2 className="text-lg font-semibold m-0">3. Seller Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <FormItem label="Seller">
                <Controller
                  name="seller"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      size="large"
                      placeholder="Select seller"
                      options={[{ label: 'Primary Vendor A', value: 'vendor-a' }, { label: 'Secondary Vendor B', value: 'vendor-b' }]}
                      className='w-full'
                    />
                  )}
                />
              </FormItem>
            </div>

          </AntCard>

          {/* STEP 4: OTHERS */}
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Lucide.List size={20} />
              <h2 className="text-lg font-semibold m-0">4. Others</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <FormItem label="Deviations">
                <Controller name="deviations" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Exclusions">
                <Controller name="exclusions" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Assumptions">
                <Controller name="assumptions" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Operation Instructions">
                <Controller name="operationInstructions" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Safety Instructions">
                <Controller name="safetyInstructions" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Handling Instructions">
                <Controller name="handlingInstructions" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Maintenance Instructions">
                <Controller name="maintenanceInstructions" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Additional Requirements">
                <Controller name="additionalRequirements" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <div className="md:col-span-2">
                <FormItem label="Additional Information">
                  <Controller name="additionalInformation" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
                </FormItem>
              </div>
            </div>
          </AntCard>

          {/* STEP 5: DYNAMIC ATTRIBUTES (FROM CATEGORY GROUPS) */}
          {dynamicAttributeGroups.length > 0 && (
            <AntCard className="mb-6 shadow-sm border-gray-200">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <Lucide.Settings2 size={20} />
                <h2 className="text-lg font-semibold m-0">5. Dynamic Attributes</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                These attribute groups are dynamically loaded based on the selected category.
              </p>

              {dynamicAttributeGroups.map((group, index) => (
                <div key={group.groupId} className={index > 0 ? "mt-1" : ""}>
                  <h3 className="text-md font-medium text-gray-700 mb-2 border-b border-gray-100 pb-1">
                    {group.groupName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {group.attributes.map((attr) => (
                      <FormItem key={attr.id} label={attr.name}>
                        <Controller
                          name={`dynamicAttributes.${attr.id}`}
                          control={control}
                          render={({ field }) => (
                            <AntSelect
                              {...field}
                              mode='multiple'
                              size="large"
                              placeholder={`Select ${attr.name}`}
                              options={attr.options.map(opt => ({ label: opt, value: opt }))}
                              className="w-full"
                              showSearch
                            />
                          )}
                        />
                      </FormItem>
                    ))}
                  </div>
                </div>
              ))}
            </AntCard>
          )}

          {/* STEP 6: INVENTORY & VARIANTS */}
          {(variants.length > 0 || globalSpecs.length > 0) && (
            <AntCard className="mb-6 shadow-sm border-gray-200">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <Lucide.Copy size={20} />
                <h2 className="text-lg font-semibold m-0">6. Inventory & Variants</h2>
              </div>

              {globalSpecs.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Global Product Specifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {globalSpecs.map((spec, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        <span className="font-bold mr-1">{spec.name}:</span> {spec.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider">Sellable Product Variants</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Platform Product Numbers (SKUs) are auto-generated based on combinations. Set your minimum prices and stock levels below.
                </p>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bulk Min Price ($)</label>
                    <AntInput type="number" placeholder="e.g. 50" value={bulkValues.price} onChange={e => setBulkValues({ ...bulkValues, price: e.target.value })} />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bulk Stock Qty</label>
                    <AntInput type="number" placeholder="e.g. 100" value={bulkValues.stock} onChange={e => setBulkValues({ ...bulkValues, stock: e.target.value })} />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bulk Min Order</label>
                    <AntInput type="number" placeholder="e.g. 10" value={bulkValues.minOrder} onChange={e => setBulkValues({ ...bulkValues, minOrder: e.target.value })} />
                  </div>
                  <div className="w-full md:w-auto">
                    <AntButton onClick={applyBulkValues} className="w-full flex items-center justify-center gap-2 border-sky-600 text-sky-600 hover:bg-sky-50">
                      <Lucide.CheckSquare size={16} /> Apply to All
                    </AntButton>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <AntTable
                    columns={variantColumns}
                    dataSource={variants}
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '50', '100'] }}
                    size="small"
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                  />
                ) : (
                  <div className="text-center p-8 text-gray-400 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <Lucide.Boxes size={24} className="mx-auto mb-2 opacity-50" />
                    Select multiple values in the Dynamic Attributes (Step 5) to auto-generate sellable variants.
                  </div>
                )}
              </div>
            </AntCard>
          )}

        </div>


      </form>

      {/* STICKY FOOTER ACTIONS */}
      <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-256px)] bg-white border-t border-gray-200 p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <AntButton size="large" onClick={() => navigate('/products')}>
          Cancel
        </AntButton>
        <div className="flex gap-3">
          <Tooltip title="Save locally without notifying the platform admins.">
            <AntButton
              size="large"
              onClick={() => handleInitiateSave('Draft')}
              disabled={!selectedPlatformProduct}
            >
              Save Draft
            </AntButton>
          </Tooltip>
          <AntButton
            type="primary"
            size="large"
            className="bg-sky-600"
            onClick={() => handleInitiateSave(currentStatus === 'Changes Requested' ? 'Resubmitted' : 'Submitted')}
            disabled={!selectedPlatformProduct}
          >
            {currentStatus === 'Changes Requested' ? 'Resubmit for Approval' : 'Submit for Approval'}
          </AntButton>
        </div>
      </div>

      {/* REVIEW MODAL */}
      <AntModal
        title={
          <div className="flex items-center gap-2">
            <Lucide.ClipboardCheck size={20} className="text-sky-600" />
            <span>{pendingStatus === 'Draft' ? "Review Draft" : "Review Submission"}</span>
          </div>
        }
        open={isReviewModalVisible}
        onOk={confirmSave}
        onCancel={() => setIsReviewModalVisible(false)}
        okText={pendingStatus === 'Draft' ? "Save Draft" : "Confirm Submit"}
        cancelText="Cancel"
        width={800}
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 my-4">
          <AntDescriptions title="Production Details" bordered size="small" column={2}>
            <AntDescriptions.Item label="Name">{getValues('name') || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Model">{getValues('modelNumber') || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Part No.">{getValues('partNumber') || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Brand">{getValues('brand') || '-'}</AntDescriptions.Item>
          </AntDescriptions>

          <AntDescriptions title="Seller Details" bordered size="small" column={2}>
            <AntDescriptions.Item label="Seller" span={2}>{getValues('seller') || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Country">{getValues('countryOfOrigin') || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Year">{getValues('yearOfManufacture') || '-'}</AntDescriptions.Item>
          </AntDescriptions>

          {globalSpecs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Global Specifications</h3>
              <div className="flex flex-wrap gap-2">
                {globalSpecs.map((spec, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                    <span className="font-bold mr-1">{spec.name}:</span> {spec.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800 m-0">Variants Summary</h3>
              <span className="text-xs text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 font-medium">
                Total Variants: {variants.length}
              </span>
            </div>
            {variants.length > 0 ? (
              <AntTable
                columns={[
                  { title: 'Variant Combination', dataIndex: 'name', key: 'name', render: (text: string) => <span className="text-xs text-gray-600 font-medium">{text}</span> },
                  { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (text: string) => <span className="font-mono text-[10px] bg-gray-100 px-1 rounded">{text}</span> },
                  { title: 'Price', dataIndex: 'price', key: 'price', render: (val: number) => <span className="text-xs font-semibold">${val}</span> },
                  { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (val: number) => <span className="text-xs">{val}</span> },
                ]}
                dataSource={variants}
                rowKey="id"
                pagination={{ pageSize: 5, size: 'small', showSizeChanger: false }}
                size="small"
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              />
            ) : (
              <div className="text-center p-4 text-gray-400 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm">
                No variants generated.
              </div>
            )}
          </div>
        </div>
      </AntModal>
    </div>
  );
};

export default ProductBuilder;
