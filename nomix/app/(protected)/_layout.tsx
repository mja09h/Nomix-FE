import React from "react";
import { Stack } from "expo-router";

const ProtectedLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
};

export default ProtectedLayout;
