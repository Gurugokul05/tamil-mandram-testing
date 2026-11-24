import {
  Achievement,
  Announcement,
  AuditLog,
  Event,
  Faq,
  Notification,
  Registration,
  Resource,
  SiteSetting,
  TeamMember,
  User,
  Wing,
} from '../models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { generateArt } from './generate-art.js';
import {
  achievements,
  announcements,
  events,
  faqs,
  resources,
  siteSetting,
  team,
  users,
  wings,
} from './data.js';

const DEFAULT_PASSWORD = 'Mandram@2026';

const seededCollections = [
  Wing,
  User,
  Event,
  Achievement,
  TeamMember,
  Faq,
  Announcement,
  Resource,
  SiteSetting,
  Registration,
  Notification,
  AuditLog,
];

const clearCollections = async () => {
  await Promise.all(seededCollections.map((Model) => Model.deleteMany({})));
  console.log('[seed] cleared existing collections');
};

const seedUsers = async (wingBySlug) => {
  const created = [];

  for (const entry of users) {
    const user = new User({
      name: entry.name,
      email: entry.email,
      regNo: entry.regNo,
      dept: entry.dept,
      year: entry.year,
      phone: entry.phone,
      role: entry.role,
      status: entry.status,
      profileCompleted: entry.profileCompleted,
      wing: entry.wingSlug ? wingBySlug.get(entry.wingSlug)?._id : null,
      approvedAt: entry.status === 'approved' ? new Date('2026-08-01T10:00:00+05:30') : undefined,
    });

    if (entry.status === 'pending_faculty') {
      user.presidentDecision = { approved: true, at: new Date('2026-11-12T10:00:00+05:30') };
    }

    await user.setPassword(DEFAULT_PASSWORD);
    await user.save();
    created.push(user);
  }

  console.log(`[seed] created ${created.length} users`);
  return created;
};

const seedSiteSetting = async (president) => {
  await SiteSetting.create({
    ...siteSetting,
    heroImage: { url: '', alt: 'Tamil Mandram' },
    status: {
      ...siteSetting.status,
      updatedAt: new Date('2026-11-10T09:00:00+05:30'),
      updatedBy: president?._id || null,
    },
  });
  console.log('[seed] created site settings');
};

const seedRegistrations = async (eventBySlug, usersByEmail) => {
  const picks = [
    { event: 'muthamizh-vizha-2027', emails: ['member@mandram.test', 'naveen@mandram.test', 'hari@mandram.test', 'lakshmi@mandram.test', 'irfan@mandram.test'] },
    { event: 'pattimandram-cinema-and-tamil', emails: ['member@mandram.test', 'hari@mandram.test', 'ananya@mandram.test'].slice(0, 2) },
    { event: 'kavithai-iravu-2027', emails: ['lakshmi@mandram.test', 'member@mandram.test'] },
  ];

  let count = 0;

  for (const pick of picks) {
    const event = eventBySlug.get(pick.event);
    if (!event) continue;

    for (const email of pick.emails) {
      const user = usersByEmail.get(email);
      if (!user) continue;

      await Registration.create({
        event: event._id,
        user: user._id,
        status: email === 'member@mandram.test' && pick.event === 'pattimandram-cinema-and-tamil' ? 'attended' : 'registered',
        checkedInAt: email === 'member@mandram.test' && pick.event === 'pattimandram-cinema-and-tamil' ? new Date('2026-12-12T10:05:00+05:30') : undefined,
      });
      count += 1;
    }
  }

  console.log(`[seed] created ${count} event registrations`);
};

const seedNotifications = async (usersByEmail, president) => {
  const pending = usersByEmail.get('ananya@mandram.test');
  const member = usersByEmail.get('member@mandram.test');

  if (pending && president) {
    await Notification.create({
      user: president._id,
      type: 'application.submitted',
      title: { ta: 'புதிய விண்ணப்பம்', en: 'New membership application' },
      message: { ta: `${pending.name} புதிய உறுப்பினர் விண்ணப்பத்தைச் சமர்ப்பித்துள்ளார்.`, en: `${pending.name} submitted a membership application.` },
      link: '/admin/approvals',
    });
  }

  if (member) {
    await Notification.create({
      user: member._id,
      type: 'application.faculty_approved',
      title: { ta: 'உங்கள் சேர்க்கை அனுமதிக்கப்பட்டது', en: 'Your membership is approved' },
      message: { ta: 'தமிழ் மன்றக் குடும்பத்திற்கு வரவேற்கிறோம்!', en: 'Welcome to the Tamil Mandram family.' },
      link: '/dashboard',
      isRead: true,
    });
  }

  console.log('[seed] created sample notifications');
};

const seedAuditLogs = async (usersByEmail) => {
  const president = usersByEmail.get('president@mandram.test');
  const faculty = usersByEmail.get('faculty@mandram.test');
  const member = usersByEmail.get('member@mandram.test');

  if (!president || !faculty || !member) return;

  await AuditLog.create([
    {
      actor: president._id,
      action: 'member.approved',
      targetType: 'User',
      targetId: member._id,
      targetLabel: member.name,
      reason: 'Profile and interview complete',
      ip: '127.0.0.1',
    },
    {
      actor: faculty._id,
      action: 'member.approved',
      targetType: 'User',
      targetId: member._id,
      targetLabel: member.name,
      reason: 'Final faculty approval',
      ip: '127.0.0.1',
    },
    {
      actor: president._id,
      action: 'content.created',
      targetType: 'Event',
      targetLabel: 'Muthamizh Vizha 2027',
      reason: 'Annual festival published',
      ip: '127.0.0.1',
    },
  ]);

  console.log('[seed] created audit log entries');
};

const run = async () => {
  try {
    generateArt();
    await connectDatabase();
    await runSeed();
  } catch (error) {
    console.error('[seed] failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

export async function runSeed() {
  await clearCollections();

  const wingDocs = await Wing.insertMany(wings);
  const wingBySlug = new Map(wingDocs.map((wing) => [wing.slug, wing]));
  console.log(`[seed] created ${wingDocs.length} wings`);

  const createdUsers = await seedUsers(wingBySlug);
  const usersByEmail = new Map(createdUsers.map((user) => [user.email, user]));
  const president = usersByEmail.get('president@mandram.test');
  const faculty = usersByEmail.get('faculty@mandram.test');

  await seedSiteSetting(president);

  const eventDocs = await Event.insertMany(
    events.map((event) => ({
      ...event,
      createdBy: president?._id || null,
    })),
  );
  const eventBySlug = new Map(eventDocs.map((event) => [event.slug, event]));
  console.log(`[seed] created ${eventDocs.length} events`);

  const achievementDocs = await Achievement.insertMany(achievements);
  console.log(`[seed] created ${achievementDocs.length} achievements`);

  const teamDocs = await TeamMember.insertMany(team);
  console.log(`[seed] created ${teamDocs.length} team members`);

  const faqDocs = await Faq.insertMany(faqs);
  console.log(`[seed] created ${faqDocs.length} FAQs`);

  const announcementDocs = await Announcement.insertMany(
    announcements.map((item) => ({ ...item, createdBy: president?._id || null })),
  );
  console.log(`[seed] created ${announcementDocs.length} announcements`);

  const resourceDocs = await Resource.insertMany(
    resources.map((item) => ({ ...item, createdBy: faculty?._id || null, isMemberOnly: true })),
  );
  console.log(`[seed] created ${resourceDocs.length} resources`);

  await seedRegistrations(eventBySlug, usersByEmail);
  await seedNotifications(usersByEmail, president);
  await seedAuditLogs(usersByEmail);

  console.log('\n[seed] done');
  console.log(`[seed] all seeded accounts use the password: ${DEFAULT_PASSWORD}`);
  console.log('[seed] accounts:');
  console.log('  faculty@mandram.test     (faculty_coordinator)');
  console.log('  president@mandram.test   (president)');
  console.log('  coordinator@mandram.test (student_coordinator)');
  console.log('  member@mandram.test      (approved member)');
  console.log('  ananya@mandram.test      (pending president approval)');
  console.log('  sneha@mandram.test       (pending faculty approval)\n');
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href) {
  run();
}
