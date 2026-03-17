
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Square } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const toggleListening = () => {
    // Interruption logic: Stop any playing audio if we start listening
    stopAllAudio();

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser. Please try Chrome or Safari.",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = language === 'English' ? 'en-US' : 'sw-KE';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
        setResponse(null); // Clear previous response when new listening starts
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error("Speech Recognition Error:", event.error);
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

      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
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

      // Auto-play the new response audio
      if (result.adviceAudioDataUri && audioRef.current) {
        audioRef.current.src = result.adviceAudioDataUri;
        audioRef.current.play().catch(e => console.error("Audio Playback Error:", e));
        setIsPlaying(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Assistant Error",
        description: error.message || "Connection lost. Please try speaking again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 relative">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="relative z-10">
        {(isListening || isPlaying) && (
          <div className={`absolute inset-0 rounded-full bg-primary/20 animate-ping ${isPlaying ? 'bg-secondary/20' : ''}`} />
        )}
        <Button
          size="lg"
          variant={isListening ? "destructive" : isPlaying ? "secondary" : "default"}
          className={`h-24 w-24 rounded-full shadow-lg transition-all duration-300 ${isListening ? 'scale-110' : 'hover:scale-105'}`}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-10 w-10" />
          ) : isPlaying ? (
            <Square className="h-10 w-10 fill-current" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </Button>
      </div>

      <div className="text-center space-y-4 w-full px-6 z-10">
        <div className="space-y-1">
          <h2 className={`text-2xl font-headline font-black tracking-tight ${isPlaying ? 'text-secondary' : 'text-primary'}`}>
            {isListening ? "I'm listening..." : isProcessing ? "Thinking..." : isPlaying ? "Uzima is speaking" : "Tap to Speak"}
          </h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
            {language} Mode • Real-time Interactive
          </p>
        </div>

        {isListening && (
          <div className="min-h-[60px] p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-sm font-medium italic text-primary/80">
              {interimTranscript || "Waiting for your voice..."}
            </p>
          </div>
        )}

        {!isListening && !isProcessing && !isPlaying && (
          <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
            Ask me anything. I can be interrupted at any time if you have follow-up questions.
          </p>
        )}
      </div>

      {response && (
        <ResponseOverlay 
          title="Uzima Live Advice"
          text={response.text} 
          audioUri={response.audio} 
          isPlaying={isPlaying}
          onToggleAudio={() => {
            if (audioRef.current) {
              if (isPlaying) audioRef.current.pause();
              else audioRef.current.play();
            }
          }}
          onClose={() => {
            stopAllAudio();
            setResponse(null);
          }} 
        />
      )}
    </div>
  );
}
