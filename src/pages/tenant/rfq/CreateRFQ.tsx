import React, { useState, useMemo } from 'react';
import { Card as AntCard, Button as AntButton, Input as AntInput, Select as AntSelect, DatePicker as AntDatePicker, Steps as AntSteps, notification, Table as AntTable, Popconfirm, Checkbox as AntCheckbox, Modal as AntModal, Descriptions as AntDescriptions, Tag as AntTag, Pagination as AntPagination, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { createRFQ, type RFQItem } from '../../../data/mockRFQs';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import CategoryPicker from '../../../components/common/CategoryPicker';
import FormItem from '../../../components/common/FormItem';
import { getProducts, type Product } from '../../../data/mockProducts';

// Mock Platform Products (same as ProductBuilder)
const PLATFORM_PRODUCTS = [
  { id: 'pp-1', name: 'Master iPhone 14', categoryId: 'c-1-1-1-1' },
  { id: 'pp-2', name: 'Master MacBook Pro', categoryId: 'c-1-1-1-2' },
  { id: 'pp-3', name: 'Industrial Servo Motor Type-A', categoryId: 'c-2-2-1-1' },
];

// Mock dynamic attribute groups based on category (copied from ProductBuilder)
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

const CreateRFQ: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(0);
  const [previewProduct, setPreviewProduct] = useState<{ variant: any, product: Product, itemIndex: number } | null>(null);
  const [activeDrawerItemIndex, setActiveDrawerItemIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      submissionDeadline: null as any,
      currency: 'USD',
      contactEmail: '',
      contactMobile: '',
      shippingDestination: '',
      specifications: '',
      termsAgreed: false,
      marketingConsent: false,
      shareContact: false,
      items: [] as (Omit<RFQItem, 'id'> & { dynamicAttributes?: Record<string, string> })[]
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch('items');

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to="/rfqs/outbound" className="text-gray-500 hover:text-sky-600 transition-colors">My RFQs</Link>, url: '/rfqs/outbound' },
    { title: <span className="text-gray-900 font-semibold">Create RFQ</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const allTenantProducts = useMemo(() => getProducts(), []);
  const allVariants = useMemo(() => {
    return allTenantProducts.flatMap(p =>
      (p.payload?.variants || []).map(v => ({
        variant: v,
        product: p
      }))
    );
  }, [allTenantProducts]);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep === 0) {
      const { title, submissionDeadline, shippingDestination, contactEmail } = watch();
      if (!title || !submissionDeadline || !shippingDestination || !contactEmail) {
        notification.error({ message: 'Please fill in all global required fields' });
        return;
      }
    }
    if (currentStep === 1) {
      if (itemFields.length === 0) {
        notification.error({ message: 'Please add at least one line item.' });
        return;
      }
      // Validate all items
      for (const item of watchItems) {
        if (!item.quantity) {
          notification.error({ message: 'All items must have a quantity' });
          return;
        }
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = (data: any) => {
    if (!data.termsAgreed || !data.shareContact) {
      notification.error({ message: 'You must agree to the terms and consent to share contact details.' });
      return;
    }

    const finalItems = data.items.map((item: any, index: number) => ({
      ...item,
      id: `item-${index + 1}`
    }));

    createRFQ({
      title: data.title,
      requesterTenantId: activeWorkspace.id,
      requesterTenantName: activeWorkspace.name,
      contactEmail: data.contactEmail,
      contactMobile: data.contactMobile,
      submissionDeadline: data.submissionDeadline.format('YYYY-MM-DD'),
      currency: data.currency,
      shippingDestination: data.shippingDestination,
      specifications: data.specifications,
      items: finalItems
    });

    notification.success({ message: 'RFQ created successfully!' });
    navigate('/rfqs/outbound');
  };



  return (
    <div className="w-full pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Request for Quotation</h1>
        <p className="text-gray-500">Initiate a new multi-item RFQ to get pricing from sellers.</p>
      </div>

      <AntSteps
        current={currentStep}
        items={[
          { title: 'Global Details' },
          { title: 'Line Items' },
          { title: 'Review & Submit' }
        ]}
        className="mb-8"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: Global Details */}
        {currentStep === 0 && (
          <AntCard className="shadow-sm border-gray-200">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">RFQ Global Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <FormItem label="RFQ Title" required>
                <Controller name="title" control={control} render={({ field }) => <AntInput {...field} size="large" placeholder="e.g. Q3 Electronics Sourcing" />} />
              </FormItem>
              <FormItem label="Currency" required>
                <Controller name="currency" control={control} render={({ field }) => (
                  <AntSelect {...field} size="large" options={[{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, { label: 'GBP', value: 'GBP' }]} className="w-full" />
                )} />
              </FormItem>


              <FormItem label="Submission Deadline" required>
                <Controller name="submissionDeadline" control={control} render={({ field }) => <AntDatePicker {...field} size="large" className="w-full" />} />
              </FormItem>

              <FormItem label="Contact Email" required>
                <Controller name="contactEmail" control={control} render={({ field }) => <AntInput type="email" {...field} size="large" placeholder="buyer@example.com" />} />
              </FormItem>
              <FormItem label="Contact Mobile">
                <Controller name="contactMobile" control={control} render={({ field }) => <AntInput {...field} size="large" placeholder="+1-555-0000" />} />
              </FormItem>

              <FormItem label="Shipping Destination" required className="md:col-span-2">
                <Controller name="shippingDestination" control={control} render={({ field }) => <AntInput {...field} size="large" placeholder="e.g. Warehouse 4, TX" />} />
              </FormItem>
            </div>

            <FormItem label="Detailed Specification">
              <Controller name="specifications" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={4} placeholder="Detailed technical specifications or requirements..." />} />
            </FormItem>


          </AntCard>
        )}

        {/* STEP 2: Line Items */}
        {currentStep === 1 && (
          <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 m-0">Line Items ({itemFields.length})</h3>
              <AntButton htmlType="button" type="primary" onClick={() => appendItem({ quantity: 1 } as any)}>
                <Lucide.Plus size={16} className="mr-2" /> Add Item
              </AntButton>
            </div>
            <AntTable
              dataSource={itemFields}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              bordered
              columns={[
                {
                  title: '#',
                  width: 50,
                  render: (_, __, index) => <span className="font-semibold">{index + 1}</span>
                },
                {
                  title: 'Quantity',
                  width: 120,
                  render: (_, field, index) => {
                    const qty = watchItems[index]?.quantity || 0;
                    const unit = watchItems[index]?.unit || 'Units';
                    return <span className="font-medium text-gray-800">{qty} {unit}</span>;
                  }
                },
                {
                  title: 'Platform Product',
                  render: (_, field, index) => {
                    const currentCategory = watchItems[index]?.categoryId;
                    const currentPlatformProduct = watchItems[index]?.platformProductId;

                    const pName = PLATFORM_PRODUCTS.find(x => x.id === currentPlatformProduct)?.name;
                    return (
                      <div className="flex flex-col text-sm">
                        <div className="truncate text-gray-500">Category: <span className="font-medium text-gray-800">{currentCategory || 'Not selected'}</span></div>
                        <div className="truncate text-gray-500">Product: <span className="font-medium text-gray-800">{pName || 'Not selected'}</span></div>
                      </div>
                    );
                  }
                },
                {
                  title: 'Selected Product',
                  render: (_, field, index) => {
                    const item = watchItems[index];

                    if (item.targetTenantId) {
                      return (
                        <div className="flex flex-col text-sm">
                          <span className="text-green-700 font-semibold flex items-center mb-1">
                            <Lucide.CheckCircle size={14} className="mr-1" /> Mapped
                          </span>
                          <span className="text-gray-600 truncate text-xs">Seller: <span className="font-medium">{item.targetTenantId}</span></span>
                          <span className="text-gray-600 truncate text-xs">SKU: <span className="font-medium">{item.targetSku || item.platformProductId}</span></span>
                        </div>
                      );
                    }
                    return <span className="text-gray-400 italic text-sm flex items-center"><Lucide.Globe size={14} className="mr-1" /> Unmapped (Open RFQ)</span>;
                  }
                },
                {
                  title: 'Action',
                  width: 140,
                  render: (_, __, index) => (
                    <div className="flex items-center gap-2">
                      <AntButton htmlType="button" size="small" type="dashed" onClick={() => setActiveDrawerItemIndex(index)}>
                        <Lucide.Settings size={14} className="mr-1" /> Configure
                      </AntButton>
                      <Popconfirm title="Remove this item?" onConfirm={() => removeItem(index)}>
                        <AntButton type="text" danger icon={<Lucide.Trash2 size={16} />} />
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}

        {/* STEP 3: Review */}
        {currentStep === 2 && (
          <AntCard className="shadow-sm border-gray-200">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Review RFQ</h3>
            <div className="mb-6">
              <p><strong>Submission Deadline:</strong> {watch().submissionDeadline?.format('YYYY-MM-DD')}</p>
              <p><strong>Destination:</strong> {watch().shippingDestination}</p>
              <p><strong>Total Items:</strong> {watchItems.length}</p>
            </div>

            <AntTable
              dataSource={watchItems}
              rowKey={(_, idx) => String(idx)}
              pagination={{ pageSize: 10 }}
              size="small"
              bordered
              expandable={{
                expandedRowRender: (record, index) => {
                  const currentCategory = watchItems[index]?.categoryId;
                  const dynamicAttrGroups = currentCategory ? getDynamicAttributeGroups(currentCategory) : [];

                  return (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Item Specifications Review</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div><span className="text-gray-500">Brand:</span> {watchItems[index]?.brand || 'N/A'}</div>
                        <div><span className="text-gray-500">Manufacturer:</span> {watchItems[index]?.manufacturer || 'N/A'}</div>
                        <div><span className="text-gray-500">Country:</span> {watchItems[index]?.countryOfOrigin || 'N/A'}</div>
                        <div><span className="text-gray-500">Model:</span> {watchItems[index]?.modelNumber || 'N/A'}</div>
                        <div><span className="text-gray-500">Part #:</span> {watchItems[index]?.partNumber || 'N/A'}</div>
                        <div><span className="text-gray-500">Dimensions:</span> {watchItems[index]?.height} x {watchItems[index]?.width} x {watchItems[index]?.weight}</div>
                      </div>

                      {dynamicAttrGroups.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Dynamic Specs</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {dynamicAttrGroups.flatMap(group =>
                              group.attributes.map(attr => {
                                const val = watchItems[index]?.dynamicAttributes?.[attr.id];
                                if (!val || (Array.isArray(val) && val.length === 0)) return null;
                                return (
                                  <div key={attr.id}><span className="text-gray-500">{attr.name}:</span> {Array.isArray(val) ? val.join(', ') : val}</div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
                rowExpandable: () => true
              }}
              columns={[
                { title: 'Item #', width: 80, render: (_, __, i) => i + 1 },
                { title: 'Quantity', width: 100, dataIndex: 'quantity' },
                {
                  title: 'Target Info', render: (_, r) => {
                    if (r.targetTenantId) return <span>Seller: <strong>{r.targetTenantId}</strong> (SKU: {r.targetSku || r.platformProductId})</span>;
                    if (r.platformProductId) return <span>Platform ID: <strong>{r.platformProductId}</strong></span>;
                    if (r.targetSku) return <span>Search: <strong>{r.targetSku}</strong></span>;
                    return <span className="text-gray-400 italic">Open RFQ</span>;
                  }
                }
              ]}
            />

            <div className="mt-8 space-y-3 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">Confirm and Submit</h4>
              <Controller
                name="termsAgreed"
                control={control}
                render={({ field }) => (
                  <AntCheckbox checked={field.value} onChange={field.onChange}>
                    I confirm that I have read and agree to the RFQ posting terms.
                  </AntCheckbox>
                )}
              />
              <br />
              <Controller
                name="shareContact"
                control={control}
                render={({ field }) => (
                  <AntCheckbox checked={field.value} onChange={field.onChange}>
                    I agree to share my contact details with interested vendors.
                  </AntCheckbox>
                )}
              />
              <br />
              <Controller
                name="marketingConsent"
                control={control}
                render={({ field }) => (
                  <AntCheckbox checked={field.value} onChange={field.onChange}>
                    I consent to receive marketing communications.
                  </AntCheckbox>
                )}
              />
            </div>
          </AntCard>
        )}

        <div className="mt-8 flex justify-between">
          {currentStep > 0 ? (
            <AntButton htmlType="button" size="large" onClick={handlePrev}>Back</AntButton>
          ) : <div />}

          {currentStep < 2 ? (
            <AntButton htmlType="button" type="primary" size="large" className="bg-sky-600" onClick={handleNext}>Next Step</AntButton>
          ) : (
            <AntButton type="primary" size="large" className="bg-sky-600" htmlType="submit">Submit RFQ</AntButton>
          )}
        </div>
      </form>


      {/* Item Configuration Drawer */}
      <AntDrawer
        title={<span className="font-bold text-gray-800">Item Configuration (Line {activeDrawerItemIndex !== null ? activeDrawerItemIndex + 1 : ''})</span>}
        size="1200"
        onClose={() => setActiveDrawerItemIndex(null)}
        open={activeDrawerItemIndex !== null}
        destroyOnHidden
        className="bg-gray-50"
        footer={
          <div className="flex justify-end">
            <AntButton onClick={() => setActiveDrawerItemIndex(null)} type="primary" className="bg-sky-600">
              Done
            </AntButton>
          </div>
        }
      >
        {activeDrawerItemIndex !== null && (() => {
          const index = activeDrawerItemIndex;
          const currentCategory = watchItems[index]?.categoryId;
          const currentSku = watchItems[index]?.targetSku || '';
          const currentPlatformProduct = watchItems[index]?.platformProductId;
          const dynamicAttrGroups = currentCategory ? getDynamicAttributeGroups(currentCategory) : [];

          const platformProducts = currentCategory ? PLATFORM_PRODUCTS.filter(p => p.categoryId === currentCategory) : PLATFORM_PRODUCTS;

          // Progressive filtering for matching products
          let matches = allVariants;

          if (currentSku) {
            const query = currentSku.toLowerCase();
            matches = matches.filter(v =>
              v.variant.sku.toLowerCase().includes(query) ||
              v.variant.name.toLowerCase().includes(query) ||
              v.product.name.toLowerCase().includes(query) ||
              (v.product.payload?.productData?.platformProductId || '').toLowerCase().includes(query)
            );
          }
          if (currentPlatformProduct) {
            matches = matches.filter(v => v.product.payload?.productData?.platformProductId === currentPlatformProduct || v.product.id === currentPlatformProduct);
          }
          if (currentCategory) {
            matches = matches.filter(v => {
              const pId = v.product.payload?.productData?.platformProductId;
              const pp = PLATFORM_PRODUCTS.find(p => p.id === pId);
              return pp?.categoryId === currentCategory;
            });
          }

          return (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT: Unified Specifications & Targeting */}
                <div className="flex flex-col gap-6">

                  {/* Basic Details */}
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Basic Details & Targeting</h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormItem label="Quantity" className="mb-0">
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => <AntInput type="number" {...field} className="w-full" min={1} placeholder="Qty" />}
                        />
                      </FormItem>
                      <FormItem label="Unit" className="mb-0">
                        <Controller
                          name={`items.${index}.unit`}
                          control={control}
                          render={({ field }) => (
                            <AntSelect {...field} className="w-full" placeholder="Unit" options={[
                              { label: 'Units', value: 'Units' },
                              { label: 'Pieces', value: 'Pieces' },
                              { label: 'Sets', value: 'Sets' },
                              { label: 'Boxes', value: 'Boxes' },
                              { label: 'Kg', value: 'Kg' },
                              { label: 'Meters', value: 'Meters' }
                            ]} />
                          )}
                        />
                      </FormItem>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <Controller
                        name={`items.${index}.targetSku`}
                        control={control}
                        render={({ field }) => (
                          <AntInput
                            {...field}
                            placeholder="Search by Platform Product Number, Name or SKU"
                            prefix={<Lucide.Search size={14} className="text-gray-400" />}
                          />
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Controller
                        name={`items.${index}.categoryId`}
                        control={control}
                        render={({ field }) => (
                          <CategoryPicker
                            value={field.value}
                            onChange={(id) => {
                              field.onChange(id);
                              setValue(`items.${index}.platformProductId`, '');
                            }}
                          />
                        )}
                      />
                      <Controller
                        name={`items.${index}.platformProductId`}
                        control={control}
                        render={({ field }) => (
                          <AntSelect
                            {...field}
                            onChange={(val) => {
                              field.onChange(val);
                              const p = PLATFORM_PRODUCTS.find(x => x.id === val);
                              if (p && !watchItems[index]?.categoryId) setValue(`items.${index}.categoryId`, p.categoryId);
                            }}
                            options={platformProducts.map(p => ({ label: p.name, value: p.id }))}
                            className="w-full"
                            placeholder="Select Platform Product (Optional)"
                            allowClear
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Extended Specifications */}
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold text-sky-700 mb-4 border-b border-gray-100 pb-2 flex items-center">
                      <Lucide.FileText size={16} className="mr-2" /> Specifications
                    </h4>
                    <div className="flex flex-col gap-3 text-sm">
                      <FormItem label="Brand" className="mb-0"><Controller name={`items.${index}.brand`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} options={[{ label: 'Brand A', value: 'Brand A' }, { label: 'Brand B', value: 'Brand B' }]} placeholder="Brand" allowClear />} /></FormItem>
                      <FormItem label="Manufacturer" className="mb-0"><Controller name={`items.${index}.manufacturer`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} options={[{ label: 'Acme Corp', value: 'Acme Corp' }, { label: 'Globex', value: 'Globex' }]} placeholder="Manufacturer" allowClear />} /></FormItem>
                      <FormItem label="Country" className="mb-0"><Controller name={`items.${index}.countryOfOrigin`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} options={[{ label: 'USA', value: 'USA' }, { label: 'Germany', value: 'Germany' }, { label: 'China', value: 'China' }]} placeholder="Country" allowClear />} /></FormItem>

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <FormItem label="Model" className="mb-0"><Controller name={`items.${index}.modelNumber`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="Model" />} /></FormItem>
                        <FormItem label="Part #" className="mb-0"><Controller name={`items.${index}.partNumber`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="Part #" />} /></FormItem>
                      </div>

                      <FormItem label="Dimensions (H x W x Wt)" className="mb-0 mt-2">
                        <div className="flex gap-2">
                          <Controller name={`items.${index}.height`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="H" />} />
                          <Controller name={`items.${index}.width`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="W" />} />
                          <Controller name={`items.${index}.weight`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="Wt" />} />
                        </div>
                      </FormItem>
                    </div>
                    {dynamicAttrGroups.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Dynamic Attributes</h4>
                        <div className="flex flex-col gap-3 text-sm">
                          {dynamicAttrGroups.flatMap(group =>
                            group.attributes.map(attr => (
                              <FormItem key={attr.id} label={attr.name} className="mb-0">
                                <Controller
                                  name={`items.${index}.dynamicAttributes.${attr.id}`}
                                  control={control}
                                  render={({ field }) => (
                                    <AntSelect {...field} mode='multiple' options={attr.options.map(o => ({ label: o, value: o }))} className="w-full" placeholder={`Select`} allowClear />
                                  )}
                                />
                              </FormItem>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Matching Products */}
                <div>
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex flex-col ">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <h4 className="text-sm font-semibold text-sky-700 flex items-center">
                        <Lucide.Package size={16} className="mr-2" /> Matching Products
                      </h4>
                      {!watchItems[index]?.targetTenantId && (
                        <AntButton htmlType="button" size="small" type="dashed" onClick={() => notification.info({ message: 'Searching...' })}>
                          <Lucide.Search size={14} className="mr-1" /> Search
                        </AntButton>
                      )}
                    </div>

                    {watchItems[index]?.targetTenantId ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center mt-4">
                        <div className="font-semibold text-green-800 flex items-center justify-center mb-3">
                          <Lucide.CheckCircle size={24} className="mr-2" /> Product Selected
                        </div>
                        <div className="text-sm text-green-700 mb-1">Seller: <span className="font-bold">{watchItems[index].targetTenantId}</span></div>
                        <div className="text-sm text-green-700 mb-6">SKU: <span className="font-bold">{watchItems[index].targetSku || watchItems[index].platformProductId}</span></div>
                        <AntButton htmlType="button" danger block onClick={() => {
                          setValue(`items.${index}.targetTenantId`, '');
                          setValue(`items.${index}.platformProductId`, '');
                        }}>Change Selected Product</AntButton>
                      </div>
                    ) : (
                      <div className="flex-1 pr-2">
                        <div className="flex flex-col">
                          {matches.slice((currentPage - 1) * 10, currentPage * 10).map((v: any) => (
                            <div className="mb-3" key={v.variant.id || v.variant.sku}>
                              <div
                                className="border border-gray-200 rounded-lg p-3 hover:border-sky-400 hover:shadow-md cursor-pointer transition-all bg-white flex flex-col"
                                onClick={() => setPreviewProduct({ variant: v.variant, product: v.product, itemIndex: index })}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                                    {v.product.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="font-semibold text-gray-800 text-sm truncate">{v.product.name}</div>
                                    <div className="font-medium text-sky-700 text-xs truncate">{v.variant.name}</div>
                                  </div>
                                  <div className="font-bold text-green-700 text-sm">${v.variant.price}</div>
                                </div>
                                <div className="flex justify-between items-center mt-auto border-t border-gray-50 pt-2">
                                  <div className="text-xs text-gray-500">Seller: {v.product.tenantName}</div>
                                  <span className="text-sky-600 text-xs font-medium flex items-center bg-sky-50 px-2 py-1 rounded hover:bg-sky-100">
                                    <Lucide.Eye size={12} className="mr-1" /> View Details
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {matches.length > 0 && (
                          <div className="mt-4 flex justify-end">
                            <AntPagination
                              current={currentPage}
                              total={matches.length}
                              pageSize={10}
                              onChange={(page) => setCurrentPage(page)}
                              size="small"
                            />
                          </div>
                        )}

                        {matches.length === 0 && (
                          <div className="text-center text-gray-400 py-8 italic">
                            No matching products found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </AntDrawer>

      {/* Product Preview Modal */}
      <AntModal
        title="Product Details & Selection"
        open={!!previewProduct}
        onCancel={() => setPreviewProduct(null)}
        width={700}
        footer={null}
        zIndex={1050}
      >
        {previewProduct?.product && previewProduct?.variant && (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 m-0">{previewProduct.product.name}</h3>
                <div className="text-gray-500 mt-1">Seller: {previewProduct.product.tenantName}</div>
              </div>
              <AntTag color="blue">{previewProduct.product.categoryName}</AntTag>
            </div>

            <h4 className="font-semibold text-gray-700 mb-2">Static Details</h4>
            <AntDescriptions bordered size="small" column={2} className="mb-6">
              <AntDescriptions.Item label="Part Number">{previewProduct.product.partNumber || 'N/A'}</AntDescriptions.Item>
              <AntDescriptions.Item label="Status">{previewProduct.product.status}</AntDescriptions.Item>
              <AntDescriptions.Item label="Brand">{previewProduct.product.payload.productData.brand || 'N/A'}</AntDescriptions.Item>
              <AntDescriptions.Item label="Manufacturer">{previewProduct.product.payload.productData.manufacturer || 'N/A'}</AntDescriptions.Item>
              <AntDescriptions.Item label="Country">{previewProduct.product.payload.productData.countryOfOrigin || 'N/A'}</AntDescriptions.Item>
            </AntDescriptions>

            <h4 className="font-semibold text-gray-700 mb-2">Variant Details</h4>
            <AntDescriptions bordered size="small" column={2} className="mb-6">
              <AntDescriptions.Item label="Variant Name" span={2}><span className="font-medium text-sky-700">{previewProduct.variant.name}</span></AntDescriptions.Item>
              <AntDescriptions.Item label="SKU">{previewProduct.variant.sku}</AntDescriptions.Item>
              <AntDescriptions.Item label="Price"><span className="font-bold text-green-700">${previewProduct.variant.price}</span></AntDescriptions.Item>
              <AntDescriptions.Item label="Stock">{previewProduct.variant.stock}</AntDescriptions.Item>
              <AntDescriptions.Item label="Min Order">{previewProduct.variant.minOrder || 1}</AntDescriptions.Item>
            </AntDescriptions>

            <h4 className="font-semibold text-gray-700 mb-2">Global Specs</h4>
            <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
              {previewProduct.product.payload.globalSpecs?.map((spec, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-gray-500">{spec.name}:</span> {spec.value}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <AntButton htmlType="button" onClick={() => setPreviewProduct(null)} className="mr-3">Cancel</AntButton>
              <AntButton htmlType="button" type="primary" className="bg-sky-600" onClick={() => {
                const prod = previewProduct.product;
                const variant = previewProduct.variant;
                const idx = previewProduct.itemIndex;
                setValue(`items.${idx}.targetTenantId`, prod.tenantId);
                setValue(`items.${idx}.platformProductId`, prod.payload.productData.platformProductId || prod.id);
                setValue(`items.${idx}.targetSku`, variant.sku);
                setPreviewProduct(null);

                // If it was selected via the Drawer, we don't necessarily close the Drawer, but we show a success message
                notification.success({ message: `Selected ${variant.name} from ${prod.tenantName}` });
              }}>Select this Variant</AntButton>
            </div>
          </div>
        )}
      </AntModal>
    </div>
  );
};

export default CreateRFQ;
