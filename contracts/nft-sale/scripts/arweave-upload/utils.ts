import { arDriveFactory, EID, readJWKFile } from "ardrive-core-js";
import Arweave from "arweave";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import db from "./db";
import { MetadataDoc, MetadataModel } from "./metadataModel";

const myWallet = readJWKFile(path.join(__dirname, "./arweave-keyfile.json"));

const arDrive = arDriveFactory({ wallet: myWallet });

const BASE_URI = "https://arweave.net";

export const createDrive = (driveName: string) => {
    const result = execSync(
        `ardrive create-drive --wallet-file arweave-keyfile.json --drive-name ${driveName}`
    );

    const createDriveResult = JSON.parse(result.toString());
    const bundleTxID = createDriveResult?.created[0]?.bundledIn?.valueOf();
    const folderID = createDriveResult?.created[1]?.entityId?.valueOf();

    console.log({ bundleTxID, folderID });
};

export const uploadFolder = async (folderID: string, folderName: string) => {
    const result = execSync(
        `ardrive upload-file --local-paths ${folderName} --parent-folder-id ${folderID} -w arweave-keyfile.json`
    );

    const uploadFolderResult = JSON.parse(result.toString());

    console.log({
        bundleTxID:
            uploadFolderResult.created[
                uploadFolderResult.created.length - 1
            ].bundleTxId?.valueOf(),
        folderID: uploadFolderResult.created[0].entityId?.valueOf(),
    });
};

export const createManifest = async (
    folderID: string,
    manifestName: string
) => {
    const uploadResult = await arDrive.uploadPublicManifest({
        folderId: EID(folderID),
        destManifestName: manifestName,
    });

    console.log({ bundleTxID: uploadResult.created[0].bundledIn?.valueOf() });
};

export const checkStatus = async (bundleTxId: string) => {
    const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
    });

    console.log(await arweave.transactions.getStatus(bundleTxId!));
};

export const appendImageUrl = async (
    folderName: string,
    manifestDataTxId: string
) => {
    fs.readdir(path.join(__dirname, folderName), (err, files) => {
        if (err) {
            console.log(`Failed to load all files: ${err.message}`);
            return;
        } else {
            for (const file of files) {
                try {
                    const filePath = path.join(
                        __dirname,
                        `${folderName}/${file}`
                    );

                    const tokenId = file.split(".")[0];
                    const uri = `${BASE_URI}/${manifestDataTxId}/${tokenId}.jpg`;
                    const readFile = fs.readFileSync(filePath, {
                        encoding: "utf8",
                    });
                    const metadata = JSON.parse(readFile);

                    metadata["image"] = uri;
                    fs.writeFileSync(
                        filePath,
                        JSON.stringify(metadata, null, "    ")
                    );
                    console.log(`Appended {image: ${uri}} to ${file}`);
                } catch (err) {
                    console.log(`Failed to read ${file}: ${err}`);
                }
            }
        }
    });
};

export const createMetadataCollections = async (folderName: string) => {
    await db();

    const files = fs.readdirSync(path.join(__dirname, folderName));
    let readFiles: MetadataDoc[] = [];
    let unreadFiles: string[] = [];

    console.log("Creating collections...");

    for (const file of files) {
        const tokenId = Number(file.split(".")[0]);
        if (isNaN(tokenId)) continue;

        const filePath = path.join(__dirname, folderName, file);
        let rawData = fs.readFileSync(filePath, { encoding: "utf8" });
        console.log("filePath:: ", filePath);

        if (rawData === "" && Number.isInteger(tokenId)) {
            unreadFiles.push(`${tokenId}.json`);
            continue;
        }

        const parsedMetadata = JSON.parse(rawData);

        readFiles.push({
            tokenId,
            ...parsedMetadata,
            status: "UNMINTED",
        });
    }

    readFiles.sort((a, b) =>
        a.tokenId > b.tokenId ? 1 : b.tokenId > a.tokenId ? -1 : 0
    );

    MetadataModel.insertMany(readFiles)
        .then(() =>
            console.log(
                `Sucessfully created ${readFiles.length} metadata collections`
            )
        )
        .catch(err => {
            console.error(`Failed to create ${readFiles.length} collections`);
            throw err;
        });

    console.log("Checking if Metadata collections is sorted...");

    const allMetadata = await MetadataModel.find({});

    isSortedFn(allMetadata) == true
        ? console.log("Collections Metadata is sorted")
        : console.log("Collections Metadata is not sorted");
};

const isSortedFn = (arr: any[]) => {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i].tokenId < arr[i - 1].tokenId) {
            return false;
        }
    }
    return true;
};
