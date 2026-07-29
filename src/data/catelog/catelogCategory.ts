export const hierarchical_categories = [
  // Branch 1: Laptops
  { id: "cat-1", name: "Electronics", parent_id: null, level: 0 },
  { id: "cat-2", name: "Computers & Laptops", parent_id: "cat-1", level: 1 },
  { id: "cat-3", name: "Laptops", parent_id: "cat-2", level: 2 },
  { id: "cat-4", name: "Gaming Laptops", parent_id: "cat-3", level: 3 },

  // Branch 2: Mobile Phones
  { id: "cat-5", name: "Mobile Communications", parent_id: "cat-1", level: 1 },
  { id: "cat-6", name: "Smartphones", parent_id: "cat-5", level: 2 },
  { id: "cat-7", name: "Flagship Smartphones", parent_id: "cat-6", level: 3 },

  // Branch 3: Apparel
  { id: "cat-8", name: "Apparel & Fashion", parent_id: null, level: 0 },
  { id: "cat-9", name: "Footwear", parent_id: "cat-8", level: 1 },
  { id: "cat-10", name: "Athletic Shoes", parent_id: "cat-9", level: 2 },
  { id: "cat-11", name: "Pro Running Shoes", parent_id: "cat-10", level: 3 },

  // Branch 4: Cameras
  { id: "cat-12", name: "Cameras & Optics", parent_id: "cat-1", level: 1 },
  { id: "cat-13", name: "Digital Cameras", parent_id: "cat-12", level: 2 },
  { id: "cat-14", name: "Mirrorless Cameras", parent_id: "cat-13", level: 3 }
];