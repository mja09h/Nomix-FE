import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import { getAllRecipes } from "../../../../api/recipes";
import { getImageUrl } from "../../../../api/index";
import { Recipe } from "../../../../types/Recipe";

const LikedRecipes = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLikedRecipes = async () => {
    try {
      const allRecipes = await getAllRecipes();
      // Filter recipes that the current user has liked
      const liked = allRecipes.filter(
        (recipe) => recipe.likes && recipe.likes.includes(user?._id || "")
      );
      setRecipes(liked);
    } catch (error) {
      console.error("Failed to load liked recipes", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLikedRecipes();
    }, [user?._id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLikedRecipes();
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    let description = "";
    if (Array.isArray(item.instructions) && item.instructions.length > 0) {
      description = item.instructions[0];
    } else if (typeof item.instructions === "string") {
      description = item.instructions;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardWrapper}
        onPress={() => router.push(`/recipes/${item._id}`)}
      >
        <LinearGradient
          colors={["#FF0055", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.innerCard}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    getImageUrl(item.image) ||
                    "https://via.placeholder.com/150",
                }}
                style={styles.recipeImage}
              />
              <View style={styles.likedBadge}>
                <Ionicons name="heart" size={14} color="#FF0055" />
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={isRTL && { alignItems: "flex-end" }}>
                <Text style={styles.recipeName}>{item.name}</Text>
                <Text
                  style={[styles.recipeDesc, isRTL && { textAlign: "right" }]}
                  numberOfLines={2}
                >
                  {description || "No description"}
                </Text>
              </View>

              <View
                style={[
                  styles.statsRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={14} color="#FF0055" />
                  <Text style={styles.statText}>{item.likes?.length || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={14} color="#888" />
                  <Text style={styles.statText}>
                    {item.comments?.length || 0}
                  </Text>
                </View>
                {item.calories && (
                  <View style={styles.statItem}>
                    <Ionicons name="flame" size={14} color="#FFD700" />
                    <Text style={styles.statText}>{item.calories}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="heart" size={24} color="#FF0055" />
          <Text style={styles.headerTitle}>Liked Recipes</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0055" />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF0055"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={80} color="#333" />
              </View>
              <Text style={styles.emptyText}>No liked recipes yet</Text>
              <Text style={styles.emptySubText}>
                Start exploring and like recipes you love!
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push("/recipes")}
              >
                <LinearGradient
                  colors={["#FF0055", "#FF00FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.exploreGradient}
                >
                  <Ionicons name="compass-outline" size={20} color="#FFF" />
                  <Text style={styles.exploreText}>Explore Recipes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

export default LikedRecipes;

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
    transform: [{ scale: 1.5 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
    shadowColor: "#FF0055",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  innerCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18.5,
    overflow: "hidden",
    flexDirection: "row",
    height: 120,
  },
  imageContainer: {
    width: 120,
    height: "100%",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  likedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 12,
    color: "#AAAAAA",
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#888",
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 0, 85, 0.2)",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptySubText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  exploreButton: {
    marginTop: 30,
  },
  exploreGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  exploreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
