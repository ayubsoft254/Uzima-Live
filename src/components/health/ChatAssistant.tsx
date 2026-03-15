"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, Volume2 } from "lucide-react";
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
        audioRef.current.src = aiMessage.audioUri;
        audioRef.current.play().catch(() => {});
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

  const playAudio = (uri: string) => {
    if (audioRef.current) {
      audioRef.current.src = uri;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full bg-white/50 rounded-2xl border border-border overflow-hidden">
      <audio ref={audioRef} className="hidden" />
      
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
                  <button 
                    onClick={() => playAudio(msg.audioUri!)}
                    className="absolute -right-2 -bottom-2 w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-primary/5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
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
