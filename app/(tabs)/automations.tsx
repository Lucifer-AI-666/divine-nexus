import React, { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

type TabStatus = "past" | "present" | "future";

interface Automation {
  id: string;
  title: string;
  status: string;
  progress: number;
  timestamp: number;
}

export default function AutomationsScreen() {
  const [activeTab, setActiveTab] = useState<TabStatus>("present");

  const { data: automations = [] } = trpc.automations.list.useQuery({ status: activeTab });

  const renderAutomation = ({ item }: { item: Automation }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-foreground flex-1">{item.title}</Text>
        <View className="bg-primary px-2 py-1 rounded">
          <Text className="text-xs text-background font-bold">{item.status}</Text>
        </View>
      </View>

      {item.progress < 100 && (
        <View className="bg-border rounded-full h-2 overflow-hidden mb-2">
          <View
            className="bg-primary h-full"
            style={{ width: `${item.progress}%` }}
          />
        </View>
      )}

      <Text className="text-xs text-muted">
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Tab Selector */}
        <View className="flex-row gap-2 justify-around">
          {(["past", "present", "future"] as TabStatus[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: activeTab === tab ? "#0a7ea4" : "#333",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                className={
                  activeTab === tab
                    ? "text-background font-bold text-center"
                    : "text-foreground text-center"
                }
              >
                {tab === "past" ? "Passato" : tab === "present" ? "Presente" : "Futuro"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Automations List */}
        <FlatList
          data={automations}
          renderItem={renderAutomation}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
        />

        {automations.length === 0 && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">
              Nessuna automazione in questa categoria
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
