import * as Yup from "yup";
import { DayOfWeek, TrainingEnvironment } from "@maratypes/basics";
import {
  TrainingLevel,
  Device,
} from "@maratypes/user";


// Training level values
const trainingLevelValues = Object.values(TrainingLevel) as TrainingLevel[];

const userSchema = Yup.object().shape({
  id: Yup.string().nullable(),
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  age: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null
        ? undefined
        : Number(originalValue)
    )
    .min(10, "Age must be at least 10")
    .nullable()
    .default(undefined),
  gender: Yup.string()
    .oneOf(["Male", "Female", "Other"])
    .nullable()
    .default(undefined),
  trainingLevel: Yup.mixed<TrainingLevel>()
    .oneOf(trainingLevelValues, "Invalid training level")
    .nullable()
    .default(TrainingLevel.Beginner),
  VDOT: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null
        ? undefined
        : Number(originalValue)
    )
    .min(10, "VDOT must be at least 10")
    .nullable()
    .default(undefined),
  goals: Yup.array().of(Yup.string()),
  avatarUrl: Yup.string()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? undefined : value
    )
    .nullable()
    .default(undefined),
  yearsRunning: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null
        ? undefined
        : Number(originalValue)
    )
    .min(0, "Years running cannot be negative")
    .nullable()
    .default(undefined),
  weeklyMileage: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null
        ? undefined
        : Number(originalValue)
    )
    .min(0, "Weekly mileage cannot be negative")
    .nullable()
    .default(undefined),
  height: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null
        ? undefined
        : Number(originalValue)
    )
    .min(0, "Height must be positive")
    .nullable()
    .default(undefined),
  weight: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null
        ? undefined
        : Number(originalValue)
    )
    .min(0, "Weight must be positive")
    .nullable()
    .default(undefined),
  injuryHistory: Yup.string().nullable().default(undefined),
  preferredTrainingDays: Yup.array()
    .of(
      Yup.string().oneOf([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ] as DayOfWeek[])
    )
    .nullable()
    .default([]),
  preferredTrainingEnvironment: Yup.string()
    .oneOf(["outdoor", "treadmill", "indoor", "mixed"] as TrainingEnvironment[])
    .nullable()
    .default("mixed"),
  device: Yup.string()
    .oneOf([
      "Garmin",
      "Polar",
      "Suunto",
      "Fitbit",
      "AppleWatch",
      "SamsungGalaxyWatch",
      "Coros",
      "Other",
    ] as Device[])
    .nullable()
    .default(undefined),

  defaultDistanceUnit: Yup.string()
    .oneOf(["miles", "kilometers"])
    .nullable()
    .default("miles"),

  defaultElevationUnit: Yup.string()
    .oneOf(["miles", "kilometers", "meters", "feet"])
    .nullable()
    .default("feet"),
});

export default userSchema;
