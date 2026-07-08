import { VisualData } from '@/types/visuals';
import { trelloVisuals }               from './trello';
import { infiniteFeedVisuals }         from './infinite-feed';
import { googleDocsVisuals }           from './google-docs';
import { chatAppVisuals }              from './chat-app';
import { fileUploadVisuals }           from './file-upload';
import { youtubeVisuals }              from './youtube';
import { slackVisuals }                from './slack';
import { figmaVisuals }                from './figma';
import { searchAutocompleteVisuals }   from './search-autocomplete';
import { notificationSystemVisuals }   from './notification-system';
import { analyticsUIVisuals }          from './analytics-ui';
import { dataGridVisuals }             from './data-grid';

const ALL_VISUALS: Record<string, Record<string, VisualData>> = {
  'trello':                trelloVisuals,
  'infinite-feed':         infiniteFeedVisuals,
  'google-docs':           googleDocsVisuals,
  'chat-app':              chatAppVisuals,
  'file-upload':           fileUploadVisuals,
  'youtube':               youtubeVisuals,
  'slack':                 slackVisuals,
  'figma':                 figmaVisuals,
  'search-autocomplete':   searchAutocompleteVisuals,
  'notification-system':   notificationSystemVisuals,
  'analytics-ui':          analyticsUIVisuals,
  'data-grid':             dataGridVisuals,
};

/** Returns a visual for a given module slug + section id, or undefined. */
export function getVisual(slug: string, sectionId: string): VisualData | undefined {
  return ALL_VISUALS[slug]?.[sectionId];
}
