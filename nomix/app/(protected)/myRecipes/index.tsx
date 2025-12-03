import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../../../components/Logo";
import { useLanguage } from "../../../context/LanguageContext";
import { getAllRecipes } from "../../../api/recipes";
import { getImageUrl } from "../../../api/index";
import { Recipe } from "../../../types/Recipe";

import { useRouter, useFocusEffect } from "expo-router";

const Recipes = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecipes = async () => {
    try {
      const data = await getAllRecipes();
      setRecipes(data);
    } catch (error) {
      console.error("Failed to load recipes", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetch recipes when screen comes into focus (updates view counts, etc.)
  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    // Handle instructions as array or string for description
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
          colors={["#00FFFF", "#FF00FF"]}
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
              {item.calories && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="flame" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.calories}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <View style={isRTL && { alignItems: "flex-end" }}>
                <Text style={styles.recipeName}>{item.name}</Text>
                <Text
                  style={[styles.recipeDesc, isRTL && { textAlign: "right" }]}
                  numberOfLines={2}
                >
                  {description || t("recipes.no_description")}
                </Text>
              </View>

              {/* Social Stats Row */}
              <View
                style={[
                  styles.socialRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={styles.socialItem}>
                  <Ionicons
                    name={
                      (item.likes?.length ?? 0) > 0 ? "heart" : "heart-outline"
                    }
                    size={14}
                    color={(item.likes?.length ?? 0) > 0 ? "#FF0055" : "#888"}
                  />
                  <Text
                    style={[
                      styles.socialText,
                      (item.likes?.length ?? 0) > 0 && styles.socialTextLiked,
                    ]}
                  >
                    {item.likes?.length || 0}
                  </Text>
                </View>
                <View style={styles.socialItem}>
                  <Ionicons name="chatbubble-outline" size={14} color="#888" />
                  <Text style={styles.socialText}>
                    {item.comments?.length || 0}
                  </Text>
                </View>
                <View style={styles.socialItem}>
                  <Ionicons name="eye-outline" size={14} color="#888" />
                  <Text style={styles.socialText}>{item.views || 0}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View
        style={[styles.headerTop, isRTL && { flexDirection: "row-reverse" }]}
      >
        <Text style={styles.headerTitle}>{t("recipes.title")}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/recipes/add")}
        >
          <LinearGradient
            colors={["#00FFFF", "#FF00FF"]}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color="#888"
          style={[
            styles.searchIcon,
            isRTL ? { marginLeft: 10 } : { marginRight: 10 },
          ]}
        />
        <TextInput
          style={[styles.searchInput, isRTL && { textAlign: "right" }]}
          placeholder={t("recipes.search_placeholder")}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <View style={{ height: insets.top + 20 }} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00FFFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="beaker-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>{t("recipes.no_recipes")}</Text>
              <Text style={styles.emptySubText}>
                {t("recipes.start_creating")}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Recipes;

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchIcon: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  cardWrapper: {
    marginBottom: 20,
    shadowColor: "#00FFFF",
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
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 12,
    color: "#AAAAAA",
    lineHeight: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  tagText: {
    color: "#00FFFF",
    fontSize: 10,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubText: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 8,
  },
  socialRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 8,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  socialText: {
    color: "#888",
    fontSize: 12,
  },
  socialTextLiked: {
    color: "#FF0055",
  },
});
