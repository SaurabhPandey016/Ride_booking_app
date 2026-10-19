"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CarFront,
  ChevronDown,
  CircleUserRound,
  History,
  LogOut,
  Menu,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api, normalizeApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { CurrencyToggle } from "@/components/shared/currency-toggle";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Book a Ride", href: "/book" },
  { label: "Drive with us", href: "/driver" },
  { label: "History", href: "/history" },
  { label: "About", href: "/info/about" },
];

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      clearAuth();
      setLoading(false);
      toast.success("You have been signed out.");
      router.push("/");
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const renderNavLinks = (mobile = false) =>
    navigationLinks.map(({ label, href }) => (
      <Link
        key={href}
        href={href}
        onClick={() => mobile && setMobileMenuOpen(false)}
        aria-current={isActive(href) ? "page" : undefined}
        className={
          mobile
            ? `flex min-h-12 items-center rounded-lg px-4 text-base font-medium transition-colors ${
                isActive(href)
                  ? "bg-red-500/10 text-red-300"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`
            : `relative flex min-h-12 items-center px-1 text-sm font-medium transition-colors after:absolute after:bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-red-500 after:transition-transform after:duration-300 hover:text-white ${
                isActive(href)
                  ? "text-white after:scale-x-100"
                  : "text-zinc-400 hover:after:scale-x-50"
              }`
        }
      >
        {label}
      </Link>
    ));

  const accountActions = (
    <>
      <DropdownMenuItem asChild>
        <Link href="/profile"><UserRound aria-hidden="true" className="mr-2 h-4 w-4" />Profile</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/history"><History aria-hidden="true" className="mr-2 h-4 w-4" />Ride history</Link>
      </DropdownMenuItem>
      {user?.role === "DRIVER" && (
        <DropdownMenuItem asChild>
          <Link href="/driver/earnings"><Wallet aria-hidden="true" className="mr-2 h-4 w-4" />Earnings</Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void logout(); }}>
        <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />Log out
      </DropdownMenuItem>
    </>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-zinc-950/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          : "border-transparent bg-zinc-950/55 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLink />

        <nav aria-label="Main navigation" className="hidden items-center gap-3 lg:flex xl:gap-5">
          {renderNavLinks()}
        </nav>

        <div className="hidden items-center gap-1 lg:flex xl:gap-2">
          <CurrencyToggle />
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-3">
                  <Avatar className="h-8 w-8 border border-red-500/30 bg-red-500/15 text-red-200">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-28 truncate text-sm">{user.name}</span>
                  <ChevronDown aria-hidden="true" className="h-4 w-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {accountActions}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/auth">Log in</Link>
              </Button>
              <Button asChild className="gradient-red rounded-full px-5 text-white hover:brightness-110">
                <Link href="/auth">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <CurrencyToggle compact />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-white/10 bg-white/[0.04]"
                aria-label="Open navigation menu"
              >
                <Menu aria-hidden="true" className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(88vw,22rem)] flex-col border-white/10 bg-zinc-950 p-5">
              <SheetHeader>
                <SheetTitle className="text-left"><BrandLink onClick={() => setMobileMenuOpen(false)} /></SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="mt-7 flex flex-col gap-1">
                {renderNavLinks(true)}
              </nav>
              <div className="mt-auto grid gap-3 pt-8">
                {!isLoading && user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <Avatar className="h-10 w-10 border border-red-500/30 bg-red-500/15 text-red-200">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                    <SheetClose asChild>
                      <Link href="/profile" className="flex min-h-12 items-center gap-3 rounded-lg px-4 text-zinc-300 hover:bg-white/5">
                        <CircleUserRound aria-hidden="true" className="h-4 w-4" />Profile
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/history" className="flex min-h-12 items-center gap-3 rounded-lg px-4 text-zinc-300 hover:bg-white/5">
                        <History aria-hidden="true" className="h-4 w-4" />Ride history
                      </Link>
                    </SheetClose>
                    {user.role === "DRIVER" && (
                      <SheetClose asChild>
                        <Link href="/driver/earnings" className="flex min-h-12 items-center gap-3 rounded-lg px-4 text-zinc-300 hover:bg-white/5">
                          <Wallet aria-hidden="true" className="h-4 w-4" />Earnings
                        </Link>
                      </SheetClose>
                    )}
                    <Button className="min-h-12 w-full" variant="outline" onClick={() => { setMobileMenuOpen(false); void logout(); }}>
                      <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="min-h-12 w-full border-white/10">
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                    </Button>
                    <Button asChild className="gradient-red min-h-12 w-full text-white hover:brightness-110">
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function BrandLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5">
      <span className="gradient-red glow-red flex h-9 w-9 items-center justify-center rounded-xl text-white">
        <CarFront aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">RideX</span>
    </Link>
  );
}
