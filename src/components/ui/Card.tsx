import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "border-b border-gray-200 px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;

export default Card;
