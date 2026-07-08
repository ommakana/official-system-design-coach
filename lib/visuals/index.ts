import { VisualData } from '@/types/visuals';
import { trelloVisuals } from './trello';
import { infiniteFeedVisuals } from './infinite-feed';
import { googleDocsVisuals } from './google-docs';

const ALL_VISUALS: Record<string, Record<string, VisualData>> = {
  trello:         trelloVisuals,
  'infinite-feed': infiniteFeedVisuals,
  'google-docs':  googleDocsVisuals,
};

/** Returns a visual for a given module slug + section id, or undefined. */
export function getVisual(slug: string, sectionId: string): VisualData | undefined {
  return ALL_VISUALS[slug]?.[sectionId];
}
