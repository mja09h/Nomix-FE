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
import client from "../../api/client";

const AiGenerator = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [ingredients, setIngredients] = useState("");
  const [mood, setMood] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<null | {
    name: string;
    description: string;
    instructions: Record<string, string>;
    calories?: string;
  }>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe: any) => {
      // Map the AI structure to backend structure if needed
      // Assuming backend accepts { name, description, instructions, ingredients }
      const response = await client.post("/recipes", {
        name: recipe.name,
        description: recipe.description,
        instructions: JSON.stringify(recipe.instructions), // Store object as string or adjust backend to accept JSON
        ingredients: ingredients.split(",").map((i) => i.trim()), // Basic parsing
        calories: recipe.calories,
        // Add other fields as needed
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
    if (!ingredients.trim()) {
      Alert.alert("Required", "Please enter some ingredients first.");
      return;
    }

    setIsGenerating(true);
    setGeneratedRecipe(null);

    try {
      const recipe = await generateRecipeWithAI(ingredients, mood, language);
      setGeneratedRecipe(recipe);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsGenerating(false);
    }
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
            <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
              {t("ai_generator.enter_ingredients")}{" "}
              <Ionicons name="flask-outline" size={16} color="#00FFFF" />
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                isRTL && { textAlign: "right" },
              ]}
              placeholder={t("ai_generator.ingredients_placeholder")}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={4}
              value={ingredients}
              onChangeText={setIngredients}
            />

            <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
              {t("ai_generator.enter_mood")}{" "}
              <Ionicons name="color-wand-outline" size={16} color="#FF00FF" />
            </Text>
            <TextInput
              style={[styles.input, isRTL && { textAlign: "right" }]}
              placeholder={t("ai_generator.mood_placeholder")}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={mood}
              onChangeText={setMood}
            />

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
                        color={isGenerating ? "#00FFFF" : "#FFFFFF"}
                        style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                      />
                      <Text
                        style={[
                          styles.generateButtonText,
                          isGenerating && { color: "#00FFFF" },
                        ]}
                      >
                        {t("ai_generator.generate_button")}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>

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

                {/* Calorie Badge */}
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

                {/* Render Instructions Cleanly */}
                <View style={styles.instructionsContainer}>
                  {generatedRecipe.instructions &&
                  typeof generatedRecipe.instructions === "object" ? (
                    Object.entries(generatedRecipe.instructions).map(
                      ([key, value], index) => {
                        return (
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
                        );
                      }
                    )
                  ) : (
                    <Text style={styles.instructionStep}>
                      {/* Fallback if instructions is a string or missing */}
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
    gap: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  generateButtonWrapper: {
    marginTop: 20,
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  generateButton: {
    height: 56,
    borderRadius: 28,
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
    flex: 1, // Allow text to wrap if long
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
  instructionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF00FF",
    marginTop: 10,
    marginBottom: 5,
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
});
