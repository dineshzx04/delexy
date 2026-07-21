import React, { useState, useMemo, useEffect } from 'react';
import { Input as AntInput, Button as AntButton, Select as AntSelect, Card as AntCard, Table as AntTable, notification, Tooltip, Modal as AntModal, Descriptions as AntDescriptions, Checkbox as AntCheckbox } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import WorkflowTimeline, { type ProductStatus } from '../../../components/common/WorkflowTimeline';
import CategoryPicker from '../../../components/common/CategoryPicker';
import FormItem from '../../../components/common/FormItem';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserProduct, type FieldReview } from '../../../data/db';


// Local component to prevent full table re-render on keystrokes
const VariantInput = ({ value, onChange, prefix, disabled }: { value: number, onChange: (val: number) => void, prefix?: string, disabled?: boolean }) => {
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
      disabled={disabled}
    />
  );
};

const FieldReviewAlert = ({ entityKey, reviewData }: { entityKey: string, reviewData: Record<string, FieldReview> }) => {
  const review = reviewData[entityKey];
  if (review?.status === 'rejected') {
    return (
      <div className="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-start gap-1.5">
        <Lucide.AlertCircle size={14} className="shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block">Platform Rejected:</span>
          {review.comment || 'No comment provided.'}
        </div>
      </div>
    );
  }
  return null;
};

const ProductBuilder: React.FC = () => {
  const { control, setValue, getValues, trigger, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [currentStatus, setCurrentStatus] = useState<ProductStatus>('Draft');
  const [selectedPlatformProduct, setSelectedPlatformProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, FieldReview>>({});

  const CATEGORY_PRODUCTS = useLiveQuery(() => db.categoryProducts.toArray()) || [];
console.log(CATEGORY_PRODUCTS)
  const isReadOnly = ['Submitted', 'Under Review', 'Approved', 'Published'].includes(currentStatus);

  // Dynamic Variant State
  const dynamicAttributesValues = watch('dynamicAttributes') || {};
  const isVariantAttribute = watch('isVariantAttribute') || {};
  const [variants, setVariants] = useState<any[]>([]);
  const [globalSpecs, setGlobalSpecs] = useState<any[]>([]);
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
      price: bulkValues.price !== '' ? { ...v.price, amount: p } : v.price,
      stock: bulkValues.stock !== '' ? s : v.stock,
      available: bulkValues.stock !== '' ? s : v.available,
      minOrderQuantity: bulkValues.minOrder !== '' ? m : v.minOrderQuantity,
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

  const [dynamicAttributeGroups, setDynamicAttributeGroups] = useState<{ groupId: string; groupName: string; attributes: { id: string; name: string; options: { id: string, label: string }[] }[] }[]>([]);

  useEffect(() => {
    const fetchDynamicAttributes = async () => {
      if (!selectedCategory) {
        setDynamicAttributeGroups([]);
        return;
      }
      const cat = await db.categories.get(selectedCategory);
      if (!cat || !cat.mappedGroupIds || !cat.mappedGroupIds.length) {
        setDynamicAttributeGroups([]);
        return;
      }

      const groups = await Promise.all(
        cat.mappedGroupIds.map(async gId => {
          const g = await db.attributeGroups.get(gId);
          if (!g) return null;

          const attrs = await Promise.all(
            (g.attributeIds || []).map(async aId => {
              const a = await db.attributes.get(aId);
              if (!a) return null;

              const opts = await Promise.all(
                (a.valueIds || []).map(async vId => {
                  const v = await db.attributeValues.get(vId);
                  return v ? { id: v.id, label: v.value } : null;
                })
              );

              return {
                id: a.id,
                name: a.name,
                options: opts.filter(Boolean) as { id: string, label: string }[]
              };
            })
          );

          return {
            groupId: g.id,
            groupName: g.name,
            attributes: attrs.filter(Boolean) as any
          };
        })
      );

      setDynamicAttributeGroups(groups.filter(Boolean) as any);
    };
    fetchDynamicAttributes();
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedPlatformProduct || !dynamicAttributeGroups.length) {
      setVariants([]);
      setGlobalSpecs([]);
      return;
    }

    const axes: { attributeId: string; attributeName: string; values: { valueId: string; label: string }[] }[] = [];
    const specs: any[] = [];

    const attrLookup = new Map<string, { name: string; options: { id: string; label: string }[] }>();
    dynamicAttributeGroups.forEach(group => {
      group.attributes.forEach(attr => attrLookup.set(attr.id, { name: attr.name, options: attr.options }));
    });

    Object.entries(dynamicAttributesValues).forEach(([attrId, values]) => {
      const valArray = Array.isArray(values) ? values : [];
      const attrInfo = attrLookup.get(attrId);
      
      if (valArray.length > 0 && attrInfo) {
        const mappedValues = valArray.map(vId => {
          const opt = attrInfo.options.find(o => o.id === vId);
          return { valueId: vId, label: opt?.label || vId };
        });

        if (isVariantAttribute[attrId]) {
          axes.push({ attributeId: attrId, attributeName: attrInfo.name, values: mappedValues });
        } else {
          specs.push({
            attributeId: attrId,
            attributeName: attrInfo.name,
            values: mappedValues.map(v => ({ id: v.valueId, label: v.label }))
          });
        }
      }
    });

    setGlobalSpecs(specs);

    if (axes.length > 0) {
      const combinations = axes.reduce((a, b) =>
        a.flatMap(x => b.values.map(y => [...x, { ...y, attributeId: b.attributeId, attributeName: b.attributeName }])),
        [[]] as any[][]
      );

      setVariants(prev => {
        return combinations.map((combo, index) => {
          const name = combo.map((c: any) => c.label).join(' / ');
          const id = `v-${combo.map((c: any) => c.label).join('-').replace(/[^a-zA-Z0-9]/g, '-')}`;
          const sku = `${selectedPlatformProduct.id}-V${index + 1}`.toUpperCase();

          const existing = prev.find(v => v.id === id);
          return existing ? { ...existing, sku, values: combo } : {
            id,
            name,
            displayName: `${selectedPlatformProduct.name} - ${name}`,
            sku,
            price: { amount: 0, currency: 'USD' },
            stock: 0,
            reserved: 0,
            available: 0,
            minOrderQuantity: 1,
            leadTimeInDays: 0,
            values: combo
          };
        });
      });
    } else {
      setVariants(prev => {
        const id = 'v-default';
        const name = 'Default Variant';
        const sku = `${selectedPlatformProduct.id}-BASE`.toUpperCase();
        const existing = prev.find(v => v.id === id);
        return [existing ? { ...existing, sku, values: [] } : {
          id,
          name,
          displayName: selectedPlatformProduct.name,
          sku,
          price: { amount: 0, currency: 'USD' },
          stock: 0,
          reserved: 0,
          available: 0,
          minOrderQuantity: 1,
          leadTimeInDays: 0,
          values: []
        }];
      });
    }
  }, [JSON.stringify(dynamicAttributesValues), JSON.stringify(isVariantAttribute), selectedPlatformProduct, dynamicAttributeGroups]);

  useEffect(() => {
    if (id) {
      const loadProduct = async () => {
        let prod: any = await db.userProductReviews.get(id);
        if (!prod) {
          prod = await db.userProducts.get(id);
        }
        if (prod) {
          setCurrentStatus(prod.status as ProductStatus);
          setReviewData(prod.reviewData || {});

          // Load the stored data into the form
          const pd = prod as any;

          // Exclude certain db-specific keys from being pushed straight into form
          const excludedKeys = ['id', 'tenantId', 'tenantName', 'status', 'reviewData', 'createdAt', 'updatedAt', 'submittedAt', 'variants', 'globalSpecs', 'dynamicAttributes', 'countryOfOrigin', 'manufacturer', 'brand', 'seller'];
          Object.keys(pd).forEach(key => {
            if (!excludedKeys.includes(key)) {
              setValue(key, pd[key]);
            }
          });

          // Handle labelInValue selects
          if (pd.countryOfOrigin) setValue('countryOfOrigin', { value: pd.countryOfOrigin.code, label: pd.countryOfOrigin.name });
          if (pd.manufacturer) setValue('manufacturer', { value: pd.manufacturer.id, label: pd.manufacturer.name });
          if (pd.brand) setValue('brand', { value: pd.brand.id, label: pd.brand.name });
          if (pd.seller) setValue('seller', { value: pd.seller.id, label: pd.seller.name });

          if (pd.categoryId) {
            setSelectedCategory(pd.categoryId);
          }
          if (pd.categoryProductId) {
            const pp = CATEGORY_PRODUCTS.find(p => p.id === pd.categoryProductId) ||
              { id: pd.categoryProductId, name: 'Loaded Template', categoryId: pd.categoryId, categoryName: 'Unknown', isActive: true };
            setSelectedPlatformProduct(pp);
          }

          if (pd.variants) setVariants(pd.variants);
          if (pd.globalSpecs) setGlobalSpecs(pd.globalSpecs);

          if (pd.dynamicAttributes) {
            pd.dynamicAttributes.forEach((da: any) => {
              setValue(`dynamicAttributes.${da.attributeId}`, da.values.map((v: any) => v.valueId || v.id));
              setValue(`isVariantAttribute.${da.attributeId}`, da.isVariant);
            });
          }
        }
      };
      loadProduct();
    }
  }, [id, setValue, CATEGORY_PRODUCTS]);

  const handleCategorySelect = (value: string | undefined) => {
    setSelectedCategory(value || null);
    if (!value) {
      setValue('categoryProductId', undefined); // Reset product when category changes/clears
      setSelectedPlatformProduct(null);
    }
  };

  const availableCategoryProducts = useMemo(() => {
    console.log(CATEGORY_PRODUCTS)
    if (selectedCategory) return CATEGORY_PRODUCTS.filter(p => p.categoryId === selectedCategory);
    return CATEGORY_PRODUCTS;
  }, [selectedCategory, CATEGORY_PRODUCTS]);
  const handlePlatformProductSelect = (value: string | undefined) => {
    if (!value) {
      setSelectedPlatformProduct(null);
      return;
    }
    const pp = CATEGORY_PRODUCTS.find(p => p.id === value);
    setSelectedPlatformProduct(pp || null);

    // Auto-fill some base info if desired
    if (pp) {
      setValue('name', pp.name);
      if (pp.categoryId && pp.categoryId !== selectedCategory) {
        setSelectedCategory(pp.categoryId);
        setValue('categoryId', pp.categoryId);
      }
    }
  };

  const updateVariant = (id: string, field: string, value: any) => {
    setVariants(variants.map(v => {
      if (v.id !== id) return v;
      if (field === 'price') return { ...v, price: { ...v.price, amount: value } };
      return { ...v, [field]: value };
    }));
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

  const confirmSave = async () => {
    if (!pendingStatus) return;
    const values = getValues();

    // Map dynamic attributes to nested structure
    const mappedDynamicAttributes: any[] = [];
    const attrLookup = new Map<string, { name: string; groupId: string; groupName: string; options: { id: string; label: string }[] }>();
    dynamicAttributeGroups.forEach(group => {
      group.attributes.forEach(attr => attrLookup.set(attr.id, { name: attr.name, groupId: group.groupId, groupName: group.groupName, options: attr.options }));
    });

    Object.entries(dynamicAttributesValues).forEach(([attrId, vIds]) => {
      const valArray = Array.isArray(vIds) ? vIds : [];
      const attrInfo = attrLookup.get(attrId);
      if (valArray.length > 0 && attrInfo) {
        mappedDynamicAttributes.push({
          attributeId: attrId,
          attributeName: attrInfo.name,
          attributeGroupId: attrInfo.groupId,
          attributeGroupName: attrInfo.groupName,
          isVariant: !!isVariantAttribute[attrId],
          values: valArray.map(vId => {
            const opt = attrInfo.options.find(o => o.id === vId);
            return { id: vId, label: opt?.label || vId };
          })
        });
      }
    });

    const payload = {
      status: pendingStatus,
      updatedAt: new Date().toISOString().split('T')[0],
      ...(pendingStatus === 'Submitted' || pendingStatus === 'Resubmitted' ? { submittedAt: new Date().toISOString().split('T')[0] } : {}),
      ...values,
      countryOfOrigin: values.countryOfOrigin ? { code: values.countryOfOrigin.value, name: values.countryOfOrigin.label } : undefined,
      manufacturer: values.manufacturer ? { id: values.manufacturer.value, name: values.manufacturer.label } : undefined,
      brand: values.brand ? { id: values.brand.value, name: values.brand.label } : undefined,
      seller: values.seller ? { id: values.seller.value, name: values.seller.label } : undefined,
      dynamicAttributes: mappedDynamicAttributes,
      variants: variants,
      globalSpecs: globalSpecs
    };

    if (id) {
      const existsInReviews = await db.userProductReviews.get(id);
      if (existsInReviews) {
        await db.userProductReviews.update(id, payload);
      } else {
        // If they are editing a published product, save the draft to reviews
        await db.userProductReviews.put({
          ...payload,
          id,
          tenantId: 'tenant-1',
          tenantName: 'Acme Corp (Business)',
          categoryName: selectedCategory || 'Uncategorized',
          reviewData: {}
        } as any);
      }
    } else {
      await db.userProductReviews.add({
        id: `up-${Date.now()}`,
        tenantId: 'tenant-1',
        tenantName: 'Acme Corp (Business)',
        categoryName: selectedCategory || 'Uncategorized',
        createdAt: new Date().toISOString().split('T')[0],
        reviewData: {},
        ...payload
      } as any);
    }

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
          value={record.price?.amount || 0}
          onChange={(val: number) => updateVariant(record.id, 'price', val)}
          prefix="$"
          disabled={isReadOnly}
        />
      )
    },
    {
      title: 'Stock (Qty)',
      key: 'stock',
      render: (_: any, record: any) => (
        <VariantInput
          value={record.stock}
          onChange={(val: number) => {
            updateVariant(record.id, 'stock', val);
            updateVariant(record.id, 'available', val);
          }}
          disabled={isReadOnly}
        />
      )
    },
    {
      title: 'Min Order Qty',
      key: 'minOrderQuantity',
      render: (_: any, record: any) => (
        <VariantInput
          value={record.minOrderQuantity}
          onChange={(val: number) => updateVariant(record.id, 'minOrderQuantity', val)}
          disabled={isReadOnly}
        />
      )
    }
  ];

  if (currentStatus === 'Changes Requested' || currentStatus === 'Resubmitted') {
    variantColumns.push({
      title: 'Platform Review',
      key: 'review',
      render: (_: any, record: any) => <FieldReviewAlert entityKey={`variant-${record.id}`} reviewData={reviewData} />
    } as any);
  }

  return (
    <div className="w-full max-w-5xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Builder</h1>
        <p className="text-gray-500">Create or revise a product based on platform templates.</p>
      </div>

      {id && <WorkflowTimeline currentStatus={currentStatus} />}

      <form className="space-y-6">
        <fieldset disabled={isReadOnly} className="space-y-6">

          {/* STEP 1: MASTER PRODUCT SELECTION */}
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-sky-600">
              <Lucide.Link size={20} />
              <h2 className="text-lg font-semibold m-0">1. Select Master Product</h2>
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

            <FormItem label="Master Product" required error={errors.categoryProductId?.message as string}>
              <Controller
                name="categoryProductId"
                control={control}
                rules={{ required: 'Please select a product' }}
                render={({ field }) => (
                  <AntSelect
                    {...field}
                    size="large"
                    placeholder="Select a product..."
                    onChange={(val) => {
                      field.onChange(val);
                      handlePlatformProductSelect(val);
                    }}
                    options={availableCategoryProducts.map(p => ({ label: p.name, value: p.id }))}
                    showSearch
                    allowClear
                    // disabled={availableCategoryProducts.length === 0}
                    status={errors.categoryProductId ? 'error' : ''}
                    className='w-full'
                  />
                )}
              />
            </FormItem>
          </AntCard>

          {/* STEP 2: DIMENSIONS & WEIGHT */}
          <div className={selectedPlatformProduct ? "opacity-100 transition-opacity" : "opacity-50 pointer-events-none transition-opacity"}>
            <AntCard className="mb-6 shadow-sm border-gray-200">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <Lucide.Ruler size={20} />
                <h2 className="text-lg font-semibold m-0">2. Dimensions & Weight</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6">
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
                <FormItem label="Length">
                  <Controller
                    name="length"
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
                <div>
                  <FormItem label="Product Name" required error={errors.name?.message as string}>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field }) => <AntInput {...field} size="large" status={errors.name ? 'error' : ''} />}
                    />
                  </FormItem>
                  <FieldReviewAlert entityKey="prod-name" reviewData={reviewData} />
                </div>
                <div>
                  <FormItem label="Model number">
                    <Controller
                      name="modelNumber"
                      control={control}
                      render={({ field }) => <AntInput {...field} size="large" />}
                    />
                  </FormItem>
                  <FieldReviewAlert entityKey="prod-model" reviewData={reviewData} />
                </div>
                <div>
                  <FormItem label="Part number" required error={errors.partNumber?.message as string}>
                    <Controller
                      name="partNumber"
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field }) => <AntInput {...field} size="large" status={errors.partNumber ? 'error' : ''} />}
                    />
                  </FormItem>
                  <FieldReviewAlert entityKey="prod-part" reviewData={reviewData} />
                </div>
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
                        labelInValue
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
                        labelInValue
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
                        labelInValue
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
                        labelInValue
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
                        <div key={attr.id}>
                          <FormItem label={
                            <div className="flex justify-between items-center w-full">
                              <span>{attr.name}</span>
                              <Controller
                                name={`isVariantAttribute.${attr.id}`}
                                control={control}
                                render={({ field }) => (
                                  <AntCheckbox {...field} checked={field.value} className="text-xs text-gray-500 font-normal">
                                    Is Variant
                                  </AntCheckbox>
                                )}
                              />
                            </div>
                          }>
                            <Controller
                              name={`dynamicAttributes.${attr.id}`}
                              control={control}
                              render={({ field }) => (
                                <AntSelect
                                  {...field}
                                  mode='multiple'
                                  size="large"
                                  placeholder={`Select ${attr.name}`}
                                  options={attr.options.map((opt: any) => ({ label: opt.label, value: opt.id }))}
                                  className="w-full"
                                  showSearch
                                />
                              )}
                            />
                          </FormItem>
                          <FieldReviewAlert entityKey={`spec-${attr.name}`} reviewData={reviewData} />
                        </div>
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
                          <span className="font-bold mr-1">{spec.attributeName || spec.name}:</span> {spec.values ? spec.values.map((v: any) => v.label).join(', ') : spec.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider">Sellable Product Variants</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Product Numbers (SKUs) are auto-generated based on combinations. Set your minimum prices and stock levels below.
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


        </fieldset>
      </form>

      {/* STICKY FOOTER ACTIONS */}
      {!isReadOnly && (
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
      )}

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
                    <span className="font-bold mr-1">{spec.attributeName || spec.name}:</span> {spec.values ? spec.values.map((v: any) => v.label).join(', ') : spec.value}
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
                  { title: 'Price', dataIndex: 'price', key: 'price', render: (val: any) => <span className="text-xs font-semibold">${val?.amount || 0}</span> },
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
