import { useState, useRef, useEffect, useCallback } from 'react';

// Browser Web Speech API type declarations
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

export interface UseVoiceInputOptions {
  initialLang?: string;
  onTranscript?: (fullText: string) => void;
  onSpeechFinalized?: (finalText: string) => void;
  handsFree?: boolean;
  autoSendSilenceMs?: number;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<string>(options.initialLang || 'bn-BD');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const finalSpokenRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const lastSpokenTextRef = useRef<string>('');

  const onTranscriptRef = useRef(options.onTranscript);
  onTranscriptRef.current = options.onTranscript;

  const onSpeechFinalizedRef = useRef(options.onSpeechFinalized);
  onSpeechFinalizedRef.current = options.onSpeechFinalized;

  const handsFreeRef = useRef(options.handsFree ?? false);
  handsFreeRef.current = options.handsFree ?? false;

  const silenceMs = options.autoSendSilenceMs || 1800;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  // Sync speech language when initialLang updates
  useEffect(() => {
    if (options.initialLang) {
      setSpeechLang(options.initialLang);
    }
  }, [options.initialLang]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const triggerFinalizedSpeech = useCallback(() => {
    const textToSend = lastSpokenTextRef.current.trim();
    if (textToSend && onSpeechFinalizedRef.current) {
      onSpeechFinalizedRef.current(textToSend);
      lastSpokenTextRef.current = '';
      finalSpokenRef.current = '';
      baseTextRef.current = '';
      setInterimText('');
    }
  }, []);

  const startListening = useCallback(
    (currentInput: string = '') => {
      if (!isSupported) {
        setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      setErrorMessage(null);
      baseTextRef.current = currentInput.trim();
      finalSpokenRef.current = '';
      lastSpokenTextRef.current = currentInput.trim();
      setInterimText('');
      clearSilenceTimer();

      try {
        const SpeechRecognitionClass =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // Safe ignore
          }
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = speechLang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            const transcriptChunk = item[0]?.transcript || '';
            if (item.isFinal) {
              finalSpokenRef.current += (finalSpokenRef.current ? ' ' : '') + transcriptChunk.trim();
            } else {
              currentInterim += transcriptChunk;
            }
          }

          setInterimText(currentInterim);

          const combinedSpoken = [finalSpokenRef.current, currentInterim.trim()]
            .filter(Boolean)
            .join(' ');

          const fullUpdatedText = baseTextRef.current
            ? `${baseTextRef.current} ${combinedSpoken}`
            : combinedSpoken;

          lastSpokenTextRef.current = fullUpdatedText;

          if (onTranscriptRef.current) {
            onTranscriptRef.current(fullUpdatedText);
          }

          // If hands-free mode is on and we have spoken content, reset silence countdown
          if (handsFreeRef.current && fullUpdatedText.trim().length > 0) {
            clearSilenceTimer();
            silenceTimerRef.current = setTimeout(() => {
              if (lastSpokenTextRef.current.trim()) {
                triggerFinalizedSpeech();
              }
            }, silenceMs);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          // Benign errors that should just end quietly
          if (event.error === 'no-speech' || event.error === 'aborted') {
            setIsListening(false);
            setInterimText('');
            return;
          }

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser.');
          } else if (event.error === 'network') {
            setErrorMessage('Network connection lost during speech recognition.');
          } else {
            setErrorMessage(`Voice recognition notice: ${event.error}`);
          }
          setIsListening(false);
          setInterimText('');
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimText('');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not start voice recognition.');
        setIsListening(false);
        setInterimText('');
      }
    },
    [isSupported, speechLang, silenceMs, triggerFinalizedSpeech]
  );

  const toggleListening = useCallback(
    (currentInput: string = '') => {
      if (isListening) {
        stopListening();
      } else {
        startListening(currentInput);
      }
    },
    [isListening, startListening, stopListening]
  );

  // Clean up recognition instance and timers on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Safe ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    speechLang,
    setSpeechLang,
    errorMessage,
    interimText,
    clearError: () => setErrorMessage(null),
    startListening,
    stopListening,
    toggleListening,
    triggerFinalizedSpeech,
  };
}
