import { 
    getChat
} from "../__db__/index.js"

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

    return _holder.length
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
    const timestamp = date.getTime() / 1000

    return timestamp
}