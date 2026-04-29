import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "health-ai-cookie-consent";

type Choice = "accepted" | "essential-only";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const persist = (choice: Choice) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, decidedAt: new Date().toISOString() }),
      );
    } catch {
      // ignore storage failures
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md">
      <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">We use only essential cookies</p>
            <p className="mt-1 text-muted-foreground">
              HEALTH AI stores a session token and your sidebar preference. No advertising or
              cross-site tracking. Read more in our{" "}
              <Link to="/privacy" className="text-primary underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => persist("accepted")}>
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={() => persist("essential-only")}>
                Essential only
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => persist("essential-only")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
