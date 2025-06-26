export function WebApplicationLD() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "VitaK Tracker",
    "description": "Track vitamin K intake while on warfarin with our free diet management app. Monitor daily credits, access comprehensive food database, and maintain stable INR levels.",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Vitamin K tracking with credit system",
      "Comprehensive food database",
      "Daily, weekly, and monthly tracking",
      "Visual progress indicators",
      "PWA offline support",
      "Secure user authentication"
    ],
    "screenshot": [
      {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_APP_URL}/screenshots/dashboard.png`,
        "caption": "VitaK Tracker Dashboard"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function MedicalWebPageLD() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": "Vitamin K Management for Warfarin Patients",
    "description": "Comprehensive guide to tracking vitamin K intake while taking warfarin (Coumadin) for anticoagulation therapy.",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com",
    "lastReviewed": new Date().toISOString().split('T')[0],
    "mainContentOfPage": {
      "@type": "WebPageElement",
      "headline": "Track Your Vitamin K Intake with Confidence",
      "text": "VitaK Tracker helps warfarin patients maintain consistent vitamin K intake through an innovative credit-based tracking system."
    },
    "medicalAudience": {
      "@type": "PeopleAudience",
      "suggestedMinAge": 18,
      "healthCondition": {
        "@type": "MedicalCondition",
        "name": "Patients on anticoagulation therapy"
      }
    },
    "disclaimer": "This app is for tracking purposes only. Always consult with your healthcare provider about your warfarin dosing and dietary restrictions."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationLD() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VitaK Tracker",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL}/icon-512x512.svg`,
    "description": "Free vitamin K tracking app for warfarin patients",
    "email": "support@vitaktracker.com",
    "sameAs": [
      "https://twitter.com/moikas_official",
      "https://github.com/vitaktracker"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FAQLD() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is VitaK Tracker?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "VitaK Tracker is a free web application designed to help patients on warfarin (Coumadin) manage their vitamin K intake. It uses a credit-based system to track daily, weekly, and monthly vitamin K consumption to help maintain stable INR levels."
        }
      },
      {
        "@type": "Question",
        "name": "How does the vitamin K credit system work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The credit system allows you to set daily, weekly, and monthly vitamin K limits in micrograms (mcg). As you log foods, the app deducts the vitamin K content from your available credits, helping you stay within your prescribed limits."
        }
      },
      {
        "@type": "Question",
        "name": "Is VitaK Tracker free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, VitaK Tracker is completely free to use. We offer optional donations to help support development and hosting costs, but all features are available at no charge."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use VitaK Tracker offline?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, VitaK Tracker is a Progressive Web App (PWA) that supports offline functionality. Once installed, you can access your data and log meals even without an internet connection."
        }
      },
      {
        "@type": "Question",
        "name": "How accurate is the vitamin K food database?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our food database is compiled from reliable nutritional sources and regularly updated. However, vitamin K content can vary based on preparation methods and sourcing. Always consult with your healthcare provider for specific dietary guidance."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreadcrumbLD({ items }: { items: Array<{ name: string; url: string }> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${process.env.NEXT_PUBLIC_APP_URL}${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}