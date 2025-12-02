import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import React from "react";
import Logo from "../components/Logo";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const index = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Logo />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => router.push("/features")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00FFFF", "#FF00FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050510", // Dark background to match the neon logo style
  },
  buttonContainer: {
    marginTop: 50,
    width: 280,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF00FF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
