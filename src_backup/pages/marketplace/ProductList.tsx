import React from 'react';
import { Card, Select, Checkbox, Slider, Button, Pagination } from 'antd';
import { Filter, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const { Option } = Select;

const ProductList = () => {
  const products = [
    { id: '1', name: 'High-Pressure Centrifugal Pump Assembly', category: 'Pumps', price: 1200, supplier: 'Acme Corp', rating: 4.8 },
    { id: '2', name: 'Industrial Butterfly Valve (Stainless Steel)', category: 'Valves', price: 450, supplier: 'Pioneer Valves', rating: 4.9 },
    { id: '3', name: 'Heavy Duty Flange 4" Class 150', category: 'Fittings', price: 85, supplier: 'Global Tech', rating: 4.5 },
    { id: '4', name: 'Hydraulic Motor 250cc', category: 'Motors', price: 850, supplier: 'Acme Corp', rating: 4.7 },
  ];

  return (
    <div className="flex gap-8">
      {/* Sidebar Filters */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Filter size={18} className="text-gray-500" />
            <h3 className="font-bold text-gray-900 m-0">Filters</h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Categories</h4>
              <div className="space-y-2 flex flex-col">
                <Checkbox>Pumps & Motors</Checkbox>
                <Checkbox>Valves & Actuators</Checkbox>
                <Checkbox>Pipe Fittings</Checkbox>
                <Checkbox>Electrical Components</Checkbox>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h4>
              <Slider range defaultValue={[100, 1500]} max={5000} />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>$100</span>
                <span>$5,000+</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Supplier Rating</h4>
              <div className="space-y-2 flex flex-col">
                <Checkbox>4 Stars & Up</Checkbox>
                <Checkbox>3 Stars & Up</Checkbox>
                <Checkbox>Verified Suppliers Only</Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Engineering Components</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Select defaultValue="relevance" style={{ width: 150 }}>
              <Option value="relevance">Relevance</Option>
              <Option value="priceAsc">Price: Low to High</Option>
              <Option value="priceDesc">Price: High to Low</Option>
              <Option value="rating">Top Rated</Option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <Card 
              key={product.id}
              hoverable
              className="overflow-hidden border-gray-100 rounded-xl"
              bodyStyle={{ padding: '16px' }}
              cover={
                <div className="h-48 bg-gray-100 flex items-center justify-center relative group">
                   <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link to={`/product/${product.id}`}>
                        <Button type="primary" shape="round">View Details</Button>
                      </Link>
                   </div>
                  <span className="text-gray-400">Image Placeholder</span>
                </div>
              }
            >
              <div className="text-xs text-primary-600 font-semibold mb-1">{product.category}</div>
              <h3 className="font-semibold text-gray-800 h-10 line-clamp-2 mb-2 leading-tight">
                {product.name}
              </h3>
              <div className="text-xs text-gray-500 mb-3">By {product.supplier}</div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                <span className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</span>
                <Button type="text" shape="circle" icon={<ShoppingCart size={18} />} className="hover:bg-primary-50 text-gray-400 hover:text-primary-600" />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Pagination defaultCurrent={1} total={50} />
        </div>
      </div>
    </div>
  );
};
export default ProductList;
