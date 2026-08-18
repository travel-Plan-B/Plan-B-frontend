export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// 두 날짜 사이의 박(泊) 수가 아니라 "선택된 날짜 수"(당일 포함 1일)를 센다.
export function dayCount(a: Date, b: Date) {
  return (
    Math.round(
      (startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000,
    ) + 1
  );
}

export function formatDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function getMonthGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = new Array(
    new Date(year, month, 1).getDay(),
  ).fill(null);
  for (let day = 1; day <= daysInMonth; day++)
    cells.push(new Date(year, month, day));
  return cells;
}
