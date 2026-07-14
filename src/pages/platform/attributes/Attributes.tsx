import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Input as AntInput, Modal as AntModal, Form as AntForm, Select as AntSelect, Tag as AntTag, Drawer as AntDrawer } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

// Mock large global values
const generateMockValues = () => {
  const data = [];
  for (let i = 1; i <= 500; i++) {
    data.push({ id: String(i), value: `Value ${i}` });
  }
  return data;
};
const GLOBAL_VALUES = generateMockValues();

// Mock large attributes
const generateMockAttributes = () => {
  const data = [];
  const types = ['Dropdown', 'Radio', 'Checkbox', 'Text'];
  for (let i = 1; i <= 150; i++) {
    data.push({
      id: String(i),
      name: `Attribute ${i}`,
      type: types[i % 4],
      mappedValues: [String(i), String(i+1), String(i+2)] // Mock mapping
    });
  }
  return data;
};
const INITIAL_ATTRIBUTES = generateMockAttributes();

const Attributes: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [currentMappingAttr, setCurrentMappingAttr] = useState<any>(null);
  
  const [form] = AntForm.useForm();
  const [attributes, setAttributes] = useState(INITIAL_ATTRIBUTES);
  
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
  }, [valSearchText]);

  const columns = [
    { title: 'Attribute Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-gray-900">{text}</span> },
    { title: 'Input Type', dataIndex: 'type', key: 'type' },
    { 
      title: 'Mapped Values', 
      key: 'mappedValues', 
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <AntTag color="blue">{record.mappedValues.length} Values</AntTag>
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
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-gray-600 hover:text-sky-600" onClick={() => {
            form.setFieldsValue(record);
            setIsModalVisible(true);
          }}>
            Edit Base
          </AntButton>
        </div>
      ),
    },
  ];

  const handleSave = (formValues: any) => {
    if (formValues.id) {
      setAttributes(attributes.map(a => a.id === formValues.id ? { ...a, ...formValues } : a));
    } else {
      setAttributes([{ ...formValues, id: Math.random().toString(), mappedValues: [] }, ...attributes]);
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const openMappingDrawer = (attr: any) => {
    setCurrentMappingAttr(attr);
    setValSearchText('');
    setIsDrawerVisible(true);
  };

  const handleSaveMapping = (selectedRowKeys: React.Key[]) => {
    setAttributes(attributes.map(a => a.id === currentMappingAttr.id ? { ...a, mappedValues: selectedRowKeys as string[] } : a));
    setIsDrawerVisible(false);
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
              <AntSelect.Option value="Dropdown">Dropdown</AntSelect.Option>
              <AntSelect.Option value="Radio">Radio</AntSelect.Option>
              <AntSelect.Option value="Checkbox">Checkbox</AntSelect.Option>
              <AntSelect.Option value="Text">Text Input</AntSelect.Option>
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
            selectedRowKeys: currentMappingAttr?.mappedValues || [],
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
