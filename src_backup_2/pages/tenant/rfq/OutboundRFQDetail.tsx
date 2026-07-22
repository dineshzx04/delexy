import React, { useState } from 'react';
import { Card as AntCard, Button as AntButton, Tag as AntTag, Descriptions as AntDescriptions, notification, Table as AntTable, Modal as AntModal } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RFQ, type RFQQuote, type RFQItem } from '../../../data/db';

const OutboundRFQDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const rfq = useLiveQuery(() => id ? db.rfqs.get(id) : undefined, [id]);

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to="/rfqs/outbound" className="text-gray-500 hover:text-sky-600 transition-colors">My RFQs</Link>, url: '/rfqs/outbound' },
    { title: <span className="text-gray-900 font-semibold">{id}</span> }
  ], [id]);

  useBreadcrumb(breadcrumbs);

  if (!rfq) return <div className="p-8">RFQ Not Found</div>;

  const handleAcceptQuote = (quoteId: string) => {
    AntModal.confirm({
      title: 'Accept Quote',
      content: 'Are you sure you want to accept this quote? All other quotes will be rejected and this RFQ will be closed.',
      onOk: async () => {
        if (!rfq) return;
        
        // Update all quotes status
        const updatedQuotes = (rfq.quotes || []).map(q => ({
          ...q,
          status: q.id === quoteId ? 'Accepted' : 'Rejected'
        }));
        
        await db.rfqs.update(rfq.id, {
          status: 'Closed',
          quotes: updatedQuotes
        });
        
        notification.success({ message: 'Quote accepted successfully!' });
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

  if (rfq.status !== 'Closed') {
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
        <h4 className="font-semibold mb-2">Line Item Breakdown & Deviations</h4>
        
        <div className="space-y-6">
          {record.items.map((qi: any) => {
            const rfqItem = rfq.items.find((i: any) => i.id === qi.rfqItemId);
            if (!rfqItem) return null;
            
            const reqSpecs = rfqItem.dynamicAttributes || {};
            const quotedSpecs = qi.quotedSpecifications?.dynamicAttributes || {};
            
            // Find deviations
            const deviations: any[] = [];
            Object.entries(reqSpecs).forEach(([key, reqVal]) => {
              const qVal = quotedSpecs[key];
              if (qVal && qVal !== reqVal) {
                deviations.push({ key, reqVal, qVal });
              }
            });

            // Find chats for this item
            const itemChats = record.chatLog ? record.chatLog.filter(c => c.itemId === qi.rfqItemId) : [];

            return (
              <div key={qi.rfqItemId} className="border border-gray-200 bg-white rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                  <div className="font-semibold text-gray-700">
                    Item: {rfqItem.platformProductId || rfqItem.id} ({rfqItem.quantity} {rfqItem.unit})
                  </div>
                  <div className="text-sm font-semibold">
                    ${qi.price.toFixed(2)} / unit • Total: ${(qi.price * rfqItem.quantity).toFixed(2)} • {qi.leadTimeDays} Days Lead
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row gap-6">
                  {/* Deviations Panel */}
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuration Review</h5>
                    {deviations.length === 0 ? (
                      <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 p-2 rounded">
                        <Lucide.CheckCircle size={16} /> Exact Specification Match
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deviations.map(dev => (
                          <div key={dev.key} className="text-sm bg-orange-50 border border-orange-200 p-2 rounded">
                            <div className="font-semibold text-orange-800 flex items-center gap-1 mb-1">
                              <Lucide.AlertTriangle size={14} /> Deviation on: {dev.key}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div><span className="text-gray-500 text-xs">Requested:</span><br/>{dev.reqVal}</div>
                              <div><span className="text-sky-600 text-xs font-semibold">Quoted:</span><br/>{dev.qVal}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chat / Negotiation Panel */}
                  <div className="flex-1 border-l border-gray-200 pl-6">
                    <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                      Negotiation History
                      <AntButton size="small" type="link" icon={<Lucide.MessageSquare size={14}/>}>Reply</AntButton>
                    </h5>
                    {itemChats.length === 0 ? (
                      <div className="text-sm text-gray-400 italic">No negotiation history.</div>
                    ) : (
                      <div className="space-y-3">
                        {itemChats.map(chat => (
                          <div key={chat.id} className={`p-2 rounded text-sm ${chat.senderTenantId === rfq.requesterTenantId ? 'bg-sky-50 ml-4' : 'bg-gray-100 mr-4'}`}>
                            <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
                              <span className="font-semibold">{chat.senderTenantId === rfq.requesterTenantId ? 'You' : record.responderTenantName}</span>
                              <span>{new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            {chat.fieldContext && (
                              <div className="text-xs text-orange-600 bg-white inline-block px-1 rounded mb-1">Re: {chat.fieldContext.replace('dynamicAttributes.', '')}</div>
                            )}
                            <div>{chat.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl pb-12">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 m-0">{rfq.title}</h1>
            <AntTag color={rfq.status === 'Open' ? 'blue' : rfq.status === 'Closed' ? 'green' : 'orange'} className="text-sm font-semibold px-2 py-0.5">
              {rfq.status.toUpperCase()}
            </AntTag>
          </div>
          <p className="text-gray-500">
            {rfq.rfqNumber} • Requested on {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <AntCard className="mb-8 shadow-sm border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Global Request Information</h3>
        <AntDescriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered size="small">
          <AntDescriptions.Item label="Contact Email">
            {rfq.contactEmail}
          </AntDescriptions.Item>
          {rfq.contactMobile && (
            <AntDescriptions.Item label="Contact Mobile">
              {rfq.contactMobile}
            </AntDescriptions.Item>
          )}
          <AntDescriptions.Item label="Currency">
            {rfq.currency}
          </AntDescriptions.Item>
          <AntDescriptions.Item label="Submission Deadline">
            <span className="font-semibold text-red-600">{new Date(rfq.submissionDeadline).toLocaleDateString()}</span>
          </AntDescriptions.Item>
          <AntDescriptions.Item label="Destination">
            {rfq.shippingDestination}
          </AntDescriptions.Item>
          <AntDescriptions.Item label="Detailed Specifications" span={2}>
            {rfq.specifications || <span className="text-gray-400 italic">No detailed specifications.</span>}
          </AntDescriptions.Item>
        </AntDescriptions>
        
        <h4 className="text-md font-semibold text-gray-800 mt-6 mb-3">Line Items ({rfq.items.length})</h4>
        <AntTable
           dataSource={rfq.items}
           rowKey="id"
           pagination={false}
           size="small"
           className="border border-gray-200 rounded"
           columns={[
             { title: '#', render: (_, __, idx) => idx + 1 },
             { title: 'Quantity', dataIndex: 'quantity', key: 'qty' },
             { title: 'Target Info', render: (_, r: RFQItem) => {
                 if (r.targetTenantId) return `Seller: ${r.targetTenantId} | Platform ID: ${r.platformProductId}`;
                 if (r.platformProductId) return `Product ID: ${r.platformProductId}`;
                 if (r.categoryId) return `Category ID: ${r.categoryId}`;
                 return `Open RFQ`;
             }}
           ]}
           expandable={{
             expandedRowRender: (r: RFQItem) => (
               <div className="bg-gray-50 p-4 rounded border border-gray-200">
                 <h5 className="font-semibold text-gray-700 mb-2">Item Specifications</h5>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                   {r.brand && r.brand.length > 0 && <div><span className="text-gray-500">Brand:</span> {Array.isArray(r.brand) ? r.brand.join(', ') : r.brand}</div>}
                   {r.manufacturer && r.manufacturer.length > 0 && <div><span className="text-gray-500">Mfr:</span> {Array.isArray(r.manufacturer) ? r.manufacturer.join(', ') : r.manufacturer}</div>}
                   {r.seller && r.seller.length > 0 && <div><span className="text-gray-500">Seller:</span> {Array.isArray(r.seller) ? r.seller.join(', ') : r.seller}</div>}
                   {r.countryOfOrigin && <div><span className="text-gray-500">Country:</span> {r.countryOfOrigin}</div>}
                   {r.modelNumber && <div><span className="text-gray-500">Model:</span> {r.modelNumber}</div>}
                   {r.partNumber && <div><span className="text-gray-500">Part #:</span> {r.partNumber}</div>}
                   {r.height && <div><span className="text-gray-500">Height:</span> {r.height}</div>}
                   {r.width && <div><span className="text-gray-500">Width:</span> {r.width}</div>}
                   {r.weight && <div><span className="text-gray-500">Weight:</span> {r.weight}</div>}
                 </div>

                 {r.dynamicAttributes && Object.keys(r.dynamicAttributes).length > 0 && (
                   <div className="mt-4 pt-4 border-t border-gray-200">
                     <h5 className="font-semibold text-gray-700 mb-2">Dynamic Specifications</h5>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                       {Object.entries(r.dynamicAttributes).map(([key, value]) => (
                         <div key={key}><span className="text-gray-500">{key}:</span> {value}</div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             ),
             rowExpandable: () => true
           }}
        />
      </AntCard>

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

    </div>
  );
};

export default OutboundRFQDetail;
