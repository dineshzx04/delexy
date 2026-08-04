import type { RfqItem } from './rfq.module';

export const mockRfqItems: RfqItem[] = [
  {
    id: 'rfqi-101',
    rfq_id: 'rfq-2026-1001',
    item_index: 1,
    status: 'FULLY_AWARDED',

    category_id: 'c-3-1-1',               // Flagship Smartphones
    catalog_product_id: 'prod-2',         // Galaxy S24 Ultra Platform Base
    product_name: 'Samsung Galaxy S24 Ultra Enterprise Edition',
    brand_id: 'brd-1',                    // Samsung
    manufacturer_id: 'mfg-1',             // Samsung India

    manufacturing_inputs: [
      { field_id: 'part_number', field_name: 'Part Number (MPN)', value: 'GH90-15822A' },
      { field_id: 'model_number', field_name: 'Model Number', value: 'SM-S928B/DS' },
      { field_id: 'year_of_manufacture', field_name: 'Year of Manufacture', value: 2024 },
      { field_id: 'tolerance_specs', field_name: 'Tolerance Specs', value: '±0.01 mm bezel clearance' },
      { field_id: 'surface_finish', field_name: 'Surface Finish', value: 'Anodized Titanium Frame' },
      { field_id: 'inspection_standard', field_name: 'Inspection Standard', value: 'IP68 / Knox Enterprise Security Grade' }
    ],

    height: '162.3 mm',
    width: '79.0 mm',
    length: '8.6 mm',
    weight: '232 g',

    quantity: 100,                        // Total 100 units requested
    awarded_quantity_total: 100,          // 60 (Sony) + 40 (ASUSTeK) = 100 units awarded
    unit_of_measure: 'Units',
    target_unit_price: 1000,

    dynamic_attributes: [
      { group_id: 'grp-4', attribute_id: 'attr-7', selected_value_ids: ['val-7-1'] },
      { group_id: 'grp-5', attribute_id: 'attr-9', selected_value_ids: ['val-9-1'] } // 512GB UFS 4.0
    ],

    attachments: [
      {
        id: 'att-101',
        file_name: 'Item_101_Blueprint_Drawing.pdf',
        file_url: 'https://delexy.internal/docs/Item_101_Blueprint_Drawing.pdf',
        file_type: 'application/pdf',
        file_size: '1.8 MB',
        uploaded_at: '2026-08-01T10:00:00.000Z',
      }
    ],

    seller_assignments: [
      {
        id: 'sa-101',
        rfq_item_id: 'rfqi-101',
        seller_party_id: 'pty-4',         // Sony Corp
        assignment_type: 'DIRECT_INVITATION',
        assigned_by_user_id: 'usr-2',
        assigned_at: '2026-08-01T10:00:00.000Z',
        status: 'RESPONDED',
      },
      {
        id: 'sa-102',
        rfq_item_id: 'rfqi-101',
        seller_party_id: 'pty-5',         // ASUSTeK
        assignment_type: 'DIRECT_INVITATION',
        assigned_by_user_id: 'usr-2',
        assigned_at: '2026-08-01T10:00:00.000Z',
        status: 'RESPONDED',
      }
    ],

    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-02T12:05:00.000Z',
  }
];
