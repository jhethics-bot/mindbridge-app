# NeuBridge Privacy Policy

**Effective Date:** April 1, 2026
**Last Updated:** March 21, 2026

Hawkins Empire Ventures, LLC ("we," "us," "our") operates the NeuBridge mobile application ("App"). This Privacy Policy describes how we collect, use, disclose, and protect your personal information when you use NeuBridge.

## 1. Information We Collect

### 1.1 Account Information
- Name, email address, and password (encrypted)
- Role designation (patient, caregiver, or clinician)
- Caregiver relationship details

### 1.2 Health-Related Information
- Disease stage classification (early, middle, late)
- Mood check-in data (mood type, frequency, timestamps)
- Cognitive activity session data (game scores, completion rates, duration)
- Medication names, schedules, and adherence logs
- Appointment dates and provider names
- Caregiver observations and notes
- Zarit Burden Interview responses
- SOS event records including approximate location data

### 1.3 Media and Content
- Family photos uploaded for reminiscence therapy
- Voice messages between caregivers and patients
- Music uploads and playlist preferences
- Journal entries and legacy stories

### 1.4 Device and Usage Information
- Device type, operating system, and app version
- Push notification tokens
- Session timestamps and feature usage analytics
- Crash reports and performance data

### 1.5 Information We Do NOT Collect
- Social Security numbers
- Insurance or billing information
- Genetic or genomic data
- Biometric data (fingerprints, facial recognition)

## 2. How We Use Your Information

We use collected information to:
- Provide personalized cognitive activities adapted to disease stage
- Generate AI-powered daily activity queues and recommendations
- Produce weekly caregiver reports and doctor visit summaries
- Deliver mood-matched daily scripture verses (when enabled)
- Send medication reminders and appointment notifications
- Match caregivers with peers in similar situations (opt-in)
- Improve app features through anonymized usage analytics
- Respond to SOS emergency events

## 3. AI Processing

NeuBridge uses Anthropic's Claude AI to:
- Generate personalized daily activity schedules
- Create weekly narrative reports for caregivers
- Remove bias from news articles presented in the app
- Match daily scripture verses to patient mood

AI processing occurs through Anthropic's API. We send only the minimum data necessary (mood scores, activity completion rates, disease stage). No patient names, photos, or identifying information are sent to the AI service.

## 4. Data Storage and Security

### 4.1 Infrastructure
- All data is stored on Supabase (hosted on AWS) in the us-east-1 region
- Data is encrypted at rest (AES-256) and in transit (TLS 1.2+)
- Database access is controlled through Row Level Security policies
- Authentication uses secure JWT tokens with automatic refresh

### 4.2 Access Controls
- Patients can only access their own data
- Caregivers can only access data for patients they are linked to
- Caregiver PIN lock prevents unauthorized access on shared devices
- All data access is logged in an audit trail

### 4.3 Data Retention
- Active account data is retained while the account exists
- Deleted accounts have personal data removed within 30 days
- Anonymized analytics data may be retained for research purposes
- SOS event data is retained for 1 year after the event

## 5. Data Sharing

### 5.1 We Share Data With
- **Supabase Inc.** — database hosting and authentication (BAA in place)
- **Anthropic PBC** — AI processing for activity recommendations (BAA in place)
- **Expo / React Native** — push notification delivery
- **Vercel Inc.** — landing page hosting only (no health data)

### 5.2 We Do NOT Share Data With
- Advertisers or marketing platforms
- Data brokers or resellers
- Social media platforms
- Any third party for purposes unrelated to app functionality

### 5.3 Legal Disclosures
We may disclose information if required by law, court order, or government request, or to protect the safety of a user in an emergency.

## 6. HIPAA Compliance

NeuBridge is designed to be HIPAA-compliant. We maintain:
- Business Associate Agreements (BAAs) with all data processors
- Administrative, physical, and technical safeguards
- Audit logging of all data access
- Incident response procedures for potential breaches
- Regular security assessments

NeuBridge is not a covered entity under HIPAA. However, we voluntarily adopt HIPAA standards to protect the sensitive health information entrusted to us.

## 7. Your Rights

You have the right to:
- **Access** your personal data at any time through the app
- **Export** your data in a machine-readable format
- **Correct** inaccurate information through the settings screen
- **Delete** your account and associated data
- **Opt out** of non-essential data collection
- **Disable** specific features via feature toggles

To exercise these rights, contact us at privacy@neubridge.app.

## 8. Children's Privacy

NeuBridge is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover we have collected data from a child under 18, we will delete it promptly.

## 9. California Residents (CCPA)

California residents have additional rights under the California Consumer Privacy Act, including the right to know what personal information is collected, the right to request deletion, and the right to opt out of data sales. We do not sell personal information.

## 10. Changes to This Policy

We may update this Privacy Policy periodically. We will notify you of material changes through the app or via email. Continued use of NeuBridge after changes constitutes acceptance of the updated policy.

## 11. Contact Us

**Hawkins Empire Ventures, LLC**
Email: privacy@neubridge.app
Address: Northern Virginia, United States

For questions about this Privacy Policy or our data practices, please contact our Privacy Officer at the email above.
