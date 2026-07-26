import React, { useState, useRef } from "react";
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

interface ShellOutput {
  id: string;
  command: string;
  output: string;
  timestamp: number;
}

export default function ShellScreen() {
  const [outputs, setOutputs] = useState<ShellOutput[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const shellMutation = trpc.shell.execute.useMutation();

  const handleExecuteCommand = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await shellMutation.mutateAsync({ command: input });

      const newOutput: ShellOutput = {
        id: Math.random().toString(36).substr(2, 9),
        command: input,
        output: response.output,
        timestamp: response.timestamp,
      };

      setOutputs((prev) => [...prev, newOutput]);
      setInput("");
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Errore nell'esecuzione del comando:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setOutputs([]);
  };

  const renderOutput = ({ item }: { item: ShellOutput }) => (
    <View className="mb-4 font-mono">
      <Text className="text-primary font-bold text-sm">$ {item.command}</Text>
      <Text className="text-foreground text-xs mt-1 font-mono">{item.output}</Text>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Shell Header */}
        <View className="bg-surface rounded-lg p-3 border border-border">
          <Text className="text-foreground font-bold text-sm">Divine Nexus Shell</Text>
          <Text className="text-muted text-xs mt-1">
            Comandi: help, status, clear, scan, analyze
          </Text>
        </View>

        {/* Output Area */}
        <View className="flex-1 bg-black rounded-lg p-3 border border-border overflow-hidden">
          <FlatList
            ref={flatListRef}
            data={outputs}
            renderItem={renderOutput}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
          />

          {outputs.length === 0 && (
            <Text className="text-muted text-xs text-center mt-4">
              Nessun output. Inizia digitando un comando.
            </Text>
          )}
        </View>

        {/* Input Area */}
        <View className="flex-row gap-2 items-center">
          <TextInput
            className="flex-1 bg-surface text-foreground p-3 rounded-lg border border-border font-mono text-sm"
            placeholder="Digita comando..."
            placeholderTextColor="#9BA1A6"
            value={input}
            onChangeText={setInput}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={handleExecuteCommand}
          />
          <Pressable
            onPress={handleExecuteCommand}
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
            <Text className="text-white font-bold text-sm">Esegui</Text>
          </Pressable>
        </View>

        {/* Clear Button */}
        <Pressable
          onPress={handleClearHistory}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text className="text-center text-error text-xs">Pulisci Cronologia</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
