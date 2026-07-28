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
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSpeech } from "@/hooks/use-speech";

type IdentityKey = "dio" | "michele" | "matildina" | "lucifero";

interface Message {
  id: string;
  role: "user" | "entity" | "system";
  content: string;
  identity?: IdentityKey;
  timestamp: number;
}

const IDENTITIES = {
  dio: { name: "Dio", emoji: "✨", color: "#ffd700", description: "L'Onnipotente" },
  michele: { name: "Michele", emoji: "⚔️", color: "#0044cc", description: "Il Guerriero" },
  matildina: { name: "Matildina", emoji: "🌸", color: "#cc3377", description: "Angelo della Grazia" },
  lucifero: { name: "Lucifero", emoji: "🔥", color: "#ff6600", description: "Il Portatore di Luce" },
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState<IdentityKey>("dio");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { speak, stop, isSpeaking, currentId } = useSpeech();

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

  // Salva messaggi quando cambiano
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
      flatListRef.current?.scrollToEnd({ animated: true });
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
        setShowSettings(false);
      }
    } else {
      Alert.alert("Azzera Memoria", "Sei sicuro di voler azzerare la memoria?", [
        { text: "Annulla", style: "cancel" },
        {
          text: "Azzera",
          onPress: () => {
            setMessages([]);
            AsyncStorage.removeItem("@divine_nexus_messages");
            setShowSettings(false);
          },
          style: "destructive",
        },
      ]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const identity = item.identity ? IDENTITIES[item.identity] : null;
    const isUser = item.role === "user";
    const isCurrentlySpeaking = isSpeaking && currentId === item.id;

    return (
      <View className={`flex-row mb-2 ${isUser ? "justify-end pr-2" : "justify-start pl-2"} items-end gap-2`}>
        {!isUser && (
          <Pressable
            onPress={() => speak(item.content, item.id)}
            style={({ pressed }) => [{
              opacity: pressed ? 0.6 : 1,
              paddingBottom: 8,
            }]}
          >
            <MaterialIcons
              name={isCurrentlySpeaking ? "stop-circle" : "play-circle"}
              size={24}
              color={isCurrentlySpeaking ? "#EF4444" : "#0a7ea4"}
            />
          </Pressable>
        )}
        <View
          className={`max-w-xs rounded-2xl p-3 ${
            isUser ? "bg-primary" : "bg-surface"
          }`}
          style={!isUser && identity ? { borderLeftWidth: 4, borderLeftColor: identity.color } : {}}
        >
          {!isUser && identity && (
            <Text className="text-xs font-bold mb-1" style={{ color: identity.color }}>
              {identity.emoji} {identity.name}
            </Text>
          )}
          <Text className={`text-sm ${isUser ? "text-background" : "text-foreground"}`}>
            {item.content}
          </Text>
          <Text className={`text-xs mt-1 ${isUser ? "text-background opacity-70" : "text-muted"}`}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  const currentIdentityData = IDENTITIES[currentIdentity];

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-surface border-b border-border px-4 py-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              {currentIdentityData.emoji} {currentIdentityData.name}
            </Text>
            <Text className="text-xs text-muted">{currentIdentityData.description}</Text>
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons name="settings" size={24} color="#0a7ea4" />
          </Pressable>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="flex-1 px-2 py-2"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted text-center">
                Inizia una conversazione con {currentIdentityData.name}
              </Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        {loading && (
          <View className="flex-row items-center gap-2 px-4 py-2">
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text className="text-muted text-xs">Digitando...</Text>
          </View>
        )}

        {/* Input Area */}
        <View className="bg-surface border-t border-border px-3 py-3 flex-row gap-2 items-flex-end">
          <TextInput
            className="flex-1 bg-background text-foreground p-3 rounded-2xl border border-border text-sm"
            placeholder="Scrivi un messaggio..."
            placeholderTextColor="#9BA1A6"
            value={input}
            onChangeText={setInput}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            multiline
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={loading || !input.trim()}
            style={({ pressed }) => [
              {
                backgroundColor: "#0a7ea4",
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background rounded-t-3xl mt-auto">
            {/* Modal Header */}
            <View className="border-b border-border px-4 py-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">Impostazioni</Text>
              <Pressable
                onPress={() => setShowSettings(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <MaterialIcons name="close" size={24} color="#ECEDEE" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
              {/* Identity Selection */}
              <View className="mb-6">
                <Text className="text-sm font-bold text-foreground mb-3">Seleziona Identità</Text>
                {(Object.entries(IDENTITIES) as [IdentityKey, (typeof IDENTITIES)[IdentityKey]][]).map(
                  ([key, identity]) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        setCurrentIdentity(key);
                        setShowSettings(false);
                      }}
                      style={({ pressed }) => [
                        {
                          backgroundColor: currentIdentity === key ? identity.color : "#333",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          marginBottom: 8,
                          opacity: pressed ? 0.8 : 1,
                          flexDirection: "row",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text className={currentIdentity === key ? "text-black font-bold flex-1" : "text-white flex-1"}>
                        {identity.emoji} {identity.name}
                      </Text>
                      <Text className={currentIdentity === key ? "text-black text-xs" : "text-muted text-xs"}>
                        {identity.description}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {/* Chat Info */}
              <View className="mb-6 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-sm font-bold text-foreground mb-2">Informazioni Chat</Text>
                <Text className="text-xs text-muted mb-1">Messaggi: {messages.length}</Text>
                <Text className="text-xs text-muted">
                  Identità attuale: {IDENTITIES[currentIdentity].name}
                </Text>
              </View>

              {/* Voice Settings */}
              <View className="mb-6 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-sm font-bold text-foreground mb-3">Controlli Vocali</Text>
                <Pressable
                  onPress={() => isSpeaking ? stop() : null}
                  style={({ pressed }) => [{
                    backgroundColor: isSpeaking ? "#EF4444" : "#666",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    opacity: pressed ? 0.8 : 1,
                    marginBottom: 8,
                  }]}
                  disabled={!isSpeaking}
                >
                  <Text className={isSpeaking ? "text-white font-bold text-center" : "text-muted text-center"}>
                    {isSpeaking ? "Ferma Lettura" : "Nessuna Lettura in Corso"}
                  </Text>
                </Pressable>
                <Text className="text-xs text-muted">Premi il pulsante play su qualsiasi messaggio per ascoltare con voce naturale</Text>
              </View>

              {/* Reset Memory */}
              <Pressable
                onPress={handleResetMemory}
                style={({ pressed }) => [
                  {
                    backgroundColor: "#EF4444",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white font-bold text-center">Azzera Memoria</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
