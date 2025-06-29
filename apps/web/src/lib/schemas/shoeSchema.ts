// @lib/schemas/shoeSchema.ts

import * as Yup from "yup";
import { DistanceUnit } from "@maratypes/basics";

// If you want to generate the allowed values automatically:
const distanceUnitValues: DistanceUnit[] = ["miles", "kilometers"];

export const shoeSchema = Yup.object().shape({
  id: Yup.string().nullable(),
  userId: Yup.string(),
  name: Yup.string().required("Shoe name is required"),
  notes: Yup.string().nullable(),
  createdAt: Yup.date().nullable(),
  updatedAt: Yup.date().nullable(),
  currentDistance: Yup.number()
    .min(0, "Distance cannot be negative")
    .default(0),
  distanceUnit: Yup.string()
    .oneOf(distanceUnitValues, "Select a valid distance unit")
    .required("Distance unit is required"),
  maxDistance: Yup.number()
    .default(500)
    .moreThan(0, "Max distance must be greater than 0")
    .required("Max distance is required"),
  retired: Yup.boolean().default(false),
});
