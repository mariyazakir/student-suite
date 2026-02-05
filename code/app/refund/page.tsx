import PolicyPageLayout from '@/components/landing/PolicyPageLayout';

const CONTENT = `REFUND & CANCELLATION POLICY
For Student Suite
Last Updated: 26/01/2026
This Refund & Cancellation Policy explains how refunds, cancellations, and payment-related matters will be handled on Student Suite if and when paid features are introduced.
Currently, Student Suite is free to use and does not charge users. This policy will apply only when paid features or subscriptions are activated.

1. Current Status (No Payments)
At present:
- Student Suite is completely free
- No subscriptions or paid features are active
- No payments are collected
Therefore, no refunds or cancellations are applicable at this time.

2. Future Paid Features
Student Suite may introduce paid features, subscriptions, or premium services in the future.
By purchasing any paid feature, you agree to this Refund & Cancellation Policy.

3. All Sales Are Final (Strict No-Refund Policy)
Once payments are enabled, all purchases made on Student Suite will be considered final.
No refunds will be provided for:
- Change of mind
- Forgetting to cancel
- Partial usage
- Non-usage of features
- Dissatisfaction after purchase
- Misunderstanding of features
- Account suspension due to policy violations

4. Digital Services Disclaimer
All paid services provided by Student Suite are digital in nature and are considered consumed immediately upon activation.
Due to the nature of digital services, refunds are not possible once access is granted.

5. Cancellation of Subscription (If Applicable)
If subscription-based plans are introduced:
- Users may cancel their subscription at any time
- Cancellation will stop future billing
- Access will continue until the end of the current billing period
- No refunds will be issued for unused time

6. Legal & Technical Exceptions
Refunds may be considered only in the following limited cases:
- Duplicate payment due to technical error
- Incorrect charge caused by system failure
- Unauthorized or fraudulent transaction
- Refund required by applicable law
Such cases will be reviewed individually.

7. Abuse & Fraud Prevention
Student Suite reserves the right to deny refunds or disputes if we detect:
- Repeated refund requests
- Abuse of policies
- Fraudulent activity
- Chargeback misuse
Accounts involved in such activities may be suspended or permanently terminated.

8. Payment Gateways
Payments will be processed through third-party gateways such as:
- Razorpay
- UPI providers
- Card networks
Student Suite is not responsible for:
- Bank processing delays
- Gateway downtime
- Provider-side failures

9. Policy Changes
We reserve the right to update or modify this policy at any time.
Continued use of paid features (when available) means acceptance of the updated policy.

10. Governing Law
This Refund & Cancellation Policy is governed by the laws of India.

11. Contact
Student Suite (Owner-operated)
Billing or legal notices may be provided via email, in-app notifications, or website updates.`;

export default function RefundPage() {
  return (
    <PolicyPageLayout title="Refund & Cancellation Policy">
      {CONTENT}
    </PolicyPageLayout>
  );
}
