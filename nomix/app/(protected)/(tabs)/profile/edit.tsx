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
} from "react-native";
import React, { useState, useEffect } from "react";
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
          Alert.alert("Success", "Profile updated successfully!", [
            { text: "OK", onPress: () => router.back() },
          ]);
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
});
