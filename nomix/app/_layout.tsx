import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const _layout = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(protected)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({});
