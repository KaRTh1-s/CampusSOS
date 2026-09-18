import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReportProvider } from './context/ReportContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/pages.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ReportProvider>
        <Header />
        <main className="main-content" role="main">
          <Routes>
            <Route path="/" element={<ReportIssuePage />} />
            <Route path="/analyze" element={<AnalysisPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </ReportProvider>
    </BrowserRouter>
  );
};

export default App;
