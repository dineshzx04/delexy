import React from 'react';
import { Table, Tag, Tooltip, Card } from 'antd';
import { CheckCircleFilled, WarningFilled, ExclamationCircleFilled } from '@ant-design/icons';
import type { RfqItem, ItemSupplierResponse } from '../../data/rfq';

interface TechnicalComparisonTableProps {
  item: RfqItem;
  responses: ItemSupplierResponse[];
}

export const TechnicalComparisonTable: React.FC<TechnicalComparisonTableProps> = ({ item, responses }) => {
  // Collect all attribute keys (manufacturing details & dynamic attributes)
  const manufacturingRows = (item.manufacturing_inputs || []).map((input) => ({
    key: input.field_id,
    name: input.field_name,
    requested: String(input.value),
    type: 'MANUFACTURING' as const,
  }));

  const dynamicRows = (item.dynamic_attributes || []).map((attr) => ({
    key: attr.attribute_id,
    name: `Category Spec (${attr.attribute_id})`,
    requested: (attr.selected_value_ids || []).join(', ') || 'Required',
    type: 'DYNAMIC' as const,
  }));

  const comparisonData = [...manufacturingRows, ...dynamicRows];

  const columns: any[] = [
    {
      title: 'Specification / Attribute',
      dataIndex: 'name',
      key: 'name',
      width: 220,
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
      width: 240,
      render: (text: string) => (
        <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
          {text}
        </div>
      ),
    },
    ...responses.map((resp) => ({
      title: (
        <div>
          <div className="font-bold text-slate-900">{resp.seller_party_name}</div>
          <div className="text-xs text-slate-500 font-normal">
            Status: <span className="font-semibold text-blue-600">{resp.status}</span>
          </div>
        </div>
      ),
      key: resp.id,
      width: 280,
      render: (_: any, record: any) => {
        // Find matching technical attribute response in latest revision round
        const latestRound = resp.technical_revision_rounds?.[resp.technical_revision_rounds.length - 1];
        const attrResp = latestRound?.supplier_response?.find((r) => r.attribute_key === record.key);

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
                <span className="font-semibold">Reason: </span>
                {attrResp.deviation_reason}
              </div>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <Card className="shadow-sm border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Technical Side-by-Side Comparison</h3>
          <p className="text-xs text-slate-500">
            Comparing requested buyer specifications against technical responses across {responses.length} assigned suppliers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tag icon={<CheckCircleFilled />} color="success">
            Exact Match (Green)
          </Tag>
          <Tag icon={<ExclamationCircleFilled />} color="warning">
            Attribute Deviation (Amber)
          </Tag>
        </div>
      </div>

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
