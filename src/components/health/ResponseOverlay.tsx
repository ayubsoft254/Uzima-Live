
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, X, Play, Pause, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponseOverlayProps {
  text: string;
  audioUri: string | null;
  isPlaying: boolean;
  onToggleAudio: () => void;
  onClose: () => void;
  title: string;
}

export function ResponseOverlay({ text, audioUri, isPlaying, onToggleAudio, onClose, title }: ResponseOverlayProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-center p-0 sm:p-4 bg-transparent pointer-events-none">
      <Card className="w-full max-w-2xl mb-0 sm:mb-4 overflow-hidden shadow-2xl border-primary/20 rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom-full duration-500 pointer-events-auto">
        <div className="bg-primary/90 backdrop-blur-md px-6 py-3 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-white text-primary animate-pulse' : 'bg-white/20'}`}>
              {isPlaying ? <Volume2 className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
            </div>
            <h3 className="font-headline font-black text-[10px] uppercase tracking-wider">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <CardContent className="p-0 bg-white">
          <ScrollArea className="max-h-[30vh] sm:max-h-[40vh] p-6 sm:p-8">
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
              {text}
            </p>
          </ScrollArea>
          
          {audioUri && (
            <div className="px-6 py-4 border-t bg-muted/5 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                  {isPlaying ? "AI is speaking..." : "Audio available"}
                </span>
                <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">Uzima Mesh TTS</span>
              </div>

              <Button 
                variant={isPlaying ? "secondary" : "default"} 
                size="sm" 
                onClick={onToggleAudio}
                className="rounded-full gap-2 shadow-md active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                <span className="text-xs font-bold">{isPlaying ? "Pause" : "Listen"}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
