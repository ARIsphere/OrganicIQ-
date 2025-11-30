import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import KeywordStrategy from './components/KeywordStrategy';
import ContentGenerator from './components/ContentGenerator';
import CompetitorAnalysis from './components/CompetitorAnalysis';
import SeoAudit from './components/SeoAudit';
import Pricing from './components/Pricing';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUDIT);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.KEYWORDS:
        return <KeywordStrategy />;
      case AppView.CONTENT:
        return <ContentGenerator />;
      case AppView.COMPETITORS:
        return <CompetitorAnalysis />;
      case AppView.AUDIT:
        return <SeoAudit />;
      case AppView.PRICING:
        return <Pricing />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;