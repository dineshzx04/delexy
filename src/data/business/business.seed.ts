import { businessDb } from "./business.db";
import { mockBrands } from "./brands";
import { mockBrandParties } from "./brandParties";
import { mockManufacturers } from "./manufacturers";
import { mockParties } from "./parties";
import { mockPartyClaims } from "./partyClaims";

export { mockBrands, mockBrandParties, mockManufacturers, mockParties, mockPartyClaims };

export const seedBusinessModule = async () => {
  const count = await businessDb.brands.count();
  if (count === 0) {
    await businessDb.brands.bulkPut(mockBrands);
    await businessDb.brandParties.bulkPut(mockBrandParties);
    await businessDb.manufacturers.bulkPut(mockManufacturers);
    await businessDb.parties.bulkPut(mockParties);
    await businessDb.partyClaims.bulkPut(mockPartyClaims);
    console.log("[Business Module] Database seeded successfully.");
  }
};
