/**
 * Certifications Editor Component
 * 
 * Manages list of certification entries.
 * Allows adding, editing, and removing certification items.
 */

'use client';

import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Certification } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';

interface CertificationsEditorProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function CertificationsEditor({
  certifications,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: CertificationsEditorProps) {
  const addCertification = () => {
    const newCert: Certification = {
      id: uuidv4(),
      certificateName: '',
      issuer: '',
      year: '',
      credentialLink: '',
    };
    onUpdate([...certifications, newCert]);
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    onUpdate(
      certifications.map((cert) => (cert.id === id ? { ...cert, ...updates } : cert))
    );
  };

  const removeCertification = (id: string) => {
    onUpdate(certifications.filter((cert) => cert.id !== id));
  };

  const sectionText = certifications
    .flatMap((cert) => [cert.certificateName, cert.issuer, cert.year, cert.credentialLink])
    .filter(Boolean)
    .join(' ');
  const { missingKeywords, missingPhrases } = useMemo(
    () => getMissingKeywordsForText(sectionText, jobKeywords, jobPhrases),
    [sectionText, jobKeywords, jobPhrases]
  );
  const missingItems = [...missingKeywords, ...missingPhrases].slice(0, 6);
  const highlightTerms = useMemo(
    () => [...jobPhrases, ...jobKeywords],
    [jobPhrases, jobKeywords]
  );

  return (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
        <button onClick={addCertification} className="btn-secondary text-sm max-[480px]:text-sm max-[480px]:px-1.5 max-[480px]:py-1 max-[480px]:min-h-[44px]" aria-label="Add new certification entry">
          + Add Certification
        </button>
      </div>

      {missingItems.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Missing keywords: {missingItems.join(', ')}
        </p>
      )}
      {sectionText.trim() && highlightTerms.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Highlight preview: <KeywordHighlight text={sectionText} terms={highlightTerms} />
        </p>
      )}

      {certifications.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
          No certification entries yet. Click “Add Certification” to get started.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Certification entries">
        {certifications.map((cert) => (
          <div key={cert.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Certification Entry</h3>
              <button
                onClick={() => removeCertification(cert.id)}
                className="btn-secondary text-sm"
                aria-label={`Remove certification ${cert.certificateName || 'entry'}`}
              >
                Remove
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div>
                <label htmlFor={`certificate-name-${cert.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Name *
                </label>
                <input
                  id={`certificate-name-${cert.id}`}
                  type="text"
                  value={cert.certificateName}
                  onChange={(e) => updateCertification(cert.id, { certificateName: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="AWS Certified Solutions Architect"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor={`issuer-${cert.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer *
                </label>
                <input
                  id={`issuer-${cert.id}`}
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="Amazon Web Services"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor={`year-${cert.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  id={`year-${cert.id}`}
                  type="text"
                  value={cert.year}
                  onChange={(e) => updateCertification(cert.id, { year: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="2023"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor={`credential-link-${cert.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Credential Link
                </label>
                <input
                  id={`credential-link-${cert.id}`}
                  type="url"
                  value={cert.credentialLink || ''}
                  onChange={(e) => updateCertification(cert.id, { credentialLink: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="https://credential-link.com"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
