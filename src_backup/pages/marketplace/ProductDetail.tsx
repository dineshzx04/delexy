import React from 'react';
import { Button, Descriptions, Tag, Tabs, InputNumber, Divider } from 'antd';
import { ShoppingCart, Heart, ShieldCheck, Factory, Truck } from 'lucide-react';

const ProductDetail = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex gap-12">
        {/* Product Image Gallery Placeholder */}
        <div className="w-1/2">
          <div className="bg-gray-100 rounded-xl aspect-square flex items-center justify-center mb-4">
            <span className="text-gray-400">Main Product Image</span>
          </div>
          <div className="flex gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg aspect-square w-20 flex items-center justify-center cursor-pointer hover:border-primary-500 border-2 border-transparent">
                 <span className="text-xs text-gray-400">img</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-1/2">
          <div className="flex gap-2 mb-3">
             <Tag color="blue">Pumps & Motors</Tag>
             <Tag color="green">In Stock</Tag>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">High-Pressure Centrifugal Pump Assembly</h1>
          <p className="text-gray-500 mb-6">MPN: HP-CPA-992-SS | Mfr: Acme Industrial</p>
          
          <div className="text-4xl font-bold text-gray-900 mb-6">
            $1,200.00 <span className="text-sm font-normal text-gray-500">/ unit</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-700">
               <ShieldCheck className="text-green-600 w-5 h-5" /> 1-Year Manufacturer Warranty
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
               <Factory className="text-gray-500 w-5 h-5" /> Minimum Order: 1 Unit
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
               <Truck className="text-gray-500 w-5 h-5" /> Estimated Delivery: 3-5 Business Days
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <InputNumber min={1} defaultValue={1} size="large" className="w-24" />
            <Button type="primary" size="large" className="flex-1" icon={<ShoppingCart size={18} />}>
              Add to Cart
            </Button>
            <Button size="large" icon={<Heart size={18} />} />
          </div>

          <Tabs defaultActiveKey="1" items={[
            {
              key: '1', label: 'Specifications', children: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Material">Stainless Steel 316</Descriptions.Item>
                  <Descriptions.Item label="Max Pressure">150 PSI</Descriptions.Item>
                  <Descriptions.Item label="Flow Rate">50 GPM</Descriptions.Item>
                  <Descriptions.Item label="Connection Type">Flanged</Descriptions.Item>
                </Descriptions>
              )
            },
            { key: '2', label: 'Supplier Info', children: <p>Acme Industrial is a verified supplier...</p> }
          ]} />
        </div>
      </div>
    </div>
  );
};
export default ProductDetail;
