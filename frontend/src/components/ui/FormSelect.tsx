import React from "react";

export interface Option {
  value: string;
  label: string;
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  icon?: string;
  error?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  options,
  icon,
  error,
  className = "",
  ...props
}) => {
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
        
        <select
          className={`w-full bg-surface-variant border ${
            error ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200"
          } rounded-lg py-3 appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
            icon ? "pl-12 rtl:pr-12 rtl:pl-10" : "px-4 pr-10 rtl:pl-10"
          }`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        <span className="material-symbols-outlined absolute right-4 rtl:right-auto rtl:left-4 text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
      
      {error && <span className="text-red-500 text-xs mt-1 font-body">{error}</span>}
    </div>
  );
};
