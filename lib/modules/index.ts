import { DesignModule } from '@/types';
import { trelloModule } from './trello';
import { infiniteFeedModule } from './infinite-feed';
import { googleDocsModule } from './google-docs';
import { stubModules } from './stubs';

export const ALL_MODULES: DesignModule[] = [
  trelloModule,
  infiniteFeedModule,
  googleDocsModule,
  ...stubModules,
];

export function getModule(slug: string): DesignModule | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

export { trelloModule, infiniteFeedModule, googleDocsModule };
