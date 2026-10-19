"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthIntro } from "@/components/auth/auth-intro";
import { api, normalizeApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser, UserRole } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),
  role: z.enum(["RIDER", "DRIVER"]),
  vehicleType: z.enum(["BIKE", "AUTO", "CAB", "PREMIUM"]).optional(),
  vehicleModel: z.string().optional(),
  vehicleNumber: z.string().optional(),
}).superRefine((value, context) => {
  if (value.role === "DRIVER") {
    for (const field of ["vehicleType", "vehicleModel", "vehicleNumber"] as const) {
      if (!value[field]?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for driver accounts",
          path: [field],
        });
      }
    }
  }
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type AuthResponse = { data: { user: AuthUser } };

export default function AuthPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "RIDER" },
  });
  const role = registerForm.watch("role");

  const redirectForRole = (userRole: UserRole) => {
    const nextPath = new URLSearchParams(window.location.search).get("next");
    if (nextPath?.startsWith("/book") && !nextPath.startsWith("//")) {
      router.replace(nextPath);
      return;
    }
    router.replace(userRole === "DRIVER" ? "/driver" : "/rider");
  };

  const submitLogin = loginForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const response = await api.post<AuthResponse>("/auth/login", values);
      setUser(response.data.data.user);
      toast.success("Welcome back to RideX.");
      redirectForRole(response.data.data.user.role);
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const submitRegister = registerForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const response = await api.post<AuthResponse>("/auth/register", values);
      setUser(response.data.data.user);
      toast.success("Your RideX account is ready.");
      redirectForRole(response.data.data.user.role);
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-5 py-10">
      <section className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        <AuthIntro />

        <Card className="border-white/[0.08] bg-card/90 shadow-glow">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to RideX</CardTitle>
            <CardDescription>Choose how you&apos;d like to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form className="mt-5 space-y-4" onSubmit={submitLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" autoComplete="email" {...loginForm.register("email")} />
                    <p className="text-xs text-red-300">{loginForm.formState.errors.email?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" autoComplete="current-password" {...loginForm.register("password")} />
                    <p className="text-xs text-red-300">{loginForm.formState.errors.password?.message}</p>
                  </div>
                  <Button className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form className="mt-5 space-y-4" onSubmit={submitRegister}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full name</Label>
                      <Input id="register-name" autoComplete="name" {...registerForm.register("name")} />
                      <p className="text-xs text-red-300">{registerForm.formState.errors.name?.message}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Phone</Label>
                      <Input id="register-phone" type="tel" autoComplete="tel" {...registerForm.register("phone")} />
                      <p className="text-xs text-red-300">{registerForm.formState.errors.phone?.message}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" autoComplete="email" {...registerForm.register("email")} />
                    <p className="text-xs text-red-300">{registerForm.formState.errors.email?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" autoComplete="new-password" {...registerForm.register("password")} />
                    <p className="text-xs text-muted-foreground">Use at least 8 characters with a letter and number.</p>
                    <p className="text-xs text-red-300">{registerForm.formState.errors.password?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role">Account type</Label>
                    <Select value={role} onValueChange={(value) => registerForm.setValue("role", value as "RIDER" | "DRIVER")}>
                      <SelectTrigger id="register-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RIDER">Rider</SelectItem>
                        <SelectItem value="DRIVER">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {role === "DRIVER" && (
                    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-type">Vehicle type</Label>
                        <Select onValueChange={(value) => registerForm.setValue("vehicleType", value as RegisterValues["vehicleType"])}>
                          <SelectTrigger id="vehicle-type"><SelectValue placeholder="Choose a vehicle" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BIKE">Bike</SelectItem>
                            <SelectItem value="AUTO">Auto</SelectItem>
                            <SelectItem value="CAB">Cab</SelectItem>
                            <SelectItem value="PREMIUM">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-model">Vehicle model</Label>
                          <Input id="vehicle-model" {...registerForm.register("vehicleModel")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-number">Vehicle number</Label>
                          <Input id="vehicle-number" {...registerForm.register("vehicleNumber")} />
                        </div>
                      </div>
                    </div>
                  )}
                  <Button className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                    Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to use RideX responsibly and keep your account details secure.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
