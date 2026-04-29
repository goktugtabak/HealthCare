import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MeetingRequestModal } from "@/components/MeetingRequestModal";
import { AppRoutes } from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatDockProvider } from "@/contexts/ChatDockContext";
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
            <ChatDockProvider>
              <MemoryRouter initialEntries={[initialPath]}>
                <AppRoutes />
              </MemoryRouter>
            </ChatDockProvider>
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

  it("shows the engineer dashboard with the active opportunity feed", async () => {
    seedState({ currentUserId: "u2" });
    renderApp("/dashboard");

    expect(
      await screen.findByRole("heading", { name: /latest opportunities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent conversations/i }),
    ).toBeInTheDocument();
  });

  it("keeps explore ordered newest-first", async () => {
    seedState({ currentUserId: "u1" });
    const { container } = renderApp("/explore");

    await screen.findByRole("heading", { name: /explore posts/i });

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

    fireEvent.click(await screen.findByRole("button", { name: /continue to nda/i }));

    expect(
      screen.getByText(/please write a collaboration request message/i),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("keeps messaging locked while a collaboration request is pending", async () => {
    seedState({ currentUserId: "u2" });
    renderApp("/posts/p1");

    const pendingButton = await screen.findByRole("button", {
      name: /request pending/i,
    });

    expect(pendingButton).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /message author|start conversation/i }),
    ).not.toBeInTheDocument();
  });

  it("lets users message after a collaboration request is accepted", async () => {
    const meetingRequests = clone(mockMeetingRequests);
    const request = meetingRequests.find((candidate) => candidate.id === "mr1");
    if (request) {
      request.status = "Accepted";
      request.selectedSlot = null;
    }

    seedState({ meetingRequests, currentUserId: "u2" });
    renderApp("/posts/p1");

    fireEvent.click(
      await screen.findByRole("button", { name: /start conversation/i }),
    );

    expect(screen.queryByText(/accept the mutual nda/i)).not.toBeInTheDocument();

    const messageBox = await screen.findByRole("textbox");
    expect(messageBox).toBeEnabled();

    fireEvent.change(messageBox, {
      target: { value: "Hello from the confidential post test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText("Hello from the confidential post test"),
    ).toBeInTheDocument();
  });

  it("reveals external handoff details for scheduled meetings", async () => {
    seedState({ currentUserId: "u3" });
    renderApp("/meetings");

    expect(await screen.findByText(/messaging unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/mehmet\.demir@metu\.edu\.tr/i)).toBeInTheDocument();
  });
});
