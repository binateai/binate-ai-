import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Link as LinkIcon } from "lucide-react";
import BinateQRCode from "@/components/qr-code";

export default function QRCodeDownload() {
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const websiteUrl = "https://binateai.com";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Create a canvas from the SVG
    const svg = qrCodeRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions (with higher resolution for better quality)
    const scale = 10; // Scale factor for higher resolution
    canvas.width = 370; // 37*10
    canvas.height = 370; // 37*10

    // Create a new Image to draw the SVG on the canvas
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Fill background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "binateai-qrcode.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
      
      URL.revokeObjectURL(svgUrl);
    };
    
    img.src = svgUrl;
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert("Web Share API is not available on your browser");
      return;
    }

    try {
      await navigator.share({
        title: "Binate AI",
        text: "Check out Binate AI - Your Autonomous Executive Assistant",
        url: websiteUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="border-b border-gray-800 p-4 md:p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 relative">
            <img 
              src="/images/binate-logo.png" 
              alt="Binate AI Logo" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold font-['Poppins'] bg-gradient-to-r from-teal-400 to-purple-500 bg-clip-text text-transparent">
              Binate AI
            </h1>
            <div className="text-xs px-2 py-0.5 bg-red-900/70 text-amber-300 rounded-full font-semibold border border-amber-700/50 animate-pulse">
              BETA
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-center">Binate AI QR Code</h2>
            
            <div className="bg-white p-6 rounded-lg mb-6 w-64 h-64" ref={qrCodeRef}>
              <BinateQRCode />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-300 mb-2">Scan with your phone to visit</p>
              <div className="flex items-center justify-center">
                <a 
                  href={websiteUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline inline-flex items-center"
                >
                  {websiteUrl}
                  <LinkIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                onClick={handleDownload}
                className="flex-1 bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              
              <Button
                onClick={handleShare}
                className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                disabled={!navigator.share}
              >
                <Share className="h-4 w-4" />
                Share
              </Button>
              
              <Button
                onClick={handleCopyLink}
                className="flex-1 bg-gray-700 hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 p-6 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Binate AI. All rights reserved.</p>
      </footer>
    </div>
  );
}