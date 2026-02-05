import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `Contact Student Suite

For support, billing, or legal notices:

Email: support@studentsuite.app

Legal and privacy notices may also be sent via in-app notifications or website updates.

Student Suite (Owner-operated by MARIYA ZAKIR)
© 2026 Student Suite. All rights reserved.`;

export default function ContactPage() {
  return (
    <PolicyPageLayout title="Contact">
      {CONTENT}
    </PolicyPageLayout>
  );
}
