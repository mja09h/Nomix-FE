import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
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

const Register = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Focus state for animations/styling
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = () => {
    let valid = true;
    let newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      // Proceed with registration logic here
      Alert.alert("Success", "Registration successful!", [
        { text: "OK", onPress: () => router.push("/(tabs)/home") },
      ]);
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
    options: any = {}
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
              {...options}
            />
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started!</Text>
          </View>

          <View style={styles.form}>
            {renderInput(
              "Username",
              username,
              setUsername,
              "username",
              "Enter your username"
            )}
            {renderInput(
              "Email",
              email,
              setEmail,
              "email",
              "Enter your email",
              { keyboardType: "email-address" }
            )}
            {renderInput(
              "Password",
              password,
              setPassword,
              "password",
              "Enter your password",
              { secureTextEntry: true }
            )}
            {renderInput(
              "Confirm Password",
              confirmPassword,
              setConfirmPassword,
              "confirmPassword",
              "Confirm your password",
              { secureTextEntry: true }
            )}

            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.8}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#050510",
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
    backgroundColor: "#050510",
    borderRadius: 10, // Slightly less than wrapper
    width: "100%",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    padding: 16,
    width: "100%",
  },
  errorText: {
    color: "#FF0055",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  buttonWrapper: {
    marginTop: 20,
    shadowColor: "#FF00FF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  loginText: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  loginLink: {
    color: "#00FFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
