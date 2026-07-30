import Dexie, { type Table } from "dexie";
import type { Brand, BrandParty, Manufacturer, Party, PartyClaim } from "./business.module";

export class BusinessDatabase extends Dexie {
  brands!: Table<Brand, string>;
  brandParties!: Table<BrandParty, string>;
  manufacturers!: Table<Manufacturer, string>;
  parties!: Table<Party, string>;
  partyClaims!: Table<PartyClaim, string>;

  constructor() {
    super("delexy_business_db");
    this.version(1).stores({
      brands: "id, slug",
      brandParties: "id, brand_id, party_id, claim_status",
      manufacturers: "id, manufacturer_party_id",
      parties: "id, owner_type, owner_id",
      partyClaims: "id, target_party_id, claimant_party_id, claimant_user_id",
    });
  }
}

export const businessDb = new BusinessDatabase();
