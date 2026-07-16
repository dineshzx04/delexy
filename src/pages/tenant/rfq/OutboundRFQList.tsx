import React, { useState, useEffect, useMemo } from 'react';
import { Button as AntButton } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { getRFQsByRequester, type RFQ } from '../../../data/mockRFQs';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import RFQTable from './components/RFQTable';

const OutboundRFQList: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  useEffect(() => {
    setRfqs(getRFQsByRequester(activeWorkspace.id));
  }, [activeWorkspace.id]);

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <span className="text-gray-900 font-semibold">My RFQs</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My RFQs</h1>
          <p className="text-gray-500">
            Requests for quotations you have sent to other sellers.
          </p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={() => navigate('/rfqs/new')}>
          <Lucide.Plus size={16} /> Create New RFQ
        </AntButton>
      </div>

      <RFQTable rfqs={rfqs} isOutbound={true} />
    </div>
  );
};

export default OutboundRFQList;
