import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `TERMS & CONDITION
For Student Suite
Last Updated: 26/01/2026
Welcome to Student Suite. These Terms and Conditions ("Terms") govern your access to and use of the Student Suite website, mobile application, and services (collectively, the "Service").
By accessing or using Student Suite, you agree to be bound by these Terms. If you do not agree, please do not use the Service.

1. About Student Suite
Student Suite is an educational and productivity platform designed to assist students with tools, features, and AI-based suggestions.
Student Suite is currently operated as an owner-operated platform and may later be transferred to or operated by a registered legal entity.

2. Eligibility & Minors
- You must be at least 13 years old to use Student Suite.
- If you are under 18 years of age, you confirm that you have obtained permission from a parent or legal guardian.
- Parents or legal guardians are responsible for monitoring and supervising the activities of minors.

3. Account Registration
To access certain features, you may be required to create an account.
You agree that:
- The information you provide is accurate and complete.
- You will not impersonate any person or entity.
- You will keep your login credentials confidential.
- You are responsible for all activities under your account.
We reserve the right to suspend or terminate any account that violates these Terms.

4. Privacy & Data Protection
We respect your privacy.
By using Student Suite, you agree to our Privacy Policy, which explains:
- What data we collect
- Why we collect it
- How we use it
- How we protect it

5. User Content & Uploads
Users may upload personal information, files, notes, images, or photos of their work.
You confirm that:
- You own or have rights to the content you upload.
- Your content does not violate any law.
- Your content does not infringe copyrights or trademarks.
- Your content is not harmful, abusive, or illegal.
We do not claim ownership of your content.
However, we reserve the right to remove any content that violates these Terms or applicable laws.

6. Educational Purpose & No Professional Advice
Student Suite provides educational tools, productivity features, and AI-generated suggestions.
All content is provided for informational and educational purposes only.
We do NOT provide:
- Legal advice
- Medical advice
- Financial advice
- Career guarantees
- Academic guarantees
You use all information at your own discretion and risk.

7. No Guarantee of Results
We do not guarantee:
- Improved grades
- Academic success
- Job placement
- Career outcomes
- Any specific results
Results depend on individual effort and circumstances.

8. Subscriptions & Payments
Student Suite may offer paid plans, including subscriptions (currently planned at ₹98/month).
By purchasing:
- You agree to pay applicable fees.
- Prices may change with notice.
- Payments are handled by third-party gateways (UPI, cards, Razorpay, etc.).
We are not responsible for third-party payment failures.

9. Refunds & Cancellations
Refunds are governed by our Refund Policy.
We reserve the right to deny refunds in cases of misuse, fraud, or abuse.

10. Advertisements & Third-Party Services
Student Suite may display ads and use third-party services such as:
- Google AdSense
- Google Analytics
- Firebase
We are not responsible for:
- Third-party content
- External websites
- External offers
- Third-party privacy practices
Use of third-party services is at your own risk.

11. Prohibited Activities
You agree NOT to:
- Violate any law
- Upload illegal or harmful content
- Hack, scrape, or reverse engineer
- Abuse other users
- Disrupt the platform
- Bypass security systems
- Misuse AI features
Violations may result in:
- Account suspension
- Permanent ban
- Legal action

12. Intellectual Property
All platform content including:
- Branding
- Logos
- UI/UX
- Design
- Code
- Features
- Text
- Graphics
Are owned by Student Suite (Owner-operated) or its future legal entity.
You may not copy, distribute, sell, or modify any part without written permission.

13. Service Availability
We do not guarantee:
- 24/7 uptime
- Error-free operation
- Bug-free experience
The Service may be modified, paused, or discontinued at any time.

14. Beta & Experimental Features
Some features may be in beta or experimental form.
These features may:
- Contain bugs
- Be unstable
- Change frequently
- Be removed at any time
You use such features at your own risk.

15. Data Loss Disclaimer
We are not responsible for:
- Loss of uploaded content
- Accidental deletion
- Sync failures
- Device issues
- Server issues

16. Backup Responsibility
You are responsible for maintaining your own backups of important data.

17. No Warranty
The Service is provided "as is" and "as available."
We make no warranties of any kind, including:
- Accuracy
- Reliability
- Fitness for a particular purpose
- Availability

18. Limitation of Liability
To the maximum extent permitted by law, Student Suite shall not be liable for:
- Indirect damages
- Data loss
- Academic loss
- Financial loss
- Emotional distress
- Service interruptions
Use of the Service is at your own risk.

19. Indemnification
You agree to defend and indemnify Student Suite from any claims, damages, or losses arising from:
- Your misuse
- Your content
- Your violation of these Terms

20. Force Majeure
We shall not be liable for failure to perform due to:
- Natural disasters
- Internet failures
- Power outages
- Government actions
- War
- Pandemics
- Server outages

21. Termination
We reserve the right to suspend or terminate your access at any time for violations of these Terms.
You may stop using the Service anytime.

22. Assignment
We may transfer or assign our rights and obligations to another entity in the future without restriction.

23. Severability
If any part of these Terms is found invalid, the remaining parts will continue to be valid.

24. Changes to These Terms
We may update these Terms at any time.
Continued use means acceptance of the updated Terms.

25. Governing Law
These Terms are governed by the laws of India.

26. Contact & Legal Notices
Legal notices may be sent via:
- Email
- In-app notification
- Website notice`;

export default function TermsPage() {
  return (
    <PolicyPageLayout title="Terms & Conditions">
      {CONTENT}
    </PolicyPageLayout>
  );
}
