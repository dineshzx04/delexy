import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input as AntInput, InputNumber as AntInputNumber, Select as AntSelect, Button as AntButton, Tag as AntTag, Alert as AntAlert, Space as AntSpace, Card as AntCard, Switch as AntSwitch, Descriptions as AntDescriptions, Table as AntTable, Collapse as AntCollapse, App as AntApp } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb, type SellerProductSubmission, type SubmissionAttributeItem, type SellerProductSpecification, type SellerProductVariant } from '../../data/catalog';
import { businessDb, type Party } from '../../data/business';

// 1. Zod Validation Schema
const sellerProductSubmissionSchema = z.object({
  product_name: z.string().min(1, 'Listing title is required.'),
  category_id: z.string().min(1, 'Please select a leaf category.'),
  catalog_product_id: z.string().min(1, 'Please select a master product template.'),
  brand_id: z.string().min(1, 'Please select a brand.'),
  manufacturer_id: z.string().min(1, 'Please select a manufacturer unit.'),

  year_of_manufacture: z.number().min(1900, 'Year must be at least 1900').max(2030, 'Year cannot exceed 2030').optional().nullable(),
  model_number: z.string().optional().nullable(),
  part_number: z.string().min(1, 'Part number is required.'),

  height: z.string().optional().nullable(),
  width: z.string().optional().nullable(),
  length: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),

  operation_instructions: z.string().optional().nullable(),
  safety_instructions: z.string().optional().nullable(),
  handling_instructions: z.string().optional().nullable(),
  maintenance_instructions: z.string().optional().nullable(),
  deviations: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  assumptions: z.string().optional().nullable(),
  additional_requirements: z.string().optional().nullable(),
  additional_information: z.string().optional().nullable(),
});

type SubmissionFormValues = z.infer<typeof sellerProductSubmissionSchema>;

// Lightweight Isolated Cell Inputs to eliminate keystroke lag for 1,000+ items
const EditableCellInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = React.memo(({ value, onChange, placeholder, disabled }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <AntInput
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => onChange(localVal)}
      placeholder={placeholder}
      disabled={disabled}
      className="text-xs font-mono"
    />
  );
});

const EditableCellNumber: React.FC<{
  value: number;
  onChange: (val: number) => void;
  min?: number;
  className?: string;
  disabled?: boolean;
}> = React.memo(({ value, onChange, min = 0, className, disabled }) => {
  const [localVal, setLocalVal] = useState<number | null>(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <AntInputNumber
      value={localVal}
      onChange={(val) => setLocalVal(val)}
      onBlur={() => onChange(localVal ?? 0)}
      min={min}
      disabled={disabled}
      className={`text-xs ${className || 'w-full'}`}
    />
  );
});

const SellerProductSubmissionForm: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUserId, activeWorkspace } = useWorkspace();
  const currentBizId = activeWorkspace?.businessId || (activeWorkspace?.type === 'BUSINESS' ? activeWorkspace.id : undefined);
  const isBusinessWorkspace = activeWorkspace?.type === 'BUSINESS' || location.pathname.startsWith('/b');

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(sellerProductSubmissionSchema),
    defaultValues: {
      product_name: '',
      category_id: '',
      catalog_product_id: '',
      brand_id: '',
      manufacturer_id: '',
      year_of_manufacture: 2024,
      model_number: '',
      part_number: 'PN-101',
      height: '',
      width: '',
      length: '',
      weight: '',
      operation_instructions: '',
      safety_instructions: '',
      handling_instructions: '',
      maintenance_instructions: '',
      deviations: '',
      exclusions: '',
      assumptions: '',
      additional_requirements: '',
      additional_information: ''
    }
  });

  const formValues = useWatch({ control });
  const selectedCategoryId = useWatch({ control, name: 'category_id' });
  const selectedProductId = useWatch({ control, name: 'catalog_product_id' });
  const selectedBrandId = useWatch({ control, name: 'brand_id' });
  const selectedManufacturerId = useWatch({ control, name: 'manufacturer_id' });

  // Dexie DB live queries
  const parties = useLiveQuery(() => businessDb.parties.toArray()) || [];
  const categories = useLiveQuery(() => catalogDb.categories.toArray()) || [];
  const masterProducts = useLiveQuery(() => catalogDb.products.toArray()) || [];
  const brands = useLiveQuery(() => businessDb.brands.toArray()) || [];
  const manufacturers = useLiveQuery(() => businessDb.manufacturers.toArray()) || [];
  const brandParties = useLiveQuery(() => businessDb.brandParties.toArray()) || [];
  const attributeGroups = useLiveQuery(() => catalogDb.attributeGroups.toArray()) || [];
  const allAttributes = useLiveQuery(() => catalogDb.attributes.toArray()) || [];
  const allAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray()) || [];
  const existingSubmissions = useLiveQuery(() => catalogDb.sellerProductSubmissions.toArray()) || [];

  const activeParty = useMemo(() => {
    if (isBusinessWorkspace && currentBizId) {
      return parties.find((p: Party) => p.owner_type === 'BUSINESS' && p.owner_id === currentBizId);
    } else if (!isBusinessWorkspace && currentUserId) {
      return parties.find((p: Party) => p.owner_type === 'USER' && p.owner_id === currentUserId);
    }
    return null;
  }, [parties, isBusinessWorkspace, currentBizId, currentUserId]);

  const editingSubmission = useMemo(() => {
    if (!id) return null;
    return existingSubmissions.find((s: SellerProductSubmission) => s.id === id);
  }, [id, existingSubmissions]);

  // Read-Only Enforcement: Lock editing if status is SUBMITTED, UNDER_REVIEW, APPROVED, PUBLISHED, or REJECTED
  // Editing is ONLY allowed when creating new, or when status is DRAFT or NEEDS_REVISION
  const isReadOnly = useMemo(() => {
    if (!editingSubmission) return false;
    return editingSubmission.status !== 'DRAFT' && editingSubmission.status !== 'NEEDS_REVISION';
  }, [editingSubmission]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Attributes State:
  // 1. attributeTargetMap: attrId -> 'SPEC' | 'VARIANT' (Default: 'SPEC')
  // 2. attributeSelectedValuesMap: attrId -> string[]
  const [attributeTargetMap, setAttributeTargetMap] = useState<Record<string, 'SPEC' | 'VARIANT'>>({});
  const [attributeSelectedValuesMap, setAttributeSelectedValuesMap] = useState<Record<string, string[]>>({});

  // Generated Variants State & Bulk Actions Controls
  const [generatedVariants, setGeneratedVariants] = useState<SellerProductVariant[]>([]);
  const [variantSearchQuery, setVariantSearchQuery] = useState('');
  const [bulkPriceInput, setBulkPriceInput] = useState<number | null>(null);
  const [bulkStockInput, setBulkStockInput] = useState<number | null>(null);
  const [bulkMoqInput, setBulkMoqInput] = useState<number | null>(null);

  const breadcrumbs = useMemo(() => [
    { title: <Link to={isBusinessWorkspace ? "/b/dashboard" : "/user/dashboard"} className="text-gray-500 hover:text-sky-600">Workspace</Link> },
    { title: <Link to={isBusinessWorkspace ? "/b/products" : "/user/seller-products"} className="text-gray-500 hover:text-sky-600">Seller Products</Link> },
    { title: <span className="text-gray-900 font-semibold">{editingSubmission ? `Submission (${editingSubmission.id})` : 'New Seller Product'}</span> }
  ], [isBusinessWorkspace, editingSubmission]);

  useBreadcrumb(breadcrumbs);

  // Filter master products by selected category
  const availableMasterProducts = useMemo(() => {
    if (!selectedCategoryId) return masterProducts;
    return masterProducts.filter(p => p.categoryId === selectedCategoryId);
  }, [masterProducts, selectedCategoryId]);

  // Category <-> Product Sync
  const handleProductChange = (productId: string) => {
    if (isReadOnly) return;
    setValue('catalog_product_id', productId, { shouldValidate: true });
    const prod = masterProducts.find(p => p.id === productId);
    if (prod && prod.categoryId && prod.categoryId !== selectedCategoryId) {
      setValue('category_id', prod.categoryId, { shouldValidate: true });
    }
  };

  const handleCategoryChange = (catId: string | undefined) => {
    if (isReadOnly) return;
    const nextCatId = catId || '';
    setValue('category_id', nextCatId, { shouldValidate: true });
    const matchingProds = masterProducts.filter(p => p.categoryId === nextCatId);
    if (selectedProductId && !matchingProds.some(p => p.id === selectedProductId)) {
      setValue('catalog_product_id', '', { shouldValidate: true });
    }
  };

  // Bidirectional Brand <-> Manufacturer Filtering
  const availableBrands = useMemo(() => {
    if (!selectedManufacturerId) return brands;
    const selectedMfg = manufacturers.find((m) => m.id === selectedManufacturerId);
    if (!selectedMfg) return brands;

    const partyId = selectedMfg.manufacturer_party_id;
    const linkedBrandIds = brandParties
      .filter((bp) => bp.party_id === partyId)
      .map((bp) => bp.brand_id);

    const filtered = brands.filter((b) => linkedBrandIds.includes(b.id));
    return filtered.length > 0 ? filtered : brands;
  }, [brands, manufacturers, brandParties, selectedManufacturerId]);

  const availableManufacturers = useMemo(() => {
    if (!selectedBrandId) return manufacturers;

    const linkedPartyIds = brandParties
      .filter((bp) => bp.brand_id === selectedBrandId)
      .map((bp) => bp.party_id);

    const filtered = manufacturers.filter((m) => linkedPartyIds.includes(m.manufacturer_party_id));
    return filtered.length > 0 ? filtered : manufacturers;
  }, [manufacturers, brandParties, selectedBrandId]);

  const handleBrandChange = (brandId: string | undefined) => {
    if (isReadOnly) return;
    const nextBrandId = brandId || '';
    setValue('brand_id', nextBrandId, { shouldValidate: true });

    if (nextBrandId) {
      const linkedPartyIds = brandParties
        .filter((bp) => bp.brand_id === nextBrandId)
        .map((bp) => bp.party_id);
      const matchingMfgs = manufacturers.filter((m) => linkedPartyIds.includes(m.manufacturer_party_id));

      if (selectedManufacturerId) {
        const currentMfg = manufacturers.find((m) => m.id === selectedManufacturerId);
        if (currentMfg && !linkedPartyIds.includes(currentMfg.manufacturer_party_id)) {
          if (matchingMfgs.length === 1) {
            setValue('manufacturer_id', matchingMfgs[0].id, { shouldValidate: true });
          } else {
            setValue('manufacturer_id', '', { shouldValidate: true });
          }
        }
      } else if (matchingMfgs.length === 1) {
        setValue('manufacturer_id', matchingMfgs[0].id, { shouldValidate: true });
      }
    }
  };

  const handleManufacturerChange = (mfgId: string | undefined) => {
    if (isReadOnly) return;
    const nextMfgId = mfgId || '';
    setValue('manufacturer_id', nextMfgId, { shouldValidate: true });

    if (nextMfgId) {
      const selectedMfg = manufacturers.find((m) => m.id === nextMfgId);
      if (selectedMfg) {
        const linkedBrandIds = brandParties
          .filter((bp) => bp.party_id === selectedMfg.manufacturer_party_id)
          .map((bp) => bp.brand_id);
        const matchingBrands = brands.filter((b) => linkedBrandIds.includes(b.id));

        if (selectedBrandId && !linkedBrandIds.includes(selectedBrandId)) {
          if (matchingBrands.length === 1) {
            setValue('brand_id', matchingBrands[0].id, { shouldValidate: true });
          } else {
            setValue('brand_id', '', { shouldValidate: true });
          }
        } else if (!selectedBrandId && matchingBrands.length === 1) {
          setValue('brand_id', matchingBrands[0].id, { shouldValidate: true });
        }
      }
    }
  };

  // Pre-fill form values
  useEffect(() => {
    if (editingSubmission) {
      const initialValues: Record<string, any> = {};
      Object.keys(editingSubmission.attributes).forEach((key) => {
        initialValues[key] = editingSubmission.attributes[key].value;
      });
      reset(initialValues as SubmissionFormValues);

      if (editingSubmission.attributes.specifications?.value) {
        const specs = editingSubmission.attributes.specifications.value as SellerProductSpecification[];
        const selectedMap: Record<string, string[]> = {};
        specs.forEach(s => {
          selectedMap[s.attribute_id] = s.values.map(v => v.id);
        });
        setAttributeSelectedValuesMap(prev => ({ ...prev, ...selectedMap }));
      }

      if (editingSubmission.attributes.variants?.value) {
        setGeneratedVariants(editingSubmission.attributes.variants.value as SellerProductVariant[]);
      }
    }
  }, [editingSubmission, reset]);

  // Dynamic Attribute Groups mapped to selected Category
  const mappedCategoryAttributeGroups = useMemo(() => {
    if (!selectedCategoryId) return [];
    const cat = categories.find(c => c.id === selectedCategoryId);
    if (!cat || !cat.mappedGroupIds) return [];

    return attributeGroups.filter(g => cat.mappedGroupIds.includes(g.id)).map(g => {
      const groupAttrs = allAttributes.filter(a => g.attributeIds.includes(a.id)).map(attr => {
        const attrVals = allAttributeValues.filter(v => (attr.valueIds || []).includes(v.id));
        return { ...attr, availableValues: attrVals };
      });
      return { ...g, attributes: groupAttrs };
    });
  }, [selectedCategoryId, categories, attributeGroups, allAttributes, allAttributeValues]);

  // Auto-generate variants from attributes marked as 'VARIANT'
  useEffect(() => {
    if (isReadOnly && editingSubmission?.attributes.variants?.value) {
      return; // Preserve existing variants in read-only mode
    }

    const variantAttributeCombos: { group_id: string; group_name: string; attribute_id: string; attribute_name: string; values: { id: string; label: string }[] }[] = [];

    mappedCategoryAttributeGroups.forEach(grp => {
      grp.attributes.forEach(attr => {
        const targetType = attributeTargetMap[attr.id] || 'SPEC';
        const selectedValIds = attributeSelectedValuesMap[attr.id] || [];

        if (targetType === 'VARIANT' && selectedValIds.length > 0) {
          const selectedVals = allAttributeValues
            .filter(v => selectedValIds.includes(v.id))
            .map(v => ({ id: v.id, label: v.label || v.value || v.id }));

          variantAttributeCombos.push({
            group_id: grp.id,
            group_name: grp.name,
            attribute_id: attr.id,
            attribute_name: attr.label || attr.name,
            values: selectedVals
          });
        }
      });
    });

    if (variantAttributeCombos.length === 0) {
      if (!editingSubmission?.attributes.variants?.value) {
        setGeneratedVariants([]);
      }
      return;
    }

    const generateCartesian = (apiCombos: typeof variantAttributeCombos): any[][] => {
      if (apiCombos.length === 0) return [[]];
      const [first, ...rest] = apiCombos;
      const restCartesian = generateCartesian(rest);
      const result: any[][] = [];

      first.values.forEach(val => {
        restCartesian.forEach(combo => {
          result.push([
            {
              group_id: first.group_id,
              group_name: first.group_name,
              attribute_id: first.attribute_id,
              attribute_name: first.attribute_name,
              value_id: val.id,
              label: val.label
            },
            ...combo
          ]);
        });
      });

      return result;
    };

    const cartesianCombinations = generateCartesian(variantAttributeCombos);

    const timestamp = Date.now();
    const newVariants: SellerProductVariant[] = cartesianCombinations.map((combo, idx) => {
      const skuSuffix = combo.map(c => c.label.substring(0, 3).toUpperCase()).join('-');

      return {
        id: `v-${idx + 1}-${timestamp}`,
        variant_platform_id: `gpid-${10100 + idx + 1}`,
        sku: `SKU-${skuSuffix || (idx + 1)}`,
        price: 0,
        currency: 'USD',
        stock: 0,
        min_order_quantity: 1,
        combination_values: combo
      };
    });

    setGeneratedVariants(newVariants);
  }, [attributeTargetMap, attributeSelectedValuesMap, mappedCategoryAttributeGroups, allAttributeValues, isReadOnly, editingSubmission]);

  // Compute Specifications array for attributes marked as 'SPEC'
  const computedSpecifications = useMemo<SellerProductSpecification[]>(() => {
    const specs: SellerProductSpecification[] = [];

    mappedCategoryAttributeGroups.forEach(grp => {
      grp.attributes.forEach(attr => {
        const targetType = attributeTargetMap[attr.id] || 'SPEC';
        const selectedValIds = attributeSelectedValuesMap[attr.id] || [];

        if (targetType === 'SPEC' && selectedValIds.length > 0) {
          const selectedVals = allAttributeValues
            .filter(v => selectedValIds.includes(v.id))
            .map(v => ({ id: v.id, label: v.label || v.value || v.id }));

          specs.push({
            group_id: grp.id,
            group_name: grp.name,
            attribute_id: attr.id,
            attribute_name: attr.label || attr.name,
            values: selectedVals
          });
        }
      });
    });

    return specs;
  }, [attributeTargetMap, attributeSelectedValuesMap, mappedCategoryAttributeGroups, allAttributeValues]);

  const rejectedAttributes = useMemo(() => {
    if (!editingSubmission || editingSubmission.status !== 'NEEDS_REVISION') return [];
    return Object.values(editingSubmission.attributes).filter((attr: SubmissionAttributeItem) => attr.status === 'REJECTED');
  }, [editingSubmission]);

  const renderFieldStatusBadge = (fieldKey: string) => {
    if (!editingSubmission) return null;
    const attr = editingSubmission.attributes[fieldKey];
    if (!attr) return null;

    if (attr.status === 'APPROVED') {
      return (
        <div className="flex items-center gap-1 text-emerald-600 text-xs mt-1">
          <Lucide.CheckCircle2 size={13} />
          <span>Approved by {attr.reviewed_by_user_name || 'Platform Admin'}</span>
        </div>
      );
    }

    if (attr.status === 'REJECTED') {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-1 space-y-1">
          <div className="flex items-center gap-1 font-semibold">
            <Lucide.AlertTriangle size={14} className="text-red-600 shrink-0" />
            <span>Platform Reviewer Rejection Comment:</span>
          </div>
          <p className="font-medium text-red-800">{attr.rejection_comment || 'Field value requires revision.'}</p>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-amber-600 text-xs mt-1">
        <Lucide.Clock size={13} />
        <span>Pending Review</span>
      </div>
    );
  };

  // Update single cell value
  const handleUpdateVariantCell = useCallback((variantId: string, field: keyof SellerProductVariant, val: any) => {
    if (isReadOnly) return;
    setGeneratedVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: val } : v));
  }, [isReadOnly]);

  // Atomic Bulk Batch Updates
  const handleApplyBulkPrice = () => {
    if (isReadOnly) return;
    if (bulkPriceInput === null || bulkPriceInput < 0) {
      antMessage.warning('Please enter a valid price amount.');
      return;
    }
    setGeneratedVariants(prev => prev.map(v => ({ ...v, price: bulkPriceInput })));
    antMessage.success(`Updated price to $${bulkPriceInput} across all ${generatedVariants.length} variants.`);
  };

  const handleApplyBulkStock = () => {
    if (isReadOnly) return;
    if (bulkStockInput === null || bulkStockInput < 0) {
      antMessage.warning('Please enter a valid stock quantity.');
      return;
    }
    setGeneratedVariants(prev => prev.map(v => ({ ...v, stock: bulkStockInput })));
    antMessage.success(`Updated stock quantity to ${bulkStockInput} units across all ${generatedVariants.length} variants.`);
  };

  const handleApplyBulkMoq = () => {
    if (isReadOnly) return;
    if (bulkMoqInput === null || bulkMoqInput < 1) {
      antMessage.warning('Please enter a valid min order quantity.');
      return;
    }
    setGeneratedVariants(prev => prev.map(v => ({ ...v, min_order_quantity: bulkMoqInput })));
    antMessage.success(`Updated MOQ to ${bulkMoqInput} across all ${generatedVariants.length} variants.`);
  };

  // Filtered variants based on search query
  const filteredVariants = useMemo(() => {
    if (!variantSearchQuery.trim()) return generatedVariants;
    const q = variantSearchQuery.toLowerCase();
    return generatedVariants.filter(v =>
      v.sku.toLowerCase().includes(q) ||
      v.variant_platform_id.toLowerCase().includes(q) ||
      v.combination_values.some(c => c.label.toLowerCase().includes(q) || c.attribute_name.toLowerCase().includes(q))
    );
  }, [generatedVariants, variantSearchQuery]);

  // Ant Table Columns Configuration
  const variantColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => <span className="text-xs text-gray-400 font-mono">{index + 1}</span>
    },
    {
      title: 'Variant Combination',
      key: 'combination',
      render: (v: SellerProductVariant) => (
        <div>
          <span className="font-semibold text-xs text-gray-900 block">{v.variant_platform_id}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {v.combination_values.map(c => (
              <AntTag key={c.value_id} color="blue" className="text-[11px] py-0 px-1.5">
                {c.attribute_name}: <strong>{c.label}</strong>
              </AntTag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'SKU Code',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
      render: (text: string, record: SellerProductVariant) => (
        <EditableCellInput
          value={text}
          onChange={(newVal) => handleUpdateVariantCell(record.id, 'sku', newVal)}
          placeholder="SKU Code"
          disabled={isReadOnly}
        />
      )
    },
    {
      title: 'Price ($)',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (val: number, record: SellerProductVariant) => (
        <EditableCellNumber
          value={val}
          onChange={(newVal) => handleUpdateVariantCell(record.id, 'price', newVal)}
          min={0}
          disabled={isReadOnly}
        />
      )
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: 90,
      render: (text: string, record: SellerProductVariant) => (
        <EditableCellInput
          value={text}
          onChange={(newVal) => handleUpdateVariantCell(record.id, 'currency', newVal)}
          placeholder="USD"
          disabled={isReadOnly}
        />
      )
    },
    {
      title: 'Stock Qty',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (val: number, record: SellerProductVariant) => (
        <EditableCellNumber
          value={val}
          onChange={(newVal) => handleUpdateVariantCell(record.id, 'stock', newVal)}
          min={0}
          disabled={isReadOnly}
        />
      )
    },
    {
      title: 'Min Order Qty',
      dataIndex: 'min_order_quantity',
      key: 'min_order_quantity',
      width: 100,
      render: (val: number, record: SellerProductVariant) => (
        <EditableCellNumber
          value={val}
          onChange={(newVal) => handleUpdateVariantCell(record.id, 'min_order_quantity', newVal)}
          min={1}
          disabled={isReadOnly}
        />
      )
    }
  ];

  const executeSave = async (values: Record<string, any>, targetStatus: 'DRAFT' | 'SUBMITTED') => {
    if (isReadOnly) {
      antMessage.warning('Editing is disabled for submitted or approved product listings.');
      return;
    }

    if (!activeParty) {
      antMessage.error('No active seller party context found.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionId = editingSubmission ? editingSubmission.id : `sps-${Date.now()}`;
      const isResubmission = editingSubmission && editingSubmission.status === 'NEEDS_REVISION';
      const roundNum = isResubmission ? editingSubmission.current_round + 1 : (editingSubmission?.current_round || 1);

      const fieldLabels: Record<string, { label: string; group: 'IDENTIFIERS' | 'MANUFACTURING' | 'DIMENSIONS' | 'OPERATIONAL' | 'SPECS' | 'VARIANTS' }> = {
        category_id: { label: 'Leaf Category', group: 'IDENTIFIERS' },
        catalog_product_id: { label: 'Master Catalog Product Template', group: 'IDENTIFIERS' },
        product_name: { label: 'Listing Title', group: 'IDENTIFIERS' },
        manufacturer_id: { label: 'Manufacturer', group: 'IDENTIFIERS' },
        brand_id: { label: 'Brand', group: 'IDENTIFIERS' },
        year_of_manufacture: { label: 'Year of Manufacture', group: 'MANUFACTURING' },
        model_number: { label: 'Model Number', group: 'MANUFACTURING' },
        part_number: { label: 'Part Number', group: 'MANUFACTURING' },
        height: { label: 'Height', group: 'DIMENSIONS' },
        width: { label: 'Width', group: 'DIMENSIONS' },
        length: { label: 'Length', group: 'DIMENSIONS' },
        weight: { label: 'Weight', group: 'DIMENSIONS' },
        deviations: { label: 'Deviations', group: 'OPERATIONAL' },
        exclusions: { label: 'Exclusions', group: 'OPERATIONAL' },
        assumptions: { label: 'Assumptions', group: 'OPERATIONAL' },
        operation_instructions: { label: 'Operation Instructions', group: 'OPERATIONAL' },
        safety_instructions: { label: 'Safety Instructions', group: 'OPERATIONAL' },
        handling_instructions: { label: 'Handling Instructions', group: 'OPERATIONAL' },
        maintenance_instructions: { label: 'Maintenance Instructions', group: 'OPERATIONAL' },
        additional_requirements: { label: 'Additional Requirements', group: 'OPERATIONAL' },
        additional_information: { label: 'Additional Information', group: 'OPERATIONAL' },
        specifications: { label: 'Technical Specifications List', group: 'SPECS' },
        variants: { label: 'Sellable Product Variants', group: 'VARIANTS' }
      };

      values.specifications = computedSpecifications;
      values.variants = generatedVariants;

      const updatedAttributes: Record<string, SubmissionAttributeItem> = { ...(editingSubmission?.attributes || {}) };

      Object.keys(fieldLabels).forEach((key) => {
        const val = values[key] ?? null;
        const prevAttr = editingSubmission?.attributes[key];

        let newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
        if (prevAttr && prevAttr.status === 'APPROVED' && JSON.stringify(prevAttr.value) === JSON.stringify(val)) {
          newStatus = 'APPROVED';
        }

        const roundHist = prevAttr?.round_history || [];
        if (prevAttr && prevAttr.status === 'REJECTED') {
          roundHist.push({
            round: editingSubmission.current_round,
            value: prevAttr.value,
            status: 'REJECTED',
            rejection_comment: prevAttr.rejection_comment,
            reviewed_by_user_name: prevAttr.reviewed_by_user_name,
            timestamp: new Date().toISOString()
          });
        }

        updatedAttributes[key] = {
          field_key: key,
          field_label: fieldLabels[key].label,
          field_group: fieldLabels[key].group,
          value: val,
          status: newStatus,
          reviewed_by_user_name: newStatus === 'APPROVED' ? prevAttr?.reviewed_by_user_name : undefined,
          reviewed_at: newStatus === 'APPROVED' ? prevAttr?.reviewed_at : undefined,
          round_history: roundHist
        };
      });

      const now = new Date().toISOString();
      const auditLog = editingSubmission?.audit_history || [];
      auditLog.push({
        id: `aud-${Date.now()}`,
        round: roundNum,
        actor_id: currentUserId || 'usr-seller',
        actor_name: activeWorkspace.name || 'Seller User',
        action: targetStatus === 'DRAFT' ? 'CREATED_DRAFT' : (isResubmission ? 'RESUBMITTED' : 'SUBMITTED'),
        notes: targetStatus === 'DRAFT' ? 'Saved submission draft.' : `Submitted product attributes for review (Round ${roundNum}).`,
        timestamp: now
      });

      const submissionRecord: SellerProductSubmission = {
        id: submissionId,
        party_id: activeParty.id,
        status: targetStatus,
        current_round: roundNum,
        attributes: updatedAttributes,
        audit_history: auditLog,
        created_at: editingSubmission?.created_at || now,
        updated_at: now,
        submitted_at: targetStatus === 'SUBMITTED' ? now : editingSubmission?.submitted_at
      };

      await catalogDb.sellerProductSubmissions.put(submissionRecord);
      antMessage.success(targetStatus === 'DRAFT' ? 'Draft saved successfully.' : `Product submitted for platform review (Round ${roundNum}).`);

      const returnPath = isBusinessWorkspace ? '/b/products' : '/user/seller-products';
      navigate(returnPath);
    } catch (err: any) {
      console.log(err);
      antMessage.error('An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = () => {
    const currentValues = getValues();
    executeSave(currentValues, 'DRAFT');
  };

  const onSubmitReview = (values: SubmissionFormValues) => {
    executeSave(values, 'SUBMITTED');
  };

  // Helper names for summary preview
  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId || 'Not selected';
  const selectedProductName = masterProducts.find(p => p.id === selectedProductId)?.name || selectedProductId || 'Not selected';
  const selectedBrandName = brands.find(b => b.id === formValues.brand_id)?.name || formValues.brand_id || 'Not selected';
  const selectedMfrName = manufacturers.find(m => m.id === formValues.manufacturer_id)?.company_name || formValues.manufacturer_id || 'Not selected';

  // Metrics calculation
  const totalStockSum = useMemo(() => generatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0), [generatedVariants]);

  // Dynamic Header Bar Measurement for Sidebar Sticky Top Offset
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(88);

  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const sidebarStickyTop = useMemo(() => 64 + headerHeight + 16, [headerHeight]);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto pb-16 space-y-6">
      {/* Header Bar (Sticky Top-16 below navbar) */}
      <div ref={headerRef} className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-0">
              {editingSubmission ? `Product Submission #${editingSubmission.id}` : 'Create Seller Product'}
            </h1>
            {editingSubmission && (
              <AntTag color={
                editingSubmission.status === 'SUBMITTED' ? 'processing' :
                  editingSubmission.status === 'NEEDS_REVISION' ? 'error' :
                    editingSubmission.status === 'APPROVED' ? 'success' : 'default'
              } className="text-xs font-semibold">
                {editingSubmission.status.replace('_', ' ')} (Round {editingSubmission.current_round})
              </AntTag>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {isReadOnly ? 'Viewing product submission details (Read-Only Mode).' : 'Fill in product static details, dynamic specifications, auto-generated variants, and submit for platform review.'}
          </p>
        </div>

        <AntSpace>
          <AntButton onClick={() => navigate(isBusinessWorkspace ? '/b/products' : '/user/seller-products')}>
            {isReadOnly ? 'Back to Products' : 'Cancel'}
          </AntButton>
          {!isReadOnly && (
            <>
              <AntButton loading={isSubmitting} onClick={onSaveDraft}>
                Save Draft
              </AntButton>
              <AntButton
                type="primary"
                className="bg-sky-600 hover:bg-sky-700"
                loading={isSubmitting}
                onClick={handleSubmit(onSubmitReview)}
              >
                {editingSubmission?.status === 'NEEDS_REVISION' ? `Resubmit Round ${editingSubmission.current_round + 1}` : 'Submit for Platform Review'}
              </AntButton>
            </>
          )}
        </AntSpace>
      </div>

      {/* Read-Only Status Banner */}
      {isReadOnly && (
        <AntAlert
          type={editingSubmission?.status === 'APPROVED' ? 'success' : 'info'}
          showIcon
          icon={editingSubmission?.status === 'APPROVED' ? <Lucide.CheckCircle2 size={20} /> : <Lucide.Lock size={20} />}
          message={
            <span className="font-bold text-base">
              Submission Lock Active ({editingSubmission?.status.replace('_', ' ')})
            </span>
          }
          description={
            <div className="text-xs space-y-1 mt-1">
              <p>
                This product submission is currently <strong>{editingSubmission?.status.replace('_', ' ')}</strong>. Form fields and variants cannot be edited.
                {editingSubmission?.status === 'SUBMITTED' && ' Platform reviewers are evaluating your product. If revisions are requested, the status will change to Needs Revision and editing will be re-enabled.'}
                {editingSubmission?.status === 'APPROVED' && ' This product submission has been approved by platform governance.'}
              </p>
            </div>
          }
          className="border-blue-300 bg-blue-50"
        />
      )}

      {/* Revision Banner if NEEDS_REVISION */}
      {editingSubmission?.status === 'NEEDS_REVISION' && (
        <AntAlert
          type="error"
          showIcon
          icon={<Lucide.AlertCircle size={20} />}
          message={<span className="font-bold text-base">Revision Requested by Platform (Round {editingSubmission.current_round})</span>}
          description={
            <div className="text-xs space-y-1 mt-1">
              <p>
                Platform reviewers rejected <strong>{rejectedAttributes.length} attribute field(s)</strong>. Please update the highlighted fields below and click <strong>Resubmit Round {editingSubmission.current_round + 1}</strong>.
              </p>
            </div>
          }
          className="border-red-300 bg-red-50"
        />
      )}

      {/* Responsive 2-Column Layout with Right Sticky Live Preview Sidebar */}
      <form onSubmit={handleSubmit(onSubmitReview)}>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* LEFT MAIN FORM COLUMN (8 Cols on Desktop) */}
          <div className="xl:col-span-8 space-y-6">

            {/* 1. BASIC IDENTIFIERS & TAXONOMIES */}
            <AntCard
              title={
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <Lucide.Tag size={18} className="text-sky-600" />
                  1. Basic Identifiers & Taxonomies
                </div>
              }
              className="border border-gray-200 shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Listing Title / Product Name <span className="text-red-500">*</span></label>
                  <Controller
                    name="product_name"
                    control={control}
                    render={({ field }) => (
                      <AntInput {...field} placeholder="e.g. Samsung Galaxy S24 Ultra Enterprise Edition" size="large" disabled={isReadOnly} status={errors.product_name ? 'error' : ''} />
                    )}
                  />
                  {errors.product_name && <span className="text-xs text-red-500 mt-1 block">{errors.product_name.message}</span>}
                  {renderFieldStatusBadge('product_name')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Leaf Category <span className="text-red-500">*</span></label>
                    <Controller
                      name="category_id"
                      control={control}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          allowClear
                          disabled={isReadOnly}
                          onChange={(val) => handleCategoryChange(val)}
                          placeholder="Select Leaf Category"
                          options={categories.map(c => ({ value: c.id, label: `${c.name} (${c.id})` }))}
                          className="w-full"
                          status={errors.category_id ? 'error' : ''}
                        />
                      )}
                    />
                    {errors.category_id && <span className="text-xs text-red-500 mt-1 block">{errors.category_id.message}</span>}
                    {renderFieldStatusBadge('category_id')}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Master Catalog Product Template <span className="text-red-500">*</span></label>
                    <Controller
                      name="catalog_product_id"
                      control={control}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          disabled={isReadOnly}
                          onChange={(val) => handleProductChange(val)}
                          placeholder={selectedCategoryId ? "Select Master Product Template" : "Select Category first or choose Product"}
                          options={availableMasterProducts.map(p => ({ value: p.id, label: `${p.name} (${p.id})` }))}
                          className="w-full"
                          status={errors.catalog_product_id ? 'error' : ''}
                        />
                      )}
                    />
                    {errors.catalog_product_id && <span className="text-xs text-red-500 mt-1 block">{errors.catalog_product_id.message}</span>}
                    {renderFieldStatusBadge('catalog_product_id')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Brand <span className="text-red-500">*</span></label>
                    <Controller
                      name="brand_id"
                      control={control}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          allowClear
                          disabled={isReadOnly}
                          onChange={(val) => handleBrandChange(val)}
                          placeholder="Select Brand"
                          options={availableBrands.map(b => ({ value: b.id, label: `${b.name} (${b.id})` }))}
                          className="w-full"
                          status={errors.brand_id ? 'error' : ''}
                        />
                      )}
                    />
                    {errors.brand_id && <span className="text-xs text-red-500 mt-1 block">{errors.brand_id.message}</span>}
                    {renderFieldStatusBadge('brand_id')}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Manufacturer Unit <span className="text-red-500">*</span></label>
                    <Controller
                      name="manufacturer_id"
                      control={control}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          allowClear
                          disabled={isReadOnly}
                          onChange={(val) => handleManufacturerChange(val)}
                          placeholder="Select Manufacturer"
                          options={availableManufacturers.map(m => ({ value: m.id, label: `${m.company_name} (${m.id})` }))}
                          className="w-full"
                          status={errors.manufacturer_id ? 'error' : ''}
                        />
                      )}
                    />
                    {errors.manufacturer_id && <span className="text-xs text-red-500 mt-1 block">{errors.manufacturer_id.message}</span>}
                    {renderFieldStatusBadge('manufacturer_id')}
                  </div>
                </div>
              </div>
            </AntCard>

            {/* 2. MANUFACTURING & PHYSICAL SPECS */}
            <AntCard
              title={
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <Lucide.Factory size={18} className="text-emerald-600" />
                  2. Manufacturing & Physical Specs
                </div>
              }
              className="border border-gray-200 shadow-sm"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Year of Manufacture</label>
                    <Controller
                      name="year_of_manufacture"
                      control={control}
                      render={({ field }) => (
                        <AntInputNumber
                          {...field}
                          value={field.value ?? undefined}
                          onChange={(val) => field.onChange(val)}
                          disabled={isReadOnly}
                          className="w-full"
                          min={1900}
                          max={2030}
                          status={errors.year_of_manufacture ? 'error' : ''}
                        />
                      )}
                    />
                    {errors.year_of_manufacture && <span className="text-xs text-red-500 mt-1 block">{errors.year_of_manufacture.message}</span>}
                    {renderFieldStatusBadge('year_of_manufacture')}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Model Number</label>
                    <Controller
                      name="model_number"
                      control={control}
                      render={({ field }) => (
                        <AntInput {...field} value={field.value || ''} disabled={isReadOnly} placeholder="Manufacturer Model Number" />
                      )}
                    />
                    {renderFieldStatusBadge('model_number')}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Part Number <span className="text-red-500">*</span></label>
                    <Controller
                      name="part_number"
                      control={control}
                      render={({ field }) => (
                        <AntInput {...field} disabled={isReadOnly} placeholder="Manufacturer Part Number (MPN)" status={errors.part_number ? 'error' : ''} />
                      )}
                    />
                    {errors.part_number && <span className="text-xs text-red-500 mt-1 block">{errors.part_number.message}</span>}
                    {renderFieldStatusBadge('part_number')}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 text-sm pt-4 border-t border-gray-100 mb-2">Physical Dimensions & Weight</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Height</label>
                    <Controller
                      name="height"
                      control={control}
                      render={({ field }) => (
                        <AntInput {...field} value={field.value || ''} disabled={isReadOnly} placeholder="Height (e.g. 162.3 mm)" />
                      )}
                    />
                    {renderFieldStatusBadge('height')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Width</label>
                    <Controller
                      name="width"
                      control={control}
                      render={({ field }) => (
                        <AntInput {...field} value={field.value || ''} disabled={isReadOnly} placeholder="Width (e.g. 79.0 mm)" />
                      )}
                    />
                    {renderFieldStatusBadge('width')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Length</label>
                    <Controller
                      name="length"
                      control={control}
                      render={({ field }) => (
                        <AntInput {...field} value={field.value || ''} disabled={isReadOnly} placeholder="Length (e.g. 8.6 mm)" />
                      )}
                    />
                    {renderFieldStatusBadge('length')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Weight</label>
                    <Controller
                      name="weight"
                      control={control}
                      render={({ field }) => (
                        <AntInput {...field} value={field.value || ''} disabled={isReadOnly} placeholder="Net Weight (e.g. 232 g)" />
                      )}
                    />
                    {renderFieldStatusBadge('weight')}
                  </div>
                </div>
              </div>
            </AntCard>

            {/* 3. OPERATIONAL & GOVERNANCE INSTRUCTIONS */}
            <AntCard
              title={
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <Lucide.ShieldCheck size={18} className="text-purple-600" />
                  3. Operational & Governance Instructions
                </div>
              }
              className="border border-gray-200 shadow-sm"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Operation Instructions</label>
                    <Controller
                      name="operation_instructions"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={3} placeholder="Operating guidelines..." />
                      )}
                    />
                    {renderFieldStatusBadge('operation_instructions')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Safety Instructions</label>
                    <Controller
                      name="safety_instructions"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={3} placeholder="Water resistance, thermal safety..." />
                      )}
                    />
                    {renderFieldStatusBadge('safety_instructions')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Handling Instructions</label>
                    <Controller
                      name="handling_instructions"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={3} placeholder="Storage environment..." />
                      )}
                    />
                    {renderFieldStatusBadge('handling_instructions')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Maintenance Instructions</label>
                    <Controller
                      name="maintenance_instructions"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={3} placeholder="Cleaning and port maintenance..." />
                      )}
                    />
                    {renderFieldStatusBadge('maintenance_instructions')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Deviations</label>
                    <Controller
                      name="deviations"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={2} placeholder="License inclusions..." />
                      )}
                    />
                    {renderFieldStatusBadge('deviations')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Exclusions</label>
                    <Controller
                      name="exclusions"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={2} placeholder="Adapter exclusions..." />
                      )}
                    />
                    {renderFieldStatusBadge('exclusions')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Assumptions</label>
                    <Controller
                      name="assumptions"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={2} placeholder="Charger compatibility..." />
                      )}
                    />
                    {renderFieldStatusBadge('assumptions')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Additional Requirements</label>
                    <Controller
                      name="additional_requirements"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={2} placeholder="e.g. Requires Knox Mobile Enrollment registration upon first boot..." />
                      )}
                    />
                    {renderFieldStatusBadge('additional_requirements')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Additional Information</label>
                    <Controller
                      name="additional_information"
                      control={control}
                      render={({ field }) => (
                        <AntInput.TextArea {...field} value={field.value || ''} disabled={isReadOnly} rows={2} placeholder="e.g. Includes 3-year Knox Suite Enterprise warranty..." />
                      )}
                    />
                    {renderFieldStatusBadge('additional_information')}
                  </div>
                </div>
              </div>
            </AntCard>

            {/* 4. DYNAMIC ATTRIBUTES (COMPACT COLLAPSIBLE ACCORDION LAYOUT) */}
            <AntCard
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-900 font-bold text-base">
                    <Lucide.SlidersHorizontal size={18} className="text-indigo-600" />
                    4. Category Dynamic Attributes ({computedSpecifications.length} Specs, {generatedVariants.length} Variants)
                  </span>
                  {mappedCategoryAttributeGroups.length > 0 && (
                    <AntTag color="blue">{mappedCategoryAttributeGroups.length} Groups</AntTag>
                  )}
                </div>
              }
              className="border border-gray-200 shadow-sm"
            >
              <div className="space-y-4">
                {!selectedCategoryId ? (
                  <AntAlert
                    type="warning"
                    showIcon
                    icon={<Lucide.AlertTriangle size={18} />}
                    message="Category & Master Product Required"
                    description="Please select a Leaf Category and Master Product Template above to load category-specific dynamic attributes."
                  />
                ) : mappedCategoryAttributeGroups.length === 0 ? (
                  <AntAlert
                    type="info"
                    showIcon
                    message="No Mapped Attribute Groups"
                    description={`Leaf Category (${selectedCategoryId}) has no mapped attribute groups configured.`}
                  />
                ) : (
                  <AntCollapse
                    defaultActiveKey={mappedCategoryAttributeGroups.map(g => g.id)}
                    size="small"
                    className="bg-gray-50/50 border border-gray-200 rounded-lg"
                    items={mappedCategoryAttributeGroups.map(grp => ({
                      key: grp.id,
                      label: (
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="font-bold text-gray-900 text-sm">{grp.name}</span>
                          <span className="text-xs text-gray-500 font-normal">
                            {grp.attributes.length} attribute{grp.attributes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ),
                      children: (
                        <div className="space-y-2.5 py-1">
                          {grp.attributes.map(attr => {
                            const targetType = attributeTargetMap[attr.id] || 'SPEC';
                            const currentValIds = attributeSelectedValuesMap[attr.id] || [];

                            return (
                              <div key={attr.id} className="bg-white p-2.5 rounded-md border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                                <div className="w-full md:w-5/12 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-semibold text-gray-900 text-xs">{attr.label}</span>
                                    <span className="text-[11px] font-mono text-gray-400 block">{attr.code}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-[11px] shrink-0">
                                    <span className={`transition-colors ${targetType === 'SPEC' ? 'text-sky-700 font-bold' : 'text-gray-400'}`}>Spec</span>
                                    <AntSwitch
                                      size="small"
                                      disabled={isReadOnly}
                                      checked={targetType === 'VARIANT'}
                                      onChange={(checked) => {
                                        if (isReadOnly) return;
                                        setAttributeTargetMap(prev => ({ ...prev, [attr.id]: checked ? 'VARIANT' : 'SPEC' }));
                                      }}
                                    />
                                    <span className={`transition-colors ${targetType === 'VARIANT' ? 'text-purple-700 font-bold' : 'text-gray-400'}`}>Variant</span>
                                  </div>
                                </div>

                                <div className="w-full md:w-7/12">
                                  <AntSelect
                                    mode="multiple"
                                    size="middle"
                                    disabled={isReadOnly}
                                    placeholder={`Select ${attr.label} values...`}
                                    value={currentValIds}
                                    onChange={(selectedIds) => {
                                      if (isReadOnly) return;
                                      setAttributeSelectedValuesMap(prev => ({ ...prev, [attr.id]: selectedIds }));
                                    }}
                                    options={attr.availableValues.map(v => ({ value: v.id, label: v.label || v.value || v.id }))}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    }))}
                  />
                )}
              </div>
            </AntCard>

            {/* 5. HIGH-PERFORMANCE PAGINATED SELLABLE VARIANTS DIRECTORY WITH BULK ACTIONS */}
            <AntCard
              title={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-gray-900 flex items-center gap-2 text-base">
                    <Lucide.Layers3 size={18} className="text-indigo-600" />
                    5. Sellable Product Variants Directory ({generatedVariants.length} Total SKUs)
                  </span>
                  <AntTag color="purple">High-Performance Paginated View</AntTag>
                </div>
              }
              className="border border-indigo-200 shadow-sm"
            >
              {generatedVariants.length === 0 ? (
                <AntAlert
                  type="info"
                  showIcon
                  icon={<Lucide.Layers3 size={18} />}
                  message="No Product Variants Generated"
                  description="Select dynamic attribute values and toggle usage to 'Variant Attribute' in Section 4 above to automatically generate sellable product variant SKUs."
                />
              ) : (
                <div className="space-y-4">
                  {/* Bulk Batch Actions & Search Filter Toolbar */}
                  <div className="bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="w-full lg:w-72">
                        <AntInput
                          prefix={<Lucide.Search size={14} className="text-gray-400" />}
                          placeholder="Search SKU or attribute..."
                          value={variantSearchQuery}
                          onChange={(e) => setVariantSearchQuery(e.target.value)}
                          allowClear
                          size="middle"
                        />
                      </div>

                      {!isReadOnly && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-2xs">
                            <AntInputNumber
                              placeholder="Price ($)"
                              value={bulkPriceInput}
                              onChange={(val) => setBulkPriceInput(val)}
                              min={0}
                              size="small"
                              className="w-24"
                            />
                            <AntButton size="small" type="primary" onClick={handleApplyBulkPrice} className="bg-indigo-600 hover:bg-indigo-700">
                              Set Price
                            </AntButton>
                          </div>

                          <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-2xs">
                            <AntInputNumber
                              placeholder="Stock Qty"
                              value={bulkStockInput}
                              onChange={(val) => setBulkStockInput(val)}
                              min={0}
                              size="small"
                              className="w-24"
                            />
                            <AntButton size="small" type="primary" onClick={handleApplyBulkStock} className="bg-emerald-600 hover:bg-emerald-700">
                              Set Stock
                            </AntButton>
                          </div>

                          <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-2xs">
                            <AntInputNumber
                              placeholder="MOQ"
                              value={bulkMoqInput}
                              onChange={(val) => setBulkMoqInput(val)}
                              min={1}
                              size="small"
                              className="w-20"
                            />
                            <AntButton size="small" onClick={handleApplyBulkMoq}>
                              Set MOQ
                            </AntButton>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Lucide.Info size={13} className="text-indigo-600 shrink-0" />
                      <span>
                        {isReadOnly ? 'Viewing submitted variant directory.' : `Editing cell inputs updates local state instantly. Click Set Price or Set Stock to bulk update all ${generatedVariants.length} variants in 1 click.`}
                      </span>
                    </div>
                  </div>

                  {/* Paginated Ant Table */}
                  <AntTable
                    rowKey="id"
                    dataSource={filteredVariants}
                    columns={variantColumns}
                    size="small"
                    bordered
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} variants`
                    }}
                    className="overflow-x-auto"
                  />
                </div>
              )}
            </AntCard>
          </div>

          {/* RIGHT STICKY PREVIEW & SUBMISSION SIDEBAR (Dynamic Top Offset below Header Bar) */}
          <div className="xl:col-span-4 sticky space-y-4" style={{ top: `${sidebarStickyTop}px` }}>
            <AntCard
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                    <Lucide.Eye size={16} className="text-emerald-600" />
                    Submission Preview
                  </span>
                  <AntTag color={isReadOnly ? "gold" : "emerald"}>{isReadOnly ? "Read-Only" : "Live Sync"}</AntTag>
                </div>
              }
              className="border border-emerald-200 shadow-md bg-white"
            >
              <div className="space-y-4">
                {/* Product Core Identifiers */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Listing Overview</span>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <div>
                      <span className="text-xs text-gray-500 block">Listing Title</span>
                      <strong className="text-sm text-gray-900 block leading-tight">{formValues.product_name || 'Untitled Listing'}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-200/60">
                      <div>
                        <span className="text-gray-500 block">Category:</span>
                        <span className="font-semibold text-gray-800 truncate block">{selectedCategoryName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Template:</span>
                        <span className="font-semibold text-gray-800 truncate block">{selectedProductName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-200/60">
                      <div>
                        <span className="text-gray-500 block">Brand:</span>
                        <span className="font-semibold text-gray-800 truncate block">{selectedBrandName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Part #:</span>
                        <span className="font-mono text-gray-800 truncate block">{formValues.part_number || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Specifications */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dynamic Specs</span>
                    <AntTag color="blue" className="text-[10px] py-0 px-1">{computedSpecifications.length} Configured</AntTag>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto space-y-1.5">
                    {computedSpecifications.length === 0 ? (
                      <span className="text-gray-400 text-xs italic block">No dynamic specifications selected yet.</span>
                    ) : (
                      computedSpecifications.map(spec => (
                        <div key={spec.attribute_id} className="text-xs border-b border-gray-200/50 pb-1.5 last:border-b-0">
                          <span className="font-semibold text-gray-800 block">{spec.attribute_name}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {spec.values.map(v => (
                              <AntTag key={v.id} color="cyan" className="text-[10px] py-0 px-1">
                                {v.label}
                              </AntTag>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Generated Variants Metrics */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sellable Variants</span>
                    <AntTag color="purple" className="text-[10px] py-0 px-1">{generatedVariants.length} SKUs</AntTag>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-purple-200 text-center">
                        <span className="text-gray-500 text-[10px] block">Total Variants</span>
                        <strong className="text-base text-purple-700 font-bold">{generatedVariants.length}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-purple-200 text-center">
                        <span className="text-gray-500 text-[10px] block">Total Stock</span>
                        <strong className="text-base text-emerald-700 font-bold">{totalStockSum}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AntCard>
          </div>

        </div>
      </form>
    </div>
  );
};

export default SellerProductSubmissionForm;
