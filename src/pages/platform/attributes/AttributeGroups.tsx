import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Input as AntInput, Modal as AntModal, Form as AntForm, Drawer as AntDrawer, Tag as AntTag } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type AttributeGroup } from '../../../data/catalog';

const AttributeGroups: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [currentMappingGroup, setCurrentMappingGroup] = useState<any>(null);
  
  const [form] = AntForm.useForm();
  
  const groups = useLiveQuery(() => catalogDb.attributeGroups.toArray()) || [];
  const GLOBAL_ATTRIBUTES = useLiveQuery(() => catalogDb.attributes.toArray()) || [];
  
  // Search states
  const [groupSearchText, setGroupSearchText] = useState('');
  const [attrSearchText, setAttrSearchText] = useState('');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Taxonomies</span> },
    { title: <span className="text-gray-900 font-semibold">Attribute Groups</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => g.name.toLowerCase().includes(groupSearchText.toLowerCase()));
  }, [groups, groupSearchText]);

  const filteredAttributes = useMemo(() => {
    return GLOBAL_ATTRIBUTES.filter(a => a.name.toLowerCase().includes(attrSearchText.toLowerCase()));
  }, [GLOBAL_ATTRIBUTES, attrSearchText]);

  const columns = [
    { title: 'Group Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-gray-900">{text}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { 
      title: 'Mapped Attributes', 
      key: 'attributeIds', 
      render: (_: any, record: AttributeGroup) => (
        <div className="flex items-center gap-2">
          <AntTag color="purple">{record.attributeIds?.length || 0} Attributes</AntTag>
          <AntButton type="link" size="small" className="p-0 text-sky-600" onClick={() => openMappingDrawer(record)}>
            Manage
          </AntButton>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: AttributeGroup) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-gray-600 hover:text-sky-600" onClick={() => {
            form.setFieldsValue(record);
            setIsModalVisible(true);
          }}>
            Edit Base
          </AntButton>
          <AntButton type="text" danger size="small" onClick={async () => {
            await catalogDb.attributeGroups.delete(record.id);
          }}>Delete</AntButton>
        </div>
      ),
    },
  ];

  const handleSave = async (formValues: any) => {
    if (formValues.id) {
      await catalogDb.attributeGroups.update(formValues.id, formValues);
    } else {
      const newGroup: AttributeGroup = {
        ...formValues,
        id: `g-${Date.now()}`,
        attributeIds: []
      };
      await catalogDb.attributeGroups.add(newGroup);
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const openMappingDrawer = (group: AttributeGroup) => {
    setCurrentMappingGroup(group);
    setAttrSearchText('');
    setIsDrawerVisible(true);
  };

  const handleSaveMapping = async (selectedRowKeys: React.Key[]) => {
    const newAttrIds = selectedRowKeys as string[];
    await catalogDb.attributeGroups.update(currentMappingGroup.id, { attributeIds: newAttrIds });
    setCurrentMappingGroup({ ...currentMappingGroup, attributeIds: newAttrIds });
  };

  return (
    <div className="w-full max-w-6xl pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Attribute Groups ({groups.length})</h1>
          <p className="text-gray-500">Group attributes together so they can be assigned to product categories at once.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => { form.resetFields(); setIsModalVisible(true); }}>
          <Lucide.Plus size={16} /> Create Group
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput 
            placeholder="Search groups..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            className="w-80"
            value={groupSearchText}
            onChange={(e) => setGroupSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable 
          columns={columns} 
          dataSource={filteredGroups} 
          rowKey="id" 
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      <AntModal
        title={form.getFieldValue('id') ? "Edit Group Base" : "Create New Group"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <AntForm.Item name="id" hidden><AntInput /></AntForm.Item>
          
          <AntForm.Item name="name" label="Group Name" rules={[{ required: true }]}>
            <AntInput placeholder="e.g. Electronics Core, Apparel Specs" />
          </AntForm.Item>
          <AntForm.Item name="description" label="Description">
            <AntInput.TextArea placeholder="Brief description of this group..." />
          </AntForm.Item>
          
          <div className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
            <Lucide.Info size={14} className="inline mr-1" />
            You can map attributes to this group from the main list after saving.
          </div>
        </AntForm>
      </AntModal>

      {/* Massive Data Mapping Drawer */}
      <AntDrawer
        title={
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">Map Attributes to "{currentMappingGroup?.name}"</span>
            <span className="text-sm font-normal text-gray-500">Select which global attributes belong in this group.</span>
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
            placeholder="Search hundreds of attributes..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            size="large"
            value={attrSearchText}
            onChange={(e) => setAttrSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: currentMappingGroup?.attributeIds || [],
            onChange: handleSaveMapping,
            preserveSelectedRowKeys: true,
          }}
          columns={[{ title: 'Global Attribute', dataIndex: 'name', key: 'name' }]}
          dataSource={filteredAttributes}
          rowKey="id"
          pagination={{ pageSize: 15, showSizeChanger: false }}
          size="small"
        />
      </AntDrawer>
    </div>
  );
};

export default AttributeGroups;
