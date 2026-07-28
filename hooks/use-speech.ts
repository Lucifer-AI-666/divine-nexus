import { useState, useCallback } from "react";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const speak = useCallback(
    async (text: string, messageId: string, options?: SpeechOptions) => {
      try {
        // Se già sta parlando, ferma
        if (isSpeaking) {
          await Speech.stop();
          setIsSpeaking(false);
          setCurrentId(null);
          return;
        }

        setIsSpeaking(true);
        setCurrentId(messageId);

        const defaultOptions = {
          rate: Platform.OS === "ios" ? 0.95 : 0.9, // Leggermente più lento per naturalezza
          pitch: Platform.OS === "ios" ? 1.0 : 1.05,
          volume: 1.0,
          language: "it-IT",
          ...options,
        };

        await Speech.speak(text, {
          language: defaultOptions.language,
          rate: defaultOptions.rate,
          pitch: defaultOptions.pitch,
          volume: defaultOptions.volume,
          onDone: () => {
            setIsSpeaking(false);
            setCurrentId(null);
          },
          onError: (error) => {
            console.error("Errore nella sintesi vocale:", error);
            setIsSpeaking(false);
            setCurrentId(null);
          },
        });
      } catch (error) {
        console.error("Errore nel parlare:", error);
        setIsSpeaking(false);
        setCurrentId(null);
      }
    },
    [isSpeaking]
  );

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
      setCurrentId(null);
    } catch (error) {
      console.error("Errore nello stop della sintesi vocale:", error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await Speech.pause();
      setIsSpeaking(false);
    } catch (error) {
      console.error("Errore nel pause della sintesi vocale:", error);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    isSpeaking,
    currentId,
  };
}
