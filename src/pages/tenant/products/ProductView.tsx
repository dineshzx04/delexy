import React, { useMemo } from 'react';
import { Table as AntTable, Tag as AntTag, Descriptions as AntDescriptions, Card as AntCard, Button as AntButton } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../data/db';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Try to find the product in either table
  const publishedProduct = useLiveQuery(() => id ? db.userProducts.get(id) : undefined, [id]);
  const reviewProduct = useLiveQuery(() => id ? db.userProductReviews.get(id) : undefined, [id]);
  
  const product = publishedProduct || reviewProduct;

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to="/products" className="text-gray-500 hover:text-sky-600 transition-colors">Products</Link>, url: '/products' },
    { title: <span className="text-gray-900 font-semibold">{product?.name || 'Product Details'}</span> }
  ], [product]);

  useBreadcrumb(breadcrumbs);

  if (!product) {
    return (
      <div className="w-full max-w-7xl pb-12 flex flex-col items-center justify-center pt-20">
        <Lucide.Package size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <p className="text-gray-500 mt-2">The product you are trying to view does not exist or was deleted.</p>
        <AntButton type="primary" className="mt-6" onClick={() => navigate('/products')}>Back to Products</AntButton>
      </div>
    );
  }

  const variantColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (val: any) => `$${(val?.amount || 0).toFixed(2)}` },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    { title: 'Min Order', dataIndex: 'minOrderQuantity', key: 'minOrderQuantity' },
    {
      title: 'Dynamic Attributes',
      key: 'values',
      render: (_: any, record: any) => (
        <div className="flex flex-wrap gap-1">
          {(record.values || []).map((val: any) => (
            <AntTag key={val.attributeId} className="text-xs">{val.label}</AntTag>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
          <p className="text-gray-500">View detailed information about this product.</p>
        </div>
        <div className="flex items-center gap-3">
          <AntTag color={product.status === 'Published' ? 'success' : 'processing'} className="text-sm px-3 py-1">
            {product.status}
          </AntTag>
          {['Draft', 'Changes Requested'].includes(product.status) && (
             <AntButton onClick={() => navigate(`/products/${product.id}/edit`)}>Edit</AntButton>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <AntCard title="General Information" bordered={false} className="shadow-sm">
          <AntDescriptions column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }} bordered size="small">
            <AntDescriptions.Item label="Part Number">{product.partNumber || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Category">{product.categoryName || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Model Number">{product.modelNumber || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Brand">{product.brand?.name || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Manufacturer">{product.manufacturer?.name || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Seller">{product.seller?.name || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Country of Origin">{product.countryOfOrigin?.name || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Year of Manufacture">{product.yearOfManufacture || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Height">{product.height || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Width">{product.width || '-'}</AntDescriptions.Item>
            <AntDescriptions.Item label="Empty Weight">{product.emptyWeight || '-'}</AntDescriptions.Item>
          </AntDescriptions>
        </AntCard>

        {product.globalSpecs && product.globalSpecs.length > 0 && (
          <AntCard title="Global Specifications" bordered={false} className="shadow-sm">
            <AntDescriptions column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }} bordered size="small">
              {product.globalSpecs.map((spec: any, idx: number) => (
                <AntDescriptions.Item key={idx} label={spec.attributeName || spec.name}>
                  {spec.values ? spec.values.map((v: any) => v.label).join(', ') : spec.value}
                </AntDescriptions.Item>
              ))}
            </AntDescriptions>
          </AntCard>
        )}

        <AntCard title="Variants" bordered={false} className="shadow-sm">
          <AntTable
            dataSource={product.variants || []}
            columns={variantColumns}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
          />
        </AntCard>
      </div>
    </div>
  );
};

export default ProductView;
