import React, { useState, useMemo, useEffect } from 'react';
import { Input as AntInput, Button as AntButton, Select as AntSelect, Card as AntCard, Divider as AntDivider, Table as AntTable, notification, Tooltip } from 'antd';
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

// Mock dynamic attributes based on category
const getDynamicAttributesForCategory = (categoryName: string) => {
  if (categoryName.includes('Phone') || categoryName.includes('Laptop')) {
    return [
      { id: 'attr-1', name: 'Screen Size', type: 'text', required: true },
      { id: 'attr-2', name: 'Battery Capacity', type: 'text', required: true },
    ];
  }
  if (categoryName.includes('Motor')) {
    return [
      { id: 'attr-3', name: 'Voltage', type: 'select', options: ['12V', '24V', '48V'], required: true },
      { id: 'attr-4', name: 'Max Torque', type: 'text', required: true },
    ];
  }
  return [
    { id: 'attr-5', name: 'Material', type: 'text', required: false },
    { id: 'attr-6', name: 'Weight (kg)', type: 'text', required: true },
  ];
};

const ProductBuilder: React.FC = () => {
  const { control, setValue, getValues, trigger, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [currentStatus, setCurrentStatus] = useState<ProductStatus>('Draft');
  const [selectedPlatformProduct, setSelectedPlatformProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Variant Matrix State
  const [variants, setVariants] = useState<{ id: string; name: string; price: number; stock: number; minOrder: number }[]>([]);
  const [variantInputs, setVariantInputs] = useState<{ color: string; size: string }>({ color: '', size: '' });

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to="/products" className="text-gray-500 hover:text-sky-600 transition-colors">Products</Link>, url: '/products' },
    { title: <span className="text-gray-900 font-semibold">Product Builder</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const dynamicAttributes = useMemo(() => {
    if (!selectedPlatformProduct) return [];
    return getDynamicAttributesForCategory(selectedPlatformProduct.categoryName);
  }, [selectedPlatformProduct]);

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

  const generateVariants = () => {
    const colors = variantInputs.color.split(',').map(s => s.trim()).filter(Boolean);
    const sizes = variantInputs.size.split(',').map(s => s.trim()).filter(Boolean);

    if (colors.length === 0 && sizes.length === 0) {
      notification.warning({ message: 'Enter at least one color or size to generate variants.' });
      return;
    }

    const newVariants: any[] = [];

    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(c => {
        sizes.forEach(s => {
          newVariants.push({ id: `v-${c}-${s}`, name: `${c} / ${s}`, price: 0, stock: 0, minOrder: 1 });
        });
      });
    } else if (colors.length > 0) {
      colors.forEach(c => newVariants.push({ id: `v-${c}`, name: c, price: 0, stock: 0, minOrder: 1 }));
    } else if (sizes.length > 0) {
      sizes.forEach(s => newVariants.push({ id: `v-${s}`, name: s, price: 0, stock: 0, minOrder: 1 }));
    }

    setVariants(newVariants);
    notification.success({ message: `Generated ${newVariants.length} variants.` });
  };

  const updateVariant = (id: string, field: string, value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSave = async (status: ProductStatus) => {
    const isValid = await trigger();
    if (isValid) {
      const values = getValues();
      // Mocking the complex JSON structure provided by the user
      const mockPayload = {
        productData: values,
        variants: variants,
        status: status
      };

      console.log('Product Data Saved:', mockPayload);
      notification.success({
        message: status === 'Draft' ? 'Saved as Draft' : 'Submitted for Review',
        description: `Product has been successfully processed to ${status}.`
      });
      navigate('/products');
    } else {
      notification.error({ message: 'Please complete all required fields.' });
    }
  };

  const variantColumns = [
    { title: 'Variant', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-gray-700">{text}</span> },
    {
      title: 'Price ($)',
      key: 'price',
      render: (_: any, record: any) => (
        <AntInput
          type="number"
          value={record.price}
          onChange={(e) => updateVariant(record.id, 'price', Number(e.target.value))}
          prefix="$"
        />
      )
    },
    {
      title: 'Stock (Qty)',
      key: 'stock',
      render: (_: any, record: any) => (
        <AntInput
          type="number"
          value={record.stock}
          onChange={(e) => updateVariant(record.id, 'stock', Number(e.target.value))}
        />
      )
    },
    {
      title: 'Min Order Qty',
      key: 'minOrder',
      render: (_: any, record: any) => (
        <AntInput
          type="number"
          value={record.minOrder}
          onChange={(e) => updateVariant(record.id, 'minOrder', Number(e.target.value))}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 50,
      render: (_: any, record: any) => (
        <AntButton type="text" danger icon={<Lucide.Trash2 size={16} />} onClick={() => setVariants(variants.filter(v => v.id !== record.id))} />
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

        {/* STEP 2: PRODUCTION DETAILS */}
        <div className={selectedPlatformProduct ? "opacity-100 transition-opacity" : "opacity-50 pointer-events-none transition-opacity"}>
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Lucide.Factory size={20} />
              <h2 className="text-lg font-semibold m-0">2. Production Details</h2>
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
                      options={Array.from({length: 30}, (_, i) => ({ value: new Date().getFullYear() - i, label: `${new Date().getFullYear() - i}` }))}
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
                      options={[{label: 'United States', value: 'US'}, {label: 'China', value: 'CN'}, {label: 'Germany', value: 'DE'}, {label: 'Japan', value: 'JP'}]}
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
                      options={[{label: 'Acme Corp', value: 'acme'}, {label: 'GlobalTech Industries', value: 'globaltech'}]}
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
                      options={[{label: 'Brand X', value: 'brand-x'}, {label: 'Premium Line', value: 'premium'}]}
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
                      options={[{label: 'Primary Vendor A', value: 'vendor-a'}, {label: 'Secondary Vendor B', value: 'vendor-b'}]}
                    />
                  )}
                />
              </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-4">
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
              <FormItem label="Maintenance Instruction">
                <Controller name="maintenanceInstruction" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <FormItem label="Additional Requirement">
                <Controller name="additionalRequirement" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
              </FormItem>
              <div className="md:col-span-2">
                <FormItem label="Additional Information">
                  <Controller name="additionalInformation" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={3} />} />
                </FormItem>
              </div>
            </div>
          </AntCard>

          {/* STEP 4: DYNAMIC ATTRIBUTES */}
          {dynamicAttributes.length > 0 && (
            <AntCard className="mb-6 shadow-sm border-gray-200">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <Lucide.Settings2 size={20} />
                <h2 className="text-lg font-semibold m-0">4. Engineering Specifications</h2>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                These fields are dynamically required because this product belongs to the <strong>{selectedPlatformProduct?.categoryName}</strong> category.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {dynamicAttributes.map(attr => (
                  <FormItem
                    key={attr.id}
                    label={attr.name}
                    required={attr.required}
                    error={(errors.attributes as any)?.[attr.id]?.message as string}
                  >
                    <Controller
                      name={`attributes.${attr.id}`}
                      control={control}
                      rules={{ required: attr.required ? `Please provide ${attr.name}` : false }}
                      render={({ field }) => (
                        attr.type === 'select' ? (
                          <AntSelect {...field} size="large" status={(errors.attributes as any)?.[attr.id] ? 'error' : ''} options={(attr as any).options.map((o: string) => ({ label: o, value: o }))} />
                        ) : (
                          <AntInput {...field} size="large" status={(errors.attributes as any)?.[attr.id] ? 'error' : ''} />
                        )
                      )}
                    />
                  </FormItem>
                ))}
              </div>
            </AntCard>
          )}

          {/* STEP 5: VARIANTS GENERATOR */}
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800">
                <Lucide.Copy size={20} />
                <h2 className="text-lg font-semibold m-0">5. Inventory & Variants</h2>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Variant Generator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Colors (comma separated)</label>
                  <AntInput
                    placeholder="e.g. Red, Blue, Black"
                    value={variantInputs.color}
                    onChange={e => setVariantInputs({ ...variantInputs, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sizes / Specs (comma separated)</label>
                  <AntInput
                    placeholder="e.g. 64GB, 128GB"
                    value={variantInputs.size}
                    onChange={e => setVariantInputs({ ...variantInputs, size: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <AntButton onClick={generateVariants} className="flex items-center gap-2">
                    <Lucide.Zap size={14} /> Generate Matrix
                  </AntButton>
                </div>
              </div>
            </div>

            {variants.length > 0 && (
              <AntTable
                columns={variantColumns}
                dataSource={variants}
                rowKey="id"
                pagination={false}
                size="small"
                className="border border-gray-200 rounded-lg overflow-hidden"
              />
            )}
            {variants.length === 0 && (
              <div className="text-center p-8 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                Use the generator above to create your product inventory variants.
              </div>
            )}
          </AntCard>
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
              onClick={() => handleSave('Draft')}
              disabled={!selectedPlatformProduct}
            >
              Save Draft
            </AntButton>
          </Tooltip>
          <AntButton
            type="primary"
            size="large"
            className="bg-sky-600"
            onClick={() => handleSave(currentStatus === 'Changes Requested' ? 'Resubmitted' : 'Submitted')}
            disabled={!selectedPlatformProduct}
          >
            {currentStatus === 'Changes Requested' ? 'Resubmit for Approval' : 'Submit for Approval'}
          </AntButton>
        </div>
      </div>
    </div>
  );
};

export default ProductBuilder;
