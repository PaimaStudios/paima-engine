/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TsoaRoute, fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DryRunController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VersionController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LatestProcessedBlockheightController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EmulatedBlockActiveController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DeploymentBlockheightToEmulatedController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ConfirmInputAcceptanceController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TransactionCountController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TransactionContentController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GetLogsController } from './../controllers/BasicControllers';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AchievementsController } from './../controllers/AchievementsController';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "DryRunResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"valid":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessfulResult_DryRunResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[true],"required":true},
            "result": {"ref":"DryRunResponse","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FailedResult": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[false],"required":true},
            "errorMessage": {"dataType":"string","required":true},
            "errorCode": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_DryRunResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessfulResult_DryRunResponse_"},{"ref":"FailedResult"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InternalServerErrorResult": {
        "dataType": "refAlias",
        "type": {"ref":"FailedResult","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FieldErrors": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"any"},"message":{"dataType":"string","required":true}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidateErrorResult": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"enum","enums":["Validation Failed"],"required":true},
            "details": {"ref":"FieldErrors"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VersionString": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LatestProcessedBlockheightResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"block_height":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EmulatedBlockActiveResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"emulatedBlocksActive":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessfulResult_number_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[true],"required":true},
            "result": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_number_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessfulResult_number_"},{"ref":"FailedResult"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeploymentBlockheightToEmulatedResponse": {
        "dataType": "refAlias",
        "type": {"ref":"Result_number_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessfulResult_boolean_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[true],"required":true},
            "result": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_boolean_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessfulResult_boolean_"},{"ref":"FailedResult"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConfirmInputAcceptanceResponse": {
        "dataType": "refAlias",
        "type": {"ref":"Result_boolean_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionCountResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"gameInputs":{"dataType":"double","required":true},"scheduledData":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessfulResult_TransactionCountResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[true],"required":true},
            "result": {"ref":"TransactionCountResponse","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_TransactionCountResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessfulResult_TransactionCountResponse_"},{"ref":"FailedResult"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionContentResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"from":{"dataType":"string","required":true},"inputData":{"dataType":"string","required":true},"txIndex":{"dataType":"double","required":true},"blockNumber":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessfulResult_TransactionContentResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[true],"required":true},
            "result": {"ref":"TransactionContentResponse","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_TransactionContentResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessfulResult_TransactionContentResponse_"},{"ref":"FailedResult"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessfulResult__topic-string--address-string--blockNumber-number--data_58___91_fieldName-string_93__58_any_--tx-number--idx-number_-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"enum","enums":[true],"required":true},
            "result": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"idx":{"dataType":"double","required":true},"tx":{"dataType":"double","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},"blockNumber":{"dataType":"double","required":true},"address":{"dataType":"string","required":true},"topic":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__topic-string--address-string--blockNumber-number--data_58___91_fieldName-string_93__58_any_--tx-number--idx-number_-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessfulResult__topic-string--address-string--blockNumber-number--data_58___91_fieldName-string_93__58_any_--tx-number--idx-number_-Array_"},{"ref":"FailedResult"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetLogsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"Result__topic-string--address-string--blockNumber-number--data_58___91_fieldName-string_93__58_any_--tx-number--idx-number_-Array_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetLogsParams": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"topic":{"dataType":"string","required":true},"filters":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"}},"address":{"dataType":"string","required":true},"toBlock":{"dataType":"double"},"fromBlock":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Achievement": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "score": {"dataType":"double"},
            "category": {"dataType":"string"},
            "percentCompleted": {"dataType":"double"},
            "isActive": {"dataType":"boolean","required":true},
            "displayName": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "spoiler": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["all"]},{"dataType":"enum","enums":["description"]}]},
            "iconURI": {"dataType":"string"},
            "iconGreyURI": {"dataType":"string"},
            "startDate": {"dataType":"string"},
            "endDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AchievementPublicList": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string"},
            "version": {"dataType":"string"},
            "block": {"dataType":"double","required":true},
            "caip2": {"dataType":"string","required":true},
            "time": {"dataType":"string"},
            "achievements": {"dataType":"array","array":{"dataType":"refObject","ref":"Achievement"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayerAchievement": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "completed": {"dataType":"boolean","required":true},
            "completedDate": {"dataType":"datetime"},
            "completedRate": {"dataType":"nestedObjectLiteral","nestedProperties":{"total":{"dataType":"double","required":true},"progress":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayerAchievements": {
        "dataType": "refObject",
        "properties": {
            "block": {"dataType":"double","required":true},
            "caip2": {"dataType":"string","required":true},
            "time": {"dataType":"string"},
            "wallet": {"dataType":"string","required":true},
            "walletType": {"dataType":"string"},
            "userId": {"dataType":"string"},
            "userName": {"dataType":"string"},
            "completed": {"dataType":"double","required":true},
            "achievements": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerAchievement"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        app.get('/dry_run',
            ...(fetchMiddlewares<RequestHandler>(DryRunController)),
            ...(fetchMiddlewares<RequestHandler>(DryRunController.prototype.get)),

            async function DryRunController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    gameInput: {"in":"query","name":"gameInput","required":true,"dataType":"string"},
                    userAddress: {"in":"query","name":"userAddress","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new DryRunController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/backend_version',
            ...(fetchMiddlewares<RequestHandler>(VersionController)),
            ...(fetchMiddlewares<RequestHandler>(VersionController.prototype.get)),

            async function VersionController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new VersionController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/latest_processed_blockheight',
            ...(fetchMiddlewares<RequestHandler>(LatestProcessedBlockheightController)),
            ...(fetchMiddlewares<RequestHandler>(LatestProcessedBlockheightController.prototype.get)),

            async function LatestProcessedBlockheightController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new LatestProcessedBlockheightController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/emulated_blocks_active',
            ...(fetchMiddlewares<RequestHandler>(EmulatedBlockActiveController)),
            ...(fetchMiddlewares<RequestHandler>(EmulatedBlockActiveController.prototype.get)),

            async function EmulatedBlockActiveController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new EmulatedBlockActiveController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/deployment_blockheight_to_emulated',
            ...(fetchMiddlewares<RequestHandler>(DeploymentBlockheightToEmulatedController)),
            ...(fetchMiddlewares<RequestHandler>(DeploymentBlockheightToEmulatedController.prototype.get)),

            async function DeploymentBlockheightToEmulatedController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    deploymentBlockheight: {"in":"query","name":"deploymentBlockheight","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new DeploymentBlockheightToEmulatedController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/confirm_input_acceptance',
            ...(fetchMiddlewares<RequestHandler>(ConfirmInputAcceptanceController)),
            ...(fetchMiddlewares<RequestHandler>(ConfirmInputAcceptanceController.prototype.get)),

            async function ConfirmInputAcceptanceController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    gameInput: {"in":"query","name":"gameInput","required":true,"dataType":"string"},
                    userAddress: {"in":"query","name":"userAddress","required":true,"dataType":"string"},
                    blockHeight: {"in":"query","name":"blockHeight","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ConfirmInputAcceptanceController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/transaction_count/blockHeight',
            ...(fetchMiddlewares<RequestHandler>(TransactionCountController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionCountController.prototype.blockHeight)),

            async function TransactionCountController_blockHeight(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    blockHeight: {"in":"query","name":"blockHeight","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new TransactionCountController();

              await templateService.apiHandler({
                methodName: 'blockHeight',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/transaction_count/address',
            ...(fetchMiddlewares<RequestHandler>(TransactionCountController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionCountController.prototype.get)),

            async function TransactionCountController_get(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    address: {"in":"query","name":"address","required":true,"dataType":"string"},
                    blockHeight: {"in":"query","name":"blockHeight","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new TransactionCountController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/transaction_content/blockNumberAndIndex',
            ...(fetchMiddlewares<RequestHandler>(TransactionContentController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionContentController.prototype.blockHeight)),

            async function TransactionContentController_blockHeight(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    blockHeight: {"in":"query","name":"blockHeight","required":true,"dataType":"double"},
                    txIndex: {"in":"query","name":"txIndex","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new TransactionContentController();

              await templateService.apiHandler({
                methodName: 'blockHeight',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/get_logs',
            ...(fetchMiddlewares<RequestHandler>(GetLogsController)),
            ...(fetchMiddlewares<RequestHandler>(GetLogsController.prototype.post)),

            async function GetLogsController_post(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    params: {"in":"body","name":"params","required":true,"ref":"GetLogsParams"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GetLogsController();

              await templateService.apiHandler({
                methodName: 'post',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/achievements/public/list',
            ...(fetchMiddlewares<RequestHandler>(AchievementsController)),
            ...(fetchMiddlewares<RequestHandler>(AchievementsController.prototype.public_list)),

            async function AchievementsController_public_list(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    category: {"in":"query","name":"category","dataType":"string"},
                    isActive: {"in":"query","name":"isActive","dataType":"boolean"},
                    acceptLanguage: {"in":"header","name":"Accept-Language","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AchievementsController();

              await templateService.apiHandler({
                methodName: 'public_list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/achievements/wallet/:wallet',
            ...(fetchMiddlewares<RequestHandler>(AchievementsController)),
            ...(fetchMiddlewares<RequestHandler>(AchievementsController.prototype.wallet)),

            async function AchievementsController_wallet(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    wallet: {"in":"path","name":"wallet","required":true,"dataType":"string"},
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AchievementsController();

              await templateService.apiHandler({
                methodName: 'wallet',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/achievements/erc/:erc/:cde/:token_id',
            ...(fetchMiddlewares<RequestHandler>(AchievementsController)),
            ...(fetchMiddlewares<RequestHandler>(AchievementsController.prototype.nft)),

            async function AchievementsController_nft(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    erc: {"in":"path","name":"erc","required":true,"dataType":"string"},
                    cde: {"in":"path","name":"cde","required":true,"dataType":"string"},
                    token_id: {"in":"path","name":"token_id","required":true,"dataType":"string"},
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AchievementsController();

              await templateService.apiHandler({
                methodName: 'nft',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
