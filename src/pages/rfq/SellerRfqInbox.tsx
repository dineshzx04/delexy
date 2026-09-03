import React, { useState, useMemo } from 'react';
import { Card, Table, Select, Input, Button, Tag as AntTag } from 'antd';
import { SearchOutlined, ArrowRightOutlined, ShoppingCartOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb } from '../../data/rfq';
import { businessDb } from '../../data/business/business.db';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const SellerRfqInbox: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/seller/rfqs' : '/user/seller/rfqs';

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const breadcrumbs = useMemo(
    () => [
      { title: <a onClick={() => navigate(isBusinessContext ? '/b/dashboard' : '/user/dashboard')}>Dashboard</a> },
      { title: <span className="text-slate-800 font-semibold">Seller RFQs</span> },
    ],
    [navigate, isBusinessContext]
  );
  useBreadcrumb(breadcrumbs);

  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const activeParty = useMemo(() => {
    if (parties.length === 0) return null;
    return isBusinessContext
      ? parties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace?.businessId) || parties[0]
      : parties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || parties.find((p) => p.id === 'pty-6') || parties[0];
  }, [parties, isBusinessContext, activeWorkspace?.businessId, currentUserId]);

  const activePartyId = activeParty?.id || '';

  const rfqs = useLiveQuery(() => rfqDb.rfqs.toArray(), []) || [];
  const items = useLiveQuery(() => rfqDb.rfq_items.toArray(), []) || [];
  const quotes = useLiveQuery(
    () => (activePartyId ? rfqDb.seller_quotes.where('seller_party_id').equals(activePartyId).toArray() : []),
    [activePartyId]
  ) || [];

  // Group items assigned to this seller by rfq_id
  const sellerRfqsSummary = useMemo(() => {
    if (!activePartyId) return [];

    const partiesMap = new Map(parties.map((p) => [p.id, p.display_name]));

    // Find all items assigned to active seller
    const assignedItems = items.filter((item) =>
      item.seller_assignments?.some((a) => a.seller_party_id === activePartyId)
    );

    // Group items by rfq_id
    const rfqGroups = new Map<string, typeof assignedItems>();
    for (const item of assignedItems) {
      const list = rfqGroups.get(item.rfq_id) || [];
      list.push(item);
      rfqGroups.set(item.rfq_id, list);
    }

    const summaryList = [];

    for (const [rfqId, rfqItems] of rfqGroups.entries()) {
      const rfq = rfqs.find((r) => r.id === rfqId);
      if (!rfq) continue;

      const requesterName = partiesMap.get(rfq.requester_id) || `Requester (${rfq.requester_id})`;

      let submittedCount = 0;
      let draftCount = 0;
      let notSubmittedCount = 0;
      let revisionRequiredCount = 0;
      let awardedCount = 0;

      for (const item of rfqItems) {
        const quote = quotes.find((q) => q.rfq_item_id === item.id);
        const status = quote?.status || 'NOT_SUBMITTED';

        if (status === 'SUBMITTED' || status === 'DEVIATION_ACCEPTED' || status === 'FINAL_ACKNOWLEDGE') {
          submittedCount++;
        } else if (status === 'DRAFT') {
          draftCount++;
        } else if (status === 'REVISION_REQUIRED' || status === 'PRODUCT_SUBMIT_REVISION') {
          revisionRequiredCount++;
        } else {
          notSubmittedCount++;
        }

        if (item.status === 'AWARDED') {
          awardedCount++;
        }
      }

      summaryList.push({
        key: rfq.id,
        rfq_id: rfq.id,
        rfq_number: rfq.rfq_number || 'N/A',
        title: rfq.title || 'Untitled RFQ Sourcing Container',
        requester_name: requesterName,
        rfq_status: rfq.status || 'PUBLISHED',
        assigned_items_count: rfqItems.length,
        submitted_count: submittedCount,
        draft_count: draftCount,
        not_submitted_count: notSubmittedCount,
        revision_required_count: revisionRequiredCount,
        awarded_count: awardedCount,
        target_date: rfq.submission_deadline || rfq.created_at,
        created_at: rfq.created_at,
      });
    }

    return summaryList;
  }, [items, rfqs, quotes, parties, activePartyId]);

  const filteredRfqs = useMemo(() => {
    return sellerRfqsSummary.filter((item) => {
      let matchesStatus = true;
      if (selectedStatus === 'SUBMITTED') {
        matchesStatus = item.submitted_count > 0;
      } else if (selectedStatus === 'NOT_SUBMITTED') {
        matchesStatus = item.not_submitted_count > 0;
      } else if (selectedStatus === 'DRAFT') {
        matchesStatus = item.draft_count > 0;
      } else if (selectedStatus === 'REVISION_REQUIRED') {
        matchesStatus = item.revision_required_count > 0;
      }

      const query = searchText.toLowerCase();
      const matchesSearch =
        item.rfq_number.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.requester_name.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [sellerRfqsSummary, selectedStatus, searchText]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-indigo-600 text-lg" />
            <h1 className="text-lg font-bold text-slate-900 m-0">Seller RFQ Inbox</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Overview of RFQ sourcing invitations assigned to <strong className="text-slate-700">{activeParty?.display_name || 'your party'}</strong>. Select an RFQ to view line item details and submit proposals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AntTag color="blue" className="font-mono font-bold text-xs px-2.5 py-0.5">
            {sellerRfqsSummary.length} Assigned RFQs
          </AntTag>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card className="shadow-sm border-slate-200 bg-white" bodyStyle={{ padding: '16px' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filter RFQs:</span>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              size="small"
              className="w-48"
              options={[
                { value: 'ALL', label: `All RFQs (${sellerRfqsSummary.length})` },
                { value: 'NOT_SUBMITTED', label: 'Has Unsubmitted Items' },
                { value: 'DRAFT', label: 'Has Draft Proposals' },
                { value: 'SUBMITTED', label: 'Has Submitted Proposals' },
                { value: 'REVISION_REQUIRED', label: 'Has Revision Required' },
              ]}
            />
          </div>

          <Input
            placeholder="Search RFQ #, Title, or Requester..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-72"
            size="small"
            allowClear
          />
        </div>

        <Table
          dataSource={filteredRfqs}
          rowKey="key"
          size="small"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            size: 'small',
            showSizeChanger: true,
          }}
          columns={[
            {
              title: 'S.No',
              key: 'sno',
              width: 65,
              align: 'center',
              render: (_: any, __: any, index: number) => (
                <span className="font-mono text-xs text-slate-500 font-medium">
                  {(currentPage - 1) * pageSize + index + 1}
                </span>
              ),
            },
            {
              title: 'RFQ Container Details',
              key: 'rfq_details',
              render: (_: any, record: any) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {record.rfq_number}
                    </span>
                    <AntTag color={record.rfq_status === 'AWARDED' ? 'emerald' : 'blue'} className="text-[10px] font-semibold m-0">
                      {record.rfq_status}
                    </AntTag>
                  </div>
                  <div className="font-bold text-slate-900 text-xs truncate max-w-md" title={record.title}>
                    {record.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShopOutlined className="text-slate-400" />
                    <span>Buyer: <strong className="text-slate-700">{record.requester_name}</strong></span>
                  </div>
                </div>
              ),
            },
            {
              title: 'Assigned Items',
              key: 'assigned_items',
              width: 140,
              align: 'center',
              render: (_: any, record: any) => (
                <AntTag color="purple" className="font-bold text-xs px-2 py-0.5 m-0">
                  {record.assigned_items_count} Line Item(s)
                </AntTag>
              ),
            },
            {
              title: 'Proposal Progress',
              key: 'progress',
              width: 220,
              render: (_: any, record: any) => (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Proposals:</span>
                    <strong className="text-slate-800">
                      {record.submitted_count} / {record.assigned_items_count} Submitted
                    </strong>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {record.submitted_count > 0 && (
                      <AntTag color="blue" className="text-[10px] m-0 font-medium">
                        ✓ {record.submitted_count} Submitted
                      </AntTag>
                    )}
                    {record.draft_count > 0 && (
                      <AntTag color="amber" className="text-[10px] m-0 font-medium">
                        ✎ {record.draft_count} Draft
                      </AntTag>
                    )}
                    {record.revision_required_count > 0 && (
                      <AntTag color="red" className="text-[10px] m-0 font-medium">
                        ⚠ {record.revision_required_count} Revision
                      </AntTag>
                    )}
                    {record.not_submitted_count > 0 && (
                      <AntTag color="default" className="text-[10px] m-0 text-slate-500 font-medium">
                        {record.not_submitted_count} Pending
                      </AntTag>
                    )}
                  </div>
                </div>
              ),
            },
            {
              title: 'Target Date',
              key: 'target_date',
              width: 130,
              render: (_: any, record: any) => (
                <span className="text-xs font-mono font-medium text-slate-700">
                  {record.target_date ? new Date(record.target_date).toLocaleDateString() : 'N/A'}
                </span>
              ),
            },
            {
              title: 'Action',
              key: 'action',
              width: 160,
              align: 'right',
              render: (_: any, record: any) => (
                <Button
                  type="primary"
                  size="small"
                  className="bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs flex items-center gap-1.5 ml-auto"
                  onClick={() => navigate(`${basePath}/${record.rfq_id}`)}
                  icon={<ArrowRightOutlined />}
                >
                  Open RFQ Workspace
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export const SupplierRfqInbox = SellerRfqInbox;
