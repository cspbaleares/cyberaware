import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/components/i18n-provider";

// Test component
function TestComponent() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translation">{t("navigation.home")}</span>
      <button onClick={() => setLocale("en")}>Switch to EN</button>
      <button onClick={() => setLocale("es")}>Switch to ES</button>
    </div>
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders children correctly", () => {
    render(
      <I18nProvider>
        <div data-testid="child">Child</div>
      </I18nProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("provides default locale as es", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
  });

  it("translates keys correctly", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId("translation")).toHaveTextContent("Inicio");
  });

  it("changes locale when setLocale is called", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText("Switch to EN"));
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translation")).toHaveTextContent("Home");
  });

  it("persists locale to localStorage", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText("Switch to EN"));
    expect(localStorage.setItem).toHaveBeenCalledWith("locale", "en");
  });

  it("handles translation with params", () => {
    function ComponentWithParams() {
      const { t } = useI18n();
      return <span>{t("dashboard.welcome", { name: "John" })}</span>;
    }

    render(
      <I18nProvider>
        <ComponentWithParams />
      </I18nProvider>
    );

    expect(screen.getByText("¡Hola, John!")).toBeInTheDocument();
  });

  it("returns key when translation is missing", () => {
    function ComponentWithMissing() {
      const { t } = useI18n();
      return <span>{t("missing.key")}</span>;
    }

    render(
      <I18nProvider>
        <ComponentWithMissing />
      </I18nProvider>
    );

    expect(screen.getByText("missing.key")).toBeInTheDocument();
  });
});
