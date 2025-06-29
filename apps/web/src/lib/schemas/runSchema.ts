// @src/lib/schemas/runSchema.ts

import * as Yup from "yup";

const runSchema = Yup.object().shape({
  date: Yup.string().required("Date is required"),
  duration: Yup.string()
    .required("Duration is required")
    .matches(
      /^(\d{1,2}:[0-5]\d)(:[0-5]\d)?$/,
      "Duration must be in H:MM or HH:MM:SS format (e.g., 1:30 or 01:30:45)"
    ),
  distance: Yup.number()
    .required("Distance is required")
    .moreThan(0, "Distance must be greater than 0"),
  distanceUnit: Yup.string()
    .transform((value, original) => (original === "" ? undefined : value))
    .oneOf(["miles", "kilometers"], "Select a valid distance unit")
    .required("Distance unit is required"),
  trainingEnvironment: Yup.string()
    .transform((value, original) => (original === "" ? undefined : value))
    .oneOf(
      ["outdoor", "treadmill", "indoor", "mixed"],
      "Select a valid training environment"
    )
    .notRequired(),
  elevationGain: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .notRequired(),
  elevationGainUnit: Yup.string()
    .transform((value, original) => (original === "" ? undefined : value))
    .oneOf(
      ["miles", "kilometers", "meters", "feet"],
      "Select a valid elevation gain unit"
    )
    .notRequired(),
  notes: Yup.string().notRequired(),

  // 👟 Add optional shoeId field
  shoeId: Yup.string()
    .transform((value, original) => (original === "" ? undefined : value))
    .notRequired(),
});

export default runSchema;
