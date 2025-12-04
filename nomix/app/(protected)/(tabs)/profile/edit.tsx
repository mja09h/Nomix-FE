import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../../../../components/Logo";
import { useAuth } from "../../../../context/AuthContext";
import { getUserById, updateUser } from "../../../../api/auth";
import { getImageUrl } from "../../../../api";
import * as ImagePicker from "expo-image-picker";

const EditProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Animation refs for success modal
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?._id) {
        setIsFetching(true);
        const result = await getUserById(user._id);
        if (result && result.success) {
          const userData = result.data;
          setUsername(userData.username || "");
          setName(userData.name || "");
          setEmail(userData.email || "");
          setBio(userData.bio || "");
          setProfilePicture(userData.profilePicture || null);
        }
        setIsFetching(false);
      }
    };
    fetchUserData();
  }, [user?._id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const type = asset.mimeType || "image/jpeg";
      const name =
        uri.split("/").pop() || `profile.${type.split("/")[1] || "jpg"}`;

      setProfilePicture(uri);
      setProfilePictureFile({ uri, name, type });
    }
  };

  const showSuccess = () => {
    setShowSuccessModal(true);

    // Reset animations
    scaleAnim.setValue(0.5);
    opacityAnim.setValue(0);
    successScale.setValue(0);
    checkRotate.setValue(0);
    glowAnim.setValue(0);

    // Animate modal appearance
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
    ]).start(() => {
      // Then animate success icon
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
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    });

    // Auto close after 2.5 seconds
    setTimeout(() => {
      handleCloseSuccessModal();
    }, 2500);
  };

  const handleCloseSuccessModal = () => {
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
      setShowSuccessModal(false);
      router.back();
    });
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert("Error", "Username and Email cannot be empty.");
      return;
    }

    setIsLoading(true);

    try {
      if (user?._id) {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("name", name);
        formData.append("email", email);
        formData.append("bio", bio);
        if (profilePictureFile) {
          formData.append("profilePicture", {
            uri: profilePictureFile.uri,
            name: profilePictureFile.name,
            type: profilePictureFile.type,
          } as any);
        }

        const result = await updateUser(user._id, formData);

        if (result.success) {
          showSuccess();
        } else {
          Alert.alert("Error", result.error || "Failed to update profile.");
        }
      }
    } catch (error) {
      console.error("Update error", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Background Logo Animation */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 10 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Avatar Edit Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={{
                      uri:
                        getImageUrl(profilePicture) ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                    }}
                    style={styles.avatarImage}
                  />
                </View>
              </LinearGradient>
              <TouchableOpacity
                style={styles.cameraButton}
                activeOpacity={0.8}
                onPress={pickImage}
              >
                <LinearGradient
                  colors={["#00FFFF", "#0088FF"]}
                  style={styles.cameraGradient}
                >
                  <Ionicons name="camera" size={16} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#666"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="at-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    height: 100,
                    alignItems: "flex-start",
                    paddingVertical: 10,
                  },
                ]}
              >
                <Ionicons
                  name="text-outline"
                  size={20}
                  color="#666"
                  style={[styles.inputIcon, { marginTop: 4 }]}
                />
                <TextInput
                  style={[
                    styles.input,
                    { height: "100%", textAlignVertical: "top" },
                  ]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButtonContainer}
              onPress={handleSave}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ["#333", "#444"] : ["#00FFFF", "#0088FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Decorative background elements */}
            <View style={styles.modalDecoration}>
              <LinearGradient
                colors={["rgba(0, 255, 255, 0.1)", "transparent"]}
                style={styles.decorativeGlow}
              />
            </View>

            {/* Success Icon */}
            <Animated.View
              style={[
                styles.successIconContainer,
                {
                  transform: [
                    { scale: successScale },
                    {
                      rotate: checkRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["#00FFFF", "#00FF88"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successIconGradient}
              >
                <Ionicons name="checkmark" size={48} color="#000000" />
              </LinearGradient>
            </Animated.View>

            {/* Success Text */}
            <Text style={styles.successTitle}>Profile Updated!</Text>
            <Text style={styles.successMessage}>
              Your changes have been saved successfully.
            </Text>

            {/* Animated progress bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeSuccessButton}
              onPress={handleCloseSuccessModal}
              activeOpacity={0.8}
            >
              <Text style={styles.closeSuccessButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default EditProfile;

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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#050510",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#050510",
  },
  cameraGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    color: "#00FFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#CCCCCC",
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: 50,
    paddingHorizontal: 15,
  },
  passwordContainer: {
    borderColor: "rgba(255, 0, 255, 0.3)",
    backgroundColor: "rgba(255, 0, 255, 0.05)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 20,
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
  },
  saveButtonContainer: {
    marginTop: 20,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0D0D1A",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
    overflow: "hidden",
  },
  modalDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  decorativeGlow: {
    flex: 1,
    borderRadius: 24,
  },
  successIconContainer: {
    marginBottom: 24,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  successMessage: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressBar: {
    flex: 1,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 2,
  },
  closeSuccessButton: {
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  closeSuccessButtonText: {
    color: "#00FFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
