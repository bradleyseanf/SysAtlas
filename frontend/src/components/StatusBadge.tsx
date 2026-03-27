type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
};

const toneStyles: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-[rgba(23,32,42,0.08)] bg-[rgba(23,32,42,0.04)] text-atlas-muted",
  positive: "border-[rgba(89,159,116,0.4)] bg-[rgba(52,102,73,0.22)] text-[var(--atlas-success-text)]",
  warning: "border-[rgba(170,126,55,0.45)] bg-[rgba(105,78,30,0.22)] text-[var(--atlas-warning-text)]",
  danger: "border-[rgba(185,79,104,0.18)] bg-[rgba(185,79,104,0.08)] text-[#8c3a52]",
  info: "border-[rgba(201,74,99,0.16)] bg-[rgba(201,74,99,0.06)] text-[var(--atlas-accent-text)]",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]}`}>
      {label}
    </span>
  );
}
