/*
 * This file will be changed by automatic program.
 * You can only change variable's property and value.
 */
export const locales = {
  key0001: '7月1日',
  key0002: '7月5日',
  key0003: '7月6日',
  key0004: '7月8日',
  key0005: '忽略',
} as const;

export type LocalKey = keyof typeof locales;
export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in LocalKey]: any;
};
