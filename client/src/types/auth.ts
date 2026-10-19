export type UserRole = "RIDER" | "DRIVER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string | null;
};
