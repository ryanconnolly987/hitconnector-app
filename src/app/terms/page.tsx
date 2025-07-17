import { Metadata } from "next";
import StaticPageShell from "@/components/StaticPageShell";

export const metadata: Metadata = { 
  title: "Terms of Service | HitConnector",
  description: "Terms of Service for HitConnector platform - recording studio booking and management service."
};

export default function TermsPage() {
  return (
    <StaticPageShell title="HitConnector Terms of Service">
      <p className="text-muted-foreground">
        <strong>Effective Date:</strong> January 1, 2024<br />
        <strong>Last Updated:</strong> January 1, 2024
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using HitConnector ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of HitConnector per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained on the Platform</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Booking and Payment Terms</h2>
          <p>
            All bookings made through HitConnector are subject to availability and confirmation by the studio. Payment processing is handled securely through our platform. Cancellation policies are set by individual studios and displayed at the time of booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. User Content</h2>
          <p>
            Our service may allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Prohibited Uses</h2>
          <p>You may not use our service:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>For any unlawful purpose or to solicit others to perform illegal acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Disclaimer</h2>
          <p>
            The information on this Platform is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
          <p>
            In no event shall HitConnector, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, punitive, consequential, or special damages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:legal@hitconnector.com" className="text-primary hover:underline">
              legal@hitconnector.com
            </a>
          </p>
        </section>
      </div>
    </StaticPageShell>
  );
} 