import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `ADS & THIRD-PARTY DISCLAIMER
For Student Suite
Last Updated: 26/01/2026
This Ads & Third-Party Disclaimer explains how advertisements and third-party services are displayed and used on Student Suite.
By using Student Suite, you acknowledge and agree to this disclaimer.

1. Advertisements
Student Suite is a free platform supported by advertisements.
Advertisements displayed on Student Suite are provided by third-party ad networks (such as Google AdSense).
We do not control, endorse, or guarantee:
- The accuracy of advertisements
- The quality of advertised products or services
- The reliability or legality of third-party offers
Any interaction with advertisements is at your own risk.

2. Third-Party Links
Student Suite may contain links to third-party websites, services, or resources.
We are not responsible for:
- Content on third-party websites
- Privacy practices of third-party services
- Products or services offered by third parties
Accessing third-party links is done at your own discretion and risk.

3. No Endorsement
The presence of advertisements or third-party links on Student Suite does not imply endorsement, sponsorship, or recommendation by Student Suite.

4. Third-Party Services
Student Suite may use third-party tools and services, including but not limited to:
- Advertising networks
- Analytics providers
- Cloud or infrastructure services
These third-party services operate under their own terms and privacy policies.
Student Suite is not responsible for the actions or policies of third-party service providers.

5. Limitation of Liability
To the maximum extent permitted by law, Student Suite shall not be liable for:
- Any loss or damage arising from third-party advertisements
- Any loss or damage caused by third-party services
- Issues resulting from reliance on third-party content

6. Changes to This Disclaimer
We may update this Ads & Third-Party Disclaimer at any time.
Continued use of Student Suite means acceptance of the updated version.

7. Governing Law
This Disclaimer is governed by the laws of India.

8. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`;

export default function AdsPage() {
  return (
    <PolicyPageLayout title="Ads & Third-Party Disclaimer">
      {CONTENT}
    </PolicyPageLayout>
  );
}
