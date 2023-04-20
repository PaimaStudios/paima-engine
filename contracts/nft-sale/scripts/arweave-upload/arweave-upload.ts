#!/usr/bin/env node

import { Command } from "commander";
import {
    appendImageUrl,
    checkStatus,
    createDrive,
    createManifest,
    createMetadataCollections,
    uploadFolder,
} from "./utils";

const program = new Command();
const arweave = program.command("arweave");

arweave
    .command("createDrive")
    .argument("<driveName>", "Name of new drive")
    .action(createDrive);

arweave
    .command("uploadFolder")
    .argument("<folderID>", "Folder ID to upload to")
    .argument("<folderName>", "Name of folder to upload")
    .action(uploadFolder);

arweave
    .command("createManifest")
    .argument("<folderID>", "Folder ID to upload to")
    .argument("<manifestName>", "Name of folder")
    .action(createManifest);

arweave
    .command("checkStatus")
    .argument("<bundleTxId>", "Bundle transaction ID")
    .action(checkStatus);

arweave
    .command("appendImageUrl")
    .argument("<folderName>", "Name of metadata folder")
    .argument("<manifestDataTxId>", "Manifest file data tx ID")
    .action(appendImageUrl);

arweave
    .command("createMetadataCollections")
    .argument("<folderName>", "Name of metadata folder")
    .action(createMetadataCollections);

program.parse();
