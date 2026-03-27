type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="rounded-[28px] border border-dashed border-[#5d3640] bg-[rgba(29,16,21,0.74)] px-8 py-12 text-center shadow-[0_18px_40px_rgba(8,4,6,0.26)] backdrop-blur-[12px]">
      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-[#d55472]">No Inventory Available</p>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#fff7f8]">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#f3dce1]/72">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-7 rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-5 py-3 text-sm font-semibold text-[#fff7f8] transition hover:bg-[#d55472] hover:shadow-[0_18px_40px_rgba(199,62,89,0.28)]"
      >
        {actionLabel}
      </button>
    </section>
  );
}
