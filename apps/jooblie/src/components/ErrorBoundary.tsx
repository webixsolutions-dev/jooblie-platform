import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  readonly children: ReactNode;
};

type ErrorBoundaryState = {
  readonly hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Jooblie failed to render", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center px-4 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Jooblie
            </p>
            <h1 className="mt-3 text-2xl font-semibold">
              Something went wrong
            </h1>
            <p className="mt-2 text-muted">
              Refresh the page to try again.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
