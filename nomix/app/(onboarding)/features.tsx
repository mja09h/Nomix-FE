import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../../components/Logo";
import { useLanguage } from "../../context/LanguageContext";

const { height } = Dimensions.get("window");

const Features = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const featuresList = [
    {
      id: 1,
      title: t("features.discover"),
      description: t("features.discover_desc"),
      icon: "search",
      color: "#00FFFF",
    },
    {
      id: 2,
      title: t("features.create"),
      description: t("features.create_desc"),
      icon: "beaker",
      color: "#FF00FF",
    },
    {
      id: 3,
      title: t("features.share"),
      description: t("features.share_desc"),
      icon: "share-social",
      color: "#00FF00", // Greenish neon
    },
  ];

  return (
    <View style={styles.root}>
      {/* Background Logo Animation (Static for now like get-started) */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t("features.title")}</Text>
          <Text style={styles.subtitle}>{t("features.subtitle")}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {featuresList.map((feature, index) => (
            <View
              key={feature.id}
              style={[
                styles.featureItem,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <LinearGradient
                colors={[`${feature.color}20`, `${feature.color}10`]}
                style={[
                  styles.iconContainer,
                  isRTL ? { marginLeft: 20 } : { marginRight: 20 },
                  { borderColor: feature.color },
                ]}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={28}
                  color={feature.color}
                />
              </LinearGradient>
              <View
                style={[
                  styles.textContainer,
                  isRTL && { alignItems: "flex-end" },
                ]}
              >
                <Text
                  style={[styles.featureTitle, isRTL && { textAlign: "right" }]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[styles.featureDesc, isRTL && { textAlign: "right" }]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/get-started")}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {t("features.continue")}
              </Text>
              <Ionicons
                name={isRTL ? "arrow-back" : "arrow-forward"}
                size={20}
                color="#FFFFFF"
                style={isRTL ? { marginRight: 10 } : { marginLeft: 10 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Features;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.1, // Very subtle
    zIndex: 0,
    transform: [{ scale: 1.2 }],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    opacity: 0.8,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 30,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
    textShadowColor: "rgba(255, 255, 255, 0.1)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  featureDesc: {
    fontSize: 14,
    color: "#AAAAAA",
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 20,
  },
  buttonWrapper: {
    width: "100%",
    shadowColor: "#FF00FF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
