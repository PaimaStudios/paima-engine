import { RegisterRoutes } from './tsoa/routes.js';
import { default as basicControllerJson } from './tsoa/swagger.json' with { type: 'json' };
export default RegisterRoutes;
export { basicControllerJson };
export { EngineService } from './EngineService.js';
export type {
  ValidateErrorResult,
  InternalServerErrorResult,
} from './controllers/BasicControllers.js';
