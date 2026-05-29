// scripts/seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
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

const ASSETS_ROOT = path.join(process.cwd(), 'scripts', 'seed-assets', 'products');
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads', 'products');

function generateSku(productName: string, colorName: string, size: string): string {
    return [productName, colorName, size]
        .map(s => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
        .join('-');
}

async function copyProductPhotos(
    folderName: string,
    productSlug: string,
): Promise<Array<{ filename: string; sortOrder: number }>> {
    const srcDir = path.join(ASSETS_ROOT, folderName);
    const destDir = path.join(UPLOADS_ROOT, productSlug);
    await fsPromises.mkdir(destDir, { recursive: true });

    const entries = await fsPromises.readdir(srcDir);
    const result: Array<{ filename: string; sortOrder: number }> = [];

    for (const filename of entries) {
        if (filename === 'info.txt') continue;
        const n = parseInt(path.basename(filename, path.extname(filename)), 10);
        if (isNaN(n)) continue;
        await fsPromises.copyFile(path.join(srcDir, filename), path.join(destDir, filename));
        result.push({ filename, sortOrder: n });
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
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
    console.log('✅ Connected to database');

    console.log('🧹 Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE "user", "collection", "category", "shipping_method" CASCADE');
    console.log('   ✓ Tables cleared');

    // --- Users ---
    console.log('👤 Seeding users...');
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

    console.log(`   ✓ admin   (id: ${admin.id})`);
    console.log(`   ✓ alice   (id: ${alice.id})`);
    console.log(`   ✓ bob     (id: ${bob.id})`);
    console.log(`   ✓ charlie (id: ${charlie.id}, inactive)`);

    // --- Collections ---
    console.log('🪄  Seeding collections...');
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
    console.log(`   ✓ ${winter2025.slug}`);
    console.log(`   ✓ ${summer2025.slug}`);

    // --- Categories + SubCategories ---
    console.log('📁 Seeding categories...');
    const catRepo = dataSource.getRepository(Category);
    const subRepo = dataSource.getRepository(SubCategory);

    const tops = await catRepo.save(catRepo.create({ slug: 'tops', displayName: 'Tops' }));
    const bottoms = await catRepo.save(catRepo.create({ slug: 'bottoms', displayName: 'Bottoms' }));

    const subcatTees = await subRepo.save(subRepo.create({ slug: 'tees', displayName: 'Tees', category: tops, categoryId: tops.id }));
    const subcatJumpers = await subRepo.save(subRepo.create({ slug: 'jumpers', displayName: 'Jumpers', category: tops, categoryId: tops.id }));
    const subcatPants = await subRepo.save(subRepo.create({ slug: 'pants', displayName: 'Pants', category: bottoms, categoryId: bottoms.id }));

    console.log('   ✓ tops → tees, jumpers');
    console.log('   ✓ bottoms → pants');

    // --- Shipping Methods ---
    console.log('🚚 Seeding shipping methods...');
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
    console.log('   ✓ Standard Shipping ($4.99, 7 days)');
    console.log('   ✓ Express Shipping ($12.99, 2 days)');
    console.log('   ✓ Free Shipping ($0.00, inactive)');

    // --- Products ---
    console.log('👕 Seeding products...');
    console.log('📸 Copying product photos...');
    await fsPromises.rm(UPLOADS_ROOT, { recursive: true, force: true });

    const productRepo = dataSource.getRepository(Product);
    const variantRepo = dataSource.getRepository(ProductVariant);
    const photoRepo = dataSource.getRepository(ProductPhoto);

    // --- Product 1: Oversized Hoodie ---
    const hoodie = await productRepo.save(productRepo.create({
        name: 'oversized_hoodie',
        displayName: 'Oversized Hoodie',
        collection: winter2025,
        collectionId: winter2025.id,
        category: tops,
        categoryId: tops.id,
        subCategory: subcatJumpers,
        subCategoryId: subcatJumpers.id,
        type: 'Your last hoodie',
        basePrice: 86.00,
        currency: 'USD',
        tags: ['winter', 'tops', 'jumper', 'hoodie', 'embroidered'],
        description: {
            blocks: [
                { type: 'text', content: "A Friend 'Til the End" },
                { type: 'points', items: ['Overlap Pullover Hooded Jumper', 'All Over Embroidered Graphics'] },
            ],
        },
        isPublished: true,
    }));

    const hoodieFiles = await copyProductPhotos('hoodie', 'oversized_hoodie');
    const hoodiePhotos = await Promise.all(
        hoodieFiles.map(({ filename, sortOrder }) =>
            photoRepo.save(photoRepo.create({
                productId: hoodie.id,
                product: hoodie,
                url: `/uploads/products/oversized_hoodie/${filename}`,
                altText: `Oversized Hoodie — view ${sortOrder}`,
                sortOrder,
            })),
        ),
    );
    const hoodiePrimary = hoodiePhotos.find(p => p.sortOrder === -1)!;
    const hoodieMain = hoodiePhotos.find(p => p.sortOrder === 1)!;

    // xs, s → unavailable (stock 0); m through 3xl → in stock
    const hoodieVariantDefs: Array<{ size: string; stock: number }> = [
        { size: 'XS',  stock: 0  },
        { size: 'S',   stock: 0  },
        { size: 'M',   stock: 12 },
        { size: 'L',   stock: 18 },
        { size: 'XL',  stock: 15 },
        { size: '2XL', stock: 10 },
        { size: '3XL', stock: 8  },
    ];
    const hoodieVariants = await Promise.all(
        hoodieVariantDefs.map(({ size, stock }) =>
            variantRepo.save(variantRepo.create({
                product: hoodie,
                productId: hoodie.id,
                colorName: 'Black',
                colorValue: '#000000',
                size,
                sku: generateSku('oversized_hoodie', 'Black', size),
                stock,
                weight: 650,
                quantityRule: { min: 1, max: null, increment: 1 },
                featuredImage: hoodieMain,
                featuredImageId: hoodieMain.id,
            })),
        ),
    );
    const hoodieDefaultVariant = hoodieVariants.find(v => v.stock > 0)!;
    await productRepo.update(hoodie.id, {
        defaultVariantId: hoodieDefaultVariant.id,
        primaryPhotoId: hoodiePrimary.id,
    });
    console.log(`   ✓ oversized_hoodie (${hoodieVariants.length} variants, ${hoodiePhotos.length} photos)`);

    // --- Product 2: Heavyweight Tee ---
    const tee = await productRepo.save(productRepo.create({
        name: 'heavyweight_tee',
        displayName: 'Heavyweight Tee',
        collection: summer2025,
        collectionId: summer2025.id,
        category: tops,
        categoryId: tops.id,
        subCategory: subcatTees,
        subCategoryId: subcatTees.id,
        type: 'T-Shirt',
        basePrice: 37.00,
        currency: 'USD',
        tags: ['tops', 'graphic-tee', 'heavyweight', 'screen-print', 'cotton'],
        description: {
            blocks: [
                { type: 'text', content: 'Everyday I Wake Up In This Prison!' },
                { type: 'points', items: ['Screen and Puff Printed Front', '100% Heavyweight 300GSM Cotton'] },
            ],
        },
        isPublished: true,
    }));

    const teeFiles = await copyProductPhotos('tees', 'heavyweight_tee');
    const teePhotos = await Promise.all(
        teeFiles.map(({ filename, sortOrder }) =>
            photoRepo.save(photoRepo.create({
                productId: tee.id,
                product: tee,
                url: `/uploads/products/heavyweight_tee/${filename}`,
                altText: `Heavyweight Tee — view ${sortOrder}`,
                sortOrder,
            })),
        ),
    );
    const teePrimary = teePhotos.find(p => p.sortOrder === -1)!;
    const teeMain = teePhotos.find(p => p.sortOrder === 1)!;

    // s, 3xl → unavailable; rest → in stock
    const teeVariantDefs: Array<{ size: string; stock: number }> = [
        { size: 'XS',  stock: 10 },
        { size: 'S',   stock: 0  },
        { size: 'M',   stock: 20 },
        { size: 'L',   stock: 15 },
        { size: 'XL',  stock: 12 },
        { size: '2XL', stock: 8  },
        { size: '3XL', stock: 0  },
    ];
    const teeVariants = await Promise.all(
        teeVariantDefs.map(({ size, stock }) =>
            variantRepo.save(variantRepo.create({
                product: tee,
                productId: tee.id,
                colorName: 'White',
                colorValue: '#f5f5f5',
                size,
                sku: generateSku('heavyweight_tee', 'White', size),
                stock,
                weight: 300,
                quantityRule: { min: 1, max: null, increment: 1 },
                featuredImage: teeMain,
                featuredImageId: teeMain.id,
            })),
        ),
    );
    const teeDefaultVariant = teeVariants.find(v => v.stock > 0)!;
    await productRepo.update(tee.id, {
        defaultVariantId: teeDefaultVariant.id,
        primaryPhotoId: teePrimary.id,
    });
    console.log(`   ✓ heavyweight_tee (${teeVariants.length} variants, ${teePhotos.length} photos)`);

    // --- Product 3: Patchwork Denim Pants ---
    const denim = await productRepo.save(productRepo.create({
        name: 'patchwork_denim_pants',
        displayName: 'Patchwork Denim Pants',
        collection: winter2025,
        collectionId: winter2025.id,
        category: bottoms,
        categoryId: bottoms.id,
        subCategory: subcatPants,
        subCategoryId: subcatPants.id,
        type: 'Denim Jeans',
        basePrice: 140.00,
        compareAtPrice: 110.00,
        currency: 'USD',
        tags: ['bottoms', 'denim', 'pants', 'distressed', 'patchwork'],
        description: {
            blocks: [
                { type: 'text', content: 'Keep your pants on!' },
                { type: 'points', items: ['Distressed patchwork denim pants', '300gsm outer layer over 480gsm black inner'] },
            ],
        },
        isPublished: true,
    }));

    const pantsFiles = await copyProductPhotos('pants', 'patchwork_denim_pants');
    const pantsPhotos = await Promise.all(
        pantsFiles.map(({ filename, sortOrder }) =>
            photoRepo.save(photoRepo.create({
                productId: denim.id,
                product: denim,
                url: `/uploads/products/patchwork_denim_pants/${filename}`,
                altText: `Patchwork Denim Pants — view ${sortOrder}`,
                sortOrder,
            })),
        ),
    );
    const pantsPrimary = pantsPhotos.find(p => p.sortOrder === -1)!;
    const pantsMain = pantsPhotos.find(p => p.sortOrder === 1)!;

    // 30, 36 → unavailable; rest → in stock
    const pantsVariantDefs: Array<{ size: string; stock: number }> = [
        { size: '28', stock: 8  },
        { size: '30', stock: 0  },
        { size: '32', stock: 12 },
        { size: '34', stock: 10 },
        { size: '36', stock: 0  },
    ];
    const pantsVariants = await Promise.all(
        pantsVariantDefs.map(({ size, stock }) =>
            variantRepo.save(variantRepo.create({
                product: denim,
                productId: denim.id,
                colorName: 'Black',
                colorValue: '#1a1a1a',
                size,
                sku: generateSku('patchwork_denim_pants', 'Black', size),
                stock,
                weight: 850,
                quantityRule: { min: 1, max: null, increment: 1 },
                featuredImage: pantsMain,
                featuredImageId: pantsMain.id,
            })),
        ),
    );
    const pantsDefaultVariant = pantsVariants.find(v => v.stock > 0)!;
    await productRepo.update(denim.id, {
        defaultVariantId: pantsDefaultVariant.id,
        primaryPhotoId: pantsPrimary.id,
    });
    console.log(`   ✓ patchwork_denim_pants (${pantsVariants.length} variants, ${pantsPhotos.length} photos)`);

    // --- Reviews ---
    console.log('⭐ Seeding reviews...');
    const reviewRepo = dataSource.getRepository(Review);

    // oversized_hoodie: APPROVED avg = (8+9+7)/3 = 8.0
    await reviewRepo.save([
        reviewRepo.create({ product: hoodie, productId: hoodie.id, user: alice, userId: alice.id, email: alice.email, displayName: 'Alice', rating: 8, content: 'Fits perfectly, super warm for winter.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, user: bob, userId: bob.id, email: bob.email, displayName: 'Bob', rating: 9, content: 'Great quality, embroidery looks amazing.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, email: 'guest1@example.com', displayName: 'Guest Buyer', rating: 7, content: 'Solid hoodie, worth the price.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, user: charlie, userId: charlie.id, email: charlie.email, displayName: 'Charlie', rating: 6, content: 'Runs a bit large, order a size down.', status: ReviewStatus.PENDING }),
        reviewRepo.create({ product: hoodie, productId: hoodie.id, email: 'spam1@junk.com', displayName: 'Check My Site', rating: 1, content: 'VISIT MY WEBSITE FOR DEALS', status: ReviewStatus.REJECTED }),
    ]);
    console.log('   ✓ oversized_hoodie — 3 APPROVED (avg 8.0), 1 PENDING, 1 REJECTED');

    // heavyweight_tee: APPROVED avg = (9+8+10)/3 = 9.0
    await reviewRepo.save([
        reviewRepo.create({ product: tee, productId: tee.id, user: alice, userId: alice.id, email: alice.email, displayName: 'Alice', rating: 9, content: 'Love the print, super heavy cotton.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: tee, productId: tee.id, user: bob, userId: bob.id, email: bob.email, displayName: 'Bob', rating: 8, content: 'Unique design, great weight to the fabric.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: tee, productId: tee.id, user: admin, userId: admin.id, email: admin.email, displayName: 'Admin', rating: 10, content: 'Perfect fit, exactly as described.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: tee, productId: tee.id, user: charlie, userId: charlie.id, email: charlie.email, displayName: 'Charlie', rating: 5, content: 'A bit stiff at first, needs a wash.', status: ReviewStatus.PENDING }),
        reviewRepo.create({ product: tee, productId: tee.id, email: 'spam2@junk.com', displayName: 'Fake User', rating: 1, content: 'BUY MY COURSE NOW!!!', status: ReviewStatus.REJECTED }),
    ]);
    console.log('   ✓ heavyweight_tee — 3 APPROVED (avg 9.0), 1 PENDING, 1 REJECTED');

    // patchwork_denim_pants: APPROVED avg = (7+8+9)/3 = 8.0
    await reviewRepo.save([
        reviewRepo.create({ product: denim, productId: denim.id, user: alice, userId: alice.id, email: alice.email, displayName: 'Alice', rating: 7, content: 'Cool design, runs a bit slim.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: denim, productId: denim.id, user: bob, userId: bob.id, email: bob.email, displayName: 'Bob', rating: 8, content: 'Heavy quality denim, very unique look.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: denim, productId: denim.id, user: charlie, userId: charlie.id, email: charlie.email, displayName: 'Charlie', rating: 9, content: 'Exactly as pictured, love the patchwork detail.', status: ReviewStatus.APPROVED }),
        reviewRepo.create({ product: denim, productId: denim.id, email: 'guest2@example.com', displayName: 'Cautious Buyer', rating: 5, content: "Waiting to see how they hold up after washing.", status: ReviewStatus.PENDING }),
        reviewRepo.create({ product: denim, productId: denim.id, email: 'spam3@junk.com', displayName: 'Bot Account', rating: 1, content: 'Not a real customer.', status: ReviewStatus.REJECTED }),
    ]);
    console.log('   ✓ patchwork_denim_pants — 3 APPROVED (avg 8.0), 1 PENDING, 1 REJECTED');

    // --- Orders ---
    console.log('📦 Seeding orders...');
    const orderRepo = dataSource.getRepository(Order);
    const itemRepo = dataSource.getRepository(OrderItem);

    const aliceAddr = { firstName: 'Alice', lastName: 'Smith', address1: '12 Baker Street', city: 'London', country: 'GB', province: 'England', postalCode: 'NW1 6XE', phone: '+44 20 7946 0958' };
    const bobAddr = { firstName: 'Bob', lastName: 'Jones', address1: '7 Maple Avenue', city: 'Manchester', country: 'GB', province: 'Greater Manchester', postalCode: 'M1 2AB', phone: '+44 161 496 0123' };
    const guestAddr = { firstName: 'Jane', lastName: 'Doe', address1: '99 Elm Street', city: 'Bristol', country: 'GB', province: 'Somerset', postalCode: 'BS1 5TR', phone: '+44 117 496 0999' };

    const hoodieM  = hoodieVariants.find(v => v.size === 'M')!;
    const teeXS    = teeVariants.find(v => v.size === 'XS')!;
    const teeM     = teeVariants.find(v => v.size === 'M')!;
    const pants32  = pantsVariants.find(v => v.size === '32')!;

    // Order 1: alice — PAID + FULFILLED
    // tee XS ×1 @ 37.00 + hoodie M ×1 @ 86.00 + standard 4.99 = 127.99
    const order1 = await orderRepo.save(orderRepo.create({
        orderNumber: 'O2SHOP-000001',
        orderSequence: 1,
        user: alice,
        userId: alice.id,
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
        totalAmount: 127.99,
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
        itemRepo.create({ order: order1, product: tee, productId: tee.id, productName: tee.displayName, productSku: teeXS.sku, productPrice: 37.00, productCurrency: 'USD', quantity: 1, total: 37.00 }),
        itemRepo.create({ order: order1, product: hoodie, productId: hoodie.id, productName: hoodie.displayName, productSku: hoodieM.sku, productPrice: 86.00, productCurrency: 'USD', quantity: 1, total: 86.00 }),
    ]);
    console.log(`   ✓ O2SHOP-000001 — alice, PAID+FULFILLED (tee XS ×1 + hoodie M ×1)`);

    // Order 2: bob — PENDING + UNFULFILLED
    // pants 32 ×1 @ 140.00 + express 12.99 = 152.99
    const order2 = await orderRepo.save(orderRepo.create({
        orderNumber: 'O2SHOP-000002',
        orderSequence: 2,
        user: bob,
        userId: bob.id,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        totalAmount: 152.99,
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
        itemRepo.create({ order: order2, product: denim, productId: denim.id, productName: denim.displayName, productSku: pants32.sku, productPrice: 140.00, productCurrency: 'USD', quantity: 1, total: 140.00 }),
    );
    console.log(`   ✓ O2SHOP-000002 — bob, PENDING+UNFULFILLED (pants 32 ×1)`);

    // Order 3: guest — PAID + UNFULFILLED
    // tee M ×2 @ 37.00 + standard 4.99 = 78.99
    const order3 = await orderRepo.save(orderRepo.create({
        orderNumber: 'O2SHOP-000003',
        orderSequence: 3,
        email: 'guest@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        totalAmount: 78.99,
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
        itemRepo.create({ order: order3, product: tee, productId: tee.id, productName: tee.displayName, productSku: teeM.sku, productPrice: 37.00, productCurrency: 'USD', quantity: 2, total: 74.00 }),
    );
    console.log(`   ✓ O2SHOP-000003 — guest@example.com, PAID+UNFULFILLED (tee M ×2)`);

    // --- Saved Addresses ---
    console.log('🏠 Seeding saved addresses...');
    const savedAddrRepo = dataSource.getRepository(SavedAddress);

    await savedAddrRepo.save(savedAddrRepo.create({ user: alice, userId: alice.id, name: 'Home', shippingAddress: aliceAddr as any, billingAddress: aliceAddr as any, billingIsSameAsShipping: true }));
    await savedAddrRepo.save(savedAddrRepo.create({ user: bob, userId: bob.id, name: 'Home', shippingAddress: bobAddr as any, billingAddress: bobAddr as any, billingIsSameAsShipping: true }));
    console.log('   ✓ alice → Home');
    console.log('   ✓ bob → Home');

    console.log('\n🎉 Seed complete!');
    console.log('\nTest credentials:');
    console.log('  admin@o2shop.dev    / Admin1234!   (admin)');
    console.log('  alice@o2shop.dev    / Alice1234!   (regular, active)');
    console.log('  bob@o2shop.dev      / Bob12345!    (regular, active)');
    console.log('  charlie@o2shop.dev  / Charlie123!  (regular, inactive)');
    console.log('\nOrders:');
    console.log('  O2SHOP-000001 — alice, PAID + FULFILLED   (tee XS + hoodie M)');
    console.log('  O2SHOP-000002 — bob,   PENDING + UNFULFILLED (pants 32)');
    console.log('  O2SHOP-000003 — guest@example.com, PAID + UNFULFILLED (tee M ×2)');
    console.log('\nExpected ratings (APPROVED reviews only):');
    console.log('  oversized_hoodie      → 8.0  ( (8+9+7) / 3 )');
    console.log('  heavyweight_tee       → 9.0  ( (9+8+10) / 3 )');
    console.log('  patchwork_denim_pants → 8.0  ( (7+8+9) / 3 )');

    await dataSource.destroy();
}

seed().catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
