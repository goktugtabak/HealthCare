import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  collaborationTypes,
  commitmentLevels,
  confidentialityLevels,
  domainOptions,
  expertiseOptions,
  stageOptions,
} from "@/data/mockData";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";

const CreateEditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createPost, posts, updatePost } = usePlatformData();
  const existing = useMemo(() => posts.find((post) => post.id === id) ?? null, [id, posts]);
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title: existing?.title ?? "",
    workingDomain: existing?.workingDomain ?? "",
    shortExplanation: existing?.shortExplanation ?? "",
    requiredExpertise: existing?.requiredExpertise ?? ([] as string[]),
    projectStage: existing?.projectStage ?? "",
    collaborationType: existing?.collaborationType ?? "",
    confidentialityLevel: existing?.confidentialityLevel ?? "Confidential",
    country: existing?.country ?? currentUser?.country ?? "",
    city: existing?.city ?? currentUser?.city ?? "",
    commitmentLevel: existing?.commitmentLevel ?? "",
    highLevelIdea: existing?.highLevelIdea ?? "",
    expiryDate: existing?.expiryDate ?? "",
    autoClose: existing?.autoClose ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) {
    return null;
  }

  const updateField = (key: string, value: unknown) =>
    setForm((currentForm) => ({ ...currentForm, [key]: value }));

  const toggleExpertise = (tag: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      requiredExpertise: currentForm.requiredExpertise.includes(tag)
        ? currentForm.requiredExpertise.filter((currentTag) => currentTag !== tag)
        : [...currentForm.requiredExpertise, tag],
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.workingDomain) nextErrors.workingDomain = "Domain is required";
    if (!form.shortExplanation.trim()) {
      nextErrors.shortExplanation = "Add a short high-level explanation";
    }
    if (form.requiredExpertise.length === 0) {
      nextErrors.requiredExpertise = "Select at least one expertise tag";
    }
    if (!form.projectStage) nextErrors.projectStage = "Stage is required";
    if (!form.city.trim()) nextErrors.city = "City is required";
    if (!form.country.trim()) nextErrors.country = "Country is required";
    if (!form.highLevelIdea.trim()) nextErrors.highLevelIdea = "Add a high-level idea";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = (publish: boolean) => {
    if (!validate()) {
      return;
    }

    if (isEdit && existing) {
      updatePost(existing.id, {
        ...form,
        publish,
      });
      toast({
        title: publish ? "Post updated" : "Changes saved",
        description:
          "Your post remains high-level and attachment-free. Sensitive discussion should stay off-platform.",
      });
    } else {
      createPost({
        ownerId: currentUser.id,
        ownerRole: currentUser.role,
        ...form,
        publish,
      });
      toast({
        title: publish ? "Post published" : "Draft saved",
        description:
          "The post now presents a high-level brief only. Files and sensitive details remain off-platform.",
      });
    }

    navigate("/my-posts");
  };

  const Field = ({
    id,
    label,
    error,
    helperText,
    children,
  }: {
    id: string;
    label: string;
    error?: string;
    helperText?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {helperText && <p className="mb-1 mt-0.5 text-xs text-muted-foreground">{helperText}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <AppShell>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mx-auto max-w-3xl animate-fade-in">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit post" : "Create new post"}
        </h1>

        <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">High-level brief only</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This page should describe the collaboration need, not expose files, datasets,
                prototypes, or sensitive project specifics. Save those for external discussions.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="space-y-4 rounded-[28px] border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Basic information</h2>
            <Field
              id="title"
              label="Title"
              error={errors.title}
              helperText="Name the collaboration clearly so the right partner can decide quickly."
            >
              <Input
                id="title"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="e.g. Cardiology AI assistant for ECG interpretation"
              />
            </Field>
            <Field id="workingDomain" label="Working domain" error={errors.workingDomain}>
              <Select
                value={form.workingDomain}
                onValueChange={(value) => updateField("workingDomain", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domainOptions.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              id="shortExplanation"
              label="Short explanation"
              error={errors.shortExplanation}
              helperText="Keep this brief. Enough to attract a first conversation, not enough to expose the whole project."
            >
              <Textarea
                id="shortExplanation"
                value={form.shortExplanation}
                onChange={(event) => updateField("shortExplanation", event.target.value)}
                rows={3}
              />
            </Field>
          </section>

          <section className="rounded-[28px] border border-border bg-card p-6">
            <h2 className="mb-2 text-base font-semibold">Required expertise</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Select the tags that should trigger strong profile matches.
            </p>
            <div className="flex flex-wrap gap-2">
              {expertiseOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleExpertise(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    form.requiredExpertise.includes(tag)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.requiredExpertise && (
              <p className="mt-2 text-xs text-destructive">{errors.requiredExpertise}</p>
            )}
          </section>

          <section className="space-y-4 rounded-[28px] border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Project details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="projectStage" label="Project stage" error={errors.projectStage}>
                <Select
                  value={form.projectStage}
                  onValueChange={(value) => updateField("projectStage", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="collaborationType" label="Collaboration type">
                <Select
                  value={form.collaborationType}
                  onValueChange={(value) => updateField("collaborationType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="confidentialityLevel" label="Confidentiality level">
                <Select
                  value={form.confidentialityLevel}
                  onValueChange={(value) => updateField("confidentialityLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {confidentialityLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="commitmentLevel" label="Commitment level">
                <Select
                  value={form.commitmentLevel}
                  onValueChange={(value) => updateField("commitmentLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {commitmentLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-[28px] border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Location</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="city" label="City" error={errors.city}>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Ankara"
                />
              </Field>
              <Field id="country" label="Country" error={errors.country}>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Turkey"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-[28px] border border-border bg-card p-6">
            <h2 className="text-base font-semibold">High-level idea</h2>
            <Field
              id="highLevelIdea"
              label="What should the first external conversation cover?"
              error={errors.highLevelIdea}
              helperText="Summarize the challenge and the intended first meeting. Do not paste confidential assets here."
            >
              <Textarea
                id="highLevelIdea"
                value={form.highLevelIdea}
                onChange={(event) => updateField("highLevelIdea", event.target.value)}
                rows={4}
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-[28px] border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Post settings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="expiryDate" label="Expiry date">
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(event) => updateField("expiryDate", event.target.value)}
                />
              </Field>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoClose"
                    checked={form.autoClose}
                    onCheckedChange={(checked) => updateField("autoClose", !!checked)}
                  />
                  <Label htmlFor="autoClose" className="text-sm">
                    Auto-close when a partner is found
                  </Label>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => handleSave(false)}>
              Save draft
            </Button>
            <Button onClick={() => handleSave(true)}>
              {isEdit ? "Save and keep live" : "Publish post"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateEditPostPage;
