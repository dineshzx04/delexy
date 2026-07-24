import React from 'react';
import { Card, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessRFQs: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">RFQs & Procurement</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RFQs & Quotation Management</h1>
          <p className="text-slate-500 text-sm">Create and review Requests for Quotation (RFQs) for your business.</p>
        </div>
        <Button type="primary" icon={<Lucide.Plus size={16} />} className="bg-indigo-600 hover:bg-indigo-700">
          Create New RFQ
        </Button>
      </div>

      <Card className="shadow-sm p-12 flex flex-col items-center justify-center text-center border-dashed">
        <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3">
          <Lucide.FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Business Procurement Module</h3>
        <p className="text-slate-500 text-sm max-w-md mt-1">
          RFQs and quotation responses for this business workspace will appear here.
        </p>
      </Card>
    </div>
  );
};

export default BusinessRFQs;
