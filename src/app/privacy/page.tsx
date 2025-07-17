import StaticPageShell from "@/components/StaticPageShell";

export const metadata = { title: "Privacy Policy | HitConnector" };

export default function PrivacyPage() {
  return (
    <StaticPageShell title="Privacy Policy">
      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, make a booking, 
            or contact us for support. This may include your name, email address, phone number, payment information, 
            and any other information you choose to provide.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Communicate with you about products, services, and events</li>
            <li>Monitor and analyze trends, usage, and activities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
            except as described in this policy. We may share your information with:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Service providers who assist us in operating our platform</li>
            <li>Studios when you make a booking (name and contact information)</li>
            <li>Law enforcement when required by law</li>
            <li>Other parties with your explicit consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the 
            internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to collect and store information about how you use our service. 
            You can control cookies through your browser settings, but disabling cookies may affect your ability to use 
            certain features of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to processing of your information</li>
            <li>Request data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Children's Privacy</h2>
          <p>
            Our service is not intended for children under the age of 13. We do not knowingly collect personal 
            information from children under 13. If you become aware that a child has provided us with personal 
            information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new 
            privacy policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@hitconnector.com" className="text-primary hover:underline">
              privacy@hitconnector.com
            </a>
          </p>
        </section>
      </div>
    </StaticPageShell>
  );
} 