import type { Attribute } from './catalog.module';

export const mockAttributes: Attribute[] = [
  // Gaming Laptops
  { id: 'attr-1', name: 'Chassis Color', code: 'color', label: 'Chassis Color', type: 'select', valueIds: ['val-1-1', 'val-1-2'] },
  { id: 'attr-2', name: 'Operating System', code: 'os', label: 'Operating System', type: 'select', valueIds: ['val-2-1', 'val-2-2'] },
  { id: 'attr-3', name: 'RAM Capacity', code: 'ram', label: 'RAM Capacity', type: 'select', valueIds: ['val-3-1', 'val-3-2'] },
  { id: 'attr-4', name: 'Graphics Card', code: 'gpu', label: 'Graphics Card', type: 'select', valueIds: ['val-4-1', 'val-4-2'] },
  { id: 'attr-5', name: 'Screen Size', code: 'screen_size', label: 'Screen Size', type: 'select', valueIds: ['val-5-1', 'val-5-2'] },
  { id: 'attr-6', name: 'Refresh Rate', code: 'refresh_rate', label: 'Refresh Rate', type: 'select', valueIds: ['val-6-1', 'val-6-2'] },

  // Smartphones
  { id: 'attr-7', name: 'Exterior Finish', code: 'finish', label: 'Exterior Finish', type: 'select', valueIds: ['val-7-1', 'val-7-2'] },
  { id: 'attr-8', name: 'Water Resistance', code: 'ip_rating', label: 'Water Resistance', type: 'select', valueIds: ['val-8-1'] },
  { id: 'attr-9', name: 'Storage Capacity', code: 'internal_storage', label: 'Storage Capacity', type: 'select', valueIds: ['val-9-1', 'val-9-2'] },
  { id: 'attr-10', name: 'Processor Chipset', code: 'soc', label: 'Processor Chipset', type: 'select', valueIds: ['val-10-1'] },
  { id: 'attr-11', name: 'Main Camera Resolution', code: 'main_sensor', label: 'Main Camera Resolution', type: 'select', valueIds: ['val-11-1'] },
  { id: 'attr-12', name: 'Telephoto Zoom', code: 'zoom_type', label: 'Telephoto Zoom', type: 'select', valueIds: ['val-12-1'] },

  // Running Shoes
  { id: 'attr-13', name: 'US Shoe Size', code: 'shoe_size', label: 'US Shoe Size', type: 'select', valueIds: ['val-13-1', 'val-13-2'] },
  { id: 'attr-14', name: 'Shoe Width', code: 'width', label: 'Shoe Width', type: 'select', valueIds: ['val-14-1'] },
  { id: 'attr-15', name: 'Upper Material', code: 'upper_material', label: 'Upper Material', type: 'select', valueIds: ['val-15-1'] },
  { id: 'attr-16', name: 'Outsole Rubber', code: 'sole_type', label: 'Outsole Rubber', type: 'select', valueIds: ['val-16-1'] },
  { id: 'attr-17', name: 'Arch Support', code: 'arch_support', label: 'Arch Support', type: 'select', valueIds: ['val-17-1'] },
  { id: 'attr-18', name: 'Cushion Level', code: 'cushioning', label: 'Cushion Level', type: 'select', valueIds: ['val-18-1'] },

  // Mirrorless Cameras
  { id: 'attr-19', name: 'Body Edition', code: 'body_color', label: 'Body Edition', type: 'select', valueIds: ['val-19-1'] },
  { id: 'attr-20', name: 'Grip Style', code: 'grip_type', label: 'Grip Style', type: 'select', valueIds: ['val-20-1'] },
  { id: 'attr-21', name: 'Sensor Megapixels', code: 'sensor_res', label: 'Sensor Megapixels', type: 'select', valueIds: ['val-21-1'] },
  { id: 'attr-22', name: 'Max Native ISO', code: 'iso_range', label: 'Max Native ISO', type: 'select', valueIds: ['val-22-1'] },
  { id: 'attr-23', name: 'Max Video Resolution', code: 'video_res', label: 'Max Video Resolution', type: 'select', valueIds: ['val-23-1'] },
  { id: 'attr-24', name: 'Continuous Burst FPS', code: 'burst_rate', label: 'Continuous Burst FPS', type: 'select', valueIds: ['val-24-1'] }
];
