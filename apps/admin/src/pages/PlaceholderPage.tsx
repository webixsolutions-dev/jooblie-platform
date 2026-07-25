type PlaceholderPageProps = {
  readonly title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-8 rounded-xl border border-border bg-white p-8 shadow-sm">
        <p className="text-muted">{title} — coming soon</p>
      </div>
    </section>
  );
}
