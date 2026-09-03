import React from 'react';
import { Tag } from 'antd';
import type { RfqStatus, RfqItemStatus, SellerQuoteStatus } from '../../data/rfq/rfq.module';

export const RfqStatusBadge: React.FC<{ status: RfqStatus }> = ({ status }) => {
  let color = 'default';
  if (status === 'DRAFT') color = 'default';
  if (status === 'ISSUED') color = 'blue';
  if (status === 'IN_PROGRESS') color = 'processing';
  if (status === 'EVALUATING') color = 'warning';
  if (status === 'AWARDED') color = 'success';
  if (status === 'CLOSED') color = 'success';
  if (status === 'CANCELLED') color = 'error';

  return <Tag color={color}>{status}</Tag>;
};

export const RfqItemStatusBadge: React.FC<{ status: RfqItemStatus }> = ({ status }) => {
  let color = 'default';
  if (status === 'OPEN') color = 'blue';
  if (status === 'AWARDED') color = 'success';
  if (status === 'CANCELLED') color = 'error';

  return <Tag color={color}>{status}</Tag>;
};

export const RFQQuoteStatusBadge: React.FC<{ status?: SellerQuoteStatus | null }> = ({ status }) => {
  if (!status) return "N/A"
  let color = 'default';
  if (status === 'DRAFT') color = 'default';
  if (status === 'SUBMITTED') color = 'blue';
  if (status === 'REVISION_REQUIRED') color = 'warning';
  if (status === 'DEVIATION_ACCEPTED') color = 'success';
  if (status === 'PRODUCT_SUBMIT_REVISION') color = 'processing';
  if (status === 'FINAL_ACKNOWLEDGE') color = 'success';
  if (status === 'REJECTED') color = 'error';

  return <Tag color={color}>{status}</Tag>;
};
