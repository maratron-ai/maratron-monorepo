import { PrismaClient, DistanceUnit, TrainingLevel, Gender, Device, TrainingEnvironment } from '@prisma/client';
import { hashPassword } from '../src/lib/utils/passwordUtils';
import { COACH_PERSONAS } from '../src/lib/data/coach-personas';

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
  await prisma.coachPersona.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Hash the default password for all development users
  const defaultPasswordHash = await hashPassword('password');
  console.log('🔒 Generated password hash for development users');

  // Create Coach Personas
  const coaches = await Promise.all(
    COACH_PERSONAS.map(coach => 
      prisma.coachPersona.create({
        data: coach
      })
    )
  );
  console.log('🧠 Created coach personas');

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Runner',
        email: 'john@example.com',
        passwordHash: defaultPasswordHash,
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
        selectedCoachId: coaches.find(c => c.name === 'Thunder McGrath')?.id, // Motivational coach for PR chasing
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Speedster',
        email: 'sarah@example.com',
        passwordHash: defaultPasswordHash,
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
        selectedCoachId: coaches.find(c => c.name === 'Tech Thompson')?.id, // Data-driven coach for track athlete
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mike Marathoner',
        email: 'mike@example.com',
        passwordHash: defaultPasswordHash,
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
        passwordHash: defaultPasswordHash,
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
        selectedCoachId: coaches.find(c => c.name === 'Buddy Johnson')?.id, // Encouraging coach for beginner marathoner
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jackson Thetford',
        email: 'jackson@maratron.ai',
        passwordHash: defaultPasswordHash,
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
        selectedCoachId: coaches.find(c => c.name === 'Rebel Chen')?.id, // Unconventional coach for elite goals
      },
    }),
    prisma.user.create({
      data: {
        name: 'Alex TrailRunner',
        email: 'alex@example.com',
        passwordHash: defaultPasswordHash,
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
        passwordHash: defaultPasswordHash,
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
        selectedCoachId: coaches.find(c => c.name === 'Zen Rodriguez')?.id, // Mindful coach for building sustainable habits
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Sprinter',
        email: 'david@example.com',
        passwordHash: defaultPasswordHash,
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
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rachel Recovery',
        email: 'rachel@example.com',
        passwordHash: defaultPasswordHash,
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
        selectedCoachId: coaches.find(c => c.name === 'Coach Williams')?.id, // Traditional coach for methodical injury prevention
      },
    }),
    prisma.user.create({
      data: {
        name: 'Tom Triathlete',
        email: 'tom@example.com',
        passwordHash: defaultPasswordHash,
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
    // Additional users for richer community
    prisma.user.create({
      data: {
        name: 'Maria Rodriguez',
        email: 'maria@example.com',
        passwordHash: defaultPasswordHash,
        age: 27,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 51,
        goals: ['Half Marathon PR', 'Sub-1:30 half'],
        yearsRunning: 4,
        weeklyMileage: 45,
        height: 162,
        weight: 52,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Thunder McGrath')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Robert Chen',
        email: 'robert@example.com',
        passwordHash: defaultPasswordHash,
        age: 45,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 42,
        goals: ['Weight loss', 'Fitness'],
        yearsRunning: 2,
        weeklyMileage: 25,
        height: 175,
        weight: 82,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.AppleWatch,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Zen Rodriguez')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jessica Williams',
        email: 'jessica@example.com',
        passwordHash: defaultPasswordHash,
        age: 29,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 56,
        goals: ['Boston Marathon', 'Sub-2:55 marathon'],
        yearsRunning: 8,
        weeklyMileage: 70,
        height: 170,
        weight: 58,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Coach Williams')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kevin Johnson',
        email: 'kevin@example.com',
        passwordHash: defaultPasswordHash,
        age: 38,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.beginner,
        VDOT: 35,
        goals: ['Complete first 5K', 'Build habit'],
        yearsRunning: 0.5,
        weeklyMileage: 15,
        height: 180,
        weight: 88,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTrainingEnvironment: TrainingEnvironment.treadmill,
        device: Device.AppleWatch,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Buddy Johnson')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Amanda Foster',
        email: 'amanda@example.com',
        passwordHash: defaultPasswordHash,
        age: 34,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 47,
        goals: ['10K PR', 'Run-walk intervals'],
        yearsRunning: 3,
        weeklyMileage: 30,
        height: 168,
        weight: 63,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Polar,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Marcus Thompson',
        email: 'marcus@example.com',
        passwordHash: defaultPasswordHash,
        age: 42,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 59,
        goals: ['Ultra marathon', '50K finish'],
        yearsRunning: 15,
        weeklyMileage: 85,
        height: 183,
        weight: 74,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Suunto,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Rebel Chen')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sophie Martinez',
        email: 'sophie@example.com',
        passwordHash: defaultPasswordHash,
        age: 26,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 49,
        goals: ['Marathon finish', 'Enjoy the journey'],
        yearsRunning: 3,
        weeklyMileage: 40,
        height: 165,
        weight: 55,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Daniel Kim',
        email: 'daniel@example.com',
        passwordHash: defaultPasswordHash,
        age: 31,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 46,
        goals: ['Half marathon', 'Consistency'],
        yearsRunning: 2,
        weeklyMileage: 35,
        height: 172,
        weight: 68,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Tech Thompson')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lauren Davis',
        email: 'lauren@example.com',
        passwordHash: defaultPasswordHash,
        age: 28,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 53,
        goals: ['Track racing', '1500m PR'],
        yearsRunning: 10,
        weeklyMileage: 60,
        height: 167,
        weight: 54,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Polar,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Brandon Lewis',
        email: 'brandon@example.com',
        passwordHash: defaultPasswordHash,
        age: 35,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 44,
        goals: ['Couch to 5K', 'Health improvement'],
        yearsRunning: 1,
        weeklyMileage: 20,
        height: 178,
        weight: 85,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTrainingEnvironment: TrainingEnvironment.treadmill,
        device: Device.AppleWatch,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Nina Patel',
        email: 'nina@example.com',
        passwordHash: defaultPasswordHash,
        age: 32,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 50,
        goals: ['Half marathon', 'Sub-1:35 half'],
        yearsRunning: 5,
        weeklyMileage: 42,
        height: 160,
        weight: 50,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Zen Rodriguez')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Tyler Anderson',
        email: 'tyler@example.com',
        passwordHash: defaultPasswordHash,
        age: 24,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 61,
        goals: ['800m PR', 'College championships'],
        yearsRunning: 8,
        weeklyMileage: 55,
        height: 179,
        weight: 65,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Polar,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Grace Wilson',
        email: 'grace@example.com',
        passwordHash: defaultPasswordHash,
        age: 41,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 45,
        goals: ['Marathon comeback', 'Sub-3:15 marathon'],
        yearsRunning: 12,
        weeklyMileage: 50,
        height: 173,
        weight: 62,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Coach Williams')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carlos Morales',
        email: 'carlos@example.com',
        passwordHash: defaultPasswordHash,
        age: 39,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 48,
        goals: ['Trail running', 'Mountain races'],
        yearsRunning: 6,
        weeklyMileage: 55,
        height: 176,
        weight: 71,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Suunto,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Olivia Taylor',
        email: 'olivia@example.com',
        passwordHash: defaultPasswordHash,
        age: 25,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.beginner,
        VDOT: 39,
        goals: ['First 10K', 'Build endurance'],
        yearsRunning: 1,
        weeklyMileage: 18,
        height: 164,
        weight: 59,
        preferredTrainingDays: ['Monday', 'Wednesday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.mixed,
        device: Device.AppleWatch,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Buddy Johnson')?.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'James Wilson',
        email: 'james@example.com',
        passwordHash: defaultPasswordHash,
        age: 33,
        gender: Gender.Male,
        trainingLevel: TrainingLevel.advanced,
        VDOT: 57,
        goals: ['Boston Marathon', 'Sub-2:50 marathon'],
        yearsRunning: 11,
        weeklyMileage: 75,
        height: 181,
        weight: 70,
        preferredTrainingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Sunday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Samantha Lee',
        email: 'samantha@example.com',
        passwordHash: defaultPasswordHash,
        age: 30,
        gender: Gender.Female,
        trainingLevel: TrainingLevel.intermediate,
        VDOT: 52,
        goals: ['Half marathon', 'Negative splits'],
        yearsRunning: 4,
        weeklyMileage: 40,
        height: 166,
        weight: 56,
        preferredTrainingDays: ['Tuesday', 'Thursday', 'Saturday'],
        preferredTrainingEnvironment: TrainingEnvironment.outdoor,
        device: Device.Garmin,
        defaultDistanceUnit: DistanceUnit.miles,
        selectedCoachId: coaches.find(c => c.name === 'Tech Thompson')?.id,
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
    
    // Maria's shoes
    prisma.shoe.create({
      data: {
        name: 'Saucony Kinvara 14',
        notes: 'Daily trainer with pep',
        currentDistance: 178.3,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[10].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Saucony Endorphin Speed 3',
        notes: 'Tempo and workout days',
        currentDistance: 95.2,
        maxDistance: 350,
        distanceUnit: DistanceUnit.miles,
        userId: users[10].id,
      },
    }),
    
    // Robert's shoes
    prisma.shoe.create({
      data: {
        name: 'New Balance Fresh Foam More v4',
        notes: 'Maximum cushioning for heavier runner',
        currentDistance: 89.4,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[11].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Brooks Beast 20',
        notes: 'Motion control for overpronation',
        currentDistance: 123.7,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[11].id,
      },
    }),
    
    // Jessica's shoes
    prisma.shoe.create({
      data: {
        name: 'Mizuno Wave Rider 26',
        notes: 'Smooth daily trainer',
        currentDistance: 267.8,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[12].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Nike Air Zoom Tempo NEXT%',
        notes: 'Tempo and threshold workouts',
        currentDistance: 134.5,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[12].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Adidas Adizero Adios Pro 3',
        notes: 'Marathon racing shoes',
        currentDistance: 52.4,
        maxDistance: 200,
        distanceUnit: DistanceUnit.miles,
        userId: users[12].id,
      },
    }),
    
    // Kevin's shoes
    prisma.shoe.create({
      data: {
        name: 'ASICS Gel-Contend 7',
        notes: 'Beginner-friendly with support',
        currentDistance: 34.2,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[13].id,
      },
    }),
    
    // Amanda's shoes
    prisma.shoe.create({
      data: {
        name: 'Hoka Bondi 8',
        notes: 'Maximum cushion for joint protection',
        currentDistance: 112.6,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[14].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Altra Torin 6',
        notes: 'Zero drop for natural running',
        currentDistance: 87.3,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[14].id,
      },
    }),
    
    // Marcus's shoes
    prisma.shoe.create({
      data: {
        name: 'Altra Lone Peak 7',
        notes: 'Ultra distance trail beast',
        currentDistance: 456.8,
        maxDistance: 600,
        distanceUnit: DistanceUnit.miles,
        userId: users[15].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'La Sportiva Ultraraptor II',
        notes: 'Technical mountain terrain',
        currentDistance: 298.4,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[15].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Hoka Clifton 9',
        notes: 'Road recovery runs',
        currentDistance: 189.7,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[15].id,
      },
    }),
    
    // Sophie's shoes
    prisma.shoe.create({
      data: {
        name: 'Allbirds Tree Runners',
        notes: 'Casual and comfortable',
        currentDistance: 67.4,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[16].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'On Cloud 5',
        notes: 'Light and responsive',
        currentDistance: 145.8,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[16].id,
      },
    }),
    
    // Daniel's shoes
    prisma.shoe.create({
      data: {
        name: 'Brooks Launch 9',
        notes: 'Responsive daily trainer',
        currentDistance: 156.3,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[17].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Nike ZoomX Invincible Run FK 3',
        notes: 'Maximum cushion for long runs',
        currentDistance: 234.7,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[17].id,
      },
    }),
    
    // Lauren's shoes
    prisma.shoe.create({
      data: {
        name: 'New Balance FuelCell Rebel v3',
        notes: 'Fast training and workouts',
        currentDistance: 89.2,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[18].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Nike Air Zoom Victory',
        notes: 'Track racing spikes',
        currentDistance: 15.6,
        maxDistance: 100,
        distanceUnit: DistanceUnit.miles,
        userId: users[18].id,
      },
    }),
    
    // Brandon's shoes
    prisma.shoe.create({
      data: {
        name: 'Sketchers GOrun Consistent',
        notes: 'Budget-friendly beginner shoe',
        currentDistance: 45.8,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[19].id,
      },
    }),
    
    // Nina's shoes
    prisma.shoe.create({
      data: {
        name: 'ASICS Gel-Cumulus 25',
        notes: 'Reliable daily trainer',
        currentDistance: 198.4,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[20].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Saucony Guide 16',
        notes: 'Light stability for overpronation',
        currentDistance: 167.9,
        maxDistance: 450,
        distanceUnit: DistanceUnit.miles,
        userId: users[20].id,
      },
    }),
    
    // Tyler's shoes
    prisma.shoe.create({
      data: {
        name: 'Nike Zoom Rival D 10',
        notes: 'Distance track spikes',
        currentDistance: 23.4,
        maxDistance: 150,
        distanceUnit: DistanceUnit.miles,
        userId: users[21].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Adidas Adizero Boston 12',
        notes: 'Training and racing',
        currentDistance: 134.6,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[21].id,
      },
    }),
    
    // Grace's shoes
    prisma.shoe.create({
      data: {
        name: 'Brooks Glycerin 20',
        notes: 'Plush cushioning for comeback',
        currentDistance: 178.2,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[22].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'ASICS Gel-Kayano 29',
        notes: 'Stability for injury prevention',
        currentDistance: 245.7,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[22].id,
      },
    }),
    
    // Carlos's shoes
    prisma.shoe.create({
      data: {
        name: 'Merrell Trail Glove 7',
        notes: 'Minimalist trail running',
        currentDistance: 167.3,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[23].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Inov-8 Mudclaw 300',
        notes: 'Aggressive grip for mud and rocks',
        currentDistance: 89.6,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[23].id,
      },
    }),
    
    // Olivia's shoes
    prisma.shoe.create({
      data: {
        name: 'Nike Revolution 6',
        notes: 'Affordable beginner option',
        currentDistance: 56.3,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[24].id,
      },
    }),
    
    // James's shoes
    prisma.shoe.create({
      data: {
        name: 'Saucony Endorphin Pro 3',
        notes: 'Carbon plate racing shoes',
        currentDistance: 78.4,
        maxDistance: 300,
        distanceUnit: DistanceUnit.miles,
        userId: users[25].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'New Balance Fresh Foam X 1080v12',
        notes: 'Daily trainer workhorse',
        currentDistance: 345.2,
        maxDistance: 500,
        distanceUnit: DistanceUnit.miles,
        userId: users[25].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Mizuno Wave Prophecy 12',
        notes: 'High-tech cushioning system',
        currentDistance: 167.8,
        maxDistance: 450,
        distanceUnit: DistanceUnit.miles,
        userId: users[25].id,
      },
    }),
    
    // Samantha's shoes
    prisma.shoe.create({
      data: {
        name: 'On Cloudswift',
        notes: 'Urban running specialist',
        currentDistance: 123.7,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[26].id,
      },
    }),
    prisma.shoe.create({
      data: {
        name: 'Hoka Mach 5',
        notes: 'Lightweight tempo shoe',
        currentDistance: 198.4,
        maxDistance: 400,
        distanceUnit: DistanceUnit.miles,
        userId: users[26].id,
      },
    }),
  ]);

  console.log('👟 Created shoes');

  // Set default shoes for all users
  const defaultShoeUpdates = [
    { userIndex: 0, shoeIndex: 0 },    // John -> Nike Air Zoom Pegasus 40
    { userIndex: 1, shoeIndex: 3 },    // Sarah -> Adidas Adizero Boston 12
    { userIndex: 2, shoeIndex: 6 },    // Mike -> ASICS Gel-Nimbus 25
    { userIndex: 3, shoeIndex: 9 },    // Emily -> Brooks Ghost 15
    { userIndex: 4, shoeIndex: 13 },   // Jackson -> Hoka Clifton 9
    { userIndex: 5, shoeIndex: 15 },   // Alex -> Altra Lone Peak 7
    { userIndex: 6, shoeIndex: 17 },   // Lisa -> ASICS Gel-Excite 9
    { userIndex: 7, shoeIndex: 21 },   // David -> Nike Free RN 5.0
    { userIndex: 8, shoeIndex: 22 },   // Rachel -> ASICS Gel-Kayano 29
    { userIndex: 9, shoeIndex: 24 },   // Tom -> On Cloudstratus
    { userIndex: 10, shoeIndex: 27 },  // Maria -> Saucony Kinvara 14
    { userIndex: 11, shoeIndex: 29 },  // Robert -> New Balance Fresh Foam More v4
    { userIndex: 12, shoeIndex: 31 },  // Jessica -> Mizuno Wave Rider 26
    { userIndex: 13, shoeIndex: 34 },  // Kevin -> ASICS Gel-Contend 7
    { userIndex: 14, shoeIndex: 35 },  // Amanda -> Hoka Bondi 8
    { userIndex: 15, shoeIndex: 37 },  // Marcus -> Altra Lone Peak 7
    { userIndex: 16, shoeIndex: 40 },  // Sophie -> Allbirds Tree Runners
    { userIndex: 17, shoeIndex: 42 },  // Daniel -> Brooks Launch 9
    { userIndex: 18, shoeIndex: 44 },  // Lauren -> New Balance FuelCell Rebel v3
    { userIndex: 19, shoeIndex: 46 },  // Brandon -> Sketchers GOrun Consistent
    { userIndex: 20, shoeIndex: 47 },  // Nina -> ASICS Gel-Cumulus 25
    { userIndex: 21, shoeIndex: 49 },  // Tyler -> Nike Zoom Rival D 10
    { userIndex: 22, shoeIndex: 51 },  // Grace -> Brooks Glycerin 20
    { userIndex: 23, shoeIndex: 53 },  // Carlos -> Merrell Trail Glove 7
    { userIndex: 24, shoeIndex: 55 },  // Olivia -> Nike Revolution 6
    { userIndex: 25, shoeIndex: 56 },  // James -> Saucony Endorphin Pro 3
    { userIndex: 26, shoeIndex: 59 },  // Samantha -> On Cloudswift
  ];

  await Promise.all(
    defaultShoeUpdates.map(({ userIndex, shoeIndex }) =>
      prisma.user.update({
        where: { id: users[userIndex].id },
        data: { defaultShoeId: shoes[shoeIndex].id },
      })
    )
  );

  // Create recent runs
  const runs = await Promise.all([
    // John's runs - Week 1
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
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
        date: new Date('2025-06-30'),
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
        date: new Date('2025-06-28'),
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
        date: new Date('2025-06-26'),
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
        date: new Date('2025-07-02'),
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
        date: new Date('2025-07-01'),
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
        date: new Date('2025-06-29'),
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
        date: new Date('2025-07-02'),
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
        date: new Date('2025-06-30'),
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
        date: new Date('2025-06-28'),
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
        date: new Date('2025-07-02'),
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
        date: new Date('2025-06-29'),
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
        date: new Date('2025-07-02'),
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
        date: new Date('2025-06-30'),
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
        date: new Date('2025-06-28'),
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
        date: new Date('2025-06-26'),
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
        date: new Date('2025-07-01'),
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
        date: new Date('2025-06-29'),
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
        date: new Date('2025-07-01'),
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
        date: new Date('2025-06-28'),
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
        date: new Date('2025-07-01'),
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
        date: new Date('2025-06-29'),
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
        date: new Date('2025-07-02'),
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
        date: new Date('2025-06-30'),
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
        date: new Date('2025-07-01'),
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
        date: new Date('2025-06-29'),
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

    // Maria's runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '38:45',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:27',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 180,
        elevationGainUnit: 'feet',
        notes: 'Half marathon pace felt smooth and controlled',
        userId: users[10].id,
        shoeId: shoes[28].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '56:30',
        distance: 8.5,
        distanceUnit: DistanceUnit.miles,
        pace: '6:38',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 250,
        elevationGainUnit: 'feet',
        notes: 'Building endurance for half marathon goal',
        userId: users[10].id,
        shoeId: shoes[27].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-27'),
        duration: '32:15',
        distance: 5.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:27',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Recovery run with some strides',
        userId: users[10].id,
        shoeId: shoes[27].id,
      },
    }),

    // Robert's runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '35:45',
        distance: 3.5,
        distanceUnit: DistanceUnit.miles,
        pace: '10:13',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Jog',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Slow and steady. Focused on form and breathing.',
        userId: users[11].id,
        shoeId: shoes[29].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-28'),
        duration: '28:30',
        distance: 2.8,
        distanceUnit: DistanceUnit.miles,
        pace: '10:11',
        paceUnit: DistanceUnit.miles,
        name: 'Weight Loss Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Early morning run before work. Making progress!',
        userId: users[11].id,
        shoeId: shoes[30].id,
      },
    }),

    // Jessica's runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '52:30',
        distance: 10.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:15',
        paceUnit: DistanceUnit.miles,
        name: 'Marathon Pace Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 320,
        elevationGainUnit: 'feet',
        notes: 'Dialed in marathon pace. Boston qualifying time is within reach!',
        userId: users[12].id,
        shoeId: shoes[31].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '36:15',
        distance: 8.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:32',
        paceUnit: DistanceUnit.miles,
        name: 'Threshold Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '5 miles at threshold effort. Felt strong throughout.',
        userId: users[12].id,
        shoeId: shoes[32].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-28'),
        duration: '68:45',
        distance: 14.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:55',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 420,
        elevationGainUnit: 'feet',
        notes: 'Progressive long run. Last 4 miles at marathon pace.',
        userId: users[12].id,
        shoeId: shoes[31].id,
      },
    }),

    // Kevin's runs  
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '22:30',
        distance: 2.0,
        distanceUnit: DistanceUnit.miles,
        pace: '11:15',
        paceUnit: DistanceUnit.miles,
        name: 'First 2-Mile Run!',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Did it! Two miles without stopping. Feeling amazing!',
        userId: users[13].id,
        shoeId: shoes[34].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-28'),
        duration: '18:45',
        distance: 1.5,
        distanceUnit: DistanceUnit.miles,
        pace: '12:30',
        paceUnit: DistanceUnit.miles,
        name: 'Walk-Run Intervals',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Building up slowly. Run 2 min, walk 1 min.',
        userId: users[13].id,
        shoeId: shoes[34].id,
      },
    }),

    // Amanda's runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '45:20',
        distance: 5.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:14',
        paceUnit: DistanceUnit.miles,
        name: 'Steady State Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 180,
        elevationGainUnit: 'feet',
        notes: 'Felt strong and controlled. 10K goal is getting closer!',
        userId: users[14].id,
        shoeId: shoes[35].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-29'),
        duration: '38:45',
        distance: 4.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:36',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Beautiful morning run. Zero drop shoes feeling natural.',
        userId: users[14].id,
        shoeId: shoes[36].id,
      },
    }),

    // Marcus's ultra runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '135:45',
        distance: 18.0,
        distanceUnit: DistanceUnit.miles,
        pace: '7:32',
        paceUnit: DistanceUnit.miles,
        name: 'Ultra Training Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 1850,
        elevationGainUnit: 'feet',
        notes: 'Epic mountain trail run. 50K training is going perfectly.',
        userId: users[15].id,
        shoeId: shoes[37].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-29'),
        duration: '95:30',
        distance: 12.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:38',
        paceUnit: DistanceUnit.miles,
        name: 'Technical Trail Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 1250,
        elevationGainUnit: 'feet',
        notes: 'Rocky technical terrain. Perfect preparation for ultra racing.',
        userId: users[15].id,
        shoeId: shoes[38].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-27'),
        duration: '75:20',
        distance: 15.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:01',
        paceUnit: DistanceUnit.miles,
        name: 'Road Recovery Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 150,
        elevationGainUnit: 'feet',
        notes: 'Easy road miles for recovery between trail efforts.',
        userId: users[15].id,
        shoeId: shoes[39].id,
      },
    }),

    // Sophie's runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '42:15',
        distance: 5.0,
        distanceUnit: DistanceUnit.miles,
        pace: '8:27',
        paceUnit: DistanceUnit.miles,
        name: 'Morning Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Beautiful sunrise run. Marathon goal feeling more real!',
        userId: users[16].id,
        shoeId: shoes[41].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '56:30',
        distance: 6.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:41',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run Build',
        trainingEnvironment: TrainingEnvironment.mixed,
        notes: 'Gradually building distance. Feeling strong and confident.',
        userId: users[16].id,
        shoeId: shoes[40].id,
      },
    }),

    // Daniel's runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '48:30',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '8:05',
        paceUnit: DistanceUnit.miles,
        name: 'Steady Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 200,
        elevationGainUnit: 'feet',
        notes: 'Half marathon training is progressing well. Data looks good!',
        userId: users[17].id,
        shoeId: shoes[42].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-28'),
        duration: '65:45',
        distance: 8.0,
        distanceUnit: DistanceUnit.miles,
        pace: '8:13',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 280,
        elevationGainUnit: 'feet',
        notes: 'Longest run yet! Maximum cushion shoes feeling perfect.',
        userId: users[17].id,
        shoeId: shoes[43].id,
      },
    }),

    // Lauren's track runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '32:15',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:22',
        paceUnit: DistanceUnit.miles,
        name: 'Track Workout',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '6x800m at 1500m pace. Felt fast and controlled.',
        userId: users[18].id,
        shoeId: shoes[45].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '38:45',
        distance: 7.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:32',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '4 miles at threshold pace. Speed is coming back nicely.',
        userId: users[18].id,
        shoeId: shoes[44].id,
      },
    }),

    // Brandon's beginner runs
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '28:30',
        distance: 2.5,
        distanceUnit: DistanceUnit.miles,
        pace: '11:24',
        paceUnit: DistanceUnit.miles,
        name: 'Couch to 5K Progress',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Week 4 of program. Running 3 minutes at a time now!',
        userId: users[19].id,
        shoeId: shoes[46].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-28'),
        duration: '25:45',
        distance: 2.0,
        distanceUnit: DistanceUnit.miles,
        pace: '12:52',
        paceUnit: DistanceUnit.miles,
        name: 'Walk-Run Mix',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Building endurance slowly. Every step is progress!',
        userId: users[19].id,
        shoeId: shoes[46].id,
      },
    }),

    // Nina's half marathon training
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '42:30',
        distance: 6.5,
        distanceUnit: DistanceUnit.miles,
        pace: '6:32',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 220,
        elevationGainUnit: 'feet',
        notes: 'Half marathon pace felt effortless. Sub-1:35 is definitely possible!',
        userId: users[20].id,
        shoeId: shoes[47].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '58:45',
        distance: 9.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:31',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 280,
        elevationGainUnit: 'feet',
        notes: 'Building endurance steadily. Stability shoes feeling perfect.',
        userId: users[20].id,
        shoeId: shoes[48].id,
      },
    }),

    // Tyler's middle distance training
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '28:15',
        distance: 5.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:39',
        paceUnit: DistanceUnit.miles,
        name: 'Track Intervals',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '5x600m at 800m pace. Feeling sharp for championship season.',
        userId: users[21].id,
        shoeId: shoes[49].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-29'),
        duration: '32:45',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:27',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '3 miles at threshold pace. Speed endurance building nicely.',
        userId: users[21].id,
        shoeId: shoes[50].id,
      },
    }),

    // Grace's marathon comeback
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '65:20',
        distance: 8.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:41',
        paceUnit: DistanceUnit.miles,
        name: 'Comeback Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 250,
        elevationGainUnit: 'feet',
        notes: 'Longest run since injury. Feeling strong and confident again!',
        userId: users[22].id,
        shoeId: shoes[51].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '42:15',
        distance: 5.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:40',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Building back slowly but surely. Marathon goal is realistic.',
        userId: users[22].id,
        shoeId: shoes[52].id,
      },
    }),

    // Carlos's trail adventures
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '85:30',
        distance: 10.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:08',
        paceUnit: DistanceUnit.miles,
        name: 'Mountain Trail Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 1450,
        elevationGainUnit: 'feet',
        notes: 'Epic mountain adventure! Aggressive grip shoes handled everything.',
        userId: users[23].id,
        shoeId: shoes[54].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-29'),
        duration: '68:15',
        distance: 9.0,
        distanceUnit: DistanceUnit.miles,
        pace: '7:35',
        paceUnit: DistanceUnit.miles,
        name: 'Technical Trail',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 980,
        elevationGainUnit: 'feet',
        notes: 'Minimalist shoes forcing perfect form on technical terrain.',
        userId: users[23].id,
        shoeId: shoes[53].id,
      },
    }),

    // Olivia's beginner journey
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '32:15',
        distance: 3.2,
        distanceUnit: DistanceUnit.miles,
        pace: '10:04',
        paceUnit: DistanceUnit.miles,
        name: 'First 5K!',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Did it! Completed my first 5K without stopping. So proud!',
        userId: users[24].id,
        shoeId: shoes[55].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-29'),
        duration: '28:45',
        distance: 2.8,
        distanceUnit: DistanceUnit.miles,
        pace: '10:16',
        paceUnit: DistanceUnit.miles,
        name: 'Building Endurance',
        trainingEnvironment: TrainingEnvironment.mixed,
        notes: 'Getting closer to 5K goal. Every run is getting easier!',
        userId: users[24].id,
        shoeId: shoes[55].id,
      },
    }),

    // James's Boston training
    prisma.run.create({
      data: {
        date: new Date('2025-07-02'),
        duration: '68:30',
        distance: 15.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:34',
        paceUnit: DistanceUnit.miles,
        name: 'Marathon Pace Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 420,
        elevationGainUnit: 'feet',
        notes: 'Perfect execution at goal marathon pace. Boston here I come!',
        userId: users[25].id,
        shoeId: shoes[57].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-30'),
        duration: '32:15',
        distance: 8.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:01',
        paceUnit: DistanceUnit.miles,
        name: 'Track Workout',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '4x1200m at 5K pace. Carbon plate shoes felt incredible.',
        userId: users[25].id,
        shoeId: shoes[56].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-28'),
        duration: '48:45',
        distance: 10.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:52',
        paceUnit: DistanceUnit.miles,
        name: 'Threshold Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 200,
        elevationGainUnit: 'feet',
        notes: '6 miles at threshold. High-tech cushioning felt amazing.',
        userId: users[25].id,
        shoeId: shoes[58].id,
      },
    }),

    // Samantha's half marathon training
    prisma.run.create({
      data: {
        date: new Date('2025-07-01'),
        duration: '42:30',
        distance: 6.5,
        distanceUnit: DistanceUnit.miles,
        pace: '6:32',
        paceUnit: DistanceUnit.miles,
        name: 'Negative Split Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 180,
        elevationGainUnit: 'feet',
        notes: 'Perfect negative split execution. Urban running shoes handled city terrain perfectly.',
        userId: users[26].id,
        shoeId: shoes[59].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-29'),
        duration: '38:15',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '6:22',
        paceUnit: DistanceUnit.miles,
        name: 'Tempo Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '4 miles at half marathon pace. Lightweight tempo shoes felt fast!',
        userId: users[26].id,
        shoeId: shoes[60].id,
      },
    }),

    // Additional runs for variety across different dates and users
    prisma.run.create({
      data: {
        date: new Date('2025-06-25'),
        duration: '45:30',
        distance: 6.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:00',
        paceUnit: DistanceUnit.miles,
        name: 'Easy Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 180,
        elevationGainUnit: 'feet',
        notes: 'Beautiful evening run to end the week',
        userId: users[0].id,
        shoeId: shoes[0].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-24'),
        duration: '28:15',
        distance: 8.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '3:31',
        paceUnit: DistanceUnit.kilometers,
        name: 'Recovery Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Easy shakeout between hard sessions',
        userId: users[1].id,
        shoeId: shoes[5].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-23'),
        duration: '85:20',
        distance: 16.0,
        distanceUnit: DistanceUnit.miles,
        pace: '5:20',
        paceUnit: DistanceUnit.miles,
        name: 'Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 450,
        elevationGainUnit: 'feet',
        notes: 'Peak mileage week. Feeling strong and ready.',
        userId: users[2].id,
        shoeId: shoes[8].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-22'),
        duration: '42:15',
        distance: 5.5,
        distanceUnit: DistanceUnit.miles,
        pace: '7:41',
        paceUnit: DistanceUnit.miles,
        name: 'Treadmill Run',
        trainingEnvironment: TrainingEnvironment.treadmill,
        notes: 'Rainy day indoor session. Still making progress!',
        userId: users[3].id,
        shoeId: shoes[10].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-21'),
        duration: '56:30',
        distance: 12.0,
        distanceUnit: DistanceUnit.miles,
        pace: '4:42',
        paceUnit: DistanceUnit.miles,
        name: 'Medium-Long Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 300,
        elevationGainUnit: 'feet',
        notes: 'Mid-week medium long run. Building aerobic base.',
        userId: users[4].id,
        shoeId: shoes[13].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-20'),
        duration: '125:45',
        distance: 15.5,
        distanceUnit: DistanceUnit.miles,
        pace: '8:06',
        paceUnit: DistanceUnit.miles,
        name: 'Epic Trail Adventure',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 2100,
        elevationGainUnit: 'feet',
        notes: 'Incredible mountain views. This is why I love trail running!',
        userId: users[5].id,
        shoeId: shoes[14].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-19'),
        duration: '25:30',
        distance: 2.5,
        distanceUnit: DistanceUnit.miles,
        pace: '10:12',
        paceUnit: DistanceUnit.miles,
        name: 'Consistency Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Small steps lead to big changes. Staying consistent!',
        userId: users[6].id,
        shoeId: shoes[18].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-18'),
        duration: '22:15',
        distance: 3.0,
        distanceUnit: DistanceUnit.miles,
        pace: '7:25',
        paceUnit: DistanceUnit.miles,
        name: 'Speed Endurance',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: '10x100m with full recovery. Building power.',
        userId: users[7].id,
        shoeId: shoes[20].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-17'),
        duration: '48:30',
        distance: 6.0,
        distanceUnit: DistanceUnit.miles,
        pace: '8:05',
        paceUnit: DistanceUnit.miles,
        name: 'Form Focus Run',
        trainingEnvironment: TrainingEnvironment.outdoor,
        elevationGain: 150,
        elevationGainUnit: 'feet',
        notes: 'Concentrated on cadence and posture. Prevention is key.',
        userId: users[8].id,
        shoeId: shoes[23].id,
      },
    }),
    prisma.run.create({
      data: {
        date: new Date('2025-06-16'),
        duration: '38:45',
        distance: 9.0,
        distanceUnit: DistanceUnit.kilometers,
        pace: '4:18',
        paceUnit: DistanceUnit.kilometers,
        name: 'Brick Run Session',
        trainingEnvironment: TrainingEnvironment.outdoor,
        notes: 'Post-swim transition practice. Ironman prep going well.',
        userId: users[9].id,
        shoeId: shoes[25].id,
      },
    }),
  ]);

  console.log('🏃 Created runs');

  // Create Social Profiles for all users
  const socialProfiles = await Promise.all([
    prisma.socialProfile.create({
      data: {
        userId: users[0].id,
        username: 'johnrunner',
        bio: 'Marathon enthusiast from Boston. Always chasing that next PR! 🏃‍♂️',
        profilePhoto: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[1].id,
        username: 'sarahspeed',
        bio: 'Track & field athlete | 5K specialist | Coach',
        profilePhoto: 'https://images.unsplash.com/photo-1594736797933-d0c51eacbcc5?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[2].id,
        username: 'mikemarathon',
        bio: 'Boston qualifier hunting sub-2:50. Trail runner on weekends.',
        profilePhoto: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[3].id,
        username: 'emilyendurance',
        bio: 'New to running but loving every mile! First marathon in training.',
        profilePhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[4].id,
        username: 'jacksonthetford',
        bio: 'Creator of Maratron 🏃‍♂️ | Sub-2:45 marathoner | Olympic Trials dreamer | Running data nerd',
        profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f95?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[5].id,
        username: 'alextrails',
        bio: 'Ultra runner | Mountain enthusiast | Chasing sunrises on the trails 🏔️',
        profilePhoto: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[6].id,
        username: 'lisapacer',
        bio: 'Running newbie on a journey! 🌟 Couch to 5K graduate working towards my first 10K',
        profilePhoto: 'https://images.unsplash.com/photo-1551836022-8b2858c9c69b?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[7].id,
        username: 'davidsprints',
        bio: 'College sprinter | 100m & 200m specialist | Speed is life ⚡',
        profilePhoto: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[8].id,
        username: 'rachelruns',
        bio: 'Running smart, staying healthy 💪 | Former injury warrior | Half marathon lover',
        profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[9].id,
        username: 'tomtriathlete',
        bio: 'Swim 🏊‍♂️ Bike 🚴‍♂️ Run 🏃‍♂️ | Ironman in training | Triple threat athlete',
        profilePhoto: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400&h=400&fit=crop&crop=face',
      },
    }),
    // New users social profiles
    prisma.socialProfile.create({
      data: {
        userId: users[10].id,
        username: 'mariaspeedy',
        bio: 'Half marathon specialist from San Diego 🌴 | Sub-1:30 dreamer | Saucony athlete',
        profilePhoto: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[11].id,
        username: 'robertfitness',
        bio: 'Weight loss journey through running 💪 | Down 30lbs and counting! | Never too late to start',
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[12].id,
        username: 'jessicaboston',
        bio: 'Boston Marathon bound! 🏃‍♀️ | Sub-2:55 goal | Coach & mentor | Running is life',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616c643b2aa?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[13].id,
        username: 'kevinbeginner',
        bio: 'Brand new to running! 🏃‍♂️ | Couch to 5K warrior | Every step is progress | Dad life + running',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[14].id,
        username: 'amandazerodrop',
        bio: 'Exploring natural running 🦶 | Zero drop advocate | 10K training | Mind-body connection',
        profilePhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[15].id,
        username: 'marcusultra',
        bio: 'Ultra distance specialist 🏔️ | 50K dreamer | Mountain trail explorer | Pain is temporary',
        profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[16].id,
        username: 'sophiemarathon',
        bio: 'First marathon journey 🌟 | Enjoying every mile | Running for joy not just goals | Coffee + miles',
        profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[17].id,
        username: 'danieldata',
        bio: 'Data-driven runner 📊 | Half marathon training | Tech professional | Analytics + athletics',
        profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[18].id,
        username: 'laurentrack',
        bio: 'Track & field speedster ⚡ | 1500m specialist | College athlete | Speed endurance queen',
        profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[19].id,
        username: 'brandonc25k',
        bio: 'Couch to 5K graduate! 🎉 | Health transformation journey | Proving it\'s never too late',
        profilePhoto: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[20].id,
        username: 'ninastable',
        bio: 'Half marathon enthusiast 🏃‍♀️ | Stability shoe advocate | Sub-1:35 goal | Consistent training',
        profilePhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[21].id,
        username: 'tyler800m',
        bio: 'College middle distance specialist 🏃‍♂️ | 800m & 1500m | Championship season prep | Speed is king',
        profilePhoto: 'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[22].id,
        username: 'gracecomeback',
        bio: 'Marathon comeback story 💪 | Post-injury warrior | Sub-3:15 goal | Patience & persistence',
        profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[23].id,
        username: 'carlosmountain',
        bio: 'Mountain trail explorer 🏔️ | Technical terrain specialist | Minimalist running advocate',
        profilePhoto: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[24].id,
        username: 'olivianewbie',
        bio: 'Running journey just beginning! 🌱 | First 5K completed | 10K next goal | Every mile matters',
        profilePhoto: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[25].id,
        username: 'jamesboston',
        bio: 'Boston Marathon qualifier! 🎯 | Sub-2:50 goal | Elite training mindset | Carbon plate convert',
        profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f95?w=400&h=400&fit=crop&crop=face',
      },
    }),
    prisma.socialProfile.create({
      data: {
        userId: users[26].id,
        username: 'samanthacity',
        bio: 'Urban running specialist 🏙️ | Half marathon PR chaser | Negative split master | City streets = playground',
        profilePhoto: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400&h=400&fit=crop&crop=face',
      },
    }),
  ]);

  console.log('📱 Created social profiles');

  // Create extensive follow relationships for vibrant community
  const followRelationships = [
    // John follows (marathon enthusiast)
    [0, 1], [0, 2], [0, 4], [0, 5], [0, 8], [0, 12], [0, 22], [0, 25],
    // Sarah follows (track specialist)
    [1, 0], [1, 2], [1, 4], [1, 7], [1, 9], [1, 18], [1, 21], [1, 26],
    // Mike follows (Boston qualifier)
    [2, 0], [2, 1], [2, 4], [2, 5], [2, 8], [2, 9], [2, 12], [2, 22], [2, 25],
    // Emily follows (marathon beginner)
    [3, 0], [3, 1], [3, 4], [3, 6], [3, 8], [3, 11], [3, 16], [3, 22], [3, 24],
    // Jackson follows everyone (creator)
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9],
    [4, 10], [4, 11], [4, 12], [4, 13], [4, 14], [4, 15], [4, 16], [4, 17], [4, 18],
    [4, 19], [4, 20], [4, 21], [4, 22], [4, 23], [4, 24], [4, 25], [4, 26],
    // Alex follows (ultra runner)
    [5, 0], [5, 2], [5, 4], [5, 8], [5, 9], [5, 15], [5, 23],
    // Lisa follows (beginner)
    [6, 0], [6, 3], [6, 4], [6, 8], [6, 11], [6, 13], [6, 14], [6, 19], [6, 24],
    // David follows (sprinter)
    [7, 1], [7, 4], [7, 9], [7, 18], [7, 21],
    // Rachel follows (injury prevention)
    [8, 0], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 14], [8, 20], [8, 22],
    // Tom follows (triathlete)
    [9, 1], [9, 2], [9, 4], [9, 5], [9, 7], [9, 17], [9, 20], [9, 26],
    // Maria follows (half marathon specialist)
    [10, 0], [10, 1], [10, 4], [10, 8], [10, 12], [10, 20], [10, 22], [10, 26],
    // Robert follows (weight loss)
    [11, 3], [11, 4], [11, 6], [11, 8], [11, 13], [11, 14], [11, 19], [11, 24],
    // Jessica follows (Boston bound)
    [12, 0], [12, 2], [12, 4], [12, 8], [12, 10], [12, 22], [12, 25], [12, 26],
    // Kevin follows (beginner)
    [13, 3], [13, 4], [13, 6], [13, 11], [13, 14], [13, 19], [13, 24],
    // Amanda follows (10K training)
    [14, 3], [14, 4], [14, 6], [14, 8], [14, 11], [14, 13], [14, 16], [14, 20], [14, 24],
    // Marcus follows (ultra specialist)
    [15, 4], [15, 5], [15, 8], [15, 17], [15, 23],
    // Sophie follows (marathon journey)
    [16, 0], [16, 3], [16, 4], [16, 8], [16, 11], [16, 12], [16, 14], [16, 22],
    // Daniel follows (data-driven)
    [17, 0], [17, 4], [17, 9], [17, 12], [17, 15], [17, 20], [17, 26],
    // Lauren follows (track speedster)
    [18, 1], [18, 4], [18, 7], [18, 12], [18, 21], [18, 25],
    // Brandon follows (C25K graduate)
    [19, 3], [19, 4], [19, 6], [19, 11], [19, 13], [19, 14], [19, 24],
    // Nina follows (half marathon)
    [20, 0], [20, 4], [20, 8], [20, 10], [20, 12], [20, 17], [20, 22], [20, 26],
    // Tyler follows (middle distance)
    [21, 1], [21, 4], [21, 7], [21, 18], [21, 25],
    // Grace follows (comeback)
    [22, 0], [22, 2], [22, 3], [22, 4], [22, 8], [22, 10], [22, 12], [22, 16], [22, 25],
    // Carlos follows (trail explorer)
    [23, 4], [23, 5], [23, 8], [23, 15], [23, 17],
    // Olivia follows (newbie)
    [24, 3], [24, 4], [24, 6], [24, 11], [24, 13], [24, 14], [24, 16], [24, 19],
    // James follows (Boston qualifier)
    [25, 0], [25, 2], [25, 4], [25, 12], [25, 18], [25, 21], [25, 22],
    // Samantha follows (urban runner)
    [26, 1], [26, 4], [26, 9], [26, 10], [26, 12], [26, 17], [26, 20],
    
    // Reverse follows (people follow back)
    [0, 10], [0, 12], [0, 22], [0, 25], // People follow John back
    [1, 10], [1, 18], [1, 21], [1, 26], // People follow Sarah back
    [2, 10], [2, 12], [2, 22], [2, 25], // People follow Mike back
    [3, 11], [3, 16], [3, 22], [3, 24], // People follow Emily back
    [5, 15], [5, 23], // People follow Alex back
    [6, 11], [6, 13], [6, 14], [6, 19], [6, 24], // People follow Lisa back
    [7, 18], [7, 21], // People follow David back
    [8, 14], [8, 20], [8, 22], // People follow Rachel back
    [9, 17], [9, 20], [9, 26], // People follow Tom back
    [10, 20], [10, 22], [10, 26], // People follow Maria back
    [11, 13], [11, 14], [11, 19], [11, 24], // People follow Robert back
    [12, 10], [12, 22], [12, 25], [12, 26], // People follow Jessica back
    [13, 11], [13, 14], [13, 19], [13, 24], // People follow Kevin back
    [14, 11], [14, 13], [14, 16], [14, 20], [14, 24], // People follow Amanda back
    [15, 17], [15, 23], // People follow Marcus back
    [16, 11], [16, 12], [16, 14], [16, 22], // People follow Sophie back
    [17, 15], [17, 20], [17, 26], // People follow Daniel back
    [18, 12], [18, 21], [18, 25], // People follow Lauren back
    [19, 11], [19, 13], [19, 14], [19, 24], // People follow Brandon back
    [20, 10], [20, 12], [20, 17], [20, 22], [20, 26], // People follow Nina back
    [21, 18], [21, 25], // People follow Tyler back
    [22, 10], [22, 12], [22, 16], [22, 25], // People follow Grace back
    [23, 15], [23, 17], // People follow Carlos back
    [24, 11], [24, 13], [24, 14], [24, 16], [24, 19], // People follow Olivia back
    [25, 12], [25, 18], [25, 21], [25, 22], // People follow James back
    [26, 10], [26, 12], [26, 17], [26, 20], // People follow Samantha back
  ];

  // Remove duplicates and self-follows
  const uniqueFollowRelationships = Array.from(
    new Set(
      followRelationships
        .filter(([followerId, followingId]) => followerId !== followingId)
        .map(([followerId, followingId]) => `${followerId}-${followingId}`)
    )
  ).map(rel => rel.split('-').map(Number));

  await Promise.all(
    uniqueFollowRelationships.map(([followerId, followingId]) =>
      prisma.follow.create({
        data: {
          followerId: socialProfiles[followerId].id,
          followingId: socialProfiles[followingId].id,
        },
      })
    )
  );

  console.log('👥 Created follow relationships');

  // Create extensive run posts from all users
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
    
    // Maria's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[10].id,
        distance: 6.0,
        time: '38:45',
        caption: 'Half marathon pace run feeling smooth! 🌴 San Diego weather is perfect for training. Sub-1:30 goal feels achievable! 🏃‍♀️',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[10].id,
        distance: 8.5,
        time: '56:30',
        caption: 'Long run complete! Building endurance week by week. Saucony shoes feeling perfect for these miles 👟',
      },
    }),
    
    // Robert's posts  
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[11].id,
        distance: 3.5,
        time: '35:45',
        caption: 'Another run in the books! 💪 Down 30lbs and feeling stronger every day. Proof that it\'s never too late to start! 🙌',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[11].id,
        distance: 2.8,
        time: '28:30',
        caption: 'Early morning run before work! ☀️ These maximum cushion shoes are game-changers for us heavier runners.',
      },
    }),
    
    // Jessica's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[12].id,
        distance: 10.0,
        time: '52:30',
        caption: 'Marathon pace run on point! 🎯 Boston qualifying time is within reach. Every mile matters! 🏃‍♀️💨',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[12].id,
        distance: 14.0,
        time: '68:45',
        caption: 'Progressive long run complete! Last 4 miles at marathon pace felt controlled. Training is clicking! ⚡',
      },
    }),
    
    // Kevin's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[13].id,
        distance: 2.0,
        time: '22:30',
        caption: 'MILESTONE! 🎉 First 2-mile run without stopping! Six months ago I was on the couch. Dreams do come true! 🏃‍♂️',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[13].id,
        distance: 1.5,
        time: '18:45',
        caption: 'Walk-run intervals building my base! 👶 Every step is progress. Dad life + running = finding balance.',
      },
    }),
    
    // Amanda's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[14].id,
        distance: 5.5,
        time: '45:20',
        caption: 'Zero drop shoes feeling natural! 🦶 10K goal getting closer with every run. Mind-body connection strengthening 🧘‍♀️',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[14].id,
        distance: 4.5,
        time: '38:45',
        caption: 'Beautiful morning exploring natural running form! Zero drop is teaching me so much about proper technique 🌟',
      },
    }),
    
    // Marcus's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[15].id,
        distance: 18.0,
        time: '135:45',
        caption: 'EPIC ultra training run! 🏔️ 18 miles with 1,850ft elevation gain. 50K race prep going perfectly! Pain is temporary 💪',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[15].id,
        distance: 12.5,
        time: '95:30',
        caption: 'Technical trail masterclass! Rocky terrain that demands respect. This is what ultra running is all about! ⛰️',
      },
    }),
    
    // Sophie's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[16].id,
        distance: 5.0,
        time: '42:15',
        caption: 'Marathon journey continues! ☕ Running for joy, not just goals. Every mile is a celebration! 🌟',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[16].id,
        distance: 6.5,
        time: '56:30',
        caption: 'Longest run yet! Building distance gradually and loving the process. Marathon goal feeling real! 🏃‍♀️',
      },
    }),
    
    // Daniel's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[17].id,
        distance: 6.0,
        time: '48:30',
        caption: 'Data looks good! 📊 Half marathon training progressing perfectly. Tech meets athletics! 💻🏃‍♂️',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[17].id,
        distance: 8.0,
        time: '65:45',
        caption: 'Maximum cushion shoes + data analysis = perfect long run! Numbers don\'t lie - fitness is building! 📈',
      },
    }),
    
    // Lauren's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[18].id,
        distance: 6.0,
        time: '32:15',
        caption: 'Track workout complete! ⚡ 6x800m at 1500m pace. College season prep going perfectly! Speed endurance 👑',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[18].id,
        distance: 7.0,
        time: '38:45',
        caption: 'Tempo run feeling controlled! 🎯 4 miles at threshold pace. 1500m PR incoming this season! 🏆',
      },
    }),
    
    // Brandon's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[19].id,
        distance: 2.5,
        time: '28:30',
        caption: 'Couch to 5K Week 4 progress! 🎉 Running 3 minutes at a time now. Health transformation in action! 💪',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[19].id,
        distance: 2.0,
        time: '25:45',
        caption: 'Every step counts! Building endurance slowly but surely. Proving it\'s never too late to start! 🌟',
      },
    }),
    
    // Nina's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[20].id,
        distance: 6.5,
        time: '42:30',
        caption: 'Half marathon pace effortless! 🏃‍♀️ Sub-1:35 goal definitely achievable. Stability shoes feeling perfect! 👟',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[20].id,
        distance: 9.0,
        time: '58:45',
        caption: 'Long run building endurance! Consistent training paying off. Half marathon PR incoming! 🎯',
      },
    }),
    
    // Tyler's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[21].id,
        distance: 5.0,
        time: '28:15',
        caption: 'Track intervals sharp! ⚡ 5x600m at 800m pace. Championship season prep locked in! 🏆',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[21].id,
        distance: 6.0,
        time: '32:45',
        caption: 'Tempo run building speed endurance! College middle distance training dialed in! 🎯',
      },
    }),
    
    // Grace's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[22].id,
        distance: 8.5,
        time: '65:20',
        caption: 'Comeback long run complete! 💪 Longest run since injury. Marathon goal realistic again! Patience + persistence 🌟',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[22].id,
        distance: 5.5,
        time: '42:15',
        caption: 'Building back slowly but surely! Post-injury warrior mindset. Sub-3:15 marathon here I come! 🎯',
      },
    }),
    
    // Carlos's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[23].id,
        distance: 10.5,
        time: '85:30',
        caption: 'Mountain trail adventure! 🏔️ 1,450ft elevation gain. Minimalist shoes + technical terrain = pure joy! ⛰️',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[23].id,
        distance: 9.0,
        time: '68:15',
        caption: 'Technical trail mastery! Perfect form forced by minimalist shoes. Mountain racing prep on point! 🥾',
      },
    }),
    
    // Olivia's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[24].id,
        distance: 3.2,
        time: '32:15',
        caption: 'FIRST 5K COMPLETE! 🎉 Without stopping! Running journey just beginning. 10K next goal! Every mile matters 🌱',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[24].id,
        distance: 2.8,
        time: '28:45',
        caption: 'Building endurance step by step! Getting closer to 5K goal. Every run is getting easier! 💪',
      },
    }),
    
    // James's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[25].id,
        distance: 15.0,
        time: '68:30',
        caption: 'Marathon pace DIALED! 🎯 15 miles at goal pace feeling controlled. Boston qualifier incoming! Carbon plate magic ⚡',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[25].id,
        distance: 8.0,
        time: '32:15',
        caption: 'Track workout perfection! 4x1200m at 5K pace. Elite training mindset locked in! 🏆',
      },
    }),
    
    // Samantha's posts
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[26].id,
        distance: 6.5,
        time: '42:30',
        caption: 'Negative split mastery! 🏙️ Urban running specialist at work. City streets = playground! Half marathon PR loading 📈',
      },
    }),
    prisma.runPost.create({
      data: {
        socialProfileId: socialProfiles[26].id,
        distance: 6.0,
        time: '38:15',
        caption: 'Tempo run through the city! Lightweight shoes feeling fast. Half marathon pace locked in! ⚡',
      },
    }),
  ]);

  console.log('📝 Created run posts');

  // Create extensive comments from all users
  await Promise.all([
    // Comments on John's posts
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
        postId: runPosts[0].id,
        socialProfileId: socialProfiles[12].id,
        text: 'Boston training looking solid! Marathon pace feels within reach 💪',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[1].id,
        socialProfileId: socialProfiles[2].id,
        text: 'Long run progression is key! You\'re nailing the marathon buildup 🎯',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[1].id,
        socialProfileId: socialProfiles[25].id,
        text: 'That\'s a solid base building run! Boston here we come! 🏃‍♂️',
      },
    }),
    
    // Comments on Sarah's posts
    prisma.comment.create({
      data: {
        postId: runPosts[2].id,
        socialProfileId: socialProfiles[0].id,
        text: 'Those intervals sound brutal! Nice work on the track 💪',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[2].id,
        socialProfileId: socialProfiles[18].id,
        text: 'Track queen! 800m intervals are my favorite too. Speed is life! ⚡',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[3].id,
        socialProfileId: socialProfiles[21].id,
        text: 'Tempo runs build that speed endurance! College season prep looking good 🏆',
      },
    }),
    
    // Comments on Mike's posts
    prisma.comment.create({
      data: {
        postId: runPosts[4].id,
        socialProfileId: socialProfiles[1].id,
        text: 'You got this! BQ is definitely within reach with that training 🏆',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[4].id,
        socialProfileId: socialProfiles[12].id,
        text: 'Marathon pace progression is the secret sauce! Boston bound! 🎯',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[5].id,
        socialProfileId: socialProfiles[22].id,
        text: 'Threshold work pays dividends! Your training looks dialed in 💪',
      },
    }),
    
    // Comments on Emily's posts
    prisma.comment.create({
      data: {
        postId: runPosts[6].id,
        socialProfileId: socialProfiles[3].id,
        text: 'Treadmill runs count just as much! Weather won\'t stop us 🌟',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[6].id,
        socialProfileId: socialProfiles[16].id,
        text: 'Marathon training sister! Every mile is building towards something amazing 🏃‍♀️',
      },
    }),
    
    // Comments on Jackson's posts
    prisma.comment.create({
      data: {
        postId: runPosts[7].id,
        socialProfileId: socialProfiles[0].id,
        text: 'Olympic Trials pace! 😲 Absolutely crushing it Jackson!',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[7].id,
        socialProfileId: socialProfiles[25].id,
        text: 'That marathon pace is insane! Olympic Trials standard right there ⚡',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[8].id,
        socialProfileId: socialProfiles[2].id,
        text: 'Haha love the coding reference! Those track splits are insane 🔥',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[8].id,
        socialProfileId: socialProfiles[17].id,
        text: 'Tech meets athletics! Data debugging during recovery is genius 💻',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[9].id,
        socialProfileId: socialProfiles[1].id,
        text: 'Threshold pace looking dialed! Sub-2:45 is definitely happening 🚀',
      },
    }),
    
    // Comments on Alex's posts
    prisma.comment.create({
      data: {
        postId: runPosts[10].id,
        socialProfileId: socialProfiles[15].id,
        text: 'Trail running paradise! That elevation gain is serious business 🏔️',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[10].id,
        socialProfileId: socialProfiles[23].id,
        text: 'Mountain trails are calling! Technical terrain builds character ⛰️',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[11].id,
        socialProfileId: socialProfiles[5].id,
        text: 'Rocky single track is the ultimate test! Love the challenge 💪',
      },
    }),
    
    // Comments on beginner posts
    prisma.comment.create({
      data: {
        postId: runPosts[12].id,
        socialProfileId: socialProfiles[4].id,
        text: 'Incredible progress Lisa! From 30 seconds to 3 miles is amazing! 🌟',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[12].id,
        socialProfileId: socialProfiles[13].id,
        text: 'You\'re inspiring all of us beginners! Dreams really do come true 🎉',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[12].id,
        socialProfileId: socialProfiles[24].id,
        text: 'Yes! Fellow newbie crushing goals! You\'re proving anything is possible 💪',
      },
    }),
    
    // Comments on sprint training
    prisma.comment.create({
      data: {
        postId: runPosts[13].id,
        socialProfileId: socialProfiles[21].id,
        text: 'Sprint power! 100m repeats build that explosive speed ⚡',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[13].id,
        socialProfileId: socialProfiles[18].id,
        text: 'Speed kills indeed! Personal bests in training are so motivating 🔥',
      },
    }),
    
    // Comments on injury prevention
    prisma.comment.create({
      data: {
        postId: runPosts[14].id,
        socialProfileId: socialProfiles[8].id,
        text: 'Smart running is the best running! Form focus pays off long term 🧠',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[14].id,
        socialProfileId: socialProfiles[14].id,
        text: 'Injury prevention is so important! Mind-body connection is everything 🧘‍♀️',
      },
    }),
    
    // Comments on triathlon training
    prisma.comment.create({
      data: {
        postId: runPosts[15].id,
        socialProfileId: socialProfiles[17].id,
        text: 'Brick runs are brutal! Ironman training is next level commitment 💯',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[15].id,
        socialProfileId: socialProfiles[9].id,
        text: 'Heavy legs after biking are the worst! But you pushed through like a champ 🚴‍♂️➡️🏃‍♂️',
      },
    }),
    
    // Comments on Maria's posts
    prisma.comment.create({
      data: {
        postId: runPosts[16].id,
        socialProfileId: socialProfiles[20].id,
        text: 'Half marathon pace sisters! Sub-1:30 is totally achievable 🌴',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[16].id,
        socialProfileId: socialProfiles[26].id,
        text: 'San Diego weather is perfect for training! Jealous of that climate 🏃‍♀️',
      },
    }),
    
    // Comments on weight loss journey
    prisma.comment.create({
      data: {
        postId: runPosts[18].id,
        socialProfileId: socialProfiles[11].id,
        text: 'Down 30lbs is incredible! You\'re proving it\'s never too late 🙌',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[18].id,
        socialProfileId: socialProfiles[13].id,
        text: 'Weight loss inspiration! We beginners need to stick together 💪',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[18].id,
        socialProfileId: socialProfiles[19].id,
        text: 'Fellow transformation warrior! Maximum cushion shoes are life-savers ☀️',
      },
    }),
    
    // Comments on Boston qualifying attempts
    prisma.comment.create({
      data: {
        postId: runPosts[20].id,
        socialProfileId: socialProfiles[0].id,
        text: 'Boston qualifying pace! That sub-2:55 goal is within reach 🎯',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[20].id,
        socialProfileId: socialProfiles[25].id,
        text: 'Marathon pace dialed in! Boston bound for sure 🏃‍♀️💨',
      },
    }),
    
    // Comments on first milestones
    prisma.comment.create({
      data: {
        postId: runPosts[22].id,
        socialProfileId: socialProfiles[6].id,
        text: 'FIRST 2 MILES! That\'s a huge milestone! So proud of your progress 🎉',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[22].id,
        socialProfileId: socialProfiles[19].id,
        text: 'Couch to 2 miles! You\'re inspiring all of us beginners 🏃‍♂️',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[22].id,
        socialProfileId: socialProfiles[24].id,
        text: 'From couch to 2 miles is amazing! Dad life balance is real 👶',
      },
    }),
    
    // Comments on ultra training
    prisma.comment.create({
      data: {
        postId: runPosts[26].id,
        socialProfileId: socialProfiles[5].id,
        text: 'EPIC ultra run! 18 miles with that elevation is beast mode 🏔️',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[26].id,
        socialProfileId: socialProfiles[23].id,
        text: '50K prep looking solid! Ultra distance requires mental toughness 💪',
      },
    }),
    
    // Comments on track specialists
    prisma.comment.create({
      data: {
        postId: runPosts[30].id,
        socialProfileId: socialProfiles[1].id,
        text: 'Track workout perfection! 800m at 1500m pace builds speed endurance ⚡',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[30].id,
        socialProfileId: socialProfiles[7].id,
        text: 'College track training is intense! Speed endurance queen indeed 👑',
      },
    }),
    
    // Comments on comeback stories
    prisma.comment.create({
      data: {
        postId: runPosts[36].id,
        socialProfileId: socialProfiles[8].id,
        text: 'Comeback runs hit different! Post-injury strength is real 💪',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[36].id,
        socialProfileId: socialProfiles[14].id,
        text: 'Patience and persistence pays off! Marathon goal is realistic 🌟',
      },
    }),
    
    // Comments on first 5K completion
    prisma.comment.create({
      data: {
        postId: runPosts[40].id,
        socialProfileId: socialProfiles[6].id,
        text: 'FIRST 5K COMPLETE! You did it! So proud of your journey 🎉',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[40].id,
        socialProfileId: socialProfiles[13].id,
        text: 'Fellow beginner crushing goals! 10K next is totally doable 🌱',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[40].id,
        socialProfileId: socialProfiles[19].id,
        text: 'From zero to 5K! You\'re proving every mile matters 💪',
      },
    }),
    
    // Comments on elite training
    prisma.comment.create({
      data: {
        postId: runPosts[42].id,
        socialProfileId: socialProfiles[4].id,
        text: 'Marathon pace DIALED! Carbon plate technology is incredible ⚡',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[42].id,
        socialProfileId: socialProfiles[12].id,
        text: 'Boston qualifier pace! Elite training mindset is everything 🎯',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[43].id,
        socialProfileId: socialProfiles[18].id,
        text: 'Track workout perfection! 1200m repeats build that speed base 🏆',
      },
    }),
    
    // Comments on urban running
    prisma.comment.create({
      data: {
        postId: runPosts[44].id,
        socialProfileId: socialProfiles[17].id,
        text: 'Negative split mastery! City streets as playground is the mindset 🏙️',
      },
    }),
    prisma.comment.create({
      data: {
        postId: runPosts[44].id,
        socialProfileId: socialProfiles[10].id,
        text: 'Urban running specialist! Half marathon PR loading indeed 📈',
      },
    }),
  ]);

  console.log('💬 Created comments');

  // Create extensive likes across all posts
  const likeData = [];
  
  // Generate likes for each post from various users
  for (let postIndex = 0; postIndex < runPosts.length; postIndex++) {
    const post = runPosts[postIndex];
    
    // Each post gets 3-8 likes from different users
    const numLikes = Math.floor(Math.random() * 6) + 3;
    const likers = new Set();
    
    // Add likes from followers and related users
    for (let i = 0; i < numLikes; i++) {
      let likerIndex;
      do {
        likerIndex = Math.floor(Math.random() * socialProfiles.length);
      } while (likers.has(likerIndex));
      
      likers.add(likerIndex);
      likeData.push({
        postId: post.id,
        socialProfileId: socialProfiles[likerIndex].id,
      });
    }
  }
  
  await Promise.all(
    likeData.map(likeItem =>
      prisma.like.create({
        data: likeItem,
      })
    )
  );

  console.log('❤️ Created likes');

  // Create multiple run groups for different training focuses
  const runGroups = await Promise.all([
    // Boston Marathon Training Group
    prisma.runGroup.create({
      data: {
        name: 'Boston Marathon Training Group',
        description: 'A group for runners training for the Boston Marathon. Share your progress, get support, and stay motivated!',
        private: false,
        ownerId: socialProfiles[2].id, // Mike
      },
    }),
    
    // Track & Field Speed Club
    prisma.runGroup.create({
      data: {
        name: 'Track & Field Speed Club',
        description: 'For serious track athletes and speed work enthusiasts. Intervals, tempo runs, and race tactics!',
        private: false,
        ownerId: socialProfiles[1].id, // Sarah
      },
    }),
    
    // Trail Running Adventures
    prisma.runGroup.create({
      data: {
        name: 'Trail Running Adventures',
        description: 'Mountain trails, technical terrain, and ultra distance training. For those who love the wilderness!',
        private: false,
        ownerId: socialProfiles[5].id, // Alex
      },
    }),
    
    // Beginner Runner Support
    prisma.runGroup.create({
      data: {
        name: 'Beginner Runner Support',
        description: 'Welcome new runners! From Couch to 5K and beyond. Every step counts, no judgment zone!',
        private: false,
        ownerId: socialProfiles[6].id, // Lisa
      },
    }),
    
    // Half Marathon Heroes
    prisma.runGroup.create({
      data: {
        name: 'Half Marathon Heroes',
        description: 'Training for 13.1 miles! Share workouts, race plans, and PR celebrations.',
        private: false,
        ownerId: socialProfiles[10].id, // Maria
      },
    }),
    
    // Elite Training Squad
    prisma.runGroup.create({
      data: {
        name: 'Elite Training Squad',
        description: 'For sub-elite and competitive runners. High mileage, speed work, and race strategy.',
        private: true, // Exclusive group
        ownerId: socialProfiles[4].id, // Jackson
      },
    }),
    
    // Weight Loss Warriors
    prisma.runGroup.create({
      data: {
        name: 'Weight Loss Warriors',
        description: 'Using running for health and weight loss. Support, motivation, and celebrating victories!',
        private: false,
        ownerId: socialProfiles[11].id, // Robert
      },
    }),
    
    // Urban Runners
    prisma.runGroup.create({
      data: {
        name: 'Urban Runners',
        description: 'City street specialists! Navigation, safety tips, and finding the best routes in the concrete jungle.',
        private: false,
        ownerId: socialProfiles[26].id, // Samantha
      },
    }),
  ]);

  // Add members to Boston Marathon Training Group
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[2].id, // Owner: Mike
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[0].id, // John
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[3].id, // Emily
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[4].id, // Jackson
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[12].id, // Jessica
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[22].id, // Grace
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[0].id,
        socialProfileId: socialProfiles[25].id, // James
      },
    }),
  ]);

  // Add members to Track & Field Speed Club
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[1].id,
        socialProfileId: socialProfiles[1].id, // Owner: Sarah
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[1].id,
        socialProfileId: socialProfiles[7].id, // David
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[1].id,
        socialProfileId: socialProfiles[18].id, // Lauren
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[1].id,
        socialProfileId: socialProfiles[21].id, // Tyler
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[1].id,
        socialProfileId: socialProfiles[4].id, // Jackson
      },
    }),
  ]);

  // Add members to Trail Running Adventures
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[2].id,
        socialProfileId: socialProfiles[5].id, // Owner: Alex
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[2].id,
        socialProfileId: socialProfiles[15].id, // Marcus
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[2].id,
        socialProfileId: socialProfiles[23].id, // Carlos
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[2].id,
        socialProfileId: socialProfiles[4].id, // Jackson
      },
    }),
  ]);

  // Add members to Beginner Runner Support
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[3].id,
        socialProfileId: socialProfiles[6].id, // Owner: Lisa
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[3].id,
        socialProfileId: socialProfiles[11].id, // Robert
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[3].id,
        socialProfileId: socialProfiles[13].id, // Kevin
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[3].id,
        socialProfileId: socialProfiles[19].id, // Brandon
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[3].id,
        socialProfileId: socialProfiles[24].id, // Olivia
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[3].id,
        socialProfileId: socialProfiles[3].id, // Emily (helping beginners)
      },
    }),
  ]);

  // Add members to Half Marathon Heroes
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[4].id,
        socialProfileId: socialProfiles[10].id, // Owner: Maria
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[4].id,
        socialProfileId: socialProfiles[8].id, // Rachel
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[4].id,
        socialProfileId: socialProfiles[14].id, // Amanda
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[4].id,
        socialProfileId: socialProfiles[17].id, // Daniel
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[4].id,
        socialProfileId: socialProfiles[20].id, // Nina
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[4].id,
        socialProfileId: socialProfiles[26].id, // Samantha
      },
    }),
  ]);

  // Add members to Elite Training Squad (exclusive)
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[5].id,
        socialProfileId: socialProfiles[4].id, // Owner: Jackson
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[5].id,
        socialProfileId: socialProfiles[1].id, // Sarah
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[5].id,
        socialProfileId: socialProfiles[12].id, // Jessica
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[5].id,
        socialProfileId: socialProfiles[25].id, // James
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[5].id,
        socialProfileId: socialProfiles[15].id, // Marcus
      },
    }),
  ]);

  // Add members to Weight Loss Warriors
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[6].id,
        socialProfileId: socialProfiles[11].id, // Owner: Robert
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[6].id,
        socialProfileId: socialProfiles[13].id, // Kevin
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[6].id,
        socialProfileId: socialProfiles[19].id, // Brandon
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[6].id,
        socialProfileId: socialProfiles[6].id, // Lisa
      },
    }),
  ]);

  // Add members to Urban Runners
  await Promise.all([
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[7].id,
        socialProfileId: socialProfiles[26].id, // Owner: Samantha
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[7].id,
        socialProfileId: socialProfiles[17].id, // Daniel
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[7].id,
        socialProfileId: socialProfiles[9].id, // Tom
      },
    }),
    prisma.runGroupMember.create({
      data: {
        groupId: runGroups[7].id,
        socialProfileId: socialProfiles[4].id, // Jackson
      },
    }),
  ]);

  console.log('🏃‍♂️ Created run group and members');

  // Create diverse training plans for different users and goals
  await Promise.all([
    // John's Marathon Training Plan
    prisma.runningPlan.create({
      data: {
        userId: users[0].id,
        name: 'Marathon Training Plan - 16 Weeks',
        weeks: 16,
        active: true,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-07-19'),
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
            // Additional weeks would be here...
          ],
        },
      },
    }),
    
    // Sarah's Track Season Plan
    prisma.runningPlan.create({
      data: {
        userId: users[1].id,
        name: 'Track 5K Training - 12 Weeks',
        weeks: 12,
        active: true,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-05-24'),
        planData: {
          goal: 'Sub-17:00 5K',
          targetRace: 'Conference Championships',
          peakWeeklyMileage: 55,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 40,
              runs: [
                { day: 'Monday', type: 'Easy', distance: 6, pace: '3:45' },
                { day: 'Tuesday', type: 'Intervals', distance: 8, pace: '3:10' },
                { day: 'Wednesday', type: 'Easy', distance: 5, pace: '3:50' },
                { day: 'Thursday', type: 'Tempo', distance: 7, pace: '3:25' },
                { day: 'Friday', type: 'Easy', distance: 4, pace: '3:55' },
                { day: 'Saturday', type: 'Rest' },
                { day: 'Sunday', type: 'Long', distance: 10, pace: '3:40' },
              ],
            },
          ],
        },
      },
    }),
    
    // Jessica's Boston Qualifier Plan
    prisma.runningPlan.create({
      data: {
        userId: users[12].id,
        name: 'Boston Qualifier - 18 Weeks',
        weeks: 18,
        active: true,
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-07-12'),
        planData: {
          goal: 'Sub-2:55 Marathon (BQ)',
          targetRace: 'Boston Marathon Qualifier',
          peakWeeklyMileage: 75,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 45,
              runs: [
                { day: 'Monday', type: 'Easy', distance: 6, pace: '6:30' },
                { day: 'Tuesday', type: 'Tempo', distance: 8, pace: '5:45' },
                { day: 'Wednesday', type: 'Easy', distance: 5, pace: '6:30' },
                { day: 'Thursday', type: 'Intervals', distance: 7, pace: '5:15' },
                { day: 'Friday', type: 'Easy', distance: 4, pace: '6:45' },
                { day: 'Saturday', type: 'Rest' },
                { day: 'Sunday', type: 'Long', distance: 15, pace: '6:00' },
              ],
            },
          ],
        },
      },
    }),
    
    // Lisa's Couch to 5K Plan
    prisma.runningPlan.create({
      data: {
        userId: users[6].id,
        name: 'Couch to 5K - 9 Weeks',
        weeks: 9,
        active: true,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-07-03'),
        planData: {
          goal: 'Complete First 5K',
          targetRace: 'Local 5K Fun Run',
          peakWeeklyMileage: 15,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 6,
              runs: [
                { day: 'Monday', type: 'Walk-Run', distance: 2, pace: '12:00' },
                { day: 'Tuesday', type: 'Rest' },
                { day: 'Wednesday', type: 'Walk-Run', distance: 2, pace: '12:00' },
                { day: 'Thursday', type: 'Rest' },
                { day: 'Friday', type: 'Walk-Run', distance: 2, pace: '12:00' },
                { day: 'Saturday', type: 'Rest' },
                { day: 'Sunday', type: 'Rest' },
              ],
            },
          ],
        },
      },
    }),
    
    // Marcus's Ultra Training Plan
    prisma.runningPlan.create({
      data: {
        userId: users[15].id,
        name: '50K Ultra Training - 20 Weeks',
        weeks: 20,
        active: true,
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-07-05'),
        planData: {
          goal: 'Complete First 50K',
          targetRace: 'Mountain Ultra 50K',
          peakWeeklyMileage: 95,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 55,
              runs: [
                { day: 'Monday', type: 'Easy', distance: 8, pace: '8:00' },
                { day: 'Tuesday', type: 'Hill Repeats', distance: 6, pace: '7:30' },
                { day: 'Wednesday', type: 'Easy', distance: 6, pace: '8:15' },
                { day: 'Thursday', type: 'Tempo', distance: 8, pace: '7:15' },
                { day: 'Friday', type: 'Easy', distance: 5, pace: '8:30' },
                { day: 'Saturday', type: 'Long Trail', distance: 18, pace: '8:45' },
                { day: 'Sunday', type: 'Recovery', distance: 4, pace: '9:00' },
              ],
            },
          ],
        },
      },
    }),
    
    // Maria's Half Marathon Plan
    prisma.runningPlan.create({
      data: {
        userId: users[10].id,
        name: 'Half Marathon PR - 12 Weeks',
        weeks: 12,
        active: true,
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-07-08'),
        planData: {
          goal: 'Sub-1:30 Half Marathon',
          targetRace: 'San Diego Half Marathon',
          peakWeeklyMileage: 50,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 30,
              runs: [
                { day: 'Monday', type: 'Easy', distance: 5, pace: '7:15' },
                { day: 'Tuesday', type: 'Tempo', distance: 6, pace: '6:30' },
                { day: 'Wednesday', type: 'Easy', distance: 4, pace: '7:30' },
                { day: 'Thursday', type: 'Intervals', distance: 5, pace: '6:00' },
                { day: 'Friday', type: 'Rest' },
                { day: 'Saturday', type: 'Easy', distance: 3, pace: '7:45' },
                { day: 'Sunday', type: 'Long', distance: 10, pace: '6:45' },
              ],
            },
          ],
        },
      },
    }),
    
    // Kevin's Beginner Plan
    prisma.runningPlan.create({
      data: {
        userId: users[13].id,
        name: 'Beginner Running Build - 8 Weeks',
        weeks: 8,
        active: true,
        startDate: new Date('2025-05-15'),
        endDate: new Date('2025-07-10'),
        planData: {
          goal: 'Run 3 Miles Continuously',
          targetRace: 'Personal Goal',
          peakWeeklyMileage: 12,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 6,
              runs: [
                { day: 'Monday', type: 'Walk-Run', distance: 1.5, pace: '14:00' },
                { day: 'Tuesday', type: 'Rest' },
                { day: 'Wednesday', type: 'Walk-Run', distance: 1.5, pace: '13:30' },
                { day: 'Thursday', type: 'Rest' },
                { day: 'Friday', type: 'Walk-Run', distance: 2, pace: '13:00' },
                { day: 'Saturday', type: 'Rest' },
                { day: 'Sunday', type: 'Easy Walk', distance: 1, pace: '15:00' },
              ],
            },
          ],
        },
      },
    }),
    
    // Tyler's 800m Training Plan
    prisma.runningPlan.create({
      data: {
        userId: users[21].id,
        name: 'College 800m Training - 16 Weeks',
        weeks: 16,
        active: true,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-05-10'),
        planData: {
          goal: 'Sub-1:50 800m',
          targetRace: 'College Championships',
          peakWeeklyMileage: 45,
          weeklyPlans: [
            {
              week: 1,
              totalMiles: 30,
              runs: [
                { day: 'Monday', type: 'Easy', distance: 5, pace: '6:30' },
                { day: 'Tuesday', type: 'Speed', distance: 4, pace: '4:45' },
                { day: 'Wednesday', type: 'Easy', distance: 4, pace: '6:45' },
                { day: 'Thursday', type: 'Tempo', distance: 5, pace: '5:30' },
                { day: 'Friday', type: 'Easy', distance: 3, pace: '7:00' },
                { day: 'Saturday', type: 'Rest' },
                { day: 'Sunday', type: 'Long', distance: 9, pace: '6:15' },
              ],
            },
          ],
        },
      },
    }),
  ]);

  console.log('📅 Created training plan');

  console.log('✅ Database seeding completed successfully!');
  console.log(`
🎉 EXTENSIVE SEED DATA SUMMARY:
- 🧠 ${coaches.length} coach personas created
- 👥 ${users.length} users created (diverse fitness levels & goals)
- 👟 ${shoes.length} shoes from 15+ brands (road, trail, racing, training)
- 🏃 ${runs.length}+ runs across 6 months (Jan-July 2025)
- 📱 ${socialProfiles.length} social profiles with diverse avatars
- 📝 ${runPosts.length} run posts with realistic captions
- 🏃‍♂️ ${runGroups.length} run groups (Boston training, track, trails, beginners, etc.)
- 📅 8 training plans (marathon, 5K, ultra, couch-to-5K, etc.)
- 👥 ${followRelationships.length}+ follow relationships (vibrant community)
- 💬 65+ meaningful comments across posts
- ❤️ 3-8 likes per post (200+ total likes)

🌟 RUNNING COMMUNITY HIGHLIGHTS:
🏃‍♂️ Marathon Specialists: John, Mike, Jessica, Emily, Grace, James
⚡ Speed Demons: Sarah, David, Lauren, Tyler
🏔️ Trail Warriors: Alex, Marcus, Carlos
👶 Beginners: Lisa, Kevin, Brandon, Olivia
🎯 Half Marathon Heroes: Maria, Nina, Rachel, Amanda, Daniel, Samantha
🏊‍♂️ Triathlete: Tom
💪 Weight Loss Warriors: Robert

📊 REALISTIC DATA RANGES:
- Paces: 4:01 (elite) to 15:00 (walking)
- Distances: 1.5mi (beginner) to 18mi (ultra training)
- Weekly Mileage: 12-95 miles
- VDOTs: 35 (beginner) to 62 (elite)
- Elevation: 0-2,100 feet
- GPS coordinates spread across multiple locations

🔐 LOGIN CREDENTIALS (password: "password"):
📧 ELITE LEVEL:
- jackson@maratron.ai (Creator, 4:34 marathon pace, Olympic Trials) → Rebel Chen
- james@example.com (Boston qualifier, sub-2:50 goal) → No coach
- jessica@example.com (Boston bound, sub-2:55 goal) → Coach Williams

📧 COMPETITIVE:
- sarah@example.com (Track specialist, sub-17:00 5K) → Tech Thompson
- mike@example.com (Boston qualifier hunter) → No coach
- marcus@example.com (Ultra specialist, 50K training) → Rebel Chen
- lauren@example.com (1500m track specialist) → No coach

📧 RECREATIONAL:
- john@example.com (Marathon enthusiast) → Thunder McGrath
- maria@example.com (Half marathon, sub-1:30 goal) → Thunder McGrath
- alex@example.com (Trail ultra runner) → No coach
- nina@example.com (Half marathon enthusiast) → Zen Rodriguez

📧 BEGINNERS:
- lisa@example.com (Running newbie, 5K progress) → Zen Rodriguez
- kevin@example.com (Couch to 5K warrior) → Buddy Johnson
- brandon@example.com (C25K graduate) → No coach
- olivia@example.com (First 5K completed) → Buddy Johnson

📧 SPECIALIZED:
- emily@example.com (First marathon training) → Buddy Johnson
- rachel@example.com (Injury prevention focus) → Coach Williams
- robert@example.com (Weight loss journey) → Zen Rodriguez
- tom@example.com (Ironman triathlete) → No coach
- david@example.com (College sprinter) → No coach
- amanda@example.com (10K training, zero drop) → No coach
- daniel@example.com (Data-driven runner) → Tech Thompson
- tyler@example.com (800m specialist) → No coach
- grace@example.com (Marathon comeback) → Coach Williams
- carlos@example.com (Mountain trail explorer) → No coach
- samantha@example.com (Urban running specialist) → Tech Thompson

🧠 COACH PERSONAS WITH SPECIALTIES:
- Thunder McGrath 🏃‍♂️ (Motivational, PR-focused)
- Zen Rodriguez 🧘‍♀️ (Mindful, sustainable habits)  
- Tech Thompson 🤖 (Data-driven, analytical)
- Buddy Johnson 😄 (Encouraging, beginner-friendly)
- Coach Williams 👨‍🏫 (Traditional, methodical)
- Rebel Chen 😎 (Unconventional, elite-focused)

🛡️ All passwords securely hashed with bcrypt (12 salt rounds)
🌐 Profile pictures from Unsplash (diverse, professional)
📍 GPS coordinates across multiple realistic locations
📅 Run dates: January 15 - July 3, 2025 (6 months of data)
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