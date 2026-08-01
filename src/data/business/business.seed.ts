import { businessDb } from "./business.db";
import { mockBrands } from "./brands";
import { mockBrandParties } from "./brandParties";
import { mockManufacturers } from "./manufacturers";
import { mockParties } from "./parties";
import { mockPartyClaims } from "./partyClaims";
import { mockBusinessSubmissions } from "./businessSubmissions";

export { mockBrands, mockBrandParties, mockManufacturers, mockParties, mockPartyClaims, mockBusinessSubmissions };

export const seedBusinessModule = async () => {
  const count = await businessDb.brands.count();
  if (count === 0) {
    await businessDb.brands.bulkPut(mockBrands);
    await businessDb.brandParties.bulkPut(mockBrandParties);
    await businessDb.manufacturers.bulkPut(mockManufacturers);
    await businessDb.parties.bulkPut(mockParties);
    await businessDb.partyClaims.bulkPut(mockPartyClaims);
    await businessDb.businessSubmissions.bulkPut(mockBusinessSubmissions);
    console.log("[Business Module] Database seeded successfully.");
  } else {
    const subCount = await businessDb.businessSubmissions.count();
    if (subCount === 0) {
      await businessDb.businessSubmissions.bulkPut(mockBusinessSubmissions);
    }
  }
};
