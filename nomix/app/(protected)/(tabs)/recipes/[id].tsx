import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
  Easing,
  Dimensions,
  FlatList,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import {
  getRecipeById,
  toggleLikeRecipe,
  addComment,
  deleteComment,
  deleteRecipe,
  getAllRecipes,
  toggleLikeComment,
  addReplyToComment,
  toggleLikeReply,
} from "../../../../api/recipes";
import { getImageUrl } from "../../../../api/index";
import { getUserById, toggleFavorite } from "../../../../api/auth";
import { Recipe, Comment, Reply } from "../../../../types/Recipe";
import Logo from "../../../../components/Logo";
import ReportModal from "../../../../components/ReportModal";

interface AuthorStats {
  recipesCount: number;
  followersCount: number;
}

const RecipeDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [authorStats, setAuthorStats] = useState<AuthorStats>({
    recipesCount: 0,
    followersCount: 0,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingComment, setReportingComment] = useState<{
    id: string;
    text: string;
    userId: string;
    username: string;
  } | null>(null);

  // Delete modal animation refs
  const deleteModalScale = useRef(new Animated.Value(0.5)).current;
  const deleteModalOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Check if current user is the owner of the recipe
  const isOwner = recipe?.userId
    ? typeof recipe.userId === "string"
      ? recipe.userId === user?._id
      : (recipe.userId as any)?._id === user?._id
    : false;

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      try {
        const data = await getRecipeById(id);
        setRecipe(data);

        // Fetch author stats
        if (data.userId && typeof data.userId === "object") {
          const authorId = (data.userId as any)._id;

          // Get author's user data for followers
          const authorResponse = await getUserById(authorId);
          const followersCount = authorResponse?.data?.followers?.length || 0;

          // Get author's recipes count
          const allRecipes = await getAllRecipes();
          const authorRecipes = allRecipes.filter((r: Recipe) => {
            const recipeUserId =
              typeof r.userId === "string" ? r.userId : r.userId?._id;
            return recipeUserId === authorId;
          });

          setAuthorStats({
            recipesCount: authorRecipes.length,
            followersCount: followersCount,
          });
        }

        // Check if recipe is in user's favorites
        if (user?._id) {
          const userResponse = await getUserById(user._id);
          if (
            userResponse &&
            userResponse.success &&
            userResponse.data.favorites
          ) {
            const favoriteIds = userResponse.data.favorites.map((fav: any) =>
              typeof fav === "string" ? fav : fav._id
            );
            setIsFavorite(favoriteIds.includes(id));
          }
        }
      } catch (error) {
        console.error("Failed to load recipe", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, user?._id]);

  const handleLike = async () => {
    if (!id || likeLoading) return;
    setLikeLoading(true);
    try {
      const result = await toggleLikeRecipe(id);
      setRecipe(result.recipe);
    } catch (error) {
      console.error("Failed to toggle like", error);
      Alert.alert("Error", "Failed to update like. Please try again.");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!id || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const result = await toggleFavorite(id);
      if (result.success) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      Alert.alert("Error", "Failed to update favorites. Please try again.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const updatedRecipe = await addComment(id, commentText.trim());
      setRecipe(updatedRecipe);
      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedRecipe = await deleteComment(id, commentId);
              setRecipe(updatedRecipe);
            } catch (error) {
              console.error("Failed to delete comment", error);
              Alert.alert(
                "Error",
                "Failed to delete comment. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Handle like comment
  const handleLikeComment = async (commentId: string) => {
    if (!id) return;
    try {
      const { recipe: updatedRecipe } = await toggleLikeComment(id, commentId);
      setRecipe(updatedRecipe);
    } catch (error) {
      console.error("Failed to like comment", error);
    }
  };

  // Handle add reply
  const handleAddReply = async (commentId: string) => {
    if (!id || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const updatedRecipe = await addReplyToComment(
        id,
        commentId,
        replyText.trim()
      );
      setRecipe(updatedRecipe);
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to add reply", error);
      Alert.alert("Error", "Failed to add reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  };

  // Handle like reply
  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!id) return;
    try {
      const { recipe: updatedRecipe } = await toggleLikeReply(
        id,
        commentId,
        replyId
      );
      setRecipe(updatedRecipe);
    } catch (error) {
      console.error("Failed to like reply", error);
    }
  };

  // Toggle expanded replies for a comment
  const toggleReplies = (commentId: string) => {
    setExpandedComments((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleEdit = () => {
    if (!id) return;
    router.push(`/(protected)/myRecipes/edit/${id}`);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    // Reset animations
    deleteModalScale.setValue(0.5);
    deleteModalOpacity.setValue(0);
    shakeAnimation.setValue(0);
    pulseAnimation.setValue(1);

    // Animate modal in
    Animated.parallel([
      Animated.spring(deleteModalScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(deleteModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start shake animation for warning icon
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for delete button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const closeDeleteModal = () => {
    Animated.parallel([
      Animated.timing(deleteModalScale, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(deleteModalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDeleteModal(false);
    });
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await deleteRecipe(id);
      closeDeleteModal();
      // Small delay before navigating back
      setTimeout(() => {
        router.back();
      }, 200);
    } catch (error: any) {
      console.error("Failed to delete recipe", error);
      const msg =
        error.response?.data?.message ||
        "Failed to delete recipe. Please try again.";
      Alert.alert("Error", msg);
      setDeleteLoading(false);
    }
  };

  const shakeInterpolate = shakeAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const isLiked = recipe?.likes?.includes(user?._id || "");
  const likesCount = recipe?.likes?.length || 0;

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF0055" />
        <Text style={styles.errorText}>Recipe not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get all images (support both images array and legacy single image)
  const recipeImages =
    recipe.images && recipe.images.length > 0
      ? recipe.images
          .map((img) => getImageUrl(img))
          .filter((url): url is string => url !== null)
      : recipe.image
      ? [getImageUrl(recipe.image) || "https://via.placeholder.com/400"]
      : ["https://via.placeholder.com/400"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header Image Carousel */}
      <View style={styles.imageContainer}>
        <FlatList
          data={recipeImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH
            );
            setCurrentImageIndex(index);
          }}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={[styles.heroImage, { width: SCREEN_WIDTH }]}
            />
          )}
          keyExtractor={(item, index) => `image-${index}`}
        />
        <LinearGradient
          colors={["transparent", "#050510"]}
          style={styles.imageGradient}
        />

        {/* Image Pagination Dots */}
        {recipeImages.length > 1 && (
          <View style={styles.paginationContainer}>
            {recipeImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.paginationDotActive,
                ]}
              />
            ))}
            <Text style={styles.paginationText}>
              {currentImageIndex + 1}/{recipeImages.length}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Action Buttons on Image */}
        <View style={[styles.actionButtonsContainer, { top: insets.top + 10 }]}>
          {/* Owner Actions: Edit & Delete */}
          {isOwner && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEdit}
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={openDeleteModal}
              >
                <Ionicons name="trash" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator size="small" color="#00FFFF" />
            ) : (
              <Ionicons
                name={isFavorite ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isFavorite ? "#00FFFF" : "#FFFFFF"}
              />
            )}
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            disabled={likeLoading}
          >
            {likeLoading ? (
              <ActivityIndicator size="small" color="#FF0055" />
            ) : (
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#FF0055" : "#FFFFFF"}
              />
            )}
          </TouchableOpacity>

          {/* Report Button - only show if not owner */}
          {!isOwner && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reportButton]}
              onPress={() => setShowReportModal(true)}
            >
              <Ionicons name="flag" size={20} color="#FF0055" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title and Likes */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isRTL && { textAlign: "right" }, { flex: 1 }]}
          >
            {recipe.name}
          </Text>
        </View>

        {/* Social Stats */}
        <View
          style={[
            styles.socialStats,
            isRTL && { flexDirection: "row-reverse" },
          ]}
        >
          <TouchableOpacity style={styles.statItem} onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "#FF0055" : "#888"}
            />
            <Text style={[styles.statText, isLiked && { color: "#FF0055" }]}>
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={20} color="#888" />
            <Text style={styles.statText}>
              {recipe.comments?.length || 0} comments
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={20} color="#888" />
            <Text style={styles.statText}>{recipe.views || 0} views</Text>
          </View>
        </View>

        {/* Categories */}
        {Array.isArray(recipe.category) && recipe.category.length > 0 && (
          <View
            style={[styles.tagsRow, isRTL && { flexDirection: "row-reverse" }]}
          >
            {recipe.category.map((cat: any, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>
                  {typeof cat === "string" ? cat : cat.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Nutrition Info */}
        {(recipe.calories ||
          recipe.protein ||
          recipe.carbohydrates ||
          recipe.fat) && (
          <View style={styles.nutritionCard}>
            <Text style={styles.sectionTitle}>Nutrition</Text>
            <View
              style={[
                styles.nutritionGrid,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              {recipe.calories ? (
                <View style={styles.nutritionItem}>
                  <Ionicons name="flame" size={20} color="#FF6B6B" />
                  <Text style={styles.nutritionValue}>{recipe.calories}</Text>
                  <Text style={styles.nutritionLabel}>kcal</Text>
                </View>
              ) : null}
              {recipe.protein ? (
                <View style={styles.nutritionItem}>
                  <Ionicons name="fitness" size={20} color="#4ECDC4" />
                  <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              ) : null}
              {recipe.carbohydrates ? (
                <View style={styles.nutritionItem}>
                  <Ionicons name="nutrition" size={20} color="#FFE66D" />
                  <Text style={styles.nutritionValue}>
                    {recipe.carbohydrates}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              ) : null}
              {recipe.fat ? (
                <View style={styles.nutritionItem}>
                  <Ionicons name="water" size={20} color="#A78BFA" />
                  <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Ingredients */}
        {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}
            >
              Ingredients
            </Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ing: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.ingredientItem,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <View style={styles.ingredientBullet} />
                  <Text
                    style={[
                      styles.ingredientText,
                      isRTL && { textAlign: "right" },
                    ]}
                  >
                    {typeof ing === "string" ? ing : ing.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {Array.isArray(recipe.instructions) &&
          recipe.instructions.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}
              >
                Instructions
              </Text>
              <View style={styles.instructionsList}>
                {recipe.instructions.map((step: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.instructionItem,
                      isRTL && { flexDirection: "row-reverse" },
                    ]}
                  >
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text
                      style={[
                        styles.instructionText,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Author */}
        {recipe.userId && typeof recipe.userId === "object" && (
          <TouchableOpacity
            style={styles.authorSection}
            activeOpacity={0.8}
            onPress={() => router.push(`/users/${(recipe.userId as any)._id}`)}
          >
            <Text style={styles.authorLabel}>Recipe by</Text>
            <View style={styles.authorCard}>
              <View style={styles.authorAvatar}>
                {(recipe.userId as any).profilePicture ||
                (recipe.userId as any).image ? (
                  <Image
                    source={{
                      uri:
                        getImageUrl(
                          (recipe.userId as any).profilePicture ||
                            (recipe.userId as any).image
                        ) || "",
                    }}
                    style={styles.authorAvatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={28} color="#00FFFF" />
                )}
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>
                  {(recipe.userId as any).username || "Unknown Chef"}
                </Text>
                <View style={styles.authorStatsRow}>
                  <View style={styles.authorStatItem}>
                    <Ionicons name="book" size={14} color="#00FFFF" />
                    <Text style={styles.authorStatText}>
                      {authorStats.recipesCount} recipes
                    </Text>
                  </View>
                  <View style={styles.authorStatItem}>
                    <Ionicons name="people" size={14} color="#FF00FF" />
                    <Text style={styles.authorStatText}>
                      {authorStats.followersCount} followers
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#00FFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
            Comments ({recipe.comments?.length || 0})
          </Text>

          {/* Add Comment Input */}
          <View
            style={[
              styles.addCommentContainer,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TextInput
              style={[styles.commentInput, isRTL && { textAlign: "right" }]}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || commentLoading}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() ? "#000" : "#666"}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {recipe.comments && recipe.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {recipe.comments.map((comment: Comment) => {
                const commentUser =
                  typeof comment.user === "object" ? comment.user : null;
                const isOwnComment = commentUser?._id === user?._id;
                const userImage =
                  commentUser?.image || commentUser?.profilePicture;
                const isLiked = comment.likes?.includes(user?._id || "");
                const hasReplies =
                  comment.replies && comment.replies.length > 0;
                const isExpanded = expandedComments.includes(comment._id);
                const isReplying = replyingTo === comment._id;

                return (
                  <View key={comment._id} style={styles.commentItem}>
                    {/* Comment Header */}
                    <View
                      style={[
                        styles.commentHeader,
                        isRTL && { flexDirection: "row-reverse" },
                      ]}
                    >
                      <View style={styles.commentAvatar}>
                        {userImage ? (
                          <Image
                            source={{
                              uri: getImageUrl(userImage) || "",
                            }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Ionicons name="person" size={20} color="#00FFFF" />
                        )}
                      </View>
                      <View
                        style={[
                          styles.commentInfo,
                          isRTL && { alignItems: "flex-end" },
                        ]}
                      >
                        <Text style={styles.commentUsername}>
                          {commentUser?.username || "Anonymous"}
                        </Text>
                        <Text style={styles.commentDate}>
                          {formatDate(comment.createdAt)}
                        </Text>
                      </View>
                      {isOwnComment ? (
                        <TouchableOpacity
                          style={styles.deleteCommentBtn}
                          onPress={() => handleDeleteComment(comment._id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#FF0055"
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.reportCommentBtn}
                          onPress={() =>
                            setReportingComment({
                              id: comment._id,
                              text: comment.text,
                              userId: commentUser?._id || "",
                              username: commentUser?.username || "Unknown",
                            })
                          }
                        >
                          <Ionicons
                            name="flag-outline"
                            size={16}
                            color="#FF0055"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Comment Text */}
                    <Text
                      style={[
                        styles.commentText,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {comment.text}
                    </Text>

                    {/* Comment Actions */}
                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => handleLikeComment(comment._id)}
                      >
                        <Ionicons
                          name={isLiked ? "heart" : "heart-outline"}
                          size={18}
                          color={isLiked ? "#FF0055" : "#888"}
                        />
                        <Text
                          style={[
                            styles.commentActionText,
                            isLiked && styles.commentActionTextLiked,
                          ]}
                        >
                          {comment.likes?.length || 0}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() =>
                          setReplyingTo(isReplying ? null : comment._id)
                        }
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={16}
                          color={isReplying ? "#00FFFF" : "#888"}
                        />
                        <Text
                          style={[
                            styles.commentActionText,
                            isReplying && { color: "#00FFFF" },
                          ]}
                        >
                          Reply
                        </Text>
                      </TouchableOpacity>

                      {hasReplies && (
                        <TouchableOpacity
                          style={styles.commentActionBtn}
                          onPress={() => toggleReplies(comment._id)}
                        >
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#888"
                          />
                          <Text style={styles.commentActionText}>
                            {comment.replies.length} replies
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Reply Input */}
                    {isReplying && (
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder={`Reply to ${
                            commentUser?.username || "user"
                          }...`}
                          placeholderTextColor="#666"
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                          maxLength={300}
                        />
                        <View style={styles.replyButtonsRow}>
                          <TouchableOpacity
                            style={styles.cancelReplyBtn}
                            onPress={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                          >
                            <Text style={styles.cancelReplyText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.sendReplyBtn,
                              !replyText.trim() && styles.sendReplyBtnDisabled,
                            ]}
                            onPress={() => handleAddReply(comment._id)}
                            disabled={!replyText.trim() || replyLoading}
                          >
                            {replyLoading ? (
                              <ActivityIndicator size="small" color="#000" />
                            ) : (
                              <Text
                                style={[
                                  styles.sendReplyText,
                                  !replyText.trim() &&
                                    styles.sendReplyTextDisabled,
                                ]}
                              >
                                Reply
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Replies List */}
                    {hasReplies && isExpanded && (
                      <View style={styles.repliesList}>
                        {comment.replies.map((reply: Reply) => {
                          const replyUser =
                            typeof reply.user === "object" ? reply.user : null;
                          const replyUserImage =
                            replyUser?.image || replyUser?.profilePicture;
                          const isReplyLiked = reply.likes?.includes(
                            user?._id || ""
                          );

                          return (
                            <View key={reply._id} style={styles.replyItem}>
                              <View style={styles.replyHeader}>
                                <View style={styles.replyAvatar}>
                                  {replyUserImage ? (
                                    <Image
                                      source={{
                                        uri: getImageUrl(replyUserImage) || "",
                                      }}
                                      style={styles.replyAvatarImage}
                                    />
                                  ) : (
                                    <Ionicons
                                      name="person"
                                      size={14}
                                      color="#00FFFF"
                                    />
                                  )}
                                </View>
                                <View style={styles.replyInfo}>
                                  <Text style={styles.replyUsername}>
                                    {replyUser?.username || "Anonymous"}
                                  </Text>
                                  <Text style={styles.replyDate}>
                                    {formatDate(reply.createdAt)}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.replyText}>{reply.text}</Text>
                              <TouchableOpacity
                                style={styles.replyLikeBtn}
                                onPress={() =>
                                  handleLikeReply(comment._id, reply._id)
                                }
                              >
                                <Ionicons
                                  name={
                                    isReplyLiked ? "heart" : "heart-outline"
                                  }
                                  size={14}
                                  color={isReplyLiked ? "#FF0055" : "#666"}
                                />
                                <Text
                                  style={[
                                    styles.replyLikeText,
                                    isReplyLiked && { color: "#FF0055" },
                                  ]}
                                >
                                  {reply.likes?.length || 0}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noComments}>
              <Ionicons name="chatbubble-outline" size={40} color="#333" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSubtext}>
                Be the first to comment!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Delete Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="none"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.deleteModalOverlay}>
          <Animated.View
            style={[
              styles.deleteModalContainer,
              {
                transform: [{ scale: deleteModalScale }],
                opacity: deleteModalOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={["#FF0055", "#FF4444"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.deleteModalBorder}
            >
              <View style={styles.deleteModalContent}>
                {/* Warning Icon with Shake */}
                <Animated.View
                  style={[
                    styles.deleteIconContainer,
                    { transform: [{ rotate: shakeInterpolate }] },
                  ]}
                >
                  <LinearGradient
                    colors={["#FF0055", "#FF4444"]}
                    style={styles.deleteIconGradient}
                  >
                    <Ionicons name="warning" size={40} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Text style={styles.deleteModalTitle}>Delete Recipe?</Text>

                {/* Message */}
                <Text style={styles.deleteModalMessage}>
                  This action cannot be undone. Your recipe will be permanently
                  removed.
                </Text>

                {/* Recipe Name Preview */}
                <View style={styles.deleteRecipePreview}>
                  <Ionicons name="restaurant" size={18} color="#FF0055" />
                  <Text style={styles.deleteRecipeName} numberOfLines={1}>
                    {recipe?.name}
                  </Text>
                </View>

                {/* Buttons */}
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelDeleteButton}
                    onPress={closeDeleteModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelDeleteText}>Cancel</Text>
                  </TouchableOpacity>

                  <Animated.View
                    style={{ transform: [{ scale: pulseAnimation }] }}
                  >
                    <TouchableOpacity
                      style={styles.confirmDeleteButton}
                      onPress={handleConfirmDelete}
                      disabled={deleteLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#FF0055", "#FF4444"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmDeleteGradient}
                      >
                        {deleteLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="trash" size={18} color="#FFFFFF" />
                            <Text style={styles.confirmDeleteText}>Delete</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Report Recipe Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="recipe"
        targetId={id || ""}
        targetName={recipe?.name}
      />

      {/* Report Comment Modal */}
      <ReportModal
        visible={!!reportingComment}
        onClose={() => setReportingComment(null)}
        targetType="user"
        targetId={reportingComment?.userId || ""}
        targetName={`@${
          reportingComment?.username
        }'s comment: "${reportingComment?.text?.substring(0, 40)}${
          (reportingComment?.text?.length || 0) > 40 ? "..." : ""
        }"`}
      />
    </KeyboardAvoidingView>
  );
};

export default RecipeDetail;

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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 15,
  },
  backLink: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderRadius: 10,
  },
  backLinkText: {
    color: "#00FFFF",
    fontWeight: "bold",
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  paginationDotActive: {
    backgroundColor: "#00FFFF",
    width: 24,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  paginationText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonsContainer: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "rgba(0, 255, 255, 0.6)",
  },
  deleteButton: {
    backgroundColor: "rgba(255, 0, 85, 0.6)",
  },
  reportButton: {
    backgroundColor: "rgba(255, 0, 85, 0.3)",
    borderWidth: 1,
    borderColor: "#FF0055",
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  socialStats: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "#888",
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  tagText: {
    color: "#00FFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  nutritionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  nutritionItem: {
    alignItems: "center",
    gap: 5,
  },
  nutritionValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  nutritionLabel: {
    color: "#888",
    fontSize: 12,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00FFFF",
    marginBottom: 15,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00FFFF",
  },
  ingredientText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  instructionsList: {
    gap: 20,
  },
  instructionItem: {
    flexDirection: "row",
    gap: 15,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00FFFF",
  },
  stepNumberText: {
    color: "#00FFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  authorSection: {
    marginTop: 10,
    marginBottom: 25,
  },
  authorLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.25)",
  },
  authorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#00FFFF",
  },
  authorAvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 6,
  },
  authorStatsRow: {
    flexDirection: "row",
    gap: 15,
  },
  authorStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  authorStatText: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 25,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00FFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(0, 255, 255, 0.3)",
  },
  commentsList: {
    gap: 15,
  },
  commentItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  commentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  commentInfo: {
    flex: 1,
  },
  commentUsername: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  commentDate: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
  },
  deleteCommentBtn: {
    padding: 5,
  },
  reportCommentBtn: {
    padding: 5,
    opacity: 0.7,
  },
  commentText: {
    color: "#CCCCCC",
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 20,
  },
  commentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  commentActionText: {
    color: "#888",
    fontSize: 13,
  },
  commentActionTextLiked: {
    color: "#FF0055",
  },
  replyInputContainer: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
  },
  replyInput: {
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 40,
    maxHeight: 80,
  },
  replyButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  cancelReplyBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelReplyText: {
    color: "#888",
    fontSize: 13,
  },
  sendReplyBtn: {
    backgroundColor: "#00FFFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendReplyBtnDisabled: {
    backgroundColor: "#333",
  },
  sendReplyText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "600",
  },
  sendReplyTextDisabled: {
    color: "#666",
  },
  repliesList: {
    marginTop: 12,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0, 255, 255, 0.2)",
  },
  replyItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    overflow: "hidden",
  },
  replyAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  replyInfo: {
    flex: 1,
  },
  replyUsername: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  replyDate: {
    color: "#666",
    fontSize: 10,
  },
  replyText: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  replyLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyLikeText: {
    color: "#666",
    fontSize: 11,
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noCommentsText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
  noCommentsSubtext: {
    color: "#444",
    fontSize: 14,
    marginTop: 5,
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContainer: {
    width: "100%",
    maxWidth: 340,
  },
  deleteModalBorder: {
    borderRadius: 24,
    padding: 2,
  },
  deleteModalContent: {
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    padding: 25,
    alignItems: "center",
  },
  deleteIconContainer: {
    marginBottom: 20,
  },
  deleteIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteModalMessage: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteRecipePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.2)",
    maxWidth: "100%",
  },
  deleteRecipeName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelDeleteButton: {
    flex: 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelDeleteText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmDeleteButton: {
    flex: 1.2,
  },
  confirmDeleteGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
