import { connect } from "mongoose"
import { GroupModel } from "./models/index.js"
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

export const getGroup = async chatId => {
    try {
        const group = await GroupModel.findOne({ chatId })
        return group
    } catch (err) {
        console.log(err)
    }
}

export const getGroups = async () => {
    try {
        const groups = await GroupModel.find()
        return groups
    } catch (err) {
        console.log(err)
    }
}

export const addGroup = async (chatId, chat, adminId, admin) => {
    try {
        const group = new GroupModel({
            chatId,
            chat
        })

        const data = await group.save()
        return data
    } catch (err) {
        console.log(err)
    }
}

export const addGroupToken = async (chatId, token) => {
    try {
        const user = await GroupModel.findOneAndUpdate({ chatId }, { $set: { token } })
        return user
    } catch (err) {
        console.log(err)
    }
}