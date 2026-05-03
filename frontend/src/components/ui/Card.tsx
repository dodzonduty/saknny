import React from "react";

interface CardProps {
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
}

export const Card: React.FC<CardProps> = ({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  linkText,
  linkHref,
}) => {
  return (
    <div className="bg-surface rounded-xl p-8 flex flex-col items-center text-center gap-4 border border-slate-100 shadow-soft hover:shadow-soft-lg transition-shadow duration-300 h-full">
      <div className={`w-16 h-16 ${iconBgClass} rounded-2xl flex items-center justify-center mb-2`}>
        <span className={`material-symbols-outlined text-3xl ${iconColorClass}`}>
          {icon}
        </span>
      </div>
      <h3 className="font-headline text-xl font-bold text-primary">{title}</h3>
      <p className="text-on-surface-variant font-body text-base leading-relaxed flex-grow">
        {description}
      </p>
      {linkText && linkHref && (
        <a
          href={linkHref}
          className="text-primary font-label font-bold text-sm hover:text-primary-container transition-colors flex items-center gap-1 mt-2"
        >
          {linkText} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      )}
    </div>
  );
};
