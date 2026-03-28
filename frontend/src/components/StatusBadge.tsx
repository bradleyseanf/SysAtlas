import { CBadge } from "@coreui/react";

type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
};

const toneColors: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "secondary",
  positive: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <CBadge color={toneColors[tone]} className="rounded-pill text-capitalize">{label}</CBadge>;
}
