type StatCardProps = {
  label: string;
  value: string | number;
  caption: string;
};

export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[rgba(29,16,21,0.76)] p-5 shadow-[0_22px_50px_rgba(8,4,6,0.34)] backdrop-blur-[16px]">
      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#fff7f8]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#e8d3d8]/72">{caption}</p>
    </article>
  );
}
