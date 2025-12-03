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
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  getRecipeById,
  toggleLikeRecipe,
  addComment,
  deleteComment,
} from "../../../api/recipes";
import { getImageUrl } from "../../../api/index";
import { getUserById, toggleFavorite } from "../../../api/auth";
import { Recipe, Comment } from "../../../types/Recipe";
import Logo from "../../../components/Logo";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      try {
        const data = await getRecipeById(id);
        setRecipe(data);

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

  const imageUrl =
    getImageUrl(recipe.image) || "https://via.placeholder.com/400";

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

      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        <LinearGradient
          colors={["transparent", "#050510"]}
          style={styles.imageGradient}
        />
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
              {recipe.calories && (
                <View style={styles.nutritionItem}>
                  <Ionicons name="flame" size={20} color="#FF6B6B" />
                  <Text style={styles.nutritionValue}>{recipe.calories}</Text>
                  <Text style={styles.nutritionLabel}>kcal</Text>
                </View>
              )}
              {recipe.protein && (
                <View style={styles.nutritionItem}>
                  <Ionicons name="fitness" size={20} color="#4ECDC4" />
                  <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              )}
              {recipe.carbohydrates && (
                <View style={styles.nutritionItem}>
                  <Ionicons name="nutrition" size={20} color="#FFE66D" />
                  <Text style={styles.nutritionValue}>
                    {recipe.carbohydrates}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              )}
              {recipe.fat && (
                <View style={styles.nutritionItem}>
                  <Ionicons name="water" size={20} color="#A78BFA" />
                  <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              )}
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
          <View style={styles.authorSection}>
            <Text style={styles.authorLabel}>Recipe by</Text>
            <Text style={styles.authorName}>
              {(recipe.userId as any).username || "Unknown Chef"}
            </Text>
          </View>
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
                // Check for both possible image field names
                const userImage =
                  commentUser?.image || commentUser?.profilePicture;

                return (
                  <View key={comment._id} style={styles.commentItem}>
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
                      {isOwnComment && (
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
                      )}
                    </View>
                    <Text
                      style={[
                        styles.commentText,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {comment.text}
                    </Text>
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
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 10,
    marginBottom: 25,
  },
  authorLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Comments Section
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
  commentText: {
    color: "#CCCCCC",
    fontSize: 14,
    lineHeight: 20,
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
});
