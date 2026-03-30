import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import Strategies from './pages/Strategies'
import ReturnDecomp from './pages/ReturnDecomp'
import Factors from './pages/Factors'
import Barra from './pages/Barra'
import Correlation from './pages/Correlation'
import Macro from './pages/Macro'
import Regime from './pages/Regime'
import Retail from './pages/Retail'
import PortfolioTracking from './pages/PortfolioTracking'
import Chatbot from './pages/Chatbot'

const PAGES = {
  overview: Overview,
  strategies: Strategies,
  returns: ReturnDecomp,
  factors: Factors,
  barra: Barra,
  correlation: Correlation,
  macro: Macro,
  regime: Regime,
  retail: Retail,
  portfolioTracking: PortfolioTracking,
  chatbot: Chatbot,
}

export default function App() {
  const [page, setPage] = useState('overview')
  const Page = PAGES[page] || Overview

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb]">
      <Sidebar active={page} onNav={setPage} />
      <main className="flex-1 overflow-y-auto bg-[#f4f7fb]">
        <Page />
      </main>
    </div>
  )
}
