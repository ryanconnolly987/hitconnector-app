import { Metadata } from "next";
import StaticPageShell from "@/components/StaticPageShell";

export const metadata: Metadata = { 
  title: "Contact Us | HitConnector",
  description: "Contact HitConnector for support, partnerships, and general inquiries about our recording studio platform."
};

export default function ContactPage() {
  return (
    <StaticPageShell title="Contact HitConnector">
      <p>
        We'd love to hear from you! Whether you have questions, need support, or want to explore partnership opportunities, our team is here to help.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">General Support</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:support@hitconnector.com" className="text-primary hover:underline">
                    support@hitconnector.com
                  </a>
                </li>
                <li>
                  <strong>Response Time:</strong> Within 24 hours
                </li>
                <li>
                  <strong>Available:</strong> Monday - Friday, 9 AM - 6 PM PST
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Business Partnerships</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:partnerships@hitconnector.com" className="text-primary hover:underline">
                    partnerships@hitconnector.com
                  </a>
                </li>
                <li>
                  <strong>Response Time:</strong> Within 48 hours
                </li>
                <li>
                  <strong>Available:</strong> Monday - Friday, 9 AM - 5 PM PST
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Specialized Support</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Technical Issues</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:tech@hitconnector.com" className="text-primary hover:underline">
                    tech@hitconnector.com
                  </a>
                </li>
                <li>
                  <strong>For:</strong> App bugs, payment issues, account problems
                </li>
                <li>
                  <strong>Response Time:</strong> Within 12 hours
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Studio Onboarding</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:studios@hitconnector.com" className="text-primary hover:underline">
                    studios@hitconnector.com
                  </a>
                </li>
                <li>
                  <strong>For:</strong> Studio setup, profile optimization, booking help
                </li>
                <li>
                  <strong>Response Time:</strong> Within 24 hours
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Legal & Privacy</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Legal Matters</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:legal@hitconnector.com" className="text-primary hover:underline">
                    legal@hitconnector.com
                  </a>
                </li>
                <li>
                  <strong>For:</strong> Terms of service, legal disputes, compliance
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Privacy Concerns</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@hitconnector.com" className="text-primary hover:underline">
                    privacy@hitconnector.com
                  </a>
                </li>
                <li>
                  <strong>For:</strong> Data requests, privacy policy questions
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">How do I create an account?</h3>
              <p className="text-muted-foreground">
                Simply click "Sign Up" on our homepage and choose whether you're an artist or studio owner. Follow the guided setup process to complete your profile.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">How does booking work?</h3>
              <p className="text-muted-foreground">
                Browse studios, check availability, and send a booking request with your project details. Studio owners will review and confirm your request.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards and process payments securely through Stripe. Payment is typically processed after booking confirmation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">How do I list my studio?</h3>
              <p className="text-muted-foreground">
                Sign up as a studio owner, complete your profile with photos and equipment details, set your rates, and start receiving booking requests from artists.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Company Information</h2>
          <div className="space-y-2">
            <p>
              <strong>Company:</strong> HitConnector Inc.
            </p>
            <p>
              <strong>Address:</strong> 123 Music Row, Los Angeles, CA 90028
            </p>
            <p>
              <strong>General Inquiries:</strong>{" "}
              <a href="mailto:hello@hitconnector.com" className="text-primary hover:underline">
                hello@hitconnector.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </StaticPageShell>
  );
} 