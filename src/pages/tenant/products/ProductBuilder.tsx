import React, { useState, useMemo } from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton, Select as AntSelect, Card as AntCard, Divider as AntDivider, Table as AntTable, notification, Tooltip } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
 
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
  const [form] = AntForm.useForm();
  const navigate = useNavigate();
  
  // State
  const [selectedPlatformProduct, setSelectedPlatformProduct] = useState<any>(null);
  
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

  const handlePlatformProductSelect = (value: string) => {
    const pp = PLATFORM_PRODUCTS.find(p => p.id === value);
    setSelectedPlatformProduct(pp);
    
    // Auto-fill some base info if desired
    if (pp) {
      form.setFieldsValue({
        name: pp.name,
      });
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

  const handleSave = (status: 'Draft' | 'Pending Review') => {
    form.validateFields().then(values => {
      console.log('Product Data:', { ...values, variants, status });
      notification.success({ 
        message: status === 'Draft' ? 'Saved as Self Revision' : 'Submitted for Approval',
        description: 'Product has been successfully processed.'
      });
      navigate('/products');
    }).catch(err => {
      notification.error({ message: 'Please complete all required fields.' });
    });
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
        <p className="text-gray-500">Create a new product by inheriting from a platform master template.</p>
      </div>

      <AntForm form={form} layout="vertical">
        
        {/* STEP 1: PLATFORM PRODUCT SELECTION */}
        <AntCard className="mb-6 shadow-sm border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-sky-600">
            <Lucide.Link size={20} />
            <h2 className="text-lg font-semibold m-0">1. Select Platform Master</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            You must map your product to an existing platform master product. This automatically locks the category and required attributes.
          </p>
          
          <AntForm.Item name="platformProductId" rules={[{ required: true, message: 'Please select a platform product' }]}>
            <AntSelect 
              size="large" 
              placeholder="Search platform products..." 
              onChange={handlePlatformProductSelect}
              options={PLATFORM_PRODUCTS.map(p => ({ label: p.name, value: p.id }))}
              showSearch
            />
          </AntForm.Item>

          {selectedPlatformProduct && (
            <div className="bg-sky-50 p-3 rounded-md border border-sky-100 flex items-center gap-2 text-sm text-sky-800">
              <Lucide.FolderTree size={16} />
              <span>Category locked to: <strong>{selectedPlatformProduct.categoryName}</strong></span>
            </div>
          )}
        </AntCard>

        {/* STEP 2: BASIC INFO */}
        <div className={selectedPlatformProduct ? "opacity-100 transition-opacity" : "opacity-50 pointer-events-none transition-opacity"}>
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Lucide.FileText size={20} />
              <h2 className="text-lg font-semibold m-0">2. Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <AntForm.Item name="name" label="Product Name" rules={[{ required: true }]}>
                <AntInput size="large" />
              </AntForm.Item>
              <AntForm.Item name="brand" label="Brand">
                <AntInput size="large" />
              </AntForm.Item>
              <AntForm.Item name="partNumber" label="Part Number (PN)" rules={[{ required: true }]}>
                <AntInput size="large" />
              </AntForm.Item>
              <AntForm.Item name="modelNumber" label="Model Number">
                <AntInput size="large" />
              </AntForm.Item>
              <AntForm.Item name="manufacturer" label="Manufacturer">
                <AntInput size="large" />
              </AntForm.Item>
            </div>
            
            <AntForm.Item name="description" label="Detailed Description" rules={[{ required: true }]}>
              <AntInput.TextArea rows={4} />
            </AntForm.Item>
          </AntCard>

          {/* STEP 3: DYNAMIC ATTRIBUTES */}
          {dynamicAttributes.length > 0 && (
            <AntCard className="mb-6 shadow-sm border-gray-200">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <Lucide.Settings2 size={20} />
                <h2 className="text-lg font-semibold m-0">3. Engineering Specifications</h2>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                These fields are dynamically required because this product belongs to the <strong>{selectedPlatformProduct.categoryName}</strong> category.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {dynamicAttributes.map(attr => (
                  <AntForm.Item 
                    key={attr.id} 
                    name={['attributes', attr.id]} 
                    label={attr.name} 
                    rules={[{ required: attr.required, message: `Please provide ${attr.name}` }]}
                  >
                    {attr.type === 'select' ? (
                      <AntSelect size="large" options={(attr as any).options.map((o: string) => ({ label: o, value: o }))} />
                    ) : (
                      <AntInput size="large" />
                    )}
                  </AntForm.Item>
                ))}
              </div>
            </AntCard>
          )}

          {/* STEP 4: VARIANTS GENERATOR */}
          <AntCard className="mb-6 shadow-sm border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800">
                <Lucide.Copy size={20} />
                <h2 className="text-lg font-semibold m-0">4. Inventory & Variants</h2>
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
                    onChange={e => setVariantInputs({...variantInputs, color: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sizes / Specs (comma separated)</label>
                  <AntInput 
                    placeholder="e.g. 64GB, 128GB" 
                    value={variantInputs.size}
                    onChange={e => setVariantInputs({...variantInputs, size: e.target.value})}
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
      </AntForm>

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
              Save Self Revision (Draft)
            </AntButton>
          </Tooltip>
          <AntButton 
            type="primary" 
            size="large" 
            className="bg-sky-600"
            onClick={() => handleSave('Pending Review')}
            disabled={!selectedPlatformProduct}
          >
            Submit for Approval
          </AntButton>
        </div>
      </div>
    </div>
  );
};

export default ProductBuilder;
