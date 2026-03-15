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
    setCapturedDataUri(null); 
    toast({
      title: "Securely Cleared",
      description: "Document data has been removed from memory for your privacy.",
    });
  };

  const isPdf = capturedDataUri?.startsWith('data:application/pdf');

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-md mx-auto h-full overflow-y-auto pb-4">
      <div className="w-full aspect-[3/4] sm:aspect-[4/3] rounded-3xl border-2 border-dashed border-primary/20 overflow-hidden bg-white/40 relative flex items-center justify-center shadow-inner group transition-all">
        
        {isCameraActive && (
          <div className="absolute inset-0 z-10 bg-black">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline
            />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <Button onClick={takePhoto} className="w-20 h-20 rounded-full bg-white border-8 border-primary/20 p-0 shadow-2xl active:scale-95 transition-all">
                <div className="w-14 h-14 rounded-full bg-primary" />
              </Button>
            </div>
          </div>
        )}

        {capturedDataUri ? (
          <div className="relative w-full h-full bg-muted/20">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground animate-in zoom-in-95">
                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-primary opacity-50" />
                </div>
                <p className="font-headline font-bold text-lg">PDF Document Ready</p>
              </div>
            ) : (
              <Image 
                src={capturedDataUri} 
                alt="Document preview" 
                fill 
                className="object-contain p-4"
              />
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white gap-4 z-20 transition-all">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                </div>
                <div className="text-center">
                  <p className="font-headline font-black text-xl tracking-tight">Analyzing Document</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mt-1">Uzima Mesh AI Engine</p>
                </div>
              </div>
            )}

            <Button 
              size="icon" 
              variant="destructive" 
              className="absolute top-4 right-4 rounded-full shadow-xl z-30"
              onClick={reset}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : !isCameraActive && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-2 shadow-sm ring-1 ring-primary/10">
              <Camera className="w-10 h-10" />
            </div>
            <h3 className="font-headline font-black text-2xl text-foreground tracking-tight">Scan or Upload</h3>
            <p className="text-xs px-4 leading-relaxed max-w-[240px]">Interpret prescriptions, reports, or IDs instantly in English or Swahili.</p>
          </div>
        )}

        {isCameraActive && hasCameraPermission === false && (
          <div className="absolute inset-0 z-20 bg-background/95 flex items-center p-4">
             <Alert variant="destructive" className="border-none shadow-none">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-headline font-bold">Camera Access Required</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed mt-1">
                  Please allow camera access to use the live scanner. You can still upload files.
                </AlertDescription>
                <Button onClick={() => setIsCameraActive(false)} variant="outline" size="sm" className="mt-4 w-full rounded-xl border-destructive/20 hover:bg-destructive/5 text-destructive">
                  Use File Upload
                </Button>
            </Alert>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col gap-3 w-full">
        {!capturedDataUri ? (
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              className="h-14 sm:h-16 rounded-2xl text-base sm:text-lg gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => setIsCameraActive(true)}
              disabled={isCameraActive}
            >
              <Camera className="w-5 h-5" />
              Scan
            </Button>
            <Button 
              variant="outline"
              className="h-14 sm:h-16 rounded-2xl text-base sm:text-lg gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-5 h-5" />
              Upload
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline" 
              className="h-14 sm:h-16 rounded-2xl gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-md"
              onClick={reset}
              disabled={isProcessing}
            >
              <RefreshCcw className="w-4 h-4" />
              Retake
            </Button>
            <Button 
              className="h-14 sm:h-16 rounded-2xl text-base sm:text-lg gap-2 shadow-xl"
              onClick={processDocument}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isProcessing ? "Reading..." : "Interpret"}
            </Button>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,application/pdf" 
        onChange={handleFileUpload}
      />

      <p className="text-[10px] text-muted-foreground text-center font-medium italic mt-2 uppercase tracking-tight">
        Privacy First: Documents are processed securely and purged.
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
