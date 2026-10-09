export const boardStatuses = [
  { value: "draft", label: "Draft" },
  { value: "started", label: "Started" },
  { value: "paused", label: "Paused" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;
export type BoardStatus = (typeof boardStatuses)[number]["value"];
export function boardStatus(value?: string) {
  return boardStatuses.find(status => status.value === value) ?? boardStatuses[0];
}
