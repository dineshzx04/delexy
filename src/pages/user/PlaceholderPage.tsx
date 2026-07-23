import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

const PlaceholderPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const title = path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Page';
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);

  const breadcrumbs = React.useMemo(() => {

    return [
      { title: <span className="text-gray-900 font-semibold">{displayTitle}</span> }
    ];
  }, [path, displayTitle]);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayTitle}</h1>
        <p className="text-gray-500">This section is currently under development.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{displayTitle} Coming Soon</h2>
        <p className="text-gray-500 text-center max-w-md">
          We're working hard to bring you this feature. Check back soon for updates to the {displayTitle} module.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
