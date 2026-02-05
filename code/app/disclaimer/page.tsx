import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `GENERAL DISCLAIMER
For Student Suite
Last Updated: 26/01/2026
Student Suite is an educational and productivity platform created to assist students with tools, features, and informational resources.
All content, tools, AI-generated outputs, suggestions, and features provided through Student Suite are offered strictly for general informational and educational purposes only.

1. No Professional Advice
Student Suite does NOT provide professional advice of any kind, including but not limited to:
- Legal advice
- Medical advice
- Financial advice
- Career or academic advice
Any information or suggestions provided should not be considered a substitute for professional consultation.

2. AI-Generated Content Disclaimer
Some features of Student Suite may use artificial intelligence or automated systems.
Important:
- AI-generated outputs are suggestions only
- They may be inaccurate, incomplete, or outdated
- They should not be relied upon as factual or authoritative information
Users are solely responsible for how they interpret and use AI-generated content.

3. Educational Use Only
Student Suite is intended for educational and productivity support purposes only.
We do not guarantee:
- Academic performance
- Exam results
- Improved grades
- Career outcomes
- Job placement
Results depend on individual effort, learning habits, and external factors.

4. Use at Your Own Risk
Your use of Student Suite and its content is entirely at your own risk.
Student Suite shall not be held liable for:
- Any loss or damage resulting from reliance on information
- Decisions made based on platform content
- Academic, financial, or personal outcomes

5. External Content & Third-Party Services
Student Suite may display advertisements or include links to third-party websites or services.
We do not control, endorse, or guarantee the accuracy or reliability of third-party content.
Interactions with third-party services are at your own discretion and risk.

6. Limitation of Responsibility
To the maximum extent permitted by law, Student Suite disclaims all responsibility and liability for any direct or indirect damages arising from:
- Use of the platform
- Inability to access the platform
- Errors or omissions in content
- Technical issues or service interruptions

7. Changes to This Disclaimer
We may update this Disclaimer at any time.
Continued use of Student Suite after changes means acceptance of the updated version.

8. Governing Law
This Disclaimer is governed by the laws of India.

9. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`;

export default function DisclaimerPage() {
  return (
    <PolicyPageLayout title="General Disclaimer">
      {CONTENT}
    </PolicyPageLayout>
  );
}
