import React from 'react';
import { Card, Button } from 'antd';
import * as Lucide from 'lucide-react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const BusinessProducts: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Business Products</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Products Catalog</h1>
          <p className="text-slate-500 text-sm">Manage products and inventory catalog listed under this business.</p>
        </div>
        <Button type="primary" icon={<Lucide.Plus size={16} />} className="bg-indigo-600 hover:bg-indigo-700">
          Add New Product
        </Button>
      </div>

      <Card className="shadow-sm p-12 flex flex-col items-center justify-center text-center border-dashed">
        <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3">
          <Lucide.Package size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Business Products Catalog</h3>
        <p className="text-slate-500 text-sm max-w-md mt-1">
          Catalog items and product specs for this business tenant workspace will appear here.
        </p>
      </Card>
    </div>
  );
};

export default BusinessProducts;
