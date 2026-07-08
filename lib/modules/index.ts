import { DesignModule } from '@/types';
import { trelloModule }              from './trello';
import { infiniteFeedModule }        from './infinite-feed';
import { googleDocsModule }          from './google-docs';
import { chatAppModule }             from './chat-app';
import { youtubeModule }             from './youtube';
import { slackModule }               from './slack';
import { figmaModule }               from './figma';
import { searchAutocompleteModule }  from './search-autocomplete';
import { notificationSystemModule }  from './notification-system';
import { fileUploadModule }          from './file-upload';
import { whiteboardModule }          from './whiteboard';
import { analyticsUIModule }         from './analytics-ui';
import { dataGridModule }            from './data-grid';

// 13 modules — curated, no redundancy.
// Removed: Jira Board (overlaps Trello), Kanban Board (overlaps Trello), Dashboard (merged into Analytics UI).
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
  whiteboardModule,
  analyticsUIModule,
];

export function getModule(slug: string): DesignModule | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

export {
  trelloModule, infiniteFeedModule, googleDocsModule,
  chatAppModule, youtubeModule, slackModule, figmaModule,
  searchAutocompleteModule, notificationSystemModule,
  fileUploadModule, whiteboardModule, analyticsUIModule, dataGridModule,
};
