import { Container } from "../components/Container";

type PlaceholderPageProps = {
  readonly title: string;
  readonly description: string;
};

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <Container className="py-16">
      <div className="rounded-xl border border-border bg-white p-8">
        <p className="text-sm font-semibold text-primary">Jooblie</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted">{description}</p>
      </div>
    </Container>
  );
}
