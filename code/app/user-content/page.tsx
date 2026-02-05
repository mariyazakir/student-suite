import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `USER CONTENT POLICY
For Student Suite
Last Updated: 26/01/2026
This User Content Policy explains the rules, responsibilities, and rights related to content uploaded, submitted, or stored by users on Student Suite.
By uploading or submitting any content, you agree to comply with this policy.

1. Types of User Content
Users may upload or submit content including, but not limited to:
- Notes
- Images or photos
- Files or documents
- Academic or study material
- Personal educational content

2. Ownership of User Content
- You retain full ownership of any content you upload.
- Student Suite does NOT claim ownership of user-generated content.
By uploading content, you grant Student Suite a limited, non-exclusive, revocable right to store, process, and display the content only for the purpose of providing and operating the Service.

3. User Responsibility
You are solely responsible for the content you upload.
You confirm that:
- You own the content or have legal permission to use it
- The content complies with all applicable laws
- The content does not infringe copyrights, trademarks, or other rights
- The content is not harmful, misleading, or malicious

4. Prohibited Content
You must NOT upload content that:
- Is illegal or unlawful
- Infringes intellectual property rights
- Contains malware, viruses, or harmful code
- Is abusive, hateful, violent, or obscene
- Violates the privacy or rights of others
- Is misleading, fraudulent, or deceptive

5. Content Review & Removal
Student Suite reserves the right to:
- Review user content
- Remove, restrict, or delete content without prior notice
- Suspend or terminate accounts for policy violations
Content removal may occur at our sole discretion.

6. No Liability for User Content
Student Suite is not responsible or liable for:
- User-generated content
- Accuracy, legality, or reliability of uploaded content
- Disputes between users related to content
Any disputes related to user content are solely between the involved users.

7. Data Storage & Loss
While reasonable security measures are used, Student Suite is not responsible for:
- Data loss
- Accidental deletion
- Technical failures
- Device, server, or sync issues
Users are responsible for maintaining backups of their content.

8. Reporting Violations
If you believe any content violates this policy, you may report it through our support or reporting system.

9. Changes to This Policy
We may update this User Content Policy at any time.
Continued use of Student Suite means acceptance of the updated policy.

10. Governing Law
This User Content Policy is governed by the laws of India.

11. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`;

export default function UserContentPage() {
  return (
    <PolicyPageLayout title="User Content Policy">
      {CONTENT}
    </PolicyPageLayout>
  );
}
