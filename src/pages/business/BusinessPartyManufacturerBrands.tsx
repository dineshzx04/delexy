import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tag, Button, Badge } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { businessDb } from '../../data/business';

const BusinessPartyManufacturerBrands: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { activeWorkspace } = useWorkspace();
  const currentBizId = businessId || activeWorkspace.businessId || activeWorkspace.id || 'bus-a';

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Party, Manufacturer & Brands</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // 1. Fetch Business Party Record strictly from Dexie DB
  const bizRecord = useLiveQuery(
    async () => await businessDb.parties
      .where('owner_id').equals(currentBizId)
      .filter((p) => p.owner_type === 'BUSINESS')
      .first(),
    [currentBizId]
  );

  // 2. Fetch Manufacturer Account for this Party strictly from Dexie DB
  const manufacturer = useLiveQuery(
    async () => (bizRecord ? await businessDb.manufacturers.where('manufacturer_party_id').equals(bizRecord.id).first() : undefined),
    [bizRecord?.id]
  );

  // 3. Fetch Brands Owned / Claimed by this Party strictly from Dexie DB
  const ownedBrandParties = useLiveQuery(
    async () => {
      if (!bizRecord) return [];
      const bParties = await businessDb.brandParties.where('party_id').equals(bizRecord.id).toArray();
      const allBrands = await businessDb.brands.toArray();
      return bParties.map((bp) => ({
        ...bp,
        brand: allBrands.find((b) => b.id === bp.brand_id),
      }));
    },
    [bizRecord?.id]
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lucide.Building2 className="text-indigo-600" size={26} />
            Party, Manufacturer & Brand Assets
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your 1:1 Corporate Party identity, Manufacturer account profile, and owned/claimed Brand assets.
          </p>
        </div>
        <Button type="primary" icon={<Lucide.PlusCircle size={16} />} className="bg-indigo-600 hover:bg-indigo-700">
          Claim New Brand
        </Button>
      </div>

      {/* Party Identity Banner */}
      <Card className="shadow-sm border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {bizRecord?.display_name?.charAt(0) || 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">{bizRecord?.display_name || 'Business Party'}</h2>
                {bizRecord?.is_verified && <Tag color="green">Verified Party</Tag>}
                {bizRecord?.is_claimed ? <Tag color="blue">Claimed</Tag> : <Tag color="orange">Unclaimed</Tag>}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Party ID: <span className="font-semibold text-slate-700">{bizRecord?.id || 'N/A'}</span> | Owner ID: <span className="font-semibold text-slate-700">{bizRecord?.owner_id || currentBizId}</span>
              </p>
            </div>
          </div>
          <Tag color="purple" className="px-3 py-1 text-sm font-semibold">
            {bizRecord?.owner_type || 'BUSINESS'} PARTY
          </Tag>
        </div>
      </Card>

      {/* Manufacturer Account Section */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Lucide.Factory className="text-sky-600" size={20} />
            My Manufacturer Account Profile
          </div>
        }
        className="shadow-sm"
      >
        {manufacturer ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Company Name</span>
              <span className="text-base font-semibold text-slate-800">{manufacturer.company_name}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Registration Number</span>
              <span className="text-base font-mono font-semibold text-slate-800">{manufacturer.registration_number || 'N/A'}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Manufacturer Status</span>
              <Tag color={manufacturer.status === 'ACTIVE' ? 'green' : 'gold'} className="font-semibold px-2.5 py-0.5 text-xs">
                {manufacturer.status}
              </Tag>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Lucide.Factory className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No Manufacturer account registered for this Business Party.</p>
            <Button size="small" type="primary" className="mt-3 bg-sky-600">Register Manufacturer Account</Button>
          </div>
        )}
      </Card>

      {/* Brands Owned & Claimed Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lucide.Award className="text-amber-500" size={20} />
              Brands Owned & Claimed ({ownedBrandParties.length})
            </div>
          </div>
        }
        className="shadow-sm"
      >
        {ownedBrandParties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownedBrandParties.map((bp) => (
              <div key={bp.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {bp.brand?.logo_url ? (
                      <img src={bp.brand.logo_url} alt={bp.brand.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        {bp.brand?.name?.charAt(0) || 'B'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{bp.brand?.name || 'Brand'}</h3>
                      <span className="text-xs text-slate-400 font-mono">{bp.brand?.slug}</span>
                    </div>
                  </div>
                  <Tag color={bp.claim_status === 'VERIFIED' ? 'green' : 'gold'} className="font-medium text-xs">
                    {bp.claim_status}
                  </Tag>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Claim Status:</span>
                  <Badge status={bp.claim_status === 'VERIFIED' ? 'success' : 'processing'} text={<span className="font-semibold text-slate-700">{bp.claim_status === 'VERIFIED' ? 'Verified Claim' : 'Claim ' + bp.claim_status}</span>} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Lucide.Award className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No Brands claimed or owned by this Business Party.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BusinessPartyManufacturerBrands;
