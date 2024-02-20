import { connect } from "mongoose"
import { ChatModel } from "./models/index.js"
import { config } from "dotenv"

config()

const URI = process.env.MONGO_URI

export const connectDB = async () => {
    try {
        await connect(`${URI}`)
        console.log("Connection to the Database was successful.")
    } catch(err) {
        console.log(err)
    }
}

export const getChat = async (chat_id) => {
    try {
        const chat = await ChatModel.findOne({ chat_id })
        return chat
    } catch (err) {
        console.log(err)
    }
}

export const getChats = async () => {
    try {
        const chats = await ChatModel.find()
        return chats
    } catch (err) {
        console.log(err)
    }
}

export const getChatsViaVolume = async chain => {
    try {
        const chats = await ChatModel.find({ chain }).sort({ volume: -1 }).limit(20)
        return chats
    } catch (err) {
        console.log(err)
    }
}

export const updateChatBuys = async (chat_id, holder, amount, timestamp) => {
    try {
        const buy = {
            holder,
            amount,
            timestamp
        }
        const chat = await ChatModel.findOneAndUpdate(
            { chat_id },
            { $push : { buys : [buy] } }
        )

        return chat
    } catch (err) {
        console.log(err)
    }
}

export const updateChatHolderAmount = async (chat_id, holder, amount) => {
    try {
        const chat = await ChatModel.findOneAndUpdate(
            { chat_id, buys : { $elemMatch : { holder } } },
            { $inc : { "buys.$.amount" : amount } }
        )

        return chat
    } catch (err) {
        console.log(err)
    }
}