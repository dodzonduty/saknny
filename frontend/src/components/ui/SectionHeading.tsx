import React from "react";

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  centered?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  centered = true,
}) => {
  return (
    <div className={`flex flex-col gap-4 max-w-3xl ${centered ? "text-center mx-auto items-center" : ""}`}>
      <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">
        {title}
      </h2>
      <p className="font-body text-lg text-on-surface-variant">
        {subtitle}
      </p>
    </div>
  );
};
