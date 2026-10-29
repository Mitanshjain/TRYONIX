
"use client";

import { useEffect, useRef, useState } from "react";

import {
  Mic,
  MicOff,
  Send,
  Volume2,
  X,
  Bot,
  RotateCcw,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatResponse = {
  message: string;
  response: string;
  conversation_id: string;
};

type SpeechRecognitionResultItem = ArrayLike<{
  transcript: string;
}> & {
  isFinal: boolean;
};

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultItem>;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;

  onresult: ((event: SpeechResultEvent) => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;

  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor =
  new () => BrowserSpeechRecognition;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

// ==========================================
// HELPERS
// ==========================================

function cleanSpeechText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\|/g, ", ")
    .replace(/[*_#`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================================
// VOICE ASSISTANT COMPONENT
// ==========================================

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false);

  const [input, setInput] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [listening, setListening] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  const [error, setError] = useState("");

  // ========================================
  // REFS
  // ========================================

  const recognitionRef =
    useRef<BrowserSpeechRecognition | null>(null);

  const loadingRef = useRef(false);
  const listeningRef = useRef(false);

  const recognitionStartRef =
    useRef<number | null>(null);

  const speechStartRef =
    useRef<number | null>(null);

  const speechEndRef =
    useRef<number | null>(null);

  const requestControllerRef =
    useRef<AbortController | null>(null);

  // One conversation ID per assistant session.
  const conversationIdRef =
    useRef<string | null>(null);

  // Set NEXT_PUBLIC_API_URL in frontend/.env.local.
  // Remove a trailing slash to avoid //assistant/chat.
  const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  // ========================================
  // CLEANUP
  // ========================================

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      requestControllerRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ========================================
  // TEXT TO SPEECH
  // ========================================

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeaking(false);

    const cleanedText = cleanSpeechText(text);

    if (!cleanedText) return;

    const speechStart = performance.now();

    const utterance =
      new SpeechSynthesisUtterance(cleanedText);

    utterance.lang = "en-IN";
    utterance.rate = 1.08;
    utterance.pitch = 1;

    utterance.onstart = () => {
      const latency =
        (performance.now() - speechStart) / 1000;

      console.log(
        `[VOICE LATENCY] Text-to-speech startup: ${latency.toFixed(2)}s`
      );

      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ========================================
  // SEND MESSAGE TO BACKEND
  // ========================================

  const sendMessage = async (message: string) => {
    const question = message.trim();
    if (!question || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError("");
    setInput("");

    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    let timedOut = false;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);

    const backendStart = performance.now();
    const endpoint = `${API_URL}/assistant/chat`;

    try {
      console.log(`[TRYONIX API] POST ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          conversation_id: conversationIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        console.error("[TRYONIX API] HTTP error", response.status, details);
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      if (controller.signal.aborted) return;
      if (typeof data.response !== "string") {
        throw new Error("Backend response is missing the response field");
      }

      if (data.conversation_id) {
        conversationIdRef.current = data.conversation_id;
      }
      console.log(`[MEMORY] Conversation ID: ${conversationIdRef.current}`);
      console.log(
        `[VOICE LATENCY] Backend round-trip: ${((performance.now() - backendStart) / 1000).toFixed(2)}s`
      );

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.response },
      ]);
      speak(data.response);
    } catch (err) {
      timedOut = controller.signal.aborted && requestControllerRef.current === controller;
      console.error(`[TRYONIX API] Request failed: ${endpoint}`, err);
      if (timedOut) {
        setError("The assistant took too long to respond. Please try again.");
      } else if (!controller.signal.aborted) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (err instanceof TypeError) {
          setError(
            "Could not reach the backend. Check API URL, backend status and browser CORS errors."
          );
        } else {
          setError(message);
        }
      }
    } finally {
      window.clearTimeout(timeout);
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // ========================================
  // START SPEECH RECOGNITION
  // ========================================

  const startListening = () => {
    if (
      loadingRef.current ||
      listeningRef.current
    ) {
      return;
    }

    setError("");

    const speechWindow =
      window as SpeechWindow;

    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeaking(false);

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognitionStartRef.current = null;
    speechStartRef.current = null;
    speechEndRef.current = null;

    // ======================================
    // SPEECH START
    // ======================================

    recognition.onspeechstart = () => {
      if (
        recognitionRef.current !==
        recognition
      ) {
        return;
      }

      speechStartRef.current =
        performance.now();

      console.log(
        "[VOICE LATENCY] Speech detected"
      );

      if (
        recognitionStartRef.current !== null
      ) {
        const startDelay =
          (
            speechStartRef.current -
            recognitionStartRef.current
          ) / 1000;

        console.log(
          `[VOICE LATENCY] Mic start to speech detection: ${startDelay.toFixed(2)}s`
        );
      }
    };

    // ======================================
    // SPEECH END
    // ======================================

    recognition.onspeechend = () => {
      if (
        recognitionRef.current !==
        recognition
      ) {
        return;
      }

      speechEndRef.current =
        performance.now();

      console.log(
        "[VOICE LATENCY] User finished speaking"
      );

      if (
        speechStartRef.current !== null
      ) {
        const speechDuration =
          (
            speechEndRef.current -
            speechStartRef.current
          ) / 1000;

        console.log(
          `[VOICE LATENCY] Detected speech duration: ${speechDuration.toFixed(2)}s`
        );
      }
    };

    // ======================================
    // LIVE SPEECH TRANSCRIPTION
    // ======================================

    recognition.onresult = (event) => {
      if (
        recognitionRef.current !==
        recognition
      ) {
        return;
      }

      const finalParts: string[] = [];
      const interimParts: string[] = [];

      let hasFinalResult = false;
      let hasInterimResult = false;

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];

        const text =
          result[0]?.transcript?.trim();

        if (!text) continue;

        if (result.isFinal) {
          finalParts.push(text);
          hasFinalResult = true;
        } else {
          interimParts.push(text);
          hasInterimResult = true;
        }
      }

      const transcript = [
        ...finalParts,
        ...interimParts,
      ]
        .join(" ")
        .trim();

      if (!transcript) return;

      // Display words while speaking.
      setInput(transcript);

      if (
        hasInterimResult ||
        !hasFinalResult
      ) {
        console.log(
          `[VOICE] Interim transcript: ${transcript}`
        );

        return;
      }

      // ====================================
      // FINAL TRANSCRIPT
      // ====================================

      const transcriptTime =
        performance.now();

      if (
        recognitionStartRef.current !== null
      ) {
        const recognitionLatency =
          (
            transcriptTime -
            recognitionStartRef.current
          ) / 1000;

        console.log(
          `[VOICE LATENCY] Speech recognition: ${recognitionLatency.toFixed(2)}s`
        );
      }

      if (
        speechEndRef.current !== null
      ) {
        const detectionDelay =
          (
            transcriptTime -
            speechEndRef.current
          ) / 1000;

        console.log(
          `[VOICE LATENCY] Speech-end to transcript: ${detectionDelay.toFixed(2)}s`
        );
      } else {
        console.log(
          "[VOICE LATENCY] Speech-end to transcript: unavailable (result arrived before speechend)"
        );
      }

      console.log(
        `[VOICE] Final transcript: ${transcript}`
      );

      recognitionRef.current = null;
      listeningRef.current = false;

      setListening(false);

      recognition.stop();

      void sendMessage(transcript);
    };

    // ======================================
    // SPEECH ERROR
    // ======================================

    recognition.onerror = () => {
      if (
        recognitionRef.current !==
        recognition
      ) {
        return;
      }

      recognitionRef.current = null;
      listeningRef.current = false;

      setListening(false);

      setError(
        "Microphone error. Check browser permissions."
      );
    };

    // ======================================
    // SPEECH END EVENT
    // ======================================

    recognition.onend = () => {
      if (
        recognitionRef.current !==
        recognition
      ) {
        return;
      }

      recognitionRef.current = null;
      listeningRef.current = false;

      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognitionStartRef.current =
        performance.now();

      recognition.start();

      listeningRef.current = true;
      setListening(true);
    } catch {
      recognitionRef.current = null;
      listeningRef.current = false;

      setListening(false);

      setError(
        "Could not start microphone."
      );
    }
  };

  // ========================================
  // STOP SPEECH RECOGNITION
  // ========================================

  const stopListening = () => {
    const recognition =
      recognitionRef.current;

    recognitionRef.current = null;
    listeningRef.current = false;

    recognitionStartRef.current = null;
    speechStartRef.current = null;
    speechEndRef.current = null;

    setListening(false);

    recognition?.abort();
  };

  // ========================================
  // START NEW CONVERSATION
  // ========================================

  const startNewConversation = () => {
    if (loadingRef.current) {
      return;
    }

    stopListening();

    window.speechSynthesis?.cancel();

    setSpeaking(false);
    setInput("");
    setMessages([]);
    setError("");

    // New chat gets a new ID from backend.
    conversationIdRef.current = null;

    console.log(
      "[MEMORY] Started new conversation"
    );
  };

  // ========================================
  // CLOSE ASSISTANT
  // ========================================

  const closeAssistant = () => {
    stopListening();

    window.speechSynthesis?.cancel();

    setSpeaking(false);
    setOpen(false);
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 flex h-[500px] w-[350px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 text-white shadow-2xl">

          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-2">
              <Bot
                className="text-violet-400"
                size={22}
              />

              <div>
                <p className="font-semibold">
                  TRYONIX AI
                </p>

                <p className="text-xs text-zinc-400">
                  {speaking
                    ? "Speaking..."
                    : listening
                    ? "Listening..."
                    : loading
                    ? "Thinking..."
                    : "Your shopping assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* NEW CHAT BUTTON */}
              <button
                onClick={startNewConversation}
                disabled={loading}
                title="New conversation"
                aria-label="New conversation"
                className="text-zinc-400 transition hover:text-white disabled:opacity-50"
              >
                <RotateCcw size={18} />
              </button>

              {/* CLOSE BUTTON */}
              <button
                onClick={closeAssistant}
                aria-label="Close assistant"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-400">
                Hey! I'm TRYONIX. Ask me about
                fashion, outfits, products, or
                virtual try-on.
              </p>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`whitespace-pre-wrap rounded-xl p-3 text-sm ${
                  message.role === "user"
                    ? "ml-8 bg-violet-600"
                    : "mr-8 bg-zinc-800"
                }`}
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <p className="text-sm text-zinc-400">
                TRYONIX is thinking...
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="text-sm text-red-400"
              >
                {error}
              </p>
            )}
          </div>

          {/* INPUT CONTROLS */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">

              {/* MICROPHONE */}
              <button
                onClick={
                  listening
                    ? stopListening
                    : startListening
                }
                disabled={loading}
                className={`rounded-full p-3 ${
                  listening
                    ? "bg-red-600"
                    : "bg-zinc-800"
                } disabled:opacity-50`}
                aria-label={
                  listening
                    ? "Stop listening"
                    : "Start listening"
                }
              >
                {listening
                  ? <MicOff size={18} />
                  : <Mic size={18} />}
              </button>

              {/* TEXT INPUT */}
              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !listening
                  ) {
                    void sendMessage(input);
                  }
                }}
                readOnly={listening}
                placeholder={
                  listening
                    ? "Listening to you..."
                    : "Ask TRYONIX..."
                }
                className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm outline-none"
              />

              {/* SEND BUTTON */}
              <button
                onClick={() =>
                  void sendMessage(input)
                }
                disabled={
                  loading ||
                  listening ||
                  !input.trim()
                }
                aria-label="Send message"
                className="rounded-full bg-violet-600 p-3 disabled:opacity-50"
              >
                <Send size={18} />
              </button>

              {/* REPLAY ANSWER */}
              <button
                onClick={() => {
                  const lastAnswer = [
                    ...messages,
                  ]
                    .reverse()
                    .find(
                      (message) =>
                        message.role ===
                        "assistant"
                    );

                  if (lastAnswer) {
                    speak(lastAnswer.content);
                  }
                }}
                aria-label="Replay last answer"
                className="rounded-full bg-zinc-800 p-3"
              >
                <Volume2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button
        onClick={() => {
          if (open) {
            closeAssistant();
          } else {
            setOpen(true);
          }
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl transition hover:scale-105"
        aria-label="Toggle TRYONIX AI Assistant"
      >
        {open
          ? <X size={24} />
          : <Mic size={24} />}
      </button>
    </div>
  );
}
