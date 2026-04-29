import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const PrivacyPolicyPage = () => {
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
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm leading-6 text-muted-foreground">
            <section>
              <h2 className="text-base font-semibold text-foreground">1. Data we collect</h2>
              <p>
                HEALTH AI is a high-level partner-discovery platform. We deliberately collect the
                minimum information needed to facilitate first contact: your name, institutional
                email, role, city/country, expertise/interest tags, and a short bio.
              </p>
              <p>
                <strong>We never store patient data, clinical records, or sensitive project
                content.</strong> Detailed exchanges happen off-platform after both sides agree.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">2. Why we process it</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Match engineers and healthcare professionals on shared interests.</li>
                <li>Authenticate accounts and protect the platform from abuse.</li>
                <li>Maintain an append-only audit log of platform actions (24-month retention).</li>
                <li>Send transactional notifications (request received, accepted, declined).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">3. Your rights (GDPR)</h2>
              <p>You can at any time:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Access &amp; export</strong> your data — Profile → Data and privacy →
                  Export My Data.
                </li>
                <li>
                  <strong>Delete</strong> your account — Profile → Delete Account. We hard-delete
                  within <strong>72 hours</strong> of the request.
                </li>
                <li>Correct inaccurate information by editing your profile.</li>
                <li>Object to or restrict processing — contact privacy@healthai.example.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">
                4. KVKK compliance (Türkiye)
              </h2>
              <p>
                HEALTH AI, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri
                sorumlusu sıfatıyla hareket eder. Kullanıcılar, KVKK Madde 11 kapsamındaki haklarını
                (bilgi alma, düzeltme, silme, itiraz) kvkk@healthai.example adresinden
                kullanabilirler. Verileriniz Türkiye sınırları içinde tutulan altyapımızda
                işlenmektedir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">5. Cookies</h2>
              <p>
                We use only strictly-necessary cookies and localStorage entries (auth session,
                sidebar preference, cookie consent). No third-party advertising or analytics
                cookies are set.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">6. Security</h2>
              <p>
                Passwords are hashed with bcrypt. Sessions expire after 30 minutes of inactivity.
                Audit logs are append-only with hash-chained integrity markers and a 24-month
                retention window.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
              <p>
                Questions? Email{" "}
                <a className="text-primary underline" href="mailto:privacy@healthai.example">
                  privacy@healthai.example
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/terms")}>Read Terms of Service</Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
