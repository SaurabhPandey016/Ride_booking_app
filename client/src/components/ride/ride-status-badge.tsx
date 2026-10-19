import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { RideStatus } from "@/types/ride";

const statusVariants: Record<RideStatus, BadgeProps["variant"]> = {
  REQUESTED: "outline",
  ACCEPTED: "secondary",
  ARRIVED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function RideStatusBadge({ status }: { status: RideStatus }) {
  return <Badge variant={statusVariants[status]}>{status.replaceAll("_", " ")}</Badge>;
}
