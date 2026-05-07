/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Mood {
  DARK_EMOTIONAL = "Dark Emotional",
  NEON_CYBERPUNK = "Neon Cyberpunk",
  LOFI_CHILL = "Sad Lo-fi",
  TRAP_ENERGY = "Trap Energy",
  DREAMY_ATMOSPHERE = "Dreamy Atmosphere",
  CINEMATIC_GLOW = "Cinematic Glow",
  ANIME_VIBE = "Anime Emotional Vibe",
  FUTURISTIC = "Futuristic",
}

export interface VisualizerConcept {
  id: number;
  title: string;
  mood: string;
  background: string;
  mainObject: string;
  colorTheme: string;
  spectrumStyle: string;
  beatAnimation: string;
  cameraMovement: string;
  particles: string;
  emotion: string;
  fontStyle: string;
  thumbnailPrompt: string;
}

export interface DetailedSpecs {
  designPrompt: string;
  backgroundPrompt: string;
  animationInstructions: string;
  effectsTransitions: string;
  thumbnailIdea: string;
  exportSettings: string;
}
