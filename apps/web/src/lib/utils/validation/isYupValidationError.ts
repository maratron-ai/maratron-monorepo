import * as Yup from "yup";

function isYupValidationError(
  err: unknown
): err is { inner: Yup.ValidationError[] } {
  return typeof err === "object" && err !== null && "inner" in err;
}

export default isYupValidationError;