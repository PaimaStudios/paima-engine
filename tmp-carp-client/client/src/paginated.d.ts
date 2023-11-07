import type { EndpointTypes } from "./index";
import { Routes } from "./index";
import type { Pagination } from "../../shared/models/common";
import type cml from "@dcspark/cardano-multiplatform-lib-nodejs";
/**
 * If you don't mind using axios,
 * you can use the paginated endpoints provided by the client
 * However this endpoint allows you to pass in your own querying library
 */
export declare function paginateQuery<T extends Pagination, Response>(initialRequest: T, query: (request: T) => Promise<Response[]>, pageFromResponse: (resp: undefined | Response) => Pagination["after"]): Promise<Response[]>;
export declare function paginatedTransactionHistory(urlBase: string, initialRequest: Omit<EndpointTypes[Routes.transactionHistory]["input"], "after">): Promise<EndpointTypes[Routes.transactionHistory]["response"]>;
export declare function paginatedMetadataNft(urlBase: string, request: EndpointTypes[Routes.metadataNft]["input"]): Promise<EndpointTypes[Routes.metadataNft]["response"]>;
export declare function nftCborToJson(request: EndpointTypes[Routes.metadataNft]["response"], cmlTransactioMetadatum: typeof cml.TransactionMetadatum, decode_metadatum_to_json_str: typeof cml.decode_metadatum_to_json_str, conversionType: cml.MetadataJsonSchema): EndpointTypes[Routes.metadataNft]["response"];
