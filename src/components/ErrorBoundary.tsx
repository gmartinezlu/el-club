import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-club-paper p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="font-display text-3xl text-club-green">
            Algo salió mal
          </h1>
          <p className="text-sm leading-relaxed text-club-muted">
            Hubo un error inesperado. Por favor recarga la página para
            continuar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-club-green px-6 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
