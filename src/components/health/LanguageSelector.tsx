"use client";

import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

interface LanguageSelectorProps {
  currentLanguage: 'English' | 'Swahili';
  onLanguageChange: (lang: 'English' | 'Swahili') => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-white/50 p-1 rounded-full border border-border">
      <Button
        variant={currentLanguage === 'English' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onLanguageChange('English')}
        className="rounded-full h-8 px-4"
      >
        English
      </Button>
      <Button
        variant={currentLanguage === 'Swahili' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onLanguageChange('Swahili')}
        className="rounded-full h-8 px-4"
      >
        Swahili
      </Button>
      <Languages className="w-4 h-4 mx-2 text-muted-foreground" />
    </div>
  );
}