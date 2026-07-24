import React from 'react';
import { Card, Input, Button, Form } from 'antd';
import * as Lucide from 'lucide-react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const CreateBusiness: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Create Business</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Business Workspace</h1>
        <p className="text-slate-500 text-sm">Register a new enterprise tenant workspace to manage team procurement and RFQs.</p>
      </div>

      <Card className="shadow-sm">
        <Form layout="vertical" className="space-y-4">
          <Form.Item label="Business Name" required>
            <Input size="large" placeholder="e.g. Acme Corporation" prefix={<Lucide.Building size={16} className="text-slate-400" />} />
          </Form.Item>

          <Form.Item label="Legal Name">
            <Input size="large" placeholder="e.g. Acme Corp LLC" />
          </Form.Item>

          <Form.Item label="Website">
            <Input size="large" placeholder="https://www.acme.com" prefix={<Lucide.Globe size={16} className="text-slate-400" />} />
          </Form.Item>

          <Form.Item label="Country Code">
            <Input size="large" placeholder="e.g. US or IN" />
          </Form.Item>

          <div className="pt-4">
            <Button type="primary" size="large" className="w-full bg-sky-600 hover:bg-sky-700" icon={<Lucide.PlusCircle size={18} />}>
              Create Business Workspace
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateBusiness;
