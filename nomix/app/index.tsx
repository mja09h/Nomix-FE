import { StyleSheet, View } from "react-native";
import React from "react";
import Logo from "../components/Logo";
// Splash Screen

const index = () => {
  return (
    <View style={styles.container}>
      <Logo />
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
});
