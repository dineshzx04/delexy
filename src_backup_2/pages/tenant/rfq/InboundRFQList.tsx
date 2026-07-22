import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RFQ } from '../../../data/db';
import RFQTable from './components/RFQTable';

const InboundRFQList: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  // Find RFQs where the current workspace is targeted in an item or has submitted a quote
  const rfqs = useLiveQuery(async () => {
    const allRfqs = await db.rfqs.toArray();
    return allRfqs.filter(rfq => {
      const isTargeted = rfq.items.some(item => item.targetTenantId === activeWorkspace.id);
      const hasQuoted = rfq.quotes && rfq.quotes.some(q => q.responderTenantId === activeWorkspace.id);
      return isTargeted || hasQuoted;
    });
  }, [activeWorkspace.id]) || [];

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
