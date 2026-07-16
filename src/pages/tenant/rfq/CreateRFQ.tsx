import React, { useState, useMemo } from 'react';
import { Card as AntCard, Button as AntButton, Input as AntInput, Select as AntSelect, DatePicker as AntDatePicker, Steps as AntSteps, notification, Table as AntTable, Popconfirm } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { createRFQ, type RFQType, type RFQItem } from '../../../data/mockRFQs';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import CategoryPicker from '../../../components/common/CategoryPicker';
import FormItem from '../../../components/common/FormItem';
import { getProducts } from '../../../data/mockProducts';

// Mock Platform Products (same as ProductBuilder)
const PLATFORM_PRODUCTS = [
  { id: 'pp-1', name: 'Master iPhone 14', categoryId: 'c-1-1-1-1' },
  { id: 'pp-2', name: 'Master MacBook Pro', categoryId: 'c-1-1-1-2' },
  { id: 'pp-3', name: 'Industrial Servo Motor Type-A', categoryId: 'c-2-2-1-1' },
];

const CreateRFQ: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(0);
  
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      requiredDate: null as any,
      shippingDestination: '',
      notes: '',
      items: [] as Omit<RFQItem, 'id'>[]
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

  const handleNext = () => {
    if (currentStep === 0) {
      const { requiredDate, shippingDestination } = watch();
      if (!requiredDate || !shippingDestination) {
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
        if (!item.type || !item.quantity) {
           notification.error({ message: 'All items must have a type and quantity' });
           return;
        }
        if (item.type === 'direct' && (!item.targetSku || !item.targetTenantId)) {
           notification.error({ message: 'Direct items must have a valid SKU' });
           return;
        }
        if (item.type === 'targeted' && !item.targetTenantId) {
           notification.error({ message: 'Targeted items must have a selected seller' });
           return;
        }
        if (item.type === 'broadcast' && !item.platformProductId) {
           notification.error({ message: 'Broadcast items must have a selected platform product' });
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
    const finalItems = data.items.map((item: any, index: number) => ({
      ...item,
      id: `item-${index + 1}`
    }));

    createRFQ({
      requesterTenantId: activeWorkspace.id,
      requesterTenantName: activeWorkspace.name,
      requiredDate: data.requiredDate.format('YYYY-MM-DD'),
      shippingDestination: data.shippingDestination,
      notes: data.notes,
      items: finalItems
    });

    notification.success({ message: 'RFQ created successfully!' });
    navigate('/rfqs/outbound');
  };

  const typeOptions = [
    { value: 'direct', label: 'Direct by SKU' },
    { value: 'targeted', label: 'Targeted Seller' },
    { value: 'broadcast', label: 'Broadcast Search' },
  ];

  return (
    <div className="w-full max-w-5xl pb-12">
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
              <FormItem label="Target Delivery Date" required>
                <Controller name="requiredDate" control={control} render={({ field }) => <AntDatePicker {...field} size="large" className="w-full" />} />
              </FormItem>
              <FormItem label="Shipping Destination" required>
                <Controller name="shippingDestination" control={control} render={({ field }) => <AntInput {...field} size="large" placeholder="e.g. Warehouse 4, TX" />} />
              </FormItem>
            </div>
            <FormItem label="General Notes/Instructions">
              <Controller name="notes" control={control} render={({ field }) => <AntInput.TextArea {...field} rows={4} placeholder="Include any overall terms, conditions, or instructions here..." />} />
            </FormItem>
          </AntCard>
        )}

        {/* STEP 2: Line Items */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {itemFields.map((field, index) => {
              const currentType = watchItems[index]?.type;
              const currentCategory = watchItems[index]?.categoryId;
              const currentPlatformProduct = watchItems[index]?.platformProductId;
              const currentSku = watchItems[index]?.targetSku;
              
              const predefined = PLATFORM_PRODUCTS.filter(p => p.categoryId === currentCategory);
              const platformProducts = predefined.length > 0 ? predefined : currentCategory ? [
                { id: `dyn-1-${currentCategory}`, name: `Standard Template` },
                { id: `dyn-2-${currentCategory}`, name: `Premium Template` },
              ] : [];

              const rawSellers = currentType === 'targeted' && currentPlatformProduct 
                ? allTenantProducts.filter(p => p.payload?.productData?.platformProductId === currentPlatformProduct)
                : [];
              const availableSellers = Array.from(new Map(rawSellers.map(p => [p.tenantId, p])).values());

              const handleSkuCheck = (sku: string) => {
                for (const p of allTenantProducts) {
                  const match = p.payload?.variants?.find(v => v.sku.toLowerCase() === sku.toLowerCase());
                  if (match) {
                    setValue(`items.${index}.targetTenantId`, p.tenantId);
                    notification.success({ message: `Found seller: ${p.tenantName}` });
                    return;
                  }
                }
                setValue(`items.${index}.targetTenantId`, '');
                notification.error({ message: 'SKU not found' });
              };

              return (
                <AntCard key={field.id} className="shadow-sm border-gray-200 relative" title={`Line Item ${index + 1}`}>
                  <div className="absolute top-4 right-4">
                    <Popconfirm title="Remove this item?" onConfirm={() => removeItem(index)}>
                      <AntButton type="text" danger icon={<Lucide.Trash2 size={16} />} />
                    </Popconfirm>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormItem label="RFQ Type" required>
                      <Controller
                        name={`items.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <AntSelect {...field} options={typeOptions} className="w-full" placeholder="Select how to target" />
                        )}
                      />
                    </FormItem>
                    {currentType && (
                      <FormItem label="Required Quantity" required>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <AntInput type="number" {...field} className="w-full" min={1} />
                          )}
                        />
                      </FormItem>
                    )}
                  </div>

                  {currentType === 'direct' && (
                    <FormItem label="Target Platform SKU" required>
                      <div className="flex gap-2">
                        <Controller
                          name={`items.${index}.targetSku`}
                          control={control}
                          render={({ field }) => <AntInput {...field} placeholder="e.g. MC-R2-32-512" />}
                        />
                        <AntButton htmlType="button" onClick={() => handleSkuCheck(currentSku || '')}>Verify</AntButton>
                      </div>
                      {watchItems[index]?.targetTenantId && <div className="text-green-600 text-xs mt-1">Verified Seller ID: {watchItems[index].targetTenantId}</div>}
                    </FormItem>
                  )}

                  {(currentType === 'targeted' || currentType === 'broadcast') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormItem label="Category" required>
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
                      </FormItem>
                      {currentCategory && (
                        <FormItem label="Platform Product" required>
                          <Controller
                            name={`items.${index}.platformProductId`}
                            control={control}
                            render={({ field }) => (
                              <AntSelect
                                {...field}
                                options={platformProducts.map(p => ({ label: p.name, value: p.id }))}
                                className="w-full"
                                placeholder="Select Product"
                              />
                            )}
                          />
                        </FormItem>
                      )}
                    </div>
                  )}

                  {currentType === 'targeted' && currentPlatformProduct && (
                    <div className="mt-4">
                       <FormItem label="Select Seller" required>
                          {availableSellers.length > 0 ? (
                            <Controller
                              name={`items.${index}.targetTenantId`}
                              control={control}
                              render={({ field }) => (
                                <AntSelect
                                  {...field}
                                  options={availableSellers.map(p => ({ label: `${p.tenantName} (${p.name})`, value: p.tenantId }))}
                                  className="w-full"
                                  placeholder="Select a specific seller"
                                />
                              )}
                            />
                          ) : (
                            <div className="p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
                              No sellers currently offer this platform product in our system. Please select a different product or broadcast your request.
                            </div>
                          )}
                       </FormItem>
                    </div>
                  )}
                </AntCard>
              );
            })}

            <AntButton htmlType="button" type="dashed" block className="h-12 flex items-center justify-center gap-2" onClick={() => appendItem({ type: '' as any, quantity: 1 } as any)}>
              <Lucide.Plus size={16} /> Add Another Item
            </AntButton>
          </div>
        )}

        {/* STEP 3: Review */}
        {currentStep === 2 && (
          <AntCard className="shadow-sm border-gray-200">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Review RFQ</h3>
            <div className="mb-6">
              <p><strong>Required Date:</strong> {watch().requiredDate?.format('YYYY-MM-DD')}</p>
              <p><strong>Destination:</strong> {watch().shippingDestination}</p>
              <p><strong>Total Items:</strong> {watchItems.length}</p>
            </div>
            
            <AntTable
               dataSource={watchItems}
               rowKey={(_, idx) => String(idx)}
               pagination={false}
               size="small"
               columns={[
                 { title: 'Item #', render: (_, __, i) => i + 1 },
                 { title: 'Type', dataIndex: 'type', render: t => <span className="capitalize">{t}</span> },
                 { title: 'Quantity', dataIndex: 'quantity' },
                 { title: 'Target Info', render: (_, r) => {
                    if (r.type === 'direct') return `SKU: ${r.targetSku}`;
                    if (r.type === 'broadcast') return `Product ID: ${r.platformProductId}`;
                    return `Seller: ${r.targetTenantId}`;
                 }}
               ]}
            />
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
    </div>
  );
};

export default CreateRFQ;
