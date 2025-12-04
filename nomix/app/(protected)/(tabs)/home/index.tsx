import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import {
  getRandomRecipe,
  getRandomCategoriesWithRecipes,
  CategoryWithRecipe,
  getAllRecipes,
} from "../../../../api/recipes";
import { getUserById, getAllUsers } from "../../../../api/auth";
import { getImageUrl } from "../../../../api/index";
import { Recipe } from "../../../../types/Recipe";
import { User } from "../../../../types/User";
import { useFocusEffect } from "expo-router";

const { width, height } = Dimensions.get("window");

const Home = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";

  // Full user profile data from API
  const [profileData, setProfileData] = useState<User | null>(null);

  // Fetch full user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?._id) {
        try {
          const userData = await getUserById(user._id);
          if (userData && userData.success) {
            setProfileData(userData.data);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, [user?._id]);

  // Get user profile image URL - handle both full URLs and relative paths
  const userProfileImage = profileData?.profilePicture || user?.profilePicture;
  const profileImageUrl = userProfileImage
    ? userProfileImage.startsWith("http")
      ? userProfileImage
      : getImageUrl(userProfileImage)
    : null;

  // Get display name
  const displayName = profileData?.username || user?.username || "User";

  // Random Recipe States
  const [showSurprise, setShowSurprise] = useState(false);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);

  // Animation refs
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.3)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  // Daily Wheel States
  const [showWheel, setShowWheel] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<Recipe | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wheelCategories, setWheelCategories] = useState<CategoryWithRecipe[]>(
    []
  );
  const [loadingWheel, setLoadingWheel] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Wheel Animation refs
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const wheelScale = useRef(new Animated.Value(0.5)).current;
  const wheelOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array.from({ length: 30 }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // Wheel segment colors
  const wheelColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#FFE66D",
    "#FF8C42",
    "#A78BFA",
    "#06D6A0",
    "#EF476F",
    "#118AB2",
    "#F59E0B",
    "#EC4899",
  ];

  // Filter Categories
  const filterCategories = [
    { id: "popular", name: isRTL ? "الأكثر شعبية" : "Popular", icon: "flame" },
    { id: "new", name: isRTL ? "جديد" : "New", icon: "sparkles" },
    { id: "trending", name: isRTL ? "رائج" : "Trending", icon: "trending-up" },
    {
      id: "top_rated",
      name: isRTL ? "الأعلى تقييماً" : "Top Rated",
      icon: "star",
    },
    { id: "quick", name: isRTL ? "سريع" : "Quick", icon: "flash" },
  ];

  // Featured recipes state
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("popular");
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  // Top users state
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loadingTopUsers, setLoadingTopUsers] = useState(true);

  // Fetch recipes
  useFocusEffect(
    useCallback(() => {
      const fetchRecipes = async () => {
        try {
          setLoadingRecipes(true);
          const recipes = await getAllRecipes();
          setAllRecipes(recipes);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
        } finally {
          setLoadingRecipes(false);
        }
      };
      fetchRecipes();
    }, [])
  );

  // Fetch top users (sorted by followers)
  useFocusEffect(
    useCallback(() => {
      const fetchTopUsers = async () => {
        try {
          setLoadingTopUsers(true);
          const response = await getAllUsers();
          if (response && response.success && Array.isArray(response.data)) {
            // Sort by followers count and take top 10
            const sortedUsers = response.data
              .sort(
                (a: User, b: User) =>
                  (b.followers?.length || 0) - (a.followers?.length || 0)
              )
              .slice(0, 10);
            setTopUsers(sortedUsers);
          }
        } catch (error) {
          console.error("Failed to fetch top users:", error);
        } finally {
          setLoadingTopUsers(false);
        }
      };
      fetchTopUsers();
    }, [])
  );

  // Filter and sort recipes based on selected category
  const getFilteredRecipes = () => {
    let filtered = [...allRecipes];

    switch (selectedFilter) {
      case "popular":
        // Sort by likes + views
        filtered.sort((a, b) => {
          const scoreA = (a.likes?.length || 0) + (a.views || 0);
          const scoreB = (b.likes?.length || 0) + (b.views || 0);
          return scoreB - scoreA;
        });
        break;
      case "new":
        // Sort by date (newest first)
        filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case "trending":
        // Sort by views (most viewed)
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "top_rated":
        // Sort by likes
        filtered.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        break;
      case "quick":
        // Sort by calories (low cal = quick/easy)
        filtered.sort((a, b) => (a.calories || 999) - (b.calories || 999));
        break;
      default:
        break;
    }

    return filtered.slice(0, 10); // Only show 10
  };

  const featuredRecipes = getFilteredRecipes();

  const handleRandomRecipe = async () => {
    setLoadingRandom(true);
    setShowSurprise(true);
    setRevealComplete(false);
    setRandomRecipe(null);

    // Reset animations
    spinValue.setValue(0);
    scaleValue.setValue(0.3);
    fadeValue.setValue(0);
    bounceValue.setValue(0);
    sparkleOpacity.setValue(0);

    try {
      // Start loading animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      const recipe = await getRandomRecipe();
      setRandomRecipe(recipe);
      setLoadingRandom(false);

      // Stop spin and start reveal animation
      spinValue.stopAnimation();

      // Reveal animation sequence
      Animated.sequence([
        // Scale up with bounce
        Animated.spring(scaleValue, {
          toValue: 1.1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade in content
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Bounce the button
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -5,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      setRevealComplete(true);
    } catch (error) {
      console.error("Failed to get random recipe:", error);
      setLoadingRandom(false);
      setShowSurprise(false);
    }
  };

  const handleViewRecipe = () => {
    if (randomRecipe?._id) {
      setShowSurprise(false);
      router.push(`/recipes/${randomRecipe._id}`);
    }
  };

  const closeSurprise = () => {
    setShowSurprise(false);
    setRandomRecipe(null);
    setRevealComplete(false);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Daily Wheel Functions
  const openDailyWheel = async () => {
    setShowWheel(true);
    setWheelSpinning(false);
    setWheelResult(null);
    setShowConfetti(false);
    setSelectedSegment(null);
    setLoadingWheel(true);

    // Reset animations
    wheelRotation.setValue(0);
    wheelScale.setValue(0.5);
    wheelOpacity.setValue(0);
    resultScale.setValue(0);
    resultOpacity.setValue(0);

    // Animate wheel modal in
    Animated.parallel([
      Animated.spring(wheelScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(wheelOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch random categories with recipes
    try {
      const data = await getRandomCategoriesWithRecipes();
      setWheelCategories(data);
    } catch (error) {
      console.error("Failed to fetch wheel categories:", error);
    } finally {
      setLoadingWheel(false);
    }
  };

  const closeDailyWheel = () => {
    Animated.parallel([
      Animated.timing(wheelScale, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(wheelOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWheel(false);
      setWheelResult(null);
      setShowConfetti(false);
    });
  };

  const startConfetti = () => {
    setShowConfetti(true);
    confettiAnimations.forEach((anim, index) => {
      const randomX = (Math.random() - 0.5) * width;
      const randomDelay = Math.random() * 500;

      anim.translateY.setValue(-50);
      anim.translateX.setValue(randomX);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);

      Animated.sequence([
        Animated.delay(randomDelay),
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: height + 100,
            duration: 2500 + Math.random() * 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: randomX + (Math.random() - 0.5) * 200,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: Math.random() * 10,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(1500),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  };

  const spinTheWheel = async () => {
    if (wheelSpinning || wheelCategories.length === 0) return;
    setWheelSpinning(true);
    setWheelResult(null);
    setSelectedSegment(null);

    const numSegments = wheelCategories.length;
    // Random number of full rotations (5-8)
    const fullRotations = 5 + Math.random() * 3;
    // Select a random winning segment
    const winningSegment = Math.floor(Math.random() * numSegments);

    // Calculate final position so winning segment lands at the top (under the pointer)
    // Segments are positioned with center at angle: (i * segmentAngle + segmentAngle/2 - 90) degrees
    // To bring segment i to top (-90°), we rotate: 360 - (i + 0.5) * segmentAngle degrees
    // In rotation units (where 1 = 360°): 1 - (i + 0.5) / numSegments
    const finalPosition = 1 - (winningSegment + 0.5) / numSegments;
    const totalRotation = fullRotations + finalPosition;

    // Spin animation
    Animated.timing(wheelRotation, {
      toValue: totalRotation,
      duration: 5000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedSegment(winningSegment);

      // Get the recipe from the selected category
      const selectedCategory = wheelCategories[winningSegment];
      if (selectedCategory?.recipe) {
        setWheelResult(selectedCategory.recipe as Recipe);
        // Start confetti!
        startConfetti();

        // Animate result in
        Animated.parallel([
          Animated.spring(resultScale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(resultOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // No recipe in this category, try again or show message
        setWheelResult(null);
      }
      setWheelSpinning(false);
    });
  };

  const viewWheelRecipe = () => {
    if (wheelResult?._id) {
      closeDailyWheel();
      setTimeout(() => {
        router.push(`/recipes/${wheelResult._id}`);
      }, 300);
    }
  };

  const wheelRotationInterpolate = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
            <Text style={styles.greeting}>
              {isRTL ? `مرحباً، ${displayName}` : `Hello, ${displayName}`}
            </Text>
            <Text style={styles.subtitle}>{t("subtitle")}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.8}
            onPress={() => router.push("/profile")}
          >
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person" size={24} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
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

        {/* Random Recipe Button */}
        <TouchableOpacity
          style={styles.randomButtonContainer}
          activeOpacity={0.8}
          onPress={handleRandomRecipe}
        >
          <LinearGradient
            colors={["#8B5CF6", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.randomButtonGradient}
          >
            <View
              style={[
                styles.randomButtonContent,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.randomIconWrapper,
                  isRTL ? { marginLeft: 15 } : { marginRight: 15 },
                ]}
              >
                <Ionicons name="dice" size={24} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.randomTextContainer,
                  isRTL && { alignItems: "flex-end" },
                ]}
              >
                <Text style={styles.randomButtonTitle}>Surprise Me! 🎲</Text>
                <Text style={styles.randomButtonSubtitle}>
                  Discover a random recipe
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <Ionicons name="gift" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daily Wheel Button */}
        <TouchableOpacity
          style={styles.wheelButtonContainer}
          activeOpacity={0.8}
          onPress={openDailyWheel}
        >
          <LinearGradient
            colors={["#F59E0B", "#EF4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.wheelButtonGradient}
          >
            <View
              style={[
                styles.wheelButtonContent,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.wheelIconWrapper,
                  isRTL ? { marginLeft: 15 } : { marginRight: 15 },
                ]}
              >
                <Text style={{ fontSize: 24 }}>🎡</Text>
              </View>
              <View
                style={[
                  styles.wheelTextContainer,
                  isRTL && { alignItems: "flex-end" },
                ]}
              >
                <Text style={styles.wheelButtonTitle}>Daily Wheel 🎰</Text>
                <Text style={styles.wheelButtonSubtitle}>
                  Spin to win a recipe!
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <Ionicons name="trophy" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Filter Categories */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isRTL && { textAlign: "right", marginRight: 20 },
            ]}
          >
            {isRTL ? "تصفية حسب" : "Filter By"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoriesList,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {filterCategories.map((category) => {
              const isSelected = selectedFilter === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedFilter(category.id)}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ["#00FFFF", "#FF00FF"]
                        : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.activeCategoryCard,
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={isSelected ? "#FFFFFF" : "#00FFFF"}
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.activeCategoryName,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Recipes */}
        <View style={styles.section}>
          <View
            style={[
              styles.sectionHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Text
              style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}
            >
              {t("featured_mixes")}
            </Text>
            <Text style={styles.recipeCount}>
              {featuredRecipes.length} {isRTL ? "وصفة" : "recipes"}
            </Text>
          </View>

          {loadingRecipes ? (
            <View style={styles.loadingFeatured}>
              <ActivityIndicator size="large" color="#00FFFF" />
              <Text style={styles.loadingFeaturedText}>
                {isRTL ? "جاري التحميل..." : "Loading recipes..."}
              </Text>
            </View>
          ) : featuredRecipes.length === 0 ? (
            <View style={styles.emptyFeatured}>
              <Ionicons name="restaurant-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                {isRTL ? "لا توجد وصفات" : "No recipes yet"}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContent}
            >
              {featuredRecipes.map((recipe) => {
                // Get main image
                const mainImage =
                  recipe.images && recipe.images.length > 0
                    ? getImageUrl(recipe.images[0]) ||
                      "https://via.placeholder.com/300"
                    : getImageUrl(recipe.image) ||
                      "https://via.placeholder.com/300";

                // Get author name
                const authorName =
                  recipe.userId && typeof recipe.userId === "object"
                    ? recipe.userId.username
                    : null;

                // Get description (use recipe.description or fallback to first instruction)
                let description = recipe.description || "";
                if (
                  !description &&
                  Array.isArray(recipe.instructions) &&
                  recipe.instructions.length > 0
                ) {
                  description = recipe.instructions[0];
                }

                // Format date for "new" filter
                const recipeDate = recipe.createdAt
                  ? new Date(recipe.createdAt).toLocaleDateString()
                  : "";

                return (
                  <TouchableOpacity
                    key={recipe._id}
                    activeOpacity={0.9}
                    style={styles.featuredCardWrapper}
                    onPress={() => router.push(`/recipes/${recipe._id}`)}
                  >
                    <LinearGradient
                      colors={["#00FFFF", "#FF00FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.featuredCardBorder}
                    >
                      <View style={styles.featuredInnerCard}>
                        {/* Background Image */}
                        <Image
                          source={{ uri: mainImage }}
                          style={styles.featuredCardImage}
                        />

                        {/* Gradient Overlay */}
                        <LinearGradient
                          colors={[
                            "transparent",
                            "rgba(0,0,0,0.8)",
                            "rgba(0,0,0,0.95)",
                          ]}
                          style={styles.featuredCardOverlay}
                        >
                          {/* Stats Badge */}
                          <View style={styles.featuredStatsBadge}>
                            <View style={styles.statItem}>
                              <Ionicons
                                name="heart"
                                size={12}
                                color="#FF0055"
                              />
                              <Text style={styles.statText}>
                                {recipe.likes?.length || 0}
                              </Text>
                            </View>
                            <View style={styles.statItem}>
                              <Ionicons name="eye" size={12} color="#00FFFF" />
                              <Text style={styles.statText}>
                                {recipe.views || 0}
                              </Text>
                            </View>
                          </View>

                          {/* Content */}
                          <View style={styles.featuredCardContent}>
                            <Text
                              style={styles.featuredCardTitle}
                              numberOfLines={2}
                            >
                              {recipe.name}
                            </Text>

                            {description && (
                              <Text
                                style={styles.featuredCardDesc}
                                numberOfLines={2}
                              >
                                {description}
                              </Text>
                            )}

                            {/* Author & Date */}
                            <View style={styles.featuredCardFooter}>
                              {authorName && (
                                <View style={styles.authorContainer}>
                                  <Ionicons
                                    name="person-circle"
                                    size={16}
                                    color="#888"
                                  />
                                  <Text style={styles.authorText}>
                                    @{authorName}
                                  </Text>
                                </View>
                              )}
                              {selectedFilter === "new" && recipeDate && (
                                <Text style={styles.dateText}>
                                  {recipeDate}
                                </Text>
                              )}
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Top Users Section */}
        <View style={styles.section}>
          <View
            style={[
              styles.sectionHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Ionicons name="trophy" size={22} color="#FFD700" />
            <Text style={styles.sectionTitle}>
              {isRTL ? "أفضل المستخدمين" : "Top Users"}
            </Text>
          </View>

          {loadingTopUsers ? (
            <View style={styles.loadingFeatured}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingFeaturedText}>
                {isRTL ? "جاري التحميل..." : "Loading top users..."}
              </Text>
            </View>
          ) : topUsers.length === 0 ? (
            <View style={styles.emptyFeatured}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                {isRTL ? "لا يوجد مستخدمين" : "No users yet"}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topUsersScrollContent}
            >
              {topUsers.map((topUser, index) => {
                const userImage =
                  topUser.profilePicture || (topUser as any).image;
                const imageUrl = userImage
                  ? userImage.startsWith("http")
                    ? userImage
                    : getImageUrl(userImage)
                  : null;

                return (
                  <TouchableOpacity
                    key={topUser._id}
                    style={styles.topUserCard}
                    onPress={() => router.push(`/users/${topUser._id}`)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        index === 0
                          ? ["#FFD700", "#FFA500"]
                          : index === 1
                          ? ["#C0C0C0", "#A0A0A0"]
                          : index === 2
                          ? ["#CD7F32", "#8B4513"]
                          : ["#00FFFF", "#FF00FF"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.topUserCardBorder}
                    >
                      <View style={styles.topUserCardInner}>
                        {/* Rank Badge */}
                        <View
                          style={[
                            styles.rankBadge,
                            index === 0 && styles.rankBadgeGold,
                            index === 1 && styles.rankBadgeSilver,
                            index === 2 && styles.rankBadgeBronze,
                          ]}
                        >
                          {index < 3 ? (
                            <Ionicons
                              name="trophy"
                              size={12}
                              color={
                                index === 0
                                  ? "#FFD700"
                                  : index === 1
                                  ? "#C0C0C0"
                                  : "#CD7F32"
                              }
                            />
                          ) : (
                            <Text style={styles.rankNumber}>{index + 1}</Text>
                          )}
                        </View>

                        {/* Profile Picture */}
                        <View style={styles.topUserImageContainer}>
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.topUserImage}
                            />
                          ) : (
                            <View style={styles.topUserPlaceholder}>
                              <Ionicons name="person" size={30} color="#666" />
                            </View>
                          )}
                        </View>

                        {/* User Info */}
                        <Text style={styles.topUserName} numberOfLines={1}>
                          {topUser.username || "User"}
                        </Text>

                        {/* Followers Count */}
                        <View style={styles.topUserFollowers}>
                          <Ionicons name="people" size={14} color="#00FFFF" />
                          <Text style={styles.topUserFollowersText}>
                            {topUser.followers?.length || 0}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Surprise Modal */}
      <Modal
        visible={showSurprise}
        transparent
        animationType="fade"
        onRequestClose={closeSurprise}
      >
        <View style={styles.modalOverlay}>
          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 20 }]}
            onPress={closeSurprise}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {loadingRandom ? (
            // Loading Animation
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[
                  styles.spinnerContainer,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <LinearGradient
                  colors={["#8B5CF6", "#06B6D4", "#FF0055", "#00FFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.spinnerGradient}
                >
                  <Ionicons name="dice" size={60} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.loadingText}>Finding your surprise...</Text>
              <View style={styles.loadingDots}>
                <ActivityIndicator size="small" color="#00FFFF" />
              </View>
            </View>
          ) : randomRecipe && revealComplete ? (
            // Reveal Animation
            <Animated.View
              style={[
                styles.revealContainer,
                {
                  transform: [{ scale: scaleValue }],
                  opacity: fadeValue,
                },
              ]}
            >
              {/* Sparkles - pointerEvents none so it doesn't block buttons */}
              <Animated.View
                pointerEvents="none"
                style={[styles.sparkleContainer, { opacity: sparkleOpacity }]}
              >
                <Ionicons
                  name="sparkles"
                  size={30}
                  color="#FFD700"
                  style={styles.sparkle1}
                />
                <Ionicons
                  name="star"
                  size={20}
                  color="#FF00FF"
                  style={styles.sparkle2}
                />
                <Ionicons
                  name="sparkles"
                  size={25}
                  color="#00FFFF"
                  style={styles.sparkle3}
                />
                <Ionicons
                  name="star"
                  size={18}
                  color="#FFD700"
                  style={styles.sparkle4}
                />
              </Animated.View>

              {/* Surprise Text */}
              <Text style={styles.surpriseText}>🎉 SURPRISE! 🎉</Text>

              {/* Recipe Card */}
              <View style={styles.revealCard}>
                <LinearGradient
                  colors={["#8B5CF6", "#06B6D4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.revealCardBorder}
                >
                  <View style={styles.revealCardInner}>
                    <Image
                      source={{
                        uri:
                          getImageUrl(randomRecipe.image) ||
                          "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=600&q=80",
                      }}
                      style={styles.revealImage}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.9)"]}
                      style={styles.revealOverlay}
                    >
                      <Text style={styles.revealRecipeName}>
                        {randomRecipe.name}
                      </Text>
                      <View style={styles.revealStats}>
                        {randomRecipe.calories && (
                          <View style={styles.revealStat}>
                            <Ionicons name="flame" size={16} color="#FF6B6B" />
                            <Text style={styles.revealStatText}>
                              {randomRecipe.calories} kcal
                            </Text>
                          </View>
                        )}
                        <View style={styles.revealStat}>
                          <Ionicons name="heart" size={16} color="#FF0055" />
                          <Text style={styles.revealStatText}>
                            {randomRecipe.likes?.length || 0} likes
                          </Text>
                        </View>
                        <View style={styles.revealStat}>
                          <Ionicons name="eye" size={16} color="#00FFFF" />
                          <Text style={styles.revealStatText}>
                            {randomRecipe.views || 0} views
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </View>

              {/* View Recipe Button */}
              <Animated.View
                style={{ transform: [{ translateY: bounceValue }] }}
              >
                <TouchableOpacity
                  style={styles.viewRecipeButton}
                  onPress={handleViewRecipe}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#00FFFF", "#FF00FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.viewRecipeGradient}
                  >
                    <Text style={styles.viewRecipeText}>
                      View This Recipe! 🍳
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Try Again Button */}
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={handleRandomRecipe}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={18} color="#00FFFF" />
                <Text style={styles.tryAgainText}>Try Another Surprise</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </View>
      </Modal>

      {/* Daily Wheel Modal */}
      <Modal
        visible={showWheel}
        transparent
        animationType="none"
        onRequestClose={closeDailyWheel}
      >
        <View style={styles.wheelModalOverlay}>
          {/* Confetti */}
          {showConfetti &&
            confettiAnimations.map((anim, index) => {
              const colors = [
                "#FF6B6B",
                "#4ECDC4",
                "#FFE66D",
                "#FF8C42",
                "#A78BFA",
                "#06D6A0",
                "#EF476F",
                "#118AB2",
                "#F59E0B",
                "#00FFFF",
              ];
              const shapes = ["●", "■", "▲", "★", "♦"];
              return (
                <Animated.Text
                  key={index}
                  style={[
                    styles.confetti,
                    {
                      color: colors[index % colors.length],
                      transform: [
                        { translateY: anim.translateY },
                        { translateX: anim.translateX },
                        {
                          rotate: anim.rotate.interpolate({
                            inputRange: [0, 10],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                      opacity: anim.opacity,
                    },
                  ]}
                >
                  {shapes[index % shapes.length]}
                </Animated.Text>
              );
            })}

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.wheelCloseButton, { top: insets.top + 20 }]}
            onPress={closeDailyWheel}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.wheelContainer,
              {
                transform: [{ scale: wheelScale }],
                opacity: wheelOpacity,
              },
            ]}
          >
            {/* Title */}
            <Text style={styles.wheelTitle}>🎡 Daily Wheel 🎡</Text>
            <Text style={styles.wheelSubtitle}>
              Spin to discover today's recipe!
            </Text>

            {/* Wheel */}
            <View style={styles.wheelWrapper}>
              {/* Pointer at top */}
              <View style={styles.wheelPointer}>
                <View style={styles.pointerArrow}>
                  <Ionicons name="caret-down" size={40} color="#FFD700" />
                </View>
              </View>

              {/* Spinning Wheel */}
              {loadingWheel ? (
                <View style={styles.wheelLoading}>
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={styles.wheelLoadingText}>
                    Loading categories...
                  </Text>
                </View>
              ) : (
                <Animated.View
                  style={[
                    styles.wheel,
                    { transform: [{ rotate: wheelRotationInterpolate }] },
                  ]}
                >
                  {/* Category segments around the wheel */}
                  {wheelCategories.map((item, index) => {
                    const numSegments = wheelCategories.length;
                    const segmentAngle = 360 / numSegments;
                    const rotation = index * segmentAngle;
                    const color = wheelColors[index % wheelColors.length];
                    const radius = 90;
                    const angleRad =
                      ((rotation + segmentAngle / 2 - 90) * Math.PI) / 180;
                    const x = Math.cos(angleRad) * radius;
                    const y = Math.sin(angleRad) * radius;
                    const isSelected =
                      selectedSegment === index && !wheelSpinning;

                    return (
                      <View
                        key={item.category._id}
                        style={[
                          styles.wheelSegmentCard,
                          {
                            backgroundColor: color,
                            transform: [
                              { translateX: x },
                              { translateY: y },
                              { rotate: `${rotation + segmentAngle / 2}deg` },
                              { scale: isSelected ? 1.15 : 1 },
                            ],
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: "#FFFFFF",
                            zIndex: isSelected ? 100 : 1,
                          },
                        ]}
                      >
                        <Text style={styles.wheelSegmentText} numberOfLines={1}>
                          {item.category.name}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Decorative lines from center */}
                  {wheelCategories.map((_, index) => {
                    const numSegments = wheelCategories.length;
                    const segmentAngle = 360 / numSegments;
                    const rotation = index * segmentAngle;
                    return (
                      <View
                        key={`line-${index}`}
                        style={[
                          styles.wheelLine,
                          { transform: [{ rotate: `${rotation}deg` }] },
                        ]}
                      />
                    );
                  })}

                  {/* Center Circle */}
                  <View style={styles.wheelCenter}>
                    <Text style={styles.wheelCenterText}>🍽️</Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Spin Button or Result */}
            {!wheelResult ? (
              <TouchableOpacity
                style={styles.spinButton}
                onPress={spinTheWheel}
                disabled={
                  wheelSpinning || loadingWheel || wheelCategories.length === 0
                }
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    wheelSpinning || loadingWheel
                      ? ["#666", "#444"]
                      : ["#F59E0B", "#EF4444"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.spinButtonGradient}
                >
                  {wheelSpinning ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.spinButtonTextSmall}>
                        Spinning...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.spinButtonText}>SPIN!</Text>
                      <Text style={styles.spinButtonEmoji}>🎰</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : selectedSegment !== null ? (
              <Animated.View
                style={[
                  styles.wheelResultContainer,
                  {
                    transform: [{ scale: resultScale }],
                    opacity: resultOpacity,
                  },
                ]}
              >
                <Text style={styles.wheelWinText}>🎉 YOU WON! 🎉</Text>

                {/* Selected Category Badge */}
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor:
                        wheelColors[selectedSegment % wheelColors.length],
                    },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>
                    {wheelCategories[selectedSegment]?.category.name}
                  </Text>
                </View>

                {wheelResult ? (
                  <>
                    {/* Result Recipe Card */}
                    <View style={styles.wheelResultCard}>
                      <LinearGradient
                        colors={["#F59E0B", "#EF4444"]}
                        style={styles.wheelResultBorder}
                      >
                        <View style={styles.wheelResultInner}>
                          <Image
                            source={{
                              uri:
                                getImageUrl(wheelResult.image) ||
                                "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=600&q=80",
                            }}
                            style={styles.wheelResultImage}
                          />
                          <View style={styles.wheelResultInfo}>
                            <Text
                              style={styles.wheelResultName}
                              numberOfLines={2}
                            >
                              {wheelResult.name}
                            </Text>
                            <View style={styles.wheelResultStats}>
                              {wheelResult.calories ? (
                                <View style={styles.wheelResultStat}>
                                  <Ionicons
                                    name="flame"
                                    size={14}
                                    color="#FF6B6B"
                                  />
                                  <Text style={styles.wheelResultStatText}>
                                    {wheelResult.calories}
                                  </Text>
                                </View>
                              ) : null}
                              <View style={styles.wheelResultStat}>
                                <Ionicons
                                  name="heart"
                                  size={14}
                                  color="#FF0055"
                                />
                                <Text style={styles.wheelResultStatText}>
                                  {wheelResult.likes?.length || 0}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>

                    {/* View Recipe Button */}
                    <TouchableOpacity
                      style={styles.viewWheelRecipeBtn}
                      onPress={viewWheelRecipe}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#00FFFF", "#FF00FF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.viewWheelRecipeGradient}
                      >
                        <Text style={styles.viewWheelRecipeText}>
                          View Recipe 🍳
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.noRecipeContainer}>
                    <Ionicons name="sad-outline" size={50} color="#666" />
                    <Text style={styles.noRecipeText}>
                      No recipe found in this category
                    </Text>
                    <Text style={styles.noRecipeSubtext}>
                      Try spinning again!
                    </Text>
                  </View>
                )}

                {/* Spin Again */}
                <TouchableOpacity
                  style={styles.spinAgainBtn}
                  onPress={() => {
                    setWheelResult(null);
                    setShowConfetti(false);
                    setSelectedSegment(null);
                    wheelRotation.setValue(0);
                    resultScale.setValue(0);
                    resultOpacity.setValue(0);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={18} color="#F59E0B" />
                  <Text style={styles.spinAgainText}>Spin Again</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
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
    opacity: 0.2,
    zIndex: 0,
    transform: [{ scale: 1.5 }],
  },
  scrollContent: {
    paddingBottom: 100,
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
    overflow: "hidden",
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    resizeMode: "cover",
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
    borderWidth: 0,
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
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 15,
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
  // Random Recipe Button
  randomButtonContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  randomButtonGradient: {
    borderRadius: 20,
    padding: 2,
  },
  randomButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 15,
  },
  randomIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  randomTextContainer: {
    justifyContent: "center",
  },
  randomButtonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  randomButtonSubtitle: {
    fontSize: 12,
    color: "#06B6D4",
    fontWeight: "600",
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  recipeCount: {
    color: "#888",
    fontSize: 14,
  },
  loadingFeatured: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingFeaturedText: {
    color: "#666",
    marginTop: 10,
    fontSize: 14,
  },
  emptyFeatured: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#666",
    marginTop: 10,
    fontSize: 14,
  },
  // Top Users Styles
  topUsersScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 10,
  },
  topUserCard: {
    width: 100,
  },
  topUserCardBorder: {
    borderRadius: 16,
    padding: 2,
  },
  topUserCardInner: {
    backgroundColor: "#0A0A1A",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    position: "relative",
  },
  rankBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
    zIndex: 1,
  },
  rankBadgeGold: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  rankBadgeSilver: {
    borderColor: "#C0C0C0",
    backgroundColor: "rgba(192, 192, 192, 0.2)",
  },
  rankBadgeBronze: {
    borderColor: "#CD7F32",
    backgroundColor: "rgba(205, 127, 50, 0.2)",
  },
  rankNumber: {
    color: "#888",
    fontSize: 10,
    fontWeight: "bold",
  },
  topUserImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  topUserImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  topUserPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  topUserName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  topUserFollowers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  topUserFollowersText: {
    color: "#00FFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  featuredScrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  featuredCardWrapper: {
    width: 280,
    height: 200,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  featuredCardBorder: {
    flex: 1,
    borderRadius: 20,
    padding: 2,
  },
  featuredInnerCard: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  featuredCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute",
  },
  featuredCardOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 15,
  },
  featuredStatsBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  featuredCardContent: {
    gap: 6,
  },
  featuredCardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredCardDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
  },
  featuredCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  authorText: {
    color: "#888",
    fontSize: 12,
  },
  dateText: {
    color: "#00FFFF",
    fontSize: 11,
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
    padding: 2,
  },
  innerCard: {
    height: 220,
    borderRadius: 23,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    marginBottom: 30,
  },
  spinnerGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    textShadowColor: "rgba(139, 92, 246, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  revealContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  sparkleContainer: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    height: 150,
  },
  sparkle1: {
    position: "absolute",
    top: 20,
    left: 40,
  },
  sparkle2: {
    position: "absolute",
    top: 60,
    right: 50,
  },
  sparkle3: {
    position: "absolute",
    top: 100,
    left: 60,
  },
  sparkle4: {
    position: "absolute",
    top: 40,
    right: 80,
  },
  surpriseText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 25,
    textShadowColor: "rgba(255, 215, 0, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
  },
  revealCard: {
    width: width - 60,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    marginBottom: 25,
  },
  revealCardBorder: {
    borderRadius: 25,
    padding: 3,
  },
  revealCardInner: {
    height: 280,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
  },
  revealImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  revealOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 20,
  },
  revealRecipeName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textShadowColor: "rgba(0, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  revealStats: {
    flexDirection: "row",
    gap: 15,
    flexWrap: "wrap",
  },
  revealStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  revealStatText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  viewRecipeButton: {
    marginBottom: 15,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  viewRecipeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 30,
  },
  viewRecipeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  tryAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  tryAgainText: {
    color: "#00FFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Daily Wheel Button Styles
  wheelButtonContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wheelButtonGradient: {
    borderRadius: 20,
    padding: 2,
  },
  wheelButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 15,
  },
  wheelIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  wheelTextContainer: {
    justifyContent: "center",
  },
  wheelButtonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  wheelButtonSubtitle: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "600",
  },
  // Daily Wheel Modal Styles
  wheelModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelCloseButton: {
    position: "absolute",
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  wheelContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  wheelTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "rgba(255, 215, 0, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  wheelSubtitle: {
    fontSize: 16,
    color: "#AAAAAA",
    marginBottom: 30,
  },
  wheelWrapper: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  wheelPointer: {
    position: "absolute",
    top: 5,
    zIndex: 20,
    alignItems: "center",
  },
  pointerArrow: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  wheelLoading: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(26, 26, 46, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#FFD700",
  },
  wheelLoadingText: {
    color: "#AAAAAA",
    marginTop: 15,
    fontSize: 14,
  },
  wheel: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#12121f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  wheelSegmentCard: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 55,
    maxWidth: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  wheelSegmentText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    textTransform: "uppercase",
  },
  wheelLine: {
    position: "absolute",
    width: 2,
    height: 130,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    top: 0,
    transformOrigin: "center bottom",
  },
  wheelCenter: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    zIndex: 10,
  },
  wheelCenterText: {
    fontSize: 28,
  },
  spinButton: {
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  spinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
  },
  spinButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  spinButtonTextSmall: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  spinButtonEmoji: {
    fontSize: 24,
  },
  wheelResultContainer: {
    alignItems: "center",
    width: "100%",
  },
  wheelWinText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
    textShadowColor: "rgba(255, 215, 0, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noRecipeContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noRecipeText: {
    color: "#AAAAAA",
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  noRecipeSubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 5,
  },
  wheelResultCard: {
    width: width - 80,
    marginBottom: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  wheelResultBorder: {
    borderRadius: 20,
    padding: 2,
  },
  wheelResultInner: {
    flexDirection: "row",
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    overflow: "hidden",
    height: 100,
  },
  wheelResultImage: {
    width: 100,
    height: "100%",
  },
  wheelResultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  wheelResultName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  wheelResultStats: {
    flexDirection: "row",
    gap: 12,
  },
  wheelResultStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  wheelResultStatText: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  viewWheelRecipeBtn: {
    marginBottom: 15,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  viewWheelRecipeGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  viewWheelRecipeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  spinAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  spinAgainText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "600",
  },
  confetti: {
    position: "absolute",
    fontSize: 20,
    top: 0,
  },
});
