/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TemplateType = 'circular' | 'bar' | 'neon' | 'broken-heart' | 'lofi-rain' | 'trap-glow';

export interface VisualizerSettings {
  template: TemplateType;
  color: string;
  glowStrength: number;
  particleCount: number;
  beatSensitivity: number;
  backgroundUrl: string | null;
  videoBackgroundUrl: string | null;
  trackTitle: string;
  trackSubtitle: string;
}

export const TEMPLATES: { id: TemplateType; name: string; description: string }[] = [
  { id: 'circular', name: 'Circular Pulse', description: 'Center-focused radial spectrum perfect for pop and dance.' },
  { id: 'bar', name: 'Classic Bar', description: 'Clean, professional linear bars for classic music tracks.' },
  { id: 'neon', name: 'Cyber Neon', description: 'Futuristic wave with heavy glow and digital artifacts.' },
  { id: 'broken-heart', name: 'Emotional Void', description: 'Deep reds and blacks with a central symbol that pulses with the beat.' },
  { id: 'lofi-rain', name: 'Rainy Night', description: 'Muted colors, vertical drop spectrum and subtle rain particles.' },
  { id: 'trap-glow', name: 'Trap Energy', description: 'Strobe effects and heavy bass-synced scale animations.' },
];
