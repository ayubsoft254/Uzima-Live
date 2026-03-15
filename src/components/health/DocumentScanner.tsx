"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw, Loader2, FileText } from "lucide-react";
import { interpretHealthDocument } from "@/ai/flows/interpret-health-document-flow";
import { useToast } from "@/hooks/use-toast";
import { ResponseOverlay } from "./ResponseOverlay";
import Image from "next/image";

interface DocumentScannerProps {
  language: 'English' | 'Swahili';
}

export function DocumentScanner({ language }: DocumentScannerProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<{ text: string; audio: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const result = await interpretHealthDocument({
        photoDataUri: capturedImage,
        targetLanguage: language,
      });
      setResponse({
        text: result.explanationText,
        audio: result.explanationAudioDataUri,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: "Could not interpret the document. Please ensure it's clear and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResponse(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 overflow-hidden bg-white/50 relative flex items-center justify-center">
        {capturedImage ? (
          <div className="relative w-full h-full">
            <Image 
              src={capturedImage} 
              alt="Document scan" 
              fill 
              className="object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white gap-3">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="font-medium">Reading your document...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Camera className="w-8 h-8" />
            </div>
            <p className="font-medium text-lg text-foreground">Position document within frame</p>
            <p className="text-sm">Scan prescriptions, health cards, or medical reports for instant explanation.</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full">
        {!capturedImage ? (
          <Button 
            className="flex-1 h-14 rounded-xl text-lg gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-6 h-6" />
            Scan Document
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-xl gap-2 border-primary text-primary hover:bg-primary/5"
              onClick={reset}
              disabled={isProcessing}
            >
              <RefreshCcw className="w-5 h-5" />
              Retake
            </Button>
            <Button 
              className="flex-[2] h-14 rounded-xl text-lg gap-2"
              onClick={processImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {isProcessing ? "Processing..." : "Interpret Document"}
            </Button>
          </>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="environment" 
        onChange={handleCapture}
      />

      {response && (
        <ResponseOverlay 
          title="Document Interpretation"
          text={response.text} 
          audioUri={response.audio} 
          onClose={() => setResponse(null)} 
        />
      )}
    </div>
  );
}
