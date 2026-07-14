import React from 'react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const Dashboard: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
     { title: <Link to="/dashboard" className="text-gray-900 font-semibold cursor-default pointer-events-none">Dashboard</Link> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-500">Welcome to your dashboard overview.</p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 flex items-center justify-center min-h-[400px]">
        <span className="text-xl text-gray-400 font-medium">Dashboard Content Goes Here</span>
      </div>
    </div>
  );
};

export default Dashboard;
