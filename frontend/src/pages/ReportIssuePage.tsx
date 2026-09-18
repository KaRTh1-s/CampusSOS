import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import { analyzeIssue } from '../services/api';
import { validateDescription, validateLocation, MAX_DESCRIPTION_LENGTH } from '../utils/validation';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ErrorBanner } from '../components/ErrorBanner';
import { SparklesIcon, MapPinIcon, InfoIcon } from '../components/Icons';

const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const QUICK_PROMPTS = [
  {
    label: '⚡ Electrical Smoke',
    text: 'There is smoke and a burning smell coming from an electrical panel in our 2nd floor classroom.',
    location: 'Block B, 2nd Floor, Room 204',
  },
  {
    label: '🚰 Leaking Washroom Tap',
    text: 'The hostel 3rd floor bathroom tap is broken and water is continuously dripping onto the floor.',
    location: 'Hostel 4, 3rd Floor East Wing',
  },
  {
    label: '🪪 Lost Student ID',
    text: 'I lost my college ID card near the main library study pod yesterday afternoon.',
    location: 'Central Library, 2nd Floor',
  },
  {
    label: '🔒 Reported Theft Incident',
    text: 'My backpack with my laptop was taken from the cafeteria table while I went to get water.',
    location: 'Student Center Cafeteria',
  },
];

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    description,
    setDescription,
    location,
    setLocation,
    evidenceFile,
    setEvidenceFile,
    isAnalyzing,
    setIsAnalyzing,
    setAnalysisResult,
    error,
    setError,
  } = useReport();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount or when file changes (prevents memory leak)
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEvidenceError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (!file) {
      setEvidenceFile(null);
      return;
    }
    if (!ALLOWED_EVIDENCE_TYPES.includes(file.type)) {
      setEvidenceError('Only JPEG, PNG, and WebP images are accepted.');
      setEvidenceFile(null);
      return;
    }
    if (file.size > MAX_EVIDENCE_SIZE) {
      setEvidenceError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      setEvidenceFile(null);
      return;
    }
    setEvidenceFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveEvidence = () => {
    setEvidenceFile(null);
    setEvidenceError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const handleSelectExample = (prompt: typeof QUICK_PROMPTS[0]) => {
    setDescription(prompt.text);
    setLocation(prompt.location);
    setValidationError(null);
    setError(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate description
    const descValidation = validateDescription(description);
    if (!descValidation.isValid) {
      setValidationError(descValidation.error || 'Please provide a valid description.');
      return;
    }

    // 2. Validate location
    const locValidation = validateLocation(location);
    if (!locValidation.isValid) {
      setValidationError(locValidation.error || 'Location input is too long.');
      return;
    }

    setValidationError(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeIssue({
        description: description.trim(),
        location: location.trim() || undefined,
      });

      setAnalysisResult(result);
      navigate('/analyze');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Unable to analyze your report at this moment. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const charCount = description.length;
  const isApproachingLimit = charCount > MAX_DESCRIPTION_LENGTH - 100;
  const isOverLimit = charCount > MAX_DESCRIPTION_LENGTH;

  return (
    <div className="page-container">
      <section className="hero-section">
        <div className="hero-pill">
          <SparklesIcon size={14} />
          <span>AI-Assisted Incident Triage</span>
        </div>
        <h1 className="hero-title">Report a Campus Issue</h1>
        <p className="hero-subtitle">
          Describe what happened in your own words. We will analyze the urgency, prepare immediate safety instructions,
          and route the report to the right campus department.
        </p>

        <div className="disclaimer-box" role="note">
          <InfoIcon size={18} className="disclaimer-icon" />
          <span>
            <strong>Important:</strong> CampusSOS is a reporting assistant. It does not replace 911 or trained campus
            emergency staff. In immediate life-threatening danger, alert security or evacuate immediately.
          </span>
        </div>
      </section>

      <div className="card">
        {isAnalyzing ? (
          <LoadingOverlay
            title="Analyzing your report..."
            subtitle="Evaluating urgency, identifying category, and preparing safety guidance"
          />
        ) : (
          <form onSubmit={handleAnalyze} noValidate>
            {error && <ErrorBanner title="Analysis Failed" message={error} />}
            {validationError && <ErrorBanner title="Validation Error" message={validationError} />}

            <div className="form-group">
              <label htmlFor="issue-description" className="form-label">
                <span>
                  What happened? <span style={{ color: 'var(--priority-critical-border)' }}>*</span>
                </span>
                <span className="form-optional-tag">Required (10–2000 chars)</span>
              </label>

              <textarea
                id="issue-description"
                name="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe what happened, where it happened, and anything important someone responding should know..."
                className="form-textarea"
                rows={5}
                aria-required="true"
                aria-invalid={!!validationError}
                aria-describedby="char-counter"
                disabled={isAnalyzing}
              />

              <div className="counter-bar" id="char-counter">
                <span>Minimum 10 characters</span>
                <span
                  className={`counter-text ${
                    isOverLimit ? 'error' : isApproachingLimit ? 'warn' : ''
                  }`}
                >
                  {charCount} / {MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="issue-location" className="form-label">
                <span>Location</span>
                <span className="form-optional-tag">Optional</span>
              </label>

              <div className="form-input-with-icon">
                <span className="form-input-icon" aria-hidden="true">
                  <MapPinIcon size={18} />
                </span>
                <input
                  id="issue-location"
                  type="text"
                  name="location"
                  value={location}
                  onChange={handleLocationChange}
                  placeholder="e.g., Block B, 2nd Floor, Room 204 or Central Library"
                  className="form-input"
                  maxLength={200}
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="issue-evidence" className="form-label">
                <span>Evidence Photo</span>
                <span className="form-optional-tag">Optional — attach a photo of the issue</span>
              </label>

              <input
                id="issue-evidence"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleEvidenceChange}
                disabled={isAnalyzing}
                style={{ display: 'none' }}
              />
              {!evidenceFile && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  style={{ width: '100%' }}
                >
                  Choose Image (JPEG, PNG, WebP — max 5 MB)
                </button>
              )}
              {evidenceError && <p style={{ color: 'var(--priority-critical-border)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{evidenceError}</p>}
              {evidenceFile && previewUrl && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', background: 'var(--bg-color, #f7fafc)' }}>
                  <img
                    src={previewUrl}
                    alt="Evidence preview"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color, #e2e8f0)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{evidenceFile.name}</p>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted, #718096)', fontSize: '0.85rem' }}>
                      {(evidenceFile.size / 1024).toFixed(1)} KB • {evidenceFile.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRemoveEvidence}
                    aria-label="Remove evidence"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={isAnalyzing || description.trim().length === 0}
              >
                <SparklesIcon size={18} />
                <span>Analyze Issue</span>
              </button>
            </div>

            <div className="quick-examples">
              <p className="quick-examples-title">Or test with a sample incident:</p>
              <div className="quick-examples-grid">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    className="example-chip"
                    onClick={() => handleSelectExample(prompt)}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
