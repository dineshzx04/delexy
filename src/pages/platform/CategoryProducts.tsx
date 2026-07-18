import React, { useState, useMemo } from 'react';
import { Table as AntTable, Input as AntInput, Form as AntForm, Button as AntButton, Switch as AntSwitch, notification, Modal as AntModal, Tag as AntTag, Tooltip as AntTooltip } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import CategoryPicker from '../../components/common/CategoryPicker';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PlatformProduct } from '../../data/db';

const CategoryProducts: React.FC = () => {

  const products = useLiveQuery(() => db.platformProducts.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());

  const getCategoryPathNames = (id: string): string[] => {
    const pathNames: string[] = [];
    if (!categories) return pathNames;
    let curr = categories.find(c => c.id === id);
    while (curr) {
      pathNames.unshift(curr.name);
      curr = categories.find(c => c.id === curr!.parentId);
    }
    return pathNames;
  };

  const [searchText, setSearchText] = useState('');

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PlatformProduct | null>(null);
  const [form] = AntForm.useForm();

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-900 font-semibold">Products</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [products, searchText]);

  const handleCreateNew = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (product: PlatformProduct) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    if (!values.categoryId) {
      notification.error({ message: 'Category is required.' });
      return;
    }

    if (editingProduct) {
      await db.platformProducts.update(editingProduct.id, values);
      notification.success({ message: 'Product Updated' });
    } else {
      const newProduct: PlatformProduct = {
        ...values,
        id: `new-prod-${Date.now()}`,
        globalSpecs: {}
      };
      await db.platformProducts.add(newProduct);
      notification.success({ message: 'Product Created' });
    }
    setIsModalVisible(false);
  };

  const handleDelete = async (id: string) => {
    await db.platformProducts.delete(id);
    notification.success({ message: 'Product Deleted' });
  };

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold text-gray-900">{text}</span>
    },
    {
      title: 'Mapped Category',
      key: 'category',
      render: (_: any, record: PlatformProduct) => {
        const pathNames = getCategoryPathNames(record.categoryId);
        let displayPaths: { name: string; isEllipsis: boolean; originalIndex?: number }[] = pathNames.map((n, i) => ({ name: n, isEllipsis: false, originalIndex: i }));

        if (pathNames.length > 3) {
          displayPaths = [
            { name: pathNames[0], isEllipsis: false, originalIndex: 0 },
            { name: '...', isEllipsis: true },
            { name: pathNames[pathNames.length - 2], isEllipsis: false, originalIndex: pathNames.length - 2 },
            { name: pathNames[pathNames.length - 1], isEllipsis: false, originalIndex: pathNames.length - 1 }
          ];
        }

        return (
          <div className="flex items-center gap-1.5 text-gray-600 text-sm">
            <Lucide.FolderTree size={14} className="text-gray-400 shrink-0" />
            {displayPaths.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <Lucide.ChevronRight size={12} className="text-gray-400 shrink-0" />}
                {item.isEllipsis ? (
                  <AntTooltip title={pathNames.join(' > ')}>
                    <span className="text-gray-400 font-bold px-1 tracking-widest cursor-help">...</span>
                  </AntTooltip>
                ) : (
                  <span className={idx === displayPaths.length - 1 ? "font-medium text-gray-800" : "truncate max-w-[150px]"}>
                    {item.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <AntTag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Draft'}</AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 150,
      render: (_: any, record: PlatformProduct) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => handleEdit(record)}>
            Edit
          </AntButton>
          <AntButton type="text" danger size="small" onClick={() => handleDelete(record.id)}>
            Delete
          </AntButton>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Products</h1>
          <p className="text-gray-500">Master templates that map to categories. Business users will clone these to create variants.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={handleCreateNew}>
          <Lucide.Plus size={16} /> Create Product
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search products..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      <AntModal
        title={editingProduct ? "Edit Product" : "Create Product"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        width={600}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <AntForm.Item name="id" hidden><AntInput /></AntForm.Item>
          <AntForm.Item name="categoryId" hidden><AntInput /></AntForm.Item>
          <AntForm.Item name="categoryName" hidden><AntInput /></AntForm.Item>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">Status</div>
            <AntForm.Item name="isActive" valuePropName="checked" className="mb-0">
              <AntSwitch checkedChildren="Active" unCheckedChildren="Draft" />
            </AntForm.Item>
          </div>

          <AntForm.Item name="name" label="Product Name (Master Template)" rules={[{ required: true }]}>
            <AntInput size="large" placeholder="e.g. Apple iPhone 14 Pro" />
          </AntForm.Item>

          <AntForm.Item
            label="Assigned Category"
            required
            tooltip="Select the deepest node in the category tree that this product belongs to."
          >
            {/* We use a custom form control here so we can update multiple form fields (Id and Name) when CategoryPicker fires onChange */}
            <AntForm.Item noStyle shouldUpdate={(prev, curr) => prev.categoryId !== curr.categoryId}>
              {({ getFieldValue }) => (
                <CategoryPicker
                  value={getFieldValue('categoryId')}
                  onChange={(id, name) => {
                    form.setFieldsValue({ categoryId: id, categoryName: name });
                  }}
                />
              )}
            </AntForm.Item>
          </AntForm.Item>

          <AntForm.Item name="description" label="Global Description">
            <AntInput.TextArea rows={4} placeholder="Base description for this product..." />
          </AntForm.Item>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default CategoryProducts;
