import React, { useState } from 'react';
import { Tabs, Card, Form, Input, Select, Button, Upload, DatePicker, Table, Tag } from 'antd';
import { UploadCloud, Search, FileText, Send, Building2 } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

const RfqManagement = () => {
  const [formType1] = Form.useForm();
  const [formType2] = Form.useForm();
  const [formType3] = Form.useForm();

  const rfqData = [
    { key: '1', id: 'RFQ-2026-001', type: 'Exact Product', status: 'Open', responses: 3, date: '2026-07-10' },
    { key: '2', id: 'RFQ-2026-002', type: 'Open RFQ', status: 'Closed', responses: 12, date: '2026-07-08' },
    { key: '3', id: 'RFQ-2026-003', type: 'Search RFQ', status: 'Awarded', responses: 5, date: '2026-07-05' },
  ];

  const columns = [
    { title: 'RFQ ID', dataIndex: 'id', key: 'id', render: (text: string) => <a className="font-semibold text-primary-600">{text}</a> },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Date Submitted', dataIndex: 'date', key: 'date' },
    { title: 'Responses', dataIndex: 'responses', key: 'responses' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Open' ? 'green' : status === 'Awarded' ? 'blue' : 'default'}>
          {status}
        </Tag>
      )
    },
    { title: 'Action', key: 'action', render: () => <Button size="small">View Quotes</Button> }
  ];

  const rfqCreationItems = [
    {
      key: '1',
      label: 'Type 1: Exact Product RFQ',
      children: (
        <div className="max-w-3xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Request Quote by Platform Product Number</h3>
          <Form form={formType1} layout="vertical">
            <Form.Item label="Platform Product Number" name="productNumber" rules={[{ required: true }]}>
              <Input placeholder="e.g., PL-9834-VLV" prefix={<Search className="text-gray-400 w-4 h-4" />} size="large" />
            </Form.Item>
            <Form.Item label="Quantity Required" name="quantity">
              <Input type="number" size="large" />
            </Form.Item>
            <Form.Item label="Target Price (Optional)" name="targetPrice">
              <Input prefix="$" size="large" />
            </Form.Item>
            <Form.Item label="Delivery Deadline" name="deadline">
              <DatePicker size="large" className="w-full" />
            </Form.Item>
            <Button type="primary" size="large" icon={<Send className="w-4 h-4" />}>Submit RFQ</Button>
          </Form>
        </div>
      )
    },
    {
      key: '2',
      label: 'Type 2: Search RFQ',
      children: (
        <div className="max-w-3xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Request Quote by Searching Attributes</h3>
          <Form form={formType2} layout="vertical">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Category" name="category">
                <Select size="large" placeholder="Select Category">
                  <Option value="valves">Valves</Option>
                  <Option value="pumps">Pumps</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Brand Preference" name="brand">
                <Input size="large" placeholder="Any" />
              </Form.Item>
              <Form.Item label="Manufacturer Country" name="country">
                <Select size="large" placeholder="Any">
                  <Option value="us">United States</Option>
                  <Option value="de">Germany</Option>
                  <Option value="cn">China</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Quantity" name="quantity">
                <Input type="number" size="large" />
              </Form.Item>
            </div>
            <Form.Item label="Specific Attributes (e.g., Material, Pressure Rating)" name="attributes">
              <Select mode="tags" size="large" placeholder="Add required attributes..." />
            </Form.Item>
            <Button type="primary" size="large" icon={<Send className="w-4 h-4" />}>Submit Search RFQ</Button>
          </Form>
        </div>
      )
    },
    {
      key: '3',
      label: 'Type 3: Open RFQ',
      children: (
        <div className="max-w-3xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Describe Your Custom Requirements</h3>
          <Form form={formType3} layout="vertical">
            <Form.Item label="RFQ Title" name="title" rules={[{ required: true }]}>
              <Input size="large" placeholder="e.g., Custom Centrifugal Pump Assembly" />
            </Form.Item>
            <Form.Item label="Detailed Requirements" name="description" rules={[{ required: true }]}>
              <TextArea rows={6} placeholder="Describe your specifications, materials, usage environment..." />
            </Form.Item>
            <Form.Item label="Attachments (Drawings, Specs)">
              <Upload.Dragger multiple>
                <p className="ant-upload-drag-icon flex justify-center mb-2">
                  <UploadCloud className="text-primary-500 w-10 h-10" />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
              </Upload.Dragger>
            </Form.Item>
            <Button type="primary" size="large" icon={<Send className="w-4 h-4" />}>Submit Open RFQ</Button>
          </Form>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RFQ & Quotes</h2>
          <p className="text-gray-500">Manage your requests for quotation and supplier responses.</p>
        </div>
      </div>

      <Card title={<span className="flex items-center gap-2"><FileText size={18} /> Create New RFQ</span>} className="shadow-sm">
        <Tabs items={rfqCreationItems} />
      </Card>

      <Card title={<span className="flex items-center gap-2"><Building2 size={18} /> My RFQs</span>} className="shadow-sm">
        <Table columns={columns} dataSource={rfqData} />
      </Card>
    </div>
  );
};
export default RfqManagement;
