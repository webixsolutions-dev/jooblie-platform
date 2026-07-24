import { Link } from "react-router-dom";

import { Container } from "../components/Container";

export function NotFoundPage() {
  return (
    <Container className="py-20 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted">
        The page you are looking for does not exist.
      </p>
      <Link className="mt-6 inline-block font-semibold text-primary" to="/">
        Return home
      </Link>
    </Container>
  );
}
