import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ashwin Santhanakrishnan | AI Engineer & Data Professional",
  description: "Portfolio of Ashwin Santhanakrishnan, an AI Engineer and Data Professional specializing in AI data analysis, data engineering, Power Platform development, and machine learning pipelines.",
  keywords: ["Ashwin Santhanakrishnan", "AI Engineer", "AI Data Analyst", "Power Apps Developer", "Power BI", "Data Engineer", "ETL", "Python", "SQL", "Microsoft Power Platform", "Machine Learning", "Vibe Coding"],
  authors: [{ name: "Ashwin Santhanakrishnan" }],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer"
        />
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
