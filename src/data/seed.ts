import { seedUserModule } from "./user";
import { seedBusinessModule } from "./business";
import { seedCatalogModule } from "./catalog";

let seedPromise: Promise<void> | null = null;

export const seedDatabase = async () => {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      console.log("--- Seeding Delexy Master Modular Database ---");
      await seedUserModule();
      await seedBusinessModule();
      await seedCatalogModule();
      console.log("--- Delexy Master Modular Database Seeded Successfully ---");
    } catch (error) {
      console.error("Error seeding master database:", error);
    }
  })();

  return seedPromise;
};
