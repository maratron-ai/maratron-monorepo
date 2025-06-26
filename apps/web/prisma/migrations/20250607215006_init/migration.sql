-- CreateEnum
CREATE TYPE "DistanceUnit" AS ENUM ('miles', 'kilometers');

-- CreateEnum
CREATE TYPE "elevationGainUnit" AS ENUM ('miles', 'kilometers', 'meters', 'feet');

-- CreateEnum
CREATE TYPE "TrainingLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "TrainingEnvironment" AS ENUM ('outdoor', 'treadmill', 'indoor', 'mixed');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- CreateEnum
CREATE TYPE "Device" AS ENUM ('Garmin', 'Polar', 'Suunto', 'Fitbit', 'Apple Watch', 'Samsung Galaxy Watch', 'Coros', 'Other');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender",
    "trainingLevel" "TrainingLevel",
    "VDOT" INTEGER,
    "goals" TEXT[],
    "avatarUrl" TEXT,
    "yearsRunning" INTEGER,
    "weeklyMileage" INTEGER,
    "height" INTEGER,
    "weight" INTEGER,
    "injuryHistory" TEXT,
    "preferredTrainingDays" "DayOfWeek"[],
    "preferredTrainingEnvironment" "TrainingEnvironment",
    "device" "Device",
    "defaultDistanceUnit" "DistanceUnit" DEFAULT 'miles',
    "defaultElevationUnit" "elevationGainUnit" DEFAULT 'feet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultShoeId" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shoes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "distanceUnit" "DistanceUnit" NOT NULL,
    "maxDistance" DOUBLE PRECISION NOT NULL,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Shoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Runs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "distanceUnit" "DistanceUnit" NOT NULL,
    "trainingEnvironment" "TrainingEnvironment",
    "name" TEXT,
    "pace" TEXT,
    "paceUnit" "DistanceUnit",
    "elevationGain" DOUBLE PRECISION,
    "elevationGainUnit" "elevationGainUnit",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "shoeId" TEXT,

    CONSTRAINT "Runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunningPlans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeks" INTEGER NOT NULL,
    "planData" JSONB NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningPlans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_defaultShoeId_key" ON "Users"("defaultShoeId");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_defaultShoeId_fkey" FOREIGN KEY ("defaultShoeId") REFERENCES "Shoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shoes" ADD CONSTRAINT "Shoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Runs" ADD CONSTRAINT "Runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Runs" ADD CONSTRAINT "Runs_shoeId_fkey" FOREIGN KEY ("shoeId") REFERENCES "Shoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunningPlans" ADD CONSTRAINT "RunningPlans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
