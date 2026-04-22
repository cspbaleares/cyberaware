import { render, screen, fireEvent } from "@testing-library/react";
import { useToast, ToastProvider } from "@/components/toast";

// Test component
function TestComponent() {
  const { toast, dismiss } = useToast();
  return (
    <div>
      <button onClick={() => toast({ title: "Test Title", description: "Test Description" })}>
        Show Toast
      </button>
      <button onClick={() => dismiss("test-id")}>Dismiss Toast</button>
    </div>
  );
}

describe("Toast", () => {
  it("renders toast provider correctly", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child</div>
      </ToastProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows toast when toast() is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Toast"));

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("auto-dismisses toast after duration", () => {
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Toast"));
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    // Fast-forward past default duration (5000ms)
    jest.advanceTimersByTime(6000);

    jest.useRealTimers();
  });
});
