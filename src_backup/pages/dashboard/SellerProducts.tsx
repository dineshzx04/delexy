import React, { useState } from 'react';
import { Table, Button, Tag, Drawer, Form, Input, Select, InputNumber, Switch, Steps } from 'antd';
import { Plus, Settings2, Package, History } from 'lucide-react';

const { Option } = Select;

const SellerProducts = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const columns = [
    { title: 'Product ID', dataIndex: 'id', key: 'id', render: (text: string) => <a className="font-medium text-primary-600">{text}</a> },
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    { title: 'Platform Master Ref', dataIndex: 'master', key: 'master' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'Published' ? 'green' : s === 'In Review' ? 'orange' : 'default'}>{s}</Tag>
    )},
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    { title: 'Action', key: 'action', render: () => (
      <div className="flex gap-2">
        <Button size="small" type="text" icon={<Settings2 size={16} />} />
        <Button size="small" type="text" icon={<History size={16} />} />
      </div>
    )}
  ];
  
  const data = [
    { key: '1', id: 'SEL-001', name: 'Industrial Valve A4 (Brass)', master: 'PL-9834-VLV', status: 'Published', stock: 150, price: '$450.00' },
    { key: '2', id: 'SEL-002', name: 'High Pressure Pump X1', master: 'PL-2234-PMP', status: 'In Review', stock: 45, price: '$1,200.00' },
    { key: '3', id: 'SEL-003', name: 'Standard Flange 4"', master: 'PL-5511-FLG', status: 'Draft', stock: 500, price: '$25.00' },
  ];

  const steps = [
    { title: 'Platform Master', description: 'Select base product' },
    { title: 'Variants', description: 'Define seller attributes' },
    { title: 'Pricing & Stock', description: 'Set inventory' },
    { title: 'Review', description: 'Submit for approval' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seller Products</h2>
          <p className="text-gray-500">Manage your product catalog, variants, pricing, and submission workflows.</p>
        </div>
        <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => setOpen(true)}>
          Create Product
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </div>

      <Drawer 
        title={<span className="flex items-center gap-2"><Package size={20} /> Create Seller Product</span>}
        width={720} 
        onClose={() => setOpen(false)} 
        open={open}
        extra={
          <div className="space-x-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" onClick={() => {
                form.submit();
                setOpen(false);
                setCurrentStep(0);
              }}>Submit for Approval</Button>
            )}
          </div>
        }
      >
        <div className="mb-8">
          <Steps current={currentStep} items={steps} size="small" />
        </div>

        <Form form={form} layout="vertical" className="mt-8">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Select Platform Master Product</h3>
              <p className="text-gray-500 mb-4">Link your product to a standardized platform master to inherit categories and base attributes.</p>
              <Form.Item label="Platform Master Ref Number" name="masterRef" rules={[{ required: true }]}>
                <Select showSearch placeholder="Search by name or PL- number" size="large">
                  <Option value="PL-9834-VLV">PL-9834-VLV - Industrial Butterfly Valve</Option>
                  <Option value="PL-2234-PMP">PL-2234-PMP - Centrifugal Pump</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Your Custom Product Title" name="title">
                <Input size="large" placeholder="e.g., Acme Industrial Butterfly Valve (Stainless Steel)" />
              </Form.Item>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Define Seller Variants</h3>
              <Form.Item label="Manufacturer Part Number (MPN)" name="mpn">
                <Input size="large" />
              </Form.Item>
              <Form.Item label="Material" name="material">
                <Select size="large">
                  <Option value="ss">Stainless Steel</Option>
                  <Option value="br">Brass</Option>
                  <Option value="pv">PVC</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Pressure Rating" name="pressure">
                <Input size="large" />
              </Form.Item>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Pricing & Stock Management</h3>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Base Price (USD)" name="price" rules={[{ required: true }]}>
                  <InputNumber size="large" className="w-full" prefix="$" />
                </Form.Item>
                <Form.Item label="Current Stock Level" name="stock" rules={[{ required: true }]}>
                  <InputNumber size="large" className="w-full" />
                </Form.Item>
                <Form.Item label="Minimum Order Quantity (MOQ)" name="moq">
                  <InputNumber size="large" className="w-full" />
                </Form.Item>
                <Form.Item label="Lead Time (Days)" name="leadTime">
                  <InputNumber size="large" className="w-full" />
                </Form.Item>
              </div>
              <Form.Item label="Enable Milestone Payments" name="milestones" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Review & Submit</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600">Your product will enter the following workflow:</p>
                <div className="flex items-center gap-2 mt-3 text-sm font-medium">
                  <Tag color="default">Draft</Tag> &rarr; <Tag color="orange">In Review</Tag> &rarr; <Tag color="green">Approved & Published</Tag>
                </div>
                <p className="text-xs text-gray-400 mt-4">Platform admins will review your product against the master PIM before it appears in the marketplace.</p>
              </div>
            </div>
          )}
        </Form>
      </Drawer>
    </div>
  );
};
export default SellerProducts;
