import StaticPageShell from "@/components/StaticPageShell";

export const metadata = { title: "Contact Us | HitConnector" };

export default function ContactPage() {
  return (
    <StaticPageShell title="Contact Us">
      <div className="space-y-6 text-muted-foreground">
        <section>
          <p className="text-lg">
            We're here to help! Reach out to us with any questions, concerns, or feedback about HitConnector.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">General Support</h2>
          <p>
            For general questions about using HitConnector, account issues, or technical support:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:support@hitconnector.com" className="text-primary hover:underline">
                support@hitconnector.com
              </a>
            </li>
            <li>Response time: Within 24 hours on business days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Business Inquiries</h2>
          <p>
            For partnership opportunities, business development, or media inquiries:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:business@hitconnector.com" className="text-primary hover:underline">
                business@hitconnector.com
              </a>
            </li>
            <li>Response time: Within 48 hours on business days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Technical Issues</h2>
          <p>
            Experiencing bugs, payment problems, or other technical difficulties:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:tech@hitconnector.com" className="text-primary hover:underline">
                tech@hitconnector.com
              </a>
            </li>
            <li>Response time: Within 12 hours, priority given to urgent issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Legal & Privacy</h2>
          <p>
            For legal matters, privacy concerns, or data requests:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:legal@hitconnector.com" className="text-primary hover:underline">
                legal@hitconnector.com
              </a>
            </li>
            <li>Response time: Within 5 business days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Studio Onboarding</h2>
          <p>
            New studios looking to join our platform or need help setting up:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:studios@hitconnector.com" className="text-primary hover:underline">
                studios@hitconnector.com
              </a>
            </li>
            <li>Response time: Within 24 hours on business days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Feedback & Suggestions</h2>
          <p>
            Have ideas for improving HitConnector? We'd love to hear from you:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:feedback@hitconnector.com" className="text-primary hover:underline">
                feedback@hitconnector.com
              </a>
            </li>
            <li>Response time: We read all feedback, responses as needed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Office Hours</h2>
          <p>
            Our support team operates during the following hours:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Monday - Friday: 9:00 AM - 6:00 PM (PST)</li>
            <li>Saturday: 10:00 AM - 4:00 PM (PST)</li>
            <li>Sunday: Closed (emergency issues only)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Mailing Address</h2>
          <p>
            HitConnector Inc.<br />
            123 Music Row<br />
            Los Angeles, CA 90028<br />
            United States
          </p>
        </section>
      </div>
    </StaticPageShell>
  );
} 