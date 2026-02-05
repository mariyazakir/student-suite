import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `PRIVACY POLICY
For Student Suite
Last Updated: 26/01/2026
Student Suite ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, store, process, and protect your information when you use our website, mobile application, and related services (collectively, the "Service").
By using Student Suite, you agree to this Privacy Policy.

1. About Student Suite
Student Suite is currently a free, ad-supported educational and productivity platform.
We may introduce paid features in the future. If we do, this Privacy Policy will be updated accordingly.

2. Information We Collect
We collect only the information necessary to operate and improve the Service.
a) Information You Provide
- Email address (for account creation, login, security, and recovery)
- Username or display name
- Content you upload (notes, files, images, academic work)
- Optional profile information (if you choose to provide it)
b) Automatically Collected Information
- IP address
- Device type
- Browser type
- Operating system
- App usage data
- Log files
- Cookies and similar tracking technologies
c) Payment Information
Currently, we do not collect or store any payment information because Student Suite is free at this time.
If paid features are introduced in the future, payments will be handled by secure third-party gateways, and this policy will be updated.

3. Legal Basis for Processing Data
We process personal data based on:
- Your consent
- Providing and operating the Service
- Legitimate business interests
- Compliance with legal obligations

4. How We Use Your Information
We use your information to:
- Create and manage user accounts
- Provide and improve features
- Maintain security and prevent misuse
- Analyze usage and performance
- Display advertisements
- Communicate important updates
- Enforce our Terms & Conditions

5. AI & Automated Features
Some features may use AI or automated systems to generate suggestions or assistance.
Important:
- AI outputs are suggestions only
- They are not guaranteed to be accurate
- They do not constitute professional advice

6. Children's Privacy (Users Under 18)
Student Suite may be used by students under 18 years of age.
- Users under 18 must have parental or guardian permission
- Parents or guardians are responsible for supervision
- We do not knowingly collect unnecessary personal data from minors
If a user misrepresents their age, responsibility lies with the user and/or guardian.

7. Cookies & Tracking Technologies
We use cookies and similar technologies to:
- Keep users logged in
- Improve platform performance
- Analyze usage patterns
- Display advertisements
You can control cookies through your browser settings.

8. Do Not Track Signals
Some browsers send "Do Not Track" signals.
Currently, Student Suite does not respond to these signals due to the lack of a universal standard.

9. Advertisements
Student Suite displays advertisements to support free access.
Third-party ad partners (such as Google AdSense) may use cookies or similar technologies to show relevant ads.
We do not control third-party ad content.
You can manage ad personalization through Google Ad Settings.

10. Third-Party Service
We use trusted third-party services such as:
- Google Analytics
- Firebase
- Google AdSense
These services operate under their own privacy policies.
We are not responsible for how third parties collect or use data.

11. Data Storage & International Transfers
Your data may be stored or processed on servers located outside India due to global cloud service providers.
By using Student Suite, you consent to such international data transfers.

12. Data Security
We use reasonable security measures, including:
- Secure servers
- Encryption
- Access controls
- Monitoring systems
However, no method of storage or transmission is completely secure.

13. Data Retention
We retain personal data:
- While your account is active
- As required by law
- For legitimate business and operational purposes

14. Account Deactivation vs Deletion
- Deactivation: Your account is disabled, but data may remain stored
- Deletion: Your personal data is permanently removed, subject to legal requirements

15. Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Withdraw consent
- Close your account
Requests can be made through our support system.

16. Consent Withdrawal
You may withdraw your consent at any time by closing your account or contacting support.

17. Data Loss Disclaimer
We are not responsible for:
- Accidental data deletion
- Device or hardware failure
- Sync issues
- Server outages
Users are responsible for maintaining backups of important data.

18. Data Sharing
We do not sell personal data.
We may share data only:
- If required by law
- With service providers assisting in operations
- For security and fraud prevention
- With your explicit consent

19. Law Enforcement & Legal Requests
We may disclose personal data if required by:
- Courts
- Government authorities
- Law enforcement agencies

20. Business Transfers
If Student Suite is sold, merged, or transferred, user data may also be transferred as part of that transaction.

21. Email & System Communications
We may send emails or notifications related to:
- Account activity
- Security alerts
- Legal notices
- Policy updates
- System communications

22. Changes to This Privacy Policy
We may update this Privacy Policy at any time.
Continued use of the Service means acceptance of the updated policy.

23. Governing Law
This Privacy Policy is governed by the laws of India.

24. Contact
Student Suite (Owner-operated)
Legal and privacy notices may be sent via email, in-app notifications, or website updates.`;

export default function PrivacyPage() {
  return (
    <PolicyPageLayout title="Privacy Policy">
      {CONTENT}
    </PolicyPageLayout>
  );
}
