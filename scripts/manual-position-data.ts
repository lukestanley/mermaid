export interface ExampleDefinition {
  id: string;
  title: string;
  description: string;
  before: string;
  after: string;
}

import { EXAMPLES as SOURCE_EXAMPLES } from '../demos/manual-positioning/examples.js';

export const EXAMPLES: ExampleDefinition[] = SOURCE_EXAMPLES as ExampleDefinition[];
export { LAYOUT_OPTIONS } from '../demos/manual-positioning/examples.js';
