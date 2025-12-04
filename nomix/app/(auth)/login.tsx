import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
} from "react-native-svg";
import Logo from "../../components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { login as apiLogin } from "../../api/auth";
import { schedulePushNotification } from "../../utils/notifications";
import { getNotificationsEnabled } from "../../utils/preferences";

// Custom Alert Component for Login Errors
interface LoginAlertProps {
  visible: boolean;
  type: "error" | "banned" | "deactivated";
  title: string;
  message: string;
  onClose: () => void;
}

const LoginAlert: React.FC<LoginAlertProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

  const getIconAndColor = () => {
    switch (type) {
      case "banned":
        return {
          icon: "ban",
          color: "#FF0055",
          bgColor: "rgba(255, 0, 85, 0.2)",
        };
      case "deactivated":
        return {
          icon: "person-remove",
          color: "#FFD700",
          bgColor: "rgba(255, 215, 0, 0.2)",
        };
      default:
        return {
          icon: "alert-circle",
          color: "#FF0055",
          bgColor: "rgba(255, 0, 85, 0.2)",
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={alertStyles.overlay}>
        <Animated.View
          style={[
            alertStyles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[bgColor, "rgba(26, 26, 46, 0.95)"]}
            style={alertStyles.gradient}
          >
            <View
              style={[alertStyles.iconContainer, { backgroundColor: bgColor }]}
            >
              <Ionicons name={icon as any} size={40} color={color} />
            </View>
            <Text style={[alertStyles.title, { color }]}>{title}</Text>
            <Text style={alertStyles.message}>{message}</Text>
            <TouchableOpacity
              style={[alertStyles.okButton, { backgroundColor: color }]}
              onPress={onClose}
            >
              <Text style={alertStyles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  okButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  okButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
  });

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    "error" | "banned" | "deactivated"
  >("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (
    type: "error" | "banned" | "deactivated",
    title: string,
    message: string
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    let valid = true;
    let newErrors = {
      identifier: "",
      password: "",
    };

    if (!identifier.trim()) {
      newErrors.identifier = "Email or Username is required";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      setIsLoading(true);
      try {
        const result = await apiLogin(identifier, password);

        if (result.success && result.data) {
          const { token } = result.data;
          await login(token);

          // Trigger Notification
          const enabled = await getNotificationsEnabled();
          if (enabled) {
            await schedulePushNotification(
              "Welcome Back!",
              "It's great to see you again."
            );
          }

          router.push("/(protected)/(tabs)/home");
        } else {
          const errorMessage =
            result.error || "Login failed. Please check your credentials.";

          // Determine alert type based on error message
          if (errorMessage.toLowerCase().includes("banned")) {
            showAlert("banned", "Account Banned", errorMessage);
          } else if (errorMessage.toLowerCase().includes("deactivated")) {
            showAlert("deactivated", "Account Deactivated", errorMessage);
          } else {
            showAlert("error", "Login Failed", errorMessage);
          }
        }
      } catch (error: any) {
        console.error("Login error", error);
        showAlert("error", "Error", "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Blob Animation Component for Background
  const BlobBackground = ({
    isFocused,
    hasError,
  }: {
    isFocused: boolean;
    hasError: boolean;
  }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isFocused) {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      } else {
        rotateAnim.stopAnimation();
        rotateAnim.setValue(0);
      }
    }, [isFocused]);

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    if (!isFocused && !hasError) return null;

    return (
      <View style={StyleSheet.absoluteFillObject}>
        <View
          style={{
            overflow: "hidden",
            borderRadius: 12,
            width: "100%",
            height: "100%",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: -50,
              left: -50,
              width: "200%",
              height: "400%",
              transform: [{ rotate }],
            }}
          >
            <Svg height="100%" width="100%" viewBox="0 0 200 200">
              <Defs>
                <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <Stop
                    offset="0"
                    stopColor={hasError ? "#FF0055" : "#00FFFF"}
                    stopOpacity="1"
                  />
                  <Stop
                    offset="1"
                    stopColor={hasError ? "#FF0000" : "#FF00FF"}
                    stopOpacity="1"
                  />
                </SvgGradient>
              </Defs>
              <Path
                d="M45.7,-76.2C58.9,-69.3,69.1,-56.4,76.3,-42.2C83.5,-28,87.7,-12.5,85.6,1.9C83.5,16.3,75.1,29.6,65.2,40.8C55.3,52,43.9,61.1,31.2,65.8C18.5,70.5,4.5,70.8,-8.2,68.7C-20.9,66.6,-32.3,62.1,-42.6,54.4C-52.9,46.7,-62.1,35.8,-69.1,22.9C-76.1,10,-80.9,-4.9,-77.8,-18.2C-74.7,-31.5,-63.7,-43.2,-51.4,-50.6C-39.1,-58,-25.5,-61.1,-11.9,-61.6C1.7,-62.1,13.4,-60,25.1,-57.9"
                fill="url(#grad)"
                transform="translate(100, 100) scale(1.5)"
              />
            </Svg>
          </Animated.View>
        </View>
      </View>
    );
  };

  // Helper to render Input with Liquid Background Effect
  const renderInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    fieldKey: string,
    placeholder: string,
    options: any = {},
    isPassword: boolean = false,
    showPassword: boolean = false,
    togglePassword: () => void = () => {}
  ) => {
    const isFocused = focusedInput === fieldKey;
    const hasError = !!errors[fieldKey as keyof typeof errors];

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
          {/* Animated Liquid Background */}
          <BlobBackground isFocused={isFocused} hasError={hasError} />

          {/* Static Border for inactive state */}
          {!isFocused && !hasError && (
            <View style={[StyleSheet.absoluteFill, styles.inactiveBorder]} />
          )}

          <View style={styles.innerInputContainer}>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#666"
              value={value}
              onChangeText={setValue}
              onFocus={() => setFocusedInput(fieldKey)}
              onBlur={() => setFocusedInput(null)}
              autoCapitalize="none"
              secureTextEntry={isPassword && !showPassword}
              {...options}
            />
            {isPassword && (
              <TouchableOpacity
                onPress={togglePassword}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {hasError ? (
          <Text style={styles.errorText}>
            {errors[fieldKey as keyof typeof errors]}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
              {renderInput(
                "Email or Username",
                identifier,
                setIdentifier,
                "identifier",
                "Enter your email or username",
                { keyboardType: "email-address" }
              )}
              {renderInput(
                "Password",
                password,
                setPassword,
                "password",
                "Enter your password",
                {},
                true,
                showPassword,
                () => setShowPassword(!showPassword)
              )}

              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.8}
                style={styles.buttonWrapper}
                disabled={isLoading}
              >
                <View style={styles.buttonContainer}>
                  <View style={styles.buttonBackground}>
                    {isLoading ? (
                      <ActivityIndicator color="#00FFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/register")}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Login Alert */}
      <LoginAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.3,
    zIndex: 0, // Ensure it's at the bottom but visible within root
    transform: [{ scale: 1.2 }],
  },
  scrollContainer: {
    flexGrow: 1,
    zIndex: 1, // Ensure content is above background
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    padding: 2, // Border thickness
    backgroundColor: "transparent",
  },
  inactiveBorder: {
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
    borderRadius: 12,
  },
  innerInputContainer: {
    backgroundColor: "rgba(5, 5, 16, 0.8)", // Slightly transparent to show background blur if needed, but solid is safer for text
    borderRadius: 10, // Slightly less than wrapper
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    padding: 16,
    flex: 1,
  },
  eyeIcon: {
    padding: 10,
    marginRight: 5,
  },
  errorText: {
    color: "#FF0055",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  buttonWrapper: {
    marginTop: 30, // Increased margin for login button
    shadowColor: "#00FFFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 30,
  },
  buttonContainer: {
    borderRadius: 30,
    padding: 2,
    overflow: "hidden",
    backgroundColor: "#00FFFF",
  },
  buttonBackground: {
    backgroundColor: "#050510",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  buttonText: {
    color: "#00FFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: "#00FFFF",
    fontSize: 14,
  },
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  registerText: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  registerLink: {
    color: "#00FFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
