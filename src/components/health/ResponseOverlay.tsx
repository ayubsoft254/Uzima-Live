"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, X, PlayCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponseOverlayProps {
  text: string;
  audioUri: string | null;
  onClose: () => void;
  title: string;
}

export function ResponseOverlay({ text, audioUri, onClose, title }: ResponseOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUri && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
    }
  }, [audioUri]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-8">
      <Card className="w-full max-w-2xl mb-4 overflow-hidden shadow-2xl border-primary/20">
        <div className="bg-primary px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            <h3 className="font-headline font-semibold">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[60vh] p-6">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
          </ScrollArea>
          
          {audioUri && (
            <div className="p-4 border-t bg-muted/30 flex items-center gap-4">
              <audio ref={audioRef} src={audioUri} className="hidden" />
              <Button 
                onClick={() => audioRef.current?.play()} 
                variant="outline" 
                className="w-full rounded-full gap-2 border-primary text-primary hover:bg-primary/10"
              >
                <PlayCircle className="w-5 h-5" />
                Replay Audio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}