import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Gemini & Veo Watermark Remover | Precision Reverse Alpha Blending",
  description:
    "100% client-side mathematically exact reverse alpha blending restoration for Google Gemini AI images and Veo videos. Zero cloud uploads, zero quality loss.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f9eb] text-[#000000] font-sans selection:bg-[#aafdc0] selection:text-[#003d21]">
        <TooltipProvider delay={150}>
          {children}
          <Toaster richColors position="bottom-right" theme="light" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
