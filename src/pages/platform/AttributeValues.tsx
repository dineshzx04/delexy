import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Input as AntInput, Modal as AntModal, Form as AntForm } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type AttributeValue } from '../../data/catalog';

const AttributeValues: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = AntForm.useForm();

  // Use DB data from catalogDb
  const values = useLiveQuery(() => catalogDb.attributeValues.toArray()) || [];
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Taxonomies</span> },
    { title: <span className="text-gray-900 font-semibold">Attribute Values</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const filteredValues = useMemo(() => {
    return values.filter(v =>
      v.value.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [values, searchText]);

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
    { title: 'Value', dataIndex: 'value', key: 'value', render: (text: string) => <span className="font-semibold text-gray-900">{text}</span> },
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
          <AntButton type="text" danger size="small" onClick={async () => {
            await catalogDb.attributeValues.delete(record.id);
          }}>Delete</AntButton>
        </div>
      ),
    },
  ];

  const handleSave = async (formValues: any) => {
    if (formValues.id) {
      await catalogDb.attributeValues.update(formValues.id, formValues);
    } else {
      const newValue: AttributeValue = {
        ...formValues,
        id: `val-${Date.now()}`
      };
      await catalogDb.attributeValues.add(newValue);
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
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
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
        </AntForm>
      </AntModal>
    </div>
  );
};

export default AttributeValues;
