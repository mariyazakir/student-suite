import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `COPYRIGHT & OWNERSHIP POLICY
For Student Suite
Last Updated: 26/01/2026
This Copyright & Ownership Policy explains the ownership rights related to the content, design, features, and intellectual property of Student Suite.

1. Ownership of Platform Content
All content and materials available on Student Suite, including but not limited to:
- Website and mobile application design
- User interface (UI) and user experience (UX)
- Logos, branding, and trademarks
- Source code and software
- Features, tools, and functionality
- Text, graphics, layouts, and icons
are the exclusive property of Student Suite (Owner-operated) or its future legal entity, unless otherwise stated.

2. Copyright Protection
All platform content is protected by applicable copyright, trademark, and intellectual property laws.
Unauthorized use, reproduction, modification, distribution, or exploitation of any part of Student Suite is strictly prohibited.

3. Limited Permission to Use
Student Suite grants users a limited, non-exclusive, non-transferable, and revocable license to access and use the Service for personal, educational, and non-commercial purposes only.
This permission does not transfer ownership of any intellectual property.

4. Prohibited Uses
You may NOT:
- Copy or reproduce platform content
- Modify or create derivative works
- Sell, license, or distribute content
- Reverse engineer or attempt to extract source code
- Use branding or logos without permission
- Use any part of the Service for commercial purposes without prior written consent from Student Suite.

5. User Content Exception
This policy does not apply to user-generated content.
Users retain ownership of content they upload, as outlined in the User Content Policy.

6. Intellectual Property Violations
If you believe that any content on Student Suite infringes your intellectual property rights, you may submit a complaint through our support system.
We reserve the right to remove infringing content where appropriate.

7. Reservation of Rights
All rights not expressly granted in this policy are reserved by Student Suite.

8. Changes to This Policy
We may update this Copyright & Ownership Policy at any time.
Continued use of the Service means acceptance of the updated policy.

9. Governing Law
This policy is governed by the laws of India.

10. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`;

export default function CopyrightPage() {
  return (
    <PolicyPageLayout title="Copyright & Ownership Policy">
      {CONTENT}
    </PolicyPageLayout>
  );
}
