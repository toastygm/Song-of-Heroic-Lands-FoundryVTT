// ✅ types/intl.d.ts

// DurationFormat is a proposed ECMA-402 feature and may not yet be supported in all environments.
declare namespace Intl {
  interface DurationFormatOptions {
    style?: "long" | "short" | "narrow";
  }

  class DurationFormat {
    constructor(locale: string | string[], options?: DurationFormatOptions);
    format(value: {
      years?: number;
      months?: number;
      weeks?: number;
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    }): string;
  }

  interface ListFormatOptions {
    localeMatcher?: "lookup" | "best fit";
    style?: "long" | "short" | "narrow";
    type?: "conjunction" | "disjunction" | "unit";
  }

  interface ListFormatPart {
    type: "element" | "literal";
    value: string;
  }

  class ListFormat {
    constructor(locales?: string | string[], options?: ListFormatOptions);
    format(list: Iterable<string>): string;
    formatToParts(list: Iterable<string>): ListFormatPart[];
  }

  interface CollatorOptions {
    usage?: "sort" | "search";
    sensitivity?: "base" | "accent" | "case" | "variant";
    ignorePunctuation?: boolean;
    numeric?: boolean;
    caseFirst?: "upper" | "lower" | "false";
    localeMatcher?: "lookup" | "best fit";
  }

  class Collator {
    constructor(locales?: string | string[], options?: CollatorOptions);
    compare(x: string, y: string): number;
    resolvedOptions(): CollatorOptions;
  }

  interface NumberFormatOptions {
    localeMatcher?: "lookup" | "best fit";
    style?: "decimal" | "currency" | "percent" | "unit";
    currency?: string;
    currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
    unit?: string;
    unitDisplay?: "short" | "long" | "narrow";
    minimumIntegerDigits?: number;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    minimumSignificantDigits?: number;
    maximumSignificantDigits?: number;
    useGrouping?: boolean;
    notation?: "standard" | "scientific" | "engineering" | "compact";
    compactDisplay?: "short" | "long";
    signDisplay?: "auto" | "never" | "always" | "exceptZero";
  }

  class NumberFormat {
    constructor(locales?: string | string[], options?: NumberFormatOptions);
    format(value: number): string;
    formatToParts(value: number): { type: string; value: string }[];
    resolvedOptions(): NumberFormatOptions;
  }

  interface DateTimeFormatOptions {
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
    calendar?: string;
    dayPeriod?: "narrow" | "short" | "long";
    numberingSystem?: string;
    hour12?: boolean;
    hourCycle?: "h11" | "h12" | "h23" | "h24";
    timeZone?: string;
    formatMatcher?: "basic" | "best fit";
    weekday?: "narrow" | "short" | "long";
    era?: "narrow" | "short" | "long";
    year?: "numeric" | "2-digit";
    month?: "numeric" | "2-digit" | "narrow" | "short" | "long";
    day?: "numeric" | "2-digit";
    hour?: "numeric" | "2-digit";
    minute?: "numeric" | "2-digit";
    second?: "numeric" | "2-digit";
    timeZoneName?: "short" | "long" | "shortOffset" | "longOffset" | "shortGeneric" | "longGeneric";
  }

  class DateTimeFormat {
    constructor(locales?: string | string[], options?: DateTimeFormatOptions);
    format(date?: number | Date): string;
    formatToParts(date?: number | Date): { type: string; value: string }[];
    resolvedOptions(): DateTimeFormatOptions;
  }

  interface RelativeTimeFormatOptions {
    localeMatcher?: "lookup" | "best fit";
    numeric?: "always" | "auto";
    style?: "long" | "short" | "narrow";
  }

  class RelativeTimeFormat {
    constructor(locales?: string | string[], options?: RelativeTimeFormatOptions);
    format(value: number, unit: Intl.RelativeTimeFormatUnit): string;
    formatToParts(value: number, unit: Intl.RelativeTimeFormatUnit): { type: string; value: string; unit?: string }[];
    resolvedOptions(): RelativeTimeFormatOptions;
  }

  type RelativeTimeFormatUnit =
    | "year"
    | "quarter"
    | "month"
    | "week"
    | "day"
    | "hour"
    | "minute"
    | "second";
}

