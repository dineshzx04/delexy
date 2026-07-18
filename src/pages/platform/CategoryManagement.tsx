import React, { useState, useMemo } from 'react';
import { Table as AntTable, Input as AntInput, Form as AntForm, Button as AntButton, Switch as AntSwitch, notification, Modal as AntModal, Tag as AntTag, Breadcrumb as AntBreadcrumb, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Category } from '../../data/db';
import { useEffect } from 'react';
 

// Generate massive flat list with parent relationships
const generateData = (): Category[] => {
  const data: Category[] = [];
  
  // 50 Root Categories
  for (let i = 1; i <= 50; i++) {
    const rootId = `root-${i}`;
    data.push({
      id: rootId,
      name: `Category ${i}`,
      slug: `category-${i}`,
      isActive: true,
      mappedGroupIds: ['g1', 'g2'],
      parentId: null,
      childrenCount: 20
    });
    
    // 20 Level 1 Subcategories per Root
    for (let j = 1; j <= 20; j++) {
      const l1Id = `l1-${i}-${j}`;
      data.push({
        id: l1Id,
        name: `Sub-category ${i}.${j}`,
        slug: `sub-category-${i}-${j}`,
        isActive: true,
        mappedGroupIds: ['g5'],
        parentId: rootId,
        childrenCount: 5
      });
      
      // 5 Level 2 Subcategories per L1
      for (let k = 1; k <= 5; k++) {
        data.push({
          id: `l2-${i}-${j}-${k}`,
          name: `Nested Sub ${i}.${j}.${k}`,
          slug: `nested-sub-${i}-${j}-${k}`,
          isActive: i % 2 === 0,
          mappedGroupIds: [],
          parentId: l1Id,
          childrenCount: 3
        });
        
        // 3 Level 3 Subcategories per L2
        for (let l = 1; l <= 3; l++) {
          data.push({
            id: `l3-${i}-${j}-${k}-${l}`,
            name: `Leaf Category ${i}.${j}.${k}.${l}`,
            slug: `leaf-${i}-${j}-${k}-${l}`,
            isActive: true,
            mappedGroupIds: [],
            parentId: `l2-${i}-${j}-${k}`,
            childrenCount: 0
          });
        }
      }
    }
  }
  return data;
};

const ALL_CATEGORIES = generateData();

const CategoryManagement: React.FC = () => {
  const categories = useLiveQuery(() => db.categories.toArray());
  const GLOBAL_GROUPS = useLiveQuery(() => db.attributeGroups.toArray()) || [];
  const [searchText, setSearchText] = useState('');
  
  // Sync mock data to Dexie on mount if empty
  useEffect(() => {
    const syncData = async () => {
      const count = await db.categories.count();
      if (count === 0) {
        await db.categories.bulkAdd(ALL_CATEGORIES as any);
      }
    };
    syncData();
  }, []);

  // Drill-down Breadcrumb State
  const [path, setPath] = useState<Category[]>([]);
  
  // Modal State for Create/Edit Base
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = AntForm.useForm();
  
  // Drawer State for Group Mapping
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [mappingCategory, setMappingCategory] = useState<Category | null>(null);
  const [groupSearch, setGroupSearch] = useState('');

  const appBreadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-900 font-semibold">Categories</span> }
  ], []);

  useBreadcrumb(appBreadcrumbs);

  // Determine current parent based on drill-down path
  const currentParentId = path.length > 0 ? path[path.length - 1].id : null;

  // Filter categories for the CURRENT level only
  const currentLevelCategories = useMemo(() => {
    return (categories || [])
      .filter(c => c.parentId === currentParentId)
      .filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()) || c.slug.toLowerCase().includes(searchText.toLowerCase()));
  }, [categories, currentParentId, searchText]);

  // Drawer Group Filter
  const filteredGroups = useMemo(() => {
    return GLOBAL_GROUPS.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  }, [GLOBAL_GROUPS,groupSearch]);

  // Handle Drill Down
  const navigateToLevel = (category: Category) => {
    setSearchText('');
    setPath([...path, category]);
  };

  // Handle Breadcrumb Click
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setPath([]); // Go to root
    } else {
      setPath(path.slice(0, index + 1));
    }
    setSearchText('');
  };

  // Base Modal Actions
  const handleCreateNew = (specificParentId: string | null = null) => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ 
      isActive: true, 
      parentId: specificParentId !== null ? specificParentId : currentParentId 
    });
    setIsModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    if (editingCategory) {
      await db.categories.update(editingCategory.id, values);
      notification.success({ message: 'Category Updated' });
    } else {
      const newCat: Category = {
        ...values,
        id: `new-${Date.now()}`,
        mappedGroupIds: [],
        childrenCount: 0
      };
      await db.categories.add(newCat);
      
      // Update parent child count
      if (values.parentId) {
        const parentCat = (categories || []).find(c => c.id === values.parentId);
        if (parentCat) {
          await db.categories.update(parentCat.id, { childrenCount: (parentCat.childrenCount || 0) + 1 });
        }
      }
      
      notification.success({ message: 'Category Created' });
    }
    setIsModalVisible(false);
  };

  const handleDelete = async (id: string) => {
    const cat = (categories || []).find(c => c.id === id);
    if (cat && (cat.childrenCount || 0) > 0) {
      notification.error({ message: 'Cannot delete category with subcategories.' });
      return;
    }
    await db.categories.delete(id);
    
    // Update parent child count
    if (cat && cat.parentId) {
      const parentCat = (categories || []).find(c => c.id === cat.parentId);
      if (parentCat && (parentCat.childrenCount || 0) > 0) {
        await db.categories.update(parentCat.id, { childrenCount: (parentCat.childrenCount || 1) - 1 });
      }
    }
    
    notification.success({ message: 'Category Deleted' });
  };

  // Mapping Drawer Actions
  const openMappingDrawer = (category: Category) => {
    setMappingCategory(category);
    setGroupSearch('');
    setIsDrawerVisible(true);
  };

  const handleSaveMapping = async (selectedRowKeys: React.Key[]) => {
    if (!mappingCategory) return;
    const newGroupIds = selectedRowKeys as string[];
    await db.categories.update(mappingCategory.id, { mappedGroupIds: newGroupIds });
    
    // We update the mappingCategory state as well so the drawer reflects changes instantly
    setMappingCategory({ ...mappingCategory, mappedGroupIds: newGroupIds });
  };

  const columns = [
    { 
      title: 'Category Name', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string, record: Category) => (
        <div className="flex items-center gap-2">
          {(record.childrenCount || 0) > 0 ? (
            <AntButton 
              type="link" 
              className="p-0 font-semibold text-sky-600 flex items-center gap-2"
              onClick={() => navigateToLevel(record)}
            >
              <Lucide.Folder size={16} className="text-sky-500 fill-sky-100" />
              {text}
            </AntButton>
          ) : (
            <span className="font-semibold text-gray-700 flex items-center gap-2">
              <Lucide.FileText size={16} className="text-gray-400" />
              {text}
            </span>
          )}
        </div>
      )
    },
    { 
      title: 'Subcategories', 
      dataIndex: 'childrenCount', 
      key: 'childrenCount',
      render: (count: number) => (
        count > 0 ? <AntTag color="blue">{count} items</AntTag> : <span className="text-gray-400">-</span>
      )
    },
    { 
      title: 'Attribute Groups', 
      key: 'mappedGroupIds',
      render: (_: any, record: Category) => (
        <div className="flex items-center gap-2">
          <AntTag color="purple">{record.mappedGroupIds?.length || 0} Groups</AntTag>
          <AntButton type="link" size="small" className="p-0 text-sky-600" onClick={() => openMappingDrawer(record)}>
            Manage
          </AntButton>
        </div>
      )
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
      width: 250,
      render: (_: any, record: Category) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => handleCreateNew(record.id)}>
            <Lucide.Plus size={14} className="mr-1" /> Subcategory
          </AntButton>
          <AntButton type="text" size="small" className="text-gray-600 hover:text-sky-600" onClick={() => handleEdit(record)}>
            Edit Base
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Categories</h1>
          <p className="text-gray-500">Drill-down table management for 4000+ hierarchical categories.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => handleCreateNew(currentParentId)}>
          <Lucide.Plus size={16} /> {path.length === 0 ? 'Create Root Category' : 'Create Subcategory Here'}
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <Lucide.FolderTree size={20} className="text-gray-400" />
          <AntBreadcrumb className="text-base font-medium">
            <AntBreadcrumb.Item className="cursor-pointer hover:text-sky-600 transition-colors" onClick={() => navigateToBreadcrumb(-1)}>
              Root Level
            </AntBreadcrumb.Item>
            {path.map((crumb, index) => (
              <AntBreadcrumb.Item 
                key={crumb.id} 
                className={index === path.length - 1 ? "text-gray-900" : "cursor-pointer hover:text-sky-600 transition-colors"}
                onClick={() => navigateToBreadcrumb(index)}
              >
                {crumb.name}
              </AntBreadcrumb.Item>
            ))}
          </AntBreadcrumb>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <AntInput 
            placeholder={`Search ${path.length > 0 ? 'subcategories' : 'root categories'}...`} 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="text-sm text-gray-500">
            {currentLevelCategories.length} items at this level
          </div>
        </div>
        
        {/* Flat Paginated Table (Only shows current level) */}
        <AntTable 
          columns={columns} 
          dataSource={currentLevelCategories} 
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      </div>

      {/* CREATE / EDIT CATEGORY BASE MODAL */}
      <AntModal
        title={editingCategory ? "Edit Category Base" : (form.getFieldValue('parentId') ? "Create Subcategory" : "Create Root Category")}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <AntForm.Item name="id" hidden><AntInput /></AntForm.Item>
          <AntForm.Item name="parentId" hidden><AntInput /></AntForm.Item>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">Status</div>
            <AntForm.Item name="isActive" valuePropName="checked" className="mb-0">
              <AntSwitch checkedChildren="Active" unCheckedChildren="Draft" />
            </AntForm.Item>
          </div>

          <AntForm.Item name="name" label="Category Name" rules={[{ required: true }]}>
            <AntInput placeholder="e.g. Smartphones" />
          </AntForm.Item>

          <AntForm.Item name="slug" label="URL Slug" rules={[{ required: true }]}>
            <AntInput prefix="/category/" placeholder="smartphones" />
          </AntForm.Item>

          <div className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
            <Lucide.Info size={14} className="inline mr-1" />
            You can map multiple Attribute Groups to this category from the main list using the "Manage" button.
          </div>
        </AntForm>
      </AntModal>

      {/* DRAWER FOR MAPPING ATTRIBUTE GROUPS */}
      <AntDrawer
        title={
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">Map Attribute Groups</span>
            <span className="text-sm font-normal text-gray-500">
              Select groups for category "{mappingCategory?.name}"
            </span>
          </div>
        }
        placement="right"
        width={600}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        extra={
          <AntButton type="primary" className="bg-sky-600" onClick={() => setIsDrawerVisible(false)}>
            Done
          </AntButton>
        }
      >
        <div className="mb-4">
          <AntInput 
            placeholder="Search thousands of groups..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            size="large"
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: mappingCategory?.mappedGroupIds || [],
            onChange: handleSaveMapping,
            preserveSelectedRowKeys: true,
          }}
          columns={[{ title: 'Global Attribute Group', dataIndex: 'name', key: 'name' }]}
          dataSource={filteredGroups}
          rowKey="id"
          pagination={{ pageSize: 15, showSizeChanger: false }}
          size="small"
        />
      </AntDrawer>

    </div>
  );
};

export default CategoryManagement;
