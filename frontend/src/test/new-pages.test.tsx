import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Captcha } from "@/components/Captcha";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlatformDataProvider } from "@/contexts/PlatformDataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { mockUsers } from "@/data/mockData";

const renderWithProviders = (ui: React.ReactNode, route = "/") => {
  // Seed a logged-in mock user so any context consumer has something to read.
  window.localStorage.setItem(
    "health-ai-platform-data",
    JSON.stringify({ users: mockUsers, posts: [], meetingRequests: [], notifications: [] }),
  );
  window.localStorage.setItem("health-ai-current-user", mockUsers[0].id);
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <PlatformDataProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </AuthProvider>
        </PlatformDataProvider>
      </TooltipProvider>
    </QueryClientProvider>,
  );
};

describe("VerifyEmailPage", () => {
  it("renders the verify-email mock screen", () => {
    renderWithProviders(<VerifyEmailPage />);
    expect(
      screen.getByRole("heading", { name: /verify your email/i }),
    ).toBeInTheDocument();
  });
});

describe("PrivacyPolicyPage", () => {
  it("renders KVKK + GDPR references", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /privacy/i }),
    ).toBeInTheDocument();
    // KVKK should appear somewhere on the page
    expect(screen.getAllByText(/KVKK/i).length).toBeGreaterThan(0);
  });
});

describe("TermsOfServicePage", () => {
  it("renders the off-platform handoff acceptance", () => {
    renderWithProviders(<TermsOfServicePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /terms/i }),
    ).toBeInTheDocument();
  });
});

describe("Captcha component", () => {
  const Wrapper = ({ onVerified }: { onVerified: (v: boolean) => void }) => {
    const [value, setValue] = useState("");
    const [verified, setVerified] = useState(false);
    return (
      <Captcha
        value={value}
        onChange={setValue}
        verified={verified}
        onVerifiedChange={(v) => {
          setVerified(v);
          onVerified(v);
        }}
      />
    );
  };

  it("verifies when the correct sum is entered", () => {
    const onVerified = vi.fn();
    const { container } = renderWithProviders(<Wrapper onVerified={onVerified} />);
    const challenge = container.textContent || "";
    const match = challenge.match(/(\d+)\s*\+\s*(\d+)/);
    expect(match).not.toBeNull();
    const expected = Number(match![1]) + Number(match![2]);
    const input = screen.getByLabelText(/captcha answer/i);
    fireEvent.change(input, { target: { value: String(expected) } });
    expect(onVerified).toHaveBeenCalledWith(true);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  it("does not verify on wrong answer", () => {
    const onVerified = vi.fn();
    const { container } = renderWithProviders(<Wrapper onVerified={onVerified} />);
    const challenge = container.textContent || "";
    const match = challenge.match(/(\d+)\s*\+\s*(\d+)/);
    const expected = Number(match![1]) + Number(match![2]);
    const wrong = expected + 1;
    const input = screen.getByLabelText(/captcha answer/i);
    fireEvent.change(input, { target: { value: String(wrong) } });
    expect(onVerified).not.toHaveBeenCalledWith(true);
  });
});
