import { LegalLayout } from "@/components/legal/legal-layout";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="January 2025">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Introduction</h2>
          <p className="mb-4">
            VitaK Tracker (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our vitamin K tracking application (the &quot;Service&quot;).
          </p>
          <p className="mb-4">
            <strong>Important Medical Privacy Notice:</strong> VitaK Tracker is designed to help you track your vitamin K intake. While we are not a covered entity under HIPAA, we understand the sensitive nature of health information and have implemented appropriate safeguards to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
          <p className="mb-4">When you create an account, we collect:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email address</li>
            <li>Name (optional)</li>
            <li>Authentication data (managed by Clerk)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Health and Usage Data</h3>
          <p className="mb-4">To provide our vitamin K tracking service, we collect:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Vitamin K intake goals and limits (daily, weekly, monthly)</li>
            <li>Food consumption logs and portion sizes</li>
            <li>Calculated vitamin K consumption data</li>
            <li>Meal timing and frequency</li>
            <li>App usage patterns and preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Technical Information</h3>
          <p className="mb-4">We automatically collect certain information when you use our Service:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Device information (type, operating system, browser)</li>
            <li>IP address and location data</li>
            <li>App performance and analytics data</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and maintain the vitamin K tracking service</li>
            <li>Calculate your vitamin K consumption and remaining allowances</li>
            <li>Send you notifications about your vitamin K intake</li>
            <li>Improve our Service and develop new features</li>
            <li>Provide customer support and respond to your inquiries</li>
            <li>Ensure the security and integrity of our Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-semibold mb-3">Third-Party Service Providers</h3>
          <p className="mb-4">We work with trusted third-party providers to operate our Service:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Clerk:</strong> Authentication and user management</li>
            <li><strong>Supabase:</strong> Database hosting and management</li>
            <li><strong>Stripe:</strong> Payment processing for donations</li>
            <li><strong>Upstash:</strong> Redis caching and rate limiting</li>
            <li><strong>Vercel:</strong> Application hosting and analytics</li>
            <li><strong>Discord:</strong> Feedback collection (when you submit feedback)</li>
          </ul>
          <p className="mb-4">
            These providers are contractually obligated to protect your information and use it only for the purposes we specify.
          </p>

          <h3 className="text-xl font-semibold mb-3">We Do Not Sell Your Data</h3>
          <p className="mb-4">
            We do not sell, trade, or rent your personal information or health data to third parties for marketing purposes.
          </p>

          <h3 className="text-xl font-semibold mb-3">Legal Requirements</h3>
          <p className="mb-4">We may disclose your information if required by law or to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Comply with legal processes or government requests</li>
            <li>Protect our rights, property, or safety</li>
            <li>Prevent fraud or abuse of our Service</li>
            <li>Protect the rights, property, or safety of our users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure database hosting with row-level security</li>
            <li>Rate limiting to prevent abuse</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          <p className="mb-4">
            While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Your Rights and Choices</h2>
          
          <h3 className="text-xl font-semibold mb-3">Access and Control</h3>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information and health data</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of non-essential communications</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Data Retention</h3>
          <p className="mb-4">
            We retain your information for as long as your account is active or as needed to provide our Service. You can delete your account at any time, which will permanently remove your data from our systems within 30 days.
          </p>

          <h3 className="text-xl font-semibold mb-3">California Privacy Rights</h3>
          <p className="mb-4">
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to request information about our data practices and to opt out of certain data sharing.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Remember your preferences and settings</li>
            <li>Analyze how you use our Service</li>
            <li>Improve our Service performance</li>
            <li>Provide security features</li>
          </ul>
          <p className="mb-4">
            You can control cookie preferences through your browser settings, but some features may not work properly if you disable cookies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">International Users</h2>
          <p className="mb-4">
            Our Service is hosted in the United States. If you access our Service from outside the United States, your information may be transferred to, stored, and processed in the United States.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Children&apos;s Privacy</h2>
          <p className="mb-4">
            Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Through the feedback form in our app</li>
            <li>By email: privacy@vitaktracker.com</li>
          </ul>
          <p className="mb-4">
            We are committed to resolving any privacy concerns you may have.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}