import type { AttributeGroup } from './catalog.module';

export const mockAttributeGroups: AttributeGroup[] = [
  { id: 'grp-1', name: 'General Specs', attributeIds: ['attr-1', 'attr-2'] },
  { id: 'grp-2', name: 'Performance & Hardware', attributeIds: ['attr-3', 'attr-4'] },
  { id: 'grp-3', name: 'Display Details', attributeIds: ['attr-5', 'attr-6'] },

  { id: 'grp-4', name: 'Build & Aesthetics', attributeIds: ['attr-7', 'attr-8'] },
  { id: 'grp-5', name: 'Processing & Memory', attributeIds: ['attr-9', 'attr-10', 'attr-25'] },
  { id: 'grp-6', name: 'Optics System', attributeIds: ['attr-11', 'attr-12'] },

  { id: 'grp-7', name: 'Sizing & Fit', attributeIds: ['attr-13', 'attr-14'] },
  { id: 'grp-8', name: 'Materials & Construction', attributeIds: ['attr-15', 'attr-16'] },
  { id: 'grp-9', name: 'Performance Support', attributeIds: ['attr-17', 'attr-18'] },

  { id: 'grp-10', name: 'Body & Grip', attributeIds: ['attr-19', 'attr-20'] },
  { id: 'grp-11', name: 'Sensor & Exposure', attributeIds: ['attr-21', 'attr-22'] },
  { id: 'grp-12', name: 'Capture Capability', attributeIds: ['attr-23', 'attr-24'] }
];
