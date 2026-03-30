import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mathing Cashflow",
  description: "MVP SaaS para predicción de tensión de caja y simulación financiera",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
