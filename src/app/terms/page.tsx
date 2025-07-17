import StaticPageShell from "@/components/StaticPageShell";

export const metadata = { title: "Terms of Service | HitConnector" };

export default function TermsPage() {
  return (
    <StaticPageShell title="HitConnector Terms of Service">
      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using HitConnector's platform, you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of HitConnector's materials for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained on HitConnector's platform</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Disclaimer</h2>
          <p>
            The materials on HitConnector's platform are provided on an 'as is' basis. HitConnector makes no warranties, 
            expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
            of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Limitations</h2>
          <p>
            In no event shall HitConnector or its suppliers be liable for any damages (including, without limitation, 
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
            to use the materials on HitConnector's platform, even if HitConnector or a HitConnector authorized 
            representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            You are responsible for safeguarding the password and for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Payment Terms</h2>
          <p>
            All payments are processed securely through our payment partners. By making a booking, you agree to pay all 
            charges associated with your account. Cancellation policies vary by studio and will be clearly displayed 
            before booking confirmation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Prohibited Uses</h2>
          <p>You may not use our service:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Revisions and Errata</h2>
          <p>
            The materials appearing on HitConnector's platform could include technical, typographical, or photographic errors. 
            HitConnector does not warrant that any of the materials on its platform are accurate, complete, or current.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">9. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the United States, 
            and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Information</h2>
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