import Link from "next/link";
import { Apple, Github, Linkedin, Mail, Play } from "lucide-react";
import { BrandMark } from "./brand-mark";

const companyLinks = [
  ["About", "/info/about"],
  ["Careers", "/info/careers"],
  ["Blog", "/info/blog"],
  ["Press", "/info/press"],
] as const;

const productLinks = [
  ["Book a Ride", "/rider"],
  ["Drive with us", "/driver"],
  ["Pricing", "/info/pricing"],
  ["Safety", "/info/safety"],
] as const;

const supportLinks = [
  ["Help Center", "/info/help-center"],
  ["Contact", "/info/contact"],
  ["Terms of Service", "/info/terms-of-service"],
  ["Privacy Policy", "/info/privacy-policy"],
  ["Cookie Policy", "/info/cookie-policy"],
] as const;

const stack = [
  "Next.js",
  "TypeScript",
  "Tailwind",
  "shadcn/ui",
  "Express",
  "Prisma",
  "Supabase",
  "Socket.io",
  "Stripe",
  "Leaflet",
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/saurabhpandey-",
    icon: Linkedin,
  },
  {
    label: "GitHub",
    href: "https://github.com/SaurabhPandey016",
    icon: Github,
  },
  {
    label: "Email RideX developers",
    href: "mailto:developersaurabh001@gmail.com",
    icon: Mail,
  },
];

function FooterLinks({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-zinc-400 transition-colors hover:text-red-300">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/[0.08] bg-[#08080a]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-red-950/35 via-red-950/10 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 pb-7 pt-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.9fr_1fr] lg:gap-12">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-400">
              Your ride, on demand. Safe, fast and affordable.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-300">
                <Apple aria-hidden="true" className="h-4 w-4" /> App Store
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-300">
                <Play aria-hidden="true" className="h-4 w-4 fill-current" /> Google Play
              </span>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </a>
              ))}
            </div>
            <address className="mt-6 space-y-1 not-italic text-xs leading-5 text-zinc-500">
              <p className="font-medium text-zinc-300">Saurabh Pandey · Full Stack Developer</p>
              <p>Madhya Pradesh, India</p>
              <a className="transition-colors hover:text-red-300" href="mailto:developersaurabh001@gmail.com">
                developersaurabh001@gmail.com
              </a>
            </address>
          </div>

          <FooterLinks title="Company" links={companyLinks} />
          <FooterLinks title="Product" links={productLinks} />
          <FooterLinks title="Support" links={supportLinks} />
        </div>

        <div className="mt-10 border-t border-white/[0.08] pt-6">
          <div className="flex flex-wrap items-center gap-2" aria-label="Technology stack">
            <span className="mr-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Built with</span>
            {stack.map((technology) => (
              <span key={technology} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                {technology}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] pt-5 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-zinc-500">© 2026 RideX. All rights reserved.</p>
            <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              Made with <span aria-label="love" className="heartbeat text-red-500">♥</span> by
              <a
                href="https://www.linkedin.com/in/saurabhpandey-"
                target="_blank"
                rel="noreferrer"
                className="gradient-text font-semibold"
              >
                Saurabh Pandey
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
