"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw, Loader2, FileText, FileUp, Trash2, AlertCircle } from "lucide-react";
import { interpretHealthDocument } from "@/ai/flows/interpret-health-document-flow";
import { useToast } from "@/hooks/use-toast";
import { ResponseOverlay } from "./ResponseOverlay";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface DocumentScannerProps {
  language: 'English' | 'Swahili';
}

export function DocumentScanner({ language }: DocumentScannerProps) {
  const [capturedDataUri, setCapturedDataUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<{ text: string; audio: string | null } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isCameraActive) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setIsCameraActive(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCameraActive, toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (Genkit/Gemini limit)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please upload a file smaller than 20MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedDataUri(reader.result as string);
        setIsCameraActive(false);
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "Failed to read the file. Please try again.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedDataUri(dataUri);
        setIsCameraActive(false);
      }
    }
  };

  const processDocument = async () => {
    if (!capturedDataUri) return;

    setIsProcessing(true);
    try {
      const result = await interpretHealthDocument({
        documentDataUri: capturedDataUri,
        targetLanguage: language,
      });
      setResponse({
        text: result.explanationText,
        audio: result.explanationAudioDataUri,
      });
    } catch (error: any) {
      console.error("Interpretation Error:", error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error.message || "Could not interpret the document. Please ensure it's clear and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCapturedDataUri(null);
    setResponse(null);
    setIsCameraActive(false);
  };

  const handleCloseResponse = () => {
    setResponse(null);
    setCapturedDataUri(null); // Securely purge document from client state
    toast({
      title: "Securely Cleared",
      description: "Document data has been removed from memory for your privacy.",
    });
  };

  const isPdf = capturedDataUri?.startsWith('data:application/pdf');

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 overflow-hidden bg-white/50 relative flex items-center justify-center shadow-inner">
        
        {isCameraActive && (
          <div className="absolute inset-0 z-10 bg-black">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline
            />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <Button onClick={takePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-primary p-0">
                <div className="w-12 h-12 rounded-full bg-primary" />
              </Button>
            </div>
          </div>
        )}

        {capturedDataUri ? (
          <div className="relative w-full h-full bg-muted">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <FileText className="w-20 h-20 text-primary opacity-50" />
                <p className="font-medium">PDF Document Ready</p>
              </div>
            ) : (
              <Image 
                src={capturedDataUri} 
                alt="Document preview" 
                fill 
                className="object-contain"
              />
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 z-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-bold tracking-tight">Uzima Mesh AI Analyzing...</p>
              </div>
            )}

            <Button 
              size="icon" 
              variant="destructive" 
              className="absolute top-4 right-4 rounded-full shadow-lg"
              onClick={reset}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : !isCameraActive && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center animate-in fade-in zoom-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-sm">
              <Camera className="w-10 h-10" />
            </div>
            <p className="font-headline font-bold text-xl text-foreground">Scan or Upload</p>
            <p className="text-sm px-4">Interpret prescriptions, reports, or IDs instantly in English or Swahili.</p>
          </div>
        )}

        {isCameraActive && hasCameraPermission === false && (
          <div className="absolute inset-0 z-20 bg-background/95 flex items-center p-4">
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use the live scanner. You can still upload files.
                </AlertDescription>
                <Button onClick={() => setIsCameraActive(false)} variant="outline" size="sm" className="mt-4 w-full">
                  Use File Upload
                </Button>
            </Alert>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-2 gap-4 w-full">
        {!capturedDataUri ? (
          <>
            <Button 
              className="h-16 rounded-2xl text-lg gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => setIsCameraActive(true)}
              disabled={isCameraActive}
            >
              <Camera className="w-6 h-6" />
              Scan Now
            </Button>
            <Button 
              variant="outline"
              className="h-16 rounded-2xl text-lg gap-2 border-primary text-primary hover:bg-primary/5 shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-6 h-6" />
              Upload PDF
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="h-16 rounded-2xl gap-2 border-primary text-primary hover:bg-primary/5"
              onClick={reset}
              disabled={isProcessing}
            >
              <RefreshCcw className="w-5 h-5" />
              Retake
            </Button>
            <Button 
              className="h-16 rounded-2xl text-lg gap-2 shadow-lg"
              onClick={processDocument}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {isProcessing ? "Reading..." : "Interpret"}
            </Button>
          </>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,application/pdf" 
        onChange={handleFileUpload}
      />

      <p className="text-[10px] text-muted-foreground text-center italic mt-2">
        Privacy First: Documents are processed securely and cleared after viewing.
      </p>

      {response && (
        <ResponseOverlay 
          title="Document Interpretation"
          text={response.text} 
          audioUri={response.audio} 
          onClose={handleCloseResponse} 
        />
      )}
    </div>
  );
}
