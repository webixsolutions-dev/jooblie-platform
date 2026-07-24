import { Link } from "react-router-dom";

import { Container } from "../components/Container";

export function HomePage() {
  return (
    <Container className="py-20 sm:py-28">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Jobs across Pakistan
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Your next opportunity starts here.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Discover roles that fit your skills, or find the people who will move
          your company forward.
        </p>
        <Link
          className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-blue-700"
          to="/jobs"
        >
          Browse jobs
        </Link>
      </div>
    </Container>
  );
}
