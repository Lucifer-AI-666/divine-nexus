import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

type IdentityKey = "dio" | "michele" | "matildina" | "lucifero";

interface Message {
  id: string;
  role: "user" | "entity" | "system";
  content: string;
  identity?: IdentityKey;
  timestamp: number;
}

const IDENTITIES = {
  dio: { name: "Dio", emoji: "✨", color: "#ffd700" },
  michele: { name: "Michele", emoji: "⚔️", color: "#0044cc" },
  matildina: { name: "Matildina", emoji: "🌸", color: "#cc3377" },
  lucifero: { name: "Lucifero", emoji: "🔥", color: "#ff6600" },
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState<IdentityKey>("dio");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = trpc.chat.send.useMutation();

  // Carica messaggi e identità da AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem("@divine_nexus_messages");
        const savedIdentity = await AsyncStorage.getItem("@divine_nexus_identity");

        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
        if (savedIdentity) {
          setCurrentIdentity(savedIdentity as IdentityKey);
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Salva messaggi quando cambiano (ma non durante il caricamento iniziale)
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      const saveMessages = async () => {
        try {
          const limitedMessages = messages.slice(-200);
          await AsyncStorage.setItem("@divine_nexus_messages", JSON.stringify(limitedMessages));
        } catch (error) {
          console.error("Errore nel salvataggio dei messaggi:", error);
        }
      };
      saveMessages();
    }
  }, [messages, isInitialized]);

  // Salva identità quando cambia
  useEffect(() => {
    const saveIdentity = async () => {
      try {
        await AsyncStorage.setItem("@divine_nexus_identity", currentIdentity);
      } catch (error) {
        console.error("Errore nel salvataggio dell'identità:", error);
      }
    };
    saveIdentity();
  }, [currentIdentity]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "entity")
        .slice(-10)
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

      const response = await chatMutation.mutateAsync({
        message: input,
        identity: currentIdentity,
        history,
      });

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      Alert.alert("Errore", "Impossibile inviare il messaggio");
    } finally {
      setLoading(false);
    }
  };

  const handleResetMemory = () => {
    if (Platform.OS === "web") {
      if (confirm("Sei sicuro di voler azzerare la memoria?")) {
        setMessages([]);
        AsyncStorage.removeItem("@divine_nexus_messages");
      }
    } else {
      Alert.alert("Azzera Memoria", "Sei sicuro di voler azzerare la memoria?", [
        { text: "Annulla", style: "cancel" },
        {
          text: "Azzera",
          onPress: () => {
            setMessages([]);
            AsyncStorage.removeItem("@divine_nexus_messages");
          },
          style: "destructive",
        },
      ]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const identity = item.identity ? IDENTITIES[item.identity] : null;
    const isUser = item.role === "user";

    return (
      <View className={`flex-row mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
        <View
          className={`max-w-xs rounded-lg p-3 ${
            isUser ? "bg-primary" : "bg-surface"
          }`}
          style={!isUser && identity ? { borderLeftWidth: 3, borderLeftColor: identity.color } : {}}
        >
          {!isUser && identity && (
            <Text className="text-xs font-bold mb-1" style={{ color: identity.color }}>
              {identity.emoji} {identity.name}
            </Text>
          )}
          <Text className={isUser ? "text-background" : "text-foreground"}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Identity Selector */}
        <View className="flex-row gap-2 justify-center">
          {(Object.entries(IDENTITIES) as [IdentityKey, (typeof IDENTITIES)[IdentityKey]][]).map(
            ([key, identity]) => (
              <Pressable
                key={key}
                onPress={() => setCurrentIdentity(key)}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: currentIdentity === key ? identity.color : "#333",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text className={currentIdentity === key ? "text-black font-bold" : "text-white"}>
                  {identity.emoji} {identity.name}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="flex-1"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing Indicator */}
        {loading && (
          <View className="flex-row items-center gap-2 mb-2">
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text className="text-muted text-sm">Digitando...</Text>
          </View>
        )}

        {/* Input Area */}
        <View className="flex-row gap-2 items-center">
          <TextInput
            className="flex-1 bg-surface text-foreground p-3 rounded-lg border border-border"
            placeholder="Scrivi un messaggio..."
            placeholderTextColor="#9BA1A6"
            value={input}
            onChangeText={setInput}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={loading || !input.trim()}
            style={({ pressed }) => [
              {
                backgroundColor: "#0a7ea4",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-white font-bold">Invia</Text>
          </Pressable>
        </View>

        {/* Reset Button */}
        <Pressable
          onPress={handleResetMemory}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text className="text-center text-error text-sm">Azzera Memoria</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
