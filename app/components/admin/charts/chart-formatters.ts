import { createContext, useContext } from "react";

export const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const weekdayDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export const hmsTimeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat("en-US").format;

// Local addition (not upstream): lets the host app localize time-series date labels.
export interface ChartDateFormat {
  axis: (date: Date) => string;
  tooltip: (date: Date) => string;
}

export const ChartDateFormatContext = createContext<ChartDateFormat>({
  axis: (date) => shortDateFmt.format(date),
  tooltip: (date) => weekdayDateFmt.format(date),
});

export function useChartDateFormat(): ChartDateFormat {
  return useContext(ChartDateFormatContext);
}
