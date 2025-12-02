import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 15;
const ITEM_WIDTH = (width - 40 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const Categories = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const categories = [
    { id: 1, name: t("cat_classic_cocktails"), icon: "wine", count: 124 },
    { id: 2, name: t("cat_tropical_tiki"), icon: "sunny", count: 85 },
    { id: 3, name: t("cat_mocktails"), icon: "water", count: 42 },
    { id: 4, name: t("cat_shots"), icon: "flash", count: 63 },
    { id: 5, name: t("cat_party_punches"), icon: "color-wand", count: 28 },
    { id: 6, name: t("cat_healthy_mixes"), icon: "leaf", count: 35 },
    { id: 7, name: t("cat_coffee_tea"), icon: "cafe", count: 19 },
    { id: 8, name: t("cat_seasonal"), icon: "snow", count: 12 },
  ];

  return (
    <View style={styles.root}>
      {/* Background Logo Animation */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 20 },
          isRTL && { alignItems: "flex-end" },
        ]}
      >
        <Text style={styles.headerTitle}>{t("categories")}</Text>
        <Text style={styles.headerSubtitle}>{t("explore_by_type")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.grid, isRTL && { flexDirection: "row-reverse" }]}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.8}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorder}
              >
                <View style={styles.innerCard}>
                  <View
                    style={[
                      styles.iconContainer,
                      isRTL && { alignItems: "flex-end" },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(0, 255, 255, 0.2)",
                        "rgba(255, 0, 255, 0.2)",
                      ]}
                      style={styles.iconBackground}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={32}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </View>

                  <View
                    style={[
                      styles.textContainer,
                      isRTL && { alignItems: "flex-end" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryName,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {category.name}
                    </Text>
                    <Text style={styles.itemCount}>
                      {category.count} {t("recipes")}
                    </Text>
                  </View>

                  {/* Arrow Icon */}
                  <View
                    style={[
                      styles.arrowContainer,
                      isRTL ? { left: 15, right: undefined } : { right: 15 },
                    ]}
                  >
                    <Ionicons
                      name={isRTL ? "arrow-back" : "arrow-forward"}
                      size={20}
                      color="#666"
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Categories;

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
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginTop: 5,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  cardWrapper: {
    width: ITEM_WIDTH,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBorder: {
    borderRadius: 25,
    padding: 1.5,
  },
  innerCard: {
    height: 160,
    borderRadius: 23.5,
    backgroundColor: "#1A1A2E",
    padding: 15,
    justifyContent: "space-between",
  },
  iconContainer: {
    alignItems: "flex-start",
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textContainer: {
    gap: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  itemCount: {
    fontSize: 12,
    color: "#888888",
  },
  arrowContainer: {
    position: "absolute",
    top: 15,
    right: 15,
  },
});
