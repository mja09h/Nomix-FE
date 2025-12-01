import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../../components/Logo";

const GetStarted = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Nomix</Text>
        <Text style={styles.subtitle}>
          Discover and create amazing cocktail recipes.
        </Text>

        <View style={styles.buttonContainer}>
          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={() => router.push("/register")}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
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
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 20,
  },
  buttonWrapper: {
    width: "100%",
    shadowColor: "#FF00FF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#00FFFF",
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  secondaryButtonText: {
    color: "#00FFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
