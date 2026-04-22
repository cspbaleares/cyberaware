import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopNav } from "@/components/top-nav";

// Mock the hooks and components
jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

jest.mock("@/components/locale-switcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher">Locale Switcher</div>,
}));

describe("TopNav", () => {
  const mockSession = {
    email: "test@example.com",
    tenantSlug: "test-tenant",
    isSuperAdmin: false,
    roles: ["user"],
    enabledModules: ["module_1", "module_2"],
  };

  it("renders brand logo and name", () => {
    render(<TopNav session={null} />);

    expect(screen.getByText("CyberAware")).toBeInTheDocument();
  });

  it("renders navigation links for logged out user", () => {
    render(<TopNav session={null} />);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Acceder")).toBeInTheDocument();
  });

  it("renders navigation links for logged in user", () => {
    render(<TopNav session={mockSession} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Simulación")).toBeInTheDocument();
    expect(screen.getByText("Riesgo Humano")).toBeInTheDocument();
  });

  it("renders user info when logged in", () => {
    render(<TopNav session={mockSession} />);

    expect(screen.getByText("test")).toBeInTheDocument(); // email.split("@")[0]
    expect(screen.getByText("test-tenant")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument(); // First letter of email
  });

  it("renders logout button when logged in", () => {
    render(<TopNav session={mockSession} />);

    expect(screen.getByText("Salir")).toBeInTheDocument();
  });

  it("renders platform link for super admin", () => {
    const adminSession = { ...mockSession, isSuperAdmin: true };
    render(<TopNav session={adminSession} />);

    expect(screen.getByText("Plataforma")).toBeInTheDocument();
  });

  it("renders platform link for platform_admin role", () => {
    const adminSession = { ...mockSession, roles: ["platform_admin"] };
    render(<TopNav session={adminSession} />);

    expect(screen.getByText("Plataforma")).toBeInTheDocument();
  });

  it("renders theme toggle and locale switcher", () => {
    render(<TopNav session={mockSession} />);

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("locale-switcher")).toBeInTheDocument();
  });

  it("does not render disabled modules", () => {
    const limitedSession = {
      ...mockSession,
      enabledModules: ["module_1"],
    };
    render(<TopNav session={limitedSession} />);

    expect(screen.getByText("Simulación")).toBeInTheDocument();
    expect(screen.queryByText("Riesgo Humano")).not.toBeInTheDocument();
  });

  it("links to correct paths", () => {
    render(<TopNav session={mockSession} />);

    expect(screen.getByText("Inicio").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Simulación").closest("a")).toHaveAttribute("href", "/module-1");
  });
});
