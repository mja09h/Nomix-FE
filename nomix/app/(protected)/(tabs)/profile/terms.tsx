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

const TermsOfService = () => {
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
          {t("terms_of_service") ?? "Terms of Service"}
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
              color="#FF00FF"
            />
          </LinearGradient>
          <Text style={styles.title}>
            {t("terms_title") ?? "Terms of Service"}
          </Text>
          <Text style={styles.subtitle}>
            {t("terms_subtitle") ??
              "Lawyers would write 20 pages. We’ll keep it to the important bits."}
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
              title={t("terms_section_1_title")}
              body={t("terms_section_1_body")}
            />

            <Section
              title={t("terms_section_2_title")}
              body={t("terms_section_2_body")}
            />

            <Section
              title={t("terms_section_3_title")}
              body={t("terms_section_3_body")}
            />

            <Section
              title={t("terms_section_4_title")}
              body={t("terms_section_4_body")}
            />

            <Section
              title={t("terms_section_5_title")}
              body={t("terms_section_5_body")}
            />

            <Section
              title={t("terms_section_6_title")}
              body={t("terms_section_6_body")}
            />

            <Text style={styles.lastUpdated}>
              {t("terms_last_updated") ?? "Last updated: 2025"}
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

export default TermsOfService;

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
    borderColor: "rgba(255, 0, 255, 0.5)",
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
