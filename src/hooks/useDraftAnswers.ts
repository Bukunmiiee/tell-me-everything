"use client";

import { useCallback, useEffect, useState } from "react";
import { AnswerMap, DRAFT_STORAGE_KEY } from "@/lib/types";

/**
 * Loads/saves the applicant's in-progress answers to localStorage
 * (their own browser — never sent anywhere until they hit Submit).
 * This is what makes "leave and come back later" work with no login.
 */
export function useDraftAnswers() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {
      // corrupted or blocked storage — start fresh rather than crash
    }
    setHydrated(true);
  }, []);

  const updateAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full/blocked — the in-memory state still works for this session
      }
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAnswers({});
  }, []);

  return { answers, updateAnswer, clearDraft, hydrated };
}
