import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type SellerProduct } from '../../data/catalog';
import { businessDb } from '../../data/business';

const PlatformSellerProducts: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedProductRecord, setSelectedProductRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Catalog</span> },
    { title: <span className="text-gray-900 font-semibold">Seller Products</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const dbSellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray()) || [];
  const dbCategories = useLiveQuery(() => catalogDb.categories.toArray()) || [];
  const dbMasterProducts = useLiveQuery(() => catalogDb.products.toArray()) || [];
  const dbParties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const dbManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const dbBrands = useLiveQuery(() => businessDb.brands.toArray()) || [];

  // Enriched Seller Product records
  const sellerProductsData = useMemo(() => {
    return dbSellerProducts.map((sp: SellerProduct) => {
      const category = dbCategories.find(c => c.id === sp.category_id);
      const masterProduct = dbMasterProducts.find(mp => mp.id === sp.catalog_product_id);
      const sellerParty = dbParties.find(p => p.id === sp.party_id);
      const manufacturer = dbManufacturers.find(m => m.id === sp.manufacturer_id);
      const brand = dbBrands.find(b => b.id === sp.brand_id);

      // Total stock and starting price across variants
      const totalStock = sp.variants ? sp.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;
      const minPrice = sp.variants && sp.variants.length > 0 ? Math.min(...sp.variants.map(v => v.price)) : 0;
      const maxPrice = sp.variants && sp.variants.length > 0 ? Math.max(...sp.variants.map(v => v.price)) : 0;
      const currency = sp.variants && sp.variants.length > 0 ? sp.variants[0].currency : 'USD';

      return {
        ...sp,
        categoryName: category?.name || sp.category_id,
        masterProductName: masterProduct?.name || sp.catalog_product_id,
        sellerPartyName: sellerParty?.display_name || sp.party_id,
        sellerOwnerType: sellerParty?.owner_type || 'BUSINESS',
        manufacturerName: manufacturer?.company_name || sp.manufacturer_id,
        brandName: brand?.name || sp.brand_id,
        totalStock,
        minPrice,
        maxPrice,
        currency
      };
    }).filter(sp =>
      sp.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
      sp.id.toLowerCase().includes(searchText.toLowerCase()) ||
      sp.brandName?.toLowerCase().includes(searchText.toLowerCase()) ||
      sp.sellerPartyName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [dbSellerProducts, dbCategories, dbMasterProducts, dbParties, dbManufacturers, dbBrands, searchText]);

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-gray-500 font-medium">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      )
    },
    {
      title: 'Seller Product Listing',
      key: 'product_identity',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            <Lucide.Package size={18} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              {record.product_name}
              {/* <AntTag color="emerald" className="text-[10px] font-mono px-1.5 py-0">
                {record.id}
              </AntTag> */}
            </div>
            {/* <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
              <span>Part No: {record.part_number}</span>
              {record.model_number && <span>• Model: {record.model_number}</span>}
            </div> */}
          </div>
        </div>
      )
    },
    {
      title: 'Seller Party',
      key: 'seller_party',
      render: (_: any, record: any) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
            <Lucide.UserCheck size={14} className="text-sky-600" />
            {record.sellerPartyName}
          </div>
          <AntTag color={record.sellerOwnerType === 'BUSINESS' ? 'blue' : 'gold'} className="text-[10px] font-mono">
            {record.sellerOwnerType} SELLER
          </AntTag>
        </div>
      )
    },
    {
      title: 'Brand',
      key: 'brand',
      render: (_: any, record: any) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <AntTag color="purple" className="text-xs font-semibold">{record.brandName}</AntTag>
          </div>
          {/* <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
            Mfg: {record.manufacturerName}
          </div> */}
        </div>
      )
    },
    {
      title: 'Price Range & Stock',
      key: 'price_stock',
      render: (_: any, record: any) => (
        <div>
          <div className="font-bold text-xs text-gray-900">
            {record.minPrice === record.maxPrice
              ? `$${record.minPrice.toFixed(2)} ${record.currency}`
              : `$${record.minPrice.toFixed(2)} - $${record.maxPrice.toFixed(2)} ${record.currency}`}
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <Lucide.Boxes size={12} className="text-emerald-600" />
            <span>{record.totalStock} Available Stock ({record.variants?.length || 0} Variants)</span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <AntTag color={status === 'ACTIVE' ? 'success' : 'error'} className="text-xs">
          {status}
        </AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <AntButton
          type="text"
          size="small"
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 font-medium text-xs"
          onClick={() => {
            setSelectedProductRecord(record);
            setIsDetailsDrawerOpen(true);
          }}
        >
          <Lucide.Eye size={14} /> View Details
        </AntButton>
      ),
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Seller Products</h1>
          <p className="text-gray-500 text-sm">
            Platform directory of active seller product listings, technical specifications, variants matrix, inventory, and entity assignments.
          </p>
        </div> 
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search seller products by title, product ID, part number, brand, or seller..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-96"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500">
            Total {sellerProductsData.length} Active Seller Listings
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={sellerProductsData}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true
          }}
        />
      </div>

      {/* Seller Product Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Lucide.Package size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">
                {selectedProductRecord?.product_name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Seller Product ID: {selectedProductRecord?.id}
              </div>
            </div>
          </div>
        }
        width={680}
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        destroyOnClose
      >
        {selectedProductRecord && (
          <div className="space-y-6">
            {/* 1. Overview Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  Seller Listing Overview
                  {selectedProductRecord.is_locked && (
                    <AntTag color="gold" className="font-semibold text-[10px] flex items-center gap-1 px-1.5 py-0">
                      <Lucide.Lock size={11} /> SPECS LOCKED & PLATFORM INDEXED
                    </AntTag>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <AntTag color="purple">{selectedProductRecord.brandName}</AntTag>
                  <AntTag color={selectedProductRecord.status === 'ACTIVE' ? 'success' : 'error'}>
                    {selectedProductRecord.status}
                  </AntTag>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Product Name</span>
                  <span className="font-semibold text-gray-800">{selectedProductRecord.product_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Category</span>
                  <span className="font-semibold text-gray-800">{selectedProductRecord.categoryName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block">Master Template</span>
                  <span className="font-mono text-gray-800">{selectedProductRecord.masterProductName} ({selectedProductRecord.catalog_product_id})</span>
                </div>
              </div>
            </div>

            {/* 2. Entity Ownership Card */}
            <div className="border border-sky-200 bg-sky-50/40 p-4 rounded-lg space-y-2">
              <span className="font-bold text-sm text-sky-900 flex items-center gap-2">
                <Lucide.Building2 size={16} className="text-sky-600" />
                Entity & Ownership Relations
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded border border-sky-100">
                <div>
                  <span className="text-gray-400 block">Seller Party</span>
                  <span className="font-semibold text-sky-900">{selectedProductRecord.sellerPartyName}</span>
                  <div className="text-[10px] text-gray-400 font-mono">({selectedProductRecord.party_id})</div>
                </div>
                <div>
                  <span className="text-gray-400 block">Manufacturer</span>
                  <span className="font-semibold text-sky-900">{selectedProductRecord.manufacturerName}</span>
                  <div className="text-[10px] text-gray-400 font-mono">({selectedProductRecord.manufacturer_id})</div>
                </div>
                <div>
                  <span className="text-gray-400 block">Brand</span>
                  <span className="font-semibold text-sky-900">{selectedProductRecord.brandName}</span>
                  <div className="text-[10px] text-gray-400 font-mono">({selectedProductRecord.brand_id})</div>
                </div>
              </div>
            </div>

            {/* 2. Global Specifications (Grouped) */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Lucide.Settings2 size={16} className="text-purple-600" />
                Global Specifications ({selectedProductRecord.specifications?.length || 0})
              </span>
              {(!selectedProductRecord.specifications || selectedProductRecord.specifications.length === 0) ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded text-center border border-dashed border-gray-200">
                  No global non-variant specifications configured.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProductRecord.specifications.map((spec: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-mono block">{spec.group_name || spec.group_id}</span>
                        <span className="font-semibold text-gray-800">{spec.attribute_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {spec.values.map((v: any) => (
                          <AntTag key={v.id} color="blue" className="text-xs">{v.label}</AntTag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Sellable Product Variants Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Lucide.Boxes size={16} className="text-emerald-600" />
                  Sellable Product Variants Matrix ({selectedProductRecord.variants?.length || 0})
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Total Stock: {selectedProductRecord.totalStock}
                </span>
              </div>
              <AntTable
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={selectedProductRecord.variants || []}
                columns={[
                  {
                    title: 'Platform Product ID',
                    key: 'variant_platform_id',
                    width: 140,
                    render: (_: any, v: any) => (
                      <AntTag color="purple" className="font-mono text-xs flex items-center gap-1 w-fit">
                        <Lucide.KeyRound size={12} />
                        {v.variant_platform_id || 'gpid-pending'}
                      </AntTag>
                    )
                  },
                  {
                    title: 'Variant SKU & ID',
                    key: 'sku',
                    render: (_: any, v: any) => (
                      <div>
                        <div className="font-mono text-xs font-bold text-gray-900">{v.sku}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{v.id}</div>
                      </div>
                    )
                  },
                  {
                    title: 'Combinations',
                    key: 'combinations',
                    render: (_: any, v: any) => (
                      <div className="flex items-center gap-1 flex-wrap">
                        {v.combination_values.map((cv: any, cIdx: number) => (
                          <AntTag key={cIdx} color="cyan" className="text-[11px]">
                            {cv.attribute_name}: <strong>{cv.label}</strong>
                          </AntTag>
                        ))}
                      </div>
                    )
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (p: number, v: any) => <span className="font-bold text-xs text-gray-900">${p.toFixed(2)} {v.currency}</span>
                  },
                  {
                    title: 'Stock',
                    dataIndex: 'stock',
                    key: 'stock',
                    render: (s: number) => <AntTag color="green" className="text-xs">{s} units</AntTag>
                  },
                  {
                    title: 'Min Order',
                    dataIndex: 'min_order_quantity',
                    key: 'min_order',
                    render: (m: number) => <span className="text-xs text-gray-600">{m}</span>
                  }
                ]}
              />
            </div>
          </div>
        )}
      </AntDrawer>
    </div>
  );
};

export default PlatformSellerProducts;
