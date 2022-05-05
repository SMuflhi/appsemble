import { Utils } from '@appsemble/sdk';
import { compareStrings } from '@appsemble/utils';
import { compareAsc, compareDesc } from 'date-fns';

import { Field } from '../../block';

type FieldWithRequirements = Field & { requirements?: any[] };

/**
 * Check if a field is required.
 *
 * @param field - The field to check.
 * @returns Whether or not the field is required.
 */
export function isRequired(field: FieldWithRequirements): boolean {
  return Boolean(field.requirements?.some(({ required }) => required));
}

/**
 * Check if a given date is a valid.
 *
 * @param date - The date to check
 * @returns Whether the date is a valid date object.
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date);
}

/**
 * Check if a given time string is a valid time between 00:00 and 23:59.
 *
 * @param time - The time string to check.
 * @returns Whether the time string is valid.
 */
export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

/**
 * Get the earliest date of a field.
 *
 * @param field - The field to check.
 * @param utils - The Appsemble SDK utils.
 * @returns A date object matching the earliest date.
 */
export function getMinDate(field: FieldWithRequirements, utils: Utils): Date | undefined {
  const minDates = field.requirements
    ?.filter((r) => 'from' in r)
    .map((r) => new Date(utils.remap(r.from, null) as any))
    .filter(isValidDate);
  if (minDates?.length) {
    return minDates.sort(compareAsc)[0];
  }
}

/**
 * Get the earliest time out of the time requirements.
 *
 * @param field - The field to check.
 * @returns A string matching the earliest time.
 */
export function getMinTime(field: FieldWithRequirements): string {
  const minTimes = field.requirements
    ?.filter((r) => 'minTime' in r)
    .map((r) => r.minTime)
    .filter(isValidTime);
  if (minTimes?.length) {
    return minTimes.sort(compareStrings)[0];
  }

  return '00:00';
}

/**
 * Get the latest time out of the time requirements.
 *
 * @param field - The field to check.
 * @returns A string matching the latest time.
 */
export function getMaxTime(field: FieldWithRequirements): string {
  const maxTimes = field.requirements
    ?.filter((r) => 'maxTime' in r)
    .map((r) => r.maxTime)
    .filter(isValidTime);
  if (maxTimes?.length) {
    return maxTimes.sort(compareStrings)[maxTimes.length - 1];
  }

  return '23:59';
}

/**
 * Get the last date of a field.
 *
 * @param field - The field to check.
 * @param utils - The Appsemble SDK utils.
 * @returns A date object matching the last date.
 */
export function getMaxDate(field: FieldWithRequirements, utils: Utils): Date | undefined {
  const maxDates = field.requirements
    ?.filter((r) => 'to' in r)
    .map((r) => new Date(utils.remap(r.to, null) as any))
    .filter(isValidDate);
  if (maxDates?.length) {
    return maxDates.sort(compareDesc)[0];
  }
}

export function getDisabledDays(field: FieldWithRequirements): ((date: Date) => boolean)[] {
  const disabledDays = field.requirements.reduce<Set<number>>((disabled, current) => {
    if ('monday' in current && !current.monday) {
      disabled.add(1);
    }
    if ('tuesday' in current && !current.tuesday) {
      disabled.add(2);
    }
    if ('wednesday' in current && !current.wednesday) {
      disabled.add(3);
    }
    if ('thursday' in current && !current.thursday) {
      disabled.add(4);
    }
    if ('friday' in current && !current.friday) {
      disabled.add(5);
    }
    if ('saturday' in current && !current.saturday) {
      disabled.add(6);
    }
    if ('sunday' in current && !current.sunday) {
      disabled.add(0);
    }

    return disabled;
  }, new Set());

  if (!disabledDays.size) {
    return [];
  }

  return [(date) => disabledDays.has(date.getDay())];
}

/**
 * Get the absolute minimum length of a field.
 *
 * @param field - The field to check.
 * @returns The minimum length of the field.
 */
export function getMinLength(field: FieldWithRequirements): number | undefined {
  const minLengths = field.requirements?.map((r) => r.minLength).filter(Number.isFinite);
  if (minLengths?.length) {
    return Math.max(...minLengths);
  }
}

/**
 * Get the absolute maximum length of a field.
 *
 * @param field - The field to check.
 * @returns The maximum length of the field.
 */
export function getMaxLength(field: FieldWithRequirements): number | undefined {
  const maxLengths = field.requirements?.map((r) => r.maxLength).filter(Number.isFinite);
  if (maxLengths?.length) {
    return Math.min(...maxLengths);
  }
}

/**
 * Get the absolute minumum value of a field.
 *
 * @param field - The field to check.
 * @returns The minumum value of the field.
 */
export function getMin(field: FieldWithRequirements): number | undefined {
  const minimums = field.requirements?.map((r) => r.min).filter(Number.isFinite);
  if (minimums?.length) {
    return Math.max(...minimums);
  }
}

/**
 * Get the absolute maximum value of a field.
 *
 * @param field - The field to check.
 * @returns The maximum value of the field.
 */
export function getMax(field: FieldWithRequirements): number | undefined {
  const maximums = field.requirements?.map((r) => r.max).filter(Number.isFinite);
  if (maximums?.length) {
    return Math.min(...maximums);
  }
}

/**
 * Get the minimum step of a field.
 *
 * @param field - The field to check.
 * @returns The minumum step.
 */
export function getStep(field: FieldWithRequirements): number | undefined {
  const steps = field.requirements?.map((r) => r.step).filter(Number.isFinite);
  if (steps?.length) {
    return Math.min(...steps);
  }
}

/**
 * Get the joined accept value for the field.
 *
 * @param field - The field to check.
 * @returns The accept attribute
 */
export function getAccept(field: FieldWithRequirements): string {
  return field.requirements?.map((r) => r.accept).join(',');
}
