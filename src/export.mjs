function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function createCsv(state) {
  const rows = [
    ["date", "entry_type", "calories_kcal", "recorded_at"],
    ...state.entries.map((entry) => [
      state.date,
      entry.type,
      entry.amount,
      new Date(entry.createdAt).toISOString(),
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
