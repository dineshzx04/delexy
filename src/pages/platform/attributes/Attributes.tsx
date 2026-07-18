import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Input as AntInput, Modal as AntModal, Form as AntForm, Select as AntSelect, Tag as AntTag, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Attribute } from '../../../data/db';

const Attributes: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [currentMappingAttr, setCurrentMappingAttr] = useState<any>(null);

  const [form] = AntForm.useForm();

  const attributes = useLiveQuery(() => db.attributes.toArray()) || [];
  const GLOBAL_VALUES = useLiveQuery(() => db.attributeValues.toArray()) || [];
  console.log(GLOBAL_VALUES)

  // Search states
  const [attrSearchText, setAttrSearchText] = useState('');
  const [valSearchText, setValSearchText] = useState('');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-500">Taxonomies</span> },
    { title: <span className="text-gray-900 font-semibold">Attributes</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Filtered lists
  const filteredAttributes = useMemo(() => {
    return attributes.filter(a => a.name.toLowerCase().includes(attrSearchText.toLowerCase()));
  }, [attributes, attrSearchText]);

  const filteredValues = useMemo(() => {
    return GLOBAL_VALUES.filter(v => v.value.toLowerCase().includes(valSearchText.toLowerCase()));
  }, [GLOBAL_VALUES, valSearchText]);

  const columns = [
    { title: 'Attribute Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-gray-900">{text}</span> },
    { title: 'Input Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Mapped Values',
      key: 'valueIds',
      render: (_: any, record: Attribute) => (
        <div className="flex items-center gap-2">
          <AntTag color="blue">{record.valueIds?.length || 0} Values</AntTag>
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
      render: (_: any, record: Attribute) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-gray-600 hover:text-sky-600" onClick={() => {
            form.setFieldsValue(record);
            setIsModalVisible(true);
          }}>
            Edit Base
          </AntButton>
          <AntButton type="text" danger size="small" onClick={async () => {
            await db.attributes.delete(record.id);
          }}>Delete</AntButton>
        </div>
      ),
    },
  ];

  const handleSave = async (formValues: any) => {
    if (formValues.id) {
      await db.attributes.update(formValues.id, formValues);
    } else {
      const newAttr: Attribute = {
        ...formValues,
        id: `attr-${Date.now()}`,
        valueIds: []
      };
      await db.attributes.add(newAttr);
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const openMappingDrawer = (attr: Attribute) => {
    setCurrentMappingAttr(attr);
    setValSearchText('');
    setIsDrawerVisible(true);
  };

  const handleSaveMapping = async (selectedRowKeys: React.Key[]) => {
    const newValIds = selectedRowKeys as string[];
    await db.attributes.update(currentMappingAttr.id, { valueIds: newValIds });
    setCurrentMappingAttr({ ...currentMappingAttr, valueIds: newValIds });
  };

  return (
    <div className="w-full max-w-6xl pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Attributes ({attributes.length})</h1>
          <p className="text-gray-500">Define properties and map them to their allowed values.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => { form.resetFields(); setIsModalVisible(true); }}>
          <Lucide.Plus size={16} /> Create Attribute
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search attributes..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-80"
            value={attrSearchText}
            onChange={(e) => setAttrSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          columns={columns}
          dataSource={filteredAttributes}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      {/* Creation/Edit Modal (No Mapping inside) */}
      <AntModal
        title={form.getFieldValue('id') ? "Edit Attribute Base" : "Create New Attribute"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <AntForm.Item name="id" hidden><AntInput /></AntForm.Item>
          <AntForm.Item name="name" label="Attribute Name" rules={[{ required: true }]}>
            <AntInput placeholder="e.g. Color, Size, RAM" />
          </AntForm.Item>
          <AntForm.Item name="type" label="Input Type" rules={[{ required: true }]}>
            <AntSelect>
              <AntSelect.Option value="select">Dropdown (Select)</AntSelect.Option>
              <AntSelect.Option value="boolean">Checkbox (Boolean)</AntSelect.Option>
              <AntSelect.Option value="string">Text Input (String)</AntSelect.Option>
              <AntSelect.Option value="number">Number Input</AntSelect.Option>
            </AntSelect>
          </AntForm.Item>
          <div className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
            <Lucide.Info size={14} className="inline mr-1" />
            You can map values to this attribute from the main list after saving.
          </div>
        </AntForm>
      </AntModal>

      {/* Massive Data Mapping Drawer */}
      <AntDrawer
        title={
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">Map Values to "{currentMappingAttr?.name}"</span>
            <span className="text-sm font-normal text-gray-500">Select which global values apply to this attribute.</span>
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
            placeholder="Search thousands of values..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            size="large"
            value={valSearchText}
            onChange={(e) => setValSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: currentMappingAttr?.valueIds || [],
            onChange: handleSaveMapping,
            preserveSelectedRowKeys: true, // Crucial for paginated row selection!
          }}
          columns={[{ title: 'Global Value', dataIndex: 'value', key: 'value' }]}
          dataSource={filteredValues}
          rowKey="id"
          pagination={{ pageSize: 15, showSizeChanger: false }}
          size="small"
        />
      </AntDrawer>
    </div>
  );
};

export default Attributes;
