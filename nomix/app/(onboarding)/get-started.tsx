import { StyleSheet, Text, View } from "react-native";
import React from "react";

const GetStarted = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Get Started Screen</Text>
    </View>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
