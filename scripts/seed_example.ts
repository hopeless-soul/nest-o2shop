// scripts/seed.ts
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Photo } from '../src/photos/entities/photo.entity';
import { Role } from '../src/users/enums/role.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Like } from 'src/likes/entities/like.entity';
import { Bookmark } from 'src/bookmarks/entities/bookmark.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Conversation } from '../src/conversations/entities/conversation.entity';
import { ConversationParties } from '../src/conversations/entities/conversation-parties.entity';
import { Message } from '../src/messages/entities/message.entity';
import { ConversationType } from '../src/common/enums/conversation-type.enum';
import { ConversationRole } from '../src/common/enums/conversation-role.enum';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'secret',
    database: process.env.DB_NAME ?? 'myapp',
    entities: [Photo, User, Comment, Like, Bookmark, Conversation, ConversationParties, Message],
    synchronize: false,
});

async function seed() {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const userRepo = dataSource.getRepository(User);
    const photoRepo = dataSource.getRepository(Photo);

    // ── Clear ──
    console.log('🧹 Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE "photo" CASCADE');
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
    console.log('   ✓ Tables cleared');

    // ── Seed users ──
    console.log('👤 Seeding users...');

    const adminUser = userRepo.create({
        username: 'admin',
        email: 'admin@test.com',
        password: await bcrypt.hash('12345678', 10),
        roles: [Role.ADMIN, Role.USER],
        isActive: true,
    });

    const alice = userRepo.create({
        username: 'alice',
        email: 'alice@photos.dev',
        password: await bcrypt.hash('alice1234', 10),
        roles: [Role.USER],
        isActive: true,
    });

    const bob = userRepo.create({
        username: 'bob',
        email: 'bob@photos.dev',
        password: await bcrypt.hash('bob12345', 10),
        roles: [Role.USER],
        isActive: true,
    });

    const charlie = userRepo.create({
        username: 'charlie',
        email: 'charlie@photos.dev',
        password: await bcrypt.hash('charlie1234', 10),
        roles: [Role.USER],
        isActive: false,
    });

    const savedAdmin = await userRepo.save(adminUser);
    const savedAlice = await userRepo.save(alice);
    const savedBob = await userRepo.save(bob);
    const savedCharlie = await userRepo.save(charlie);

    console.log(`   ✓ admin   (id: ${savedAdmin.id})`);
    console.log(`   ✓ alice   (id: ${savedAlice.id})`);
    console.log(`   ✓ bob     (id: ${savedBob.id})`);
    console.log(`   ✓ charlie (id: ${savedCharlie.id})`);

    // ── Seed photos ──
    console.log('📸 Seeding photos...');

    const photoData = [
        // admin
        {
            title: 'Mountain Sunset',
            description: 'Golden hour over the peaks, the sky was on fire.',
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            isPublished: true,
            author: savedAdmin,
        },
        {
            title: 'City Lights',
            description: 'Downtown at midnight, neon reflections on wet pavement.',
            url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
            isPublished: true,
            author: savedAdmin,
        },
        // alice
        {
            title: 'Forest Path',
            description: 'A quiet morning walk through the mist.',
            url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
            isPublished: true,
            author: savedAlice,
        },
        {
            title: 'Ocean Waves',
            description: 'The tide coming in at dusk, peaceful and vast.',
            url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
            isPublished: true,
            author: savedAlice,
        },
        {
            title: 'Draft: Rainy Window',
            description: 'An unfinished thought on a grey afternoon.',
            url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800',
            isPublished: false,
            author: savedAlice,
        },
        // bob
        {
            title: 'Desert Dunes',
            description: 'Wind sculpted sand as far as the eye can see.',
            url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
            isPublished: true,
            author: savedBob,
        },
        {
            title: 'Snowy Cabin',
            description: 'A cosy cabin buried in fresh winter snow.',
            url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
            isPublished: true,
            author: savedBob,
        },
        {
            title: 'Draft: Abstract Blur',
            description: 'Still deciding if this one is worth posting.',
            url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
            isPublished: false,
            author: savedBob,
        },
        // charlie (inactive user, still has photos)
        {
            title: 'Rooftop View',
            description: 'The city from above on a clear summer evening.',
            url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
            isPublished: true,
            author: savedCharlie,
        },
    ];

    for (const p of photoData) {
        const photo = photoRepo.create(p);
        const saved = await photoRepo.save(photo);
        console.log(`   ✓ "${saved.title}" → ${p.author.username} (published: ${p.isPublished})`);
    }

    // ── Seed conversations ──
    console.log('💬 Seeding conversations...');

    const convRepo = dataSource.getRepository(Conversation);
    const partiesRepo = dataSource.getRepository(ConversationParties);
    const msgRepo = dataSource.getRepository(Message);

    // Direct: alice ↔ bob
    const dmAliceBob = convRepo.create({ type: ConversationType.DIRECT });
    const savedDmAliceBob = await convRepo.save(dmAliceBob);
    await partiesRepo.save([
        partiesRepo.create({ conversation: savedDmAliceBob, user: savedAlice, role: ConversationRole.OWNER }),
        partiesRepo.create({ conversation: savedDmAliceBob, user: savedBob, role: ConversationRole.MEMBER }),
    ]);

    const dm1Msg1 = await msgRepo.save(msgRepo.create({ conversation: savedDmAliceBob, author: savedAlice, content: 'Hey Bob, loved your Desert Dunes shot!' }));
    await msgRepo.save(msgRepo.create({ conversation: savedDmAliceBob, author: savedBob, content: 'Thanks! Took it at sunrise. Your Ocean Waves one is stunning too.', replyTo: dm1Msg1, replyToId: dm1Msg1.id }));
    const dm1Msg3 = msgRepo.create({ conversation: savedDmAliceBob, author: savedAlice, content: 'Thanks! I almost didn\'t post it.' });
    dm1Msg3.editedAt = new Date();
    await msgRepo.save(dm1Msg3);
    console.log(`   ✓ DIRECT alice ↔ bob (3 messages)`);

    // Direct: admin ↔ alice
    const dmAdminAlice = convRepo.create({ type: ConversationType.DIRECT });
    const savedDmAdminAlice = await convRepo.save(dmAdminAlice);
    await partiesRepo.save([
        partiesRepo.create({ conversation: savedDmAdminAlice, user: savedAdmin, role: ConversationRole.OWNER }),
        partiesRepo.create({ conversation: savedDmAdminAlice, user: savedAlice, role: ConversationRole.MEMBER }),
    ]);

    const dm2Msg1 = await msgRepo.save(msgRepo.create({ conversation: savedDmAdminAlice, author: savedAdmin, content: 'Alice, your Forest Path photo got flagged for review — just a routine check.' }));
    const dm2Msg2 = msgRepo.create({ conversation: savedDmAdminAlice, author: savedAlice, content: 'Oh no, is everything okay?' });
    dm2Msg2.deletedAt = new Date();
    await msgRepo.save(dm2Msg2);
    await msgRepo.save(msgRepo.create({ conversation: savedDmAdminAlice, author: savedAdmin, content: 'All clear! False positive. You\'re good to go.', replyTo: dm2Msg1, replyToId: dm2Msg1.id }));
    console.log(`   ✓ DIRECT admin ↔ alice (3 messages, 1 soft-deleted)`);

    // Group: Photo Crew (admin, alice, bob)
    const groupCrew = convRepo.create({ type: ConversationType.GROUP, name: 'Photo Crew', description: 'Sharing shots and feedback' });
    const savedGroupCrew = await convRepo.save(groupCrew);
    await partiesRepo.save([
        partiesRepo.create({ conversation: savedGroupCrew, user: savedAdmin, role: ConversationRole.OWNER }),
        partiesRepo.create({ conversation: savedGroupCrew, user: savedAlice, role: ConversationRole.ADMIN }),
        partiesRepo.create({ conversation: savedGroupCrew, user: savedBob, role: ConversationRole.MEMBER }),
    ]);

    await msgRepo.save(msgRepo.create({ conversation: savedGroupCrew, author: savedAdmin, content: 'Welcome to Photo Crew everyone!' }));
    await msgRepo.save(msgRepo.create({ conversation: savedGroupCrew, author: savedAlice, content: 'Excited to be here 📸' }));
    await msgRepo.save(msgRepo.create({ conversation: savedGroupCrew, author: savedBob, content: 'Same! Anyone going to the city shoot this weekend?' }));
    console.log(`   ✓ GROUP "Photo Crew" — admin(OWNER), alice(ADMIN), bob(MEMBER) (3 messages)`);

    console.log('\n🎉 Seed complete!');
    console.log('\nTest credentials:');
    console.log('  admin@test.com    / 12345678   (admin + user)');
    console.log('  alice@photos.dev    / alice1234   (user)');
    console.log('  bob@photos.dev      / bob12345    (user)');
    console.log('  charlie@photos.dev  / charlie1234 (user, inactive)');

    await dataSource.destroy();
}

seed().catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});