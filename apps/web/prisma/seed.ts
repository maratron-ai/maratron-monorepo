import { PrismaClient, DistanceUnit, TrainingLevel, Gender, Device, TrainingEnvironment } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (be careful in production!)
  await prisma.runGroupMember.deleteMany();
  await prisma.runGroup.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.runPost.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.socialProfile.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.run.deleteMany();
  await prisma.shoe.deleteMany();
  await prisma.runningPlan.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Runner',
        email: 'john@example.com',
        age: 28,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 52,
        goals: ['Marathon PR', 'Sub-3:00 marathon'],
        yearsRunning: 5,
        weeklyMileage: 50,
        height: 175, // cm
        weight: 70, // kg
        preferredTrainingDays: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Speedster',
        email: 'sarah@example.com',
        age: 24,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 58,
        goals: ['5K PR', 'Track season'],
        yearsRunning: 8,
        weeklyMileage: 65,
        height: 168,
        weight: 55,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.Polar,
        defaultDistanceUnit: DistanceUnit.kilometers,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mike Marathoner',
        email: 'mike@example.com',
        age: 35,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 55,
        goals: ['Boston Qualifier', 'Sub-2:50 marathon'],
        yearsRunning: 12,
        weeklyMileage: 80,
        height: 180,
        weight: 75,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Emily Endurance',
        email: 'emily@example.com',
        age: 31,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 48,
        goals: ['First Marathon', 'Consistency'],
        yearsRunning: 3,
        weeklyMileage: 35,
        height: 163,
        weight: 58,
        preferredTrainingDays: ['Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.treadmill,
        device: Device.AppleWatch,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
  ]);

  console.log('👥 Created users');

  // Create Shoes for users
  const shoes = await Promise.all([
    // John's shoes
    prisma.shoe.create({
      data: {
        name: 'Nike Air Zoom Pegasus 40',
        notes: 'Daily trainer',
        currentDistance: 245.6,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[0].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Nike Vaporfly Next% 3',
        notes: 'Race day only',
        currentDistance: 26.2,
        maxDistance: 200,
        distanceUnit: DistanceUnit.miles,
        userId: users[0].id,
      },
    }),
    // Sarah's shoes
    prisma.shoe.create({
      data: {
        name: 'Adidas Adizero Boston 12',
        notes: 'Tempo and long runs',
        currentDistance: 320.5,
        maxDistance: 600,
        distanceUnit: DistanceUnit.kilometers,
        userId: users[1].id,
      },
    }),
    // Mike's shoes
    prisma.shoe.create({
      data: {
        name: 'ASICS Gel-Nimbus 25',
        notes: 'Easy day workhorse',
        currentDistance: 389.2,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[2].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'ASICS MetaSpeed Sky+',
        notes: 'Marathon racing',
        currentDistance: 52.4,
        maxDistance: 200,
        distanceUnit: DistanceUnit.miles,
        userId: users[2].id,
      },
    }),
    // Emily's shoes
    prisma.shoe.create({
      data: {
        name: 'Brooks Ghost 15',
        notes: 'Comfortable for all runs',
        currentDistance: 156.3,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[3].id,
      },
    }),
  ]);

  console.log('👟 Created shoes');

  // Set default shoes
  await prisma.user.update({
    where: { id: users[0].id },
    data: { defaultShoeId: shoes[0].id },
  });
  await prisma.user.update({
    where: { id: users[1].id },
    data: { defaultShoeId: shoes[2].id },
  });
  await prisma.user.update({
    where: { id: users[2].id },
    data: { defaultShoeId: shoes[3].id },
  });
  await prisma.user.update({
    where: { id: users[3].id },
    data: { defaultShoeId: shoes[5].id },
  });

  // Create recent runs
  const runs = await Promise.all([
    // John's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '45:30',
        distance: 6.2,
        distanceUnit: DistanceUnit.miles,
        pace: '7:20',
        paceUnit: DistanceUnit.miles,
        name: 'Morning Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 150,
        elevationGainUnit: 'feet',
        notes: 'Felt great, nice weather',
        userId: users[0].id,
        shoeId: shoes[0].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-23'),
        duration: '32:15',
        distance: 5.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:27',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Good tempo effort',
        userId: users[0].id,
        shoeId: shoes[0].id,
      },
    }),
    // Sarah's runs  
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '28:45',
        distance: 8.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '3:35',
        paceUnit: DistanceUnit.kilometers,
        name: 'Track Intervals',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '6x800m @ 5K pace',
        userId: users[1].id,
        shoeId: shoes[2].id,
      },
    }),
    // Mike's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-24'),
        duration: '75:20',
        distance: 12.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:17',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 340,
        elevationGainUnit: 'feet',
        notes: 'Marathon pace progression',
        userId: users[2].id,
        shoeId: shoes[3].id,
      },
    }),
    // Emily's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '35:45',
        distance: 4.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:57',
        paceUnit: DistanceUnit.miles,
        name: 'Treadmill Easy',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Indoor run due to rain',
        userId: users[3].id,
        shoeId: shoes[5].id,
      },
    }),
  ]);

  console.log('🏃 Created runs');

  // Create Social Profiles
  const socialProfiles = await Promise.all([
    prisma.socialProfile.create({
      data: {
        userId: users[0].id,
        username: 'johnrunner',
        bio: 'Marathon enthusiast from Boston. Always chasing that next PR! 🏃‍♂️',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[1].id,
        username: 'sarahspeed',
        bio: 'Track & field athlete | 5K specialist | Coach',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[2].id,
        username: 'mikemarathon',
        bio: 'Boston qualifier hunting sub-2:50. Trail runner on weekends.',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[3].id,
        username: 'emilyendurance',
        bio: 'New to running but loving every mile! First marathon in training.',
      },
    }),
  ]);

  console.log('📱 Created social profiles');

  // Create some follows
  await Promise.all([
    prisma.follow.create({
      data: {
        followerId: socialProfiles[0].id,
        followingId: socialProfiles[1].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: socialProfiles[0].id,
        followingId: socialProfiles[2].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: socialProfiles[1].id,
        followingId: socialProfiles[0].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: socialProfiles[3].id,
        followingId: socialProfiles[0].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: socialProfiles[3].id,
        followingId: socialProfiles[1].id,
      },
    }),
  ]);

  console.log('👥 Created follow relationships');

  // Create some run posts
  const runPosts = await Promise.all([
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[0].id,
        distance: 6.2,
        time: '45:30',
        caption: 'Beautiful morning run! The weather was perfect and I felt strong throughout. Ready for the week ahead! 💪',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[1].id,
        distance: 8.0,
        time: '28:45',
        caption: 'Track workout complete! 6x800m intervals at 5K pace. Legs are feeling good and speed is coming back. 🏃‍♀️⚡',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[2].id,
        distance: 12.0,
        time: '75:20',
        caption: 'Long run in the books! Marathon pace progression felt smooth. Building towards that Boston qualifier goal 🎯',
      },
    }),
  ]);

  console.log('📝 Created run posts');

  // Create some comments
  await Promise.all([
    prisma.comment.create({
      data: {
        postId: runPosts[0].id,
        socialProfileId: socialProfiles[1].id,
        text: 'Great pace! Keep it up! 🔥',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[0].id,
        socialProfileId: socialProfiles[3].id,
        text: 'Love the consistency! Inspiring me to get out there today.',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[1].id,
        socialProfileId: socialProfiles[0].id,
        text: 'Those intervals sound brutal! Nice work on the track 💪',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[2].id,
        socialProfileId: socialProfiles[1].id,
        text: 'You got this! BQ is definitely within reach with that training 🏆',
      },
    }),
  ]);

  console.log('💬 Created comments');

  // Create some likes
  await Promise.all([
    prisma.like.create({
      data: {
        postId: runPosts[0].id,
        socialProfileId: socialProfiles[1].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[0].id,
        socialProfileId: socialProfiles[2].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[1].id,
        socialProfileId: socialProfiles[0].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[1].id,
        socialProfileId: socialProfiles[3].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[2].id,
        socialProfileId: socialProfiles[0].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[2].id,
        socialProfileId: socialProfiles[1].id,
      },
    }),
  ]);

  console.log('❤️ Created likes');

  // Create a run group
  const runGroup = await prisma.runGroup.create({
    data: {
      name: 'Boston Marathon Training Group',
      description: 'A group for runners training for the Boston Marathon. Share your progress, get support, and stay motivated!',
      private: false,
      ownerId: socialProfiles[2].id,
    },
  });

  // Add members to the group
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroup.id,
        socialProfileId: socialProfiles[2].id, // Owner
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroup.id,
        socialProfileId: socialProfiles[0].id,
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroup.id,
        socialProfileId: socialProfiles[3].id,
      },
    }),
  ]);

  console.log('🏃‍♂️ Created run group and members');

  // Create a sample training plan
  await prisma.runningPlan.create({
    data: {
      userId: users[0].id,
      name: 'Marathon Training Plan - 16 Weeks',
      weeks: 16,
      active: true,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-09-21'),
      planData: {
        goal: 'Sub-3:00 Marathon',
        targetRace: 'Chicago Marathon',
        peakWeeklyMileage: 65,
        weeklyPlans: [
          {
            week: 1,
            totalMiles: 35,
            runs: [
              { day: 'Monday', type: 'Rest' },
              { day: 'Tuesday', type: 'Easy', distance: 5, pace: '7:30' },
              { day: 'Wednesday', type: 'Tempo', distance: 6, pace: '6:45' },
              { day: 'Thursday', type: 'Easy', distance: 4, pace: '7:30' },
              { day: 'Friday', type: 'Rest' },
              { day: 'Saturday', type: 'Easy', distance: 5, pace: '7:30' },
              { day: 'Sunday', type: 'Long', distance: 12, pace: '7:00' },
            ],
          },
          // Add more weeks as needed...
        ],
      },
    },
  });

  console.log('📅 Created training plan');

  console.log('✅ Database seeding completed successfully!');
  console.log(`
🎉 Seed data summary:
- 👥 ${users.length} users created
- 👟 ${shoes.length} shoes created  
- 🏃 ${runs.length} runs created
- 📱 ${socialProfiles.length} social profiles created
- 📝 ${runPosts.length} run posts created
- 🏃‍♂️ 1 run group created
- 📅 1 training plan created

You can now log in with:
- john@example.com
- sarah@example.com  
- mike@example.com
- emily@example.com
`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });