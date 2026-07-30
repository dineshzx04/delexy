import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Tag } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb } from '../../data/user';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessSettings: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();
  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id;

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Business Settings</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const business = useLiveQuery(
    async () => await userDb.businesses.get(currentBizId),
    [currentBizId]
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Profile & Settings</h1>
        <p className="text-slate-500 text-sm">Update company legal entity details and operational attributes.</p>
      </div>

      <Card className="shadow-sm">
        <Form layout="vertical" className="space-y-4">
          <Form.Item label="Business Name">
            <Input size="large" defaultValue={business?.name} prefix={<Lucide.Building size={16} className="text-slate-400" />} />
          </Form.Item>

          <Form.Item label="Legal Name">
            <Input size="large" defaultValue={business?.legal_name} />
          </Form.Item>

          <Form.Item label="Website">
            <Input size="large" defaultValue={business?.website} prefix={<Lucide.Globe size={16} className="text-slate-400" />} />
          </Form.Item>

          <Form.Item label="Phone">
            <Input size="large" defaultValue={business?.phone} prefix={<Lucide.Phone size={16} className="text-slate-400" />} />
          </Form.Item>

          <Form.Item label="Country Code">
            <Input size="large" defaultValue={business?.country_code} />
          </Form.Item>

          <div className="flex items-center gap-4 py-2">
            <Tag color={business?.is_active ? 'green' : 'red'}>
              STATUS: {business?.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Tag>
            <Tag color={business?.is_claimed ? 'blue' : 'orange'}>
              {business?.is_claimed ? 'VERIFIED & CLAIMED' : 'UNCLAIMED'}
            </Tag>
          </div>

          <div className="pt-2">
            <Button type="primary" size="large" className="bg-indigo-600 hover:bg-indigo-700 font-medium">
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default BusinessSettings;
