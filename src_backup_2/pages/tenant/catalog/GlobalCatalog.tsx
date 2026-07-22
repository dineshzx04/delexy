import React, { useState, useMemo } from 'react';
import { Input, Button, Card, Tag, Drawer, Divider, Select, Tooltip } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

// Mock live products (marketplace view)
const LIVE_PRODUCTS = [
  {
    id: 'pub-1',
    name: 'Ultra Widget 5000',
    seller: 'Acme Corp',
    brand: 'Acme',
    category: 'Industrial Sensors',
    priceRange: '$100.00 - $200.00',
    minOrder: 5,
    imageUrl: 'https://images.unsplash.com/photo-1580983546522-836798c0dcc9?auto=format&fit=crop&q=80&w=300&h=200',
    attributes: [{ name: 'Voltage', value: '24V' }, { name: 'Material', value: 'Steel' }],
    variants: [{ name: 'Standard', price: 100, minOrder: 10 }, { name: 'Pro', price: 200, minOrder: 5 }],
    description: 'A heavy duty industrial sensor for extreme environments. Precision engineered by Acme Corp.'
  },
  {
    id: 'pub-2',
    name: 'Micro Controller Pro',
    seller: 'TechFlow Ltd',
    brand: 'TechFlow',
    category: 'Logic Boards',
    priceRange: '$50.00',
    minOrder: 100,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300&h=200',
    attributes: [{ name: 'Clock Speed', value: '4 GHz' }, { name: 'RAM', value: '16GB' }],
    variants: [{ name: '16GB Model', price: 50, minOrder: 100 }],
    description: 'High performance logic board for advanced computing needs.'
  },
  {
    id: 'pub-3',
    name: 'Standard AC Motor',
    seller: 'Motors Inc',
    brand: 'Motronic',
    category: 'Motors',
    priceRange: '$350.00',
    minOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=300&h=200',
    attributes: [{ name: 'Power', value: '10 HP' }, { name: 'Phase', value: '3-Phase' }],
    variants: [{ name: '10HP / 3-Phase', price: 350, minOrder: 1 }],
    description: 'Reliable alternating current motor for continuous industrial operations.'
  },
  {
    id: 'pub-4',
    name: 'Lithium Ion Battery Pack',
    seller: 'Energy Co',
    brand: 'Energi',
    category: 'Power Systems',
    priceRange: '$1,200.00',
    minOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=300&h=200',
    attributes: [{ name: 'Capacity', value: '100Ah' }, { name: 'Voltage', value: '48V' }],
    variants: [{ name: '100Ah / 48V', price: 1200, minOrder: 2 }],
    description: 'Deep cycle lithium ion battery pack for energy storage systems.'
  },
];

const GlobalCatalog: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <span className="text-gray-900 font-semibold">Global Catalog</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredProducts = useMemo(() => {
    return LIVE_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.category.toLowerCase().includes(searchText.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Global Marketplace</h1>
        <p className="text-gray-500 text-lg">Browse, discover, and source published products from verified suppliers and users.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4">
        <Input
          size="large"
          placeholder="Search by product name, brand, or category..."
          prefix={<Lucide.Search size={18} className="text-gray-400" />}
          className="flex-1"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select size="large" className="w-full md:w-48" placeholder="Filter by Category" allowClear>
          <Select.Option value="Industrial Sensors">Industrial Sensors</Select.Option>
          <Select.Option value="Logic Boards">Logic Boards</Select.Option>
          <Select.Option value="Motors">Motors</Select.Option>
          <Select.Option value="Power Systems">Power Systems</Select.Option>
        </Select>
        <Button size="large" type="primary" className="bg-sky-600 px-8 flex items-center gap-2">
          <Lucide.Filter size={16} /> Filters
        </Button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <Card
            key={product.id}
            hoverable
            className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
            cover={
              <div className="h-48 overflow-hidden bg-gray-100 relative group">
                <img alt={product.name} src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-2 left-2">
                  <Tag color="blue" className="border-0 shadow-sm backdrop-blur-md bg-white/90 font-semibold">{product.category}</Tag>
                </div>
              </div>
            }
            bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}
            onClick={() => setSelectedProduct(product)}
          >
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{product.brand}</div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>
            <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
              <Lucide.Store size={14} /> {product.seller}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Starting from</div>
                <div className="text-xl font-bold text-sky-700">{product.priceRange}</div>
              </div>
              <div className="text-xs text-gray-400">
                Min Qty: {product.minOrder}
              </div>
            </div>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Lucide.SearchX size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Product Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Lucide.Box size={20} className="text-sky-600" />
            <span className="font-bold text-lg text-gray-800">Product Details</span>
          </div>
        }
        placement="right"
        width={600}
        onClose={() => setSelectedProduct(null)}
        open={!!selectedProduct}
        footer={
          <div className="flex justify-between items-center w-full px-2 py-1">
            <div className="text-gray-500 text-sm">Sold by <strong className="text-gray-900">{selectedProduct?.seller}</strong></div>
            <div className="flex gap-3">
              <Button size="large" icon={<Lucide.MessageSquare size={16} />}>Contact Supplier</Button>
              <Button size="large" type="primary" className="bg-sky-600 flex items-center gap-2">
                <Lucide.FileSpreadsheet size={16} /> Request RFQ
              </Button>
            </div>
          </div>
        }
      >
        {selectedProduct && (
          <div className="flex flex-col h-full">
            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-64 object-cover rounded-lg shadow-sm mb-6" />

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag color="blue">{selectedProduct.category}</Tag>
                <Tag color="default">{selectedProduct.brand}</Tag>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
              <p className="text-gray-600 text-base leading-relaxed">{selectedProduct.description}</p>
            </div>

            <Divider orientation="horizontal" plain>Engineering Specifications</Divider>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {selectedProduct.attributes.map((attr: any) => (
                <div key={attr.name} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{attr.name}</div>
                  <div className="text-gray-900 font-medium">{attr.value}</div>
                </div>
              ))}
            </div>

            <Divider orientation="horizontal" plain>Available Variants</Divider>
            <div className="space-y-3 mb-6">
              {selectedProduct.variants.map((v: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:border-sky-300 transition-colors cursor-pointer group">
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-sky-700 transition-colors">{v.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Min Order: {v.minOrder} units</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">${v.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">per unit</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
};

export default GlobalCatalog;
