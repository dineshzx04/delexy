const fs = require('fs');
const path = require('path');

const pages = [
  'platform/PlatformDashboard.tsx',
  'platform/TenantManagement.tsx',
  'platform/ProductApprovals.tsx',
  'tenant/TenantDashboard.tsx',
  'tenant/Procurement/PurchaseOrders.tsx',
  'tenant/Sales/SellerProducts.tsx',
  'tenant/Finance/Invoices.tsx',
  'tenant/Warehouse/Inventory.tsx',
  'tenant/TeamManagement.tsx',
  'tenant/OrgSettings.tsx',
  'individual/MarketplaceHome.tsx',
  'individual/ProductCatalog.tsx',
  'individual/MyOrders.tsx',
  'individual/UserSettings.tsx',
  'auth/Login.tsx',
  'auth/Register.tsx'
];

pages.forEach(page => {
  const fullPath = path.join('src/pages', page);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const componentName = path.basename(page, '.tsx');
  const content = `import React from 'react';\n\nconst ${componentName} = () => {\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-semibold mb-4">${componentName}</h1>\n      <p>This is a placeholder for ${componentName}.</p>\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
  fs.writeFileSync(fullPath, content);
});
console.log('Pages generated.');
