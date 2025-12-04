import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";

const { width, height } = Dimensions.get("window");
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../../../../context/LanguageContext";
import {
  getRecipeById,
  updateRecipe,
  addImagesToRecipe,
  removeImageFromRecipe,
} from "../../../../api/recipes";
import { getAllCategories, createCategory } from "../../../../api/categories";
import {
  getAllIngredients,
  createIngredient,
} from "../../../../api/ingredients";
import { getImageUrl } from "../../../../api/index";
import { Category } from "../../../../types/Category";
import { Ingredient, Recipe } from "../../../../types/Recipe";

const EditRecipe = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]); // Current images (URLs or local URIs)
  const [originalImages, setOriginalImages] = useState<string[]>([]); // Original server images
  const [newImages, setNewImages] = useState<string[]>([]); // Newly added local images
  const [removedImages, setRemovedImages] = useState<string[]>([]); // Images to remove
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  // Data sources
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);

  // Selections (IDs)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Instructions (Text)
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState("");

  // Search states for ingredients
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);

  // Category modal states
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Animation refs for success modal
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalScale = useRef(new Animated.Value(0.5)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  // Show success animation
  const showSuccessAnimation = () => {
    setShowSuccessModal(true);

    // Reset animations
    successModalOpacity.setValue(0);
    successModalScale.setValue(0.5);
    checkmarkScale.setValue(0);
    checkmarkRotate.setValue(0);
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);
    buttonOpacity.setValue(0);

    // Animate modal in
    Animated.parallel([
      Animated.timing(successModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(successModalScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate checkmark
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkRotate, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger text animations
      Animated.stagger(150, [
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start confetti
      startConfetti();
    });
  };

  // Confetti animation
  const startConfetti = () => {
    confettiAnims.forEach((anim, index) => {
      const randomX = (Math.random() - 0.5) * width;
      const randomDelay = Math.random() * 300;

      anim.translateY.setValue(-100);
      anim.translateX.setValue(randomX);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);
      anim.scale.setValue(0.5 + Math.random() * 0.5);

      Animated.sequence([
        Animated.delay(randomDelay),
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: height + 100,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: randomX + (Math.random() - 0.5) * 150,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: Math.random() * 8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(1200),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  };

  // Close success modal
  const closeSuccessModal = () => {
    Animated.parallel([
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalScale, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      router.back();
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [recipe, categories, ingredients] = await Promise.all([
          getRecipeById(id),
          getAllCategories(),
          getAllIngredients(),
        ]);

        setAvailableCategories(categories || []);
        setAvailableIngredients(ingredients || []);

        // Populate form with recipe data
        setName(recipe.name || "");
        setDescription(recipe.description || "");

        // Handle multiple images
        if (recipe.images && recipe.images.length > 0) {
          const imageUrls = recipe.images
            .map((img: string) => getImageUrl(img))
            .filter((url): url is string => url !== null);
          setImages(imageUrls);
          setOriginalImages(recipe.images);
        } else if (recipe.image) {
          // Fallback for single image (legacy)
          const imageUrl = getImageUrl(recipe.image);
          setImages(imageUrl ? [imageUrl] : []);
          setOriginalImages(recipe.image ? [recipe.image] : []);
        }

        setCalories(recipe.calories?.toString() || "");
        setProtein(recipe.protein?.toString() || "");
        setFat(recipe.fat?.toString() || "");
        setCarbs(recipe.carbohydrates?.toString() || "");

        // Set selected categories
        if (recipe.category && Array.isArray(recipe.category)) {
          const categoryIds = recipe.category.map((cat: any) =>
            typeof cat === "string" ? cat : cat._id
          );
          setSelectedCategories(categoryIds);
        }

        // Set selected ingredients
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          const ingredientIds = recipe.ingredients.map((ing: any) =>
            typeof ing === "string" ? ing : ing._id
          );
          setSelectedIngredients(ingredientIds);
        }

        // Set instructions
        if (recipe.instructions && Array.isArray(recipe.instructions)) {
          setInstructionsList(recipe.instructions);
        }
      } catch (error) {
        console.error("Failed to fetch recipe data:", error);
        Alert.alert("Error", "Failed to load recipe data");
        router.back();
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - images.length,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedImages = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...pickedImages].slice(0, 10));
        setNewImages((prev) => [...prev, ...pickedImages]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  // Fallback single image picker
  const pickSingleImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        setImages((prev) => {
          if (prev.length >= 10) return prev;
          return [...prev, newUri];
        });
        setNewImages((prev) => [...prev, newUri]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];

    // Check if it's an original image (server URL) or a new local image
    const isOriginal = originalImages.some(
      (orig) => getImageUrl(orig) === imageToRemove
    );

    if (isOriginal) {
      // Find the original path and mark for removal
      const originalPath = originalImages.find(
        (orig) => getImageUrl(orig) === imageToRemove
      );
      if (originalPath) {
        setRemovedImages((prev) => [...prev, originalPath]);
      }
    } else {
      // Remove from new images
      setNewImages((prev) => prev.filter((img) => img !== imageToRemove));
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId))
        return prev.filter((c) => c !== categoryId);
      return [...prev, categoryId];
    });
  };

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredientId))
        return prev.filter((i) => i !== ingredientId);
      return [...prev, ingredientId];
    });
  };

  const addInstruction = () => {
    if (currentInstruction.trim()) {
      setInstructionsList((prev) => [...prev, currentInstruction.trim()]);
      setCurrentInstruction("");
    }
  };

  const removeInstruction = (index: number) => {
    setInstructionsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Inline success popup state
  const [inlineSuccess, setInlineSuccess] = useState<{
    visible: boolean;
    message: string;
    type: "ingredient" | "category" | "error";
  }>({ visible: false, message: "", type: "ingredient" });
  const inlineSuccessOpacity = useRef(new Animated.Value(0)).current;
  const inlineSuccessScale = useRef(new Animated.Value(0.8)).current;

  const showInlineSuccess = (
    message: string,
    type: "ingredient" | "category" | "error"
  ) => {
    setInlineSuccess({ visible: true, message, type });
    inlineSuccessOpacity.setValue(0);
    inlineSuccessScale.setValue(0.8);

    Animated.parallel([
      Animated.timing(inlineSuccessOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(inlineSuccessScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 3 seconds for errors, 2 for success
    setTimeout(
      () => {
        Animated.timing(inlineSuccessOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setInlineSuccess((prev) => ({ ...prev, visible: false }));
        });
      },
      type === "error" ? 3000 : 2000
    );
  };

  const handleAddNewIngredient = async () => {
    if (!ingredientSearch.trim()) return;

    setIsAddingIngredient(true);
    try {
      const newIngredient = await createIngredient(ingredientSearch.trim());
      setAvailableIngredients((prev) => [...prev, newIngredient]);
      setSelectedIngredients((prev) => [...prev, newIngredient._id]);
      setIngredientSearch("");
      showInlineSuccess(`"${newIngredient.name}" added!`, "ingredient");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to create ingredient";
      Alert.alert("Error", msg);
    } finally {
      setIsAddingIngredient(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!categorySearch.trim()) return;

    setIsAddingCategory(true);
    try {
      const newCategory = await createCategory(categorySearch.trim());
      setAvailableCategories((prev) => [...prev, newCategory]);
      setSelectedCategories((prev) => [
        ...prev,
        newCategory._id || newCategory.id || "",
      ]);
      setCategorySearch("");
      showInlineSuccess(`"${newCategory.name}" added!`, "category");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create category";
      Alert.alert("Error", msg);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleUpdate = async () => {
    if (
      !name ||
      images.length === 0 ||
      instructionsList.length === 0 ||
      selectedIngredients.length === 0 ||
      selectedCategories.length === 0
    ) {
      showInlineSuccess(
        "Please fill in all required fields: Name, At least 1 Image, Categories, Ingredients, Instructions",
        "error"
      );
      return;
    }

    setIsLoading(true);
    try {
      // First, update the recipe data (without images)
      const recipeData: any = {
        name,
        description: description || undefined,
        calories: calories ? Number(calories) : undefined,
        protein: protein ? Number(protein) : undefined,
        fat: fat ? Number(fat) : undefined,
        carbohydrates: carbs ? Number(carbs) : undefined,
        ingredients: selectedIngredients,
        instructions: instructionsList,
        category: selectedCategories,
      };

      await updateRecipe(id!, recipeData);

      // Then, remove images using dedicated endpoint
      if (removedImages.length > 0) {
        for (const imageUrl of removedImages) {
          try {
            await removeImageFromRecipe(id!, imageUrl);
          } catch (err) {
            console.error("Failed to remove image:", imageUrl, err);
          }
        }
      }

      // Finally, add new images using dedicated endpoint
      if (newImages.length > 0) {
        try {
          await addImagesToRecipe(id!, newImages);
        } catch (err) {
          console.error("Failed to add new images:", err);
        }
      }

      // Show success animation instead of alert
      showSuccessAnimation();
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        "Failed to update recipe. Please try again.";
      showInlineSuccess(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    placeholder: string,
    keyboardType: "default" | "numeric" = "default"
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, isRTL && { textAlign: "right" }]}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
      />
    </View>
  );

  // Filter ingredients for picker
  const filteredIngredients = availableIngredients.filter((i) =>
    i.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Filter categories for picker
  const filteredCategories = availableCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  if (isFetching) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
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
        <Text style={styles.headerTitle}>Edit Recipe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Multiple Images Section */}
        <View style={styles.imagesSection}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Photos ({images.length}/10) *
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScrollContent}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image source={{ uri }} style={styles.multiPreviewImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(index)}
                >
                  <LinearGradient
                    colors={["#FF0055", "#FF3366"]}
                    style={styles.removeImageGradient}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.mainImageBadge}>
                    <Text style={styles.mainImageBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}
            {images.length < 10 && (
              <View style={styles.addImageButtonsContainer}>
                {/* Multi-select button */}
                <TouchableOpacity
                  onPress={pickImages}
                  style={styles.addImageBtn}
                >
                  <LinearGradient
                    colors={["rgba(0,255,255,0.1)", "rgba(255,0,255,0.1)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addImageGradient}
                  >
                    <Ionicons name="images-outline" size={36} color="#00FFFF" />
                    <Text style={styles.addImageText}>
                      {images.length === 0 ? "Select Photos *" : "Select More"}
                    </Text>
                    <Text style={styles.addImageHint}>{images.length}/10</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Single image button (fallback) */}
                <TouchableOpacity
                  onPress={pickSingleImage}
                  style={styles.addSingleImageBtn}
                >
                  <LinearGradient
                    colors={["rgba(255,0,255,0.1)", "rgba(0,255,255,0.1)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addImageGradient}
                  >
                    <Ionicons name="camera-outline" size={32} color="#FF00FF" />
                    <Text style={[styles.addImageText, { color: "#FF00FF" }]}>
                      Add One
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {renderInput("Recipe Name", name, setName, "e.g. Spicy Chicken Pasta")}

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Description
          </Text>
          <TextInput
            style={[styles.descriptionInput, isRTL && { textAlign: "right" }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your recipe... (optional)"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Categories
          </Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.selectButtonText}>+ Select Categories</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.chipContainer,
              { marginTop: 10 },
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {selectedCategories.map((categoryId) => {
              const cat = availableCategories.find(
                (c) => (c._id || c.id) === categoryId
              );
              if (!cat) return null;
              return (
                <View key={categoryId} style={styles.chip}>
                  <Text style={styles.chipText}>{cat.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleCategory(categoryId)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF0055" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Ingredient Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Ingredients
          </Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowIngredientPicker(true)}
          >
            <Text style={styles.selectButtonText}>+ Select Ingredients</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.chipContainer,
              { marginTop: 10 },
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {selectedIngredients.map((ingredientId) => {
              const ing = availableIngredients.find(
                (i) => i._id === ingredientId
              );
              if (!ing) return null;
              return (
                <View key={ingredientId} style={styles.chip}>
                  <Text style={styles.chipText}>{ing.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleIngredient(ingredientId)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF0055" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Instructions
          </Text>
          <View
            style={[
              styles.addItemContainer,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                styles.addItemInput,
                isRTL && { textAlign: "right" },
              ]}
              value={currentInstruction}
              onChangeText={setCurrentInstruction}
              placeholder="Add step..."
              placeholderTextColor="#666"
              onSubmitEditing={addInstruction}
            />
            <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10, gap: 8 }}>
            {instructionsList.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.instructionItem,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text
                  style={[
                    styles.instructionText,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  {step}
                </Text>
                <TouchableOpacity
                  onPress={() => removeInstruction(index)}
                  style={{ padding: 5 }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionHeader, isRTL && { textAlign: "right" }]}>
          Nutrition (Optional)
        </Text>
        <View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]}>
          <View
            style={{
              flex: 1,
              marginRight: isRTL ? 0 : 10,
              marginLeft: isRTL ? 10 : 0,
            }}
          >
            {renderInput("Calories", calories, setCalories, "kcal", "numeric")}
          </View>
          <View style={{ flex: 1 }}>
            {renderInput("Protein (g)", protein, setProtein, "g", "numeric")}
          </View>
        </View>
        <View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]}>
          <View
            style={{
              flex: 1,
              marginRight: isRTL ? 0 : 10,
              marginLeft: isRTL ? 10 : 0,
            }}
          >
            {renderInput("Carbs (g)", carbs, setCarbs, "g", "numeric")}
          </View>
          <View style={{ flex: 1 }}>
            {renderInput("Fat (g)", fat, setFat, "g", "numeric")}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00FFFF", "#FF00FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.updateButtonText}>Update Recipe</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Ingredient Picker Modal */}
      <Modal visible={showIngredientPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={["#10B981", "#34D399"]}
                  style={styles.modalIconBg}
                >
                  <Ionicons name="leaf" size={24} color="#FFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.modalTitle}>Select Ingredients</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedIngredients.length} selected
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowIngredientPicker(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Search & Add Row */}
            <View style={styles.searchAddRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search or add new ingredient..."
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
              <TouchableOpacity
                style={[
                  styles.addNewBtn,
                  !ingredientSearch.trim() && styles.addNewBtnDisabled,
                ]}
                onPress={handleAddNewIngredient}
                disabled={!ingredientSearch.trim() || isAddingIngredient}
              >
                {isAddingIngredient ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons
                    name="add"
                    size={24}
                    color={ingredientSearch.trim() ? "#000" : "#666"}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Ingredients List */}
            <FlatList
              data={filteredIngredients}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedIngredients.includes(item._id);

                // Helper to get ingredient icon
                const getIngredientIcon = (name: string) => {
                  const n = name.toLowerCase();
                  if (n.includes("chicken") || n.includes("poultry"))
                    return "🍗";
                  if (
                    n.includes("beef") ||
                    n.includes("steak") ||
                    n.includes("meat")
                  )
                    return "🥩";
                  if (
                    n.includes("pork") ||
                    n.includes("bacon") ||
                    n.includes("ham")
                  )
                    return "🥓";
                  if (
                    n.includes("fish") ||
                    n.includes("salmon") ||
                    n.includes("tuna")
                  )
                    return "🐟";
                  if (
                    n.includes("shrimp") ||
                    n.includes("prawn") ||
                    n.includes("seafood")
                  )
                    return "🦐";
                  if (n.includes("egg")) return "🥚";
                  if (
                    n.includes("milk") ||
                    n.includes("cream") ||
                    n.includes("yogurt")
                  )
                    return "🥛";
                  if (n.includes("cheese")) return "🧀";
                  if (n.includes("butter")) return "🧈";
                  if (n.includes("bread") || n.includes("toast")) return "🍞";
                  if (n.includes("rice")) return "🍚";
                  if (
                    n.includes("pasta") ||
                    n.includes("noodle") ||
                    n.includes("spaghetti")
                  )
                    return "🍝";
                  if (n.includes("potato") || n.includes("fries")) return "🥔";
                  if (n.includes("tomato")) return "🍅";
                  if (n.includes("carrot")) return "🥕";
                  if (n.includes("corn")) return "🌽";
                  if (
                    n.includes("lettuce") ||
                    n.includes("spinach") ||
                    n.includes("salad")
                  )
                    return "🥗";
                  if (n.includes("mushroom")) return "🍄";
                  if (n.includes("onion") || n.includes("garlic")) return "🧄";
                  if (n.includes("pepper") || n.includes("chili")) return "🌶️";
                  if (
                    n.includes("fruit") ||
                    n.includes("apple") ||
                    n.includes("banana")
                  )
                    return "🍎";
                  if (n.includes("lemon") || n.includes("lime")) return "🍋";
                  if (n.includes("sugar") || n.includes("sweet")) return "🍬";
                  if (n.includes("salt")) return "🧂";
                  if (n.includes("oil") || n.includes("sauce")) return "🍶";
                  if (n.includes("water")) return "💧";
                  if (
                    n.includes("herb") ||
                    n.includes("spice") ||
                    n.includes("basil")
                  )
                    return "🌿";
                  if (n.includes("chocolate")) return "🍫";
                  if (n.includes("cake") || n.includes("flour")) return "🍰";
                  if (n.includes("ice cream")) return "🍦";
                  if (n.includes("coffee")) return "☕";
                  if (n.includes("tea")) return "🍵";
                  if (n.includes("wine") || n.includes("alcohol")) return "🍷";
                  if (n.includes("beer")) return "🍺";
                  return "🥘"; // Default
                };

                const icon = getIngredientIcon(item.name);

                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => toggleIngredient(item._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerItemLeft}>
                      <View
                        style={[
                          styles.pickerItemIcon,
                          isSelected && styles.pickerItemIconSelected,
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{icon}</Text>
                      </View>
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pickerCheckbox,
                        isSelected && styles.pickerCheckboxSelected,
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
                <View style={styles.emptyListContainer}>
                  <Ionicons name="leaf-outline" size={50} color="#333" />
                  <Text style={styles.emptyListText}>
                    {ingredientSearch
                      ? `No results for "${ingredientSearch}"`
                      : "No ingredients available"}
                  </Text>
                  {ingredientSearch && (
                    <Text style={styles.emptyListHint}>
                      Tap + to add "{ingredientSearch}"
                    </Text>
                  )}
                </View>
              }
            />

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowIngredientPicker(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.modalDoneBtnGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.modalDoneText}>
                  Done ({selectedIngredients.length} selected)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        {/* Inline Success Popup (Ingredients) */}
        {inlineSuccess.visible && inlineSuccess.type === "ingredient" && (
          <Animated.View
            style={[
              styles.inlineSuccessContainer,
              {
                opacity: inlineSuccessOpacity,
                transform: [{ scale: inlineSuccessScale }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={["#10B981", "#34D399"]}
              style={styles.inlineSuccessGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.inlineSuccessText}>
                {inlineSuccess.message}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={["#8B5CF6", "#A78BFA"]}
                  style={styles.modalIconBg}
                >
                  <Ionicons name="grid" size={24} color="#FFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.modalTitle}>Select Categories</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedCategories.length} selected
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Search & Add Row */}
            <View style={styles.searchAddRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search or add new category..."
                  placeholderTextColor="#555"
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                />
                {categorySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCategorySearch("")}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.addNewBtn,
                  styles.addNewBtnPurple,
                  !categorySearch.trim() && styles.addNewBtnDisabled,
                ]}
                onPress={handleAddNewCategory}
                disabled={!categorySearch.trim() || isAddingCategory}
              >
                {isAddingCategory ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons
                    name="add"
                    size={24}
                    color={categorySearch.trim() ? "#000" : "#666"}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Categories List */}
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) =>
                item._id || item.id || Math.random().toString()
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const isSelected = selectedCategories.includes(
                  item._id || item.id || ""
                );
                const colors = [
                  "#FF00FF", // Neon Pink
                  "#00FFFF", // Cyan
                  "#8B5CF6", // Purple
                  "#10B981", // Emerald
                  "#F59E0B", // Amber
                  "#3B82F6", // Blue
                  "#EF4444", // Red
                  "#EC4899", // Pink
                ];
                const itemColor = colors[index % colors.length];

                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && {
                        backgroundColor: `${itemColor}20`, // 20% opacity
                        borderColor: `${itemColor}60`, // 60% opacity
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => toggleCategory(item._id || item.id || "")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerItemLeft}>
                      <View
                        style={[
                          styles.pickerItemIcon,
                          {
                            backgroundColor: isSelected
                              ? `${itemColor}30`
                              : "rgba(255, 255, 255, 0.08)",
                          },
                        ]}
                      >
                        <Ionicons
                          name="grid-outline"
                          size={18}
                          color={isSelected ? itemColor : itemColor}
                        />
                      </View>
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && {
                            color: "#FFF",
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pickerCheckbox,
                        isSelected && {
                          backgroundColor: itemColor,
                          borderColor: itemColor,
                        },
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
                <View style={styles.emptyListContainer}>
                  <Ionicons name="grid-outline" size={50} color="#333" />
                  <Text style={styles.emptyListText}>
                    {categorySearch
                      ? `No results for "${categorySearch}"`
                      : "No categories available"}
                  </Text>
                  {categorySearch && (
                    <Text style={styles.emptyListHint}>
                      Tap + to add "{categorySearch}"
                    </Text>
                  )}
                </View>
              }
            />

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowCategoryPicker(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                style={styles.modalDoneBtnGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.modalDoneText}>
                  Done ({selectedCategories.length} selected)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        {/* Inline Success Popup (Categories) */}
        {inlineSuccess.visible && inlineSuccess.type === "category" && (
          <Animated.View
            style={[
              styles.inlineSuccessContainer,
              {
                opacity: inlineSuccessOpacity,
                transform: [{ scale: inlineSuccessScale }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={["#8B5CF6", "#A78BFA"]}
              style={styles.inlineSuccessGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.inlineSuccessText}>
                {inlineSuccess.message}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={closeSuccessModal}
      >
        <Animated.View
          style={[styles.successModalOverlay, { opacity: successModalOpacity }]}
        >
          {/* Confetti */}
          {confettiAnims.map((anim, index) => {
            const shapes = ["🎉", "🎊", "✨", "⭐", "🌟", "💫"];
            return (
              <Animated.Text
                key={index}
                style={[
                  styles.confetti,
                  {
                    transform: [
                      { translateX: anim.translateX },
                      { translateY: anim.translateY },
                      {
                        rotate: anim.rotate.interpolate({
                          inputRange: [0, 8],
                          outputRange: ["0deg", "2880deg"],
                        }),
                      },
                      { scale: anim.scale },
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              >
                {shapes[index % shapes.length]}
              </Animated.Text>
            );
          })}

          <Animated.View
            style={[
              styles.successModalContent,
              {
                transform: [{ scale: successModalScale }],
              },
            ]}
          >
            {/* Checkmark Icon */}
            <Animated.View
              style={[
                styles.successCheckContainer,
                {
                  transform: [
                    { scale: checkmarkScale },
                    {
                      rotate: checkmarkRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-180deg", "0deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["#10B981", "#34D399"]}
                style={styles.successCheckGradient}
              >
                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            {/* Title */}
            <Animated.Text
              style={[styles.successTitle, { opacity: titleOpacity }]}
            >
              Recipe Updated!
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text
              style={[styles.successSubtitle, { opacity: subtitleOpacity }]}
            >
              "{name}" has been updated successfully
            </Animated.Text>

            {/* Recipe Icon */}
            <Animated.View
              style={[styles.successRecipeIcon, { opacity: subtitleOpacity }]}
            >
              <LinearGradient
                colors={["rgba(0,255,255,0.1)", "rgba(255,0,255,0.1)"]}
                style={{
                  padding: 20,
                  borderRadius: 40,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Ionicons name="create" size={50} color="#FF00FF" />
              </LinearGradient>
            </Animated.View>

            {/* Done Button */}
            <Animated.View style={{ opacity: buttonOpacity, width: "100%" }}>
              <TouchableOpacity onPress={closeSuccessModal} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successButton}
                >
                  <Text style={styles.successButtonText}>Perfect!</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Decorative sparkles */}
            <View style={styles.sparkleContainer} pointerEvents="none">
              <View style={[styles.sparkle, { top: 20, left: 20 }]}>
                <Ionicons name="checkmark-done" size={20} color="#00FF00" />
              </View>
              <View style={[styles.sparkle, { top: 40, right: 25 }]}>
                <Ionicons name="star" size={18} color="#FFFF00" />
              </View>
              <View style={[styles.sparkle, { bottom: 100, left: 30 }]}>
                <Ionicons name="sparkles" size={16} color="#00FFFF" />
              </View>
              <View style={[styles.sparkle, { bottom: 120, right: 35 }]}>
                <Ionicons name="heart" size={16} color="#FF00FF" />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Inline Error/Warning Popup (Main Screen) */}
      {inlineSuccess.visible && inlineSuccess.type === "error" && (
        <Animated.View
          style={[
            styles.inlineSuccessContainer,
            {
              opacity: inlineSuccessOpacity,
              transform: [{ scale: inlineSuccessScale }],
              zIndex: 9999, // Ensure it's on top of everything
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#EF4444", "#F87171"]}
            style={styles.inlineSuccessGradient}
          >
            <Ionicons name="warning" size={24} color="#FFF" />
            <Text style={styles.inlineSuccessText}>
              {inlineSuccess.message}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
};

export default EditRecipe;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    marginBottom: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    color: "#00FFFF",
    marginTop: 10,
    fontWeight: "600",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#00FFFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Multiple images styles
  imagesSection: {
    marginBottom: 25,
  },
  imagesScrollContent: {
    paddingRight: 20,
    gap: 12,
    paddingTop: 10,
  },
  imagePreviewWrapper: {
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  multiPreviewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  removeImageGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainImageBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0, 255, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mainImageBadgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "700",
  },
  addImageButtonsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  addImageBtn: {
    width: 120,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  addSingleImageBtn: {
    width: 90,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 0, 255, 0.3)",
    borderStyle: "dashed",
  },
  addImageGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addImageText: {
    color: "#00FFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  addImageHint: {
    color: "#666",
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 15,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 16,
  },
  descriptionInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 15,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 16,
    minHeight: 100,
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addItemInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: "#00FFFF",
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
  },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  removeBtn: {
    padding: 2,
  },
  selectButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  selectButtonText: {
    color: "#00FFFF",
    fontWeight: "bold",
  },
  instructionItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 10,
  },
  instructionNumber: {
    color: "#00FFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  instructionText: {
    color: "#FFF",
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    color: "#00FFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
  },
  updateButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    justifyContent: "flex-end",
  },
  modalContent: {
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchAddRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 10,
  },
  modalSearchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    paddingVertical: 14,
  },
  addNewBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  addNewBtnPurple: {
    backgroundColor: "#8B5CF6",
  },
  addNewBtnDisabled: {
    backgroundColor: "#333",
  },
  modalSearch: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 10,
    color: "#FFF",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pickerItem: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  pickerItemSelectedPurple: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  pickerItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pickerItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerItemIconSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  pickerItemIconSelectedPurple: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  pickerItemText: {
    color: "#AAA",
    fontSize: 16,
  },
  pickerItemTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  pickerCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerCheckboxSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  pickerCheckboxSelectedPurple: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyListText: {
    color: "#666",
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  emptyListHint: {
    color: "#00FFFF",
    fontSize: 14,
    marginTop: 8,
  },
  modalDoneBtn: {
    marginTop: 15,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalDoneBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  modalDoneText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 16, 0.97)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#1A1A2E",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  successCheckContainer: {
    marginBottom: 25,
  },
  successCheckGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  successRecipeIcon: {
    marginBottom: 25,
  },
  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  successButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  confetti: {
    position: "absolute",
    fontSize: 24,
  },
  inlineSuccessContainer: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    zIndex: 100,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inlineSuccessGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  inlineSuccessText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
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
    fontSize: 18,
    opacity: 0.6,
  },
});
