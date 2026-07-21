const fs = require('fs');

const content = fs.readFileSync('src/data/mockData/userProducts.ts', 'utf8');

// evaluate the array
const arrayText = content.replace('export const userProducts = ', '').replace(/;\s*$/, '');

let arr;
try {
  arr = eval('(' + arrayText + ')');
} catch (e) {
  console.error("Eval failed", e);
  process.exit(1);
}

const reviews = arr.filter(p => p.status !== 'Published');
const published = arr.filter(p => p.status === 'Published');

fs.writeFileSync('src/data/mockData/userProductReviews.ts', 'export const userProductReviews = ' + JSON.stringify(reviews, null, 2) + ';\n');
fs.writeFileSync('src/data/mockData/userProducts.ts', 'export const userProducts = ' + JSON.stringify(published, null, 2) + ';\n');
console.log('Split complete');
