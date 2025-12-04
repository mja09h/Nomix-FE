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
  Dimensions,
  Modal,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { getAllRecipes } from "../../../../api/recipes";
import { getAllCategories, createCategory } from "../../../../api/categories";
import { getAllIngredients } from "../../../../api/ingredients";
import { getImageUrl } from "../../../../api/index";
import { Recipe, Ingredient } from "../../../../types/Recipe";
import { Category } from "../../../../types/Category";
import { useRouter, useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 15;
const ITEM_WIDTH = (width - 40 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

// Icon mapping for categories
const getCategoryIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("breakfast")) return "sunny";
  if (lowerName.includes("lunch")) return "restaurant";
  if (lowerName.includes("dinner")) return "moon";
  if (lowerName.includes("dessert") || lowerName.includes("sweet"))
    return "ice-cream";
  if (lowerName.includes("drink") || lowerName.includes("beverage"))
    return "wine";
  if (lowerName.includes("healthy") || lowerName.includes("salad"))
    return "leaf";
  if (lowerName.includes("fast") || lowerName.includes("quick")) return "flash";
  if (lowerName.includes("soup")) return "beaker";
  if (lowerName.includes("meat") || lowerName.includes("chicken"))
    return "nutrition";
  if (lowerName.includes("fish") || lowerName.includes("seafood"))
    return "fish";
  if (lowerName.includes("vegan") || lowerName.includes("vegetarian"))
    return "flower";
  if (lowerName.includes("pasta") || lowerName.includes("italian"))
    return "pizza";
  if (lowerName.includes("asian") || lowerName.includes("chinese"))
    return "flame";
  if (lowerName.includes("mexican")) return "bonfire";
  if (lowerName.includes("snack")) return "cafe";
  return "grid";
};

// Gradient colors for categories
const categoryGradients: string[][] = [
  ["#FF6B6B", "#FF8E8E"],
  ["#4ECDC4", "#6EE7E0"],
  ["#A78BFA", "#C4B5FD"],
  ["#F59E0B", "#FBBF24"],
  ["#EC4899", "#F472B6"],
  ["#10B981", "#34D399"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
];

interface CategoryWithCount extends Category {
  recipeCount?: number;
}

type ViewMode = "categories" | "recipes";

const Recipes = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [viewMode, setViewMode] = useState<ViewMode>("categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [selectedFilterIngredients, setSelectedFilterIngredients] = useState<
    string[]
  >([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "popular" | "newest" | "mostViewed"
  >("all");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  // Animation refs for modal
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const inputShake = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  // Open modal with animation
  const openModal = () => {
    setModalVisible(true);
    setNewCategoryName("");
    setShowSuccess(false);
    modalScale.setValue(0);
    modalOpacity.setValue(0);
    successScale.setValue(0);

    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start icon rotation animation
    Animated.loop(
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Close modal with animation
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setShowSuccess(false);
      iconRotate.stopAnimation();
    });
  };

  // Shake animation for invalid input
  const shakeInput = () => {
    inputShake.setValue(0);
    Animated.sequence([
      Animated.timing(inputShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Success animation
  const showSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.spring(successScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();

    // Close modal after success
    setTimeout(() => {
      closeModal();
    }, 1500);
  };

  const fetchData = async () => {
    try {
      const [recipesData, categoriesData, ingredientsData] = await Promise.all([
        getAllRecipes(),
        getAllCategories(),
        getAllIngredients(),
      ]);
      setRecipes(recipesData);
      setAvailableIngredients(ingredientsData || []);

      // Count recipes per category
      const categoriesWithCount = categoriesData.map((category) => {
        const recipeCount = recipesData.filter((recipe: Recipe) =>
          recipe.category?.some((cat: any) =>
            typeof cat === "string"
              ? cat === category._id
              : cat._id === category._id
          )
        ).length;
        return { ...category, recipeCount };
      });
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      shakeInput();
      return;
    }
    setCreating(true);
    try {
      await createCategory(newCategoryName.trim());
      fetchData();
      showSuccessAnimation();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create category";
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  // Filter and sort recipes
  const getFilteredAndSortedRecipes = () => {
    let result = recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by selected ingredients
    if (selectedFilterIngredients.length > 0) {
      result = result.filter((recipe) => {
        const recipeIngredientIds =
          recipe.ingredients?.map((ing: any) =>
            typeof ing === "string" ? ing : ing._id
          ) || [];
        return selectedFilterIngredients.every((ingredientId) =>
          recipeIngredientIds.includes(ingredientId)
        );
      });
    }

    // Sort based on active filter
    switch (activeFilter) {
      case "popular":
        result = [...result].sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        break;
      case "newest":
        result = [...result].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      case "mostViewed":
        result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        break;
    }

    return result;
  };

  const filteredRecipes = getFilteredAndSortedRecipes();

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter ingredients for picker
  const filteredIngredients = availableIngredients.filter((ing) =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const toggleFilterIngredient = (id: string) => {
    setSelectedFilterIngredients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedFilterIngredients([]);
    setActiveFilter("all");
  };

  const hasActiveFilters =
    selectedFilterIngredients.length > 0 || activeFilter !== "all";

  // Helper to get ingredient icon
  const getIngredientIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("chicken") || n.includes("poultry")) return "🍗";
    if (n.includes("beef") || n.includes("steak") || n.includes("meat"))
      return "🥩";
    if (n.includes("fish") || n.includes("salmon")) return "🐟";
    if (n.includes("egg")) return "🥚";
    if (n.includes("milk") || n.includes("cream")) return "🥛";
    if (n.includes("cheese")) return "🧀";
    if (n.includes("bread")) return "🍞";
    if (n.includes("rice")) return "🍚";
    if (n.includes("pasta") || n.includes("noodle")) return "🍝";
    if (n.includes("potato")) return "🥔";
    if (n.includes("tomato")) return "🍅";
    if (n.includes("carrot")) return "🥕";
    if (n.includes("onion") || n.includes("garlic")) return "🧄";
    if (n.includes("pepper") || n.includes("chili")) return "🌶️";
    if (n.includes("lemon") || n.includes("lime")) return "🍋";
    if (n.includes("salt")) return "🧂";
    if (n.includes("oil")) return "🍶";
    if (n.includes("herb") || n.includes("basil")) return "🌿";
    if (n.includes("chocolate")) return "🍫";
    return "🥘";
  };

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: CategoryWithCount;
    index: number;
  }) => {
    const gradientColors = categoryGradients[index % categoryGradients.length];

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.categoryCardWrapper}
        onPress={() =>
          router.push(
            `/recipes/category/${item._id}?name=${encodeURIComponent(
              item.name
            )}`
          )
        }
      >
        <LinearGradient
          colors={["#00FFFF", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryCardBorder}
        >
          <View style={styles.categoryInnerCard}>
            <View
              style={[
                styles.iconContainer,
                isRTL && { alignItems: "flex-end" },
              ]}
            >
              <LinearGradient
                colors={gradientColors as [string, string]}
                style={styles.iconBackground}
              >
                <Ionicons
                  name={getCategoryIcon(item.name) as any}
                  size={28}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View
              style={[
                styles.categoryTextContainer,
                isRTL && { alignItems: "flex-end" },
              ]}
            >
              <Text
                style={[styles.categoryName, isRTL && { textAlign: "right" }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text style={styles.itemCount}>
                {item.recipeCount || 0} recipes
              </Text>
            </View>

            <View
              style={[
                styles.arrowContainer,
                isRTL ? { left: 12, right: undefined } : { right: 12 },
              ]}
            >
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={18}
                color="rgba(255,255,255,0.5)"
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    // Get description (use recipe.description or fallback to first instruction)
    let description = item.description || "";
    if (
      !description &&
      Array.isArray(item.instructions) &&
      item.instructions.length > 0
    ) {
      const firstInstruction = item.instructions[0];
      description =
        typeof firstInstruction === "string" ? firstInstruction : "";
    }

    const authorName =
      item.userId && typeof item.userId === "object"
        ? item.userId.username
        : null;

    // Get main image (first image from images array or fallback to image field)
    const mainImageUrl =
      item.images && item.images.length > 0
        ? getImageUrl(item.images[0])
        : getImageUrl(item.image);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.recipeCardWrapper}
        onPress={() => router.push(`/recipes/${item._id}`)}
      >
        <LinearGradient
          colors={["#00FFFF", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recipeCardBorder}
        >
          <View style={styles.recipeInnerCard}>
            {/* Large centered main image */}
            <View style={styles.recipeImageContainer}>
              <Image
                source={{
                  uri: mainImageUrl || "https://via.placeholder.com/300",
                }}
                style={styles.recipeImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.recipeImageOverlay}
              />
              {item.calories ? (
                <View style={styles.calorieBadge}>
                  <Ionicons name="flame" size={12} color="#FFD700" />
                  <Text style={styles.calorieText}>{item.calories}</Text>
                </View>
              ) : null}
              {/* Image count badge */}
              {item.images && item.images.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <Ionicons name="images" size={12} color="#FFF" />
                  <Text style={styles.imageCountText}>
                    {item.images.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Recipe info below image */}
            <View style={styles.recipeContent}>
              <View style={isRTL ? { alignItems: "flex-end" } : undefined}>
                <Text style={styles.recipeName} numberOfLines={2}>
                  {item.name}
                </Text>
                {description && (
                  <Text
                    style={[
                      styles.recipeDescription,
                      isRTL && { textAlign: "right" },
                    ]}
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                )}
                {authorName && (
                  <Text style={styles.authorText}>by @{authorName}</Text>
                )}
              </View>

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

  return (
    <View style={styles.root}>
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View
          style={[styles.headerTop, isRTL && { flexDirection: "row-reverse" }]}
        >
          <View>
            <Text style={styles.headerTitle}>{t("recipes")}</Text>
            <Text style={styles.headerSubtitle}>
              {viewMode === "categories"
                ? "Browse by category"
                : "Discover all recipes"}
            </Text>
          </View>
          {viewMode === "categories" && (
            <TouchableOpacity onPress={openModal} activeOpacity={0.8}>
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                style={styles.addButton}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
          {viewMode === "recipes" && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(protected)/myRecipes/add")}
            >
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                style={styles.addButton}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === "categories" && styles.toggleButtonActive,
              ]}
              onPress={() => setViewMode("categories")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid"
                size={18}
                color={viewMode === "categories" ? "#000" : "#888"}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewMode === "categories" && styles.toggleTextActive,
                ]}
              >
                Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === "recipes" && styles.toggleButtonActive,
              ]}
              onPress={() => setViewMode("recipes")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="restaurant"
                size={18}
                color={viewMode === "recipes" ? "#000" : "#888"}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewMode === "recipes" && styles.toggleTextActive,
                ]}
              >
                All Recipes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
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
            placeholder={
              viewMode === "categories"
                ? "Search categories..."
                : "Search recipes..."
            }
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {viewMode === "recipes" && (
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              style={styles.filterButton}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasActiveFilters ? "#00FFFF" : "#888"}
              />
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills (shown when in recipes view with active filters) */}
        {viewMode === "recipes" && hasActiveFilters && (
          <View style={styles.filterPillsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsScroll}
            >
              {activeFilter !== "all" && (
                <View style={styles.filterPill}>
                  <Ionicons
                    name={
                      activeFilter === "popular"
                        ? "heart"
                        : activeFilter === "newest"
                        ? "time"
                        : "eye"
                    }
                    size={14}
                    color="#00FFFF"
                  />
                  <Text style={styles.filterPillText}>
                    {activeFilter === "popular"
                      ? "Most Liked"
                      : activeFilter === "newest"
                      ? "Newest"
                      : "Most Viewed"}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveFilter("all")}>
                    <Ionicons name="close-circle" size={16} color="#FF0055" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedFilterIngredients.map((id) => {
                const ing = availableIngredients.find((i) => i._id === id);
                if (!ing) return null;
                return (
                  <View key={id} style={styles.filterPill}>
                    <Text style={styles.filterPillEmoji}>
                      {getIngredientIcon(ing.name)}
                    </Text>
                    <Text style={styles.filterPillText}>{ing.name}</Text>
                    <TouchableOpacity
                      onPress={() => toggleFilterIngredient(id)}
                    >
                      <Ionicons name="close-circle" size={16} color="#FF0055" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              <TouchableOpacity
                style={styles.clearFiltersPill}
                onPress={clearFilters}
              >
                <Ionicons name="trash-outline" size={14} color="#FF0055" />
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Create Category Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Animated.View
            style={[styles.modalBackdrop, { opacity: modalOpacity }]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeModal}
              activeOpacity={1}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            {showSuccess ? (
              /* Success State */
              <Animated.View
                style={[
                  styles.successContainer,
                  { transform: [{ scale: successScale }] },
                ]}
              >
                {/* Colorful background glow */}
                <View style={styles.successGlowContainer}>
                  <LinearGradient
                    colors={["rgba(0,255,255,0.2)", "transparent"]}
                    style={styles.successGlow}
                  />
                  <LinearGradient
                    colors={["rgba(255,0,255,0.15)", "transparent"]}
                    style={[styles.successGlow, { left: "50%" }]}
                  />
                </View>

                <View style={styles.successIconContainer}>
                  <LinearGradient
                    colors={["#10B981", "#00FFFF"]}
                    style={styles.successIconGradient}
                  >
                    <Ionicons name="checkmark" size={50} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                <Text style={styles.successTitle}>Category Created!</Text>
                <Text style={styles.successSubtitle}>
                  "{newCategoryName}" is ready to use
                </Text>

                {/* Category Icon with colorful gradient */}
                <View style={styles.successCategoryIcon}>
                  <LinearGradient
                    colors={["#8B5CF6", "#EC4899", "#00FFFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.successCategoryIconGradient}
                  >
                    <View style={styles.successCategoryIconInner}>
                      <Ionicons name="grid" size={36} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                </View>

                {/* Colorful accent line */}
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF", "#FFD700"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successAccentLine}
                />
              </Animated.View>
            ) : (
              /* Form State */
              <>
                {/* Colorful background accents */}
                <View style={styles.formGlowContainer} pointerEvents="none">
                  <LinearGradient
                    colors={["rgba(139,92,246,0.15)", "transparent"]}
                    style={[styles.formGlow, { top: -50, left: -50 }]}
                  />
                  <LinearGradient
                    colors={["rgba(0,255,255,0.1)", "transparent"]}
                    style={[styles.formGlow, { bottom: -30, right: -30 }]}
                  />
                </View>

                {/* Header with animated icon */}
                <View style={styles.modalHeader}>
                  <Animated.View
                    style={[
                      styles.modalIconContainer,
                      {
                        transform: [
                          {
                            rotate: iconRotate.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={["#8B5CF6", "#EC4899", "#00FFFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalIconGradient}
                    >
                      <Ionicons name="grid-outline" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={24} color="#888" />
                  </TouchableOpacity>
                </View>

                {/* Title with gradient text effect */}
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Create New Category</Text>
                  <LinearGradient
                    colors={["#00FFFF", "#FF00FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalTitleUnderline}
                  />
                </View>
                <Text style={styles.modalSubtitle}>
                  Organize your recipes into categories
                </Text>

                {/* Input with shake animation and colorful border */}
                <Animated.View
                  style={[
                    styles.inputContainer,
                    { transform: [{ translateX: inputShake }] },
                    newCategoryName.length > 0 && styles.inputContainerActive,
                  ]}
                >
                  <LinearGradient
                    colors={
                      newCategoryName.length > 0
                        ? ["#8B5CF6", "#00FFFF"]
                        : ["#333", "#333"]
                    }
                    style={styles.inputIconBg}
                  >
                    <Ionicons
                      name="pricetag"
                      size={16}
                      color={newCategoryName.length > 0 ? "#FFF" : "#666"}
                    />
                  </LinearGradient>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter category name..."
                    placeholderTextColor="#555"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                    maxLength={30}
                  />
                  {newCategoryName.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setNewCategoryName("")}
                      style={styles.clearInputBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#8B5CF6" />
                    </TouchableOpacity>
                  )}
                </Animated.View>

                {/* Character count with color */}
                <Text
                  style={[
                    styles.charCount,
                    newCategoryName.length > 20 && styles.charCountWarning,
                    newCategoryName.length >= 30 && styles.charCountMax,
                  ]}
                >
                  {newCategoryName.length}/30 characters
                </Text>

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      !newCategoryName.trim() && styles.createButtonDisabled,
                    ]}
                    onPress={handleCreateCategory}
                    disabled={creating || !newCategoryName.trim()}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        newCategoryName.trim()
                          ? ["#8B5CF6", "#EC4899"]
                          : ["#333", "#222"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createButtonGradient}
                    >
                      {creating ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Ionicons
                            name="add-circle"
                            size={20}
                            color={newCategoryName.trim() ? "#FFF" : "#666"}
                          />
                          <Text
                            style={[
                              styles.createButtonText,
                              !newCategoryName.trim() &&
                                styles.createButtonTextDisabled,
                            ]}
                          >
                            Create
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalContent}>
            {/* Header */}
            <View style={styles.filterModalHeader}>
              <View style={styles.filterModalHeaderLeft}>
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF"]}
                  style={styles.filterModalIconBg}
                >
                  <Ionicons name="filter" size={24} color="#FFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.filterModalTitle}>Filter Recipes</Text>
                  <Text style={styles.filterModalSubtitle}>
                    {filteredRecipes.length} results
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.filterModalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort By Section */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptionsGrid}>
                {[
                  { id: "all", label: "Default", icon: "apps" },
                  { id: "popular", label: "Most Liked", icon: "heart" },
                  { id: "newest", label: "Newest", icon: "time" },
                  { id: "mostViewed", label: "Most Viewed", icon: "eye" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.sortOption,
                      activeFilter === option.id && styles.sortOptionActive,
                    ]}
                    onPress={() => setActiveFilter(option.id as any)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={activeFilter === option.id ? "#000" : "#888"}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        activeFilter === option.id &&
                          styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter by Ingredients Section */}
              <Text style={styles.filterSectionTitle}>
                Filter by Ingredients
              </Text>
              <TouchableOpacity
                style={styles.ingredientPickerButton}
                onPress={() => setShowIngredientPicker(true)}
              >
                <Ionicons name="flask-outline" size={22} color="#00FFFF" />
                <Text style={styles.ingredientPickerButtonText}>
                  Select Ingredients ({selectedFilterIngredients.length})
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </TouchableOpacity>

              {/* Selected Ingredients */}
              {selectedFilterIngredients.length > 0 && (
                <View style={styles.selectedIngredientsContainer}>
                  {selectedFilterIngredients.map((id) => {
                    const ing = availableIngredients.find((i) => i._id === id);
                    if (!ing) return null;
                    return (
                      <View key={id} style={styles.selectedIngredientChip}>
                        <Text style={styles.selectedIngredientEmoji}>
                          {getIngredientIcon(ing.name)}
                        </Text>
                        <Text style={styles.selectedIngredientText}>
                          {ing.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleFilterIngredient(id)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color="#FF0055"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyFiltersGradient}
                >
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.applyFiltersText}>
                    Apply ({filteredRecipes.length})
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ingredient Picker Modal */}
      <Modal
        visible={showIngredientPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIngredientPicker(false)}
      >
        <View style={styles.ingredientModalContainer}>
          <View style={styles.ingredientModalContent}>
            <View style={styles.ingredientModalHeader}>
              <View style={styles.ingredientModalHeaderLeft}>
                <LinearGradient
                  colors={["#00FFFF", "#00CED1"]}
                  style={styles.ingredientModalIconBg}
                >
                  <Ionicons name="flask" size={24} color="#000" />
                </LinearGradient>
                <View>
                  <Text style={styles.ingredientModalTitle}>
                    Select Ingredients
                  </Text>
                  <Text style={styles.ingredientModalSubtitle}>
                    {selectedFilterIngredients.length} selected
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowIngredientPicker(false)}
                style={styles.ingredientModalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.ingredientSearchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.ingredientSearchInput}
                placeholder="Search ingredients..."
                placeholderTextColor="#555"
                value={ingredientSearch}
                onChangeText={setIngredientSearch}
              />
              {ingredientSearch.length > 0 && (
                <TouchableOpacity onPress={() => setIngredientSearch("")}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Ingredients List */}
            <FlatList
              data={filteredIngredients}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedFilterIngredients.includes(item._id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.ingredientItem,
                      isSelected && styles.ingredientItemSelected,
                    ]}
                    onPress={() => toggleFilterIngredient(item._id)}
                  >
                    <View style={styles.ingredientItemLeft}>
                      <View
                        style={[
                          styles.ingredientItemIcon,
                          isSelected && styles.ingredientItemIconSelected,
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>
                          {getIngredientIcon(item.name)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ingredientItemText,
                          isSelected && styles.ingredientItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.ingredientCheckbox,
                        isSelected && styles.ingredientCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#000" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.ingredientEmptyContainer}>
                  <Ionicons name="flask-outline" size={50} color="#333" />
                  <Text style={styles.ingredientEmptyText}>
                    {ingredientSearch
                      ? `No results for "${ingredientSearch}"`
                      : "No ingredients available"}
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.ingredientDoneBtn}
              onPress={() => setShowIngredientPicker(false)}
            >
              <LinearGradient
                colors={["#00FFFF", "#00CED1"]}
                style={styles.ingredientDoneGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#000" />
                <Text style={styles.ingredientDoneText}>
                  Done ({selectedFilterIngredients.length} selected)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : viewMode === "categories" ? (
        <FlatList
          key="categories-grid"
          data={filteredCategories}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderCategoryItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
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
              <Ionicons name="grid-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No categories yet</Text>
              <Text style={styles.emptySubText}>
                Create your first category to organize recipes!
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="recipes-list"
          data={filteredRecipes}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.listContent}
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
              <Ionicons name="restaurant-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No recipes yet</Text>
              <Text style={styles.emptySubText}>
                Be the first to share a recipe!
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
    fontSize: 14,
    color: "#888",
    marginTop: 4,
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
  toggleContainer: {
    marginBottom: 15,
  },
  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 15,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleButtonActive: {
    backgroundColor: "#00FFFF",
  },
  toggleText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#000",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: GAP,
  },
  // Category styles
  categoryCardWrapper: {
    width: ITEM_WIDTH,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryCardBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  categoryInnerCard: {
    height: 140,
    borderRadius: 18.5,
    backgroundColor: "#1A1A2E",
    padding: 15,
    justifyContent: "space-between",
  },
  iconContainer: {
    alignItems: "flex-start",
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTextContainer: {
    gap: 4,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  itemCount: {
    fontSize: 12,
    color: "#888",
  },
  arrowContainer: {
    position: "absolute",
    top: 15,
  },
  // Recipe styles
  recipeCardWrapper: {
    marginBottom: 20,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recipeCardBorder: {
    borderRadius: 24,
    padding: 2,
  },
  recipeInnerCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "column",
  },
  recipeImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recipeImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageCountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  calorieBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  calorieText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  recipeContent: {
    padding: 14,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 22,
  },
  recipeDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
    lineHeight: 16,
  },
  authorText: {
    fontSize: 11,
    color: "#00FFFF",
    marginBottom: 2,
  },
  recipeDesc: {
    fontSize: 11,
    color: "#AAAAAA",
    lineHeight: 14,
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  socialText: {
    color: "#888",
    fontSize: 12,
  },
  socialTextLiked: {
    color: "#FF0055",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#1A1A2E",
    borderRadius: 28,
    padding: 25,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
  },
  formGlowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  formGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  modalIconContainer: {
    alignItems: "center",
  },
  modalIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  modalCloseBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  modalTitleUnderline: {
    height: 3,
    width: 80,
    borderRadius: 2,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },
  inputContainerActive: {
    borderColor: "rgba(139, 92, 246, 0.5)",
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  inputIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  clearInputBtn: {
    padding: 5,
  },
  charCount: {
    fontSize: 12,
    color: "#555",
    textAlign: "right",
    marginBottom: 20,
  },
  charCountWarning: {
    color: "#F59E0B",
  },
  charCountMax: {
    color: "#EF4444",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  cancelButtonText: {
    color: "#AAA",
    fontWeight: "600",
    fontSize: 16,
  },
  createButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  createButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  createButtonTextDisabled: {
    color: "#666",
  },
  sparkleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: "absolute",
    opacity: 0.6,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 30,
    position: "relative",
    overflow: "hidden",
  },
  successGlowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  successGlow: {
    width: "50%",
    height: "100%",
    borderRadius: 20,
  },
  successIconContainer: {
    marginBottom: 20,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  successIconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 5,
  },
  successCategoryIcon: {
    marginTop: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  successCategoryIconGradient: {
    padding: 3,
    borderRadius: 25,
  },
  successCategoryIconInner: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  successAccentLine: {
    height: 4,
    width: 120,
    borderRadius: 2,
    marginTop: 25,
  },
  // Filter Button & Pills
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00FFFF",
  },
  filterPillsContainer: {
    marginTop: 12,
  },
  filterPillsScroll: {
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  filterPillEmoji: {
    fontSize: 14,
  },
  filterPillText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
  },
  clearFiltersPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 0, 85, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.3)",
  },
  clearFiltersText: {
    color: "#FF0055",
    fontSize: 13,
    fontWeight: "500",
  },
  // Filter Modal
  filterModalContainer: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: "#0D0D1A",
    height: "75%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  filterModalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterModalIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterModalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  filterModalSubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  filterModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSectionTitle: {
    color: "#00FFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 5,
  },
  sortOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sortOptionActive: {
    backgroundColor: "#00FFFF",
    borderColor: "#00FFFF",
  },
  sortOptionText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  sortOptionTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  ingredientPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(0, 255, 255, 0.08)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.2)",
    borderStyle: "dashed",
    marginBottom: 15,
  },
  ingredientPickerButtonText: {
    flex: 1,
    color: "#00FFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  selectedIngredientsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  selectedIngredientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  selectedIngredientEmoji: {
    fontSize: 14,
  },
  selectedIngredientText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
  },
  filterModalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  clearFiltersButtonText: {
    color: "#AAA",
    fontWeight: "600",
    fontSize: 15,
  },
  applyFiltersButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  applyFiltersGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  applyFiltersText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },
  // Ingredient Picker Modal
  ingredientModalContainer: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    justifyContent: "flex-end",
  },
  ingredientModalContent: {
    backgroundColor: "#0D0D1A",
    height: "85%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  ingredientModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  ingredientModalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ingredientModalIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientModalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  ingredientModalSubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  ingredientModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 10,
    marginBottom: 15,
  },
  ingredientSearchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    paddingVertical: 14,
  },
  ingredientItem: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientItemSelected: {
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
  },
  ingredientItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ingredientItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientItemIconSelected: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
  },
  ingredientItemText: {
    color: "#AAA",
    fontSize: 16,
  },
  ingredientItemTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  ingredientCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientCheckboxSelected: {
    backgroundColor: "#00FFFF",
    borderColor: "#00FFFF",
  },
  ingredientEmptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  ingredientEmptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  ingredientDoneBtn: {
    marginTop: 15,
    borderRadius: 16,
    overflow: "hidden",
  },
  ingredientDoneGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  ingredientDoneText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
