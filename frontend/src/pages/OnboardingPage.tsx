import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { domainOptions, expertiseOptions } from "@/data/mockData";
import { ShieldCheck } from "lucide-react";

const contactMethods = ["Email", "Phone", "LinkedIn", "Other"] as const;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { currentUser, completeOnboarding, logout } = useAuth();
  const [institution, setInstitution] = useState(currentUser?.institution ?? "");
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [country, setCountry] = useState(currentUser?.country ?? "");
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [contactMethod, setContactMethod] = useState<
    "Email" | "Phone" | "LinkedIn" | "Other"
  >(currentUser?.preferredContact?.method ?? "Email");
  const [contactValue, setContactValue] = useState(
    currentUser?.preferredContact?.value ?? currentUser?.email ?? "",
  );
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    currentUser?.interestTags.filter((tag) => domainOptions.includes(tag)) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    currentUser?.role === "healthcare"
      ? currentUser?.interestTags.filter((tag) => !domainOptions.includes(tag)) ?? []
      : currentUser?.expertiseTags ?? [],
  );
  const [portfolioSummary, setPortfolioSummary] = useState(
    currentUser?.portfolioSummary ?? "",
  );
  const [portfolioLinksInput, setPortfolioLinksInput] = useState(
    currentUser?.portfolioLinks.join("\n") ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pageTitle = useMemo(() => {
    if (currentUser?.role === "healthcare") {
      return "Finish your healthcare profile";
    }

    return "Finish your engineering profile";
  }, [currentUser?.role]);

  if (!currentUser) {
    return null;
  }

  const toggleValue = (value: string, setter: Dispatch<SetStateAction<string[]>>) =>
    setter((currentValues) =>
      currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value],
    );

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!institution.trim()) nextErrors.institution = "Institution is required";
    if (!city.trim()) nextErrors.city = "City is required";
    if (!country.trim()) nextErrors.country = "Country is required";
    if (!bio.trim()) nextErrors.bio = "Add a short bio";
    if (!contactValue.trim()) nextErrors.contactValue = "Preferred contact is required";

    if (currentUser.role === "healthcare") {
      if (selectedDomains.length === 0) {
        nextErrors.domains = "Choose at least one focus domain";
      }

      if (selectedTags.length === 0) {
        nextErrors.interests = "Choose at least one interest tag";
      }
    }

    if (currentUser.role === "engineer") {
      if (selectedTags.length === 0) {
        nextErrors.expertise = "Choose at least one expertise tag";
      }

      if (!portfolioSummary.trim()) {
        nextErrors.portfolioSummary = "Add a short portfolio summary";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    completeOnboarding({
      institution,
      city,
      country,
      bio,
      preferredContact: {
        method: contactMethod,
        value: contactValue,
      },
      interestTags:
        currentUser.role === "healthcare"
          ? [...new Set([...selectedDomains, ...selectedTags])]
          : [],
      expertiseTags: currentUser.role === "engineer" ? selectedTags : currentUser.expertiseTags,
      portfolioSummary: currentUser.role === "engineer" ? portfolioSummary : "",
      portfolioLinks:
        currentUser.role === "engineer"
          ? portfolioLinksInput
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              First Login Setup
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{pageTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Keep this fast and high-level. We only collect enough profile context to match
              people well and support a safe first external handoff.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Log Out
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Trust and privacy</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No patient data, project files, or sensitive implementation details belong on
                this platform. Use your profile to enable trusted first contact only.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
                placeholder="University or hospital"
                className="mt-1"
              />
              {errors.institution && (
                <p className="mt-1 text-xs text-destructive">{errors.institution}</p>
              )}
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ankara"
                className="mt-1"
              />
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="Turkey"
                className="mt-1"
              />
              {errors.country && (
                <p className="mt-1 text-xs text-destructive">{errors.country}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contactMethod">Preferred external contact</Label>
              <div className="mt-1 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                <Select
                  value={contactMethod}
                  onValueChange={(value) =>
                    setContactMethod(value as "Email" | "Phone" | "LinkedIn" | "Other")
                  }
                >
                  <SelectTrigger id="contactMethod">
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
                  value={contactValue}
                  onChange={(event) => setContactValue(event.target.value)}
                  placeholder="name@institution.edu.tr"
                />
              </div>
              {errors.contactValue && (
                <p className="mt-1 text-xs text-destructive">{errors.contactValue}</p>
              )}
            </div>
          </section>

          <section>
            <Label htmlFor="bio">Short bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="mt-1"
              placeholder="Introduce your expertise, interests, and what kind of collaboration you want to explore."
            />
            {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio}</p>}
          </section>

          {currentUser.role === "healthcare" && (
            <>
              <section>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold">Interest domains</h2>
                    <p className="text-sm text-muted-foreground">
                      These shape the personalized discovery feed on your dashboard.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {domainOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleValue(option, setSelectedDomains)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        selectedDomains.includes(option)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.domains && (
                  <p className="mt-2 text-xs text-destructive">{errors.domains}</p>
                )}
              </section>

              <section>
                <h2 className="text-base font-semibold">Specialties and interests</h2>
                <p className="text-sm text-muted-foreground">
                  Pick tags that best describe the announcements you want to see first.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {expertiseOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleValue(option, setSelectedTags)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        selectedTags.includes(option)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.interests && (
                  <p className="mt-2 text-xs text-destructive">{errors.interests}</p>
                )}
              </section>
            </>
          )}

          {currentUser.role === "engineer" && (
            <>
              <section>
                <h2 className="text-base font-semibold">Expertise</h2>
                <p className="text-sm text-muted-foreground">
                  These tags help healthcare professionals discover you through relevant posts.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {expertiseOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleValue(option, setSelectedTags)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        selectedTags.includes(option)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.expertise && (
                  <p className="mt-2 text-xs text-destructive">{errors.expertise}</p>
                )}
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="portfolioSummary">Portfolio summary</Label>
                  <Textarea
                    id="portfolioSummary"
                    value={portfolioSummary}
                    onChange={(event) => setPortfolioSummary(event.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="Summarize the kind of systems, products, or research prototypes you build."
                  />
                  {errors.portfolioSummary && (
                    <p className="mt-1 text-xs text-destructive">{errors.portfolioSummary}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="portfolioLinks">Portfolio links</Label>
                  <Textarea
                    id="portfolioLinks"
                    value={portfolioLinksInput}
                    onChange={(event) => setPortfolioLinksInput(event.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="One link per line"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Links only. No file uploads are collected in this frontend.
                  </p>
                </div>
              </section>
            </>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border/70 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Back to Landing
            </Button>
            <Button type="submit">Complete setup</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
