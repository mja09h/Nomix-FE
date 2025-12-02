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

const Favorites = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  // Mock Favorites Data
  const favoriteRecipes = [
    {
      id: 1,
      name: "Neon Blue Lagoon",
      description: "A vibrant mix of vodka, blue curacao, and lemonade.",
      image:
        "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=600&q=80",
      rating: 4.8,
    },
    {
      id: 2,
      name: "Cyberpunk City",
      description: "Gin, tonic, and a splash of futuristic lime.",
      image:
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
      rating: 4.5,
    },
    {
      id: 3,
      name: "Cosmic Cosmo",
      description:
        "Vodka, triple sec, cranberry juice, and freshly squeezed lime juice.",
      image:
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80", // Placeholder
      rating: 4.9,
    },
    {
      id: 4,
      name: "Sunset Blvd",
      description: "Tequila, orange juice, and grenadine syrup.",
      image:
        "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=600&q=80", // Placeholder
      rating: 4.7,
    },
  ];

  return (
    <View style={styles.root}>
      {/* Background Logo Animation */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <View
        style={[
          styles.header,
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
        <Text style={styles.headerTitle}>{t("favorites")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.favoritesList}>
          {favoriteRecipes.map((recipe) => (
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
                    <View style={styles.recipeInfo}>
                      <View
                        style={isRTL && { alignItems: "flex-end", flex: 1 }}
                      >
                        <Text style={styles.recipeName}>{recipe.name}</Text>
                        <Text
                          style={[
                            styles.recipeDesc,
                            isRTL && { textAlign: "right" },
                          ]}
                          numberOfLines={1}
                        >
                          {recipe.description}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.ratingContainer,
                          isRTL && { flexDirection: "row-reverse" },
                        ]}
                      >
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>{recipe.rating}</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  <TouchableOpacity
                    style={[
                      styles.favoriteButton,
                      isRTL ? { left: 10, right: undefined } : { right: 10 },
                    ]}
                  >
                    <LinearGradient
                      colors={["#FF0055", "#FF00AA"]}
                      style={styles.favoriteButtonGradient}
                    >
                      <Ionicons name="heart" size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Favorites;

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
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  favoritesList: {
    gap: 20,
  },
  cardWrapper: {
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cardBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  innerCard: {
    height: 180,
    borderRadius: 18.5,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
    position: "relative",
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
    height: "70%",
    justifyContent: "flex-end",
    padding: 15,
  },
  recipeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  recipeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  recipeDesc: {
    fontSize: 12,
    color: "#EEEEEE",
    opacity: 0.8,
    maxWidth: "85%",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
  },
  favoriteButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF0055",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
