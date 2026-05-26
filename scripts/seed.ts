// scripts/seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
// eslint-disable-next-line @typescript-eslint/no-require-imports
(require('dotenv') as { config: () => void }).config();
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/users/enums/role.enum';
import { Collection } from '../src/collections/entities/collection.entity';
import { Category } from '../src/categories/entities/category.entity';
import { SubCategory } from '../src/categories/entities/subcategory.entity';
import { Product } from '../src/products/entities/product.entity';
import { ProductVariant } from '../src/products/entities/product-variant.entity';
import { ProductPhoto } from '../src/products/entities/product-photo.entity';
import { Review } from '../src/reviews/entities/review.entity';
import { ReviewStatus } from '../src/reviews/enums/review-status.enum';
import { ShippingMethod } from '../src/shipping/entities/shipping-method.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { PaymentStatus } from '../src/orders/enums/payment-status.enum';
import { FulfillmentStatus } from '../src/orders/enums/fulfillment-status.enum';
import { SavedAddress } from '../src/addresses/entities/saved-address.entity';
import { RefreshToken } from '../src/auth/entities/refresh-token.entity';

function generateSku(productName: string, colorName: string, size: string): string {
    return [productName, colorName, size]
        .map(s => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
        .join('-');
}

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'secret',
    database: process.env.DB_NAME ?? 'o2shop',
    entities: [
        User, Collection, Category, SubCategory,
        Product, ProductVariant, ProductPhoto,
        Review, ShippingMethod, Order, OrderItem, SavedAddress,
        RefreshToken,
    ],
    synchronize: false,
});

async function seed() {
    await dataSource.initialize();
    console.log('âœ… Connected to database');

    // â”€â”€ Clear â”€â”€
    console.log('ðŸ§¹ Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE "user", "collection", "category", "shipping_method" CASCADE');
    console.log('   âœ“ Tables cleared');

    // â”€â”€ Users â”€â”€
    console.log('ðŸ‘¤ Seeding users...');
    const userRepo = dataSource.getRepository(User);

    const admin = await userRepo.save(userRepo.create({
        email: 'admin@o2shop.dev',
        password: await bcrypt.hash('Admin1234!', 10),
        displayName: 'Admin',
        role: Role.ADMIN,
        isActive: true,
    }));
    const alice = await userRepo.save(userRepo.create({
        email: 'alice@o2shop.dev',
        password: await bcrypt.hash('Alice1234!', 10),
        displayName: 'Alice',
        role: Role.REGULAR,
        isActive: true,
    }));
    const bob = await userRepo.save(userRepo.create({
        email: 'bob@o2shop.dev',
        password: await bcrypt.hash('Bob12345!', 10),
        displayName: 'Bob',
        role: Role.REGULAR,
        isActive: true,
    }));
    const charlie = await userRepo.save(userRepo.create({
        email: 'charlie@o2shop.dev',
        password: await bcrypt.hash('Charlie123!', 10),
        displayName: 'Charlie',
        role: Role.REGULAR,
        isActive: false,
    }));

    console.log(`   âœ“ admin   (id: ${admin.id})`);
    console.log(`   âœ“ alice   (id: ${alice.id})`);
    console.log(`   âœ“ bob     (id: ${bob.id})`);
    console.log(`   âœ“ charlie (id: ${charlie.id}, inactive)`);

    // â”€â”€ Collections â”€â”€
    console.log('ðŸ—‚ï¸  Seeding collections...');
    const collRepo = dataSource.getRepository(Collection);

    const winter2025 = await collRepo.save(collRepo.create({
        slug: 'winter-2025',
        displayName: 'Winter Collection 2025',
        description: 'Warm essentials for the colder months.',
        isActive: true,
    }));
    const summer2025 = await collRepo.save(collRepo.create({
        slug: 'summer-2025',
        displayName: 'Summer Essentials 2025',
        description: 'Light and breathable styles for the warmer months.',
        isActive: true,
    }));
    console.log(`   âœ“ ${winter2025.slug}`);
    console.log(`   âœ“ ${summer2025.slug}`);

    // â”€â”€ Categories + SubCategories â”€â”€
    console.log('ðŸ“‚ Seeding categories...');
    const catRepo = dataSource.getRepository(Category);
    const subRepo = dataSource.getRepository(SubCategory);

    const headwear = await catRepo.save(catRepo.create({ slug: 'headwear', displayName: 'Headwear' }));
    const tops = await catRepo.save(catRepo.create({ slug: 'tops', displayName: 'Tops' }));

    const caps = await subRepo.save(subRepo.create({ slug: 'caps', displayName: 'Caps', category: headwear, categoryId: headwear.id }));
    await subRepo.save(subRepo.create({ slug: 'beanies', displayName: 'Beanies', category: headwear, categoryId: headwear.id }));
    const tshirts = await subRepo.save(subRepo.create({ slug: 't-shirts', displayName: 'T-Shirts', category: tops, categoryId: tops.id }));
    const hoodies = await subRepo.save(subRepo.create({ slug: 'hoodies', displayName: 'Hoodies', category: tops, categoryId: tops.id }));

    console.log('   âœ“ headwear â†’ caps, beanies');
    console.log('   âœ“ tops â†’ t-shirts, hoodies');

    // â”€â”€ Shipping Methods â”€â”€
    console.log('ðŸšš Seeding shipping methods...');
    const shipRepo = dataSource.getRepository(ShippingMethod);

    const standardShipping = await shipRepo.save(shipRepo.create({
        name: 'Standard Shipping',
        price: 4.99,
        currency: 'USD',
        estimatedDays: 7,
        isActive: true,
    }));
    const expressShipping = await shipRepo.save(shipRepo.create({
        name: 'Express Shipping',
        price: 12.99,
        currency: 'USD',
        estimatedDays: 2,
        isActive: true,
    }));
    await shipRepo.save(shipRepo.create({
        name: 'Free Shipping',
        price: 0.00,
        currency: 'USD',
        estimatedDays: 10,
        isActive: false,
    }));
    console.log('   âœ“ Standard Shipping ($4.99, 7 days)');
    console.log('   âœ“ Express Shipping ($12.99, 2 days)');
    console.log('   âœ“ Free Shipping ($0.00, inactive)');

    // â”€â”€ Products â”€â”€
    console.log('ðŸ‘• Seeding products...');
    const productRepo = dataSource.getRepository(Product);
    const variantRepo = dataSource.getRepository(ProductVariant);
    const photoRepo = dataSource.getRepository(ProductPhoto);

    // â”€â”€ Product 1: Black Wool Cap â”€â”€
    const cap = await productRepo.save(productRepo.create({
        name: 'black_wool_cap',
        displayName: 'Black Wool Cap',
        collection: winter2025,
        collectionId: winter2025.id,
        category: headwear,
        categoryId: headwear.id,
        subCategory: caps,
        subCategoryId: caps.id,
        basePrice: 29.99,
        compareAtPrice: 34.99,
        currency: 'USD',
        tags: ['winter', 'headwear', 'wool', 'new-arrival'],
        description: {
            blocks: [
                { type: 'text', content: 'A classic wool cap for the colder months. Structured brim, adjustable back strap.' },
                { type: 'points', items: ['100% Wool', 'One size fits most', 'Adjustable strap'] },
            ],
        },
        isPublished: true,
    }));
    const capPhoto1 = await photoRepo.save(photoRepo.create({
        productId: cap.id,
        product: cap,
        url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
        altText: 'Black Wool Cap front view',
        sortOrder: 0,
    }));
    const capPhoto2 = await photoRepo.save(photoRepo.create({
        productId: cap.id,
        product: cap,
        url: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800',
        altText: 'Black Wool Cap side view',
        sortOrder: 1,
    }));
    const capVarBlack = await variantRepo.save(variantRepo.create({
        product: cap,
        productId: cap.id,
        colorName: 'Black',
        colorValue: '#1a1a1a',
        size: 'One Size',
        sku: generateSku('black_wool_cap', 'Black', 'One Size'),
        stock: 50,
        compareAtPrice: 34.99,
        weight: 180,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: null, increment: 1 },
        barcode: '5901234123457',
        featuredImage: capPhoto1,
        featuredImageId: capPhoto1.id,
    }));
    await variantRepo.save(variantRepo.create({
        product: cap,
        productId: cap.id,
        colorName: 'Navy',
        colorValue: '#1a2744',
        size: 'One Size',
        sku: generateSku('black_wool_cap', 'Navy', 'One Size'),
        stock: 30,
        weight: 180,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: null, increment: 1 },
        barcode: '5901234123464',
        featuredImage: capPhoto2,
        featuredImageId: capPhoto2.id,
    }));
    await productRepo.update(cap.id, { defaultVariantId: capVarBlack.id, primaryPhotoId: capPhoto1.id });
    console.log('   âœ“ black_wool_cap (2 variants, 2 photos)');

    // â”€â”€ Product 2: Classic White Tee â”€â”€
    const tee = await productRepo.save(productRepo.create({
        name: 'classic_white_tee',
        displayName: 'Classic White Tee',
        collection: summer2025,
        collectionId: summer2025.id,
        category: tops,
        categoryId: tops.id,
        subCategory: tshirts,
        subCategoryId: tshirts.id,
        basePrice: 24.99,
        compareAtPrice: 29.99,
        currency: 'USD',
        tags: ['summer', 'basics', 'cotton', 'sale'],
        description: {
            blocks: [
                { type: 'text', content: 'A wardrobe essential. Relaxed fit, breathable cotton.' },
                { type: 'points', items: ['100% Organic Cotton', 'Pre-washed to minimise shrink', 'Unisex cut'] },
            ],
        },
        isPublished: true,
    }));
    const teePhoto1 = await photoRepo.save(photoRepo.create({
        productId: tee.id,
        product: tee,
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        altText: 'Classic White Tee front',
        sortOrder: 0,
    }));
    await photoRepo.save(photoRepo.create({
        productId: tee.id,
        product: tee,
        url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800',
        altText: 'Classic White Tee folded',
        sortOrder: 1,
    }));
    await variantRepo.save(variantRepo.create({
        product: tee,
        productId: tee.id,
        colorName: 'White',
        colorValue: '#ffffff',
        size: 'S',
        sku: generateSku('classic_white_tee', 'White', 'S'),
        stock: 20,
        compareAtPrice: 29.99,
        weight: 220,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: 5, increment: 1 },
        barcode: '5901234123471',
        featuredImage: teePhoto1,
        featuredImageId: teePhoto1.id,
    }));
    const teeVarWhiteM = await variantRepo.save(variantRepo.create({
        product: tee,
        productId: tee.id,
        colorName: 'White',
        colorValue: '#ffffff',
        size: 'M',
        sku: generateSku('classic_white_tee', 'White', 'M'),
        stock: 35,
        compareAtPrice: 29.99,
        weight: 240,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: 5, increment: 1 },
        barcode: '5901234123488',
        featuredImage: teePhoto1,
        featuredImageId: teePhoto1.id,
    }));
    const teeVarBlackS = await variantRepo.save(variantRepo.create({
        product: tee,
        productId: tee.id,
        colorName: 'Black',
        colorValue: '#1a1a1a',
        size: 'S',
        sku: generateSku('classic_white_tee', 'Black', 'S'),
        stock: 15,
        weight: 220,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: null, increment: 1 },
        barcode: '5901234123495',
        featuredImage: teePhoto1,
        featuredImageId: teePhoto1.id,
    }));
    await variantRepo.save(variantRepo.create({
        product: tee,
        productId: tee.id,
        colorName: 'Black',
        colorValue: '#1a1a1a',
        size: 'M',
        sku: generateSku('classic_white_tee', 'Black', 'M'),
        stock: 25,
        weight: 240,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: null, increment: 1 },
        barcode: '5901234123501',
        featuredImage: teePhoto1,
        featuredImageId: teePhoto1.id,
    }));
    await productRepo.update(tee.id, { defaultVariantId: teeVarWhiteM.id, primaryPhotoId: teePhoto1.id });
    console.log('   âœ“ classic_white_tee (4 variants, 2 photos)');

    // â”€â”€ Product 3: Oversized Hoodie â”€â”€
    const hoodie = await productRepo.save(productRepo.create({
        name: 'oversized_hoodie',
        displayName: 'Oversized Hoodie',
        collection: winter2025,
        collectionId: winter2025.id,
        category: tops,
        categoryId: tops.id,
        subCategory: hoodies,
        subCategoryId: hoodies.id,
        basePrice: 59.99,
        compareAtPrice: 74.99,
        currency: 'USD',
        tags: ['winter', 'tops', 'fleece', 'oversized'],
        description: {
            blocks: [
                { type: 'text', content: 'Heavyweight fleece hoodie with a relaxed, oversized silhouette.' },
                { type: 'points', items: ['380gsm fleece', 'Kangaroo pocket', 'Brushed interior for warmth'] },
            ],
        },
        isPublished: true,
    }));
    const hoodiePhoto1 = await photoRepo.save(photoRepo.create({
        productId: hoodie.id,
        product: hoodie,
        url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800',
        altText: 'Oversized Hoodie grey front',
        sortOrder: 0,
    }));
    await photoRepo.save(photoRepo.create({
        productId: hoodie.id,
        product: hoodie,
        url: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800',
        altText: 'Oversized Hoodie navy detail',
        sortOrder: 1,
    }));
    const hoodieVarGreyM = await variantRepo.save(variantRepo.create({
        product: hoodie,
        productId: hoodie.id,
        colorName: 'Grey',
        colorValue: '#9ca3af',
        size: 'M',
        sku: generateSku('oversized_hoodie', 'Grey', 'M'),
        stock: 10,
        compareAtPrice: 74.99,
        weight: 680,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: 3, increment: 1 },
        barcode: '5901234123518',
        featuredImage: hoodiePhoto1,
        featuredImageId: hoodiePhoto1.id,
    }));
    const hoodieVarGreyL = await variantRepo.save(variantRepo.create({
        product: hoodie,
        productId: hoodie.id,
        colorName: 'Grey',
        colorValue: '#9ca3af',
        size: 'L',
        sku: generateSku('oversized_hoodie', 'Grey', 'L'),
        stock: 15,
        compareAtPrice: 74.99,
        weight: 720,
        inventoryPolicy: 'deny' as const,
        quantityRule: { min: 1, max: 3, increment: 1 },
        barcode: '5901234123525',
        featuredImage: hoodiePhoto1,
        featuredImageId: hoodiePhoto1.id,
    }));
    await variantRepo.save(variantRepo.create({
        product: hoodie,
        productId: hoodie.id,
        colorName: 'Navy',
        colorValue: '#1a2744',
        size: 'M',
        sku: generateSku('oversized_hoodie', 'Navy', 'M'),
        stock: 8,
        weight: 680,
        inventoryPolicy: 'continue' as const,
        quantityRule: { min: 1, max: null, increment: 1 },
        barcode: '5901234123532',
        featuredImage: hoodiePhoto1,
        featuredImageId: hoodiePhoto1.id,
    }));
    await variantRepo.save(variantRepo.create({
        product: hoodie,
        productId: hoodie.id,
        colorName: 'Navy',
        colorValue: '#1a2744',
        size: 'L',
        sku: generateSku('oversized_hoodie', 'Navy', 'L'),
        stock: 12,
        weight: 720,
        inventoryPolicy: 'continue' as const,
        quantityRule: { min: 1, max: null, increment: 1 },
        barcode: '5901234123549',
        featuredImage: hoodiePhoto1,
        featuredImageId: hoodiePhoto1.id,
    }));
    await productRepo.update(hoodie.id, { defaultVariantId: hoodieVarGreyM.id, primaryPhotoId: hoodiePhoto1.id });
    console.log('   âœ“ oversized_hoodie (4 variants, 2 photos)');

    // â”€â”€ Reviews â”€â”€
    console.log('â­ Seeding reviews...');
    const reviewRepo = dataSource.getRepository(Review);

    // black_wool_cap: APPROVED avg = (8+9+7)/3 = 8.0
    await reviewRepo.save([
        reviewRepo.create({ product: cap, productId: cap.id, user: alice, userId: alice.id, email: alice.email, displayName: 'Alice', rating: 8, content: 'Fits perfectly, nice and warm for winter.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: cap, productId: cap.id, user: bob, userId: bob.id, email: bob.email, displayName: 'Bob', rating: 9, content: 'Great quality wool, exactly what I needed.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: cap, productId: cap.id, email: 'guest1@example.com', displayName: 'Guest Buyer', rating: 7, content: 'Solid cap, brim holds its shape well.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: cap, productId: cap.id, user: charlie, userId: charlie.id, email: charlie.email, displayName: 'Charlie', rating: 6, content: 'Sizing feels a bit off â€” ordered M but fits like S.', status: ReviewStatus.PENDING }),
        reviewRepo.create({ product: cap, productId: cap.id, email: 'spam1@junk.com', displayName: 'Check My Site', rating: 1, content: 'VISIT MY WEBSITE FOR DEALS', status: ReviewStatus.REJECTED }),
    ]);
    console.log('   âœ“ black_wool_cap â€” 3 APPROVED (avg 8.0), 1 PENDING, 1 REJECTED');

    // classic_white_tee: APPROVED avg = (9+8+10)/3 = 9.0
    await reviewRepo.save([
        reviewRepo.create({ product: tee, productId: tee.id, user: alice, userId: alice.id, email: alice.email, displayName: 'Alice', rating: 9, content: 'Super soft fabric, washes really well.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: tee, productId: tee.id, user: bob, userId: bob.id, email: bob.email, displayName: 'Bob', rating: 8, content: 'Clean cut, great everyday tee.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: tee, productId: tee.id, user: admin, userId: admin.id, email: admin.email, displayName: 'Admin', rating: 10, content: 'Perfect fit across the shoulders.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: tee, productId: tee.id, user: charlie, userId: charlie.id, email: charlie.email, displayName: 'Charlie', rating: 5, content: 'Material is thinner than I expected.', status: ReviewStatus.PENDING }),
        reviewRepo.create({ product: tee, productId: tee.id, email: 'spam2@junk.com', displayName: 'Fake User', rating: 1, content: 'BUY MY COURSE NOW!!!', status: ReviewStatus.REJECTED }),
    ]);
    console.log('   âœ“ classic_white_tee â€” 3 APPROVED (avg 9.0), 1 PENDING, 1 REJECTED');

    // oversized_hoodie: APPROVED avg = (7+8+9)/3 = 8.0
    await reviewRepo.save([
        reviewRepo.create({ product: hoodie, productId: hoodie.id, user: alice, userId: alice.id, email: alice.email, displayName: 'Alice', rating: 7, content: 'Love the oversized fit, very cosy.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, user: bob, userId: bob.id, email: bob.email, displayName: 'Bob', rating: 8, content: 'Heavyweight fleece â€” worth every penny.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, user: charlie, userId: charlie.id, email: charlie.email, displayName: 'Charlie', rating: 9, content: 'The grey colour is exactly as pictured.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, email: 'guest2@example.com', displayName: 'Cautious Buyer', rating: 5, content: 'Waiting to wash it before my final verdict.', status: ReviewStatus.PENDING }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, email: 'spam3@junk.com', displayName: 'Bot Account', rating: 1, content: 'Not a real customer.', status: ReviewStatus.REJECTED }),
    ]);
    console.log('   âœ“ oversized_hoodie â€” 3 APPROVED (avg 8.0), 1 PENDING, 1 REJECTED');

    // â”€â”€ Orders â”€â”€
    console.log('ðŸ“¦ Seeding orders...');
    const orderRepo = dataSource.getRepository(Order);
    const itemRepo = dataSource.getRepository(OrderItem);

    const aliceAddr = { firstName: 'Alice', lastName: 'Smith', address1: '12 Baker Street', city: 'London', country: 'GB', province: 'England', postalCode: 'NW1 6XE', phone: '+44 20 7946 0958' };
    const bobAddr = { firstName: 'Bob', lastName: 'Jones', address1: '7 Maple Avenue', city: 'Manchester', country: 'GB', province: 'Greater Manchester', postalCode: 'M1 2AB', phone: '+44 161 496 0123' };
    const guestAddr = { firstName: 'Jane', lastName: 'Doe', address1: '99 Elm Street', city: 'Bristol', country: 'GB', province: 'Somerset', postalCode: 'BS1 5TR', phone: '+44 117 496 0999' };

    // Order 1: alice â€” PAID + FULFILLED
    // cap Black/One Size Ã—1 @ 29.99 + tee White/M Ã—2 @ 24.99 + standard shipping 4.99 = 84.96
    const order1 = await orderRepo.save(orderRepo.create({
        orderNumber: 'O2SHOP-000001',
        orderSequence: 1,
        user: alice,
        userId: alice.id,
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
        totalAmount: 84.96,
        totalCurrency: 'USD',
        shippingMethod: standardShipping,
        shippingMethodId: standardShipping.id,
        shippingMethodName: standardShipping.name,
        shippingPrice: 4.99,
        shippingCurrency: 'USD',
        shippingAddress: aliceAddr as any,
        billingAddress: aliceAddr as any,
    }));
    await itemRepo.save([
        itemRepo.create({ order: order1, product: cap, productId: cap.id, productName: cap.displayName, productSku: capVarBlack.sku, productPrice: 29.99, productCurrency: 'USD', quantity: 1, total: 29.99 }),
        itemRepo.create({ order: order1, product: tee, productId: tee.id, productName: tee.displayName, productSku: teeVarWhiteM.sku, productPrice: 24.99, productCurrency: 'USD', quantity: 2, total: 49.98 }),
    ]);
    console.log(`   âœ“ O2SHOP-000001 â€” alice, PAID+FULFILLED (cap Ã—1 + tee White/M Ã—2)`);

    // Order 2: bob â€” PENDING + UNFULFILLED
    // hoodie Grey/L Ã—1 @ 59.99 + express shipping 12.99 = 72.98
    const order2 = await orderRepo.save(orderRepo.create({
        orderNumber: 'O2SHOP-000002',
        orderSequence: 2,
        user: bob,
        userId: bob.id,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        totalAmount: 72.98,
        totalCurrency: 'USD',
        shippingMethod: expressShipping,
        shippingMethodId: expressShipping.id,
        shippingMethodName: expressShipping.name,
        shippingPrice: 12.99,
        shippingCurrency: 'USD',
        shippingAddress: bobAddr as any,
        billingAddress: bobAddr as any,
    }));
    await itemRepo.save(
        itemRepo.create({ order: order2, product: hoodie, productId: hoodie.id, productName: hoodie.displayName, productSku: hoodieVarGreyL.sku, productPrice: 59.99, productCurrency: 'USD', quantity: 1, total: 59.99 }),
    );
    console.log(`   âœ“ O2SHOP-000002 â€” bob, PENDING+UNFULFILLED (hoodie Grey/L Ã—1)`);

    // Order 3: guest â€” PAID + UNFULFILLED
    // tee Black/S Ã—2 @ 24.99 + standard shipping 4.99 = 54.97
    const order3 = await orderRepo.save(orderRepo.create({
        orderNumber: 'O2SHOP-000003',
        orderSequence: 3,
        email: 'guest@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        totalAmount: 54.97,
        totalCurrency: 'USD',
        shippingMethod: standardShipping,
        shippingMethodId: standardShipping.id,
        shippingMethodName: standardShipping.name,
        shippingPrice: 4.99,
        shippingCurrency: 'USD',
        shippingAddress: guestAddr as any,
        billingAddress: guestAddr as any,
    }));
    await itemRepo.save(
        itemRepo.create({ order: order3, product: tee, productId: tee.id, productName: tee.displayName, productSku: teeVarBlackS.sku, productPrice: 24.99, productCurrency: 'USD', quantity: 2, total: 49.98 }),
    );
    console.log(`   âœ“ O2SHOP-000003 â€” guest@example.com, PAID+UNFULFILLED (tee Black/S Ã—2)`);

    // â”€â”€ Saved Addresses â”€â”€
    console.log('ðŸ  Seeding saved addresses...');
    const savedAddrRepo = dataSource.getRepository(SavedAddress);

    await savedAddrRepo.save(savedAddrRepo.create({ user: alice, userId: alice.id, name: 'Home', shippingAddress: aliceAddr as any, billingAddress: aliceAddr as any, billingIsSameAsShipping: true }));
    await savedAddrRepo.save(savedAddrRepo.create({ user: bob, userId: bob.id, name: 'Home', shippingAddress: bobAddr as any, billingAddress: bobAddr as any, billingIsSameAsShipping: true }));
    console.log('   âœ“ alice â†’ Home');
    console.log('   âœ“ bob â†’ Home');

    console.log('\nðŸŽ‰ Seed complete!');
    console.log('\nTest credentials:');
    console.log('  admin@o2shop.dev    / Admin1234!   (admin)');
    console.log('  alice@o2shop.dev    / Alice1234!   (regular, active)');
    console.log('  bob@o2shop.dev      / Bob12345!    (regular, active)');
    console.log('  charlie@o2shop.dev  / Charlie123!  (regular, inactive)');
    console.log('\nOrders:');
    console.log('  O2SHOP-000001 â€” alice, PAID + FULFILLED');
    console.log('  O2SHOP-000002 â€” bob,   PENDING + UNFULFILLED');
    console.log('  O2SHOP-000003 â€” guest@example.com, PAID + UNFULFILLED');
    console.log('\nExpected ratings (APPROVED reviews only):');
    console.log('  black_wool_cap    â†’ 8.0  ( (8+9+7) / 3 )');
    console.log('  classic_white_tee â†’ 9.0  ( (9+8+10) / 3 )');
    console.log('  oversized_hoodie  â†’ 8.0  ( (7+8+9) / 3 )');

    await dataSource.destroy();
}

seed().catch(e => {
    console.error('âŒ Seed failed:', e);
    process.exit(1);
});
