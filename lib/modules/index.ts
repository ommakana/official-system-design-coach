import { DesignModule } from '@/types';
import { trelloModule }             from './trello';
import { infiniteFeedModule }       from './infinite-feed';
import { googleDocsModule }         from './google-docs';
import { chatAppModule }            from './chat-app';
import { youtubeModule }            from './youtube';
import { slackModule }              from './slack';
import { figmaModule }              from './figma';
import { searchAutocompleteModule } from './search-autocomplete';
import { notificationSystemModule } from './notification-system';
import { fileUploadModule }         from './file-upload';
import { analyticsUIModule }        from './analytics-ui';
import { dataGridModule }           from './data-grid';

// 12 modules — Whiteboard removed (overlaps with Figma canvas/CRDT concepts).
export const ALL_MODULES: DesignModule[] = [
  // Senior
  trelloModule,
  infiniteFeedModule,
  chatAppModule,
  fileUploadModule,
  searchAutocompleteModule,
  notificationSystemModule,
  dataGridModule,
  // Staff
  googleDocsModule,
  figmaModule,
  youtubeModule,
  slackModule,
  analyticsUIModule,
];

export function getModule(slug: string): DesignModule | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

export {
  trelloModule, infiniteFeedModule, googleDocsModule,
  chatAppModule, youtubeModule, slackModule, figmaModule,
  searchAutocompleteModule, notificationSystemModule,
  fileUploadModule, analyticsUIModule, dataGridModule,
};
