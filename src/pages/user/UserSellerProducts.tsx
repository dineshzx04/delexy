import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type SellerProduct } from '../../data/catalog';
import { businessDb, type Party } from '../../data/business';

const UserSellerProducts: React.FC = () => {
  const location = useLocation();
  const { currentUserId, activeWorkspace } = useWorkspace();
  const currentBizId = activeWorkspace?.businessId || (activeWorkspace?.type === 'BUSINESS' ? activeWorkspace.id : undefined);
  
  const isBusinessWorkspace = activeWorkspace?.type === 'BUSINESS' || location.pathname.startsWith('/b');

  const [searchText, setSearchText] = useState('');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedProductRecord, setSelectedProductRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = useMemo(() => {
    if (isBusinessWorkspace) {
      return [
        { title: <Link to="/b/dashboard" className="text-slate-500 hover:text-indigo-600 transition-colors">Workspace</Link>, url: '/b/dashboard' },
        { title: <span className="text-slate-500">Catalog</span> },
        { title: <span className="text-slate-900 font-semibold">Seller Products</span> }
      ];
    }
    return [
      { title: <Link to="/user/dashboard" className="text-slate-500 hover:text-sky-600 transition-colors">Account</Link>, url: '/user/dashboard' },
      { title: <span className="text-slate-500">Trading</span> },
      { title: <span className="text-slate-900 font-semibold">My Seller Products</span> }
    ];
  }, [isBusinessWorkspace]);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie Tables
  const dbSellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray()) || [];
  const dbCategories = useLiveQuery(() => catalogDb.categories.toArray()) || [];
  const dbMasterProducts = useLiveQuery(() => catalogDb.products.toArray()) || [];
  const dbParties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const dbManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const dbBrands = useLiveQuery(() => businessDb.brands.toArray()) || [];

  // Resolve active Party for this context
  const activeParty = useMemo(() => {
    if (isBusinessWorkspace && currentBizId) {
      return dbParties.find((p: Party) => p.owner_type === 'BUSINESS' && p.owner_id === currentBizId);
    } else if (!isBusinessWorkspace && currentUserId) {
      return dbParties.find((p: Party) => p.owner_type === 'USER' && p.owner_id === currentUserId);
    }
    return null;
  }, [dbParties, isBusinessWorkspace, currentBizId, currentUserId]);

  // Enriched & filtered Seller Product records for the active party
  const partyProductsData = useMemo(() => {
    if (!activeParty) return [];

    return dbSellerProducts
      .filter((sp: SellerProduct) => sp.party_id === activeParty.id)
      .map((sp: SellerProduct) => {
        const category = dbCategories.find(c => c.id === sp.category_id);
        const masterProduct = dbMasterProducts.find(mp => mp.id === sp.catalog_product_id);
        const sellerParty = dbParties.find(p => p.id === sp.party_id);
        const manufacturer = dbManufacturers.find(m => m.id === sp.manufacturer_id);
        const brand = dbBrands.find(b => b.id === sp.brand_id);

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
      })
      .filter(sp =>
        sp.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
        sp.id.toLowerCase().includes(searchText.toLowerCase()) ||
        sp.part_number.toLowerCase().includes(searchText.toLowerCase()) ||
        sp.brandName.toLowerCase().includes(searchText.toLowerCase())
      );
  }, [activeParty, dbSellerProducts, dbCategories, dbMasterProducts, dbParties, dbManufacturers, dbBrands, searchText]);

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
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            <Lucide.Package size={18} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              {record.product_name}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
              <span>Part No: {record.part_number}</span>
              {record.model_number && <span>• Model: {record.model_number}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Category & Catalog Item',
      key: 'category_master',
      render: (_: any, record: any) => (
        <div>
          <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
            <Lucide.FolderTree size={14} className="text-indigo-600" />
            {record.categoryName}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span className="text-gray-400">Master:</span>
            <span className="font-medium text-gray-700">{record.masterProductName}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Brand & Manufacturer',
      key: 'brand_mfg',
      render: (_: any, record: any) => (
        <div>
          <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
            <Lucide.Award size={14} className="text-amber-600" />
            {record.brandName}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Lucide.Factory size={13} className="text-slate-400" />
            {record.manufacturerName}
          </div>
        </div>
      )
    },
    {
      title: 'Variants & Stock',
      key: 'variants_stock',
      render: (_: any, record: any) => (
        <div>
          <div className="flex items-center gap-1.5">
            <AntTag color="blue" className="text-xs font-mono font-medium">
              {record.variants ? record.variants.length : 0} Variant(s)
            </AntTag>
            {record.variants && record.variants.some((v: any) => v.is_locked) && (
              <AntTag color="purple" className="text-[10px] font-mono px-1 flex items-center gap-1">
                <Lucide.Lock size={10} /> Locked ID
              </AntTag>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1 font-mono font-medium flex items-center gap-1">
            <Lucide.Boxes size={13} className="text-emerald-600" />
            <span>{record.totalStock} Units Stock</span>
          </div>
        </div>
      )
    },
    {
      title: 'Pricing Range',
      key: 'pricing',
      render: (_: any, record: any) => (
        <div className="font-mono text-xs">
          {record.minPrice === record.maxPrice ? (
            <span className="font-bold text-gray-900">{record.currency} {record.minPrice.toLocaleString()}</span>
          ) : (
            <span className="font-bold text-gray-900">
              {record.currency} {record.minPrice.toLocaleString()} – {record.maxPrice.toLocaleString()}
            </span>
          )}
          <div className="text-[10px] text-gray-400 font-sans mt-0.5">Per unit range</div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <AntTag color={status === 'ACTIVE' ? 'green' : 'gold'} className="text-xs font-medium">
          {status}
        </AntTag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 130,
      render: (_: any, record: any) => (
        <AntButton
          type="text"
          size="small"
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex items-center gap-1 font-medium text-xs"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isBusinessWorkspace ? 'Business Seller Products' : 'My Seller Products'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isBusinessWorkspace 
              ? 'Directory of products and sell listings offered by this corporate business party.' 
              : 'Directory of products and sell listings offered under your personal seller party.'}
            {activeParty && (
              <AntTag color="purple" className="ml-2 font-mono text-xs">
                Party ID: {activeParty.id} ({activeParty.display_name})
              </AntTag>
            )}
          </p>
        </div>
        <AntButton
          type="primary"
          icon={<Lucide.Plus size={16} />}
          className="bg-indigo-600 font-medium cursor-not-allowed opacity-80"
          size="large"
          onClick={(e) => e.preventDefault()}
        >
          Create Seller Product
        </AntButton>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search seller products by title, ID, part number, or brand..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-96"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500 font-medium">
            Total {partyProductsData.length} Party Seller Listings
          </div>
        </div>

        {/* Table */}
        <AntTable
          size="small"
          columns={columns}
          dataSource={partyProductsData}
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
          locale={{ emptyText: 'No seller products listed for this party.' }}
        />
      </div>

      {/* Seller Product Details Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.Package size={20} className="text-indigo-600" />
            Seller Product Details – {selectedProductRecord?.product_name}
          </div>
        }
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        width={720}
        destroyOnClose
      >
        {selectedProductRecord && (
          <div className="space-y-6">
            {/* Top Overview Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Seller Product ID</span>
                  <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-2">
                    {selectedProductRecord.id}
                    <AntTag color={selectedProductRecord.status === 'ACTIVE' ? 'green' : 'gold'}>
                      {selectedProductRecord.status}
                    </AntTag>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Selling Party</span>
                  <div className="font-semibold text-slate-800 text-sm">
                    {selectedProductRecord.sellerPartyName} ({selectedProductRecord.party_id})
                  </div>
                </div>
              </div>
            </div>

            {/* General & Master Product Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lucide.FileText size={14} className="text-slate-500" />
                Product Core Metadata
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs block">Listing Title</span>
                  <span className="font-semibold text-gray-900">{selectedProductRecord.product_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">Master Catalog Product</span>
                  <span className="font-semibold text-indigo-600">{selectedProductRecord.masterProductName} ({selectedProductRecord.catalog_product_id})</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">Part Number</span>
                  <span className="font-mono text-gray-800">{selectedProductRecord.part_number}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">Model Number</span>
                  <span className="font-mono text-gray-800">{selectedProductRecord.model_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">Brand</span>
                  <span className="font-medium text-gray-900">{selectedProductRecord.brandName}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">Manufacturer</span>
                  <span className="font-medium text-gray-900">{selectedProductRecord.manufacturerName}</span>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            {selectedProductRecord.specs && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lucide.Cpu size={14} className="text-indigo-600" />
                  Technical Specifications
                </h4>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(selectedProductRecord.specs).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500 font-mono capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-semibold text-slate-800 font-mono">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sellable Product Variants Matrix with Platform Product IDs */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lucide.Layers size={14} className="text-purple-600" />
                  Sellable Product Variants Matrix
                </h4>
                <span className="text-xs text-gray-500">
                  {selectedProductRecord.variants ? selectedProductRecord.variants.length : 0} Configured Variants
                </span>
              </div>

              <div className="space-y-3">
                {selectedProductRecord.variants && selectedProductRecord.variants.map((v: any, idx: number) => (
                  <div key={v.id || idx} className="border border-purple-100 bg-purple-50/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-900">{v.name}</span>
                        <AntTag color="purple" className="text-[11px] font-mono px-2 py-0.5 flex items-center gap-1 font-bold">
                          <Lucide.Key size={11} /> {v.variant_platform_id || 'GPID-ASSIGNED'}
                        </AntTag>
                        {v.is_locked && (
                          <AntTag color="magenta" className="text-[10px] font-mono px-1 flex items-center gap-1">
                            <Lucide.Lock size={10} /> Immutable Matrix
                          </AntTag>
                        )}
                      </div>
                      <div className="font-mono text-xs font-bold text-emerald-700">
                        {v.currency} {v.price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 font-mono bg-white p-2 rounded border border-purple-100">
                      <div>SKU: {v.sku || 'N/A'}</div>
                      <div>Stock: <span className="font-bold text-slate-900">{v.stock} Units</span></div>
                      <div>Min Order: {v.min_order_qty || 1} Units</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AntDrawer>
    </div>
  );
};

export default UserSellerProducts;
