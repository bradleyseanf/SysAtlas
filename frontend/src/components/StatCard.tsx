type StatCardProps = {
  label: string;
  value: string | number;
  caption: string;
};

export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <article className="atlas-panel rounded-3xl p-5">
      <p className="text-atlas-accent-soft text-[0.74rem] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-atlas">{value}</p>
      <p className="mt-2 text-sm leading-6 text-atlas-muted">{caption}</p>
    </article>
  );
}
