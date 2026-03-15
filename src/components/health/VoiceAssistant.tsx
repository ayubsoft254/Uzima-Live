"use client";

import { useState } from "react";
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
  const [response, setResponse] = useState<{ text: string; audio: string | null } | null>(null);
  const { toast } = useToast();

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
    recognition.lang = language === 'English' ? 'en-US' : 'sw-KE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast({ 
          variant: "destructive", 
          title: "Recognition Error", 
          description: event.error 
        });
      }
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleQuery(transcript);
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    try {
      const result = await getPersonalizedHealthAdvice({
        spokenQuery: query,
        language,
      });
      setResponse({
        text: result.adviceText,
        audio: result.adviceAudioDataUri,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: "Could not generate advice. Please try again.",
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
          className={`h-24 w-24 rounded-full shadow-lg transition-all duration-300 ${isListening ? 'scale-110' : 'hover:scale-105'}`}
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

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-headline font-bold text-primary">
          {isListening ? "Listening..." : isProcessing ? "Thinking..." : "Tap to Speak"}
        </h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          {isListening 
            ? "I'm listening to your health concern. Speak clearly into your microphone." 
            : "Tell me your symptoms or health questions in your preferred language."}
        </p>
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
