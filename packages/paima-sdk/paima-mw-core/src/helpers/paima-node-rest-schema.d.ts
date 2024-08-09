/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/dry_run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DryRunGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/backend_version": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["VersionGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/latest_processed_blockheight": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["LatestProcessedBlockheightGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/emulated_blocks_active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EmulatedBlockActiveGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/deployment_blockheight_to_emulated": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentBlockheightToEmulatedGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/confirm_input_acceptance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ConfirmInputAcceptanceGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/transaction_count/blockHeight": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TransactionCountBlockHeight"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/transaction_count/address": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TransactionCountGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/transaction_content/blockNumberAndIndex": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TransactionContentBlockHeight"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/achievements/public/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AchievementsPublic_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/achievements/wallet/{wallet}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AchievementsWallet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/achievements/erc/{erc}/{cde}/{token_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AchievementsNft"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        DryRunResponse: {
            valid: boolean;
        };
        SuccessfulResult_DryRunResponse_: {
            /** @enum {boolean} */
            success: true;
            result: components["schemas"]["DryRunResponse"];
        };
        FailedResult: {
            /** @enum {boolean} */
            success: false;
            errorMessage: string;
            /** Format: double */
            errorCode?: number;
        };
        Result_DryRunResponse_: components["schemas"]["SuccessfulResult_DryRunResponse_"] | components["schemas"]["FailedResult"];
        InternalServerErrorResult: components["schemas"]["FailedResult"];
        /** @description comes from the `tsoa` package, but we don't want it as a dependency just for this type */
        FieldErrors: {
            [key: string]: {
                value?: unknown;
                message: string;
            };
        };
        ValidateErrorResult: {
            /** @enum {string} */
            message: "Validation Failed";
            details?: components["schemas"]["FieldErrors"];
        };
        /** @description tsoa doesn't support string interpolation in type names like `${number}`
         *     But the real type of this is `${number}.${number}.${number}`
         *     https://github.com/lukeautry/tsoa/pull/1469 */
        VersionString: string;
        LatestProcessedBlockheightResponse: {
            /** Format: double */
            block_height: number;
        };
        EmulatedBlockActiveResponse: {
            emulatedBlocksActive: boolean;
        };
        SuccessfulResult_number_: {
            /** @enum {boolean} */
            success: true;
            /** Format: double */
            result: number;
        };
        Result_number_: components["schemas"]["SuccessfulResult_number_"] | components["schemas"]["FailedResult"];
        DeploymentBlockheightToEmulatedResponse: components["schemas"]["Result_number_"];
        SuccessfulResult_boolean_: {
            /** @enum {boolean} */
            success: true;
            result: boolean;
        };
        Result_boolean_: components["schemas"]["SuccessfulResult_boolean_"] | components["schemas"]["FailedResult"];
        ConfirmInputAcceptanceResponse: components["schemas"]["Result_boolean_"];
        TransactionCountResponse: {
            /** Format: double */
            gameInputs: number;
            /** Format: double */
            scheduledData: number;
        };
        SuccessfulResult_TransactionCountResponse_: {
            /** @enum {boolean} */
            success: true;
            result: components["schemas"]["TransactionCountResponse"];
        };
        Result_TransactionCountResponse_: components["schemas"]["SuccessfulResult_TransactionCountResponse_"] | components["schemas"]["FailedResult"];
        TransactionContentResponse: {
            from: string;
            inputData: string;
            /** Format: double */
            txIndex: number;
            /** Format: double */
            blockNumber: number;
        };
        SuccessfulResult_TransactionContentResponse_: {
            /** @enum {boolean} */
            success: true;
            result: components["schemas"]["TransactionContentResponse"];
        };
        Result_TransactionContentResponse_: components["schemas"]["SuccessfulResult_TransactionContentResponse_"] | components["schemas"]["FailedResult"];
        Achievement: {
            /** @description Unique Achievement String */
            name: string;
            /**
             * Format: double
             * @description Optional: Relative Value of the Achievement
             */
            score?: number;
            /** @description Optional: 'Gold' | 'Diamond' | 'Beginner' | 'Advanced' | 'Vendor' */
            category?: string;
            /**
             * Format: double
             * @description Percent of players that have unlocked the achievement
             */
            percentCompleted?: number;
            /** @description If achievement can be unlocked at the time. */
            isActive: boolean;
            /** @description Achievement Display Name */
            displayName: string;
            /** @description Achievement Description */
            description: string;
            /**
             * @description Hide entire achievement or description if not completed
             * @enum {string}
             */
            spoiler?: "all" | "description";
            /** @description Optional Icon for Achievement */
            iconURI?: string;
            /** @description Optional Icon for locked Achievement */
            iconGreyURI?: string;
            /** @description Optional Date ISO8601 YYYY-MM-DDTHH:mm:ss.sssZ */
            startDate?: string;
            /** @description Optional Date ISO8601 YYYY-MM-DDTHH:mm:ss.sssZ */
            endDate?: string;
        };
        /** @description Result of "Get All Available Achievements" */
        AchievementPublicList: {
            /** @description Game ID */
            id: string;
            /** @description Optional game name */
            name?: string;
            /** @description Optional game version */
            version?: string;
            /**
             * Format: double
             * @description Data block height (0 always valid)
             */
            block: number;
            /** @description CAIP-2 blockchain identifier */
            caip2: string;
            /** @description Optional date. ISO8601, like YYYY-MM-DDTHH:mm:ss.sssZ */
            time?: string;
            achievements: components["schemas"]["Achievement"][];
        };
        PlayerAchievement: {
            /** @description Unique Achievement String */
            name: string;
            /** @description Is Achievement completed */
            completed: boolean;
            /**
             * Format: date-time
             * @description Completed Date ISO8601 YYYY-MM-DDTHH:mm:ss.sssZ
             */
            completedDate?: string;
            /** @description If achievement has incremental progress */
            completedRate?: {
                /**
                 * Format: double
                 * @description Total Progress
                 */
                total: number;
                /**
                 * Format: double
                 * @description Current Progress
                 */
                progress: number;
            };
        };
        /** @description Result of "Get Completed Achievements" */
        PlayerAchievements: {
            /**
             * Format: double
             * @description Data block height (0 always valid)
             */
            block: number;
            /** @description CAIP-2 blockchain identifier */
            caip2: string;
            /** @description Optional date. ISO8601, like YYYY-MM-DDTHH:mm:ss.sssZ */
            time?: string;
            /** @description e.g. addr1234... or 0x1234... */
            wallet: string;
            /** @description (Optional) Wallet-type */
            walletType?: string;
            /** @description (Optional) User ID for a specific player account. This value should be
             *     immutable and define a specific account, as the wallet might be migrated
             *     or updated. */
            userId?: string;
            /** @description (Optional) Player display name */
            userName?: string;
            /**
             * Format: double
             * @description Total number of completed achievements for the game
             */
            completed: number;
            achievements: components["schemas"]["PlayerAchievement"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    DryRunGet: {
        parameters: {
            query: {
                gameInput: string;
                userAddress: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Result_DryRunResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
    VersionGet: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VersionString"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
        };
    };
    LatestProcessedBlockheightGet: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LatestProcessedBlockheightResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
        };
    };
    EmulatedBlockActiveGet: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmulatedBlockActiveResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
        };
    };
    DeploymentBlockheightToEmulatedGet: {
        parameters: {
            query: {
                deploymentBlockheight: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeploymentBlockheightToEmulatedResponse"];
                };
            };
        };
    };
    ConfirmInputAcceptanceGet: {
        parameters: {
            query: {
                gameInput: string;
                userAddress: string;
                blockHeight: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfirmInputAcceptanceResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
    TransactionCountBlockHeight: {
        parameters: {
            query: {
                blockHeight: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Result_TransactionCountResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
    TransactionCountGet: {
        parameters: {
            query: {
                address: string;
                blockHeight: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Result_TransactionCountResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
    TransactionContentBlockHeight: {
        parameters: {
            query: {
                blockHeight: number;
                txIndex: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Result_TransactionContentResponse_"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
    AchievementsPublic_list: {
        parameters: {
            query?: {
                category?: string;
                isActive?: boolean;
            };
            header?: {
                "Accept-Language"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AchievementPublicList"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
    AchievementsWallet: {
        parameters: {
            query?: {
                /** @description Comma-separated list. */
                name?: string;
            };
            header?: never;
            path: {
                wallet: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlayerAchievements"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
        };
    };
    AchievementsNft: {
        parameters: {
            query?: {
                name?: string;
            };
            header?: never;
            path: {
                erc: string;
                cde: string;
                token_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ok */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlayerAchievements"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidateErrorResult"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalServerErrorResult"];
                };
            };
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FailedResult"];
                };
            };
        };
    };
}
