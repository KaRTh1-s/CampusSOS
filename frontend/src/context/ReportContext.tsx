import React, { createContext, useContext, useState } from 'react';
import { AnalysisResult, Report } from '../types';

interface ReportContextType {
  description: string;
  setDescription: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  evidenceFile: File | null;
  setEvidenceFile: (val: File | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (val: AnalysisResult | null) => void;
  latestReport: Report | null;
  setLatestReport: (val: Report | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  error: string | null;
  setError: (val: string | null) => void;
  resetReportFlow: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetReportFlow = () => {
    setDescription('');
    setLocation('');
    setEvidenceFile(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setLatestReport(null);
    setIsSubmitting(false);
    setError(null);
  };

  return (
    <ReportContext.Provider
      value={{
        description,
        setDescription,
        location,
        setLocation,
        evidenceFile,
        setEvidenceFile,
        isAnalyzing,
        setIsAnalyzing,
        analysisResult,
        setAnalysisResult,
        latestReport,
        setLatestReport,
        isSubmitting,
        setIsSubmitting,
        error,
        setError,
        resetReportFlow,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};
