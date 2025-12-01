import { StyleSheet, Text, View } from 'react-native'
import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="get-started" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/get-started" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
    </Stack>
  )
}

export default _layout

const styles = StyleSheet.create({})