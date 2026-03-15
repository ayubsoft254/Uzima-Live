"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSelector } from "@/components/health/LanguageSelector";
import { VoiceAssistant } from "@/components/health/VoiceAssistant";
import { DocumentScanner } from "@/components/health/DocumentScanner";
import { HeartPulse, Mic, ScanEye, Info } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<'English' | 'Swahili'>('English');

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 pt-6 pb-12 overflow-y-auto bg-background">
      {/* Header */}
      <header className="flex flex-col items-center mb-8 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-black text-foreground tracking-tighter">Uzima Live</h1>
            <p className="text-sm font-medium text-secondary -mt-1">Mesh AI Health Agent</p>
          </div>
        </div>
        
        <LanguageSelector 
          currentLanguage={language} 
          onLanguageChange={setLanguage} 
        />
      </header>

      {/* Main Mode Selector */}
      <main className="flex-1 flex flex-col">
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-white border border-border rounded-2xl mb-8">
            <TabsTrigger value="voice" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-2 transition-all duration-300">
              <Mic className="w-5 h-5" />
              Voice Agent
            </TabsTrigger>
            <TabsTrigger value="vision" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-2 transition-all duration-300">
              <ScanEye className="w-5 h-5" />
              Scan Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="animate-in fade-in slide-in-from-left-4 duration-500">
            <VoiceAssistant language={language} />
          </TabsContent>

          <TabsContent value="vision" className="animate-in fade-in slide-in-from-right-4 duration-500">
            <DocumentScanner language={language} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Info / Footer Section */}
      <section className="mt-12 bg-white/50 rounded-2xl p-6 border border-border">
        <div className="flex items-start gap-3">
          <div className="bg-secondary/10 p-2 rounded-lg text-secondary shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-headline font-bold text-sm">How it works</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Uzima Live uses Gemini Multimodal AI to understand your voice and read health documents. 
              Our guidance is grounded in the Uzima Mesh health network and switches seamlessly between 
              English and Swahili to provide community-specific advice.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-8 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Emergency? Call 911 or local emergency services immediately.
        </p>
      </footer>
    </div>
  );
}