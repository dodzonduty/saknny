import React from "react";

interface ActionCardProps {
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  title: string;
  description: string;
  linkText: string;
  badge?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  iconBgColor,
  iconTextColor,
  title,
  description,
  linkText,
  badge,
  badgeBgColor = "bg-tertiary-fixed",
  badgeTextColor = "text-on-tertiary-container"
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all group cursor-not-allowed opacity-80 border-none">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-lg ${iconBgColor} ${iconTextColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        
        {badge ? (
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${badgeBgColor} ${badgeTextColor}`}>
            {badge}
          </span>
        ) : (
          <span className="material-symbols-outlined text-outline-variant">open_in_new</span>
        )}
      </div>
      
      <h3 className="text-lg font-bold text-primary mb-1 font-headline">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-4">{description}</p>
      
      <span className="text-primary text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
        {linkText} <span className="material-symbols-outlined text-sm">chevron_right</span>
      </span>
    </div>
  );
};
