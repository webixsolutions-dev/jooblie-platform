import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <Container className="flex flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted">
        <p>Find work. Build teams.</p>
        <p>© {new Date().getFullYear()} Jooblie</p>
      </Container>
    </footer>
  );
}
