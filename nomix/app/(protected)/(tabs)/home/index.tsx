import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
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

const Home = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  // Mock Data
  const categories = [
    { id: 1, name: t("cat_popular"), icon: "star" },
    { id: 2, name: t("cat_new"), icon: "time" },
    { id: 3, name: t("cat_classic"), icon: "wine" },
    { id: 4, name: t("cat_tropical"), icon: "sunny" },
  ];

  const featuredRecipes = [
    {
      id: 1,
      name: "Neon Blue Lagoon",
      description: "A vibrant mix of vodka, blue curacao, and lemonade.",
      image:
        "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 2,
      name: "Cyberpunk City",
      description: "Gin, tonic, and a splash of futuristic lime.",
      image:
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <View style={styles.root}>
      {/* Background Logo Animation */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
      >
        {/* Header */}
        <View
          style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}
        >
          <View style={isRTL && { alignItems: "flex-end" }}>
            <Text style={styles.greeting}>{t("greeting")}</Text>
            <Text style={styles.subtitle}>{t("subtitle")}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <Ionicons name="person" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isRTL && { textAlign: "right", marginRight: 20 },
            ]}
          >
            {t("categories")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoriesList,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {categories.map((category, index) => (
              <TouchableOpacity key={category.id} activeOpacity={0.7}>
                <LinearGradient
                  colors={
                    index === 0
                      ? ["#00FFFF", "#FF00FF"] // Highlight the first one as active/popular
                      : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.categoryCard,
                    index === 0 && styles.activeCategoryCard,
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={index === 0 ? "#FFFFFF" : "#00FFFF"}
                  />
                  <Text
                    style={[
                      styles.categoryName,
                      index === 0 && styles.activeCategoryName,
                    ]}
                  >
                    {category.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI Generator Button */}
        <TouchableOpacity
          style={styles.aiButtonContainer}
          activeOpacity={0.8}
          onPress={() => router.push("/(protected)/ai-generator")}
        >
          <LinearGradient
            colors={["#FF0055", "#FF00AA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiButtonGradient}
          >
            <View
              style={[
                styles.aiButtonContent,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.aiIconWrapper,
                  isRTL ? { marginLeft: 15 } : { marginRight: 15 },
                ]}
              >
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.aiTextContainer,
                  isRTL && { alignItems: "flex-end" },
                ]}
              >
                <Text style={styles.aiButtonTitle}>
                  {t("ai_generator.title")}
                </Text>
                <Text style={styles.aiButtonSubtitle}>
                  {t("ai_generator.generate_button")}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={24}
                color="#FFFFFF"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Featured Recipes */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isRTL && { textAlign: "right", marginRight: 20 },
            ]}
          >
            {t("featured_mixes")}
          </Text>
          <View style={styles.featuredList}>
            {featuredRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                activeOpacity={0.9}
                style={styles.cardWrapper}
              >
                {/* Gradient Border */}
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardBorder}
                >
                  <View style={styles.innerCard}>
                    <Image
                      source={{ uri: recipe.image }}
                      style={styles.recipeImage}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(5, 5, 16, 0.95)"]}
                      style={styles.recipeOverlay}
                    >
                      <View style={isRTL && { alignItems: "flex-end" }}>
                        <Text style={styles.recipeName}>{recipe.name}</Text>
                        <Text
                          style={[
                            styles.recipeDesc,
                            isRTL && { textAlign: "right" },
                          ]}
                        >
                          {recipe.description}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.2, // Subtle background
    zIndex: 0,
    transform: [{ scale: 1.5 }], // Larger to cover more area
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for tab bar
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginTop: 5,
  },
  profileButton: {
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  profileGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 20,
    marginBottom: 15,
    letterSpacing: 1,
    textShadowColor: "rgba(255, 0, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  activeCategoryCard: {
    borderWidth: 0, // Gradient background serves as border/fill
  },
  categoryName: {
    color: "#CCCCCC",
    fontSize: 14,
    fontWeight: "600",
  },
  activeCategoryName: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  aiButtonContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    shadowColor: "#FF0055",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGradient: {
    borderRadius: 20,
    padding: 2,
  },
  aiButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E", // Keep it dark inside or use gradient fully
    borderRadius: 18,
    padding: 15,
    // If you want full gradient background, remove backgroundColor here and adjust borderRadius
  },
  aiIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiTextContainer: {
    justifyContent: "center",
  },
  aiButtonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  aiButtonSubtitle: {
    fontSize: 12,
    color: "#FF00AA",
    fontWeight: "600",
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 25,
  },
  cardWrapper: {
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardBorder: {
    borderRadius: 25,
    padding: 2, // Creates the gradient border width
  },
  innerCard: {
    height: 220,
    borderRadius: 23, // Slightly less than cardBorder
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: 20,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
    textShadowColor: "rgba(0, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  recipeDesc: {
    fontSize: 14,
    color: "#EEEEEE",
    opacity: 0.9,
  },
});
