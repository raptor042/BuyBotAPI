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

export const getChat = async (adminId = null, chatId = null) => {
    try {
        const chat = adminId ? await ChatModel.findOne({ adminId }) : await ChatModel.findOne({ chatId })
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

export const addChat = async (adminId, admin, chatId, chat) => {
    try {
        const chat = new ChatModel({
            admin,
            adminId,
            chat,
            chatId,
            buys: []
        })

        const data = await chat.save()
        return data
    } catch (err) {
        console.log(err)
    }
}

export const updateChatToken = async (adminId, chatId, token) => {
    try {
        const chat = await ChatModel.findOneAndUpdate({ adminId, chatId }, { $set: { token } })
        return chat
    } catch (err) {
        console.log(err)
    }
}

export const updateChatBuys = async (adminId, chatId, holder, amount, timestamp) => {
    try {
        const buy = {
            holder,
            amount,
            timestamp
        }
        const chat = await ChatModel.findOneAndUpdate(
            { adminId, chatId },
            { $push : { buys : [buy] } }
        )

        return chat
    } catch (err) {
        console.log(err)
    }
}

export const updateChatHolderAmount = async (adminId, chatId, holder, amount) => {
    try {
        const chat = await ChatModel.findOneAndUpdate(
            { adminId, chatId, buys : { $elemMatch : { holder } } },
            { $inc : { "buys.$.amount" : amount } }
        )

        return chat
    } catch (err) {
        console.log(err)
    }
}