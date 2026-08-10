import { DatePrecision } from "../types";
import { isNumber } from "./extra";

export function toValidDate(supposedDate: Date | number | string | undefined): Date | undefined {
  if (supposedDate === undefined) return undefined;
  const date = new Date(supposedDate);
  if (isNumber(date.getTime())) return date;
  return undefined;
}

export function normalizeDate(date: Date, precision?: DatePrecision): number {
  const time = date.getTime();
  switch (precision) {
    case 'millisecond':
      return time;
    case 'second':
      return Math.floor(time / 1_000);

    case 'minute':
      return Math.floor(time / 60_000);

    case 'hour':
      return Math.floor(time / 3_600_000);

    case 'day':
      return Math.floor(time / 86_400_000);
    default:
      return time;
  }
}