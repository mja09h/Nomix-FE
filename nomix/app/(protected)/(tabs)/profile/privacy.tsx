import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";

const PrivacyPolicy = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Top Header with Back Arrow */}
      <View
        style={[
          styles.screenHeader,
          { paddingTop: insets.top + 10 },
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.screenHeaderTitle}>
          {t("privacy_policy") ?? "Privacy Policy"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={["rgba(0, 255, 255, 0.18)", "rgba(255, 0, 255, 0.18)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#00FFFF"
            />
          </LinearGradient>
          <Text style={styles.title}>
            {t("privacy_policy_title") ?? "Privacy Policy"}
          </Text>
          <Text style={styles.subtitle}>
            {t("privacy_policy_subtitle") ??
              "We care about your data and how it is used in Nomix."}
          </Text>
        </View>

        {/* Card */}
        <LinearGradient
          colors={["rgba(0, 255, 255, 0.05)", "rgba(255, 0, 255, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardOuter}
        >
          <View style={styles.cardInner}>
            <Section
              title={
                t("privacy_section_1_title") ?? "1. Information We Collect"
              }
              body={
                t("privacy_section_1_body") ??
                "We collect the information you provide directly to us, such as your name, email address, and any content you create in Nomix. We may also collect usage data, such as how you interact with recipes and features, to improve the app experience."
              }
            />

            <Section
              title={
                t("privacy_section_2_title") ?? "2. How We Use Your Information"
              }
              body={
                t("privacy_section_2_body") ??
                "We use your information to provide, maintain, and improve Nomix, personalize your experience, communicate with you, and ensure the security of our services."
              }
            />

            <Section
              title={
                t("privacy_section_3_title") ?? "3. Data Storage & Security"
              }
              body={
                t("privacy_section_3_body") ??
                "Your data is stored securely using modern encryption and best practices. While no system is completely secure, we work continuously to protect your information from unauthorized access, use, or disclosure."
              }
            />

            <Section
              title={
                t("privacy_section_4_title") ?? "4. Sharing of Information"
              }
              body={
                t("privacy_section_4_body") ??
                "We do not sell your personal information. We may share data with trusted service providers who help us operate Nomix, always under strict confidentiality obligations and only for the purposes described in this policy."
              }
            />

            <Section
              title={t("privacy_section_5_title") ?? "5. Your Choices & Rights"}
              body={
                t("privacy_section_5_body") ??
                "You can update your account information, request deletion of your data where applicable, and control certain privacy settings from within the app. If you have any questions, you can always contact our support team."
              }
            />

            <Section
              title={
                t("privacy_section_6_title") ?? "6. Changes to This Policy"
              }
              body={
                t("privacy_section_6_body") ??
                "We may update this Privacy Policy from time to time. When we do, we will update the 'last updated' date and, where appropriate, notify you in the app."
              }
            />

            <Text style={styles.lastUpdated}>
              {t("privacy_last_updated") ?? "Last updated: 2025"}
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

type SectionProps = {
  title: string;
  body: string;
};

const Section: React.FC<SectionProps> = ({ title, body }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.1,
    zIndex: 0,
    transform: [{ scale: 1.6 }],
  },
  scrollContent: {
    paddingHorizontal: 20,
    zIndex: 1,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.5)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
  },
  cardOuter: {
    borderRadius: 20,
    padding: 1.5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  cardInner: {
    borderRadius: 18,
    backgroundColor: "rgba(5, 5, 16, 0.96)",
    padding: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#888888",
    marginTop: 8,
    textAlign: "right",
  },
});
