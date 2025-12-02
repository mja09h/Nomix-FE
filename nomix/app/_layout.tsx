import { StyleSheet, Text, View } from "react-native";
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
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="get-started" options={{ headerShown: false }} />
            <Stack.Screen
              name="(protected)/(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(onboarding)/get-started"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(onboarding)/features"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(protected)/ai-generator"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/register"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/forgot-password"
              options={{ headerShown: false }}
            />
          </Stack>
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({});
