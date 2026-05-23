/**
 * Products example: list with filters, fetch single product, browse variants
 * Run: npx ts-node specs/examples/typescript/products.ts
 */

const BASE = 'http://localhost:3001';

async function listProducts(params?: Record<string, string | number>) {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).map(([k, v]) => [k, String(v)]),
  ).toString();
  const res = await fetch(`${BASE}/products${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`GET /products failed: ${res.status}`);
  return res.json();
}

async function getProduct(id: string) {
  const res = await fetch(`${BASE}/products/${id}`);
  if (!res.ok) throw new Error(`GET /products/${id} failed: ${res.status}`);
  return res.json();
}

async function listCollections() {
  const res = await fetch(`${BASE}/collections`);
  if (!res.ok) throw new Error(`GET /collections failed: ${res.status}`);
  return res.json();
}

async function main() {
  console.log('Fetching first page of products (limit 5)…');
  const page1 = await listProducts({ page: 1, limit: 5 });
  console.log(`Total products: ${page1.total}`);
  page1.data.forEach((p: any) =>
    console.log(`  [${p.id}] ${p.name} — ${p.basePrice} ${p.currency}`),
  );

  if (page1.data.length > 0) {
    const first = page1.data[0];
    console.log(`\nFetching product detail for "${first.name}"…`);
    const detail = await getProduct(first.id);
    console.log('Variants:', detail.variants?.length ?? 0);
    console.log('Photos:', detail.photos?.length ?? 0);
  }

  console.log('\nFiltering products with sortBy=basePrice&order=asc…');
  const sorted = await listProducts({ sortBy: 'basePrice', order: 'asc', limit: 3 });
  sorted.data.forEach((p: any) =>
    console.log(`  ${p.name}: ${p.basePrice} ${p.currency}`),
  );

  console.log('\nFetching collections…');
  const collections = await listCollections();
  console.log(`Collections: ${collections.total}`);
  collections.data.forEach((c: any) => console.log(`  [${c.slug}] ${c.displayName}`));
}

main().catch(console.error);
