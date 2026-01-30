import { InputHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-md border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary ring-offset-bg-void file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
