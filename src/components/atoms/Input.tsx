import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, leftAddon, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className={cn(
          "flex rounded-lg border overflow-hidden transition-colors",
          "focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500",
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
        )}>
          {leftAddon && (
            <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-sm text-gray-500 shrink-0 select-none">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent",
              "focus:outline-none",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
