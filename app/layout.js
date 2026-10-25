import { Prompt, Sarabun } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-prompt",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sarabun",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ea580c",
};

export const metadata = {
  title: "ระบบคำร้องขอรับการช่วยเหลือสาธารณภัย",
  description: "ระบบยื่นคำร้องขอรับการช่วยเหลือทางด้านสาธารณภัย กรอกแบบฟอร์ม ลงลายมือชื่อ และติดตามสถานะคำร้อง",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚨</text></svg>" />
      </head>
      <body className={prompt.className}>
        {children}
      </body>
    </html>
  );
}

