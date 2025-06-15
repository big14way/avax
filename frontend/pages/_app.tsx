import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { avalancheFuji } from 'viem/chains';
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { SUPPORTED_CHAINS, RAINBOWKIT_CONFIG } from '@/config/web3Config';

import '@rainbow-me/rainbowkit/styles.css';

// Configure chains and providers
const { chains, publicClient } = configureChains(SUPPORTED_CHAINS, [publicProvider()]);

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: RAINBOWKIT_CONFIG.appName,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains,
});

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

// Create query client
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>DREMS Platform - Decentralized Real Estate Marketplace</title>
        <meta name="description" content="Revolutionary RWA tokenization platform for global real estate investment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider 
            chains={chains}
            appInfo={RAINBOWKIT_CONFIG}
          >
            <Component {...pageProps} />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </>
  );
} 