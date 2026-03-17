"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { getPersonalizedHealthAdvice } from "@/ai/flows/get-personalized-health-advice-flow";
import { useToast } from "@/hooks/use-toast";
import { ResponseOverlay } from "./ResponseOverlay";

interface VoiceAssistantProps {
  language: 'English' | 'Swahili';
}

export function VoiceAssistant({ language }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [response, setResponse] = useState<{ text: string; audio: string | null } | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = language === 'English' ? 'en-US' : 'sw-KE';
    recognition.interimResults = true; // Enabled for real-time interaction
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      setIsListening(false);
      setInterimTranscript("");
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast({ 
          variant: "destructive", 
          title: "Speech Error", 
          description: `Error: ${event.error}. Please try again.` 
        });
      }
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        setInterimTranscript("");
        handleQuery(final);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    try {
      const result = await getPersonalizedHealthAdvice({
        query,
        language,
      });
      setResponse({
        text: result.adviceText,
        audio: result.adviceAudioDataUri,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Assistant Error",
        description: error.message || "Could not generate advice. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        )}
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={`h-24 w-24 rounded-full shadow-lg transition-all duration-300 ${isListening ? 'scale-110 shadow-primary/20' : 'hover:scale-105'}`}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-10 w-10" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </Button>
      </div>

      <div className="text-center space-y-4 w-full px-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-headline font-black text-primary tracking-tight">
            {isListening ? "Listening..." : isProcessing ? "Thinking..." : "Tap to Speak"}
          </h2>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest opacity-60">
            {language} Mode
          </p>
        </div>

        {isListening && (
          <div className="min-h-[60px] p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-sm font-medium italic text-primary/80">
              {interimTranscript || "I'm listening..."}
            </p>
          </div>
        )}

        {!isListening && !isProcessing && (
          <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
            Tell me your symptoms or health questions. I'll provide medically grounded advice instantly.
          </p>
        )}
      </div>

      {response && (
        <ResponseOverlay 
          title="Uzima Live Advice"
          text={response.text} 
          audioUri={response.audio} 
          onClose={() => setResponse(null)} 
        />
      )}
    </div>
  );
}
