// 6. Attribute Values Pool (Min 5 values per attribute = 120 total values)
export const attribute_values = [
  // attr-1: Color
  { id: "val-1", raw_value: "Matte Black", display_value: "Matte Black" },
  { id: "val-2", raw_value: "Eclipse Gray", display_value: "Eclipse Gray" },
  { id: "val-3", raw_value: "Moonlight White", display_value: "Moonlight White" },
  { id: "val-4", raw_value: "Cyber Teal", display_value: "Cyber Teal" },
  { id: "val-5", raw_value: "Crimson Red", display_value: "Crimson Red" },

  // attr-2: OS
  { id: "val-6", raw_value: "Win 11 Home", display_value: "Windows 11 Home" },
  { id: "val-7", raw_value: "Win 11 Pro", display_value: "Windows 11 Pro" },
  { id: "val-8", raw_value: "No OS", display_value: "FreeDOS / No OS" },
  { id: "val-9", raw_value: "Ubuntu", display_value: "Ubuntu Linux 24.04" },
  { id: "val-10", raw_value: "SteamOS", display_value: "SteamOS Custom" },

  // attr-3: RAM
  { id: "val-11", raw_value: "8GB", display_value: "8 GB DDR5" },
  { id: "val-12", raw_value: "16GB", display_value: "16 GB DDR5" },
  { id: "val-13", raw_value: "32GB", display_value: "32 GB DDR5" },
  { id: "val-14", raw_value: "64GB", display_value: "64 GB DDR5" },
  { id: "val-15", raw_value: "128GB", display_value: "128 GB DDR5" },

  // attr-4: GPU
  { id: "val-16", raw_value: "RTX 4050", display_value: "NVIDIA RTX 4050 6GB" },
  { id: "val-17", raw_value: "RTX 4060", display_value: "NVIDIA RTX 4060 8GB" },
  { id: "val-18", raw_value: "RTX 4070", display_value: "NVIDIA RTX 4070 8GB" },
  { id: "val-19", raw_value: "RTX 4080", display_value: "NVIDIA RTX 4080 12GB" },
  { id: "val-20", raw_value: "RTX 4090", display_value: "NVIDIA RTX 4090 16GB" },

  // attr-5: Screen Size
  { id: "val-21", raw_value: "14 Inches", display_value: '14.0"' },
  { id: "val-22", raw_value: "15.6 Inches", display_value: '15.6"' },
  { id: "val-23", raw_value: "16 Inches", display_value: '16.0"' },
  { id: "val-24", raw_value: "17.3 Inches", display_value: '17.3"' },
  { id: "val-25", raw_value: "18 Inches", display_value: '18.0"' },

  // attr-6: Refresh Rate
  { id: "val-26", raw_value: "144Hz", display_value: "144 Hz" },
  { id: "val-27", raw_value: "165Hz", display_value: "165 Hz" },
  { id: "val-28", raw_value: "240Hz", display_value: "240 Hz" },
  { id: "val-29", raw_value: "300Hz", display_value: "300 Hz" },
  { id: "val-30", raw_value: "360Hz", display_value: "360 Hz" },

  // attr-7: Exterior Finish
  { id: "val-31", raw_value: "Titanium Black", display_value: "Titanium Black" },
  { id: "val-32", raw_value: "Titanium Gray", display_value: "Titanium Gray" },
  { id: "val-33", raw_value: "Titanium Violet", display_value: "Titanium Violet" },
  { id: "val-34", raw_value: "Titanium Yellow", display_value: "Titanium Yellow" },
  { id: "val-35", raw_value: "Ceramic White", display_value: "Ceramic White" },

  // attr-8: IP Rating
  { id: "val-36", raw_value: "IP65", display_value: "IP65 Dust/Water Resistant" },
  { id: "val-37", raw_value: "IP67", display_value: "IP67 Immersion Up to 1m" },
  { id: "val-38", raw_value: "IP68", display_value: "IP68 Immersion Up to 1.5m" },
  { id: "val-39", raw_value: "IP68 Submerged", display_value: "IP68 Immersion Up to 6m" },
  { id: "val-40", raw_value: "IP69K", display_value: "IP69K High Pressure Wash" },

  // attr-9: Internal Storage
  { id: "val-41", raw_value: "128GB", display_value: "128 GB NVMe" },
  { id: "val-42", raw_value: "256GB", display_value: "256 GB NVMe" },
  { id: "val-43", raw_value: "512GB", display_value: "512 GB NVMe" },
  { id: "val-44", raw_value: "1TB", display_value: "1 TB NVMe" },
  { id: "val-45", raw_value: "2TB", display_value: "2 TB NVMe" },

  // attr-10: Processor Chipset
  { id: "val-46", raw_value: "Snapdragon 8 Gen 2", display_value: "Snapdragon 8 Gen 2" },
  { id: "val-47", raw_value: "Snapdragon 8 Gen 3", display_value: "Snapdragon 8 Gen 3" },
  { id: "val-48", raw_value: "Apple A17 Pro", display_value: "Apple A17 Pro" },
  { id: "val-49", raw_value: "Apple A18 Pro", display_value: "Apple A18 Pro" },
  { id: "val-50", raw_value: "Dimensity 9300", display_value: "MediaTek Dimensity 9300" },

  // attr-11: Main Camera Resolution
  { id: "val-51", raw_value: "48MP", display_value: "48 Megapixels" },
  { id: "val-52", raw_value: "50MP", display_value: "50 Megapixels" },
  { id: "val-53", raw_value: "64MP", display_value: "64 Megapixels" },
  { id: "val-54", raw_value: "108MP", display_value: "108 Megapixels" },
  { id: "val-55", raw_value: "200MP", display_value: "200 Megapixels" },

  // attr-12: Telephoto Zoom
  { id: "val-56", raw_value: "2x Optical", display_value: "2x Optical Zoom" },
  { id: "val-57", raw_value: "3x Optical", display_value: "3x Optical Zoom" },
  { id: "val-58", raw_value: "5x Periscope", display_value: "5x Periscope Zoom" },
  { id: "val-59", raw_value: "10x Periscope", display_value: "10x Periscope Zoom" },
  { id: "val-60", raw_value: "100x Space Zoom", display_value: "100x Space Zoom (Hybrid)" },

  // attr-13: US Shoe Size
  { id: "val-61", raw_value: "US 8", display_value: "US 8.0" },
  { id: "val-62", raw_value: "US 9", display_value: "US 9.0" },
  { id: "val-63", raw_value: "US 10", display_value: "US 10.0" },
  { id: "val-64", raw_value: "US 11", display_value: "US 11.0" },
  { id: "val-65", raw_value: "US 12", display_value: "US 12.0" },

  // attr-14: Shoe Width
  { id: "val-66", raw_value: "B", display_value: "Narrow (B)" },
  { id: "val-67", raw_value: "D", display_value: "Standard (D)" },
  { id: "val-68", raw_value: "2E", display_value: "Wide (2E)" },
  { id: "val-69", raw_value: "4E", display_value: "Extra Wide (4E)" },
  { id: "val-70", raw_value: "6E", display_value: "Super Wide (6E)" },

  // attr-15: Upper Material
  { id: "val-71", raw_value: "Engineered Mesh", display_value: "Engineered Mesh" },
  { id: "val-72", raw_value: "Flyknit", display_value: "Woven Flyknit" },
  { id: "val-73", raw_value: "Ripstop Nylon", display_value: "Ripstop Nylon" },
  { id: "val-74", raw_value: "Primeknit", display_value: "Primeknit Textile" },
  { id: "val-75", raw_value: "Recycled Polyester", display_value: "Recycled Polyester Mesh" },

  // attr-16: Outsole Rubber
  { id: "val-76", raw_value: "Continental", display_value: "Continental™ Rubber" },
  { id: "val-77", raw_value: "Vibram Megagrip", display_value: "Vibram® Megagrip" },
  { id: "val-78", raw_value: "AHAR+", display_value: "AHAR+ High Abrasion Rubber" },
  { id: "val-79", raw_value: "PUMAGRIP", display_value: "PUMAGRIP High-Traction" },
  { id: "val-80", raw_value: "Blow Rubber", display_value: "Blown Carbon Rubber" },

  // attr-17: Arch Support
  { id: "val-81", raw_value: "Neutral", display_value: "Neutral Arch" },
  { id: "val-82", raw_value: "Low/Flat", display_value: "Low Arch / Pronation Support" },
  { id: "val-83", raw_value: "High Arch", display_value: "High Arch Cushion" },
  { id: "val-84", raw_value: "Motion Control", display_value: "Severe Overpronation Control" },
  { id: "val-85", raw_value: "Custom Rigid", display_value: "Orthotic Adaptable" },

  // attr-18: Cushion Level
  { id: "val-86", raw_value: "Barefoot", display_value: "Minimalist / Barefoot" },
  { id: "val-87", raw_value: "Responsive", display_value: "Light & Responsive" },
  { id: "val-88", raw_value: "Balanced", display_value: "Balanced Daily Cushioning" },
  { id: "val-89", raw_value: "Max Cushion", display_value: "Max Plush Foam" },
  { id: "val-90", raw_value: "Carbon Plated", display_value: "Superfoam + Carbon Plate" },

  // attr-19: Body Edition
  { id: "val-91", raw_value: "Black Body", display_value: "Classic Black" },
  { id: "val-92", raw_value: "Silver Retro", display_value: "Silver Chrome Retro" },
  { id: "val-93", raw_value: "Graphite", display_value: "Graphite Matte" },
  { id: "val-94", raw_value: "Olive Drab", display_value: "Olive Drab Special Edition" },
  { id: "val-95", raw_value: "Bronze", display_value: "Bronze Anodized" },

  // attr-20: Grip Style
  { id: "val-96", raw_value: "Standard Grip", display_value: "Standard Integrated Grip" },
  { id: "val-97", raw_value: "Extended Grip", display_value: "Extended Deep Grip" },
  { id: "val-98", raw_value: "Battery Grip", display_value: "Vertical Battery Grip Included" },
  { id: "val-99", raw_value: "Retro Flat", display_value: "Flat Retro Rangefinder Style" },
  { id: "val-100", raw_value: "L-Bracket", display_value: "L-Bracket Compatible Grip" },

  // attr-21: Sensor Megapixels
  { id: "val-101", raw_value: "24MP", display_value: "24.2 Megapixels" },
  { id: "val-102", raw_value: "33MP", display_value: "33.0 Megapixels" },
  { id: "val-103", raw_value: "45MP", display_value: "45.0 Megapixels" },
  { id: "val-104", raw_value: "61MP", display_value: "61.0 Megapixels" },
  { id: "val-105", raw_value: "102MP", display_value: "102.0 Megapixels" },

  // attr-22: Max Native ISO
  { id: "val-106", raw_value: "ISO 25600", display_value: "ISO 25,600" },
  { id: "val-107", raw_value: "ISO 51200", display_value: "ISO 51,200" },
  { id: "val-108", raw_value: "ISO 102400", display_value: "ISO 102,400" },
  { id: "val-109", raw_value: "ISO 204800", display_value: "ISO 204,800" },
  { id: "val-110", raw_value: "ISO 409600", display_value: "ISO 409,600" },

  // attr-23: Max Video Resolution
  { id: "val-111", raw_value: "4K 60p", display_value: "4K at 60 FPS" },
  { id: "val-112", raw_value: "4K 120p", display_value: "4K at 120 FPS" },
  { id: "val-113", raw_value: "6K 30p", display_value: "6K Open Gate at 30 FPS" },
  { id: "val-114", raw_value: "8K 30p", display_value: "8K RAW at 30 FPS" },
  { id: "val-115", raw_value: "8K 60p", display_value: "8K RAW at 60 FPS" },

  // attr-24: Continuous Burst FPS
  { id: "val-116", raw_value: "10 FPS", display_value: "10 fps Mechanical" },
  { id: "val-117", raw_value: "15 FPS", display_value: "15 fps Mechanical" },
  { id: "val-118", raw_value: "20 FPS", display_value: "20 fps Electronic" },
  { id: "val-119", raw_value: "30 FPS", display_value: "30 fps Electronic" },
  { id: "val-120", raw_value: "120 FPS", display_value: "120 fps Blackout-Free" }
];