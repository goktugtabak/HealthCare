import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm leading-6 text-muted-foreground">
            <section>
              <h2 className="text-base font-semibold text-foreground">1. The platform</h2>
              <p>
                HEALTH AI is a structured first-contact platform for engineers and healthcare
                professionals. It is <strong>not</strong> a clinical decision-support tool, an EHR,
                a messaging product for patient data, or a marketplace.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">2. Acceptable use</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Do not share patient data, identifiers, images, or sensitive clinical content.</li>
                <li>Do not upload files (the platform does not support uploads by design).</li>
                <li>Do not impersonate a role or institution.</li>
                <li>
                  Treat NDAs and confidentiality acknowledgements seriously — they are logged.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">3. Account responsibilities</h2>
              <p>
                Use an institutional email when possible. The platform may suspend accounts that
                violate acceptable use, and may deactivate inactive accounts. Hard-deletion of an
                account occurs within 72 hours of a deletion request.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">4. Off-platform handoff</h2>
              <p>
                Any meeting that follows from a first contact is the responsibility of the parties
                involved. HEALTH AI does not host video calls, share files, or store meeting
                content beyond the high-level metadata required to coordinate the introduction.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">5. Disclaimers</h2>
              <p>
                The platform is provided "as is" for the SENG 384 academic context. No warranty is
                given for production use. Outputs are not medical advice.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">6. Changes</h2>
              <p>
                We may update these terms; material changes are surfaced via in-app notification.
                Continued use after a change indicates acceptance.
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/privacy")}>Read Privacy Policy</Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
