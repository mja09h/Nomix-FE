import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { chatWithSupportAI } from "../../../../api/aiService";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

const SupportChat = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text:
        language === "ar"
          ? "مرحباً! كيف يمكنني مساعدتك اليوم؟"
          : "Hello! How can I help you today?",
      sender: "ai",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = messages.concat(userMessage).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const responseText = await chatWithSupportAI(apiMessages, language);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          language === "ar"
            ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
            : "Sorry, something went wrong. Please try again.",
        sender: "ai",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 10 },
        isRTL && { flexDirection: "row-reverse" },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons
          name={isRTL ? "arrow-forward" : "arrow-back"}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {language === "ar" ? "الدعم المباشر" : "Live Support"}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
          isRTL && { alignSelf: isUser ? "flex-start" : "flex-end" },
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="planet" size={16} color="#00FFFF" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.aiMessageBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {renderHeader()}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View
          style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}
        >
          <TextInput
            style={[styles.input, isRTL && { textAlign: "right" }]}
            placeholder={
              language === "ar" ? "اكتب رسالتك..." : "Type your message..."
            }
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons
                name={isRTL ? "send-outline" : "send"}
                size={20}
                color="#FFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SupportChat;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15,
    zIndex: 0,
    transform: [{ scale: 1.5 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: "rgba(5, 5, 16, 0.8)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-end",
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  userMessageBubble: {
    backgroundColor: "rgba(255, 0, 255, 0.1)",
    borderColor: "rgba(255, 0, 255, 0.2)",
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderColor: "rgba(0, 255, 255, 0.2)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#FFF",
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    color: "#FFF",
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00FFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(0, 255, 255, 0.3)",
  },
});
