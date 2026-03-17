"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSelector } from "@/components/health/LanguageSelector";
import { VoiceAssistant } from "@/components/health/VoiceAssistant";
import { DocumentScanner } from "@/components/health/DocumentScanner";
import { ChatAssistant } from "@/components/health/ChatAssistant";
import { LiveHealthFeed } from "@/components/health/LiveHealthFeed";
import { HeartPulse, Mic, ScanEye, Info, MessageSquare, Zap } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<'English' | 'Swahili'>('English');

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full min-h-svh px-4 pt-6 pb-8 bg-background">
      {/* Header */}
      <header className="flex flex-col items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-black text-foreground tracking-tighter">Uzima Live</h1>
            <p className="text-[10px] sm:text-xs font-medium text-secondary -mt-1 uppercase tracking-wider">Mesh AI Health Agent</p>
          </div>
        </div>
        
        <LanguageSelector 
          currentLanguage={language} 
          onLanguageChange={setLanguage} 
        />
      </header>

      {/* Main Mode Selector */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="voice" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 h-12 sm:h-14 p-1 bg-white border border-border rounded-2xl mb-6 shadow-sm shrink-0">
            <TabsTrigger value="voice" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-2 transition-all duration-300">
              <Mic className="w-4 h-4" />
              <span className="hidden xs:inline text-xs font-bold uppercase tracking-tight">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-2 transition-all duration-300">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden xs:inline text-xs font-bold uppercase tracking-tight">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="vision" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white gap-2 transition-all duration-300">
              <ScanEye className="w-4 h-4" />
              <span className="hidden xs:inline text-xs font-bold uppercase tracking-tight">Scan</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pb-4">
            <TabsContent value="voice" className="mt-0 h-full animate-in fade-in slide-in-from-left-4 duration-500">
              <VoiceAssistant language={language} />
            </TabsContent>

            <TabsContent value="chat" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ChatAssistant language={language} />
            </TabsContent>

            <TabsContent value="vision" className="mt-0 h-full animate-in fade-in slide-in-from-right-4 duration-500">
              <DocumentScanner language={language} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Real-time Community Feed */}
      <section className="mt-4 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <LiveHealthFeed />
      </section>

      {/* Info / Footer Section */}
      <section className="bg-white/50 rounded-2xl p-4 sm:p-6 border border-border shrink-0">
        <div className="flex items-start gap-3">
          <div className="bg-secondary/10 p-2 rounded-lg text-secondary shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-headline font-bold text-sm">Real-time Grounding</h4>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Uzima Live uses Gemini Multimodal AI grounded in live community data. 
              We interpret documents, voice, and chat to provide instant, locally-relevant advice.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-6 text-center shrink-0">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
          Emergency? Call 911 or local emergency services.
        </p>
      </footer>
    </div>
  );
}
