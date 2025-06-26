"use client";

import { useOfflineInit } from '@/lib/offline/hooks';

export function OfflineInitializer() {
  useOfflineInit();
  return null;
}