import React from 'react';
import { Table, Tag, Tooltip, Card, Alert, Button, Space } from 'antd';
import {
  CheckCircleFilled,
  WarningFilled,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  CheckCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import type { RfqItem, ItemSupplierResponse } from '../../data/rfq';
import { catalogDb } from '../../data/catalog/catalog.db';
import { businessDb } from '../../data/business/business.db';

interface TechnicalComparisonTableProps {
  item: RfqItem;
  responses: ItemSupplierResponse[];
  onReviewTechnical?: (response: ItemSupplierResponse) => void;
}

export const TechnicalComparisonTable: React.FC<TechnicalComparisonTableProps> = ({
  item,
  responses,
  onReviewTechnical,
}) => {
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray(), []) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];
  const allBrands = useLiveQuery(() => businessDb.brands.toArray(), []) || [];
  const allManufacturers = useLiveQuery(() => businessDb.manufacturers.toArray(), []) || [];

  // Filter only suppliers who have actually submitted a response
  const respondedSuppliers = responses.filter(
    (resp) =>
      (resp.technical_revision_rounds && resp.technical_revision_rounds.length > 0) ||
      ['TECHNICAL_SUBMITTED', 'COMMERCIAL_SUBMITTED', 'ACCEPTED', 'COMMERCIAL_UNDER_REVIEW', 'TECHNICAL_APPROVED', 'COMMERCIAL_UNDER_NEGOTIATION'].includes(resp.status)
  );

  // Construct comprehensive specification rows ordered matching RfqCreateWizard.tsx
  const requestedBrandName = Array.isArray(item.brand_id)
    ? item.brand_id.map((bId) => allBrands.find((b) => b.id === bId)?.name || bId).join(', ')
    : allBrands.find((b) => b.id === item.brand_id)?.name || item.brand_id || 'Unspecified';

  const requestedMfgName = Array.isArray(item.manufacturer_id)
    ? item.manufacturer_id.map((mId) => allManufacturers.find((m) => m.id === mId)?.company_name || mId).join(', ')
    : allManufacturers.find((m) => m.id === item.manufacturer_id)?.company_name || item.manufacturer_id || 'Unspecified';

  const brandRow = (item.brand_id && (Array.isArray(item.brand_id) ? item.brand_id.length > 0 : true))
    ? [{ key: 'static-brand', name: 'Preferred Brand', requested: requestedBrandName }]
    : [];

  const mfgRow = (item.manufacturer_id && (Array.isArray(item.manufacturer_id) ? item.manufacturer_id.length > 0 : true))
    ? [{ key: 'static-mfg', name: 'Preferred Manufacturer', requested: requestedMfgName }]
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

  const sellerColumns: any[] = respondedSuppliers.map((resp) => ({
    title: (
      <div className="space-y-1">
        <div className="font-bold text-slate-900">{resp.seller_party_name}</div>
        <div className="text-xs text-slate-500 font-normal">
          Status: <span className="font-semibold text-blue-600">{resp.status}</span>
        </div>

        {/* Supplier Header Actions */}
        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
          {onReviewTechnical && (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<CheckCircleOutlined />}
              onClick={() => onReviewTechnical(resp)}
              className="text-[11px] h-6 px-2"
            >
              Review Tech
            </Button>
          )}
        </div>
      </div>
    ),
    key: resp.id,
    width: 320,
    render: (_: any, record: any) => {
      // Find matching technical attribute response in latest revision round
      const latestRound = resp.technical_revision_rounds?.[resp.technical_revision_rounds.length - 1];
      const attrResp = latestRound?.supplier_response?.find(
        (r) => r.attribute_key === record.key || r.attribute_key === record.key.replace(/^dyn-/, '')
      );

      if (!attrResp) {
        return <span className="text-slate-400 italic">No response submitted</span>;
      }

      const isDeviated = attrResp.is_deviated;
      const offeredVal = String(attrResp.offered_value);

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
              <Tooltip title={`Deviation: ${attrResp.deviation_reason || 'Specified alternative grade'}`}>
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

          {attrResp.deviation_reason && (
            <div className="mt-1.5 text-xs text-amber-700 bg-amber-100/60 p-1.5 rounded border border-amber-200">
              <span className="font-semibold">Supplier Note: </span>
              {attrResp.deviation_reason}
            </div>
          )}

          {attrResp.buyer_comment && (
            <div className="mt-1 text-[11px] text-blue-800 bg-blue-50 p-1.5 rounded border border-blue-200">
              <span className="font-semibold">Buyer Comment: </span>
              {attrResp.buyer_comment}
            </div>
          )}
        </div>
      );
    },
  }));

  const columns = [...baseColumns, ...sellerColumns];

  return (
    <Card className="shadow-sm border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {respondedSuppliers.length > 0 ? 'Technical Side-by-Side Comparison' : 'Item Specifications & Requirements'}
          </h3>
          <p className="text-xs text-slate-500">
            {respondedSuppliers.length > 0
              ? `Comparing requested buyer specifications against technical responses across ${respondedSuppliers.length} responded supplier(s).`
              : 'Detailed specification tree and buyer target requirements for this line item.'}
          </p>
        </div>
        {respondedSuppliers.length > 0 && (
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

      {respondedSuppliers.length === 0 && (
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
