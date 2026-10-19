"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { api, normalizeApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser } from "@/types/auth";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(20),
  avatarUrl: z.union([z.literal(""), z.string().url("Enter a valid image URL.")]),
  role: z.enum(["RIDER", "DRIVER"]),
  vehicleType: z.enum(["BIKE", "AUTO", "CAB", "PREMIUM"]),
  vehicleModel: z.string().trim(),
  vehicleNumber: z.string().trim(),
}).superRefine((values, context) => {
  if (values.role === "DRIVER" && !values.vehicleModel) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Enter your vehicle model.", path: ["vehicleModel"] });
  }
  if (values.role === "DRIVER" && !values.vehicleNumber) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Enter your vehicle number.", path: ["vehicleNumber"] });
  }
});
type ProfileForm = z.infer<typeof profileSchema>;
type VehicleType = ProfileForm["vehicleType"];
type DriverProfile = {
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
} | null;
type UserProfile = AuthUser & { driverProfile: DriverProfile };
type MeResponse = { data: { user: UserProfile } };
type UpdateResponse = { data: { user: UserProfile } };

const vehicleTypes: Array<{ value: VehicleType; label: string }> = [
  { value: "BIKE", label: "Bike" },
  { value: "AUTO", label: "Auto" },
  { value: "CAB", label: "Cab" },
  { value: "PREMIUM", label: "Premium" },
];

function ProfileFormContent() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("BIKE");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      avatarUrl: "",
      role: "RIDER",
      vehicleType: "BIKE",
      vehicleModel: "",
      vehicleNumber: "",
    },
  });

  const imageUrl = watch("avatarUrl");
  const initials = useMemo(
    () => profile?.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() ?? "RX",
    [profile?.name],
  );

  useEffect(() => {
    let mounted = true;
    api.get<MeResponse>("/auth/me")
      .then((response) => {
        if (!mounted) return;
        const next = response.data.data.user;
        setProfile(next);
        setVehicleType(next.driverProfile?.vehicleType ?? "BIKE");
        reset({
          name: next.name,
          phone: next.phone,
          avatarUrl: next.avatarUrl ?? "",
          role: next.role,
          vehicleType: next.driverProfile?.vehicleType ?? "BIKE",
          vehicleModel: next.driverProfile?.vehicleModel ?? "",
          vehicleNumber: next.driverProfile?.vehicleNumber ?? "",
        });
      })
      .catch((error: unknown) => {
        if (mounted) setLoadError(normalizeApiError(error).message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reset]);

  const submit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        avatarUrl: values.avatarUrl.trim() || null,
        ...(profile?.role === "DRIVER"
          ? {
              vehicleType: values.vehicleType,
              vehicleModel: values.vehicleModel.trim(),
              vehicleNumber: values.vehicleNumber.trim(),
            }
          : {}),
      };
      const response = await api.patch<UpdateResponse>("/auth/me", payload);
      const updated = response.data.data.user;
      setProfile(updated);
      setUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      });
      setVehicleType(updated.driverProfile?.vehicleType ?? "BIKE");
      reset({
        name: updated.name,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl ?? "",
        role: updated.role,
        vehicleType: updated.driverProfile?.vehicleType ?? "BIKE",
        vehicleModel: updated.driverProfile?.vehicleModel ?? "",
        vehicleNumber: updated.driverProfile?.vehicleNumber ?? "",
      });
      toast.success("Your profile has been updated.");
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setSaving(false);
    }
  });

  if (loading) {
    return <PageSkeleton cards={2} />;
  }

  return (
    <main className="mx-auto min-h-[65vh] max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 text-zinc-400 hover:text-white">
        <Link href={user?.role === "DRIVER" ? "/driver" : "/book"}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back</Link>
      </Button>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Account settings</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">Your profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Keep your contact and account details up to date.</p>
      </div>

      {loadError ? (
        <Card className="border-red-400/20 bg-red-400/[0.05]">
          <CardHeader><CardTitle>We couldn’t load your profile</CardTitle><CardDescription>{loadError}</CardDescription></CardHeader>
          <CardContent><Button variant="outline" onClick={() => window.location.reload()}>Try again</Button></CardContent>
        </Card>
      ) : profile ? (
        <form onSubmit={(event) => void submit(event)} className="space-y-5">
          <Card className="border-white/10 bg-[#111114]/90">
            <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/20 to-zinc-800 text-xl font-semibold text-red-200">
                <span>{initials}</span>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized
                    className="object-cover"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-white">{profile.name}</h2>
                  <Badge variant="outline" className={profile.role === "DRIVER" ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-sky-400/20 bg-sky-400/10 text-sky-200"}>
                    {profile.role === "DRIVER" ? "Driver" : "Rider"}
                  </Badge>
                </div>
                <p className="mt-1 break-all text-sm text-zinc-400">{profile.email}</p>
                <p className="mt-1 text-xs text-zinc-500">Email address cannot be changed here.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#111114]/90">
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Update the details used for your RideX account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="profile-name" error={errors.name?.message}>
                <Input id="profile-name" autoComplete="name" {...register("name")} className="border-white/10 bg-black/20" />
              </Field>
              <Field label="Phone number" id="profile-phone" error={errors.phone?.message}>
                <Input id="profile-phone" type="tel" autoComplete="tel" {...register("phone")} className="border-white/10 bg-black/20" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Avatar image URL" id="profile-avatar" error={errors.avatarUrl?.message}>
                  <Input id="profile-avatar" type="url" placeholder="https://example.com/avatar.jpg" {...register("avatarUrl")} className="border-white/10 bg-black/20" />
                </Field>
              </div>
            </CardContent>
          </Card>

          {profile.role === "DRIVER" && (
            <Card className="border-white/10 bg-[#111114]/90">
              <CardHeader>
                <CardTitle>Vehicle information</CardTitle>
                <CardDescription>These details are visible to riders after you accept a trip.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-vehicle-type">Vehicle type</Label>
                  <Select
                    value={vehicleType}
                    onValueChange={(value: VehicleType) => {
                      setVehicleType(value);
                      setValue("vehicleType", value, { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    <SelectTrigger id="profile-vehicle-type" className="border-white/10 bg-black/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((vehicle) => <SelectItem key={vehicle.value} value={vehicle.value}>{vehicle.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Vehicle model" id="profile-vehicle-model" error={errors.vehicleModel?.message}>
                  <Input id="profile-vehicle-model" {...register("vehicleModel")} className="border-white/10 bg-black/20" />
                </Field>
                <Field label="Vehicle number" id="profile-vehicle-number" error={errors.vehicleNumber?.message}>
                  <Input id="profile-vehicle-number" {...register("vehicleNumber")} className="border-white/10 bg-black/20 uppercase" />
                </Field>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">Your account role: <span className="font-semibold text-zinc-300">{profile.role}</span></p>
            <Button type="submit" className="gradient-red text-white" disabled={saving || !isDirty}>
              {saving ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </form>
      ) : null}
    </main>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileFormContent />
    </ProtectedRoute>
  );
}
