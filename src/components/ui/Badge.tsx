import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray";

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-800",
};

function Badge({ color = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
