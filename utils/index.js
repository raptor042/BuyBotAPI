import { 
    getChat
} from "../__db__/index.js"
import { config } from "dotenv"

config()

const token = process.env.TG_BOT_TOKEN

export const chatExists = async chatId => {
    const chat = await getChat(chatId)
    console.log(chat)

    return chat ? true : false
}

export const holderExists = async (chatId, holder) => {
    const chat = await getChat(chatId)
    console.log(chat)

    const _holder = chat.buys.filter(buy => buy.holder == holder)
    console.log(_holder)

    return _holder.length > 0 ? true : false
}

export const getHolder = async (chatId, holder) => {
    const chat = await getChat(chatId)
    console.log(chat)

    const _holder = chat.buys.filter(buy => buy.holder == holder)
    console.log(_holder)

    return _holder[0]
}

export const getToken = async token => {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`)
    const data = await response.json()
    
    return data
}

export const getTimestamp = () => {
    const date = new Date()
    const timestamp = date.getSeconds()

    return timestamp
}

export const getAdmins = async chatId => {
    const response = await fetch(`https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=${chatId}`)
    const data = await response.json()
    
    return data
}