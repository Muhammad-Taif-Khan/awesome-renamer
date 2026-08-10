import { FileCreatedAtFilter, FileModifiedAtFilter } from "../types";
import { normalizeDate, toValidDate } from "../utils/date-utils";

export function dateMustBeInRange(
  dateToTest: Date | string | number,
  filter: FileModifiedAtFilter | FileCreatedAtFilter
): boolean {
  const fromDate = toValidDate(filter.from)
    ? normalizeDate(new Date(filter.from!), filter.precision)
    : undefined;
  const toDate = toValidDate(filter.to)
    ? normalizeDate(new Date(filter.to!), filter.precision)
    : undefined;

  const dateToTestTime = normalizeDate(new Date(dateToTest), filter.precision);
  if (!fromDate && !toDate) {
    return true;
  }

  if (!fromDate && toDate) {
    return dateToTestTime <= toDate;
  }
  if (!toDate && fromDate) {
    return dateToTestTime >= fromDate;
  }
  if (toDate! === fromDate!) {
    return dateToTestTime === toDate;
  }
  return dateToTestTime >= fromDate! && dateToTestTime <= toDate!;
}
