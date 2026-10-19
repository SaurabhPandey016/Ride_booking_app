"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CarFront,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthIntro } from "@/components/auth/auth-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { api, normalizeApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser, UserRole } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const vehicleTypeSchema = z.enum(["BIKE", "AUTO", "CAB", "PREMIUM"]);

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    role: z.enum(["RIDER", "DRIVER"]),
    vehicleType: vehicleTypeSchema.optional(),
    vehicleModel: z.string().optional(),
    vehicleNumber: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.role !== "DRIVER") return;

    if (!values.vehicleType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose your vehicle type",
        path: ["vehicleType"],
      });
    }
    if (!values.vehicleModel?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your vehicle model",
        path: ["vehicleModel"],
      });
    }
    if (!values.vehicleNumber?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your vehicle registration number",
        path: ["vehicleNumber"],
      });
    }
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type AuthResponse = { data: { user: AuthUser } };

const fieldClassName =
  "h-11 border-white/10 bg-black/25 pl-10 placeholder:text-zinc-600 focus-visible:bg-black/40";

function getSafeRedirect(): string | null {
  const params = new URLSearchParams(window.location.search);
  const destination = params.get("redirect") ?? params.get("next");
  if (!destination || !destination.startsWith("/") || destination.startsWith("//") || destination.includes("\\")) {
    return null;
  }

  try {
    const url = new URL(destination, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

function passwordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[A-Za-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Weak" : score <= 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  const color =
    score <= 1 ? "bg-red-500" : score === 2 ? "bg-amber-400" : score === 3 ? "bg-lime-400" : "bg-emerald-400";
  return { score, label, color };
}

export default function AuthPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "RIDER",
    },
    mode: "onTouched",
  });
  const role = registerForm.watch("role");
  const registerPassword = registerForm.watch("password") ?? "";
  const strength = passwordStrength(registerPassword);

  const redirectForRole = useCallback((userRole: UserRole) => {
    router.replace(getSafeRedirect() ?? (userRole === "DRIVER" ? "/driver" : "/book"));
  }, [router]);

  useEffect(() => {
    if (!isLoading && user) {
      redirectForRole(user.role);
    }
  }, [isLoading, redirectForRole, user]);

  const refreshUser = async () => {
    const response = await api.get<AuthResponse>("/auth/me");
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  const submitLogin = loginForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await api.post("/auth/login", values);
      const authenticatedUser = await refreshUser();
      toast.success("Welcome back to RideX.");
      redirectForRole(authenticatedUser.role);
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const submitRegister = registerForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const payload =
        values.role === "DRIVER"
          ? values
          : {
              name: values.name,
              email: values.email,
              phone: values.phone,
              password: values.password,
              role: values.role,
            };
      await api.post("/auth/register", payload);
      const authenticatedUser = await refreshUser();
      toast.success("Your RideX account is ready.");
      redirectForRole(authenticatedUser.role);
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  });

  if (isLoading || user) {
    return (
      <main className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center">
        <LoaderCircle aria-label="Loading your account" className="h-7 w-7 animate-spin text-red-400" />
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-[calc(100vh-4.5rem)] overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-red-950/25 blur-[120px]" />
        <div className="hero-grid absolute inset-0 opacity-30" />
      </div>

      <div className="mx-auto grid min-h-[min(780px,calc(100vh-8rem))] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
        <AuthIntro />

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto w-full max-w-xl"
        >
          <Card className="glass-panel overflow-hidden border-white/10 bg-zinc-950/75 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <CardContent className="p-5 sm:p-8">
              <div className="mb-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Move your way</p>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {mode === "login" ? "Welcome back." : "Join the journey."}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {mode === "login"
                    ? "Log in to pick up right where you left off."
                    : "Create your account and make every trip easier."}
                </p>
              </div>

              <Tabs
                value={mode}
                onValueChange={(value) => {
                  if (value === "login" || value === "register") setMode(value);
                }}
              >
                <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl border border-white/[0.07] bg-black/30 p-1">
                  <TabsTrigger className="rounded-lg" value="login">Log in</TabsTrigger>
                  <TabsTrigger className="rounded-lg" value="register">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form className="mt-6 space-y-5" onSubmit={submitLogin} noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email address</Label>
                      <div className="relative">
                        <Mail aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          aria-invalid={Boolean(loginForm.formState.errors.email)}
                          className={fieldClassName}
                          placeholder="you@example.com"
                          {...loginForm.register("email")}
                        />
                      </div>
                      <FieldError message={loginForm.formState.errors.email?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          autoComplete="current-password"
                          aria-invalid={Boolean(loginForm.formState.errors.password)}
                          className={`${fieldClassName} pr-11`}
                          placeholder="Enter your password"
                          {...loginForm.register("password")}
                        />
                        <PasswordToggle
                          shown={showLoginPassword}
                          onToggle={() => setShowLoginPassword((shown) => !shown)}
                        />
                      </div>
                      <FieldError message={loginForm.formState.errors.password?.message} />
                    </div>

                    <Button className="h-12 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-base shadow-lg shadow-red-950/40 hover:from-red-400 hover:via-red-500 hover:to-red-600" disabled={isSubmitting} type="submit">
                      {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <>Continue to RideX <ArrowRight aria-hidden="true" className="h-4 w-4" /></>}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form className="mt-6 space-y-5" onSubmit={submitRegister} noValidate>
                    <fieldset disabled={isSubmitting} className="space-y-5">
                      <div className="space-y-2">
                        <Label>Choose your account</Label>
                        <div role="group" aria-label="Choose your account type" className="grid grid-cols-2 gap-3">
                          <RoleCard
                            title="Rider"
                            description="I need rides"
                            selected={role === "RIDER"}
                            icon={<UserRound aria-hidden="true" className="h-5 w-5" />}
                            onClick={() => registerForm.setValue("role", "RIDER", { shouldValidate: true })}
                          />
                          <RoleCard
                            title="Driver"
                            description="I want to drive"
                            selected={role === "DRIVER"}
                            icon={<CarFront aria-hidden="true" className="h-5 w-5" />}
                            onClick={() => registerForm.setValue("role", "DRIVER", { shouldValidate: true })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          id="register-name"
                          label="Full name"
                          icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
                          error={registerForm.formState.errors.name?.message}
                        >
                          <Input
                            id="register-name"
                            autoComplete="name"
                            aria-invalid={Boolean(registerForm.formState.errors.name)}
                            className={fieldClassName}
                            placeholder="Your name"
                            {...registerForm.register("name")}
                          />
                        </FormField>
                        <FormField
                          id="register-phone"
                          label="Phone number"
                          icon={<Phone aria-hidden="true" className="h-4 w-4" />}
                          error={registerForm.formState.errors.phone?.message}
                        >
                          <Input
                            id="register-phone"
                            type="tel"
                            autoComplete="tel"
                            aria-invalid={Boolean(registerForm.formState.errors.phone)}
                            className={fieldClassName}
                            placeholder="+91 98765 43210"
                            {...registerForm.register("phone")}
                          />
                        </FormField>
                      </div>

                      <FormField
                        id="register-email"
                        label="Email address"
                        icon={<Mail aria-hidden="true" className="h-4 w-4" />}
                        error={registerForm.formState.errors.email?.message}
                      >
                        <Input
                          id="register-email"
                          type="email"
                          autoComplete="email"
                          aria-invalid={Boolean(registerForm.formState.errors.email)}
                          className={fieldClassName}
                          placeholder="you@example.com"
                          {...registerForm.register("email")}
                        />
                      </FormField>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                          <Input
                            id="register-password"
                            type={showRegisterPassword ? "text" : "password"}
                            autoComplete="new-password"
                            aria-invalid={Boolean(registerForm.formState.errors.password)}
                            className={`${fieldClassName} pr-11`}
                            placeholder="Create a strong password"
                            {...registerForm.register("password")}
                          />
                          <PasswordToggle
                            shown={showRegisterPassword}
                            onToggle={() => setShowRegisterPassword((shown) => !shown)}
                          />
                        </div>
                        <div className="flex items-center gap-3" aria-live="polite">
                          <div className="grid flex-1 grid-cols-4 gap-1.5">
                            {[0, 1, 2, 3].map((segment) => (
                              <span
                                key={segment}
                                className={`h-1 rounded-full transition-colors ${segment < strength.score ? strength.color : "bg-white/10"}`}
                              />
                            ))}
                          </div>
                          <span className="min-w-10 text-right text-[11px] text-zinc-500">
                            {registerPassword ? strength.label : "8+ chars"}
                          </span>
                        </div>
                        <FieldError message={registerForm.formState.errors.password?.message} />
                      </div>

                      <AnimatePresence initial={false}>
                        {role === "DRIVER" && (
                          <motion.div
                            initial={reduceMotion ? false : { opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: reduceMotion ? 0 : 0.22 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 rounded-xl border border-red-500/20 bg-red-500/[0.045] p-4">
                              <div>
                                <p className="text-sm font-semibold text-zinc-100">Your vehicle</p>
                                <p className="mt-1 text-xs text-zinc-500">Add a few details to set up your driver profile.</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="vehicle-type">Vehicle type</Label>
                                <Select
                                  value={registerForm.watch("vehicleType")}
                                  onValueChange={(value) => {
                                    const parsedVehicleType = vehicleTypeSchema.safeParse(value);
                                    if (parsedVehicleType.success) {
                                      registerForm.setValue("vehicleType", parsedVehicleType.data, { shouldValidate: true });
                                    }
                                  }}
                                >
                                  <SelectTrigger id="vehicle-type" aria-invalid={Boolean(registerForm.formState.errors.vehicleType)} className="border-white/10 bg-black/25">
                                    <SelectValue placeholder="Select your vehicle type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="BIKE">Bike</SelectItem>
                                    <SelectItem value="AUTO">Auto</SelectItem>
                                    <SelectItem value="CAB">Cab</SelectItem>
                                    <SelectItem value="PREMIUM">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FieldError message={registerForm.formState.errors.vehicleType?.message} />
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                  id="vehicle-model"
                                  label="Vehicle model"
                                  error={registerForm.formState.errors.vehicleModel?.message}
                                >
                                  <Input
                                    id="vehicle-model"
                                    aria-invalid={Boolean(registerForm.formState.errors.vehicleModel)}
                                    className="h-11 border-white/10 bg-black/25 placeholder:text-zinc-600"
                                    placeholder="e.g. Honda Activa"
                                    {...registerForm.register("vehicleModel")}
                                  />
                                </FormField>
                                <FormField
                                  id="vehicle-number"
                                  label="Registration number"
                                  error={registerForm.formState.errors.vehicleNumber?.message}
                                >
                                  <Input
                                    id="vehicle-number"
                                    aria-invalid={Boolean(registerForm.formState.errors.vehicleNumber)}
                                    className="h-11 border-white/10 bg-black/25 placeholder:text-zinc-600"
                                    placeholder="e.g. MP 17 AB 1234"
                                    {...registerForm.register("vehicleNumber")}
                                  />
                                </FormField>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button className="h-12 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-base shadow-lg shadow-red-950/40 hover:from-red-400 hover:via-red-500 hover:to-red-600" disabled={isSubmitting} type="submit">
                        {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <>Create my account <ArrowRight aria-hidden="true" className="h-4 w-4" /></>}
                      </Button>
                    </fieldset>
                  </form>
                </TabsContent>
              </Tabs>

              <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
                By continuing, you agree to use RideX responsibly and keep your account details secure.
              </p>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-xs text-zinc-600">
            Protected by secure, cookie-based sign in.
          </p>
        </motion.section>
      </div>
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-300" role="alert">{message}</p>;
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {shown ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
    </button>
  );
}

function RoleCard({
  title,
  description,
  selected,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
        selected
          ? "border-red-500/70 bg-red-500/[0.09] shadow-[0_0_24px_rgba(239,68,68,0.1)]"
          : "border-white/[0.08] bg-black/20 hover:border-white/20 hover:bg-white/[0.035]"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-red-500/15 text-red-300" : "bg-white/[0.05] text-zinc-400 group-hover:text-zinc-200"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
      </span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-red-400 bg-red-500 text-white" : "border-white/20 text-transparent"}`}>
        {selected && <Check aria-hidden="true" className="h-3 w-3" />}
      </span>
    </button>
  );
}

function FormField({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {icon ? (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>
          {children}
        </div>
      ) : children}
      <FieldError message={error} />
    </div>
  );
}
