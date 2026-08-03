import React, { useState, useMemo, useEffect } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, InputNumber as AntInputNumber, Drawer as AntDrawer, Tabs as AntTabs, Card as AntCard, Space as AntSpace, Modal as AntModal, Timeline as AntTimeline, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type SellerProduct, type SellerProductSubmission } from '../../data/catalog';
import { businessDb, type Party } from '../../data/business';

const UserSellerProducts: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentUserId, activeWorkspace } = useWorkspace();
  const currentBizId = activeWorkspace?.businessId || (activeWorkspace?.type === 'BUSINESS' ? activeWorkspace.id : undefined);
  
  const isBusinessWorkspace = activeWorkspace?.type === 'BUSINESS' || location.pathname.startsWith('/b');

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedProductRecord, setSelectedProductRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Per-Variant Edit & Audit Log Modal State
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editMOQ, setEditMOQ] = useState<number>(1);
  const [editReason, setEditReason] = useState<string>('');
  const [isUpdatingVariant, setIsUpdatingVariant] = useState<boolean>(false);

  const handleOpenVariantEditModal = (variant: any) => {
    setEditingVariant(variant);
    setEditPrice(variant.price || 0);
    setEditStock(variant.stock || 0);
    setEditMOQ(variant.min_order_qty || variant.min_order_quantity || 1);
    setEditReason('');
  };

  const handleSaveVariantModalUpdate = async () => {
    if (!selectedProductRecord || !editingVariant) return;
    setIsUpdatingVariant(true);
    try {
      const now = new Date().toISOString();
      const currentMOQ = editingVariant.min_order_qty || editingVariant.min_order_quantity || 1;

      const newAuditLogEntry = {
        id: `aud-v-${Date.now()}`,
        timestamp: now,
        actor_name: currentUser?.full_name || 'Seller Admin',
        prev_price: editingVariant.price || 0,
        new_price: editPrice,
        prev_stock: editingVariant.stock || 0,
        new_stock: editStock,
        prev_moq: currentMOQ,
        new_moq: editMOQ,
        reason: editReason.trim() || 'Operational price & stock update'
      };

      const updatedAuditHistory = [newAuditLogEntry, ...(editingVariant.audit_history || [])];

      const updatedVariants = (selectedProductRecord.variants || []).map((v: any) => {
        if (v.id === editingVariant.id || (v.sku && v.sku === editingVariant.sku)) {
          return {
            ...v,
            price: editPrice,
            stock: editStock,
            min_order_qty: editMOQ,
            min_order_quantity: editMOQ,
            audit_history: updatedAuditHistory
          };
        }
        return v;
      });

      const updatedProduct: SellerProduct = {
        ...selectedProductRecord,
        variants: updatedVariants,
        updated_at: now
      };

      await catalogDb.sellerProducts.put(updatedProduct);
      antMessage.success(`Variant "${editingVariant.sku || editingVariant.name}" updated & audit logged!`);
      setSelectedProductRecord(updatedProduct);
      setEditingVariant(null);
    } catch (err) {
      antMessage.error('Failed to update variant.');
    } finally {
      setIsUpdatingVariant(false);
    }
  };

  const breadcrumbs = useMemo(() => {
    if (isBusinessWorkspace) {
      return [
        { title: <Link to="/b/dashboard" className="text-slate-500 hover:text-indigo-600 transition-colors">Workspace</Link>, url: '/b/dashboard' },
        { title: <span className="text-slate-500">Catalog</span> },
        { title: <span className="text-slate-900 font-semibold">Seller Products</span> }
      ];
    }
    return [
      { title: <Link to="/user/dashboard" className="text-slate-500 hover:text-sky-600 transition-colors">User Workspace</Link>, url: '/user/dashboard' },
      { title: <span className="text-slate-900 font-semibold">My Seller Products</span> }
    ];
  }, [isBusinessWorkspace]);

  useBreadcrumb(breadcrumbs);

  // Live Query DB Tables
  const dbSellerProducts = useLiveQuery(() => catalogDb.sellerProducts.toArray()) || [];
  const dbSubmissions = useLiveQuery(() => catalogDb.sellerProductSubmissions.toArray()) || [];
  const dbCategories = useLiveQuery(() => catalogDb.categories.toArray()) || [];
  const dbMasterProducts = useLiveQuery(() => catalogDb.products.toArray()) || [];
  const dbParties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const dbManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const dbBrands = useLiveQuery(() => businessDb.brands.toArray()) || [];

  const activeParty = useMemo(() => {
    if (isBusinessWorkspace && currentBizId) {
      return dbParties.find((p: Party) => p.owner_type === 'BUSINESS' && p.owner_id === currentBizId);
    } else if (!isBusinessWorkspace && currentUserId) {
      return dbParties.find((p: Party) => p.owner_type === 'USER' && p.owner_id === currentUserId);
    }
    return null;
  }, [dbParties, isBusinessWorkspace, currentBizId, currentUserId]);

  const partySubmissionsData = useMemo(() => {
    if (!activeParty) return [];
    return dbSubmissions.filter((sub: SellerProductSubmission) => sub.party_id === activeParty.id);
  }, [dbSubmissions, activeParty]);

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

  // Flattened array of all sellable product variants for Tab 2
  const allSellableVariantsData = useMemo(() => {
    const list: any[] = [];
    partyProductsData.forEach((sp: any) => {
      if (sp.variants && Array.isArray(sp.variants)) {
        sp.variants.forEach((v: any, idx: number) => {
          list.push({
            key: v.id || `${sp.id}-var-${idx}`,
            variantId: v.id || `var-${idx}`,
            variantPlatformId: v.variant_platform_id || `GPID-${sp.id.replace('sprod-', '')}-${idx + 1}`,
            sku: v.sku || 'N/A',
            name: v.name || `Variant #${idx + 1}`,
            price: v.price || 0,
            currency: v.currency || sp.currency || 'USD',
            stock: v.stock || 0,
            minOrderQty: v.min_order_qty || 1,
            leadTimeDays: v.lead_time_days || 3,
            isLocked: !!v.is_locked,
            combinationValues: v.combination_values || [],
            parentProductId: sp.id,
            parentProductName: sp.product_name,
            parentBrandName: sp.brandName,
            parentCategoryName: sp.categoryName,
            parentRecord: sp
          });
        });
      }
    });
    return list.filter(v =>
      v.name.toLowerCase().includes(searchText.toLowerCase()) ||
      v.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      v.variantPlatformId.toLowerCase().includes(searchText.toLowerCase()) ||
      v.parentProductName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [partyProductsData, searchText]);

  const variantColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-gray-500 font-medium">
          {index + 1}
        </span>
      )
    },
    {
      title: 'Sellable Variant SKU',
      key: 'variant_identity',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Lucide.Layers size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
              <span>{record.name}</span>
              <AntTag color="purple" className="text-[10px] font-mono px-1.5 py-0 font-bold">
                {record.variantPlatformId}
              </AntTag>
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex flex-wrap items-center gap-2">
              <span>SKU: <strong>{record.sku}</strong></span>
              {record.combinationValues && record.combinationValues.length > 0 && (
                <span className="text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 text-[10px]">
                  {record.combinationValues.map((c: any) => `${c.attribute_name || 'Attr'}: ${c.label}`).join(' • ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Parent Listing',
      key: 'parent_product',
      render: (_: any, record: any) => (
        <div>
          <div className="text-xs font-semibold text-gray-900 flex items-center gap-1">
            <Lucide.Package size={13} className="text-indigo-600" />
            {record.parentProductName}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
            {record.parentBrandName} • {record.parentCategoryName}
          </div>
        </div>
      )
    },
    {
      title: 'Unit Price',
      key: 'price',
      width: 140,
      render: (_: any, record: any) => (
        <div className="font-mono text-xs font-bold text-emerald-700">
          {record.currency} {record.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      title: 'Stock & MOQ',
      key: 'stock_moq',
      width: 170,
      render: (_: any, record: any) => (
        <div className="text-xs font-mono">
          <div className="font-bold text-gray-900 flex items-center gap-1">
            <Lucide.Boxes size={12} className="text-emerald-600" />
            {record.stock} Units Stock
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            MOQ: <strong>{record.minOrderQty}</strong> • Lead: <strong>{record.leadTimeDays}d</strong>
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_: any, record: any) => (
        <AntButton
          type="text"
          size="small"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center gap-1 font-medium text-xs"
          onClick={() => {
            setSelectedProductRecord(record.parentRecord);
            setIsDetailsDrawerOpen(true);
          }}
        >
          <Lucide.Eye size={14} /> Parent Listing
        </AntButton>
      )
    }
  ];

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
            <div className="font-semibold text-gray-900 text-sm">
              {record.product_name}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              Part No: <strong>{record.part_number}</strong>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Category & Brand',
      key: 'category_brand',
      render: (_: any, record: any) => (
        <div>
          <div className="text-xs font-semibold text-gray-900 flex items-center gap-1">
            <Lucide.FolderTree size={13} className="text-indigo-600" />
            {record.categoryName}
          </div>
          <div className="text-xs text-amber-700 mt-0.5 flex items-center gap-1 font-medium">
            <Lucide.Award size={13} className="text-amber-600" />
            {record.brandName}
          </div>
        </div>
      )
    },
    {
      title: 'Variants & Stock',
      key: 'variants_stock',
      render: (_: any, record: any) => (
        <div>
          <AntTag color="blue" className="text-xs font-mono font-medium">
            {record.variants ? record.variants.length : 0} Variant(s)
          </AntTag>
          <div className="text-xs text-gray-600 mt-1 font-mono font-medium flex items-center gap-1">
            <Lucide.Boxes size={13} className="text-emerald-600" />
            <span>{record.totalStock} Units</span>
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
      key: 'actions',
      width: 120,
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

  const submissionColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-xs text-gray-500 font-medium">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'Submission ID & Title',
      key: 'title',
      render: (_: any, record: SellerProductSubmission) => {
        const titleAttr = record.attributes?.product_name?.value || 'Untitled Product';
        return (
          <div>
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              {titleAttr}
              <span className="font-mono text-xs text-sky-600 font-normal">({record.id})</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono">
              Round: <strong className="text-gray-700">{record.current_round}</strong> • Submitted: {record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : 'Draft'}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Submission Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string, record: SellerProductSubmission) => {
        const rejectedCount = Object.values(record.attributes || {}).filter(a => a.status === 'REJECTED').length;
        if (status === 'NEEDS_REVISION') {
          return (
            <AntTag color="error" className="text-xs font-semibold">
              NEEDS REVISION ({rejectedCount} Rejected)
            </AntTag>
          );
        }
        if (status === 'SUBMITTED') {
          return <AntTag color="processing" className="text-xs font-semibold">UNDER REVIEW</AntTag>;
        }
        if (status === 'APPROVED') {
          return <AntTag color="success" className="text-xs font-semibold">APPROVED (Ready)</AntTag>;
        }
        if (status === 'PUBLISHED') {
          return <AntTag color="cyan" className="text-xs font-semibold">PUBLISHED</AntTag>;
        }
        return <AntTag color="default" className="text-xs font-semibold">DRAFT</AntTag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: any, record: SellerProductSubmission) => {
        const createPath = isBusinessWorkspace ? `/b/products/edit/${record.id}` : `/user/seller-products/edit/${record.id}`;
        return (
          <AntButton
            type="primary"
            size="small"
            icon={record.status === 'NEEDS_REVISION' ? <Lucide.Edit3 size={14} /> : <Lucide.Eye size={14} />}
            className={record.status === 'NEEDS_REVISION' ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600'}
            onClick={() => navigate(createPath)}
          >
            {record.status === 'NEEDS_REVISION' ? `Revise Round ${record.current_round + 1}` : 'Edit / View'}
          </AntButton>
        );
      }
    }
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
          className="bg-indigo-600 hover:bg-indigo-700 font-medium"
          size="large"
          onClick={() => navigate(isBusinessWorkspace ? '/b/products/create' : '/user/seller-products/create')}
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
        </div>

        <AntTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-4"
          items={[
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.Package size={16} /> Published Active Listings ({partyProductsData.length})
                </span>
              ),
              children: (
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
                  locale={{ emptyText: 'No active published seller products listed for this party.' }}
                />
              )
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.Layers size={16} className="text-purple-600" /> Sellable Product Variants Matrix ({allSellableVariantsData.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={variantColumns}
                  dataSource={allSellableVariantsData}
                  rowKey="key"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: 'No sellable variants configured for this party.' }}
                />
              )
            },
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.FileCheck size={16} /> Product Submissions & Revisions ({partySubmissionsData.length})
                </span>
              ),
              children: (
                <AntTable
                  size="small"
                  columns={submissionColumns}
                  dataSource={partySubmissionsData}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: 'No pending product review submissions for this party.' }}
                />
              )
            }
          ]}
        />
      </div>

      {/* Seller Product Details & High-Scale Variant Editor Drawer */}
      <AntDrawer
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.Package size={20} className="text-indigo-600" />
            Seller Product Overview – {selectedProductRecord?.product_name}
          </div>
        }
        open={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        width={860}
        destroyOnClose
      >
        {selectedProductRecord && (
          <div className="space-y-6 pb-8">
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

            {/* SECTION 1: CORE IDENTIFIERS & TAXONOMIES */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Lucide.Tag size={15} className="text-sky-600" />
                1. Core Identifiers & Taxonomies
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Listing Title</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedProductRecord.product_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Master Catalog Item</span>
                  <span className="font-semibold text-indigo-600">{selectedProductRecord.masterProductName} ({selectedProductRecord.catalog_product_id})</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Category</span>
                  <span className="font-semibold text-gray-900">{selectedProductRecord.categoryName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Brand</span>
                  <span className="font-semibold text-amber-700">{selectedProductRecord.brandName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Manufacturer</span>
                  <span className="font-semibold text-gray-900">{selectedProductRecord.manufacturerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Country of Origin</span>
                  <span className="font-mono text-gray-800">{selectedProductRecord.country_of_origin || 'US'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: MANUFACTURING & PHYSICAL SPECS */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Lucide.Factory size={15} className="text-emerald-600" />
                2. Manufacturing & Physical Dimensions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-gray-400 block font-sans font-medium">Year of Manufacture</span>
                  <span className="font-bold text-gray-800">{selectedProductRecord.year_of_manufacture || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans font-medium">Model Number</span>
                  <span className="font-bold text-gray-800">{selectedProductRecord.model_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans font-medium">Part Number</span>
                  <span className="font-bold text-gray-800">{selectedProductRecord.part_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans font-medium">Dimensions (H x W x L)</span>
                  <span className="font-semibold text-gray-900">
                    {selectedProductRecord.height || '-'} x {selectedProductRecord.width || '-'} x {selectedProductRecord.length || '-'} mm
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans font-medium">Weight</span>
                  <span className="font-semibold text-gray-900">{selectedProductRecord.weight ? `${selectedProductRecord.weight} kg` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: OPERATIONAL & GOVERNANCE INSTRUCTIONS */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Lucide.ShieldCheck size={15} className="text-purple-600" />
                3. Operational & Governance Instructions
              </h4>
              <div className="space-y-2 text-xs">
                {selectedProductRecord.operation_instructions && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Operation Instructions:</span>
                    <p className="text-slate-600 mt-0.5 mb-0">{selectedProductRecord.operation_instructions}</p>
                  </div>
                )}
                {selectedProductRecord.safety_instructions && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Safety Instructions:</span>
                    <p className="text-slate-600 mt-0.5 mb-0">{selectedProductRecord.safety_instructions}</p>
                  </div>
                )}
                {selectedProductRecord.handling_instructions && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Handling & Storage:</span>
                    <p className="text-slate-600 mt-0.5 mb-0">{selectedProductRecord.handling_instructions}</p>
                  </div>
                )}
                {selectedProductRecord.maintenance_instructions && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Maintenance Instructions:</span>
                    <p className="text-slate-600 mt-0.5 mb-0">{selectedProductRecord.maintenance_instructions}</p>
                  </div>
                )}
                {selectedProductRecord.deviations && (
                  <div className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-900">
                    <span className="font-bold block">Deviations Note:</span>
                    <p className="mt-0.5 mb-0">{selectedProductRecord.deviations}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: CATEGORY DYNAMIC TECHNICAL SPECIFICATIONS */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Lucide.SlidersHorizontal size={15} className="text-indigo-600" />
                4. Category Dynamic Technical Specifications
              </h4>
              {selectedProductRecord.specifications && selectedProductRecord.specifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProductRecord.specifications.map((s: any, idx: number) => (
                    <div key={idx} className="bg-indigo-50/80 border border-indigo-200 px-2.5 py-1.5 rounded text-xs">
                      <span className="text-indigo-900 font-medium">{s.attribute_name}: </span>
                      <strong className="text-indigo-700">{s.values.map((v: any) => v.label).join(', ')}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 text-xs italic">No dynamic category specifications attached.</span>
              )}
            </div>

            {/* SECTION 5: SELLABLE PRODUCT VARIANTS DIRECTORY & PER-VARIANT AUDIT EDITOR */}
            <div className="bg-white border border-purple-200 rounded-lg p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5 mb-0">
                    <Lucide.Layers size={16} className="text-purple-600" />
                    5. Sellable Product Variants Directory ({selectedProductRecord.variants ? selectedProductRecord.variants.length : 0})
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-0">
                    Directory of sellable SKU variants. Select <strong>"Update Specs & Audit"</strong> on any variant to manage unit pricing, stock levels, MOQ, and view audit history.
                  </p>
                </div>
                <AntTag color="purple" className="text-xs font-mono font-bold">
                  Total Stock: {selectedProductRecord.totalStock} Units
                </AntTag>
              </div>

              <AntTable
                size="small"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '25', '50', '100'],
                  showTotal: (total) => `Total ${total} Variants`
                }}
                dataSource={selectedProductRecord.variants || []}
                rowKey={(v: any, idx?: number) => v.id || `var-${idx || 0}`}
                columns={[
                  {
                    title: 'Variant Name & Combination Attributes (Locked)',
                    key: 'combination',
                    render: (_: any, v: any, idx: number) => (
                      <div>
                        <div className="font-bold text-xs text-gray-900 mb-1">
                          {v.name || `Variant #${idx + 1}`}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {v.combination_values && v.combination_values.length > 0 ? (
                            v.combination_values.map((c: any, i: number) => (
                              <AntTag key={i} color="blue" className="text-[10px] font-mono px-1">
                                {c.attribute_name || 'Attr'}: <strong>{c.label}</strong>
                              </AntTag>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">Single SKU / Non-Variant Listing</span>
                          )}
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Platform SKU / ID (Immutable)',
                    key: 'platform_sku',
                    width: 190,
                    render: (_: any, v: any) => (
                      <div className="space-y-1">
                        <AntTag color="purple" className="text-[10px] font-mono font-bold block w-fit">
                          {v.variant_platform_id || `GPID-ASSIGNED`}
                        </AntTag>
                        <div className="text-[11px] font-mono text-gray-700">
                          SKU: <strong>{v.sku || 'N/A'}</strong>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Price & Stock',
                    key: 'price_stock',
                    width: 170,
                    render: (_: any, v: any) => (
                      <div className="text-xs font-mono space-y-0.5">
                        <div className="font-bold text-emerald-700">
                          {v.currency || selectedProductRecord.currency} {v.price ? v.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                        </div>
                        <div className="text-[11px] text-gray-600">
                          Stock: <strong>{v.stock || 0}</strong> • MOQ: <strong>{v.min_order_qty || v.min_order_quantity || 1}</strong>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: 180,
                    render: (_: any, v: any) => (
                      <AntButton
                        size="small"
                        type="primary"
                        icon={<Lucide.Edit3 size={13} />}
                        className="bg-purple-600 hover:bg-purple-700 font-semibold text-xs"
                        onClick={() => handleOpenVariantEditModal(v)}
                      >
                        Update Specs & Audit
                      </AntButton>
                    )
                  }
                ]}
              />
            </div>
          </div>
        )}
      </AntDrawer>

      {/* Per-Variant Price, Stock & Audit Log Modal */}
      <AntModal
        title={
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Lucide.SlidersHorizontal size={18} className="text-purple-600" />
            Update Variant Specs & Audit Log – {editingVariant?.name || editingVariant?.sku}
          </div>
        }
        open={!!editingVariant}
        onCancel={() => setEditingVariant(null)}
        onOk={handleSaveVariantModalUpdate}
        okText="Save Variant Changes"
        confirmLoading={isUpdatingVariant}
        width={650}
        destroyOnClose
      >
        {editingVariant && (
          <div className="space-y-5 py-2">
            {/* Immutable Variant Identity Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-900">{editingVariant.name || 'Variant SKU'}</span>
                  <AntTag color="purple" className="font-mono font-bold">
                    GPID: {editingVariant.variant_platform_id || 'GPID-ASSIGNED'}
                  </AntTag>
                  <AntTag color="blue" className="font-mono font-semibold">
                    SKU: {editingVariant.sku}
                  </AntTag>
                </div>
                <AntTag color="magenta" className="text-[10px] font-mono flex items-center gap-1">
                  <Lucide.Lock size={10} /> Immutable Platform SKU / ID
                </AntTag>
              </div>

              {editingVariant.combination_values && editingVariant.combination_values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-purple-200/80">
                  <span className="text-purple-700 font-semibold">Combination Specs:</span>
                  {editingVariant.combination_values.map((c: any, idx: number) => (
                    <AntTag key={idx} color="geekblue" className="text-[10px] font-mono">
                      {c.attribute_name || 'Attr'}: <strong>{c.label}</strong>
                    </AntTag>
                  ))}
                </div>
              )}
            </div>

            {/* Operational Edit Fields */}
            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Unit Price</label>
                <AntInputNumber
                  size="middle"
                  min={0}
                  step={0.01}
                  className="w-full font-mono font-bold text-emerald-700"
                  addonBefore={editingVariant.currency || 'USD'}
                  value={editPrice}
                  onChange={(val) => setEditPrice(val || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Units Stock</label>
                <AntInputNumber
                  size="middle"
                  min={0}
                  precision={0}
                  className="w-full font-mono font-bold text-gray-900"
                  value={editStock}
                  onChange={(val) => setEditStock(val || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Min Order Qty (MOQ)</label>
                <AntInputNumber
                  size="middle"
                  min={1}
                  precision={0}
                  className="w-full font-mono font-bold text-gray-900"
                  value={editMOQ}
                  onChange={(val) => setEditMOQ(val || 1)}
                />
              </div>
            </div>

            {/* Audit Change Reason / Note Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Change Reason & Audit Note <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <AntInput.TextArea
                rows={2}
                placeholder="Reason for price or stock adjustment (e.g. Quarterly vendor price update)"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>

            {/* Audit Change History Timeline */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lucide.History size={14} className="text-indigo-600" />
                Variant Change & Audit Log History
              </h5>

              {editingVariant.audit_history && editingVariant.audit_history.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {editingVariant.audit_history.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs space-y-1 font-mono">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-800">{log.actor_name}</span>
                        <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span>Price: <s className="text-gray-400">${log.prev_price}</s> $\rightarrow$ <strong className="text-emerald-700">${log.new_price}</strong></span>
                        <span>Stock: <s className="text-gray-400">{log.prev_stock}</s> $\rightarrow$ <strong className="text-gray-900">{log.new_stock}</strong></span>
                        <span>MOQ: <s className="text-gray-400">{log.prev_moq}</s> $\rightarrow$ <strong className="text-gray-900">{log.new_moq}</strong></span>
                      </div>
                      {log.reason && (
                        <div className="text-[11px] text-gray-600 font-sans italic border-t border-slate-200/80 pt-0.5">
                          "{log.reason}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-dashed border-gray-200 text-center">
                  No previous price or stock audit history entries logged for this variant.
                </div>
              )}
            </div>
          </div>
        )}
      </AntModal>
    </div>
  );
};

export default UserSellerProducts;
