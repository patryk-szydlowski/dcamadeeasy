import { isEqual } from "lodash-es";
import { Matcher } from "vitest-mock-extended";

export function objectMatching<T>(expectedValue: T) {
  return new Matcher<T | unknown>(
    (actualValue) => isEqual(actualValue, expectedValue),
    "object not matching expected shape",
  );
}
