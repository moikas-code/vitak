import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">VitaK Tracker</h3>
            <p className="text-gray-600 text-sm">
              A vitamin K tracking application designed to help warfarin patients maintain consistent intake.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Not intended to replace professional medical advice.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vitamin-k-foods-warfarin" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Vitamin K Foods Guide
                </Link>
              </li>
              <li>
                <Link href="/warfarin-diet-tracker" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Diet Tracker Guide
                </Link>
              </li>
              <li>
                <Link href="/inr-vitamin-k-management" className="text-gray-600 hover:text-gray-900 transition-colors">
                  INR Management Tips
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-600">
                  Use the feedback form in the app
                </span>
              </li>
              <li>
                <span className="text-gray-600">
                  For emergencies, contact your healthcare provider
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-6 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © 2024 VitaK Tracker. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}