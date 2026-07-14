import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Input as AntInput, Modal as AntModal, Form as AntForm } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';

// Generate large dataset for prototype
const generateMockValues = () => {
  const data = [];
  const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Purple', 'Orange'];
  const materials = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim', 'Nylon'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const weights = ['100g', '250g', '500g', '1kg', '5kg'];
  
  let idCounter = 1;
  [...colors, ...materials, ...sizes, ...weights].forEach((val, idx) => {
    data.push({
      id: String(idCounter++),
      value: val,
      label: `${val} (Auto-generated)`,
      code: `VAL_${val.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
    });
  });

  // Add bulk generic values to hit 200+
  for (let i = 1; i <= 200; i++) {
    data.push({
      id: String(idCounter++),
      value: `Generic Option ${i}`,
      label: `Generic Option ${i} (Bulk)`,
      code: `VAL_GENERIC_${i}`
    });
  }
  return data;
};

const INITIAL_DATA = generateMockValues();

const AttributeValues: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = AntForm.useForm();
  const [values, setValues] = useState(INITIAL_DATA);
  const [searchText, setSearchText] = useState('');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/platform" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/platform' },
    { title: <span className="text-gray-500">Taxonomies</span> },
    { title: <span className="text-gray-900 font-semibold">Attribute Values</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredValues = useMemo(() => {
    return values.filter(v => 
      v.value.toLowerCase().includes(searchText.toLowerCase()) || 
      v.label.toLowerCase().includes(searchText.toLowerCase()) ||
      v.code.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [values, searchText]);

  const columns = [
    { title: 'Value', dataIndex: 'value', key: 'value', render: (text: string) => <span className="font-semibold text-gray-900">{text}</span> },
    { title: 'Display Label', dataIndex: 'label', key: 'label' },
    { title: 'System Code', dataIndex: 'code', key: 'code', render: (text: string) => <span className="font-mono text-xs text-gray-500">{text}</span> },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <AntButton type="text" size="small" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => {
            form.setFieldsValue(record);
            setIsModalVisible(true);
          }}>
            Edit
          </AntButton>
          <AntButton type="text" danger size="small">Delete</AntButton>
        </div>
      ),
    },
  ];

  const handleSave = (formValues: any) => {
    if (formValues.id) {
      setValues(values.map(v => v.id === formValues.id ? { ...v, ...formValues } : v));
    } else {
      setValues([{ ...formValues, id: Math.random().toString(), code: `VAL_${formValues.value.toUpperCase().replace(/[^A-Z0-9]/g, '_')}` }, ...values]);
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Attribute Values ({values.length})</h1>
          <p className="text-gray-500">The lowest-level master list of all distinct product variations.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => { form.resetFields(); setIsModalVisible(true); }}>
          <Lucide.Plus size={16} /> Create Value
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput 
            placeholder="Search thousands of values..." 
            prefix={<Lucide.Search size={16} className="text-gray-400" />} 
            className="w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <AntTable 
          columns={columns} 
          dataSource={filteredValues} 
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </div>

      <AntModal
        title={form.getFieldValue('id') ? "Edit Value" : "Create New Value"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okButtonProps={{ className: "bg-sky-600" }}
        destroyOnClose
      >
        <AntForm form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <AntForm.Item name="id" hidden><AntInput /></AntForm.Item>
          <AntForm.Item name="value" label="Value" rules={[{ required: true }]}>
            <AntInput placeholder="e.g. Red, 8GB, Cotton" />
          </AntForm.Item>
          <AntForm.Item name="label" label="Display Label" rules={[{ required: true }]}>
            <AntInput placeholder="e.g. Red (Color)" />
          </AntForm.Item>
        </AntForm>
      </AntModal>
    </div>
  );
};

export default AttributeValues;
