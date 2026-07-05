"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pronunciation logic for the "Bolyst" name.
 *
 * Plays a hosted audio clip (`src`) when available. If the clip is missing or
 * fails to load, it falls back to the Web Speech API (SpeechSynthesis),
 * preferring a Norwegian voice (the word is Scandinavian), then other Nordic
 * voices, then the platform default.
 */
function usePronunciation(src?: string) {
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const byLang = (prefix: string) =>
        voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
      voiceRef.current =
        byLang("nb") || byLang("nn") || byLang("no") || byLang("da") || byLang("sv") || null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, []);

  const synth = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance("Bolyst");
    if (voiceRef.current) {
      utter.voice = voiceRef.current;
      utter.lang = voiceRef.current.lang;
    } else {
      utter.lang = "nb-NO";
    }
    utter.rate = 0.8;
    utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utter);
  }, []);

  const play = useCallback(() => {
    if (src) {
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio(src);
        audio.onplay = () => setSpeaking(true);
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => {
          setSpeaking(false);
          audioRef.current = null;
          synth();
        };
        audioRef.current = audio;
      }
      audio.currentTime = 0;
      audio.play().catch(() => {
        audioRef.current = null;
        synth();
      });
      return;
    }
    synth();
  }, [src, synth]);

  return { speaking, play };
}

function Waveform() {
  return (
    <span className="flex items-end gap-[3px] h-4" aria-hidden>
      <span className="w-[3px] rounded-full bg-current animate-[bolyst-wave_0.9s_ease-in-out_infinite] h-2 [animation-delay:0ms]" />
      <span className="w-[3px] rounded-full bg-current animate-[bolyst-wave_0.9s_ease-in-out_infinite] h-4 [animation-delay:150ms]" />
      <span className="w-[3px] rounded-full bg-current animate-[bolyst-wave_0.9s_ease-in-out_infinite] h-3 [animation-delay:300ms]" />
      <span className="w-[3px] rounded-full bg-current animate-[bolyst-wave_0.9s_ease-in-out_infinite] h-2.5 [animation-delay:450ms]" />
    </span>
  );
}

/**
 * The interactive centerpiece: the wordmark "Bo·lyst" is itself the play
 * control. The two syllables are colored to echo the etymology below, and
 * pulse in sequence while the pronunciation plays.
 */
export function PronunciationWord({
  src,
  listenLabel,
  phonetic,
  provenance,
}: {
  src?: string;
  listenLabel: string;
  phonetic: string;
  provenance: string;
}) {
  const { speaking, play } = usePronunciation(src);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={play}
        aria-label={listenLabel}
        className="group relative rounded-3xl px-4 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/50"
      >
        <span className="block text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-none">
          <span
            className={`inline-block text-sage-600 ${
              speaking ? "[animation:bolyst-bump_0.5s_ease-out_both]" : ""
            }`}
          >
            Bo
          </span>
          <span className="mx-1 align-middle text-4xl sm:text-5xl font-light text-sage-300 dark:text-sage-700">
            ·
          </span>
          <span
            className={`inline-block text-zinc-900 dark:text-zinc-100 ${
              speaking ? "[animation:bolyst-bump_0.5s_ease-out_both] [animation-delay:350ms]" : ""
            }`}
          >
            lyst
          </span>
        </span>
        {/* animated underline reveals on hover / while playing */}
        <span
          className={`pointer-events-none absolute -bottom-1.5 left-4 right-4 h-[3px] origin-center rounded-full bg-gradient-to-r from-sage-400 to-sage-600 transition-transform duration-300 ${
            speaking ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </button>

      {/* dictionary line: IPA · language */}
      <p className="mt-7 flex items-center justify-center gap-2.5 text-sm sm:text-base text-zinc-400 dark:text-zinc-500">
        <span className="font-mono">{phonetic}</span>
        <span aria-hidden>·</span>
        <span className="italic">{provenance}</span>
      </p>

      <button
        type="button"
        onClick={play}
        className="mt-7 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 px-5 py-2.5 text-sm font-semibold text-sage-700 dark:text-sage-400 shadow-sm transition-all hover:border-sage-300 dark:hover:border-sage-700 hover:bg-sage-50 dark:hover:bg-sage-950/40 active:scale-[0.98]"
      >
        {speaking ? (
          <Waveform />
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
        {listenLabel}
      </button>
    </div>
  );
}
