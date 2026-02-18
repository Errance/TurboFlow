import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "number";
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      disabled = false,
      placeholder,
      value,
      onChange,
      type = "text",
      className = "",
      suffix,
      ...props
    },
    ref
  ) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-xs text-[#8A8A9A] mb-1">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={[
              "w-full h-10 px-3 rounded-lg bg-[#1C1C28] border text-white placeholder:text-[#8A8A9A]",
              "focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]",
              "transition-all duration-150",
              error ? "border-[#E85A7E]" : "border-[#252536]",
              disabled && "opacity-40 cursor-not-allowed",
              suffix && "pr-16",
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A9A] text-sm pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-[#E85A7E]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
