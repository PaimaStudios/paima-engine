import mongoose from "mongoose";

export type Attribute = {
    traitType: string;
    value: string;
};

export interface MetadataDoc {
    tokenId: number;
    description: string;
    external_url: string;
    image: string;
    name: string;
    attributes: Attribute[];
    status: string;
}

const Schema = new mongoose.Schema<MetadataDoc>(
    {
        tokenId: {
            type: Number,
        },
        description: {
            type: String,
        },
        external_url: {
            type: String,
        },
        image: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["MINTED", "UNMINTED", "BURNED"],
            default: "UNMINTED",
        },
        attributes: [],
    },
    { timestamps: true }
);

export const MetadataModel = mongoose.model<MetadataDoc>(
    "MetadataModel",
    Schema
);
