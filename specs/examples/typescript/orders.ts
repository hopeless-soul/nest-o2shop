/**
 * Orders example: browse shipping methods → pick a product variant → place a guest order → look up by order number
 * Run: npx ts-node specs/examples/typescript/orders.ts
 * Note: requires a running DB with at least one published product that has a variant with stock.
 */

const BASE = 'http://localhost:3001';

async function getShippingMethods() {
  const res = await fetch(`${BASE}/shipping-methods`);
  if (!res.ok) throw new Error(`GET /shipping-methods failed: ${res.status}`);
  return res.json();
}

async function getProducts(limit = 5) {
  const res = await fetch(`${BASE}/products?limit=${limit}`);
  if (!res.ok) throw new Error(`GET /products failed: ${res.status}`);
  return res.json();
}

async function getProduct(name: string) {
  const res = await fetch(`${BASE}/products/${name}`);
  if (!res.ok) throw new Error(`GET /products/${name} failed: ${res.status}`);
  return res.json();
}

async function placeOrder(payload: object) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`POST /orders failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function getOrderByNumber(orderNumber: string) {
  const res = await fetch(`${BASE}/orders/${orderNumber}`);
  if (!res.ok) throw new Error(`GET /orders/${orderNumber} failed: ${res.status}`);
  return res.json();
}

async function main() {
  console.log('Fetching shipping methods…');
  const shipping = await getShippingMethods();
  if (shipping.data.length === 0) {
    console.error('No shipping methods found — seed the database first.');
    return;
  }
  const shippingMethod = shipping.data[0];
  console.log(`Using shipping: ${shippingMethod.name} (${shippingMethod.price} ${shippingMethod.currency})`);

  console.log('\nBrowsing products…');
  const products = await getProducts(10);
  if (products.data.length === 0) {
    console.error('No products found — seed the database first.');
    return;
  }

  let chosenProduct: any = null;
  let chosenVariant: any = null;
  for (const p of products.data) {
    const detail = await getProduct(p.name);
    const inStock = (detail.variants ?? []).find((v: any) => v.stock > 0);
    if (inStock) {
      chosenProduct = detail;
      chosenVariant = inStock;
      break;
    }
  }

  if (!chosenVariant) {
    console.error('No in-stock variant found — seed the database first.');
    return;
  }
  console.log(`Ordering: "${chosenProduct.name}" variant SKU ${chosenVariant.sku}`);

  const orderPayload = {
    guestEmail: 'guest@example.com',
    shippingMethodId: shippingMethod.id,
    shippingAddress: {
      firstName: 'Jane',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Warsaw',
      postalCode: '00-001',
      country: 'PL',
      province: 'NY',
      phone: '+1 555 000 0000',
    },
    billingIsSameAsShipping: true,
    items: [
      {
        productId: chosenProduct.id,
        variantSku: chosenVariant.sku,
        quantity: 1,
      },
    ],
  };

  console.log('\nPlacing order…');
  const order = await placeOrder(orderPayload);
  console.log(`Order placed! Number: ${order.orderNumber}, status: ${order.fulfillmentStatus}`);

  console.log('\nLooking up order by number…');
  const fetched = await getOrderByNumber(order.orderNumber);
  console.log(`Order total: ${fetched.totalAmount} ${fetched.totalCurrency}`);
  console.log(`Items:`, fetched.items.map((i: any) => `${i.productName} x${i.quantity}`));
}

main().catch(console.error);
