import { Telegraf } from "telegraf"
import { config } from "dotenv"
import { connectDB, getChats, updateChatBuys, updateChatHolderAmount } from "./__db__/index.js"
import { ethers } from "ethers"
import { getHolder, getTimestamp, getToken, holderExists } from "./utils/index.js"
import { PAIR_ERC20_ABI } from "./__web3__/config.js"
import { getProvider } from "./__web3__/init.js"

config()

const URL = process.env.TG_BOT_TOKEN

const bot = new Telegraf(URL)

bot.use(Telegraf.log())

const getBuys = async () => {
    const chats = await getChats()
    console.log(chats)

    chats.forEach(async chat => {
        const token = new ethers.Contract(
            chat.token,
            PAIR_ERC20_ABI.abi,
            getProvider()
        )

        token.on("Transfer", async (from, to, value, e) => {
            console.log(from, to, value)
            const name = await token.name()
            console.log(name)

            const supply = await token.totalSupply()
            console.log(ethers.formatEther(supply))

            const tokenInfo = await getToken(chat.token)
            // console.log(tokenInfo)

            const _holder = holderExists(chat.chat_id, to)
            console.log(_holder > 0)

            let text = `${name} Buy!!!!\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀\n\n`

            if(_holder > 0) {
                const holder = await getHolder(chat.chat_id, to)
                const timestamp = getTimestamp()
                console.log(holder, timestamp)

                let priceChange = ""
                const timeDiff = timestamp - holder.timestamp
                console.log(timeDiff)

                if(timeDiff <= 300) {
                    priceChange = tokenInfo.pairs[0].priceChange.m5
                } else if(timeDiff > 300 && timeDiff <= 3600) {
                    priceChange = tokenInfo.pairs[0].priceChange.h1
                } else if(timeDiff > 3600 && timeDiff <= 21600) {
                    priceChange = tokenInfo.pairs[0].priceChange.h6
                } else if(timeDiff > 19600 && timeDiff <= 86400) {
                    priceChange = tokenInfo.pairs[0].priceChange.h24
                } else if(timeDiff > 86400) {
                    priceChange = tokenInfo.pairs[0].priceChange.h24
                }

                console.log(priceChange)

                const _chat = updateChatHolderAmount(
                    chat.chat_id,
                    to,
                    Number(ethers.formatEther(value)).toFixed(2)
                )
                console.log(_chat)

                text += `💵 ${Number(tokenInfo.pairs[0].priceNative * ethers.formatEther(value)).toFixed(18)} BNB ($${Number(tokenInfo.pairs[0].priceUsd * ethers.formatEther(value)).toFixed(18)})\n\n🪙 ${Number(ethers.formatEther(value)).toFixed(18)} ${name}\n\n📉 Position : ${priceChange}\n\n📈Market Cap : $${Number(Number(ethers.formatEther(supply) * tokenInfo.pairs[0].priceUsd)).toLocaleString()}`
            } else {
                const timestamp = getTimestamp()
                console.log(timestamp)

                const _chat = updateChatBuys(
                    chat.chat_id,
                    to,
                    Number(ethers.formatEther(value)).toFixed(18),
                    timestamp
                )
                console.log(_chat)

                text += `💵 ${Number(tokenInfo.pairs[0].priceNative * ethers.formatEther(value)).toFixed(18)} BNB ($${Number(tokenInfo.pairs[0].priceUsd * ethers.formatEther(value)).toFixed(18)})\n\n🪙 ${Number(ethers.formatEther(value)).toFixed(18)} ${name}\n\n📉 New Holder\n\n📈Market Cap : $${Number(Number(ethers.formatEther(supply) * tokenInfo.pairs[0].priceUsd)).toLocaleString()}`
            }

            try {
                await bot.telegram.sendMessage(chat.chat_id, text)
            } catch (error) {
                console.log(error)

                setTimeout(() => {
                    bot.telegram.sendMessage(chat.chat_id, text)
                }, 1000*10);
            }
        })
    })
}

connectDB()

setInterval(getBuys, 1000*30)