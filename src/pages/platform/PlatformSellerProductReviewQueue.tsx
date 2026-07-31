import React, { useState, useMemo } from 'react';
import { Table as AntTable, Button as AntButton, Tag as AntTag, Input as AntInput, Tabs as AntTabs, Card as AntCard, Progress as AntProgress } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type SellerProductSubmission, type SubmissionAttributeItem } from '../../data/catalog';
import { businessDb, type Party } from '../../data/business';

const PlatformSellerProductReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600">Platform Admin</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Catalog Governance</span> },
    { title: <span className="text-gray-900 font-semibold">Seller Product Reviews</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // Live Query Dexie DB
  const submissions = useLiveQuery(() => catalogDb.sellerProductSubmissions.toArray()) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];

  // Enriched queue records
  const enrichedSubmissions = useMemo(() => {
    return submissions.map((sub: SellerProductSubmission) => {
      const pty = parties.find((p: Party) => p.id === sub.party_id);
      const titleAttr = sub.attributes?.product_name?.value || 'Untitled Seller Product';
      
      const attrList = Object.values(sub.attributes || {});
      const totalAttrs = attrList.length;
      const approvedAttrs = attrList.filter((a: SubmissionAttributeItem) => a.status === 'APPROVED').length;
      const rejectedAttrs = attrList.filter((a: SubmissionAttributeItem) => a.status === 'REJECTED').length;
      const percentApproved = totalAttrs > 0 ? Math.round((approvedAttrs / totalAttrs) * 100) : 0;

      return {
        ...sub,
        product_title: titleAttr,
        seller_party_name: pty?.display_name || sub.party_id,
        seller_owner_type: pty?.owner_type || 'UNKNOWN',
        totalAttrs,
        approvedAttrs,
        rejectedAttrs,
        percentApproved
      };
    }).filter(s =>
      s.product_title.toLowerCase().includes(searchText.toLowerCase()) ||
      s.id.toLowerCase().includes(searchText.toLowerCase()) ||
      s.seller_party_name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [submissions, parties, searchText]);

  const queueActionNeeded = useMemo(() => enrichedSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW'), [enrichedSubmissions]);
  const queueNeedsRevision = useMemo(() => enrichedSubmissions.filter(s => s.status === 'NEEDS_REVISION'), [enrichedSubmissions]);
  const queueEligiblePublish = useMemo(() => enrichedSubmissions.filter(s => s.status === 'APPROVED'), [enrichedSubmissions]);
  const queuePublished = useMemo(() => enrichedSubmissions.filter(s => s.status === 'PUBLISHED'), [enrichedSubmissions]);

  const columns = [
    {
      title: 'Submission ID & Product Title',
      key: 'title',
      render: (_: any, record: any) => (
        <div>
          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
            {record.product_title}
            <span className="font-mono text-xs text-sky-600 font-normal">({record.id})</span>
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Seller Party: <strong className="text-gray-800">{record.seller_party_name}</strong> ({record.seller_owner_type}) • Round: {record.current_round}
          </div>
        </div>
      )
    },
    {
      title: 'Attribute Approval Progress',
      key: 'progress',
      width: 220,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-700">{record.approvedAttrs} / {record.totalAttrs} Approved</span>
            <span className={record.percentApproved === 100 ? 'text-emerald-600' : 'text-sky-600'}>{record.percentApproved}%</span>
          </div>
          <AntProgress percent={record.percentApproved} size="small" showInfo={false} strokeColor={record.percentApproved === 100 ? '#10b981' : '#0284c7'} />
          {record.rejectedAttrs > 0 && (
            <div className="text-[11px] text-red-600 font-medium">{record.rejectedAttrs} attributes rejected</div>
          )}
        </div>
      )
    },
    {
      title: 'Review Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => {
        if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') return <AntTag color="processing" className="text-xs font-semibold">ACTION NEEDED</AntTag>;
        if (status === 'NEEDS_REVISION') return <AntTag color="error" className="text-xs font-semibold">NEEDS REVISION</AntTag>;
        if (status === 'APPROVED') return <AntTag color="success" className="text-xs font-semibold">READY TO PUBLISH</AntTag>;
        if (status === 'PUBLISHED') return <AntTag color="cyan" className="text-xs font-semibold">PUBLISHED</AntTag>;
        return <AntTag color="default" className="text-xs font-semibold">DRAFT</AntTag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: any, record: any) => (
        <AntButton
          type="primary"
          size="small"
          className="bg-sky-600 hover:bg-sky-700 font-medium"
          icon={<Lucide.ShieldCheck size={14} />}
          onClick={() => navigate(`/p/seller-product-reviews/${record.id}`)}
        >
          Review Attributes
        </AntButton>
      )
    }
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Seller Product Review Queue</h1>
          <p className="text-gray-500 text-sm">
            Platform governance review workbench: audit granular attributes, approve or reject fields with feedback, and publish approved seller products.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <AntCard className="border border-sky-200 bg-sky-50/50 shadow-sm">
          <div className="text-xs text-sky-700 font-semibold uppercase">Pending Platform Action</div>
          <div className="text-2xl font-bold text-sky-900 mt-1">{queueActionNeeded.length}</div>
        </AntCard>
        <AntCard className="border border-red-200 bg-red-50/50 shadow-sm">
          <div className="text-xs text-red-700 font-semibold uppercase">Awaiting Seller Revision</div>
          <div className="text-2xl font-bold text-red-900 mt-1">{queueNeedsRevision.length}</div>
        </AntCard>
        <AntCard className="border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <div className="text-xs text-emerald-700 font-semibold uppercase">100% Approved (Ready to Publish)</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{queueEligiblePublish.length}</div>
        </AntCard>
        <AntCard className="border border-gray-200 bg-gray-50/50 shadow-sm">
          <div className="text-xs text-gray-600 font-semibold uppercase">Published Products</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{queuePublished.length}</div>
        </AntCard>
      </div>

      {/* Main Queue Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <AntInput
            placeholder="Search reviews by title, submission ID, or seller party..."
            prefix={<Lucide.Search size={16} className="text-gray-400" />}
            className="w-full sm:w-80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <AntTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-4"
          items={[
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.Clock size={16} /> Action Needed ({queueActionNeeded.length})
                </span>
              ),
              children: <AntTable size="small" columns={columns} dataSource={queueActionNeeded} rowKey="id" scroll={{ x: 'max-content' }} pagination={{ pageSize: 10 }} />
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.RotateCcw size={16} /> Sent for Revision ({queueNeedsRevision.length})
                </span>
              ),
              children: <AntTable size="small" columns={columns} dataSource={queueNeedsRevision} rowKey="id" scroll={{ x: 'max-content' }} pagination={{ pageSize: 10 }} />
            },
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.CheckCircle2 size={16} /> Ready to Publish ({queueEligiblePublish.length})
                </span>
              ),
              children: <AntTable size="small" columns={columns} dataSource={queueEligiblePublish} rowKey="id" scroll={{ x: 'max-content' }} pagination={{ pageSize: 10 }} />
            },
            {
              key: '4',
              label: (
                <span className="flex items-center gap-2">
                  <Lucide.PackageCheck size={16} /> Published Catalog ({queuePublished.length})
                </span>
              ),
              children: <AntTable size="small" columns={columns} dataSource={queuePublished} rowKey="id" scroll={{ x: 'max-content' }} pagination={{ pageSize: 10 }} />
            }
          ]}
        />
      </div>
    </div>
  );
};

export default PlatformSellerProductReviewQueue;
