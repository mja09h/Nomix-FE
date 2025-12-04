import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { createReport, REPORT_REASONS } from "../api/reports";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: "recipe" | "ingredient" | "category" | "user";
  targetId: string;
  targetName?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      setDescription("");
      setErrorMessage(null);
      setShowSuccess(false);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setErrorMessage("Please select a reason for reporting");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await createReport(
        targetType,
        targetId,
        selectedReason,
        description
      );

      if (result.success) {
        setShowSuccess(true);
        // Animate success
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(checkRotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]).start();

        // Auto close after success
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      successScale.setValue(0);
      checkRotate.setValue(0);
      onClose();
    });
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case "recipe":
        return "Recipe";
      case "user":
        return "User";
      case "ingredient":
        return "Ingredient";
      case "category":
        return "Category";
      default:
        return "Item";
    }
  };

  const spinRotation = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {showSuccess ? (
            // Success State
            <View style={styles.successContainer}>
              <Animated.View
                style={[
                  styles.successIconContainer,
                  {
                    transform: [
                      { scale: successScale },
                      { rotate: spinRotation },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={["#00FF88", "#00FFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.successIconGradient}
                >
                  <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.successTitle}>Report Submitted</Text>
              <Text style={styles.successMessage}>
                Thank you for helping keep our community safe. We'll review your
                report shortly.
              </Text>
            </View>
          ) : (
            // Report Form
            <>
              {/* Header */}
              <LinearGradient
                colors={["#FF0055", "#FF3366"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
                <Ionicons name="flag" size={28} color="#FFFFFF" />
                <Text style={styles.headerTitle}>
                  Report {getTargetLabel()}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* Target Info */}
                {targetName && (
                  <View style={styles.targetInfo}>
                    <Ionicons
                      name={
                        targetType === "user"
                          ? "person"
                          : targetType === "recipe"
                          ? "restaurant"
                          : targetType === "category"
                          ? "grid"
                          : "leaf"
                      }
                      size={16}
                      color="#00FFFF"
                    />
                    <Text style={styles.targetName} numberOfLines={1}>
                      {targetName}
                    </Text>
                  </View>
                )}

                {/* Reason Selection */}
                <Text style={styles.label}>Why are you reporting this?</Text>
                <View style={styles.reasonsContainer}>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonButton,
                        selectedReason === reason.id &&
                          styles.reasonButtonSelected,
                      ]}
                      onPress={() => setSelectedReason(reason.id)}
                    >
                      <View style={styles.radioCircle}>
                        {selectedReason === reason.id && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.reasonText,
                          selectedReason === reason.id &&
                            styles.reasonTextSelected,
                        ]}
                      >
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Additional Description */}
                <Text style={styles.label}>Additional details (optional)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Provide more context about the issue..."
                  placeholderTextColor="#666"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>

                {/* Error Message */}
                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#FF0055" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Submit Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !selectedReason && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || !selectedReason}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="flag" size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Submit Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ReportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  targetName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  reasonButtonSelected: {
    backgroundColor: "rgba(255, 0, 85, 0.15)",
    borderColor: "#FF0055",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF0055",
  },
  reasonText: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  reasonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  descriptionInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  charCount: {
    color: "#666",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    color: "#FF0055",
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF0055",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#444",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  // Success State
  successContainer: {
    padding: 40,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  successMessage: {
    color: "#AAAAAA",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
