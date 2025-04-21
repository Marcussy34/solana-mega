import "@/styles/globals.css";
import { HeroUIProvider } from '@heroui/react';

export default function App({ Component, pageProps }) {
  return (
    <HeroUIProvider>
      <Component {...pageProps} />
    </HeroUIProvider>
  );
}
