type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
};

const toneStyles: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-[#4b363d] bg-[rgba(255,255,255,0.04)] text-[#d8c1c7]",
  positive: "border-[#49735a] bg-[rgba(44,82,57,0.2)] text-[#c8f0d4]",
  warning: "border-[#7b5d2b] bg-[rgba(123,93,43,0.2)] text-[#f7dfaa]",
  danger: "border-[#8f4250] bg-[rgba(143,66,80,0.22)] text-[#ffd4dc]",
  info: "border-[#6d3d47] bg-[rgba(199,62,89,0.16)] text-[#f4c7d0]",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]}`}>
      {label}
    </span>
  );
}
