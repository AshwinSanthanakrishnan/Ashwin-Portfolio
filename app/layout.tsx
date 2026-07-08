import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ashwin Santhanakrishnan | AI Data Analyst & Power Platform Developer",
  description: "Portfolio of Ashwin Santhanakrishnan, a Data Professional specializing in AI data analysis, data engineering, Power BI dashboards, Power Apps, and automated ETL pipelines.",
  keywords: ["Ashwin Santhanakrishnan", "Data Analyst", "Power Apps Developer", "Power BI", "Data Engineer", "ETL", "Python", "SQL", "Microsoft Power Platform"],
  authors: [{ name: "Ashwin Santhanakrishnan" }],
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
