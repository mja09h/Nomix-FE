import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "../../components/Logo";
import { useLanguage } from "../../context/LanguageContext";
import { generateRecipeWithAI } from "../../api/aiService";
import { useMutation } from "@tanstack/react-query";
import client from "../../api";
import { getAllIngredients, createIngredient } from "../../api/ingredients";
import { Ingredient } from "../../types/Recipe";

// Predefined moods
const MOOD_OPTIONS = [
  { id: "comfort", name: "Comfort Food", icon: "heart", color: "#FF6B6B" },
  { id: "healthy", name: "Healthy", icon: "leaf", color: "#10B981" },
  { id: "quick", name: "Quick & Easy", icon: "flash", color: "#F59E0B" },
  { id: "spicy", name: "Spicy", icon: "flame", color: "#EF4444" },
  { id: "sweet", name: "Sweet Treat", icon: "ice-cream", color: "#EC4899" },
  { id: "exotic", name: "Exotic", icon: "earth", color: "#8B5CF6" },
  { id: "gourmet", name: "Gourmet", icon: "star", color: "#FFD700" },
  { id: "light", name: "Light & Fresh", icon: "sunny", color: "#00FFFF" },
  { id: "hearty", name: "Hearty Meal", icon: "restaurant", color: "#FF8C00" },
  { id: "vegan", name: "Vegan", icon: "nutrition", color: "#22C55E" },
];

const AiGenerator = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<null | {
    name: string;
    description: string;
    instructions: Record<string, string>;
    calories?: string;
  }>(null);

  // Ingredients state
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);

  // Mood state
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [customMood, setCustomMood] = useState("");

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch ingredients on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const ingredients = await getAllIngredients();
        setAvailableIngredients(ingredients || []);
      } catch (e) {
        console.log("Failed to fetch ingredients", e);
      }
    };
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isGenerating]);

  // Get selected ingredient names for AI
  const getSelectedIngredientNames = () => {
    return selectedIngredients
      .map((id) => availableIngredients.find((i) => i._id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  // Get selected mood names for AI
  const getSelectedMoodNames = () => {
    const moodNames = selectedMoods
      .map((id) => MOOD_OPTIONS.find((m) => m.id === id)?.name)
      .filter(Boolean);
    if (customMood.trim()) {
      moodNames.push(customMood.trim());
    }
    return moodNames.join(", ");
  };

  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe: any) => {
      const response = await client.post("/recipes", {
        name: recipe.name,
        description: recipe.description,
        instructions: JSON.stringify(recipe.instructions),
        ingredients: selectedIngredients,
        calories: recipe.calories,
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert("Success", "Recipe saved to your collection!");
    },
    onError: (error: any) => {
      console.error("Save recipe error", error);
      Alert.alert("Error", "Failed to save recipe.");
    },
  });

  const handleSave = () => {
    if (generatedRecipe) {
      saveRecipeMutation.mutate(generatedRecipe);
    }
  };

  const handleGenerate = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert("Required", "Please select at least one ingredient.");
      return;
    }

    setIsGenerating(true);
    setGeneratedRecipe(null);

    try {
      const ingredientNames = getSelectedIngredientNames();
      const moodNames = getSelectedMoodNames();
      const recipe = await generateRecipeWithAI(
        ingredientNames,
        moodNames,
        language
      );
      setGeneratedRecipe(recipe);

      // Animate result in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const toggleMood = (id: string) => {
    setSelectedMoods((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      return [...prev, id];
    });
  };

  const handleAddNewIngredient = async () => {
    if (!ingredientSearch.trim()) return;

    setIsAddingIngredient(true);
    try {
      const newIngredient = await createIngredient(ingredientSearch.trim());
      setAvailableIngredients((prev) => [...prev, newIngredient]);
      setSelectedIngredients((prev) => [...prev, newIngredient._id]);
      setIngredientSearch("");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to create ingredient";
      Alert.alert("Error", msg);
    } finally {
      setIsAddingIngredient(false);
    }
  };

  // Filter ingredients for picker
  const filteredIngredients = availableIngredients.filter((i) =>
    i.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

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

  return (
    <View style={styles.root}>
      {/* Background Logo */}
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
        <Text style={styles.headerTitle}>{t("ai_generator.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            {/* Ingredients Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
                <Ionicons name="flask-outline" size={16} color="#00FFFF" />{" "}
                {t("ai_generator.enter_ingredients")}
              </Text>

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowIngredientPicker(true)}
              >
                <Ionicons name="add-circle-outline" size={22} color="#00FFFF" />
                <Text style={styles.selectButtonText}>Select Ingredients</Text>
              </TouchableOpacity>

              {/* Selected Ingredients Chips */}
              {selectedIngredients.length > 0 && (
                <View style={styles.chipContainer}>
                  {selectedIngredients.map((id) => {
                    const ing = availableIngredients.find((i) => i._id === id);
                    if (!ing) return null;
                    return (
                      <View key={id} style={styles.chip}>
                        <Text style={styles.chipEmoji}>
                          {getIngredientIcon(ing.name)}
                        </Text>
                        <Text style={styles.chipText}>{ing.name}</Text>
                        <TouchableOpacity
                          onPress={() => toggleIngredient(id)}
                          style={styles.removeBtn}
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
            </View>

            {/* Mood Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
                <Ionicons name="color-wand-outline" size={16} color="#FF00FF" />{" "}
                {t("ai_generator.enter_mood")}
              </Text>

              <TouchableOpacity
                style={[styles.selectButton, styles.selectButtonMood]}
                onPress={() => setShowMoodPicker(true)}
              >
                <Ionicons name="sparkles-outline" size={22} color="#FF00FF" />
                <Text style={[styles.selectButtonText, { color: "#FF00FF" }]}>
                  Select Mood
                </Text>
              </TouchableOpacity>

              {/* Selected Moods Chips */}
              {(selectedMoods.length > 0 || customMood.trim()) && (
                <View style={styles.chipContainer}>
                  {selectedMoods.map((id) => {
                    const mood = MOOD_OPTIONS.find((m) => m.id === id);
                    if (!mood) return null;
                    return (
                      <View
                        key={id}
                        style={[styles.chip, { borderColor: mood.color }]}
                      >
                        <Ionicons
                          name={mood.icon as any}
                          size={16}
                          color={mood.color}
                        />
                        <Text style={styles.chipText}>{mood.name}</Text>
                        <TouchableOpacity
                          onPress={() => toggleMood(id)}
                          style={styles.removeBtn}
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
                  {customMood.trim() && (
                    <View style={[styles.chip, { borderColor: "#00FFFF" }]}>
                      <Ionicons name="create" size={16} color="#00FFFF" />
                      <Text style={styles.chipText}>{customMood}</Text>
                      <TouchableOpacity
                        onPress={() => setCustomMood("")}
                        style={styles.removeBtn}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#FF0055"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.8}
              disabled={isGenerating}
            >
              <Animated.View
                style={[
                  styles.generateButtonWrapper,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={
                    isGenerating
                      ? ["#2A2A4A", "#1A1A2E"]
                      : ["#00FFFF", "#FF00FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.generateButton}
                >
                  {isGenerating ? (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator color="#00FFFF" />
                      <Text style={styles.generatingText}>ANALYZING...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons
                        name="sparkles"
                        size={20}
                        color="#FFFFFF"
                        style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                      />
                      <Text style={styles.generateButtonText}>
                        {t("ai_generator.generate_button")}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Generated Recipe Result */}
          {generatedRecipe && (
            <Animated.View
              style={[
                styles.resultContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(0, 255, 255, 0.1)", "rgba(255, 0, 255, 0.1)"]}
                style={styles.resultGradient}
              >
                <View
                  style={[
                    styles.resultHeader,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Ionicons
                    name="hardware-chip-outline"
                    size={24}
                    color="#00FFFF"
                  />
                  <Text
                    style={[
                      styles.resultTitle,
                      isRTL && { textAlign: "right" },
                    ]}
                  >
                    {generatedRecipe.name
                      ? generatedRecipe.name.replace(/['"]/g, "")
                      : "Untitled Recipe"}
                  </Text>
                </View>

                {generatedRecipe.calories && (
                  <View
                    style={[
                      styles.calorieBadge,
                      isRTL && { alignSelf: "flex-end" },
                    ]}
                  >
                    <Ionicons name="flame" size={16} color="#FF4500" />
                    <Text style={styles.calorieText}>
                      {generatedRecipe.calories}
                    </Text>
                  </View>
                )}

                <Text
                  style={[styles.resultDesc, isRTL && { textAlign: "right" }]}
                >
                  "{generatedRecipe.description}"
                </Text>

                <View style={styles.divider} />

                <View style={styles.instructionsContainer}>
                  {generatedRecipe.instructions &&
                  typeof generatedRecipe.instructions === "object" ? (
                    Object.entries(generatedRecipe.instructions).map(
                      ([key, value], index) => (
                        <View key={key} style={styles.instructionRow}>
                          <Text style={styles.instructionNumber}>
                            {index + 1}.
                          </Text>
                          <Text
                            style={[
                              styles.instructionStep,
                              isRTL && { textAlign: "right", flex: 1 },
                            ]}
                          >
                            {value}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text style={styles.instructionStep}>
                      {typeof generatedRecipe.instructions === "string"
                        ? generatedRecipe.instructions
                        : "No instructions provided."}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saveRecipeMutation.isPending}
                >
                  {saveRecipeMutation.isPending ? (
                    <ActivityIndicator color="#050510" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#050510" />
                      <Text style={styles.saveButtonText}>Save Recipe</Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Ingredient Picker Modal */}
      <Modal visible={showIngredientPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={["#00FFFF", "#00CED1"]}
                  style={styles.modalIconBg}
                >
                  <Ionicons name="flask" size={24} color="#000" />
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
                  <Ionicons name="flask-outline" size={50} color="#333" />
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

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowIngredientPicker(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#00FFFF", "#00CED1"]}
                style={styles.modalDoneBtnGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#000" />
                <Text style={styles.modalDoneText}>
                  Done ({selectedIngredients.length} selected)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mood Picker Modal */}
      <Modal visible={showMoodPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={["#FF00FF", "#FF69B4"]}
                  style={styles.modalIconBg}
                >
                  <Ionicons name="sparkles" size={24} color="#FFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.modalTitle}>Select Mood</Text>
                  <Text style={styles.modalSubtitle}>
                    What are you craving?
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowMoodPicker(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Custom Mood Input */}
            <View style={styles.customMoodContainer}>
              <Ionicons name="create-outline" size={20} color="#666" />
              <TextInput
                style={styles.customMoodInput}
                placeholder="Or type your own mood..."
                placeholderTextColor="#555"
                value={customMood}
                onChangeText={setCustomMood}
              />
            </View>

            {/* Mood Options Grid */}
            <FlatList
              data={MOOD_OPTIONS}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.moodGridRow}
              renderItem={({ item }) => {
                const isSelected = selectedMoods.includes(item.id);

                return (
                  <TouchableOpacity
                    style={[
                      styles.moodCard,
                      isSelected && {
                        backgroundColor: `${item.color}20`,
                        borderColor: item.color,
                      },
                    ]}
                    onPress={() => toggleMood(item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.moodIconContainer,
                        { backgroundColor: `${item.color}30` },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={28}
                        color={item.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.moodCardText,
                        isSelected && { color: "#FFF", fontWeight: "600" },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.moodCheckmark,
                          { backgroundColor: item.color },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowMoodPicker(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#FF00FF", "#FF69B4"]}
                style={styles.modalDoneBtnGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={[styles.modalDoneText, { color: "#FFF" }]}>
                  Done ({selectedMoods.length + (customMood.trim() ? 1 : 0)}{" "}
                  selected)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AiGenerator;

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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 25,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 5,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(0, 255, 255, 0.08)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.25)",
    borderStyle: "dashed",
  },
  selectButtonMood: {
    backgroundColor: "rgba(255, 0, 255, 0.08)",
    borderColor: "rgba(255, 0, 255, 0.25)",
  },
  selectButtonText: {
    color: "#00FFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  chip: {
    backgroundColor: "rgba(0, 255, 255, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  removeBtn: {
    padding: 2,
  },
  generateButtonWrapper: {
    marginTop: 10,
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  generateButton: {
    height: 60,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  generatingText: {
    color: "#00FFFF",
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 14,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resultContainer: {
    marginTop: 30,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  resultGradient: {
    padding: 25,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00FFFF",
    marginBottom: 5,
    flex: 1,
    flexWrap: "wrap",
  },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 69, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "flex-start",
    marginBottom: 15,
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.5)",
  },
  calorieText: {
    color: "#FF4500",
    fontWeight: "bold",
    fontSize: 14,
  },
  resultDesc: {
    fontSize: 16,
    color: "#CCCCCC",
    fontStyle: "italic",
    marginBottom: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 15,
  },
  instructionsContainer: {
    gap: 10,
  },
  instructionStep: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
    flex: 1,
  },
  instructionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  instructionNumber: {
    fontSize: 16,
    color: "#00FFFF",
    fontWeight: "bold",
    width: 25,
  },
  saveButton: {
    backgroundColor: "#00FFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    gap: 10,
  },
  saveButtonText: {
    color: "#050510",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
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
    backgroundColor: "#00FFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  addNewBtnDisabled: {
    backgroundColor: "#333",
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
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
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
    backgroundColor: "rgba(0, 255, 255, 0.2)",
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
    backgroundColor: "#00FFFF",
    borderColor: "#00FFFF",
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
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Mood Picker Styles
  customMoodContainer: {
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
  customMoodInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    paddingVertical: 14,
  },
  moodGridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  moodCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  moodCardText: {
    color: "#AAA",
    fontSize: 14,
    textAlign: "center",
  },
  moodCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
