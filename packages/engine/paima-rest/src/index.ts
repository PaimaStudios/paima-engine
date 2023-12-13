import { RegisterRoutes } from './tsoa/routes.js';
import * as basicControllerJson from './tsoa/swagger.json';
// replace the above import with the one below once this is merged and released: https://github.com/prettier/prettier/issues/15699
// import { default as basicControllerJson } from './tsoa/swagger.json' with { type: "json" };
export default RegisterRoutes;
export { basicControllerJson };
export { EngineService } from './EngineService.js';
