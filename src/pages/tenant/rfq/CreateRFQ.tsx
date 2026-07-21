import React, { useState, useMemo, useCallback } from 'react';
import { Card as AntCard, Button as AntButton, Input as AntInput, Select as AntSelect, DatePicker as AntDatePicker, Steps as AntSteps, notification, Table as AntTable, Popconfirm, Checkbox as AntCheckbox, Modal as AntModal, Descriptions as AntDescriptions, Tag as AntTag, Pagination as AntPagination, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { type RFQItem } from '../../../data/db';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import CategoryPicker from '../../../components/common/CategoryPicker';
import FormItem from '../../../components/common/FormItem';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserProduct } from '../../../data/db';

const CreateRFQ: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(0);
  const [previewProduct, setPreviewProduct] = useState<{ variant: any, product: UserProduct, itemIndex: number } | null>(null);
  const [activeDrawerItemIndex, setActiveDrawerItemIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PLATFORM_PRODUCTS = useLiveQuery(() => db.platformProducts.toArray()) || [];
  const allTenantProducts = useLiveQuery(() => db.userProducts.toArray()) || [];
  
  const dbCategories = useLiveQuery(() => db.categories.toArray()) || [];
  const dbAttributeGroups = useLiveQuery(() => db.attributeGroups.toArray()) || [];
  const dbAttributes = useLiveQuery(() => db.attributes.toArray()) || [];
  const dbAttributeValues = useLiveQuery(() => db.attributeValues.toArray()) || [];

  const getDynamicAttributeGroups = useCallback((categoryId: string) => {
    if (!categoryId) return [];
    const category = dbCategories.find(c => c.id === categoryId);
    if (!category || !category.mappedGroupIds) return [];

    return category.mappedGroupIds.map(groupId => {
      const group = dbAttributeGroups.find(g => g.id === groupId);
      if (!group) return null;
      return {
        groupId: group.id,
        groupName: group.name,
        attributes: group.attributeIds.map(attrId => {
          const attr = dbAttributes.find(a => a.id === attrId);
          if (!attr) return null;
          const options = (attr.valueIds || []).map(valId => {
            const val = dbAttributeValues.find(v => v.id === valId);
            return val ? val.value : '';
          }).filter(Boolean);
          return {
            id: attr.id,
            name: attr.name,
            options
          };
        }).filter(Boolean)
      };
    }).filter(Boolean) as any[];
  }, [dbCategories, dbAttributeGroups, dbAttributes, dbAttributeValues]);

  const { control, handleSubmit, watch, setValue } = useForm({
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

  const allVariants = useMemo(() => {
    return allTenantProducts.flatMap(p => {
      const variants = p.variants || [];
      return variants.map((v: any) => ({
        variant: v,
        product: p
      }));
    });
  }, [allTenantProducts]);

  const availableManufacturers = useMemo(() => {
    const m = new Set<string>();
    allTenantProducts.forEach(p => { if (p.manufacturer?.name) m.add(p.manufacturer.name); });
    return Array.from(m).map(val => ({ label: val, value: val }));
  }, [allTenantProducts]);

  const availableBrands = useMemo(() => {
    const b = new Set<string>();
    allTenantProducts.forEach(p => { if (p.brand?.name) b.add(p.brand.name); });
    return Array.from(b).map(val => ({ label: val, value: val }));
  }, [allTenantProducts]);

  const availableSellers = useMemo(() => {
    const s = new Set<string>();
    allTenantProducts.forEach(p => { if (p.tenantName) s.add(p.tenantName); });
    return Array.from(s).map(val => ({ label: val, value: val }));
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

  const onSubmit = async (data: any) => {
    if (!data.termsAgreed || !data.shareContact) {
      notification.error({ message: 'You must agree to the terms and consent to share contact details.' });
      return;
    }

    const finalItems = data.items.map((item: any, index: number) => ({
      ...item,
      id: `item-${Date.now()}-${index}`
    }));

    await db.rfqs.add({
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-${Math.floor(Math.random() * 100000)}`,
      title: data.title,
      status: 'Open',
      createdAt: new Date().toISOString(),
      requesterTenantId: activeWorkspace.id,
      requesterTenantName: activeWorkspace.name,
      contactEmail: data.contactEmail,
      contactMobile: data.contactMobile,
      submissionDeadline: data.submissionDeadline.format('YYYY-MM-DD'),
      currency: data.currency,
      shippingDestination: data.shippingDestination,
      specifications: data.specifications,
      items: finalItems,
      quotes: []
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
                  render: (_, __, index) => {
                    const qty = watchItems[index]?.quantity || 0;
                    const unit = watchItems[index]?.unit || 'Units';
                    return <span className="font-medium text-gray-800">{qty} {unit}</span>;
                  }
                },
                {
                  title: 'Product',
                  render: (_, __, index) => {
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
                  render: (_, __, index) => {
                    const item = watchItems[index];

                    if (item.targetTenantId) {
                      return (
                        <div className="flex flex-col text-sm">
                          <span className="text-green-700 font-semibold flex items-center mb-1">
                            <Lucide.CheckCircle size={14} className="mr-1" /> Mapped
                          </span>
                          <span className="text-gray-600 truncate text-xs">Seller: <span className="font-medium">{item.targetTenantId}</span></span>
                          <span className="text-gray-600 truncate text-xs">Platform ID: <span className="font-medium">{item.platformProductId}</span></span>
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
                expandedRowRender: (_, index) => {
                  const item = watchItems[index];
                  const currentCategory = item?.categoryId;
                  const dynamicAttrGroups = currentCategory ? getDynamicAttributeGroups(currentCategory) : [];
                  
                  // Check if a specific product was selected
                  const targetProduct = item?.platformProductId ? allTenantProducts.find(p => p.id === item.platformProductId) : null;

                  if (targetProduct) {
                    return (
                      <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-sky-800 flex items-center m-0">
                            <Lucide.CheckCircle className="w-4 h-4 mr-2" /> Selected Target Product
                          </h4>
                          <AntTag color="blue" className="m-0 border-sky-300">{targetProduct.name}</AntTag>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 bg-white p-3 rounded border border-sky-100 shadow-sm">
                          <div><span className="text-gray-500">Manufacturer:</span> <span className="font-medium text-gray-900">{targetProduct.manufacturer?.name || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Country:</span> <span className="font-medium text-gray-900">{targetProduct.countryOfOrigin?.name || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Brand:</span> <span className="font-medium text-gray-900">{targetProduct.brand?.name || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Seller:</span> <span className="font-medium text-gray-900">{targetProduct.tenantName || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Model:</span> <span className="font-medium text-gray-900">{targetProduct.modelNumber || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Part #:</span> <span className="font-medium text-gray-900">{targetProduct.partNumber || 'N/A'}</span></div>
                          <div><span className="text-gray-500">Dimensions:</span> <span className="font-medium text-gray-900">{targetProduct.height || '?'} x {targetProduct.width || '?'} x {targetProduct.emptyWeight || '?'}</span></div>
                        </div>

                        {targetProduct.globalSpecs && targetProduct.globalSpecs.length > 0 && (
                          <div className="border-t border-sky-100 pt-3 mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Global Specifications</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {targetProduct.globalSpecs.map((spec: any, i: number) => (
                                <div key={i} className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                                  <span className="text-gray-500">{spec.attributeName || spec.name}:</span> <span className="font-medium text-gray-900">{spec.values ? spec.values.map((v:any) => v.label).join(', ') : spec.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {dynamicAttrGroups.length > 0 && (
                          <div className="border-t border-sky-100 pt-3 mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Variant Specific Attributes</h4>
                            <div className="flex flex-col gap-3">
                              {dynamicAttrGroups.map(group => {
                                const hasValues = group.attributes.some((attr: any) => {
                                  const val = targetProduct.dynamicAttributes?.[attr.id];
                                  return val && (!Array.isArray(val) || val.length > 0);
                                });
                                if (!hasValues) return null;
                                return (
                                  <div key={group.groupId} className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                                    <h5 className="font-semibold text-sky-700 mb-2 text-xs uppercase tracking-wider">{group.groupName}</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {group.attributes.map((attr: any) => {
                                const attrData = targetProduct.dynamicAttributes?.find(da => da.attributeId === attr.id);
                                const val = attrData ? attrData.values.map(v => v.label) : null;
                                if (!val || val.length === 0) return null;
                                return (
                                  <div key={attr.id}><span className="text-gray-500">{attr.name}:</span> <span className="font-medium text-gray-900">{val.join(', ')}</span></div>
                                );
                              })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Fallback for Open RFQ (No specific product selected)
                  return (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Lucide.Search className="w-4 h-4 mr-2 text-gray-500" /> Requested Specifications (Open RFQ)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div><span className="text-gray-500">Manufacturer:</span> {item?.manufacturer?.length ? item.manufacturer.join(', ') : 'Any'}</div>
                        <div><span className="text-gray-500">Country:</span> {item?.countryOfOrigin || 'Any'}</div>
                        <div><span className="text-gray-500">Brand:</span> {item?.brand?.length ? item.brand.join(', ') : 'Any'}</div>
                        <div><span className="text-gray-500">Seller:</span> {item?.seller?.length ? item.seller.join(', ') : 'Any'}</div>
                        <div><span className="text-gray-500">Model:</span> {item?.modelNumber || 'Any'}</div>
                        <div><span className="text-gray-500">Part #:</span> {item?.partNumber || 'Any'}</div>
                        <div><span className="text-gray-500">Dimensions:</span> {item?.height || '*'} x {item?.width || '*'} x {item?.weight || '*'}</div>
                      </div>

                      {dynamicAttrGroups.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Requested Dynamic Specs</h4>
                          <div className="flex flex-col gap-3">
                            {dynamicAttrGroups.map(group => {
                              const hasValues = group.attributes.some((attr: any) => {
                                const val = item?.dynamicAttributes?.[attr.id];
                                return val && (!Array.isArray(val) || val.length > 0);
                              });
                              if (!hasValues) return null;
                              return (
                                <div key={group.groupId} className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                                  <h5 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">{group.groupName}</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {group.attributes.map((attr: any) => {
                                      const val = item?.dynamicAttributes?.[attr.id];
                                      if (!val || (Array.isArray(val) && val.length === 0)) return null;
                                      return (
                                        <div key={attr.id}><span className="text-gray-500">{attr.name}:</span> <span className="font-medium text-gray-900">{Array.isArray(val) ? val.join(', ') : val}</span></div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
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
                    if (r.targetTenantId) return <span>Seller: <strong>{r.targetTenantId}</strong> (Platform ID: {r.platformProductId})</span>;
                    if (r.platformProductId) return <span>Platform ID: <strong>{r.platformProductId}</strong></span>;
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
          const currentPlatformProduct = watchItems[index]?.platformProductId;
          const dynamicAttrGroups = currentCategory ? getDynamicAttributeGroups(currentCategory) : [];

          const platformProducts = currentCategory ? PLATFORM_PRODUCTS.filter(p => p.categoryId === currentCategory) : PLATFORM_PRODUCTS;

          // Progressive filtering for matching products
          let matches = allVariants;

          if (currentPlatformProduct) {
            matches = matches.filter(v => v.product.platformProductId === currentPlatformProduct || v.product.id === currentPlatformProduct);
          }
          if (currentCategory) {
            matches = matches.filter(v => {
              const pId = v.product.platformProductId;
              const pp = PLATFORM_PRODUCTS.find(p => p.id === pId);
              return pp?.categoryId === currentCategory || v.product.categoryId === currentCategory;
            });
          }

          // Compute dynamic dropdown options with counts based on current category matches, grouped by availability
          const baseMatches = matches;
          
          const allMfrs = Array.from(new Set(allTenantProducts.map(p => p.manufacturer?.name).filter(Boolean))) as string[];
          const mfrCounts = baseMatches.reduce((acc, v) => {
             const mName = v.product.manufacturer?.name;
             if (mName) acc[mName] = (acc[mName] || 0) + 1;
             return acc;
          }, {} as Record<string, number>);
          
          const dynamicManufacturers = [
            {
              label: 'Available',
              options: Object.entries(mfrCounts).map(([val, count]) => ({ label: `${val} (${count})`, value: val }))
            },
            {
              label: 'Unavailable',
              options: allMfrs.filter(m => !mfrCounts[m]).map(val => ({ label: `${val} (0)`, value: val, disabled: true }))
            }
          ].filter(g => g.options.length > 0);

          const allBrands = Array.from(new Set(allTenantProducts.map(p => p.brand?.name).filter(Boolean))) as string[];
          const brandCounts = baseMatches.reduce((acc, v) => {
             const bName = v.product.brand?.name;
             if (bName) acc[bName] = (acc[bName] || 0) + 1;
             return acc;
          }, {} as Record<string, number>);

          const dynamicBrands = [
            {
              label: 'Available',
              options: Object.entries(brandCounts).map(([val, count]) => ({ label: `${val} (${count})`, value: val }))
            },
            {
              label: 'Unavailable',
              options: allBrands.filter(b => !brandCounts[b]).map(val => ({ label: `${val} (0)`, value: val, disabled: true }))
            }
          ].filter(g => g.options.length > 0);

          const allSellers = Array.from(new Set(allTenantProducts.map(p => p.tenantName).filter(Boolean))) as string[];
          const sellerCounts = baseMatches.reduce((acc, v) => {
             if (v.product.tenantName) acc[v.product.tenantName] = (acc[v.product.tenantName] || 0) + 1;
             return acc;
          }, {} as Record<string, number>);

          const dynamicSellers = [
            {
              label: 'Available',
              options: Object.entries(sellerCounts).map(([val, count]) => ({ label: `${val} (${count})`, value: val }))
            },
            {
              label: 'Unavailable',
              options: allSellers.filter(s => !sellerCounts[s]).map(val => ({ label: `${val} (0)`, value: val, disabled: true }))
            }
          ].filter(g => g.options.length > 0);

          const currentItem = watchItems[index] || ({} as any);
          if (currentItem.brand && currentItem.brand.length > 0) matches = matches.filter(v => {
            return v.product.brand?.name && currentItem.brand?.includes(v.product.brand.name);
          });
          if (currentItem.manufacturer && currentItem.manufacturer.length > 0) matches = matches.filter(v => {
            return v.product.manufacturer?.name && currentItem.manufacturer?.includes(v.product.manufacturer.name);
          });
          if (currentItem.seller && currentItem.seller.length > 0) matches = matches.filter(v => {
            return v.product.tenantName && currentItem.seller?.includes(v.product.tenantName);
          });
          if (currentItem.countryOfOrigin) matches = matches.filter(v => {
            return v.product.countryOfOrigin?.code === currentItem.countryOfOrigin || v.product.countryOfOrigin?.name === currentItem.countryOfOrigin;
          });
          if (currentItem.modelNumber) matches = matches.filter(v => {
            return v.product.modelNumber === currentItem.modelNumber;
          });
          if (currentItem.partNumber) matches = matches.filter(v => {
            return v.product.partNumber === currentItem.partNumber;
          });

          if (currentItem.dynamicAttributes) {
            Object.entries(currentItem.dynamicAttributes).forEach(([key, values]) => {
              if (Array.isArray(values) && values.length > 0) {
                matches = matches.filter(v => {
                  const variantVal = v.variant.values?.find((val: any) => val.attributeId === key)?.label;
                  const productAttr = v.product.dynamicAttributes?.find((da: any) => da.attributeId === key);
                  const val = variantVal ? [variantVal] : (productAttr ? productAttr.values.map(x => x.label || x.id) : null);
                  if (!val) return false;
                  const valArray = val;
                  return valArray.some((x: string) => (values as string[]).includes(x));
                });
              }
            });
          }
          console.log(matches)
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
                            placeholder="Select Product (Optional)"
                            allowClear
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Extended Specifications */}
                  {currentCategory && (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                      <h4 className="text-sm font-semibold text-sky-700 mb-4 border-b border-gray-100 pb-2 flex items-center">
                        <Lucide.FileText size={16} className="mr-2" /> Specifications
                      </h4>
                      <div className="flex flex-col gap-3 text-sm">
                        <FormItem label="Country" className="mb-0"><Controller name={`items.${index}.countryOfOrigin`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} options={[{ label: 'USA', value: 'USA' }, { label: 'Germany', value: 'Germany' }, { label: 'China', value: 'China' }]} placeholder="Country" allowClear />} /></FormItem>
                        <FormItem label="Manufacturer" className="mb-0"><Controller name={`items.${index}.manufacturer`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} mode='multiple' options={dynamicManufacturers} placeholder="Manufacturer" allowClear />} /></FormItem>
                        <FormItem label="Brand" className="mb-0"><Controller name={`items.${index}.brand`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} mode='multiple' options={dynamicBrands} placeholder="Brand" allowClear />} /></FormItem>
                        <FormItem label="Seller" className="mb-0"><Controller name={`items.${index}.seller`} control={control} render={({ field }) => <AntSelect className='w-full' {...field} mode='multiple' options={dynamicSellers} placeholder="Seller" allowClear />} /></FormItem>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <FormItem label="Model" className="mb-0"><Controller name={`items.${index}.modelNumber`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="Model" />} /></FormItem>
                          <FormItem label="Part" className="mb-0"><Controller name={`items.${index}.partNumber`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="Part #" />} /></FormItem>
                        </div>

                        <FormItem label="Dimensions (H x W x Wt)" className="mb-0 mt-2">
                          <div className="flex gap-2">
                            <Controller name={`items.${index}.height`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="H" />} />
                            <Controller name={`items.${index}.width`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="W" />} />
                            <Controller name={`items.${index}.weight`} control={control} render={({ field }) => <AntInput className='w-full' {...field} placeholder="Wt" />} />
                          </div>
                        </FormItem>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Attributes */}
                  {dynamicAttrGroups.length > 0 && (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                      <h4 className="text-sm font-semibold text-sky-700 mb-4 border-b border-gray-100 pb-2 flex items-center">
                        <Lucide.Sliders size={16} className="mr-2" /> Dynamic Attributes
                      </h4>
                      <div className="flex flex-col gap-4 text-sm">
                        {dynamicAttrGroups.map(group => (
                          <div key={group.groupId} className="border border-gray-100 p-3 rounded bg-gray-50/50">
                            <h5 className="font-semibold text-gray-700 mb-2">{group.groupName}</h5>
                            <div className="flex flex-col gap-3">
                              {group.attributes.map((attr: any) => (
                                <FormItem key={attr.id} label={attr.name} className="mb-0">
                                  <Controller
                                    name={`items.${index}.dynamicAttributes.${attr.id}`}
                                    control={control}
                                    render={({ field }) => (
                                      <AntSelect {...field} mode='multiple' options={attr.options.map((o: any) => ({ label: o, value: o }))} className="w-full" placeholder={`Select`} allowClear />
                                    )}
                                  />
                                </FormItem>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        <div className="text-sm text-green-700 mb-6">Platform ID: <span className="font-bold">{watchItems[index].platformProductId}</span></div>
                        <AntButton htmlType="button" danger block onClick={() => {
                          setValue(`items.${index}.targetTenantId`, '');
                          // We intentionally do NOT clear platformProductId here because it serves as the base template for the left side configuration
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
                                  <div className="font-bold text-green-700 text-sm">${v.variant.price?.amount ?? 0}</div>
                                </div>
                                <div className="flex justify-between items-center mt-auto border-t border-gray-50 pt-2">
                                  <div className="text-xs text-gray-500">Seller: {(v.product as any).tenantName}</div>
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
        width={750}
        footer={null}
        zIndex={1050}
      >
        {previewProduct?.product && previewProduct?.variant && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 m-0">{previewProduct.product.name}</h3>
                <div className="text-gray-500 mt-1">Seller: <span className="font-medium text-gray-700">{previewProduct.product.tenantName}</span></div>
              </div>
              <AntTag color="blue" className="text-sm px-3 py-1">{previewProduct.product.categoryName}</AntTag>
            </div>

            {/* Global Product Details */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><Lucide.Layers className="w-4 h-4 mr-2 text-sky-600"/> Global Product Details</h4>
              <AntDescriptions bordered size="small" column={2} className="bg-white shadow-sm">
                <AntDescriptions.Item label="Platform ID"><span className="font-mono text-xs">{previewProduct.product.platformProductId || 'N/A'}</span></AntDescriptions.Item>
                <AntDescriptions.Item label="Part Number">{previewProduct.product.partNumber || 'N/A'}</AntDescriptions.Item>
                <AntDescriptions.Item label="Manufacturer">{previewProduct.product.manufacturer?.name || 'N/A'}</AntDescriptions.Item>
                <AntDescriptions.Item label="Brand">{previewProduct.product.brand?.name || 'N/A'}</AntDescriptions.Item>
                <AntDescriptions.Item label="Model Number">{previewProduct.product.modelNumber || 'N/A'}</AntDescriptions.Item>
                <AntDescriptions.Item label="Country of Origin">{previewProduct.product.countryOfOrigin?.name || 'N/A'}</AntDescriptions.Item>
                <AntDescriptions.Item label="Year">{previewProduct.product.yearOfManufacture || 'N/A'}</AntDescriptions.Item>
                <AntDescriptions.Item label="Status">{previewProduct.product.status}</AntDescriptions.Item>
              </AntDescriptions>
            </div>

            {/* Global Specifications */}
            {previewProduct.product.globalSpecs && previewProduct.product.globalSpecs.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><Lucide.Settings className="w-4 h-4 mr-2 text-sky-600"/> Global Specifications</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {previewProduct.product.globalSpecs.map((spec: any, i: number) => (
                    <div key={i} className="bg-gray-50 p-2.5 rounded border border-gray-200 flex justify-between items-center shadow-sm">
                      <span className="text-gray-600 font-medium">{spec.attributeName || spec.name}</span>
                      <span className="text-gray-900">{spec.values ? spec.values.map((v:any) => v.label).join(', ') : spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Variant Details */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><Lucide.Box className="w-4 h-4 mr-2 text-sky-600"/> Selected Variant</h4>
              <AntDescriptions bordered size="small" column={2} className="bg-white mb-4 shadow-sm">
                <AntDescriptions.Item label="Variant Name" span={2}><span className="font-semibold text-sky-700 text-base">{previewProduct.variant.name}</span></AntDescriptions.Item>
                <AntDescriptions.Item label="SKU"><span className="font-mono text-xs">{previewProduct.variant.sku}</span></AntDescriptions.Item>
                <AntDescriptions.Item label="Price"><span className="font-bold text-green-700">${previewProduct.variant.price?.amount ?? 0}</span></AntDescriptions.Item>
                <AntDescriptions.Item label="Stock">{previewProduct.variant.stock}</AntDescriptions.Item>
                <AntDescriptions.Item label="Min Order">{previewProduct.variant.minOrder || 1}</AntDescriptions.Item>
              </AntDescriptions>
              
              {/* Variant Attributes */}
              {previewProduct.variant.values && previewProduct.variant.values.length > 0 && (
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="text-sm font-semibold text-blue-800 mb-2">Variant Specific Attributes</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {previewProduct.variant.values.map((val: any) => {
                      return (
                        <div key={val.attributeId} className="flex justify-between items-center bg-white p-2 rounded border border-blue-100 shadow-sm">
                          <span className="text-gray-500">{val.attributeName}</span>
                          <span className="font-medium text-gray-900">{val.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
              <AntButton htmlType="button" onClick={() => setPreviewProduct(null)} className="mr-3">Cancel</AntButton>
              <AntButton htmlType="button" type="primary" className="bg-sky-600 hover:bg-sky-700 shadow-md" size="large" onClick={() => {
                const prod = previewProduct.product;
                const variant = previewProduct.variant;
                const idx = previewProduct.itemIndex;
                setValue(`items.${idx}.categoryId`, prod.categoryId);
                setValue(`items.${idx}.targetTenantId`, prod.tenantId);
                setValue(`items.${idx}.platformProductId`, prod.platformProductId || prod.id);
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
