import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-900 text-slate-50 hover:bg-slate-700 focus-visible:ring-slate-500",
  secondary:
    "border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 focus-visible:ring-slate-400",
  ghost:
    "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
