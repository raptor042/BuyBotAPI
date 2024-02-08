import { Schema, model } from "mongoose"

const ChatSchema = new Schema({
    adminId: {type: Number, required: true},
    admin: String,
    chatId: {type: Number, required: true},
    chat: String,
    token: String,
    buys: [{
        holder: String,
        amount: Number,
        timestamp: String
    }]
})

export const ChatModel = model("Chat", ChatSchema)