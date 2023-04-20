import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

export default async (opts = options) => {
    if (mongoose.connection.readyState === 1) return;
    if (mongoose.connection.readyState === 0) {
        mongoose
            .connect(process.env.MONGODB_URL!, {
                serverSelectionTimeoutMS: 5000,
            })
            .catch(err => console.log(err.reason));
    }
};

mongoose.connection.on("connected", async () => {
    console.log("Connected to mongodb");
});

mongoose.connection.on("error", e => {
    console.log(e.message);
});

mongoose.connection.on("disconnected", () => {
    console.log("Disconnected from mongodb");
});
