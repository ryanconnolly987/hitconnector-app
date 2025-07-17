import { Metadata } from "next";
import StaticPageShell from "@/components/StaticPageShell";

export const metadata: Metadata = { 
  title: "Privacy Policy | HitConnector",
  description: "Privacy Policy for HitConnector platform - how we collect, use, and protect your personal information."
};

export default function PrivacyPage() {
  return (
    <StaticPageShell title="HitConnector Privacy Policy">
      <p className="text-muted-foreground">
        <strong>Effective Date:</strong> January 1, 2024<br />
        <strong>Last Updated:</strong> January 1, 2024
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
          </p>
          <h3 className="text-lg font-medium mt-4 mb-2">Personal Information:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Name, email address, and phone number</li>
            <li>Payment information (processed securely by third-party providers)</li>
            <li>Profile information including bio, music samples, and preferences</li>
            <li>Studio information including location, equipment, and availability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Communicate with you about products, services, and events</li>
            <li>Monitor and analyze trends and usage</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
          </p>
          <h3 className="text-lg font-medium mt-4 mb-2">We may share information:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>With service providers who assist in our operations</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>In connection with a business transfer or merger</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Access and update your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to processing of your personal information</li>
            <li>Request data portability</li>
            <li>Withdraw consent where applicable</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to collect information about your browsing activities and to provide personalized content and targeted advertising.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Third-Party Links</h2>
          <p>
            Our service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. International Users</h2>
          <p>
            If you are accessing our service from outside the United States, please note that your information may be transferred to and processed in the United States.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Updates to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
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