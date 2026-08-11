import React from 'react';
import { Table, Tag, Tooltip, Card, Alert, Button } from 'antd';
import {
  WarningFilled,
  CheckCircleFilled,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { rfqDb, type RfqItem } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';

interface TechnicalComparisonTableProps {
  item: RfqItem;
  onReviewTechnical?: (quoteId: string) => void;
}

export const TechnicalComparisonTable: React.FC<TechnicalComparisonTableProps> = ({
  item,
  onReviewTechnical,
}) => {
  const quotes = useLiveQuery(() => rfqDb.seller_quotes.where('rfq_item_id').equals(item.id).toArray(), [item.id]) || [];
  const parties = useLiveQuery(() => businessDb.parties.toArray(), []) || [];
  const allResponses = useLiveQuery(() => rfqDb.seller_quote_attributes.toArray(), []) || [];
  const allComments = useLiveQuery(() => rfqDb.seller_quote_comments.toArray(), []) || [];
  const allItemAttributes = useLiveQuery(() => rfqDb.rfq_item_attributes.toArray(), []) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  const respondedQuotes = quotes.filter(
    (q) => q.status === 'SUBMITTED' || q.status === 'FINALIZED'
  );

  const requestedBrandName = Array.isArray(item.brand_id)
    ? item.brand_id.map((bId) => allBrands.find((b) => b.id === bId)?.name || bId).join(', ')
    : allBrands.find((b) => b.id === item.brand_id)?.name || item.brand_id || 'Unspecified';

  const requestedMfgName = Array.isArray(item.manufacturer_id)
    ? item.manufacturer_id.map((mId) => allManufacturers.find((m) => m.id === mId)?.company_name || mId).join(', ')
    : allManufacturers.find((m) => m.id === item.manufacturer_id)?.company_name || item.manufacturer_id || 'Unspecified';

  const brandRow = (item.brand_id && (Array.isArray(item.brand_id) ? item.brand_id.length > 0 : true))
    ? [{ key: 'static-brand', group_id: 'static', attribute_id: 'brand', name: 'Preferred Brand', requested: requestedBrandName }]
    : [];

  const mfgRow = (item.manufacturer_id && (Array.isArray(item.manufacturer_id) ? item.manufacturer_id.length > 0 : true))
    ? [{ key: 'static-mfg', group_id: 'static', attribute_id: 'manufacturer', name: 'Preferred Manufacturer', requested: requestedMfgName }]
    : [];

  const dynamicRows = (item.dynamic_attributes || []).map((attr) => {
    const attrObj = allAttributes.find((a) => a.id === attr.attribute_id);
    const valLabels = (attr.selected_value_ids || [])
      .map((vId) => {
        const vObj = allAttributeValues.find((v) => v.id === vId);
        return vObj?.label || vId;
      })
      .join(', ');

    return {
      key: `dyn-${attr.attribute_id}`,
      group_id: attr.group_id,
      attribute_id: attr.attribute_id,
      name: attrObj?.name || attrObj?.label || `Category Spec (${attr.attribute_id})`,
      requested: valLabels || 'Required',
    };
  });

  const comparisonData = [
    ...brandRow,
    ...mfgRow,
    ...dynamicRows,
  ];

  const baseColumns: any[] = [
    {
      title: 'Specification / Attribute',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (text: string, record: any) => (
        <div>
          <span className="font-semibold text-slate-800">{text}</span>
          <div className="text-xs text-slate-400 font-mono">{record.key}</div>
        </div>
      ),
    },
    {
      title: 'Buyer Requirement (Target)',
      dataIndex: 'requested',
      key: 'requested',
      width: 260,
      render: (text: string) => (
        <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
          {text}
        </div>
      ),
    },
  ];

  const sellerColumns: any[] = respondedQuotes.map((q) => {
    const party = parties.find((p) => p.id === q.seller_id) || { display_name: `Seller ${q.seller_id}` };
    const statusText = q.status === 'FINALIZED' ? 'TECHNICAL_APPROVED' : 'TECHNICAL_SUBMITTED';

    return {
      title: (
        <div className="space-y-1">
          <div className="font-bold text-slate-900">{party.display_name}</div>
          <div className="text-xs text-slate-500 font-normal">
            Status: <span className="font-semibold text-blue-600">{statusText}</span>
          </div>

          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
            {onReviewTechnical && (
              <Button
                size="small"
                type="primary"
                ghost
                icon={<CheckCircleOutlined />}
                onClick={() => onReviewTechnical(q.id)}
                className="text-[11px] h-6 px-2"
              >
                Review Tech
              </Button>
            )}
          </div>
        </div>
      ),
      key: q.id,
      width: 320,
      render: (_: any, record: any) => {
        const quoteResponses = allResponses.filter(r => r.quote_revision_id === q.current_revision_id);
        const attrResp = quoteResponses.find(
          (r) => r.group_id === record.group_id && r.attribute_id === record.attribute_id
        );

        if (!attrResp) {
          return <span className="text-slate-400 italic">No response submitted</span>;
        }

        let isDeviated = false;
        if (record.group_id === 'static') {
          const reqIds = Array.isArray(item.brand_id) ? item.brand_id : (item.brand_id ? [item.brand_id] : []);
          const mfgIds = Array.isArray(item.manufacturer_id) ? item.manufacturer_id : (item.manufacturer_id ? [item.manufacturer_id] : []);
          const targetIds = record.attribute_id === 'brand' ? reqIds : mfgIds;

          isDeviated = attrResp.offered_values.some((v: any) => !targetIds.includes(v.value_id)) ||
                       targetIds.some((id: string) => !attrResp.offered_values.some((v: any) => v.value_id === id));
        } else {
          const buyerAttr = allItemAttributes.find(ia => ia.rfq_item_revision_id === item.current_revision_id && ia.group_id === record.group_id && ia.attribute_id === record.attribute_id);
          isDeviated = buyerAttr ? (
            attrResp.offered_values.some((v: any) => !buyerAttr.values.some((r: any) => r.value_id === v.value_id)) ||
            buyerAttr.values.some((r: any) => !attrResp.offered_values.some((v: any) => v.value_id === r.value_id))
          ) : false;
        }

        const offeredVal = attrResp.offered_values.map((v: any) => v.value_label || v.value_id).join(', ') || '-';
        const sellerComment = allComments.find(c => c.quote_attribute_id === attrResp.id && c.sender === 'SELLER');
        const buyerComment = allComments.find(c => c.quote_attribute_id === attrResp.id && c.sender === 'BUYER');

        return (
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              isDeviated
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-sm">
              <span>{offeredVal}</span>
              {isDeviated ? (
                <Tooltip title={`Deviation: ${sellerComment?.comment || 'Specified alternative specification'}`}>
                  <Tag icon={<WarningFilled />} color="warning">
                    Deviated
                  </Tag>
                </Tooltip>
              ) : (
                <Tag icon={<CheckCircleFilled />} color="success">
                  Exact Match
                </Tag>
              )}
            </div>

            {sellerComment?.comment && (
              <div className="mt-1.5 text-xs text-amber-700 bg-amber-100/60 p-1.5 rounded border border-amber-200">
                <span className="font-semibold">Supplier Note: </span>
                {sellerComment.comment}
              </div>
            )}

            {buyerComment?.comment && (
              <div className="mt-1 text-[11px] text-blue-800 bg-blue-50 p-1.5 rounded border border-blue-200">
                <span className="font-semibold">Buyer Comment: </span>
                {buyerComment.comment}
              </div>
            )}
          </div>
        );
      },
    };
  });

  const columns = [...baseColumns, ...sellerColumns];

  return (
    <Card className="shadow-sm border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {respondedQuotes.length > 0 ? 'Technical Side-by-Side Comparison' : 'Item Specifications & Requirements'}
          </h3>
          <p className="text-xs text-slate-500">
            {respondedQuotes.length > 0
              ? `Comparing requested buyer specifications against technical responses across ${respondedQuotes.length} responded supplier(s).`
              : 'Detailed specification tree and buyer target requirements for this line item.'}
          </p>
        </div>
        {respondedQuotes.length > 0 && (
          <div className="flex items-center gap-3">
            <Tag icon={<CheckCircleFilled />} color="success">
              Exact Match (Green)
            </Tag>
            <Tag icon={<ExclamationCircleFilled />} color="warning">
              Attribute Deviation (Amber)
            </Tag>
          </div>
        )}
      </div>

      {respondedQuotes.length === 0 && (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="No Supplier Technical Responses Submitted Yet"
          description="Assigned suppliers will automatically appear in the side-by-side technical comparison matrix once they submit their item technical responses."
          className="mb-4"
        />
      )}

      <Table
        dataSource={comparisonData}
        columns={columns}
        pagination={false}
        rowKey="key"
        bordered
        className="overflow-x-auto"
      />
    </Card>
  );
};
