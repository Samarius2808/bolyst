"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pronunciation logic for the "Bolyst" name.
 *
 * Plays a hosted audio clip (`src`) when available. If the clip is missing or
 * fails to load, it falls back to the Web Speech API (SpeechSynthesis),
 * preferring a Norwegian voice (the word is Scandinavian), then other Nordic
 * voices, then the platform default.
 *
 * A press while the word is still playing is ignored instead of restarting
 * it: seeking a short MP3 mid-playback stutters audibly, and cancelling an
 * in-flight SpeechSynthesis utterance is unreliable in Chrome. The clip is
 * preloaded on mount so the first press starts without buffering.
 */

/**
 * Upper bound on how long a single playback may hold the control. Chrome
 * sometimes never fires `end` for an utterance, and a stalled media element
 * would otherwise keep the press lock forever.
 */
const SAFETY_MS = 4000;

function usePronunciation(src?: string) {
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Set between a press and the moment the clip actually starts (or fails). */
  const requestedRef = useRef(false);
  /** The utterance currently in flight; also keeps it from being GC'd mid-speech. */
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

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
    // Still speaking: let it finish rather than cut it off.
    if (utterRef.current) return;

    const ss = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance("Bolyst");
    if (voiceRef.current) {
      utter.voice = voiceRef.current;
      utter.lang = voiceRef.current.lang;
    } else {
      utter.lang = "nb-NO";
    }
    utter.rate = 0.8;
    utter.pitch = 1;

    const finish = () => {
      // Ignore late events from an utterance we already moved on from.
      if (utterRef.current !== utter) return;
      utterRef.current = null;
      clearSafetyTimer();
      setSpeaking(false);
    };
    utter.onstart = () => {
      if (utterRef.current === utter) setSpeaking(true);
    };
    utter.onend = finish;
    utter.onerror = finish;

    utterRef.current = utter;
    safetyTimerRef.current = window.setTimeout(finish, SAFETY_MS);
    // Only clear the queue when something is actually stuck in it: calling
    // cancel() right before speak() can silently drop the new utterance.
    if (ss.speaking || ss.pending) ss.cancel();
    ss.speak(utter);
  }, [clearSafetyTimer]);

  /** Lazily creates (and starts preloading) the clip element. */
  const getAudio = useCallback(() => {
    if (!src || typeof window === "undefined") return null;
    if (audioRef.current) return audioRef.current;

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.onplaying = () => {
      requestedRef.current = false;
      setSpeaking(true);
    };
    audio.onended = () => {
      clearSafetyTimer();
      setSpeaking(false);
    };
    audio.onpause = () => setSpeaking(false);
    audio.onerror = () => {
      // The clip can't be loaded or decoded. Drop it so the next press retries,
      // and only speak instead if someone is actually waiting to hear it.
      const wasRequested = requestedRef.current;
      requestedRef.current = false;
      clearSafetyTimer();
      setSpeaking(false);
      if (audioRef.current === audio) audioRef.current = null;
      if (wasRequested) synth();
    };
    audioRef.current = audio;
    return audio;
  }, [src, synth, clearSafetyTimer]);

  useEffect(() => {
    getAudio();
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.onplaying = null;
        audio.onended = null;
        audio.onpause = null;
        audio.onerror = null;
        audio.pause();
        audioRef.current = null;
      }
      requestedRef.current = false;
      utterRef.current = null;
      clearSafetyTimer();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [getAudio, clearSafetyTimer]);

  const play = useCallback(() => {
    const audio = getAudio();
    if (!audio) {
      synth();
      return;
    }
    // Already playing (or waiting to start): ignore the press. `paused` flips
    // to false synchronously inside play(), so this also covers buffering.
    if (!audio.paused && !audio.ended) return;

    requestedRef.current = true;
    // play() restarts from the beginning once the clip has ended, so no seek needed.
    audio.play().catch((err: unknown) => {
      requestedRef.current = false;
      clearSafetyTimer();
      // Interrupted (e.g. unmount) — nothing to fall back from.
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (audioRef.current === audio) audioRef.current = null;
      synth();
    });
    // If playback stalls and never ends, stop it so the control doesn't stay locked.
    clearSafetyTimer();
    safetyTimerRef.current = window.setTimeout(() => {
      safetyTimerRef.current = null;
      if (!audio.paused && !audio.ended) {
        requestedRef.current = false;
        audio.pause();
        audio.currentTime = 0;
      }
    }, SAFETY_MS);
  }, [getAudio, synth, clearSafetyTimer]);

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
