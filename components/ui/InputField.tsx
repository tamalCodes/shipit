"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputFieldProps = {
  label: string;
  errorMessage?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, errorMessage, className, id, required, ...props }, ref) => {
    const inputId =
      id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-700"
        >
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>

        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            "block w-full rounded-md border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:ring-0 border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-70",
            className
          )}
          {...props}
        />
        {errorMessage ? (
          <p className="text-sm text-rose-500">{errorMessage}</p>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
