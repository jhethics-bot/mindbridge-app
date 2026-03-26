/**
 * Privacy Policy Screen
 */
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <MBSafeArea>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <MBHeader title="Privacy Policy" subtitle="Last Updated: March 2026" />

        <Text style={st.body}>
          NeuBridge ("we," "us," or "our") is committed to protecting the privacy and security of the personal information entrusted to us by users of the NeuBridge application. This Privacy Policy describes what information we collect, how we use it, and the choices available to you regarding your data.
        </Text>

        <Text style={st.heading}>1. Information We Collect</Text>
        <Text style={st.body}>
          We collect information that you provide directly when creating an account, including your name, email address, and role (patient or caregiver). For patient accounts, caregivers may provide additional information such as disease stage, preferred activities, dietary preferences, and emergency contact details. We also collect data generated through your use of the app, including mood check-in responses, cognitive game scores and performance metrics, hydration and nutrition logs, companion pet interaction data, and activity completion records.
        </Text>

        <Text style={st.heading}>2. How We Use Your Information</Text>
        <Text style={st.body}>
          We use collected information to provide and personalize the NeuBridge experience, including adapting cognitive game difficulty to the patient's current ability level, generating AI-powered daily activity queues and weekly reports, tracking nutrition and hydration for caregiver review, and providing emergency SOS functionality with location sharing. We do not use your health data for advertising, marketing to third parties, or any purpose unrelated to your care.
        </Text>

        <Text style={st.heading}>3. Data Storage and Security</Text>
        <Text style={st.body}>
          All data is stored securely using Supabase, a trusted cloud database provider with SOC 2 Type II compliance. Data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Row Level Security (RLS) policies ensure that patients can only access their own data, and caregivers can only access data for patients they are linked to through verified care relationships. We implement regular security audits and penetration testing to maintain the highest security standards.
        </Text>

        <Text style={st.heading}>4. HIPAA Awareness</Text>
        <Text style={st.body}>
          While NeuBridge is not currently a HIPAA-covered entity, we design our systems with HIPAA-level security principles in mind. We follow the minimum necessary standard for data access, maintain audit logs of all data access events, and implement role-based access controls. As we pursue formal HIPAA compliance, we will update this policy accordingly.
        </Text>

        <Text style={st.heading}>5. Caregiver Access</Text>
        <Text style={st.body}>
          Caregivers who are linked to a patient through a verified care relationship can view the patient's activity data, mood history, nutrition logs, cognitive performance trends, and weekly reports. Caregivers can also configure settings, manage the companion pet, and set up meal plans and hydration reminders. Caregivers cannot access data for patients they are not linked to.
        </Text>

        <Text style={st.heading}>6. Third-Party Services</Text>
        <Text style={st.body}>
          We use the following third-party services: Supabase for database and authentication, Expo for app distribution, and Claude AI (Anthropic) for content generation and adaptive difficulty. We do not sell, rent, or share your personal information with advertisers or data brokers. Third-party service providers are contractually obligated to protect your data.
        </Text>

        <Text style={st.heading}>7. Data Retention</Text>
        <Text style={st.body}>
          We retain your data for as long as your account is active or as needed to provide services. Activity and health data is retained to support longitudinal cognitive tracking and weekly report generation. You may request deletion of your account and associated data at any time by contacting us at beta@neubridge.app.
        </Text>

        <Text style={st.heading}>8. Your Rights</Text>
        <Text style={st.body}>
          You have the right to access your personal data, request correction of inaccurate data, request deletion of your data, export your data in a portable format, and opt out of optional data collection. To exercise any of these rights, please contact us at beta@neubridge.app.
        </Text>

        <Text style={st.heading}>9. Children's Privacy</Text>
        <Text style={st.body}>
          NeuBridge is designed for adults and their caregivers. We do not knowingly collect personal information from children under the age of 13. If we discover that we have collected information from a child, we will promptly delete it.
        </Text>

        <Text style={st.heading}>10. Changes to This Policy</Text>
        <Text style={st.body}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email. Continued use of NeuBridge after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={st.contact}>
          Questions? Contact us at beta@neubridge.app{'\n'}
          Hawkins Empire Ventures, LLC{'\n'}
          7900 Sudley Road Suite 600, Manassas, VA 20109
        </Text>
      </ScrollView>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginTop: 20, marginBottom: 8 },
  body: { fontSize: 16, color: COLORS.navy, lineHeight: 26, marginBottom: 12 },
  contact: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 24, lineHeight: 22 },
});
