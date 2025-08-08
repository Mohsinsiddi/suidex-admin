import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {
  AllDefaultWallets,
  WalletProvider,
} from "@suiet/wallet-kit";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider
      defaultWallets={[
        ...AllDefaultWallets,
      ]}
    >
      <App />
    </WalletProvider>
  </StrictMode>,
)


