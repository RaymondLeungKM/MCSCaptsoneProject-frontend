import React from "react";
import { Button } from "@/components/ui/button";
import { LanguagePreference } from "@/lib/types";

interface LanguageSelectorProps {
  currentLanguage: LanguagePreference;
  onChange: (language: LanguagePreference) => void;
  className?: string;
}

export function LanguageSelector({
  currentLanguage,
  onChange,
  className = "",
}: LanguageSelectorProps) {
  const languages: {
    value: LanguagePreference;
    label: string;
    flag: string;
  }[] = [
    { value: "cantonese", label: "繁體中文", flag: "🇭🇰" },
    { value: "english", label: "English", flag: "🇺🇸" },
    { value: "bilingual", label: "雙語 Both", flag: "🌏" },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {languages.map((lang) => (
        <Button
          key={lang.value}
          variant={currentLanguage === lang.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(lang.value)}
          className={`
            transition-all duration-200
            ${
              currentLanguage === lang.value
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "hover:bg-accent"
            }
          `}
        >
          <span className="mr-1">{lang.flag}</span>
          <span className="font-medium">{lang.label}</span>
        </Button>
      ))}
    </div>
  );
}

export default LanguageSelector;
