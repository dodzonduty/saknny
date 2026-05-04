import React from "react";

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: string;
  error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  icon,
  error,
  className = "",
  maxLength,
  value,
  ...props
}) => {
  const currentLength = value ? String(value).length : 0;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label htmlFor={props.id} className="font-label font-semibold text-sm text-primary flex justify-between">
        <span>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {maxLength && (
          <span className="text-on-surface-variant font-normal text-xs">
            {currentLength}/{maxLength}
          </span>
        )}
      </label>
      
      <div className="relative rtl:flex-row-reverse flex">
        {icon && (
          <span className="material-symbols-outlined absolute top-3 left-4 text-on-surface-variant pointer-events-none rtl:left-auto rtl:right-4">
            {icon}
          </span>
        )}
        
        <textarea
          className={`w-full bg-surface-variant border ${
            error ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200"
          } rounded-lg py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
            icon ? "pl-12 rtl:pr-12 rtl:pl-4" : "px-4"
          } resize-y min-h-[100px]`}
          value={value}
          maxLength={maxLength}
          {...props}
        />
      </div>
      
      {error && <span className="text-red-500 text-xs mt-1 font-body">{error}</span>}
    </div>
  );
};
