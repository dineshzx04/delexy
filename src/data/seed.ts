import { db } from './db';

export const seedDatabase = async () => {
  try {
    // Check if already seeded by looking for workspaces
    const count = await db.workspaces.count();
    if (count > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding Mock Database...');

    // 1. Seed Workspaces
    const workspaces = [
      { id: 'ind-1', name: 'John Personal', type: 'individual' as const, role: 'Individual User' },
      { id: 'org-1', name: 'ABC Engineering Pvt Ltd', type: 'tenant' as const, role: 'Organization Owner' },
      { id: 'org-2', name: 'XYZ Manufacturing Ltd', type: 'tenant' as const, role: 'Procurement Manager' },
      { id: 'org-3', name: 'Global Suppliers Inc', type: 'tenant' as const, role: 'Supplier' },
      { id: 'plat-1', name: 'Platform Workspace', type: 'platform' as const, role: 'System Administrator' },
    ];
    await db.workspaces.bulkAdd(workspaces);

    // 2. Seed Attribute Values
    const values = [
      { id: 'val-1', value: 'Value 1' },
      { id: 'val-2', value: 'Value 2' },
      { id: 'val-3', value: 'Value 3' },
      { id: 'val-4', value: 'Value 4' },
      { id: 'val-5', value: 'Value 5' },
      { id: 'val-6', value: 'Value 6' },
      { id: 'val-7', value: 'Value 7' },
      { id: 'val-8', value: 'Value 8' },
      { id: 'val-9', value: 'Value 9' },
      { id: 'val-10', value: 'Value 10' },
      { id: 'val-11', value: 'Value 11' },
      { id: 'val-12', value: 'Value 12' },
      { id: 'val-13', value: 'Value 13' },
      { id: 'val-14', value: 'Value 14' },
      { id: 'val-15', value: 'Value 15' },
      { id: 'val-16', value: 'Value 16' },
      { id: 'val-17', value: 'Value 17' },
      { id: 'val-18', value: 'Value 18' },
      { id: 'val-19', value: 'Value 19' },
      { id: 'val-20', value: 'Value 20' },
      { id: 'val-21', value: 'Value 21' },
      { id: 'val-22', value: 'Value 22' },
      { id: 'val-23', value: 'Value 23' },
      { id: 'val-24', value: 'Value 24' },
      { id: 'val-25', value: 'Value 25' },
      { id: 'val-26', value: 'Value 26' },
      { id: 'val-27', value: 'Value 27' },
      { id: 'val-28', value: 'Value 28' },
      { id: 'val-29', value: 'Value 29' },
      { id: 'val-30', value: 'Value 30' },
      { id: 'val-31', value: 'Value 31' },
      { id: 'val-32', value: 'Value 32' },
      { id: 'val-33', value: 'Value 33' },
      { id: 'val-34', value: 'Value 34' },
      { id: 'val-35', value: 'Value 35' },
      { id: 'val-36', value: 'Value 36' },
      { id: 'val-37', value: 'Value 37' },
      { id: 'val-38', value: 'Value 38' },
      { id: 'val-39', value: 'Value 39' },
      { id: 'val-40', value: 'Value 40' },
      { id: 'val-41', value: 'Value 41' },
      { id: 'val-42', value: 'Value 42' },
      { id: 'val-43', value: 'Value 43' },
      { id: 'val-44', value: 'Value 44' },
      { id: 'val-45', value: 'Value 45' },
      { id: 'val-46', value: 'Value 46' },
      { id: 'val-47', value: 'Value 47' },
      { id: 'val-48', value: 'Value 48' },
      { id: 'val-49', value: 'Value 49' },
      { id: 'val-50', value: 'Value 50' },
      { id: 'val-51', value: 'Value 51' },
      { id: 'val-52', value: 'Value 52' },
      { id: 'val-53', value: 'Value 53' },
      { id: 'val-54', value: 'Value 54' },
      { id: 'val-55', value: 'Value 55' },
      { id: 'val-56', value: 'Value 56' },
      { id: 'val-57', value: 'Value 57' },
      { id: 'val-58', value: 'Value 58' },
      { id: 'val-59', value: 'Value 59' },
      { id: 'val-60', value: 'Value 60' },
      { id: 'val-61', value: 'Value 61' },
      { id: 'val-62', value: 'Value 62' },
      { id: 'val-63', value: 'Value 63' },
      { id: 'val-64', value: 'Value 64' },
      { id: 'val-65', value: 'Value 65' },
      { id: 'val-66', value: 'Value 66' },
      { id: 'val-67', value: 'Value 67' },
      { id: 'val-68', value: 'Value 68' },
      { id: 'val-69', value: 'Value 69' },
      { id: 'val-70', value: 'Value 70' },
      { id: 'val-71', value: 'Value 71' },
      { id: 'val-72', value: 'Value 72' },
      { id: 'val-73', value: 'Value 73' },
      { id: 'val-74', value: 'Value 74' },
      { id: 'val-75', value: 'Value 75' },
      { id: 'val-76', value: 'Value 76' },
      { id: 'val-77', value: 'Value 77' },
      { id: 'val-78', value: 'Value 78' },
      { id: 'val-79', value: 'Value 79' },
      { id: 'val-80', value: 'Value 80' },
      { id: 'val-81', value: 'Value 81' },
      { id: 'val-82', value: 'Value 82' },
      { id: 'val-83', value: 'Value 83' },
      { id: 'val-84', value: 'Value 84' },
      { id: 'val-85', value: 'Value 85' },
      { id: 'val-86', value: 'Value 86' },
      { id: 'val-87', value: 'Value 87' },
      { id: 'val-88', value: 'Value 88' },
      { id: 'val-89', value: 'Value 89' },
      { id: 'val-90', value: 'Value 90' },
      { id: 'val-91', value: 'Value 91' },
      { id: 'val-92', value: 'Value 92' },
      { id: 'val-93', value: 'Value 93' },
      { id: 'val-94', value: 'Value 94' },
      { id: 'val-95', value: 'Value 95' },
      { id: 'val-96', value: 'Value 96' },
      { id: 'val-97', value: 'Value 97' },
      { id: 'val-98', value: 'Value 98' },
      { id: 'val-99', value: 'Value 99' },
      { id: 'val-100', value: 'Value 100' },
      { id: 'val-101', value: 'Value 101' },
      { id: 'val-102', value: 'Value 102' },
      { id: 'val-103', value: 'Value 103' },
      { id: 'val-104', value: 'Value 104' },
      { id: 'val-105', value: 'Value 105' },
      { id: 'val-106', value: 'Value 106' },
      { id: 'val-107', value: 'Value 107' },
      { id: 'val-108', value: 'Value 108' },
      { id: 'val-109', value: 'Value 109' },
      { id: 'val-110', value: 'Value 110' },
      { id: 'val-111', value: 'Value 111' },
      { id: 'val-112', value: 'Value 112' },
      { id: 'val-113', value: 'Value 113' },
      { id: 'val-114', value: 'Value 114' },
      { id: 'val-115', value: 'Value 115' },
      { id: 'val-116', value: 'Value 116' },
      { id: 'val-117', value: 'Value 117' },
      { id: 'val-118', value: 'Value 118' },
      { id: 'val-119', value: 'Value 119' },
      { id: 'val-120', value: 'Value 120' }
    ];
    await db.attributeValues.bulkAdd(values);

    // 3. Seed Attributes
    const attributes = [
      { id: 'attr-1', name: 'Attribute 1', type: 'select' as const, valueIds: ['val-1', 'val-2', 'val-3'] },
      { id: 'attr-2', name: 'Attribute 2', type: 'select' as const, valueIds: ['val-4', 'val-5', 'val-6'] },
      { id: 'attr-3', name: 'Attribute 3', type: 'select' as const, valueIds: ['val-7', 'val-8', 'val-9'] },
      { id: 'attr-4', name: 'Attribute 4', type: 'select' as const, valueIds: ['val-10', 'val-11', 'val-12'] },
      { id: 'attr-5', name: 'Attribute 5', type: 'select' as const, valueIds: ['val-13', 'val-14', 'val-15'] },
      { id: 'attr-6', name: 'Attribute 6', type: 'select' as const, valueIds: ['val-16', 'val-17', 'val-18'] },
      { id: 'attr-7', name: 'Attribute 7', type: 'select' as const, valueIds: ['val-19', 'val-20', 'val-21'] },
      { id: 'attr-8', name: 'Attribute 8', type: 'select' as const, valueIds: ['val-22', 'val-23', 'val-24'] },
      { id: 'attr-9', name: 'Attribute 9', type: 'select' as const, valueIds: ['val-25', 'val-26', 'val-27'] },
      { id: 'attr-10', name: 'Attribute 10', type: 'select' as const, valueIds: ['val-28', 'val-29', 'val-30'] },
      { id: 'attr-11', name: 'Attribute 11', type: 'select' as const, valueIds: ['val-31', 'val-32', 'val-33'] },
      { id: 'attr-12', name: 'Attribute 12', type: 'select' as const, valueIds: ['val-34', 'val-35', 'val-36'] },
      { id: 'attr-13', name: 'Attribute 13', type: 'select' as const, valueIds: ['val-37', 'val-38', 'val-39'] },
      { id: 'attr-14', name: 'Attribute 14', type: 'select' as const, valueIds: ['val-40', 'val-41', 'val-42'] },
      { id: 'attr-15', name: 'Attribute 15', type: 'select' as const, valueIds: ['val-43', 'val-44', 'val-45'] },
      { id: 'attr-16', name: 'Attribute 16', type: 'select' as const, valueIds: ['val-46', 'val-47', 'val-48'] },
      { id: 'attr-17', name: 'Attribute 17', type: 'select' as const, valueIds: ['val-49', 'val-50', 'val-51'] },
      { id: 'attr-18', name: 'Attribute 18', type: 'select' as const, valueIds: ['val-52', 'val-53', 'val-54'] },
      { id: 'attr-19', name: 'Attribute 19', type: 'select' as const, valueIds: ['val-55', 'val-56', 'val-57'] },
      { id: 'attr-20', name: 'Attribute 20', type: 'select' as const, valueIds: ['val-58', 'val-59', 'val-60'] },
      { id: 'attr-21', name: 'Attribute 21', type: 'select' as const, valueIds: ['val-61', 'val-62', 'val-63'] },
      { id: 'attr-22', name: 'Attribute 22', type: 'select' as const, valueIds: ['val-64', 'val-65', 'val-66'] },
      { id: 'attr-23', name: 'Attribute 23', type: 'select' as const, valueIds: ['val-67', 'val-68', 'val-69'] },
      { id: 'attr-24', name: 'Attribute 24', type: 'select' as const, valueIds: ['val-70', 'val-71', 'val-72'] },
      { id: 'attr-25', name: 'Attribute 25', type: 'select' as const, valueIds: ['val-73', 'val-74', 'val-75'] },
      { id: 'attr-26', name: 'Attribute 26', type: 'select' as const, valueIds: ['val-76', 'val-77', 'val-78'] },
      { id: 'attr-27', name: 'Attribute 27', type: 'select' as const, valueIds: ['val-79', 'val-80', 'val-81'] },
      { id: 'attr-28', name: 'Attribute 28', type: 'select' as const, valueIds: ['val-82', 'val-83', 'val-84'] },
      { id: 'attr-29', name: 'Attribute 29', type: 'select' as const, valueIds: ['val-85', 'val-86', 'val-87'] },
      { id: 'attr-30', name: 'Attribute 30', type: 'select' as const, valueIds: ['val-88', 'val-89', 'val-90'] },
      { id: 'attr-31', name: 'Attribute 31', type: 'select' as const, valueIds: ['val-91', 'val-92', 'val-93'] },
      { id: 'attr-32', name: 'Attribute 32', type: 'select' as const, valueIds: ['val-94', 'val-95', 'val-96'] },
      { id: 'attr-33', name: 'Attribute 33', type: 'select' as const, valueIds: ['val-97', 'val-98', 'val-99'] },
      { id: 'attr-34', name: 'Attribute 34', type: 'select' as const, valueIds: ['val-100', 'val-101', 'val-102'] },
      { id: 'attr-35', name: 'Attribute 35', type: 'select' as const, valueIds: ['val-103', 'val-104', 'val-105'] },
      { id: 'attr-36', name: 'Attribute 36', type: 'select' as const, valueIds: ['val-106', 'val-107', 'val-108'] },
      { id: 'attr-37', name: 'Attribute 37', type: 'select' as const, valueIds: ['val-109', 'val-110', 'val-111'] },
      { id: 'attr-38', name: 'Attribute 38', type: 'select' as const, valueIds: ['val-112', 'val-113', 'val-114'] },
      { id: 'attr-39', name: 'Attribute 39', type: 'select' as const, valueIds: ['val-115', 'val-116', 'val-117'] },
      { id: 'attr-40', name: 'Attribute 40', type: 'select' as const, valueIds: ['val-118', 'val-119', 'val-120'] }
    ];
    await db.attributes.bulkAdd(attributes);

    // 4. Seed Attribute Groups
    const groups = [
      { id: 'g1', name: 'Group 1', attributeIds: ['attr-1', 'attr-2'] },
      { id: 'g2', name: 'Group 2', attributeIds: ['attr-3', 'attr-4'] },
      { id: 'g3', name: 'Group 3', attributeIds: ['attr-5', 'attr-6'] },
      { id: 'g4', name: 'Group 4', attributeIds: ['attr-7', 'attr-8'] },
      { id: 'g5', name: 'Group 5', attributeIds: ['attr-9', 'attr-10'] },
      { id: 'g6', name: 'Group 6', attributeIds: ['attr-11', 'attr-12'] },
      { id: 'g7', name: 'Group 7', attributeIds: ['attr-13', 'attr-14'] },
      { id: 'g8', name: 'Group 8', attributeIds: ['attr-15', 'attr-16'] },
      { id: 'g9', name: 'Group 9', attributeIds: ['attr-17', 'attr-18'] },
      { id: 'g10', name: 'Group 10', attributeIds: ['attr-19', 'attr-20'] },
      { id: 'g11', name: 'Group 11', attributeIds: ['attr-21', 'attr-22'] },
      { id: 'g12', name: 'Group 12', attributeIds: ['attr-23', 'attr-24'] },
      { id: 'g13', name: 'Group 13', attributeIds: ['attr-25', 'attr-26'] },
      { id: 'g14', name: 'Group 14', attributeIds: ['attr-27', 'attr-28'] },
      { id: 'g15', name: 'Group 15', attributeIds: ['attr-29', 'attr-30'] },
      { id: 'g16', name: 'Group 16', attributeIds: ['attr-31', 'attr-32'] },
      { id: 'g17', name: 'Group 17', attributeIds: ['attr-33', 'attr-34'] },
      { id: 'g18', name: 'Group 18', attributeIds: ['attr-35', 'attr-36'] },
      { id: 'g19', name: 'Group 19', attributeIds: ['attr-37', 'attr-38'] },
      { id: 'g20', name: 'Group 20', attributeIds: ['attr-39', 'attr-40'] }
    ];
    await db.attributeGroups.bulkAdd(groups);

    // 5. Seed Categories
    const categories = [
      { id: 'c-1', name: 'Engineering', slug: 'engineering', isActive: true, parentId: null, mappedGroupIds: [] },
      { id: 'c-1-1', name: 'Mechanical', slug: 'mechanical', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
      { id: 'c-1-1-1', name: 'Motors & Drives', slug: 'motors-drives', isActive: true, parentId: 'c-1-1', mappedGroupIds: [] },
      { id: 'c-1-1-1-1', name: 'AC Motors', slug: 'ac-motors', isActive: true, parentId: 'c-1-1-1', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-1-1-1-2', name: 'DC Motors', slug: 'dc-motors', isActive: true, parentId: 'c-1-1-1', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-1-1-1-3', name: 'Servo Motors', slug: 'servo-motors', isActive: true, parentId: 'c-1-1-1', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-1-1-2', name: 'Pumps', slug: 'pumps', isActive: true, parentId: 'c-1-1', mappedGroupIds: [] },
      { id: 'c-1-1-2-1', name: 'Centrifugal Pumps', slug: 'centrifugal-pumps', isActive: true, parentId: 'c-1-1-2', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-1-1-2-2', name: 'Positive Displacement Pumps', slug: 'positive-displacement-pumps', isActive: true, parentId: 'c-1-1-2', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-1-1-2-3', name: 'Submersible Pumps', slug: 'submersible-pumps', isActive: true, parentId: 'c-1-1-2', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-1-1-3', name: 'Valves', slug: 'valves', isActive: true, parentId: 'c-1-1', mappedGroupIds: [] },
      { id: 'c-1-1-3-1', name: 'Gate Valves', slug: 'gate-valves', isActive: true, parentId: 'c-1-1-3', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-1-1-3-2', name: 'Ball Valves', slug: 'ball-valves', isActive: true, parentId: 'c-1-1-3', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-1-1-3-3', name: 'Check Valves', slug: 'check-valves', isActive: true, parentId: 'c-1-1-3', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-1-2', name: 'Electrical', slug: 'electrical', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
      { id: 'c-1-2-1', name: 'Power Distribution', slug: 'power-distribution', isActive: true, parentId: 'c-1-2', mappedGroupIds: [] },
      { id: 'c-1-2-1-1', name: 'Transformers', slug: 'transformers', isActive: true, parentId: 'c-1-2-1', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-1-2-1-2', name: 'Circuit Breakers', slug: 'circuit-breakers', isActive: true, parentId: 'c-1-2-1', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-1-2-1-3', name: 'Switchgears', slug: 'switchgears', isActive: true, parentId: 'c-1-2-1', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-1-2-2', name: 'Cables & Wires', slug: 'cables-wires', isActive: true, parentId: 'c-1-2', mappedGroupIds: [] },
      { id: 'c-1-2-2-1', name: 'Copper Cables', slug: 'copper-cables', isActive: true, parentId: 'c-1-2-2', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-1-2-2-2', name: 'Aluminum Cables', slug: 'aluminum-cables', isActive: true, parentId: 'c-1-2-2', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-1-2-2-3', name: 'Fiber Optic', slug: 'fiber-optic', isActive: true, parentId: 'c-1-2-2', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-1-2-3', name: 'Lighting', slug: 'lighting', isActive: true, parentId: 'c-1-2', mappedGroupIds: [] },
      { id: 'c-1-2-3-1', name: 'LED Modules', slug: 'led-modules', isActive: true, parentId: 'c-1-2-3', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-1-2-3-2', name: 'Fluorescent', slug: 'fluorescent', isActive: true, parentId: 'c-1-2-3', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-1-2-3-3', name: 'Halogen', slug: 'halogen', isActive: true, parentId: 'c-1-2-3', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-1-3', name: 'Civil', slug: 'civil', isActive: true, parentId: 'c-1', mappedGroupIds: [] },
      { id: 'c-1-3-1', name: 'Structural', slug: 'structural', isActive: true, parentId: 'c-1-3', mappedGroupIds: [] },
      { id: 'c-1-3-1-1', name: 'Steel Beams', slug: 'steel-beams', isActive: true, parentId: 'c-1-3-1', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-1-3-1-2', name: 'Columns', slug: 'columns', isActive: true, parentId: 'c-1-3-1', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-1-3-1-3', name: 'Trusses', slug: 'trusses', isActive: true, parentId: 'c-1-3-1', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-1-3-2', name: 'Materials', slug: 'materials', isActive: true, parentId: 'c-1-3', mappedGroupIds: [] },
      { id: 'c-1-3-2-1', name: 'Concrete', slug: 'concrete', isActive: true, parentId: 'c-1-3-2', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-1-3-2-2', name: 'Cement', slug: 'cement', isActive: true, parentId: 'c-1-3-2', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-1-3-2-3', name: 'Asphalt', slug: 'asphalt', isActive: true, parentId: 'c-1-3-2', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-1-3-3', name: 'Surveying', slug: 'surveying', isActive: true, parentId: 'c-1-3', mappedGroupIds: [] },
      { id: 'c-1-3-3-1', name: 'Theodolites', slug: 'theodolites', isActive: true, parentId: 'c-1-3-3', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-1-3-3-2', name: 'Levels', slug: 'levels', isActive: true, parentId: 'c-1-3-3', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-1-3-3-3', name: 'Total Stations', slug: 'total-stations', isActive: true, parentId: 'c-1-3-3', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-2', name: 'Manufacturing', slug: 'manufacturing', isActive: true, parentId: null, mappedGroupIds: [] },
      { id: 'c-2-1', name: 'Machining', slug: 'machining', isActive: true, parentId: 'c-2', mappedGroupIds: [] },
      { id: 'c-2-1-1', name: 'Milling', slug: 'milling', isActive: true, parentId: 'c-2-1', mappedGroupIds: [] },
      { id: 'c-2-1-1-1', name: 'CNC Milling', slug: 'cnc-milling', isActive: true, parentId: 'c-2-1-1', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-2-1-1-2', name: 'Manual Milling', slug: 'manual-milling', isActive: true, parentId: 'c-2-1-1', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-2-1-1-3', name: 'Vertical Milling', slug: 'vertical-milling', isActive: true, parentId: 'c-2-1-1', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-2-1-2', name: 'Turning', slug: 'turning', isActive: true, parentId: 'c-2-1', mappedGroupIds: [] },
      { id: 'c-2-1-2-1', name: 'CNC Lathes', slug: 'cnc-lathes', isActive: true, parentId: 'c-2-1-2', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-2-1-2-2', name: 'Manual Lathes', slug: 'manual-lathes', isActive: true, parentId: 'c-2-1-2', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-2-1-2-3', name: 'Swiss Lathes', slug: 'swiss-lathes', isActive: true, parentId: 'c-2-1-2', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-2-1-3', name: 'Drilling', slug: 'drilling', isActive: true, parentId: 'c-2-1', mappedGroupIds: [] },
      { id: 'c-2-1-3-1', name: 'Drill Presses', slug: 'drill-presses', isActive: true, parentId: 'c-2-1-3', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-2-1-3-2', name: 'Radial Drills', slug: 'radial-drills', isActive: true, parentId: 'c-2-1-3', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-2-1-3-3', name: 'Magnetic Drills', slug: 'magnetic-drills', isActive: true, parentId: 'c-2-1-3', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-2-2', name: 'Welding', slug: 'welding', isActive: true, parentId: 'c-2', mappedGroupIds: [] },
      { id: 'c-2-2-1', name: 'Arc Welding', slug: 'arc-welding', isActive: true, parentId: 'c-2-2', mappedGroupIds: [] },
      { id: 'c-2-2-1-1', name: 'MIG', slug: 'mig', isActive: true, parentId: 'c-2-2-1', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-2-2-1-2', name: 'TIG', slug: 'tig', isActive: true, parentId: 'c-2-2-1', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-2-2-1-3', name: 'Stick', slug: 'stick', isActive: true, parentId: 'c-2-2-1', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-2-2-2', name: 'Gas Welding', slug: 'gas-welding', isActive: true, parentId: 'c-2-2', mappedGroupIds: [] },
      { id: 'c-2-2-2-1', name: 'Oxy-Fuel', slug: 'oxy-fuel', isActive: true, parentId: 'c-2-2-2', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-2-2-2-2', name: 'Air-Acetylene', slug: 'air-acetylene', isActive: true, parentId: 'c-2-2-2', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-2-2-2-3', name: 'Propane', slug: 'propane', isActive: true, parentId: 'c-2-2-2', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-2-2-3', name: 'Laser Welding', slug: 'laser-welding', isActive: true, parentId: 'c-2-2', mappedGroupIds: [] },
      { id: 'c-2-2-3-1', name: 'Fiber Laser', slug: 'fiber-laser', isActive: true, parentId: 'c-2-2-3', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-2-2-3-2', name: 'Nd:YAG Laser', slug: 'nd-yag-laser', isActive: true, parentId: 'c-2-2-3', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-2-2-3-3', name: 'CO2 Laser', slug: 'co2-laser', isActive: true, parentId: 'c-2-2-3', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-2-3', name: 'Assembly', slug: 'assembly', isActive: true, parentId: 'c-2', mappedGroupIds: [] },
      { id: 'c-2-3-1', name: 'Fastening', slug: 'fastening', isActive: true, parentId: 'c-2-3', mappedGroupIds: [] },
      { id: 'c-2-3-1-1', name: 'Bolts', slug: 'bolts', isActive: true, parentId: 'c-2-3-1', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-2-3-1-2', name: 'Screws', slug: 'screws', isActive: true, parentId: 'c-2-3-1', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-2-3-1-3', name: 'Rivets', slug: 'rivets', isActive: true, parentId: 'c-2-3-1', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-2-3-2', name: 'Adhesives', slug: 'adhesives', isActive: true, parentId: 'c-2-3', mappedGroupIds: [] },
      { id: 'c-2-3-2-1', name: 'Epoxy', slug: 'epoxy', isActive: true, parentId: 'c-2-3-2', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-2-3-2-2', name: 'Silicone', slug: 'silicone', isActive: true, parentId: 'c-2-3-2', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-2-3-2-3', name: 'Polyurethane', slug: 'polyurethane', isActive: true, parentId: 'c-2-3-2', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-2-3-3', name: 'Automation', slug: 'automation', isActive: true, parentId: 'c-2-3', mappedGroupIds: [] },
      { id: 'c-2-3-3-1', name: 'Robotic Arms', slug: 'robotic-arms', isActive: true, parentId: 'c-2-3-3', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-2-3-3-2', name: 'Conveyors', slug: 'conveyors', isActive: true, parentId: 'c-2-3-3', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-2-3-3-3', name: 'Sensors', slug: 'sensors', isActive: true, parentId: 'c-2-3-3', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-3', name: 'Construction', slug: 'construction', isActive: true, parentId: null, mappedGroupIds: [] },
      { id: 'c-3-1', name: 'Heavy Equipment', slug: 'heavy-equipment', isActive: true, parentId: 'c-3', mappedGroupIds: [] },
      { id: 'c-3-1-1', name: 'Earthmoving', slug: 'earthmoving', isActive: true, parentId: 'c-3-1', mappedGroupIds: [] },
      { id: 'c-3-1-1-1', name: 'Excavators', slug: 'excavators', isActive: true, parentId: 'c-3-1-1', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-3-1-1-2', name: 'Bulldozers', slug: 'bulldozers', isActive: true, parentId: 'c-3-1-1', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-3-1-1-3', name: 'Loaders', slug: 'loaders', isActive: true, parentId: 'c-3-1-1', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-3-1-2', name: 'Lifting', slug: 'lifting', isActive: true, parentId: 'c-3-1', mappedGroupIds: [] },
      { id: 'c-3-1-2-1', name: 'Cranes', slug: 'cranes', isActive: true, parentId: 'c-3-1-2', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-3-1-2-2', name: 'Hoists', slug: 'hoists', isActive: true, parentId: 'c-3-1-2', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-3-1-2-3', name: 'Forklifts', slug: 'forklifts', isActive: true, parentId: 'c-3-1-2', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-3-1-3', name: 'Paving', slug: 'paving', isActive: true, parentId: 'c-3-1', mappedGroupIds: [] },
      { id: 'c-3-1-3-1', name: 'Asphalt Pavers', slug: 'asphalt-pavers', isActive: true, parentId: 'c-3-1-3', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-3-1-3-2', name: 'Rollers', slug: 'rollers', isActive: true, parentId: 'c-3-1-3', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-3-1-3-3', name: 'Graders', slug: 'graders', isActive: true, parentId: 'c-3-1-3', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-3-2', name: 'Tools', slug: 'tools', isActive: true, parentId: 'c-3', mappedGroupIds: [] },
      { id: 'c-3-2-1', name: 'Power Tools', slug: 'power-tools', isActive: true, parentId: 'c-3-2', mappedGroupIds: [] },
      { id: 'c-3-2-1-1', name: 'Drills', slug: 'drills', isActive: true, parentId: 'c-3-2-1', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-3-2-1-2', name: 'Saws', slug: 'saws', isActive: true, parentId: 'c-3-2-1', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-3-2-1-3', name: 'Grinders', slug: 'grinders', isActive: true, parentId: 'c-3-2-1', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-3-2-2', name: 'Hand Tools', slug: 'hand-tools', isActive: true, parentId: 'c-3-2', mappedGroupIds: [] },
      { id: 'c-3-2-2-1', name: 'Hammers', slug: 'hammers', isActive: true, parentId: 'c-3-2-2', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-3-2-2-2', name: 'Wrenches', slug: 'wrenches', isActive: true, parentId: 'c-3-2-2', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-3-2-2-3', name: 'Pliers', slug: 'pliers', isActive: true, parentId: 'c-3-2-2', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-3-2-3', name: 'Measurement', slug: 'measurement', isActive: true, parentId: 'c-3-2', mappedGroupIds: [] },
      { id: 'c-3-2-3-1', name: 'Tape Measures', slug: 'tape-measures', isActive: true, parentId: 'c-3-2-3', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-3-2-3-2', name: 'Lasers', slug: 'lasers', isActive: true, parentId: 'c-3-2-3', mappedGroupIds: ['g1', 'g2'] },
      { id: 'c-3-2-3-3', name: 'Calipers', slug: 'calipers', isActive: true, parentId: 'c-3-2-3', mappedGroupIds: ['g3', 'g4'] },
      { id: 'c-3-3', name: 'Safety', slug: 'safety', isActive: true, parentId: 'c-3', mappedGroupIds: [] },
      { id: 'c-3-3-1', name: 'PPE', slug: 'ppe', isActive: true, parentId: 'c-3-3', mappedGroupIds: [] },
      { id: 'c-3-3-1-1', name: 'Helmets', slug: 'helmets', isActive: true, parentId: 'c-3-3-1', mappedGroupIds: ['g5', 'g6'] },
      { id: 'c-3-3-1-2', name: 'Gloves', slug: 'gloves', isActive: true, parentId: 'c-3-3-1', mappedGroupIds: ['g7', 'g8'] },
      { id: 'c-3-3-1-3', name: 'Safety Glasses', slug: 'safety-glasses', isActive: true, parentId: 'c-3-3-1', mappedGroupIds: ['g9', 'g10'] },
      { id: 'c-3-3-2', name: 'Signage', slug: 'signage', isActive: true, parentId: 'c-3-3', mappedGroupIds: [] },
      { id: 'c-3-3-2-1', name: 'Warning Signs', slug: 'warning-signs', isActive: true, parentId: 'c-3-3-2', mappedGroupIds: ['g11', 'g12'] },
      { id: 'c-3-3-2-2', name: 'Traffic Cones', slug: 'traffic-cones', isActive: true, parentId: 'c-3-3-2', mappedGroupIds: ['g13', 'g14'] },
      { id: 'c-3-3-2-3', name: 'Barricades', slug: 'barricades', isActive: true, parentId: 'c-3-3-2', mappedGroupIds: ['g15', 'g16'] },
      { id: 'c-3-3-3', name: 'Fire Safety', slug: 'fire-safety', isActive: true, parentId: 'c-3-3', mappedGroupIds: [] },
      { id: 'c-3-3-3-1', name: 'Extinguishers', slug: 'extinguishers', isActive: true, parentId: 'c-3-3-3', mappedGroupIds: ['g17', 'g18'] },
      { id: 'c-3-3-3-2', name: 'Alarms', slug: 'alarms', isActive: true, parentId: 'c-3-3-3', mappedGroupIds: ['g19', 'g20'] },
      { id: 'c-3-3-3-3', name: 'Sprinklers', slug: 'sprinklers', isActive: true, parentId: 'c-3-3-3', mappedGroupIds: ['g1', 'g2'] }
    ];
    await db.categories.bulkAdd(categories);

    // 6. Seed Platform Products
    const platformProducts = [
      { id: 'pp-1', categoryId: 'c-1-1-1-2', name: 'MacBook Pro 14', description: 'Apple MacBook Pro 14-inch with M2 Pro chip', isActive: true },
      { id: 'pp-2', categoryId: 'c-1-1-2-1', name: 'iMac 24', description: 'Apple iMac 24-inch with M1 chip', isActive: true },
      { id: 'pp-3', categoryId: 'c-2-1-1-1', name: 'Industrial AC Motor', description: 'Acme Industrial AC Motor, 5HP', isActive: true },
      { id: 'pp-4', categoryId: 'c-2-1-2-1', name: 'Stainless Steel Ball Valve', description: 'FlowTech Stainless Steel Ball Valve, 2-inch', isActive: true },
      { id: 'pp-5', categoryId: 'c-3-1-1-1', name: 'Herman Miller Aeron', description: 'Herman Miller Aeron Chair, Graphite', isActive: true }
    ];
    await db.platformProducts.bulkAdd(platformProducts);

    // 7. Seed User Products (from mockProducts.ts)
    const userProducts = [
      {
        id: 'prod-1',
        tenantId: 'tenant-1',
        tenantName: 'Acme Corp (Business)',
        name: 'Sample product A',
        partNumber: '2',
        categoryName: 'Floating Ball Valves',
        status: 'Submitted',
        updatedAt: '2023-10-26 14:30',
        submittedAt: '2023-10-26 14:30',
        reviewData: {},
        platformProductId: 'pp-3',
        height: '10', width: '20', emptyWeight: '50kg',
        modelNumber: '1',
        yearOfManufacture: 2023, countryOfOrigin: 'US', manufacturer: 'acme', brand: 'brand-x',
        seller: 'vendor-a', deviations: 'None', exclusions: 'None', assumptions: 'None',
        globalSpecs: [
            { name: 'Material Grade', value: 'Standard ASTM A216 WCB' },
            { name: 'End Connection', value: 'Flanged RF' },
            { name: 'Operation', value: 'Lever Operated' },
            { name: 'Fire Safe', value: 'API 607 Certified' },
            { name: 'NACE', value: 'MR0175 Compliant' }
          ],
          variants: [
            { id: 'v1', name: '1/2" 150#', sku: 'PP-3-150-05', price: 100, stock: 50, minOrder: 1 },
            { id: 'v2', name: '3/4" 150#', sku: 'PP-3-150-075', price: 110, stock: 45, minOrder: 1 },
            { id: 'v3', name: '1" 150#', sku: 'PP-3-150-10', price: 125, stock: 60, minOrder: 1 },
            { id: 'v4', name: '1.5" 150#', sku: 'PP-3-150-15', price: 160, stock: 25, minOrder: 1 },
            { id: 'v5', name: '2" 150#', sku: 'PP-3-150-20', price: 210, stock: 40, minOrder: 1 },
            { id: 'v6', name: '3" 150#', sku: 'PP-3-150-30', price: 340, stock: 15, minOrder: 1 },
            { id: 'v7', name: '4" 150#', sku: 'PP-3-150-40', price: 550, stock: 10, minOrder: 1 },
            { id: 'v8', name: '1/2" 300#', sku: 'PP-3-300-05', price: 130, stock: 30, minOrder: 1 },
            { id: 'v9', name: '3/4" 300#', sku: 'PP-3-300-075', price: 145, stock: 25, minOrder: 1 },
            { id: 'v10', name: '1" 300#', sku: 'PP-3-300-10', price: 170, stock: 20, minOrder: 1 },
            { id: 'v11', name: '1.5" 300#', sku: 'PP-3-300-15', price: 220, stock: 15, minOrder: 1 },
            { id: 'v12', name: '2" 300#', sku: 'PP-3-300-20', price: 290, stock: 10, minOrder: 1 },
            { id: 'v13', name: '3" 300#', sku: 'PP-3-300-30', price: 450, stock: 5, minOrder: 1 },
            { id: 'v14', name: '4" 300#', sku: 'PP-3-300-40', price: 720, stock: 2, minOrder: 1 }
          ]
      },
      {
        id: 'prod-2',
        tenantId: 'tenant-1',
        tenantName: 'John Doe (Individual)',
        name: 'Micro Controller Pro',
        partNumber: 'MCP-R2',
        categoryName: 'Logic Boards',
        status: 'Under Review',
        updatedAt: '2023-10-25 09:15',
        submittedAt: '2023-10-25 09:15',
        reviewData: {
          'prod-name': { status: 'approved' },
          'prod-part': { status: 'rejected', comment: 'Part number format is invalid. It must be at least 10 characters long as per strict rules.' },
          'prod-model': { status: 'approved' },
          'spec-Clock Speed': { status: 'rejected', comment: 'Please verify this clock speed. Is it a typo?' },
          'spec-Architecture': { status: 'approved' },
          'spec-Operating Voltage': { status: 'rejected', comment: 'Is this compatible with 1.8V logic? Please clarify.' },
          'variant-v1': { status: 'approved' },
          'variant-v2': { status: 'approved' },
          'variant-v13': { status: 'rejected', comment: 'Price is abnormally high for this variant. Check your margins.' }
        },
        categoryId: 'c-2-2-1-1',
        platformProductId: 'pp-3',
        modelNumber: 'R2', manufacturer: 'globaltech', brand: 'premium',
        dynamicAttributes: {
          'attr-1': ['Standard'],
          'attr-2': ['AC 110V', 'DC 12V'],
          'attr-4': ['-40°C to 85°C']
        },
        globalSpecs: [
            { name: 'Operating Temperature', value: '-40°C to 85°C' }
          ],
          variants: [
            { id: 'v1', name: '16MHz 256KB', sku: 'MC-R2-16-256', price: 4.5, stock: 1000, minOrder: 100 },
            { id: 'v2', name: '16MHz 512KB', sku: 'MC-R2-16-512', price: 5.0, stock: 850, minOrder: 100 },
            { id: 'v3', name: '32MHz 256KB', sku: 'MC-R2-32-256', price: 5.5, stock: 500, minOrder: 50 },
            { id: 'v4', name: '32MHz 512KB', sku: 'MC-R2-32-512', price: 6.0, stock: 400, minOrder: 50 },
            { id: 'v5', name: '32MHz 1MB', sku: 'MC-R2-32-1M', price: 7.5, stock: 300, minOrder: 50 },
            { id: 'v6', name: '48MHz 512KB', sku: 'MC-R2-48-512', price: 8.0, stock: 200, minOrder: 50 },
            { id: 'v7', name: '48MHz 1MB', sku: 'MC-R2-48-1M', price: 9.5, stock: 150, minOrder: 25 },
            { id: 'v8', name: '64MHz 1MB', sku: 'MC-R2-64-1M', price: 11.0, stock: 100, minOrder: 25 },
            { id: 'v9', name: '64MHz 2MB', sku: 'MC-R2-64-2M', price: 13.5, stock: 75, minOrder: 25 },
            { id: 'v10', name: '72MHz 1MB', sku: 'MC-R2-72-1M', price: 15.0, stock: 50, minOrder: 10 },
            { id: 'v11', name: '72MHz 2MB', sku: 'MC-R2-72-2M', price: 18.0, stock: 40, minOrder: 10 },
            { id: 'v12', name: '84MHz 2MB', sku: 'MC-R2-84-2M', price: 21.0, stock: 30, minOrder: 10 },
            { id: 'v13', name: '120MHz 2MB', sku: 'MC-R2-120-2M', price: 25.0, stock: 20, minOrder: 5 }
          ]
      },
      {
        id: 'prod-3',
        tenantId: 'tenant-1',
        tenantName: 'Jane Smith (Individual)',
        name: 'Resubmitted Widget',
        partNumber: 'RW-1',
        categoryName: 'Widgets',
        status: 'Resubmitted',
        updatedAt: '2023-10-29 10:00',
        submittedAt: '2023-10-29 10:00',
        reviewData: {
          'spec-Core Material': { status: 'pending', comment: '[PREVIOUS REJECTION]: Must use Stainless Steel, not High Carbon Steel.' },
          'spec-Tolerance': { status: 'pending', comment: '[PREVIOUS REJECTION]: Tolerance must be at least +/- 0.05mm.' },
          'variant-v1': { status: 'approved' },
          'variant-v13': { status: 'pending', comment: '[PREVIOUS REJECTION]: XXL Black is not allowed in this category.' }
        },
        categoryId: 'c-2-2-1-1',
        platformProductId: 'pp-3',
        dynamicAttributes: {
          'attr-1': ['Premium', 'Industrial']
        },
        globalSpecs: [],
        variants: [
            { id: 'v1', name: 'Standard Red', sku: 'WID-R', price: 10, stock: 100, minOrder: 10 },
            { id: 'v13', name: 'XXL Black', sku: 'WID-XXL-B', price: 25, stock: 10, minOrder: 5 }
          ]
      },
      {
        id: 'prod-4',
        tenantId: 'tenant-1',
        tenantName: 'Acme Corp (Business)',
        name: 'Lithium Battery Pack',
        partNumber: 'LBP-10AH',
        categoryName: 'Power Systems',
        status: 'Draft',
        updatedAt: '2023-10-28 14:00',
        reviewData: {},
        platformProductId: null,
        globalSpecs: [],
        variants: []
      },
      {
        id: 'prod-5',
        tenantId: 'tenant-1',
        tenantName: 'Acme Corp (Business)',
        name: 'Heavy Duty Servo',
        partNumber: 'HDS-99',
        categoryName: 'Motors',
        status: 'Changes Requested',
        updatedAt: '2023-10-27 08:30',
        submittedAt: '2023-10-26 12:00',
        reviewData: {
          'prod-part': { status: 'rejected', comment: 'Needs standard prefix.' }
        },
        platformProductId: null,
        globalSpecs: [],
        variants: []
      },
      {
        id: 'prod-6',
        tenantId: 'tenant-1',
        tenantName: 'Tech Innovations LLC',
        name: 'High-Performance BLDC Motor',
        partNumber: 'HP-BLDC-400',
        modelNumber: 'BLDC-400X',
        categoryName: 'Motors',
        categoryId: 'c-2-2',
        status: 'Submitted',
        updatedAt: '2023-11-05 10:00',
        submittedAt: '2023-11-05 10:00',
        reviewData: {},
        platformProductId: 'pp-1',
        height: '15cm', width: '10cm', emptyWeight: '2.5kg',
        yearOfManufacture: 2023, countryOfOrigin: 'DE', manufacturer: 'TechInnovate', brand: 'PowerDrive',
        seller: 'vendor-a', 
        deviations: 'None', 
        exclusions: 'Does not include mounting brackets', 
        assumptions: 'Operates in standard environmental conditions',
        operationInstructions: 'Connect to standard 3-phase controller.',
        safetyInstructions: 'Ensure power is disconnected before maintenance.',
        handlingInstructions: 'Handle with care, avoid dropping.',
        maintenanceInstructions: 'Check bearings every 5000 hours.',
        additionalRequirements: 'Requires active cooling if operated above 40C.',
        additionalInformation: 'Premium quality materials used for extended lifespan.',
        dynamicAttributes: {
          'attr-voltage': ['48V DC', '72V DC'],
          'attr-speed': ['3000 RPM', '4500 RPM']
        },
        globalSpecs: [
          { name: 'Motor Type', value: 'Brushless DC' },
          { name: 'Cooling', value: 'Air Cooled' },
          { name: 'IP Rating', value: 'IP65' }
        ],
        variants: [
          { id: 'v1', name: '48V DC / 3000 RPM', sku: 'HP-48-3K', price: 150, stock: 40, minOrder: 5 },
          { id: 'v2', name: '48V DC / 4500 RPM', sku: 'HP-48-4K5', price: 175, stock: 35, minOrder: 5 },
          { id: 'v3', name: '72V DC / 3000 RPM', sku: 'HP-72-3K', price: 180, stock: 20, minOrder: 5 },
          { id: 'v4', name: '72V DC / 4500 RPM', sku: 'HP-72-4K5', price: 210, stock: 15, minOrder: 5 }
        ]
      }
    ];
    await db.userProducts.bulkAdd(userProducts as any);

    // 8. Seed RFQs (from mockRFQs.ts)
    const rfqs = [
      {
        // INBOUND RFQ for org-1
        id: 'rfq-001',
        rfqNumber: 'RFQ-2023-1001',
        title: 'Q4 Industrial Motor & Phone Restock',
        status: 'Responded',
        requesterTenantId: 'org-2',
        requesterTenantName: 'XYZ Manufacturing Ltd',
        contactEmail: 'procurement@xyz.com',
        contactMobile: '+1-555-0192',
        submissionDeadline: '2023-11-15',
        currency: 'USD',
        shippingDestination: 'New York, USA',
        specifications: 'Standard specs apply.',
        createdAt: '2023-11-01T10:00:00Z',
        items: [
          {
            id: 'item-1',
            targetTenantId: 'org-1', // Targeted to org-1 (Current User will see this)
            categoryId: 'c-2-2-1-1',
            platformProductId: 'pp-3',
            quantity: 500,
            brand: 'Acme',
            manufacturer: 'Acme Corp',
            countryOfOrigin: 'USA',
            height: '20cm',
            weight: '5kg'
          },
          {
            id: 'item-2',
            targetTenantId: 'org-3', // Targeted to someone else (Current User will NOT see this in Inbound)
            categoryId: 'c-1-1-1-1',
            platformProductId: 'pp-1',
            quantity: 200,
            brand: 'Apple'
          }
        ],
        quotes: [
          {
            id: 'q-001',
            responderTenantId: 'org-1',
            responderTenantName: 'ABC Engineering Pvt Ltd',
            notes: 'We can fulfill this from our standard stock.',
            status: 'Submitted',
            submittedAt: '2023-11-02T14:30:00Z',
            items: [
              { rfqItemId: 'item-1', price: 245.50, leadTimeDays: 14 }
            ]
          }
        ]
      },
      {
        // OUTBOUND RFQ for org-1
        id: 'rfq-002',
        rfqNumber: 'RFQ-2023-1002',
        title: 'Office Hardware Upgrades',
        status: 'Open',
        requesterTenantId: 'org-1',
        requesterTenantName: 'ABC Engineering Pvt Ltd',
        contactEmail: 'sourcing@abceng.com',
        contactMobile: '+1-555-9921',
        submissionDeadline: '2023-11-20',
        currency: 'USD',
        shippingDestination: 'Texas, USA',
        specifications: 'Require fastest shipping possible.',
        createdAt: '2023-11-10T08:00:00Z',
        items: [
          {
            id: 'item-1',
            targetTenantId: 'org-2', // Targeted away from self
            categoryId: 'c-1-1-1-1',
            platformProductId: 'pp-1',
            quantity: 100,
            unit: 'Pieces',
            brand: 'Apple',
            modelNumber: 'iPhone 14 Pro'
          },
          {
            id: 'item-2',
            // No targetTenantId -> Open (Broadcast) item
            categoryId: 'c-1-1-1-2',
            // No platformProductId -> "not product mapped"
            quantity: 50,
            unit: 'Units',
            brand: 'Apple',
            dynamicAttributes: {
              'Screen Size': '15 inch',
              'Processor': 'M2',
              'RAM': '16GB'
            }
          }
        ],
        quotes: []
      }
    ];
    await db.rfqs.bulkAdd(rfqs as any);

    console.log('Mock Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
