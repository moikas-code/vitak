import { LegalLayout } from "@/components/legal/legal-layout";

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="January 2025">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
          <p className="mb-4">
            By accessing and using VitaK Tracker (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these terms, then you may not access the Service.
          </p>
        </section>

        <section className="bg-red-50 border-l-4 border-red-400 p-6 rounded">
          <h2 className="text-2xl font-bold mb-4 text-red-800">IMPORTANT MEDICAL DISCLAIMER</h2>
          <div className="text-red-700 space-y-4">
            <p className="font-semibold">
              VitaK Tracker is a dietary tracking tool and is NOT intended to replace professional medical advice, diagnosis, or treatment.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Always consult your healthcare provider</strong> before making any changes to your diet or medication regimen.</li>
              <li><strong>Do not use this app</strong> to make medical decisions or adjust your warfarin dosage.</li>
              <li><strong>In case of emergency</strong> or urgent medical concerns, contact your healthcare provider immediately or call emergency services.</li>
              <li><strong>The vitamin K values</strong> in our database are estimates and may not reflect the exact content in your specific foods.</li>
              <li><strong>Individual responses</strong> to vitamin K intake can vary significantly based on many factors including genetics, medications, and health conditions.</li>
            </ul>
            <p className="font-semibold">
              By using this Service, you acknowledge that you understand these limitations and will not rely solely on this app for medical decisions.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Description of Service</h2>
          <p className="mb-4">
            VitaK Tracker is a web-based application designed to help users track their vitamin K intake through food logging and consumption monitoring. The Service includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Food database with vitamin K content information</li>
            <li>Daily, weekly, and monthly intake tracking</li>
            <li>Progress visualization and alerts</li>
            <li>Historical data analysis</li>
            <li>User account management</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">User Accounts and Responsibilities</h2>
          
          <h3 className="text-xl font-semibold mb-3">Account Creation</h3>
          <p className="mb-4">
            To use certain features of the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized use</li>
            <li>Be responsible for all activities under your account</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Acceptable Use</h3>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Use the Service for any unlawful purpose</li>
            <li>Share medical advice or recommendations with other users</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Submit false or misleading information</li>
            <li>Use automated tools to access the Service without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Data Accuracy and Limitations</h2>
          
          <h3 className="text-xl font-semibold mb-3">Food Database</h3>
          <p className="mb-4">
            Our food database contains vitamin K values sourced from various nutrition databases and scientific literature. However:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Values are estimates and may vary from actual food content</li>
            <li>Preparation methods, storage, and food sources can affect vitamin K levels</li>
            <li>We do not guarantee the accuracy or completeness of nutritional information</li>
            <li>New research may change our understanding of vitamin K content in foods</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Tracking Calculations</h3>
          <p className="mb-4">
            The Service calculates your vitamin K intake based on the foods you log and their estimated vitamin K content. These calculations:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Are estimates based on available data</li>
            <li>May not account for all variables affecting absorption</li>
            <li>Should not be used as the sole basis for medical decisions</li>
            <li>May contain errors due to user input or system calculations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Service Availability</h2>
          <p className="mb-4">
            We strive to maintain the availability of our Service, but we do not guarantee:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Continuous, uninterrupted access to the Service</li>
            <li>Error-free operation of all features</li>
            <li>Compatibility with all devices or browsers</li>
            <li>Permanent availability of any particular feature</li>
          </ul>
          <p className="mb-4">
            We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
          <p className="mb-4">
            The Service and its original content, features, and functionality are owned by VitaK Tracker and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          <p className="mb-4">
            You retain ownership of the data you input into the Service, but you grant us a license to use this data to provide and improve the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Privacy and Data Protection</h2>
          <p className="mb-4">
            Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </p>
          <p className="mb-4">
            By using the Service, you consent to the collection and use of your information as outlined in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded mb-4">
            <p className="text-yellow-800 font-semibold mb-2">
              IMPORTANT LIABILITY LIMITATION:
            </p>
            <p className="text-yellow-700">
              IN NO EVENT SHALL VITAK TRACKER BE LIABLE FOR ANY MEDICAL COMPLICATIONS, HEALTH ISSUES, OR ADVERSE REACTIONS THAT MAY RESULT FROM YOUR USE OF THE SERVICE OR RELIANCE ON THE INFORMATION PROVIDED.
            </p>
          </div>
          <p className="mb-4">
            To the maximum extent permitted by law, VitaK Tracker shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Medical expenses or complications</li>
            <li>Loss of profits or data</li>
            <li>Service interruptions</li>
            <li>Reliance on inaccurate information</li>
            <li>Any other damages arising from your use of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Indemnification</h2>
          <p className="mb-4">
            You agree to defend, indemnify, and hold harmless VitaK Tracker from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt arising from:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your use of and access to the Service</li>
            <li>Your violation of any term of these Terms</li>
            <li>Your violation of any third-party right</li>
            <li>Any medical decisions made based on information from the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms.
          </p>
          <p className="mb-4">
            You may terminate your account at any time by deleting your account through the Service settings or contacting us.
          </p>
          <p className="mb-4">
            Upon termination, your right to use the Service will cease immediately, and your account data will be deleted according to our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Governing Law and Dispute Resolution</h2>
          <p className="mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the United States and the state in which VitaK Tracker is incorporated, without regard to conflict of law provisions.
          </p>
          <p className="mb-4">
            Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect.
          </p>
          <p className="mb-4">
            Your continued use of the Service after any changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Severability</h2>
          <p className="mb-4">
            If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Through the feedback form in our app</li>
            <li>By email: legal@vitaktracker.com</li>
          </ul>
          <p className="mb-4">
            For medical emergencies or urgent health concerns, contact your healthcare provider immediately or call emergency services.
          </p>
        </section>

        <section className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
          <h3 className="text-xl font-semibold mb-3 text-blue-800">Acknowledgment</h3>
          <p className="text-blue-700">
            By using VitaK Tracker, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, including the medical disclaimers and limitations of liability contained herein.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}