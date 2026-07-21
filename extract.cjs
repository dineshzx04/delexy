const fs = require('fs');
const content = fs.readFileSync('src/data/seed.ts', 'utf8');

const upMatch = content.match(/const userProducts = \[([\s\S]*?)\];\s*await db\.userProducts\.bulkAdd/);
if (upMatch) {
  fs.writeFileSync('src/data/mockData/userProducts.ts', 'export const userProducts = [' + upMatch[1] + '];\n');
  console.log('Extracted userProducts');
} else {
  console.log('userProducts not found');
}

const rfqMatch = content.match(/const rfqs = \[([\s\S]*?)\];\s*await db\.rfqs\.bulkAdd/);
if (rfqMatch) {
  fs.writeFileSync('src/data/mockData/rfqs.ts', 'export const rfqs = [' + rfqMatch[1] + '];\n');
  console.log('Extracted rfqs');
} else {
  console.log('rfqs not found');
}
