export interface StoryboardImageGenerationCandidate {
  shouldGenerateImage?: number | null;
}

export function selectStoryboardsForImageGeneration<T extends StoryboardImageGenerationCandidate>(storyboards: T[], compulsory: boolean): T[] {
  return compulsory ? storyboards : storyboards.filter((storyboard) => storyboard.shouldGenerateImage !== 0);
}
