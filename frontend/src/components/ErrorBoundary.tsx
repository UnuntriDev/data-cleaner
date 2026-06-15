import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[20rem] flex-col items-center justify-center gap-4 rounded-2xl bg-red-50 p-8 text-center ring-1 ring-red-200">
            <p className="font-display text-lg font-bold text-red-700">
              Coś poszło nie tak
            </p>
            <p className="max-w-sm text-sm text-red-500">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Spróbuj ponownie
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
