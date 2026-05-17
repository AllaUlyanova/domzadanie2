import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MascotHelper } from "@/components/mascot/MascotHelper";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Школьный день AI — проверка домашки, 3 класс",
  description: "Умная проверка домашних заданий по учебникам РФ. 3 класс, 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${nunito.variable} min-h-screen`}>
        <Providers>
          {children}
          <MascotHelper />
        </Providers>
      </body>
    </html>
  );
}
