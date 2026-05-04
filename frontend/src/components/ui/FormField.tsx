import React, { useState } from "react";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  icon,
  error,
  type = "text",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label htmlFor={props.id} className="font-label font-semibold text-sm text-primary">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative flex items-center rtl:flex-row-reverse">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 text-on-surface-variant pointer-events-none rtl:left-auto rtl:right-4">
            {icon}
          </span>
        )}
        
        <input
          type={currentType}
          className={`w-full bg-surface-variant border ${
            error ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200"
          } rounded-lg py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
            icon ? "pl-12 rtl:pr-12 rtl:pl-4" : "px-4"
          } ${isPassword ? "pr-12 rtl:pl-12 rtl:pr-4" : ""}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 rtl:right-auto rtl:left-4 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
      
      {error && <span className="text-red-500 text-xs mt-1 font-body">{error}</span>}
    </div>
  );
};
