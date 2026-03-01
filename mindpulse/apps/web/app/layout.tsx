import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindPulse - Mental Health Tracking',
  description: 'Track your mental health, manage stress, and improve wellbeing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
