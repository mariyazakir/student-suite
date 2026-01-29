/**
 * Personal Details Editor Component
 * 
 * Form for editing personal information (name, email, phone, location, links).
 * Updates resume data in real-time as user types.
 */

'use client';

import type { PersonalInfo } from '@/types';

interface PersonalDetailsEditorProps {
  data: PersonalInfo;
  onUpdate: (data: PersonalInfo) => void;
}

export default function PersonalDetailsEditor({
  data,
  onUpdate,
}: PersonalDetailsEditorProps) {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="section-card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Details</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="full-name-input" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="full-name-input"
            type="text"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="input-field"
            placeholder="John Doe"
            spellCheck={true}
            autoCorrect="on"
            autoCapitalize="words"
            lang="en-US"
            autoComplete="name"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email-input"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="input-field"
            placeholder="john@example.com"
            autoComplete="email"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            id="phone-input"
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="input-field"
            placeholder="+1 (555) 123-4567"
            autoComplete="tel"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="location-input" className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            id="location-input"
            type="text"
            value={data.location}
            onChange={(e) => handleChange('location', e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="input-field"
            placeholder="San Francisco, CA"
            spellCheck={true}
            autoCorrect="on"
            lang="en-US"
            autoComplete="address-line1"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="linkedin-input" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <input
            id="linkedin-input"
            type="url"
            value={data.linkedIn || ''}
            onChange={(e) => handleChange('linkedIn', e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="input-field"
            placeholder="https://linkedin.com/in/johndoe"
            autoComplete="url"
          />
        </div>

        <div>
          <label htmlFor="portfolio-input" className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio URL
          </label>
          <input
            id="portfolio-input"
            type="url"
            value={data.portfolio || ''}
            onChange={(e) => handleChange('portfolio', e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="input-field"
            placeholder="https://johndoe.dev"
            autoComplete="url"
          />
        </div>
      </div>
    </div>
  );
}
