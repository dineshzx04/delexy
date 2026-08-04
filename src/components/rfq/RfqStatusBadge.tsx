import React from 'react';
import { Tag } from 'antd';
import {
  FileTextOutlined,
  SendOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { RfqStatus, RfqItemStatus, ItemSupplierResponseStatus } from '../../data/rfq';

interface RfqStatusBadgeProps {
  status: RfqStatus;
}

export const RfqStatusBadge: React.FC<RfqStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'DRAFT':
      return <Tag icon={<FileTextOutlined />} color="default">DRAFT</Tag>;
    case 'ISSUED':
      return <Tag icon={<SendOutlined />} color="blue">ISSUED</Tag>;
    case 'UNDER_EVALUATION':
      return <Tag icon={<SyncOutlined spin />} color="processing">UNDER EVALUATION</Tag>;
    case 'PARTIALLY_AWARDED':
      return <Tag icon={<PieChartOutlined />} color="warning">PARTIALLY AWARDED</Tag>;
    case 'FULLY_AWARDED':
      return <Tag icon={<TrophyOutlined />} color="success">FULLY AWARDED</Tag>;
    case 'CLOSED':
      return <Tag icon={<CheckCircleOutlined />} color="purple">CLOSED</Tag>;
    case 'CANCELLED':
      return <Tag icon={<CloseCircleOutlined />} color="error">CANCELLED</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

interface RfqItemStatusBadgeProps {
  status: RfqItemStatus;
}

export const RfqItemStatusBadge: React.FC<RfqItemStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return <Tag icon={<SendOutlined />} color="cyan">OPEN</Tag>;
    case 'PARTIALLY_AWARDED':
      return <Tag icon={<PieChartOutlined />} color="warning">PARTIALLY AWARDED</Tag>;
    case 'FULLY_AWARDED':
      return <Tag icon={<TrophyOutlined />} color="success">FULLY AWARDED</Tag>;
    case 'CANCELLED':
      return <Tag icon={<CloseCircleOutlined />} color="error">CANCELLED</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

interface ItemSupplierStatusBadgeProps {
  status: ItemSupplierResponseStatus;
}

export const ItemSupplierStatusBadge: React.FC<ItemSupplierStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ASSIGNED':
      return <Tag icon={<ClockCircleOutlined />} color="default">ASSIGNED</Tag>;
    case 'VIEWED':
      return <Tag icon={<ClockCircleOutlined />} color="blue">VIEWED</Tag>;
    case 'TECHNICAL_SUBMITTED':
      return <Tag icon={<SyncOutlined spin />} color="processing">TECH SUBMITTED</Tag>;
    case 'TECHNICAL_REVISION_REQUESTED':
      return <Tag icon={<SyncOutlined />} color="volcano">TECH REVISION REQUESTED</Tag>;
    case 'TECHNICAL_APPROVED':
      return <Tag icon={<SafetyCertificateOutlined />} color="geekblue">TECH APPROVED</Tag>;
    case 'PRODUCT_MAPPED':
      return <Tag icon={<CheckCircleOutlined />} color="purple">PRODUCT MAPPED</Tag>;
    case 'COMMERCIAL_UNDER_NEGOTIATION':
      return <Tag icon={<DollarOutlined />} color="gold">NEGOTIATING</Tag>;
    case 'COMMERCIAL_FINALIZED':
      return <Tag icon={<DollarOutlined />} color="lime">TERMS FINALIZED</Tag>;
    case 'AWARDED':
      return <Tag icon={<TrophyOutlined />} color="success">AWARDED</Tag>;
    case 'REJECTED':
      return <Tag icon={<CloseCircleOutlined />} color="error">REJECTED</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};
