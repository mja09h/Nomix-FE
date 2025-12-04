import { Stack } from "expo-router";

const EditLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default EditLayout;
