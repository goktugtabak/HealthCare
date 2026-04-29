import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/components/RoleBadge";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { domainOptions, expertiseOptions } from "@/data/mockData";
import { Check, Download, FileJson, Search, Trash2, UserCircle2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const contactMethods = ["Email", "Phone", "LinkedIn", "Other"] as const;

const csvEscape = (value: unknown) => {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUserProfile, logout } = useAuth();
  const {
    posts,
    meetingRequests,
    messages,
    notifications,
    activityLogs,
    requestAccountDeletion,
  } = usePlatformData();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [form, setForm] = useState({
    fullName: currentUser?.fullName ?? "",
    institution: currentUser?.institution ?? "",
    city: currentUser?.city ?? "",
    country: currentUser?.country ?? "",
    bio: currentUser?.bio ?? "",
    interestTags: currentUser?.interestTags ?? [],
    expertiseTags: currentUser?.expertiseTags ?? [],
    portfolioSummary: currentUser?.portfolioSummary ?? "",
    portfolioLinks: currentUser?.portfolioLinks.join("\n") ?? "",
    preferredContactMethod: currentUser?.preferredContact?.method ?? "Email",
    preferredContactValue: currentUser?.preferredContact?.value ?? currentUser?.email ?? "",
    inAppNotifications: currentUser?.notificationPreferences.inApp ?? true,
    emailNotifications: currentUser?.notificationPreferences.email ?? true,
  });

  useEffect(() => {
    if (!currentUser || editing) {
      return;
    }

    setForm({
      fullName: currentUser.fullName,
      institution: currentUser.institution,
      city: currentUser.city,
      country: currentUser.country,
      bio: currentUser.bio ?? "",
      interestTags: currentUser.interestTags,
      expertiseTags: currentUser.expertiseTags,
      portfolioSummary: currentUser.portfolioSummary ?? "",
      portfolioLinks: currentUser.portfolioLinks.join("\n"),
      preferredContactMethod: currentUser.preferredContact?.method ?? "Email",
      preferredContactValue: currentUser.preferredContact?.value ?? currentUser.email,
      inAppNotifications: currentUser.notificationPreferences.inApp,
      emailNotifications: currentUser.notificationPreferences.email,
    });
  }, [currentUser, editing]);

  if (!currentUser) return null;

  const buildExportPayload = () => ({
    profile: currentUser,
    posts: posts.filter((post) => post.ownerId === currentUser.id),
    meetingRequests: meetingRequests.filter(
      (request) =>
        request.requesterId === currentUser.id ||
        posts.some((post) => post.id === request.postId && post.ownerId === currentUser.id),
    ),
    messages: messages.filter(
      (message) => message.senderId === currentUser.id || message.recipientId === currentUser.id,
    ),
    notifications: notifications.filter((notification) => notification.userId === currentUser.id),
    activityLogs: activityLogs.filter((log) => log.userId === currentUser.id),
    exportedAt: new Date().toISOString(),
  });

  const triggerDownload = (filename: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const payload = buildExportPayload();
    triggerDownload(
      `health-ai-export-${currentUser.id}-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
      JSON.stringify(payload, null, 2),
    );
    toast({ title: "Data exported", description: "JSON download started." });
  };

  const downloadCsv = () => {
    const payload = buildExportPayload();
    const profileSection = [
      "section,key,value",
      ...Object.entries(payload.profile).map(
        ([key, value]) =>
          `profile,${csvEscape(key)},${csvEscape(
            typeof value === "object" ? JSON.stringify(value) : value,
          )}`,
      ),
    ];
    const postSection = [
      "section,id,title,status,created_at,expiry",
      ...payload.posts.map(
        (post) =>
          `posts,${csvEscape(post.id)},${csvEscape(post.title)},${csvEscape(post.status)},${csvEscape(post.createdAt)},${csvEscape(post.expiryDate)}`,
      ),
    ];
    const meetingSection = [
      "section,id,post_id,status,nda_accepted,created_at",
      ...payload.meetingRequests.map(
        (request) =>
          `meeting_requests,${csvEscape(request.id)},${csvEscape(request.postId)},${csvEscape(request.status)},${csvEscape(request.ndaAccepted)},${csvEscape(request.createdAt)}`,
      ),
    ];
    const messageSection = [
      "section,id,post_id,direction,created_at",
      ...payload.messages.map(
        (message) =>
          `messages,${csvEscape(message.id)},${csvEscape(message.postId)},${csvEscape(
            message.senderId === currentUser.id ? "out" : "in",
          )},${csvEscape(message.createdAt)}`,
      ),
    ];
    const csv = [
      ...profileSection,
      "",
      ...postSection,
      "",
      ...meetingSection,
      "",
      ...messageSection,
    ].join("\n");
    triggerDownload(
      `health-ai-export-${currentUser.id}-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
      csv,
    );
    toast({ title: "Data exported", description: "CSV download started." });
  };

  const toggleTag = (value: string, key: "interestTags" | "expertiseTags") =>
    setForm((currentForm) => ({
      ...currentForm,
      [key]: currentForm[key].includes(value)
        ? currentForm[key].filter((item) => item !== value)
        : [...currentForm[key], value],
    }));

  const handleSave = () => {
    updateCurrentUserProfile({
      fullName: form.fullName,
      institution: form.institution,
      city: form.city,
      country: form.country,
      bio: form.bio,
      interestTags: currentUser.role === "healthcare" ? form.interestTags : currentUser.interestTags,
      expertiseTags: currentUser.role === "engineer" ? form.expertiseTags : currentUser.expertiseTags,
      portfolioSummary: currentUser.role === "engineer" ? form.portfolioSummary : "",
      portfolioLinks:
        currentUser.role === "engineer"
          ? form.portfolioLinks
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      preferredContact: {
        method: form.preferredContactMethod as "Email" | "Phone" | "LinkedIn" | "Other",
        value: form.preferredContactValue,
      },
      notificationPreferences: {
        inApp: form.inAppNotifications,
        email: form.emailNotifications,
      },
    });
    setEditing(false);
    toast({ title: "Profile updated", description: "Your changes have been saved." });
  };

  const tagOptions =
    currentUser.role === "healthcare"
      ? [...new Set([...domainOptions, ...expertiseOptions])]
      : expertiseOptions;

  const completeness = currentUser.profileCompleteness;
  const completenessColor =
    completeness >= 85
      ? "bg-success"
      : completeness >= 60
        ? "bg-[hsl(var(--info))]"
        : "bg-[hsl(var(--warning))]";

  return (
    <AppShell>
      <PageHero
        eyebrow="Your account"
        title="Profile"
        description="Long-term hub for matching signal, external handoff details, and notification preferences."
        icon={UserCircle2}
        meta={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border/60">
              <span className="tabular-nums">{completeness}%</span> complete
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              {currentUser.role === "engineer" ? currentUser.expertiseTags.length : currentUser.interestTags.length}{" "}
              {currentUser.role === "engineer" ? "expertise" : "interest"} tags
            </span>
          </div>
        }
        action={
          !editing && (
            <Button size="sm" className="rounded-full px-4" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )
        }
      />

      <div className="max-w-3xl space-y-6 animate-fade-in">
        <div className="rounded-[28px] border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {currentUser.fullName
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">{currentUser.fullName}</h2>
              <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
              <RoleBadge role={currentUser.role} className="mt-1" />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Profile completeness</span>
              <span className="font-semibold tabular-nums">{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", completenessColor)}
                style={{ width: `${completeness}%` }}
              />
            </div>
            {completeness < 85 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Add a bio, tags, and a portfolio link to reach 100% — better signal means better matches.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Profile details</h3>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm">Full name</Label>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((currentForm) => ({ ...currentForm, fullName: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Institution</Label>
                  <Input
                    value={form.institution}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        institution: event.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">City</Label>
                  <Input
                    value={form.city}
                    onChange={(event) =>
                      setForm((currentForm) => ({ ...currentForm, city: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Country</Label>
                  <Input
                    value={form.country}
                    onChange={(event) =>
                      setForm((currentForm) => ({ ...currentForm, country: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Short bio</Label>
                <Textarea
                  value={form.bio}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, bio: event.target.value }))
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Preferred external contact</Label>
                <div className="mt-1 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <Select
                    value={form.preferredContactMethod}
                    onValueChange={(value) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        preferredContactMethod: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={form.preferredContactValue}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        preferredContactValue: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    {currentUser.role === "healthcare" ? "Interest tags" : "Expertise tags"}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {(currentUser.role === "healthcare" ? form.interestTags : form.expertiseTags).length} selected
                  </span>
                </div>

                {(currentUser.role === "healthcare" ? form.interestTags : form.expertiseTags).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-muted/30 p-2">
                    {(currentUser.role === "healthcare" ? form.interestTags : form.expertiseTags).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          toggleTag(
                            tag,
                            currentUser.role === "healthcare" ? "interestTags" : "expertiseTags",
                          )
                        }
                        className="group inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {tag}
                        <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={tagSearch}
                    onChange={(event) => setTagSearch(event.target.value)}
                    placeholder="Search tags…"
                    className="pl-9"
                  />
                </div>

                <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                  {tagOptions
                    .filter((tag) => tag.toLowerCase().includes(tagSearch.toLowerCase()))
                    .map((tag) => {
                      const isSelected =
                        currentUser.role === "healthcare"
                          ? form.interestTags.includes(tag)
                          : form.expertiseTags.includes(tag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            toggleTag(
                              tag,
                              currentUser.role === "healthcare" ? "interestTags" : "expertiseTags",
                            )
                          }
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {tag}
                        </button>
                      );
                    })}
                  {tagOptions.filter((tag) =>
                    tag.toLowerCase().includes(tagSearch.toLowerCase()),
                  ).length === 0 && (
                    <p className="w-full text-center text-xs text-muted-foreground">
                      No tags match “{tagSearch}”.
                    </p>
                  )}
                </div>
              </div>

              {currentUser.role === "engineer" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label className="text-sm">Portfolio summary</Label>
                    <Textarea
                      value={form.portfolioSummary}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          portfolioSummary: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Portfolio links</Label>
                    <Textarea
                      value={form.portfolioLinks}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          portfolioLinks: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">One link per line.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="in-app-notifs"
                    checked={form.inAppNotifications}
                    onCheckedChange={(checked) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        inAppNotifications: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="in-app-notifs" className="text-sm">
                    Enable in-app notifications
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="email-notifs"
                    checked={form.emailNotifications}
                    onCheckedChange={(checked) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        emailNotifications: !!checked,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="email-notifs" className="text-sm">
                      Enable email notifications
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Email delivery is currently a planned/mock preference until backend support is
                      added.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-muted-foreground">Institution</span>
                <span>{currentUser.institution}</span>
              </div>
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-muted-foreground">City</span>
                <span>{currentUser.city}</span>
              </div>
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-muted-foreground">Country</span>
                <span>{currentUser.country}</span>
              </div>
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-muted-foreground">Preferred contact</span>
                <span>
                  {currentUser.preferredContact?.method}: {currentUser.preferredContact?.value}
                </span>
              </div>
              {currentUser.bio && (
                <div className="pt-2">
                  <span className="text-muted-foreground">Bio</span>
                  <p className="mt-1">{currentUser.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6">
          <h3 className="mb-3 text-base font-semibold">
            {currentUser.role === "healthcare" ? "Interest tags" : "Expertise and portfolio"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(currentUser.role === "healthcare" ? currentUser.interestTags : currentUser.expertiseTags).map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
          {currentUser.role === "engineer" && currentUser.portfolioSummary && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">{currentUser.portfolioSummary}</p>
              {currentUser.portfolioLinks.length > 0 && (
                <div className="space-y-1">
                  {currentUser.portfolioLinks.map((link) => (
                    <p key={link} className="text-sm text-primary">
                      {link}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-[28px] border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Data and privacy</h3>
          <p className="text-sm text-muted-foreground">
            The platform keeps discovery and first contact lightweight. Detailed project exchange
            and external follow-up remain outside the product. We comply with GDPR Article 15
            (access) and Article 17 (erasure within 72 hours).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadJson()}>
              <FileJson className="mr-1 h-4 w-4" />
              Export as JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadCsv()}>
              <Download className="mr-1 h-4 w-4" />
              Export as CSV
            </Button>
          </div>
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Account"
        description="This action schedules permanent deletion within 72 hours per GDPR Article 17. Your posts and meeting requests will be removed and you will be signed out. This cannot be undone."
        confirmLabel="Delete My Account"
        destructive
        onConfirm={() => {
          if (!currentUser) return;
          requestAccountDeletion(currentUser.id);
          toast({
            title: "Deletion scheduled",
            description:
              "Your account is queued for hard-deletion within 72 hours. You have been logged out.",
          });
          logout();
          navigate("/");
        }}
      />
    </AppShell>
  );
};

export default ProfilePage;
