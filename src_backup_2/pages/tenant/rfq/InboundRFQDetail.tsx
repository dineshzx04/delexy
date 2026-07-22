import React, { useState } from 'react';
import { Card as AntCard, Button as AntButton, Input as AntInput, Tag as AntTag, Descriptions as AntDescriptions, notification, Table as AntTable } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RFQ, type RFQItem } from '../../../data/db';

const InboundRFQDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const rfq = useLiveQuery(() => id ? db.rfqs.get(id) : undefined, [id]);

  // Quote State for multiple items: rfqItemId -> Quote details
  const [itemQuotes, setItemQuotes] = useState<Record<string, { 
    price: string, 
    leadTimeDays: string,
    brand: string,
    dynamicAttributes: Record<string, string>
  }>>({});
  const [quoteNotes, setQuoteNotes] = useState('');

  const myQuote = rfq?.quotes && rfq.quotes.find(q => q.responderTenantId === activeWorkspace.id);

  // Sellers only see relevant items.
  const visibleItems = rfq ? rfq.items.filter(item => 
    !item.targetTenantId || item.targetTenantId === activeWorkspace.id
  ) : [];

  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/" className="text-gray-500 hover:text-sky-600 transition-colors">Dashboard</Link>, url: '/' },
    { title: <Link to="/rfqs/inbound" className="text-gray-500 hover:text-sky-600 transition-colors">Received RFQs</Link>, url: '/rfqs/inbound' },
    { title: <span className="text-gray-900 font-semibold">{id}</span> }
  ], [id]);

  useBreadcrumb(breadcrumbs);

  if (!rfq) return <div className="p-8">RFQ Not Found</div>;

  const handleItemQuoteChange = (itemId: string, field: 'price' | 'leadTimeDays' | 'brand', value: string) => {
    setItemQuotes(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleDynamicAttrChange = (itemId: string, attrKey: string, value: string) => {
    setItemQuotes(prev => {
      const current = prev[itemId] || { price: '', leadTimeDays: '', brand: '', dynamicAttributes: {} };
      return {
        ...prev,
        [itemId]: {
          ...current,
          dynamicAttributes: {
            ...(current.dynamicAttributes || {}),
            [attrKey]: value
          }
        }
      };
    });
  };

  const handleSubmitQuote = async () => {
    if (!rfq) return;

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
        leadTimeDays: Number(q.leadTimeDays),
        responseType: 'OPEN_RFQ' as const, // Automated processing parses this
        quotedSpecifications: {
          brand: q.brand ? [q.brand] : undefined,
          dynamicAttributes: q.dynamicAttributes || {}
        }
      });
    }

    const newQuote = {
      id: `quote-${Date.now()}`,
      responderTenantId: activeWorkspace.id,
      responderTenantName: activeWorkspace.name,
      notes: quoteNotes,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      items: quoteItems
    };

    const updatedQuotes = [...(rfq.quotes || []), newQuote];

    await db.rfqs.update(rfq.id, { quotes: updatedQuotes });
    notification.success({ message: 'Quote submitted successfully!' });
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
            {rfq.rfqNumber} • Requested by {rfq.requesterTenantName}
          </p>
        </div>
      </div>

      <AntCard className="mb-8 shadow-sm border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Global Request Information</h3>
        <AntDescriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered size="small">
          <AntDescriptions.Item label="Requested By">
            {rfq.requesterTenantName}
          </AntDescriptions.Item>
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

        <h4 className="text-md font-semibold text-gray-800 mt-6 mb-3">Targeted Line Items ({visibleItems.length})</h4>
        <AntTable
          dataSource={visibleItems}
          rowKey="id"
          pagination={false}
          size="small"
          className="border border-gray-200 rounded"
          columns={[
            { title: '#', render: (_, __, idx) => idx + 1 },
            { title: 'Quantity', dataIndex: 'quantity', key: 'qty' },
            {
              title: 'Target Info', render: (_, r: RFQItem) => {
                if (r.targetTenantId) return `Targeted | Platform ID: ${r.platformProductId}`;
                if (r.platformProductId) return `Product ID: ${r.platformProductId}`;
                if (r.categoryId) return `Category ID: ${r.categoryId}`;
                return `Open RFQ`;
              }
            }
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
                    const item: any = rfq.items.find(i => i.id === qi.rfqItemId);
                    if (!item) return qi.rfqItemId;
                    if (item.platformProductId) return `Product ID: ${item.platformProductId}`;
                    return `Item: ${item.id}`;
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
            <p className="text-sm text-gray-600 mb-4">Please configure your response for each requested item. You may quote identical specifications or provide your own alternatives.</p>
            
            {visibleItems.map((item, idx) => {
              const quote = itemQuotes[item.id] || { price: '', leadTimeDays: '', brand: '', dynamicAttributes: {} };
              
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">
                    Item {idx + 1}: {item.platformProductId ? `Product ${item.platformProductId}` : item.categoryId ? `Category ${item.categoryId}` : item.id}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left Side: Requested Specs */}
                    <div className="p-4 border-r border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-1">Requested Specifications</h4>
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500 font-medium">Quantity</div>
                          <div className="col-span-2">{item.quantity} {item.unit || 'Pieces'}</div>
                        </div>
                        {item.brand && (
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-gray-500 font-medium">Brand</div>
                            <div className="col-span-2">{Array.isArray(item.brand) ? item.brand.join(', ') : item.brand}</div>
                          </div>
                        )}
                        {item.dynamicAttributes && Object.entries(item.dynamicAttributes).map(([key, val]) => (
                          <div key={key} className="grid grid-cols-3 gap-2">
                            <div className="text-gray-500 font-medium">{key}</div>
                            <div className="col-span-2">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Side: Quoted Specs */}
                    <div className="p-4 bg-white shadow-inner">
                      <h4 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4 border-b pb-1">Your Configuration</h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Unit Price ($)</label>
                            <AntInput 
                              type="number" 
                              value={quote.price} 
                              onChange={(e) => handleItemQuoteChange(item.id, 'price', e.target.value)} 
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Lead Time (Days)</label>
                            <AntInput 
                              type="number" 
                              value={quote.leadTimeDays} 
                              onChange={(e) => handleItemQuoteChange(item.id, 'leadTimeDays', e.target.value)} 
                              placeholder="Days"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Brand Provided</label>
                          <AntInput 
                            value={quote.brand} 
                            onChange={(e) => handleItemQuoteChange(item.id, 'brand', e.target.value)} 
                            placeholder="Enter proposed brand..."
                          />
                        </div>

                        {item.dynamicAttributes && Object.keys(item.dynamicAttributes).length > 0 && (
                          <div className="mt-4 border-t pt-3">
                            <label className="block text-xs text-gray-500 font-semibold mb-2">Dynamic Attributes (Modify if deviating)</label>
                            <div className="space-y-3">
                              {Object.entries(item.dynamicAttributes).map(([key, reqVal]) => {
                                // Default to empty if not touched, though it conceptually defaults to the requested.
                                // We'll let them explicitly type it out or prepopulate it.
                                const val = quote.dynamicAttributes[key] !== undefined ? quote.dynamicAttributes[key] : reqVal;
                                return (
                                  <div key={key}>
                                    <label className="block text-xs text-gray-500 mb-1">{key}</label>
                                    <AntInput 
                                      value={val} 
                                      onChange={(e) => handleDynamicAttrChange(item.id, key, e.target.value)} 
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

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
    </div>
  );
};

export default InboundRFQDetail;
