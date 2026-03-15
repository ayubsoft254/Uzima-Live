
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, Volume2, Pause, Play, Square } from "lucide-react";
import { getPersonalizedHealthAdvice } from "@/ai/flows/get-personalized-health-advice-flow";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  audioUri?: string | null;
}

interface ChatAssistantProps {
  language: 'English' | 'Swahili';
}

export function ChatAssistant({ language }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const result = await getPersonalizedHealthAdvice({
        query: userMessage.text,
        language,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.adviceText,
        sender: 'ai',
        audioUri: result.adviceAudioDataUri,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-play audio if available
      if (aiMessage.audioUri && audioRef.current) {
        setPlayingMessageId(aiMessage.id);
        audioRef.current.src = aiMessage.audioUri;
        audioRef.current.play().catch(() => {});
        setIsAudioPlaying(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: error.message || "Could not get a response. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudio = (id: string, uri: string) => {
    if (!audioRef.current) return;

    if (playingMessageId === id) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsAudioPlaying(true);
      }
    } else {
      setPlayingMessageId(id);
      audioRef.current.src = uri;
      audioRef.current.play().catch(() => {});
      setIsAudioPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
      setPlayingMessageId(null);
    }
  };

  const handleAudioEnd = () => {
    setIsAudioPlaying(false);
    setPlayingMessageId(null);
  };

  return (
    <div className="flex flex-col h-[500px] w-full bg-white/50 rounded-2xl border border-border overflow-hidden">
      <audio 
        ref={audioRef} 
        className="hidden" 
        onEnded={handleAudioEnd}
        onPlay={() => setIsAudioPlaying(true)}
        onPause={() => setIsAudioPlaying(false)}
      />
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm px-8">How can I help you today? Type your symptoms or health questions.</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2",
                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                msg.sender === 'user' ? "bg-primary text-white" : "bg-secondary text-white"
              )}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] p-3 rounded-2xl relative group",
                msg.sender === 'user' 
                  ? "bg-primary/10 text-foreground rounded-tr-none" 
                  : "bg-white border border-border text-foreground rounded-tl-none"
              )}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.audioUri && (
                  <div className="absolute -right-2 -bottom-2 flex gap-1">
                    <button 
                      onClick={() => toggleAudio(msg.id, msg.audioUri!)}
                      className={cn(
                        "w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center shadow-sm transition-colors",
                        playingMessageId === msg.id && isAudioPlaying ? "text-primary border-primary animate-pulse" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {playingMessageId === msg.id && isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    {playingMessageId === msg.id && (
                      <button 
                        onClick={stopAudio}
                        className="w-7 h-7 bg-white border border-destructive/20 rounded-full flex items-center justify-center text-destructive shadow-sm hover:bg-destructive/5 transition-colors"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3 items-center text-muted-foreground animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <p className="text-xs">Uzima is thinking...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-border flex gap-2">
        <Input 
          placeholder="Type your health concern..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="rounded-xl border-border h-12"
          disabled={isProcessing}
        />
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-xl shrink-0" 
          onClick={handleSend}
          disabled={isProcessing || !input.trim()}
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
