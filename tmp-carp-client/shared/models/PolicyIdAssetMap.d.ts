/**
 * @pattern [0-9a-fA-F]{56}
 * @example "b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f"
 */
export declare type PolicyId = string;
/**
 * @pattern [0-9a-fA-F]{0,64}
 * @example "42657272794e617679"
 */
export declare type AssetName = string;
/**
 * @pattern [0-9a-fA-F]*
 * @example "a365636f6c6f72672330303030383065696d616765783a697066733a2f2f697066732f516d534b593167317a5375506b3536635869324b38524e766961526b44485633505a756a7474663755676b343379646e616d656a4265727279204e617679"
 */
declare type Cip25Metadata = string;
export declare type PolicyIdAssetMapType = {
    /**
     * @example { "b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f": ["42657272794e617679"] }
     */
    assets: {
        [policyId: string]: AssetName[];
    };
};
export declare type Cip25Response = {
    /**
     * @example { "b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f": { "42657272794e617679": "a365636f6c6f72672330303030383065696d616765783a697066733a2f2f697066732f516d534b593167317a5375506b3536635869324b38524e766961526b44485633505a756a7474663755676b343379646e616d656a4265727279204e617679" }}
     */
    cip25: {
        [policyId: string]: {
            [assetName: string]: Cip25Metadata;
        };
    };
};
export declare type NativeAsset = [policyId: PolicyId, assetName: AssetName];
export {};
