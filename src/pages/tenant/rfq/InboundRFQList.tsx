import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { getRFQsReceived, type RFQ } from '../../../data/mockRFQs';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import RFQTable from './components/RFQTable';

const InboundRFQList: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  useEffect(() => {
    setRfqs(getRFQsReceived(activeWorkspace.id));
  }, [activeWorkspace.id]);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <span className="text-gray-900 font-semibold">Received RFQs</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Received RFQs</h1>
        <p className="text-gray-500">
          Requests for quotations you have received from buyers.
        </p>
      </div>

      <RFQTable rfqs={rfqs} isOutbound={false} />
    </div>
  );
};

export default InboundRFQList;
