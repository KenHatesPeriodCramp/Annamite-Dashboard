import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview          from './pages/Overview';
import Exposures         from './pages/Exposures';
import ManagerAnalysis   from './pages/ManagerAnalysis';
import RiskMargin        from './pages/RiskMargin';
import TradeBlotter      from './pages/TradeBlotter';
import CorrelationMatrix from './pages/CorrelationMatrix';
import StressTesting     from './pages/StressTesting';
import MultifactorAnalysis from './pages/MultifactorAnalysis';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index            element={<Overview />} />
          <Route path="exposures" element={<Exposures />} />
          <Route path="managers"  element={<ManagerAnalysis />} />
          <Route path="risk"      element={<RiskMargin />} />
          <Route path="blotter"   element={<TradeBlotter />} />
          <Route path="correlation" element={<CorrelationMatrix />} />
          <Route path="stress"    element={<StressTesting />} />
          <Route path="multifactor" element={<MultifactorAnalysis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
