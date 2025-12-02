import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Help = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: t("help.q1"),
      answer: t("help.a1"),
    },
    {
      question: t("help.q2"),
      answer: t("help.a2"),
    },
    {
      question: t("help.q3"),
      answer: t("help.a3"),
    },
  ];

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 10 },
        isRTL && { flexDirection: "row-reverse" },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons
          name={isRTL ? "arrow-forward" : "arrow-back"}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t("help.title")}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderFAQItem = (
    item: { question: string; answer: string },
    index: number
  ) => {
    const isExpanded = expandedIndex === index;
    return (
      <View key={index} style={styles.faqItem}>
        <TouchableOpacity
          style={[styles.faqHeader, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => toggleExpand(index)}
          activeOpacity={0.7}
        >
          <Text style={[styles.questionText, isRTL && { textAlign: "right" }]}>
            {item.question}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#00FFFF"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.faqContent}>
            <Text style={[styles.answerText, isRTL && { textAlign: "right" }]}>
              {item.answer}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isRTL && { textAlign: "right", marginRight: 20 },
            ]}
          >
            {t("help.faq")}
          </Text>
          <View style={styles.faqList}>
            {faqs.map((faq, index) => renderFAQItem(faq, index))}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isRTL && { textAlign: "right", marginRight: 20 },
            ]}
          >
            {t("help.contact")}
          </Text>
          <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
            <LinearGradient
              colors={["rgba(0, 255, 255, 0.1)", "rgba(255, 0, 255, 0.1)"]}
              style={[
                styles.contactGradient,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={24} color="#00FFFF" />
              </View>
              <Text style={styles.contactText}>{t("help.email_support")}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push("/(protected)/(tabs)/profile/support-chat")
            }
          >
            <LinearGradient
              colors={["rgba(0, 255, 255, 0.1)", "rgba(255, 0, 255, 0.1)"]}
              style={[
                styles.contactGradient,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={24}
                  color="#FF00FF"
                />
              </View>
              <Text style={styles.contactText}>{t("help.live_chat")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Help;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15,
    zIndex: 0,
    transform: [{ scale: 1.5 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    marginLeft: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  faqList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  faqItem: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
  },
  questionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    flex: 1,
    marginRight: 10,
  },
  faqContent: {
    padding: 15,
    paddingTop: 0,
  },
  answerText: {
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
  },
  contactButton: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  contactGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginLeft: 15,
  },
  contactText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
