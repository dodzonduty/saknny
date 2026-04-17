import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "navy";
  icon?: string;
  iconPosition?: "left" | "right";
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  icon,
  iconPosition = "right",
  children,
  className = "",
  ...props
}) => {
  const baseStyles = "transition-all duration-300 font-label flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-accent-yellow text-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-accent-yellow-hover hover:scale-105 hover:shadow-xl shadow-lg",
    secondary: "bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-xl font-semibold text-lg hover:bg-white/20",
    outline: "bg-surface border border-slate-200 text-primary px-5 py-2.5 rounded-lg hover:bg-slate-50 font-semibold shadow-sm",
    navy: "bg-primary text-white hover:bg-primary-container px-5 py-2.5 rounded-lg font-semibold shadow-sm",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {icon && iconPosition === "left" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
};
