import { Schema, model } from "mongoose"

const GroupSchema = new Schema({
    chatId: Number,
    chat: String,
    token: String,
    adminId: Number,
    admin: String
})

export const GroupModel = model("Group", GroupSchema)