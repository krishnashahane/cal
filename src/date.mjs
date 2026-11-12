/** Local-calendar date helpers. */
export function asValidDate(value = new Date()) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("A valid date is required.");
  return date;
}

export function getLocalDateKey(value = new Date()) {
  const date = asValidDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Calendar boundaries correctly handle 23- and 25-hour daylight-saving days. */
export function getLocalDayBounds(value = new Date()) {
  const date = asValidDate(value);
  return {
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime(),
  };
}

export function getElapsedDayFraction(value = new Date()) {
  const date = asValidDate(value);
  const { start, end } = getLocalDayBounds(date);
  return Math.min(1, Math.max(0, (date.getTime() - start) / (end - start)));
}
