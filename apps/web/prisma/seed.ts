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
    prisma.user.create({
      data: {
        name: 'Jackson Thetford',
        email: 'jackson@maratron.ai',
        age: 29,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 60,
        goals: ['Sub-2:45 Marathon', 'Olympic Trials Qualifier'],
        yearsRunning: 10,
        weeklyMileage: 75,
        height: 178,
        weight: 68,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Alex TrailRunner',
        email: 'alex@example.com',
        age: 26,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 49,
        goals: ['Ultra Marathon', 'Mountain Trails'],
        yearsRunning: 4,
        weeklyMileage: 60,
        height: 182,
        weight: 78,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Suunto,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lisa Pacer',
        email: 'lisa@example.com',
        age: 33,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.beginner,
        VDOT: 38,
        goals: ['Complete 5K', 'Build endurance'],
        yearsRunning: 1,
        weeklyMileage: 20,
        height: 165,
        weight: 62,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.AppleWatch,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Sprinter',
        email: 'david@example.com',
        age: 22,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 62,
        goals: ['100m PR', 'College Track'],
        yearsRunning: 6,
        weeklyMileage: 30,
        height: 185,
        weight: 82,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Polar,
        defaultDistanceUnit: DistanceUnit.meters,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rachel Recovery',
        email: 'rachel@example.com',
        age: 40,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 45,
        goals: ['Injury prevention', 'Half Marathon'],
        yearsRunning: 7,
        weeklyMileage: 40,
        height: 170,
        weight: 65,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Tom Triathlete',
        email: 'tom@example.com',
        age: 37,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 54,
        goals: ['Ironman', 'Triathlon season'],
        yearsRunning: 9,
        weeklyMileage: 45,
        height: 176,
        weight: 72,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.kilometers,
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
    prisma.shoe.create({
      data: {
        name: 'Hoka Mach 5',
        notes: 'Tempo runs and workouts',
        currentDistance: 178.4,
        maxDistance: 400,
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
    prisma.shoe.create({
      data: {
        name: 'Adidas Adizero Takumi Sen 9',
        notes: 'Track racing spikes',
        currentDistance: 45.2,
        maxDistance: 200,
        distanceUnit: DistanceUnit.kilometers,
        userId: users[1].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'On Cloudflow 3',
        notes: 'Recovery runs',
        currentDistance: 156.8,
        maxDistance: 400,
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
    prisma.shoe.create({
      data: {
        name: 'New Balance Fresh Foam X 1080v12',
        notes: 'Long run comfort',
        currentDistance: 234.7,
        maxDistance: 450,
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
    prisma.shoe.create({
      data: {
        name: 'Brooks Glycerin 20',
        notes: 'Maximum cushioning for treadmill',
        currentDistance: 89.6,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[3].id,
      },
    }),
    // Jackson's shoes
    prisma.shoe.create({
      data: {
        name: 'Nike ZoomX Vaporfly NEXT% 2',
        notes: 'Marathon racing shoes',
        currentDistance: 78.4,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[4].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Nike Air Zoom Alphafly NEXT%',
        notes: 'Race day carbon fiber shoes',
        currentDistance: 104.2,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[4].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Hoka Clifton 9',
        notes: 'Daily trainer for easy runs',
        currentDistance: 287.6,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[4].id,
      },
    }),
    // Alex's shoes
    prisma.shoe.create({
      data: {
        name: 'Salomon Speedcross 5',
        notes: 'Trail running and mountain terrain',
        currentDistance: 210.3,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[5].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Altra Lone Peak 7',
        notes: 'Ultra distance trail runs',
        currentDistance: 345.7,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[5].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Hoka Mafate Speed 4',
        notes: 'Technical trail racing',
        currentDistance: 123.4,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[5].id,
      },
    }),
    // Lisa's shoes
    prisma.shoe.create({
      data: {
        name: 'ASICS Gel-Excite 9',
        notes: 'Beginner-friendly daily trainer',
        currentDistance: 78.2,
        maxDistance: 350,
        distanceUnit: DistanceUnit.miles,
        userId: users[6].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'New Balance Fresh Foam Arishi v4',
        notes: 'Comfortable for new runner',
        currentDistance: 45.8,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[6].id,
      },
    }),
    // David's shoes
    prisma.shoe.create({
      data: {
        name: 'Nike Zoom Rival S 9',
        notes: 'Track spikes for sprints',
        currentDistance: 12.4,
        maxDistance: 100,
        distanceUnit: DistanceUnit.miles,
        userId: users[7].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Adidas Adizero Prime SP',
        notes: 'Competition spikes',
        currentDistance: 8.7,
        maxDistance: 80,
        distanceUnit: DistanceUnit.miles,
        userId: users[7].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Nike Free RN 5.0',
        notes: 'Training and recovery',
        currentDistance: 67.3,
        maxDistance: 250,
        distanceUnit: DistanceUnit.miles,
        userId: users[7].id,
      },
    }),
    // Rachel's shoes
    prisma.shoe.create({
      data: {
        name: 'ASICS Gel-Kayano 29',
        notes: 'Stability for injury prevention',
        currentDistance: 198.5,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[8].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Brooks Adrenaline GTS 23',
        notes: 'Trusted stability shoe',
        currentDistance: 267.8,
        maxDistance: 450,
        distanceUnit: DistanceUnit.miles,
        userId: users[8].id,
      },
    }),
    // Tom's shoes
    prisma.shoe.create({
      data: {
        name: 'On Cloudstratus',
        notes: 'Triathlon training runs',
        currentDistance: 189.2,
        maxDistance: 400,
        distanceUnit: DistanceUnit.kilometers,
        userId: users[9].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Zoot Ultra Race 4.0',
        notes: 'Triathlon racing shoes',
        currentDistance: 76.4,
        maxDistance: 300,
        distanceUnit: DistanceUnit.kilometers,
        userId: users[9].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Hoka Arahi 6',
        notes: 'Long training runs',
        currentDistance: 234.6,
        maxDistance: 500,
        distanceUnit: DistanceUnit.kilometers,
        userId: users[9].id,
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
    data: { defaultShoeId: shoes[3].id },
  });
  await prisma.user.update({
    where: { id: users[2].id },
    data: { defaultShoeId: shoes[6].id },
  });
  await prisma.user.update({
    where: { id: users[3].id },
    data: { defaultShoeId: shoes[9].id },
  });
  await prisma.user.update({
    where: { id: users[4].id },
    data: { defaultShoeId: shoes[13].id },
  });
  await prisma.user.update({
    where: { id: users[5].id },
    data: { defaultShoeId: shoes[15].id },
  });
  await prisma.user.update({
    where: { id: users[6].id },
    data: { defaultShoeId: shoes[17].id },
  });
  await prisma.user.update({
    where: { id: users[7].id },
    data: { defaultShoeId: shoes[21].id },
  });
  await prisma.user.update({
    where: { id: users[8].id },
    data: { defaultShoeId: shoes[22].id },
  });
  await prisma.user.update({
    where: { id: users[9].id },
    data: { defaultShoeId: shoes[24].id },
  });

  // Create recent runs
  const runs = await Promise.all([
    // John's runs - Week 1
    prisma.run.create({
      data: {
        date: new Date('2024-06-26'),
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
        date: new Date('2024-06-24'),
        duration: '32:15',
        distance: 5.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:27',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Good tempo effort',
        userId: users[0].id,
        shoeId: shoes[2].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-22'),
        duration: '68:45',
        distance: 10.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:52',
        paceUnit: DistanceUnit.miles,
        name: 'Sunday Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 280,
        elevationGainUnit: 'feet',
        notes: 'Steady effort, building base',
        userId: users[0].id,
        shoeId: shoes[0].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-20'),
        duration: '28:30',
        distance: 4.0,
        distanceUnit: DistanceUnit.miles,
        pace: '7:07',
        paceUnit: DistanceUnit.miles,
        name: 'Recovery Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Easy pace, feeling good',
        userId: users[0].id,
        shoeId: shoes[0].id,
      },
    }),

    // Sarah's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-26'),
        duration: '28:45',
        distance: 8.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '3:35',
        paceUnit: DistanceUnit.kilometers,
        name: 'Track Intervals',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '6x800m @ 5K pace',
        userId: users[1].id,
        shoeId: shoes[4].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '35:20',
        distance: 10.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '3:32',
        paceUnit: DistanceUnit.kilometers,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Strong tempo effort, felt controlled',
        userId: users[1].id,
        shoeId: shoes[3].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-23'),
        duration: '42:15',
        distance: 12.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '3:31',
        paceUnit: DistanceUnit.kilometers,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Building aerobic base',
        userId: users[1].id,
        shoeId: shoes[3].id,
      },
    }),

    // Mike's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-26'),
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
        shoeId: shoes[8].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-24'),
        duration: '45:30',
        distance: 8.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:41',
        paceUnit: DistanceUnit.miles,
        name: 'Threshold Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '5 miles at threshold pace',
        userId: users[2].id,
        shoeId: shoes[6].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-22'),
        duration: '38:45',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:27',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Recovery between workouts',
        userId: users[2].id,
        shoeId: shoes[6].id,
      },
    }),

    // Emily's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-26'),
        duration: '35:45',
        distance: 4.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:57',
        paceUnit: DistanceUnit.miles,
        name: 'Treadmill Easy',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Indoor run due to rain',
        userId: users[3].id,
        shoeId: shoes[10].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-23'),
        duration: '56:30',
        distance: 7.0,
        distanceUnit: DistanceUnit.miles,
        pace: '8:04',
        paceUnit: DistanceUnit.miles,
        name: 'Weekend Long Run',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Building endurance gradually',
        userId: users[3].id,
        shoeId: shoes[9].id,
      },
    }),

    // Jackson's runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-26'),
        duration: '68:30',
        distance: 15.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:34',
        paceUnit: DistanceUnit.miles,
        name: 'Marathon Pace Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 420,
        elevationGainUnit: 'feet',
        notes: 'Perfect execution of marathon pace work. Building confidence for race day.',
        userId: users[4].id,
        shoeId: shoes[13].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-24'),
        duration: '24:15',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:02',
        paceUnit: DistanceUnit.miles,
        name: 'Track Workout - 5x1200m',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '5x1200m at 5K pace with 400m recovery. Hit all splits perfectly.',
        userId: users[4].id,
        shoeId: shoes[12].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-22'),
        duration: '45:20',
        distance: 10.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:32',
        paceUnit: DistanceUnit.miles,
        name: 'Threshold Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 200,
        elevationGainUnit: 'feet',
        notes: '6 miles at threshold pace. Felt controlled and strong throughout.',
        userId: users[4].id,
        shoeId: shoes[13].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-20'),
        duration: '42:15',
        distance: 9.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:41',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Recovery run with strides',
        userId: users[4].id,
        shoeId: shoes[13].id,
      },
    }),

    // Alex's trail runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '95:30',
        distance: 12.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:38',
        paceUnit: DistanceUnit.miles,
        name: 'Mountain Trail Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 1250,
        elevationGainUnit: 'feet',
        notes: 'Epic trail run with stunning views. Legs felt strong on the climbs.',
        userId: users[5].id,
        shoeId: shoes[14].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-23'),
        duration: '65:45',
        distance: 8.0,
        distanceUnit: DistanceUnit.miles,
        pace: '8:13',
        paceUnit: DistanceUnit.miles,
        name: 'Technical Trail',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 800,
        elevationGainUnit: 'feet',
        notes: 'Rocky single track, focused on foot placement',
        userId: users[5].id,
        shoeId: shoes[16].id,
      },
    }),

    // Lisa's beginner runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '28:30',
        distance: 3.0,
        distanceUnit: DistanceUnit.miles,
        pace: '9:30',
        paceUnit: DistanceUnit.miles,
        name: 'First 5K Training',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Completed without walking! Feeling proud.',
        userId: users[6].id,
        shoeId: shoes[17].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-22'),
        duration: '22:15',
        distance: 2.2,
        distanceUnit: DistanceUnit.miles,
        pace: '10:07',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Jog',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Building consistency, one step at a time',
        userId: users[6].id,
        shoeId: shoes[18].id,
      },
    }),

    // David's sprint training
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '35:00',
        distance: 3.5,
        distanceUnit: DistanceUnit.miles,
        pace: '10:00',
        paceUnit: DistanceUnit.miles,
        name: 'Sprint Training Session',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '8x100m sprints + warm-up/cool-down. Hit personal best on 3rd rep!',
        userId: users[7].id,
        shoeId: shoes[19].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-23'),
        duration: '25:30',
        distance: 4.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:22',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Base building for sprint season',
        userId: users[7].id,
        shoeId: shoes[21].id,
      },
    }),

    // Rachel's stability runs
    prisma.run.create({
      data: {
        date: new Date('2024-06-26'),
        duration: '45:20',
        distance: 5.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:14',
        paceUnit: DistanceUnit.miles,
        name: 'Steady State Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Focused on form and injury prevention. Knee feels good!',
        userId: users[8].id,
        shoeId: shoes[22].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-24'),
        duration: '38:45',
        distance: 4.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:36',
        paceUnit: DistanceUnit.miles,
        name: 'Recovery Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Easy pace with dynamic stretching',
        userId: users[8].id,
        shoeId: shoes[23].id,
      },
    }),

    // Tom's triathlon training
    prisma.run.create({
      data: {
        date: new Date('2024-06-25'),
        duration: '42:30',
        distance: 10.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '4:15',
        paceUnit: DistanceUnit.kilometers,
        name: 'Brick Run (after bike)',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Transition run after 40km bike. Legs felt heavy but pushed through.',
        userId: users[9].id,
        shoeId: shoes[24].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2024-06-23'),
        duration: '35:20',
        distance: 8.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '4:25',
        paceUnit: DistanceUnit.kilometers,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Solid tempo effort for Ironman training',
        userId: users[9].id,
        shoeId: shoes[26].id,
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
    prisma.socialProfile.create({
      data: {
        userId: users[4].id,
        username: 'jacksonthetford',
        bio: 'Creator of Maratron 🏃‍♂️ | Sub-2:45 marathoner | Olympic Trials dreamer | Running data nerd',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[5].id,
        username: 'alextrails',
        bio: 'Ultra runner | Mountain enthusiast | Chasing sunrises on the trails 🏔️',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[6].id,
        username: 'lisapacer',
        bio: 'Running newbie on a journey! 🌟 Couch to 5K graduate working towards my first 10K',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[7].id,
        username: 'davidsprints',
        bio: 'College sprinter | 100m & 200m specialist | Speed is life ⚡',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[8].id,
        username: 'rachelruns',
        bio: 'Running smart, staying healthy 💪 | Former injury warrior | Half marathon lover',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[9].id,
        username: 'tomtriathlete',
        bio: 'Swim 🏊‍♂️ Bike 🚴‍♂️ Run 🏃‍♂️ | Ironman in training | Triple threat athlete',
      },
    }),
  ]);

  console.log('📱 Created social profiles');

  // Create extensive follow relationships
  const followRelationships = [
    // John follows
    [0, 1], [0, 2], [0, 4], [0, 5], [0, 8],
    // Sarah follows
    [1, 0], [1, 2], [1, 4], [1, 7], [1, 9],
    // Mike follows
    [2, 0], [2, 1], [2, 4], [2, 5], [2, 8], [2, 9],
    // Emily follows
    [3, 0], [3, 1], [3, 4], [3, 6], [3, 8],
    // Jackson follows everyone
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9],
    // Alex follows
    [5, 0], [5, 2], [5, 4], [5, 8], [5, 9],
    // Lisa follows
    [6, 0], [6, 3], [6, 4], [6, 8],
    // David follows
    [7, 1], [7, 4], [7, 9],
    // Rachel follows
    [8, 0], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6],
    // Tom follows
    [9, 1], [9, 2], [9, 4], [9, 5], [9, 7],
  ];

  await Promise.all(
    followRelationships.map(([followerId, followingId]) =>
      prisma.follow.create({
        data: {
          followerId: socialProfiles[followerId].id,
          followingId: socialProfiles[followingId].id,
        },
      })
    )
  );

  console.log('👥 Created follow relationships');

  // Create extensive run posts
  const runPosts = await Promise.all([
    // John's posts
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
        socialProfileId: socialProfiles[0].id,
        distance: 10.0,
        time: '68:45',
        caption: 'Sunday long run complete! 💯 Building that marathon base one mile at a time. Boston, here I come! 🏃‍♂️',
      },
    }),
    
    // Sarah's posts
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
        socialProfileId: socialProfiles[1].id,
        distance: 10.0,
        time: '35:20',
        caption: 'Tempo run this morning! 🔥 Feeling so strong and controlled. Track season is going to be amazing this year! 🏆',
      },
    }),
    
    // Mike's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[2].id,
        distance: 12.0,
        time: '75:20',
        caption: 'Long run in the books! Marathon pace progression felt smooth. Building towards that Boston qualifier goal 🎯',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[2].id,
        distance: 8.0,
        time: '45:30',
        caption: 'Threshold run complete! 💪 5 miles at threshold pace felt controlled and strong. Marathon training is going perfectly 🏃‍♂️',
      },
    }),
    
    // Emily's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[3].id,
        distance: 4.5,
        time: '35:45',
        caption: 'Treadmill run done! 🏃‍♀️ Rain couldn\'t stop me today. Every run is building towards my first marathon goal! 🌟',
      },
    }),
    
    // Jackson's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[4].id,
        distance: 15.0,
        time: '68:30',
        caption: 'Marathon pace long run complete! 15 miles at 4:34 pace. The Olympic Trials dream is alive and well 🎆✨ Building Maratron during the day, chasing fast times in the morning!',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[4].id,
        distance: 6.0,
        time: '24:15',
        caption: 'Track session: 5x1200m at 5K pace 💪 Hit every split perfectly. Sometimes the best code debugging happens during interval recovery 😄💻',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[4].id,
        distance: 10.0,
        time: '45:20',
        caption: 'Threshold run this morning! 6 miles at threshold pace felt absolutely dialed. The fitness is coming together nicely 🚀',
      },
    }),
    
    // Alex's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[5].id,
        distance: 12.5,
        time: '95:30',
        caption: 'Epic mountain trail run! 🏔️ 1,250ft of elevation gain and the most beautiful sunrise. This is why I run trails! 🌅',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[5].id,
        distance: 8.0,
        time: '65:45',
        caption: 'Technical trail session complete! 🥾 Rocky single track that demands every ounce of focus. Love the challenge! 💪',
      },
    }),
    
    // Lisa's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[6].id,
        distance: 3.0,
        time: '28:30',
        caption: 'I did it! 🎉 Completed my first 3-mile run without walking! 6 months ago I couldn\'t run for 30 seconds. Dreams do come true! 🌟',
      },
    }),
    
    // David's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[7].id,
        distance: 3.5,
        time: '35:00',
        caption: 'Sprint training session! ⚡ 8x100m sprints with a new personal best on the 3rd rep. Speed kills! 🔥',
      },
    }),
    
    // Rachel's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[8].id,
        distance: 5.5,
        time: '45:20',
        caption: 'Steady state run complete! 💪 Focused on form and staying injury-free. My knee feels amazing! Smart running wins 🧠',
      },
    }),
    
    // Tom's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[9].id,
        distance: 10.0,
        time: '42:30',
        caption: 'Brick run after a 40km bike! 🚴‍♂️➡️🏃‍♂️ Legs felt heavy but pushed through. Ironman training is no joke! 💯',
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
    prisma.comment.create({
      data: {
        postId: runPosts[3].id,
        socialProfileId: socialProfiles[0].id,
        text: 'Olympic Trials pace! 😲 Absolutely crushing it Jackson!',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[4].id,
        socialProfileId: socialProfiles[2].id,
        text: 'Haha love the coding reference! Those track splits are insane 🔥',
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
    // Likes for Jackson's posts
    prisma.like.create({
      data: {
        postId: runPosts[3].id,
        socialProfileId: socialProfiles[0].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[3].id,
        socialProfileId: socialProfiles[1].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[3].id,
        socialProfileId: socialProfiles[2].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[4].id,
        socialProfileId: socialProfiles[1].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[4].id,
        socialProfileId: socialProfiles[2].id,
      },
    }),
    // Jackson likes others' posts
    prisma.like.create({
      data: {
        postId: runPosts[0].id,
        socialProfileId: socialProfiles[4].id,
      },
    }),
    prisma.like.create({
      data: {
        postId: runPosts[1].id,
        socialProfileId: socialProfiles[4].id,
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
    prisma.runGroupMember.create({
      data: {
        groupId: runGroup.id,
        socialProfileId: socialProfiles[4].id,
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
- 👥 ${followRelationships.length} follow relationships created
- 💬 Extensive comments and likes

You can now log in with:
- john@example.com (Marathon enthusiast)
- sarah@example.com (Track specialist)
- mike@example.com (Boston qualifier hunter)
- emily@example.com (New to running)
- jackson@maratron.ai (Creator, Olympic Trials dreamer)
- alex@example.com (Ultra trail runner)
- lisa@example.com (Running newbie)
- david@example.com (College sprinter)
- rachel@example.com (Injury prevention focused)
- tom@example.com (Triathlete)
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