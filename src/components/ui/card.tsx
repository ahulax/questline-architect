import { HTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("card", className)}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

export { Card };
