import { Schema, model } from "mongoose"

const ChatSchema = new Schema({
    chat_id: {type: Number, required: true},
    chain: String,
    token: String,
    emoji: String,
    photo: {data: Buffer, contentType: String},
    gif: {data: Buffer, contentType: String},
    volume: Number,
    buys: [{
        holder: String,
        amount: Number,
        timestamp: String
    }]
})

export const ChatModel = model("Chat", ChatSchema)