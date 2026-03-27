type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="atlas-panel rounded-[28px] border-dashed border-white/15 px-8 py-12 text-center">
      <p className="text-atlas-dim text-[0.74rem] font-semibold uppercase tracking-[0.2em]">No Inventory Available</p>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-atlas">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="atlas-primary-button mt-7 rounded-2xl px-5 py-3 text-sm font-semibold"
      >
        {actionLabel}
      </button>
    </section>
  );
}
