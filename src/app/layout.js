import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'SportSpace — Find & Book Sports Courts',
  description: 'Book tennis, padel, badminton, soccer, and basketball courts online.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--navy)' }}>
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
