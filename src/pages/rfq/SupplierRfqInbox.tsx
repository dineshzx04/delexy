import React, { useState } from 'react';
import { Card, Table, Button, Tag, Tabs, Input } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, SendOutlined, BankOutlined, UserOutlined } from '@ant-design/icons';
import { rfqDb, type ItemSupplierResponseStatus } from '../../data/rfq';
import { mockParties } from '../../data/business/parties';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { ItemSupplierStatusBadge } from '../../components/rfq/RfqStatusBadge';

export const SupplierRfqInbox: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, currentUserId } = useWorkspace();
  const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
  const basePath = isBusinessContext ? '/b/supplier' : '/user/supplier';

  // Active seller party resolution
  const activeParty = isBusinessContext
    ? mockParties.find((p) => p.owner_type === 'BUSINESS' && p.owner_id === activeWorkspace.businessId) || mockParties[0]
    : mockParties.find((p) => p.owner_type === 'USER' && p.owner_id === currentUserId) || mockParties.find((p) => p.id === 'pty-6') || mockParties[0];

  const activePartyId = activeParty.id;

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  // Live Query filtered by seller party ID
  const sellerResponses = useLiveQuery(
    () => rfqDb.itemSupplierResponses.where('seller_party_id').equals(activePartyId).toArray(),
    [activePartyId]
  ) || [];

  const items = useLiveQuery(() => rfqDb.rfqItems.toArray(), []) || [];
  const rfqs = useLiveQuery(() => rfqDb.rfqs.toArray(), []) || [];

  // Also check for open RFQs where no explicit ItemSupplierResponse record exists yet for activePartyId
  const openMarketplaceItems = items.filter((item) => {
    const rfq = rfqs.find((r) => r.id === item.rfq_id);
    if (!rfq || rfq.status === 'DRAFT' || rfq.status === 'CANCELLED') return false;
    // Exclude if buyer party is current active party
    if (rfq.requester_party_id === activePartyId) return false;

    const isOpenForMarketplace = !item.target_seller_party_ids || item.target_seller_party_ids.length === 0 || item.target_seller_party_ids.includes(activePartyId);
    const alreadyHasResponse = sellerResponses.some((resp) => resp.rfq_item_id === item.id);

    return isOpenForMarketplace && !alreadyHasResponse;
  });

  // Synthesize virtual response records for open marketplace items
  const virtualResponses = openMarketplaceItems.map((item) => {
    return {
      id: `isr-open-${item.id}-${activePartyId}`,
      assignment_id: `sa-open-${item.id}-${activePartyId}`,
      rfq_id: item.rfq_id,
      rfq_item_id: item.id,
      seller_party_id: activePartyId,
      seller_party_name: activeParty.display_name,
      supplier_user_id: currentUserId || 'usr-3',
      status: 'ASSIGNED' as ItemSupplierResponseStatus,
      current_technical_round: 1,
      technical_revision_rounds: [],
      product_mapping: item.seller_product_id ? {
        seller_product_id: item.seller_product_id,
        variant_id: item.variant_id || '',
        mapped_at: new Date().toISOString(),
        is_buyer_approved: true,
      } : null,
      commercial_negotiation_rounds: [],
      is_awarded: false,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });

  const allResponses = [...sellerResponses, ...virtualResponses];

  const filteredResponses = allResponses.filter((resp) => {
    const item = items.find((i) => i.id === resp.rfq_item_id);
    const rfq = rfqs.find((r) => r.id === resp.rfq_id);
    const matchesTab = activeTab === 'ALL' || resp.status === activeTab;
    const matchesSearch =
      (item?.product_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (rfq?.title || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (rfq?.rfq_number || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const columns = [
    {
      title: 'RFQ Item & Sourcing Title',
      key: 'item_title',
      render: (_: any, record: any) => {
        const item = items.find((i) => i.id === record.rfq_item_id);
        const rfq = rfqs.find((r) => r.id === record.rfq_id);
        return (
          <div>
            <div className="font-bold text-slate-900 text-base">{item?.product_name || 'Flagship Mobile Device'}</div>
            <div className="text-xs text-slate-500">RFQ: <span className="font-semibold text-slate-700">{rfq?.rfq_number}</span> ({rfq?.title})</div>
          </div>
        );
      },
    },
    {
      title: 'Requested Quantity',
      key: 'quantity',
      width: 160,
      render: (_: any, record: any) => {
        const item = items.find((i) => i.id === record.rfq_item_id);
        return <span className="font-bold text-slate-800">{item?.quantity || 100} {item?.unit_of_measure || 'Units'}</span>;
      },
    },
    {
      title: 'Response Status',
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (status: ItemSupplierResponseStatus) => <ItemSupplierStatusBadge status={status} />,
    },
    {
      title: 'Catalog Product Mapping',
      key: 'product_mapping',
      width: 220,
      render: (_: any, record: any) => {
        if (!record.product_mapping?.seller_product_id) {
          return <Tag color="volcano">Product Not Mapped</Tag>;
        }
        return (
          <div>
            <Tag color="purple">{record.product_mapping.seller_product_id}</Tag>
            <div className="text-[10px] text-slate-500 font-mono">Variant: {record.product_mapping.variant_id}</div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          onClick={() => navigate(`${basePath}/rfqs/${record.rfq_id}/items/${record.rfq_item_id}/respond`)}
          icon={<SendOutlined />}
          className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
        >
          {record.status === 'ASSIGNED' ? 'Submit Response' : 'Update Response'}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Supplier Sourcing Inbox</h1>
            <Tag color="purple" icon={isBusinessContext ? <BankOutlined /> : <UserOutlined />} className="px-2.5 py-0.5 font-bold">
              Seller Party: {activeParty.display_name} ({activePartyId})
            </Tag>
          </div>
          <p className="text-sm text-slate-500">View assigned RFQ opportunities for seller party {activeParty.display_name}.</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'ALL', label: `All Requests (${allResponses.length})` },
              { key: 'ASSIGNED', label: 'Assigned' },
              { key: 'TECHNICAL_SUBMITTED', label: 'Tech Submitted' },
              { key: 'TECHNICAL_APPROVED', label: 'Tech Approved' },
              { key: 'PRODUCT_MAPPED', label: 'Product Mapped' },
              { key: 'COMMERCIAL_UNDER_NEGOTIATION', label: 'Negotiating' },
              { key: 'AWARDED', label: 'Awarded' },
            ]}
          />

          <Input
            placeholder="Search responses..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-64"
            allowClear
          />
        </div>

        <Table dataSource={filteredResponses} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
};
