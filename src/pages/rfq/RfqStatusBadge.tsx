import React from 'react';
import { Tag } from 'antd';
import type { RfqStatus, RfqItemStatus } from '../../data/rfq/rfq.module';

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
