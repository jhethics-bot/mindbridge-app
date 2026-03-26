/**
 * Terms of Service Screen
 */
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';

export default function TermsScreen() {
  return (
    <MBSafeArea>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <MBHeader title="Terms of Service" subtitle="Last Updated: March 2026" />

        <Text style={st.body}>
          Welcome to NeuBridge. These Terms of Service ("Terms") govern your use of the NeuBridge mobile application ("App") provided by Hawkins Empire Ventures, LLC ("Company," "we," "us"). By using NeuBridge, you agree to these Terms. If you do not agree, please do not use the App.
        </Text>

        <Text style={st.heading}>1. Beta Program</Text>
        <Text style={st.body}>
          NeuBridge is currently in beta. This means the App is provided on an "as-is" basis and may contain bugs, incomplete features, or performance issues. By participating in the beta program, you acknowledge that the App may not function as intended at all times, features may be added, removed, or modified without notice, data collected during the beta may be reset or migrated, and your feedback helps us improve the App for all users. We appreciate your patience and participation in making NeuBridge better.
        </Text>

        <Text style={st.heading}>2. Not Medical Advice</Text>
        <Text style={st.body}>
          NeuBridge is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease. The cognitive games, driving safety assessment, MIND diet scoring, and all other features are designed for informational and engagement purposes only. Always consult your healthcare provider for medical advice, diagnosis, or treatment decisions. The driving safety assessment is not a substitute for a professional driving evaluation and should not be used to determine driving fitness.
        </Text>

        <Text style={st.heading}>3. Account Responsibilities</Text>
        <Text style={st.body}>
          You are responsible for maintaining the security of your account credentials. Caregiver accounts have access to sensitive patient data and should be protected with a strong password and optional PIN lock. You agree not to share your login credentials with unauthorized persons and to notify us immediately if you suspect unauthorized access to your account.
        </Text>

        <Text style={st.heading}>4. Acceptable Use</Text>
        <Text style={st.body}>
          You agree to use NeuBridge only for its intended purpose of cognitive care support. You may not use the App to collect, store, or share data about individuals without their consent or the consent of their legal guardian, attempt to access data belonging to other users, reverse-engineer, decompile, or disassemble any part of the App, or use the App for any unlawful purpose.
        </Text>

        <Text style={st.heading}>5. Limitation of Liability</Text>
        <Text style={st.body}>
          To the maximum extent permitted by law, Hawkins Empire Ventures, LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App. This includes but is not limited to damages for loss of data, personal injury, or emotional distress. Our total liability for any claim arising from the App shall not exceed the amount you paid for the App (if any).
        </Text>

        <Text style={st.heading}>6. Intellectual Property</Text>
        <Text style={st.body}>
          All content, design, code, and intellectual property within NeuBridge is owned by Hawkins Empire Ventures, LLC. The NeuBridge name, logo, and companion pet designs are trademarks of the Company. You may not reproduce, distribute, or create derivative works based on the App without our written permission. User-generated content (photos, voice messages, journal entries) remains the property of the user.
        </Text>

        <Text style={st.heading}>7. Account Termination</Text>
        <Text style={st.body}>
          You may delete your account at any time by contacting beta@neubridge.app. We reserve the right to suspend or terminate accounts that violate these Terms. Upon termination, your data will be retained for 30 days to allow for recovery, after which it will be permanently deleted unless required by law.
        </Text>

        <Text style={st.heading}>8. Changes to Terms</Text>
        <Text style={st.body}>
          We may update these Terms from time to time. We will notify you of material changes through the App or via email. Your continued use of NeuBridge after changes constitutes acceptance of the updated Terms. If you disagree with any changes, you should stop using the App and contact us to delete your account.
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
