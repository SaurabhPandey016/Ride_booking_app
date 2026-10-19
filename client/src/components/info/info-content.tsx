import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const infoPages: Record<string, { title: string; description: string; sections: string[] }> = {
  about: {
    title: "A better way to get there.",
    description: "RideX connects riders and drivers with clear pricing, thoughtful technology, and reliable journeys.",
    sections: [
      "We are building a ride experience that keeps people informed from booking through arrival.",
      "RideX brings trip requests, live ride updates, secure payments, and driver feedback together in one place.",
    ],
  },
  drive: {
    title: "Drive with RideX.",
    description: "Set your availability, discover nearby ride requests, and keep control of your driving schedule.",
    sections: [
      "Create a driver account with your vehicle details, then go online when you are ready to receive nearby requests.",
      "See trip details before accepting, keep riders updated on the way, and track your paid-trip earnings in your dashboard.",
    ],
  },
  careers: {
    title: "Build what moves people.",
    description: "We are growing a team focused on useful mobility technology and dependable service.",
    sections: [
      "We are not currently listing open positions. Check back for engineering, operations, and customer experience opportunities.",
      "For career enquiries, contact developersaurabh001@gmail.com.",
    ],
  },
  blog: {
    title: "The RideX journal.",
    description: "Notes on mobility, product updates, and the people shaping a better ride experience.",
    sections: ["The RideX journal is coming soon. We will share product and community updates here."],
  },
  press: {
    title: "RideX in the press.",
    description: "Company information and media enquiries.",
    sections: ["For media enquiries, company details, or interview requests, email developersaurabh001@gmail.com."],
  },
  pricing: {
    title: "Clear fares for every ride.",
    description: "RideX estimates fares from the vehicle type, route distance, and expected trip duration.",
    sections: [
      "Your fare estimate is shown before requesting a ride. The final charge is calculated by RideX using the confirmed route and vehicle category.",
      "Current service categories include Bike, Auto, Cab, and Premium. Applicable taxes are shown separately when supported.",
    ],
  },
  safety: {
    title: "Your safety matters.",
    description: "We design RideX to keep trip details clear and help riders and drivers make informed choices.",
    sections: [
      "Before a trip, confirm the vehicle and driver details shown in your RideX account. Share your trip plans with someone you trust when appropriate.",
      "If you need immediate assistance, contact local emergency services. RideX is not an emergency-response service.",
    ],
  },
  help: {
    title: "How can we help?",
    description: "Find support for bookings, accounts, payments, and driver profiles.",
    sections: [
      "For help with a ride or account, include the email address on your RideX account and the ride or receipt number when you contact support.",
      "Email developersaurabh001@gmail.com and we will direct your request to the right place.",
    ],
  },
  "help-center": {
    title: "How can we help?",
    description: "Find support for bookings, accounts, payments, and driver profiles.",
    sections: [
      "For help with a ride or account, include the email address on your RideX account and the ride or receipt number when you contact support.",
      "Email developersaurabh001@gmail.com and we will direct your request to the right place.",
    ],
  },
  contact: {
    title: "Contact the RideX team.",
    description: "Questions, feedback, or partnership ideas are welcome.",
    sections: ["Saurabh Pandey · Full Stack Developer", "Madhya Pradesh, India", "Email: developersaurabh001@gmail.com"],
  },
  terms: {
    title: "Terms of Service",
    description: "A plain-language placeholder for the terms that apply when using RideX.",
    sections: [
      "This page is a draft placeholder, not legal advice or a complete contract. Before public launch, replace it with terms reviewed for the jurisdictions where RideX operates.",
      "Use RideX lawfully, provide accurate account information, and do not misuse the service or interfere with other users.",
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    description: "A plain-language placeholder for the terms that apply when using RideX.",
    sections: [
      "This page is a draft placeholder, not legal advice or a complete contract. Before public launch, replace it with terms reviewed for the jurisdictions where RideX operates.",
      "Use RideX lawfully, provide accurate account information, and do not misuse the service or interfere with other users.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "A placeholder describing how RideX may handle account and trip information.",
    sections: [
      "This page is a draft placeholder, not a complete privacy notice. Before public launch, document the data collected, purposes, retention, sharing, and user rights, and obtain appropriate legal review.",
      "RideX should only use personal information to provide and support the service, protect users, and meet legal obligations.",
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description: "A placeholder describing how RideX may handle account and trip information.",
    sections: [
      "This page is a draft placeholder, not a complete privacy notice. Before public launch, document the data collected, purposes, retention, sharing, and user rights, and obtain appropriate legal review.",
      "RideX should only use personal information to provide and support the service, protect users, and meet legal obligations.",
    ],
  },
  cookies: {
    title: "Cookie Policy",
    description: "A placeholder describing browser storage and similar technologies.",
    sections: [
      "This page is a draft placeholder. Before public launch, identify the cookies and local storage used by the production app and explain their purposes and controls.",
      "RideX uses browser storage for preferences such as display currency. Authentication is maintained using a secure, HTTP-only cookie.",
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description: "A placeholder describing browser storage and similar technologies.",
    sections: [
      "This page is a draft placeholder. Before public launch, identify the cookies and local storage used by the production app and explain their purposes and controls.",
      "RideX uses browser storage for preferences such as display currency. Authentication is maintained using a secure, HTTP-only cookie.",
    ],
  },
};

export const infoSlugs = Object.keys(infoPages);

export function InfoContent({ slug }: { slug: string }) {
  const page = infoPages[slug];
  if (!page) notFound();

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
      <BrandMark />
      <div className="mt-12 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">RideX information</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-400">{page.description}</p>
        <Card className="mt-9 border-white/[0.08] bg-white/[0.025]">
          <CardHeader>
            <CardTitle className="text-base">More about this page</CardTitle>
            <CardDescription>Information from the RideX team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-300">
            {page.sections.map((section) => <p key={section}>{section}</p>)}
          </CardContent>
        </Card>
        <Button asChild variant="outline" className="mt-8 rounded-full border-white/10">
          <Link href="/"><ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />Back to RideX</Link>
        </Button>
        <Link href="/auth" className="ml-5 inline-flex items-center text-sm font-medium text-red-300 hover:text-red-200">
          Get started <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
