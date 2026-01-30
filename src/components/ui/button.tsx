import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "btn",
                    {
                        "btn-primary": variant === "primary",
                        // Add other variants if defined in globals.css or here
                        "bg-transparent border-none shadow-none hover:bg-neutral-800": variant === "ghost",
                        "border border-border-start bg-transparent hover:bg-neutral-800": variant === "outline",
                        "text-sm px-2 py-1": size === "sm",
                        "px-6 py-3 text-lg": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
