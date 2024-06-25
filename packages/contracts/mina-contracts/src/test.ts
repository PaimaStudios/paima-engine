import { PrebuiltCache } from './cache.js';
import { DelegationOrderProgram } from './index.js';

// Simple test that PrebuiltCache succeeds.

// Set debug=true so exceptions in read() get logged to console.
PrebuiltCache.INSTANCE.debug = true;

await DelegationOrderProgram.compile();
