"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, X, Play, Pause, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponseOverlayProps {
  text: string;
  audioUri: string | null;
  onClose: () => void;
  title: string;
}

export function ResponseOverlay({ text, audioUri, onClose, title }: ResponseOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioUri && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [audioUri]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <Card className="w-full max-w-2xl mb-0 sm:mb-4 overflow-hidden shadow-2xl border-primary/10 rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom-full duration-500">
        <div className="bg-primary px-6 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Volume2 className="w-4 h-4" />
            </div>
            <h3 className="font-headline font-black text-sm uppercase tracking-wider">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { stopAudio(); onClose(); }} className="text-white hover:bg-white/20 rounded-full h-9 w-9">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <CardContent className="p-0 bg-white">
          <ScrollArea className="h-[40vh] sm:h-auto sm:max-h-[60vh] p-6 sm:p-8">
            <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">{text}</p>
          </ScrollArea>
          
          {audioUri && (
            <div className="p-6 border-t bg-muted/5 flex flex-col sm:flex-row items-center justify-center gap-4">
              <audio 
                ref={audioRef} 
                src={audioUri} 
                className="hidden" 
                onEnded={handleAudioEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="flex items-center gap-3 bg-white rounded-full p-2 shadow-xl border border-border/50">
                <Button 
                  variant="default" 
                  size="icon" 
                  onClick={togglePlayPause}
                  className="rounded-full h-12 w-12 text-white shadow-lg active:scale-90 transition-all"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={stopAudio}
                  className="rounded-full h-12 w-12 text-destructive border-destructive/10 hover:bg-destructive/5 shadow-sm active:scale-90 transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-0.5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {isPlaying ? "Audio playing" : "Audio control"}
                </span>
                <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">Uzima Mesh TTS Engine</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
