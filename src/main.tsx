import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { base } from 'viem/chains'
import './index.css'
import App from './App.jsx'

// Privy app ID — public client-side value, safe to hardcode as fallback
const PRIVY_APP_ID = (import.meta.env.VITE_PRIVY_APP_ID || 'cmn00hmnj02au0ckvt07typje').trim()
console.log('[Yieldling] PRIVY_APP_ID resolved:', PRIVY_APP_ID.slice(0, 6) + '…', 'length:', PRIVY_APP_ID.length)
const PRIVY_READY  = Boolean(PRIVY_APP_ID)

// Error boundary — shows the real Privy error instead of a generic screen
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
          <div style={{fontSize:'56px'}}>⚠️</div>
          <h2 style={{fontSize:'22px',fontWeight:900,margin:0}}>Privy initialisation error</h2>
          <p style={{color:'#5a6080',maxWidth:'400px',lineHeight:1.6,margin:0}}>
            App ID: <code style={{color:'#7c6aff'}}>{PRIVY_APP_ID.slice(0,8)}…</code>
          </p>
          <p style={{
            color:'#ff6a6a',maxWidth:'500px',lineHeight:1.6,margin:0,
            fontSize:13,background:'#1a0a0a',padding:'12px 16px',borderRadius:10,
            fontFamily:'monospace',textAlign:'left',wordBreak:'break-word',
          }}>
            {this.state.err}
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
      <code style={{color:'#7c6aff'}}>VITE_PRIVY_APP_ID=your-app-id</code>
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
            defaultChain: base,
            supportedChains: [base],
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
