import Link from 'next/link';
import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

export default function AboutPage() {
  return (
    <PolicyPageLayout title="About Student Suite">
      {`Student Suite is an educational and productivity platform designed to assist students with tools, features, and AI-based suggestions.

App: Student Suite
Version: v1.0.0

© 2026 Student Suite (owner-operated by MARIYA ZAKIR). ALL rights reserved.

We offer:
- Resume Builder — Build ATS-ready resumes with live preview and templates
- Notes → PDF — Convert study notes into clean, shareable PDFs
- Assignment Formatter — Format assignments to academic standards
- PDF Tools — Merge, compress, and organize your PDFs
- Templates — Professional templates for resumes and papers

For support or legal notices, visit our Contact page or email support@studentsuite.app.`}
      <div className="mt-8 pt-6 border-t border-[color:var(--sidebar-border)]">
        <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)] mb-2">Policies</p>
        <div className="flex flex-col gap-1 text-sm">
          <Link href="/terms" className="text-[color:var(--topbar-text)] underline">Terms & Conditions</Link>
          <Link href="/privacy" className="text-[color:var(--topbar-text)] underline">Privacy Policy</Link>
          <Link href="/disclaimer" className="text-[color:var(--topbar-text)] underline">General Disclaimer</Link>
          <Link href="/user-content" className="text-[color:var(--topbar-text)] underline">User Content Policy</Link>
          <Link href="/copyright" className="text-[color:var(--topbar-text)] underline">Copyright & Ownership</Link>
          <Link href="/ads" className="text-[color:var(--topbar-text)] underline">Ads & Third-Party Disclaimer</Link>
          <Link href="/refund" className="text-[color:var(--topbar-text)] underline">Refund & Cancellation</Link>
        </div>
      </div>
    </PolicyPageLayout>
  );
}
