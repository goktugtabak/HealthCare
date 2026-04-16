import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MeetingRequestModal } from "@/components/MeetingRequestModal";
import { AppRoutes } from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlatformDataProvider } from "@/contexts/PlatformDataContext";
import {
  mockMeetingRequests,
  mockNotifications,
  mockPosts,
  mockUsers,
} from "@/data/mockData";
import type { User } from "@/data/types";

const PLATFORM_STORAGE_KEY = "health-ai-platform-data";
const AUTH_STORAGE_KEY = "health-ai-current-user";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const seedState = ({
  users = mockUsers,
  posts = mockPosts,
  meetingRequests = mockMeetingRequests,
  notifications = mockNotifications,
  currentUserId,
}: {
  users?: typeof mockUsers;
  posts?: typeof mockPosts;
  meetingRequests?: typeof mockMeetingRequests;
  notifications?: typeof mockNotifications;
  currentUserId?: string;
}) => {
  window.localStorage.setItem(
    PLATFORM_STORAGE_KEY,
    JSON.stringify({ users, posts, meetingRequests, notifications }),
  );

  if (currentUserId) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, currentUserId);
  }
};

const renderApp = (initialPath: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <PlatformDataProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <AppRoutes />
            </MemoryRouter>
          </AuthProvider>
        </PlatformDataProvider>
      </TooltipProvider>
    </QueryClientProvider>,
  );

describe("app flows", () => {
  it("redirects incomplete users to onboarding before dashboard access", async () => {
    const users = clone(mockUsers);
    const engineer = users.find((user) => user.id === "u2") as User;
    engineer.onboardingCompleted = false;
    engineer.institution = "";
    engineer.city = "";
    engineer.country = "";
    engineer.profileCompleteness = 25;

    seedState({ users, currentUserId: engineer.id });
    renderApp("/dashboard");

    expect(
      await screen.findByRole("heading", { name: /finish your engineering profile/i }),
    ).toBeInTheDocument();
  });

  it("shows the engineer dashboard with a visible new post action", async () => {
    seedState({ currentUserId: "u2" });
    renderApp("/dashboard");

    expect(await screen.findByRole("button", { name: /new post/i })).toBeInTheDocument();
    expect(screen.getByText(/latest opportunities/i)).toBeInTheDocument();
  });

  it("keeps explore ordered newest-first", async () => {
    seedState({ currentUserId: "u1" });
    const { container } = renderApp("/explore");

    await screen.findByText(/sorted by newest first/i);

    const cardHeadings = Array.from(container.querySelectorAll("article h3")).map((node) =>
      node.textContent?.trim(),
    );

    expect(cardHeadings[0]).toBe("Smart prosthetics feedback system");
  });

  it("validates meeting request modal inputs before submit", async () => {
    const handleSubmit = vi.fn();

    render(
      <MeetingRequestModal
        open
        onOpenChange={() => {}}
        postTitle="Cardiology AI assistant for ECG interpretation"
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /send request/i }));

    expect(screen.getByText(/please write an introductory message/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you must accept the confidentiality terms/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/please propose at least one time slot/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("reveals external handoff details for scheduled meetings", async () => {
    seedState({ currentUserId: "u3" });
    renderApp("/meetings");

    expect(await screen.findByText(/continue off-platform/i)).toBeInTheDocument();
    expect(screen.getByText(/mehmet\.demir@metu\.edu\.tr/i)).toBeInTheDocument();
  });
});
