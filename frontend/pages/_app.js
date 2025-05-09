import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    // UnsafeBurnerWalletAdapter,
    // Add other wallet adapters you want to support
    PhantomWalletAdapter,
    SolflareWalletAdapter // Example: Add Solflare if you want to support it
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import "@/styles/globals.css";
import { HeroUIProvider } from '@heroui/react';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App({ Component, pageProps }) {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement the WalletStandardSpec can be found automatically.
             *
             * Note: UnsafeBurnerWalletAdapter is intended solely for testing and development.
             * Do not use it in production applications.
             */
            // new UnsafeBurnerWalletAdapter(), // Example: useful for testing
            new PhantomWalletAdapter(), // Add Phantom adapter instance
            new SolflareWalletAdapter({ network }), // Add Solflare, pass network if adapter requires
            // Add more adapters here if needed
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {/* Your existing providers/components */}
                    <HeroUIProvider>
                      <Component {...pageProps} />
                    </HeroUIProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
