import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.jsx'

const BASE_SEPOLIA = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
  blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
  testnet: true,
}

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? ''
const PRIVY_READY  = Boolean(PRIVY_APP_ID && PRIVY_APP_ID !== 'your-privy-app-id-here')

// Error boundary for Privy initialisation failures
class PrivyErrorBoundary extends Component<
  { children: React.ReactNode },
  { err: string | null }
> {
  constructor(props: any) { super(props); this.state = { err: null } }
  static getDerivedStateFromError(e: Error) { return { err: e.message } }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          minHeight:'100vh',background:'#080c14',color:'#eef0f8',fontFamily:'sans-serif',
          textAlign:'center',padding:'40px',gap:'16px',
        }}>
          <div style={{fontSize:'56px'}}>🔑</div>
          <h2 style={{fontSize:'22px',fontWeight:900,margin:0}}>Privy App ID required</h2>
          <p style={{color:'#5a6080',maxWidth:'360px',lineHeight:1.6,margin:0}}>
            Add your Privy App ID to <code style={{background:'#141a28',padding:'2px 8px',borderRadius:6}}>.env</code>:<br/>
            <code style={{color:'#7c6aff'}}>VITE_PRIVY_APP_ID=clxxxxxxxxxxxxxxxx</code>
          </p>
          <p style={{color:'#5a6080',fontSize:13,margin:0}}>
            Get one free at <a href="https://dashboard.privy.io" target="_blank" rel="noreferrer" style={{color:'#7c6aff'}}>dashboard.privy.io</a>
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

const SetupRequired = () => (
  <div style={{
    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
    minHeight:'100vh',background:'#080c14',color:'#eef0f8',fontFamily:'sans-serif',
    textAlign:'center',padding:'40px',gap:'16px',
  }}>
    <div style={{fontSize:'56px'}}>🔑</div>
    <h2 style={{fontSize:'22px',fontWeight:900,margin:0}}>Privy App ID required</h2>
    <p style={{color:'#5a6080',maxWidth:'360px',lineHeight:1.6,margin:0}}>
      Add your Privy App ID to <code style={{background:'#141a28',padding:'2px 8px',borderRadius:6}}>.env</code>:<br/>
      <code style={{color:'#7c6aff'}}>VITE_PRIVY_APP_ID=clxxxxxxxxxxxxxxxx</code>
    </p>
    <p style={{color:'#5a6080',fontSize:13,margin:0}}>
      Get one free at <a href="https://dashboard.privy.io" target="_blank" rel="noreferrer" style={{color:'#7c6aff'}}>dashboard.privy.io</a>
    </p>
  </div>
)

const root = createRoot(document.getElementById('root')!)

if (PRIVY_READY) {
  root.render(
    <StrictMode>
      <PrivyErrorBoundary>
        <PrivyProvider
          appId={PRIVY_APP_ID}
          config={{
            loginMethods: ['email', 'wallet', 'google'],
            appearance: {
              theme: 'dark',
              accentColor: '#7c6aff',
              logo: '',
            },
            defaultChain: BASE_SEPOLIA,
            supportedChains: [BASE_SEPOLIA],
            embeddedWallets: {
              ethereum: { createOnLogin: 'users-without-wallets' },
            },
          }}
        >
          <App />
        </PrivyProvider>
      </PrivyErrorBoundary>
    </StrictMode>,
  )
} else {
  root.render(<SetupRequired />)
}
