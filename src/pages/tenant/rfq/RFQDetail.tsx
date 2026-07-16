import React, { useState } from 'react';
import { Card as AntCard, Button as AntButton, Input as AntInput, Tag as AntTag, Descriptions as AntDescriptions, notification, Table as AntTable, Modal as AntModal } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { getRFQById, submitQuote, acceptQuote, getRelevantRFQItems, type RFQ, type RFQQuote, type RFQItem } from '../../../data/mockRFQs';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const RFQDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [rfq, setRfq] = useState<RFQ | undefined>(id ? getRFQById(id) : undefined);

  // Quote State for multiple items: rfqItemId -> Quote details
  const [itemQuotes, setItemQuotes] = useState<Record<string, { price: string, leadTimeDays: string }>>({});
  const [quoteNotes, setQuoteNotes] = useState('');

  const isRequester = rfq?.requesterTenantId === activeWorkspace.id;
  const myQuote = rfq?.quotes.find(q => q.responderTenantId === activeWorkspace.id);

  // Sellers only see relevant items. Buyers see all items.
  const visibleItems = rfq ? (isRequester ? rfq.items : getRelevantRFQItems(rfq, activeWorkspace.id)) : [];

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to={isRequester ? "/rfqs/outbound" : "/rfqs/inbound"} className="text-gray-500 hover:text-sky-600 transition-colors">{isRequester ? 'My RFQs' : 'Received RFQs'}</Link>, url: isRequester ? '/rfqs/outbound' : '/rfqs/inbound' },
    { title: <span className="text-gray-900 font-semibold">{id}</span> }
  ], [isRequester, id]);

  useBreadcrumb(breadcrumbs);

  if (!rfq) return <div className="p-8">RFQ Not Found</div>;

  const handleItemQuoteChange = (itemId: string, field: 'price' | 'leadTimeDays', value: string) => {
    setItemQuotes(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSubmitQuote = () => {
    // Validate that ALL visible items have a price and lead time
    const quoteItems = [];
    for (const item of visibleItems) {
      const q = itemQuotes[item.id];
      if (!q || !q.price || !q.leadTimeDays) {
        notification.error({ message: 'You must provide a unit price and lead time for all items.' });
        return;
      }
      quoteItems.push({
        rfqItemId: item.id,
        price: Number(q.price),
        leadTimeDays: Number(q.leadTimeDays)
      });
    }

    const newQuote = submitQuote(rfq.id, {
      responderTenantId: activeWorkspace.id,
      responderTenantName: activeWorkspace.name,
      notes: quoteNotes,
      items: quoteItems
    });

    if (newQuote) {
      notification.success({ message: 'Quote submitted successfully!' });
      setRfq(getRFQById(rfq.id));
    }
  };

  const handleAcceptQuote = (quoteId: string) => {
    AntModal.confirm({
      title: 'Accept Quote',
      content: 'Are you sure you want to accept this quote? All other quotes will be rejected and this RFQ will be closed.',
      onOk: () => {
        acceptQuote(rfq.id, quoteId);
        notification.success({ message: 'Quote accepted successfully!' });
        setRfq(getRFQById(rfq.id));
      }
    });
  };

  const quoteColumns = [
    { title: 'Seller', dataIndex: 'responderTenantName', key: 'responderTenantName', render: (text: string) => <span className="font-semibold">{text}</span> },
    { 
      title: 'Total Price', 
      key: 'totalPrice', 
      render: (_: any, record: RFQQuote) => {
        // Compute total price (price * quantity) by looking up the item quantities
        let total = 0;
        record.items.forEach(qi => {
          const rfqItem = rfq.items.find(i => i.id === qi.rfqItemId);
          if (rfqItem) {
            total += (qi.price * rfqItem.quantity);
          }
        });
        return <span className="font-semibold">${total.toFixed(2)}</span>;
      }
    },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (text: string) => <span className="text-gray-500 text-xs">{text || '-'}</span> },
    { title: 'Date Submitted', dataIndex: 'submittedAt', key: 'submittedAt', render: (d: string) => new Date(d).toLocaleDateString() },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <AntTag color={s === 'Accepted' ? 'green' : s === 'Rejected' ? 'red' : 'blue'}>{s}</AntTag> },
  ];

  if (isRequester && rfq.status !== 'Closed') {
    quoteColumns.push({
      title: 'Action',
      key: 'action',
      render: (_: any, record: RFQQuote) => (
        <AntButton 
          type="primary" 
          size="small" 
          className="bg-green-600 hover:bg-green-500 border-none"
          onClick={() => handleAcceptQuote(record.id)}
        >
          Accept
        </AntButton>
      )
    } as any);
  }

  // Define expandable row for the quotes table (showing line items)
  const expandedRowRender = (record: RFQQuote) => {
    return (
      <div className="bg-gray-50 p-4 rounded border border-gray-200 m-2">
        <h4 className="font-semibold mb-2">Line Item Breakdown</h4>
        <AntTable 
          dataSource={record.items}
          rowKey="rfqItemId"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Item',
              key: 'item',
              render: (_: any, qi: any) => {
                const item = rfq.items.find(i => i.id === qi.rfqItemId);
                if (!item) return qi.rfqItemId;
                if (item.type === 'direct') return `SKU: ${item.targetSku}`;
                return `Product ID: ${item.platformProductId}`;
              }
            },
            {
              title: 'Quantity',
              key: 'qty',
              render: (_: any, qi: any) => rfq.items.find(i => i.id === qi.rfqItemId)?.quantity || 0
            },
            { title: 'Unit Price', dataIndex: 'price', render: (p: number) => `$${p.toFixed(2)}` },
            { 
              title: 'Line Total', 
              key: 'lineTotal', 
              render: (_: any, qi: any) => {
                const qty = rfq.items.find(i => i.id === qi.rfqItemId)?.quantity || 0;
                return `$${(qi.price * qty).toFixed(2)}`;
              }
            },
            { title: 'Lead Time (Days)', dataIndex: 'leadTimeDays' }
          ]}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl pb-12">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 m-0">RFQ Details: {rfq.id}</h1>
            <AntTag color={rfq.status === 'Open' ? 'blue' : rfq.status === 'Closed' ? 'green' : 'orange'} className="text-sm font-semibold px-2 py-0.5">
              {rfq.status.toUpperCase()}
            </AntTag>
          </div>
          <p className="text-gray-500">
            {isRequester ? `You requested this quote on ${new Date(rfq.createdAt).toLocaleDateString()}.` : `${rfq.requesterTenantName} is requesting a quote.`}
          </p>
        </div>
      </div>

      <AntCard className="mb-8 shadow-sm border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Global Request Information</h3>
        <AntDescriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered size="small">
          {!isRequester && (
            <AntDescriptions.Item label="Requested By">
              {rfq.requesterTenantName}
            </AntDescriptions.Item>
          )}
          <AntDescriptions.Item label="Target Date">
            {new Date(rfq.requiredDate).toLocaleDateString()}
          </AntDescriptions.Item>
          <AntDescriptions.Item label="Destination">
            {rfq.shippingDestination}
          </AntDescriptions.Item>
          <AntDescriptions.Item label="Notes/Instructions" span={2}>
            {rfq.notes || <span className="text-gray-400 italic">No additional notes.</span>}
          </AntDescriptions.Item>
        </AntDescriptions>
        
        <h4 className="text-md font-semibold text-gray-800 mt-6 mb-3">Line Items ({visibleItems.length})</h4>
        <AntTable
           dataSource={visibleItems}
           rowKey="id"
           pagination={false}
           size="small"
           className="border border-gray-200 rounded"
           columns={[
             { title: '#', render: (_, __, idx) => idx + 1 },
             { title: 'Quantity', dataIndex: 'quantity', key: 'qty' },
             { title: 'Type', dataIndex: 'type', render: t => <span className="capitalize">{t}</span> },
             { title: 'Target', render: (_, r: RFQItem) => {
                 if (r.type === 'direct') return `SKU: ${r.targetSku}`;
                 if (r.type === 'broadcast') return `Product ID: ${r.platformProductId}`;
                 return `Seller: ${r.targetTenantId} | Product: ${r.platformProductId}`;
             }}
           ]}
        />
      </AntCard>

      {/* For Requester: Show Quotes Comparison */}
      {isRequester && (
        <AntCard className="shadow-sm border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 m-0 border-b pb-2 flex-1">Received Quotes</h3>
            <span className="text-sm text-gray-500 ml-4">{rfq.quotes.length} Quotes</span>
          </div>
          {rfq.quotes.length > 0 ? (
            <AntTable
              columns={quoteColumns}
              dataSource={rfq.quotes}
              rowKey="id"
              pagination={false}
              size="small"
              className="border border-gray-200 rounded overflow-hidden"
              expandable={{ expandedRowRender }}
            />
          ) : (
            <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded text-gray-500">
              <Lucide.Inbox size={32} className="mx-auto mb-2 opacity-50" />
              Waiting for sellers to respond with quotes.
            </div>
          )}
        </AntCard>
      )}

      {/* For Receiver: Show form to submit quote or their submitted quote */}
      {!isRequester && (
        <AntCard className="shadow-sm border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Your Quote Response</h3>
          
          {myQuote ? (
            <div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 flex items-start gap-3 text-green-800">
                <Lucide.CheckCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">Quote Submitted</h4>
                  <p className="text-sm opacity-90">You have already submitted a quote for this RFQ on {new Date(myQuote.submittedAt).toLocaleDateString()}. Status: <strong>{myQuote.status}</strong></p>
                </div>
              </div>
              <h4 className="font-semibold mb-2">Your Quoted Prices</h4>
              <AntTable 
                dataSource={myQuote.items}
                rowKey="rfqItemId"
                pagination={false}
                size="small"
                className="mb-4"
                columns={[
                  {
                    title: 'Item',
                    key: 'item',
                    render: (_: any, qi: any) => {
                      const item = rfq.items.find(i => i.id === qi.rfqItemId);
                      if (!item) return qi.rfqItemId;
                      if (item.type === 'direct') return `SKU: ${item.targetSku}`;
                      return `Product ID: ${item.platformProductId}`;
                    }
                  },
                  { title: 'Unit Price', dataIndex: 'price', render: (p: number) => `$${p.toFixed(2)}` },
                  { title: 'Lead Time (Days)', dataIndex: 'leadTimeDays' }
                ]}
              />
              <AntDescriptions bordered size="small" column={1}>
                <AntDescriptions.Item label="Your Notes">{myQuote.notes || '-'}</AntDescriptions.Item>
              </AntDescriptions>
            </div>
          ) : rfq.status === 'Closed' ? (
             <div className="p-6 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
                This RFQ has been closed and is no longer accepting quotes.
             </div>
          ) : (
            <div className="space-y-6">
              <div>
                 <p className="text-sm text-gray-600 mb-4">Please provide a unit price and estimated lead time for each item below.</p>
                 <AntTable
                   dataSource={visibleItems}
                   rowKey="id"
                   pagination={false}
                   size="small"
                   className="border border-gray-200 rounded mb-4"
                   columns={[
                     { title: 'Item', render: (_, r) => r.type === 'direct' ? `SKU: ${r.targetSku}` : `Product: ${r.platformProductId}` },
                     { title: 'Qty', dataIndex: 'quantity' },
                     { 
                       title: 'Unit Price ($)', 
                       render: (_, r) => (
                         <AntInput 
                           type="number" 
                           size="small" 
                           placeholder="0.00"
                           value={itemQuotes[r.id]?.price || ''}
                           onChange={e => handleItemQuoteChange(r.id, 'price', e.target.value)}
                         />
                       )
                     },
                     { 
                       title: 'Lead Time (Days)', 
                       render: (_, r) => (
                         <AntInput 
                           type="number" 
                           size="small" 
                           placeholder="Days"
                           value={itemQuotes[r.id]?.leadTimeDays || ''}
                           onChange={e => handleItemQuoteChange(r.id, 'leadTimeDays', e.target.value)}
                         />
                       )
                     }
                   ]}
                 />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions / Notes</label>
                <AntInput.TextArea rows={3} value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} placeholder="Any special conditions..." />
              </div>
              <div className="pt-2 border-t pt-4">
                <AntButton type="primary" size="large" className="bg-sky-600" onClick={handleSubmitQuote}>Submit Quote for All Items</AntButton>
              </div>
            </div>
          )}
        </AntCard>
      )}
    </div>
  );
};

export default RFQDetail;
