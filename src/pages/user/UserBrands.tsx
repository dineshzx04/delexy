import React from 'react';
import { Card, Tag, Badge, Tooltip } from 'antd';
import * as Lucide from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { businessDb } from '../../data/business';
import { catalogDb } from '../../data/catalog';

const UserBrands: React.FC = () => {
  const { currentUserId, currentUser } = useWorkspace();

  const breadcrumbs = React.useMemo(() => [
    { title: <span className="text-slate-800 font-semibold">Brands & Manufacturers I Sell</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  // 1. Fetch User Personal Party
  const userParty = useLiveQuery(
    async () => await businessDb.parties
      .where('owner_id').equals(currentUserId)
      .filter((p) => p.owner_type === 'USER')
      .first(),
    [currentUserId]
  );

  // 2. Derive Brands and Manufacturers I Sell from SellerProduct catalog entries
  const sellingInfo = useLiveQuery(
    async () => {
      const sellerPartyId = userParty?.id || 'pty-6';
      const mySellerProducts = await catalogDb.sellerProducts.where('party_id').equals(sellerPartyId).toArray();

      // Unique Brand IDs sold by user
      const brandIds = Array.from(new Set(mySellerProducts.map((sp) => sp.brand_id).filter(Boolean))) as string[];
      const allBrands = await businessDb.brands.toArray();
      const sellingBrands = allBrands.filter((b) => brandIds.includes(b.id)).map((b) => {
        const count = mySellerProducts.filter((sp) => sp.brand_id === b.id).length;
        return { ...b, listingsCount: count };
      });

      // Unique Manufacturers sold by user
      const mfgIds = Array.from(new Set(mySellerProducts.map((sp) => sp.manufacturer_id).filter(Boolean))) as string[];
      const allMfgs = await businessDb.manufacturers.toArray();
      const allParties = await businessDb.parties.toArray();

      const sellingMfgs = mfgIds.map((mfgId) => {
        const mfg = allMfgs.find((m) => m.id === mfgId);
        const mfgPartyId = mfg?.manufacturer_party_id;
        const party = mfgPartyId ? allParties.find((p) => p.id === mfgPartyId) : null;
        const count = mySellerProducts.filter((sp) => sp.manufacturer_id === mfgId).length;
        return {
          partyId: mfgPartyId || mfgId,
          companyName: mfg?.company_name || party?.display_name || 'Unclaimed Manufacturer',
          status: mfg?.status || 'PENDING_VERIFICATION',
          isClaimed: party?.is_claimed ?? false,
          listingsCount: count,
        };
      });

      return { brands: sellingBrands, manufacturers: sellingMfgs };
    },
    [userParty?.id]
  ) || { brands: [], manufacturers: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Lucide.ShoppingBag className="text-sky-600" size={26} />
          Brands & Manufacturers I Sell
        </h1>
        <p className="text-slate-500 text-sm">
          Overview of product brands and manufacturers you list for sale. Note: Individual Users do not own or claim brands; you list products for authorized resale.
        </p>
      </div>

      {/* Personal Party Identity Card */}
      <Card className="shadow-sm border-sky-100 bg-gradient-to-r from-sky-50/50 via-white to-indigo-50/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">{currentUser?.full_name || 'User Account'}</h2>
                <Tag color="blue">Active Seller</Tag>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Personal Party ID: <span className="font-semibold text-slate-700">{userParty?.id || 'pty-6'}</span> | User ID: <span className="font-semibold text-slate-700">{currentUserId}</span>
              </p>
            </div>
          </div>

          <Tooltip title="Individual users list products for sale without corporate brand/manufacturer ownership.">
            <Tag color="orange" className="px-3 py-1 text-sm font-semibold flex items-center gap-1 cursor-help">
              <Lucide.Info size={14} /> SELLER (NON-OWNER)
            </Tag>
          </Tooltip>
        </div>
      </Card>

      {/* Brands I Sell Grid */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Lucide.Award className="text-amber-500" size={20} />
            Brands I Offer For Sale ({sellingInfo.brands.length})
          </div>
        }
        className="shadow-sm"
      >
        {sellingInfo.brands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellingInfo.brands.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-all bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                        {b.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{b.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{b.slug}</span>
                    </div>
                  </div>
                  <Tag color={b.is_verified ? 'green' : 'gold'} className="font-medium text-xs">
                    {b.is_verified ? 'Verified Brand' : 'Unverified'}
                  </Tag>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Your Catalog Listings:</span>
                  <Badge count={`${b.listingsCount} Products`} style={{ backgroundColor: '#0284c7' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Lucide.Award className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No product brand listings found for this seller.</p>
          </div>
        )}
      </Card>

      {/* Manufacturers I Sell Grid */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Lucide.Factory className="text-indigo-600" size={20} />
            Manufacturers Of Products I Sell ({sellingInfo.manufacturers.length})
          </div>
        }
        className="shadow-sm"
      >
        {sellingInfo.manufacturers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellingInfo.manufacturers.map((m) => (
              <div key={m.partyId} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{m.companyName}</h3>
                    <span className="text-xs text-slate-400 font-mono">Party ID: {m.partyId}</span>
                  </div>
                  <Tag color={m.isClaimed ? 'blue' : 'orange'} className="font-medium text-xs">
                    {m.isClaimed ? 'Claimed' : 'Unclaimed'}
                  </Tag>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Listings Supplied:</span>
                  <Badge count={`${m.listingsCount} Products`} style={{ backgroundColor: '#6366f1' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Lucide.Factory className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No manufacturer product listings found for this seller.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserBrands;
