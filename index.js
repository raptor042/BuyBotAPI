import { Telegraf, Markup } from "telegraf"
import { config } from "dotenv"
import { addChat, connectDB, getChats, updateChatBuys, updateChatHolderAmount, updateChatToken } from "./__db__/index.js"
import { ethers } from "ethers"
import { chatExists, getAdmins, getHolder, getTimestamp, getToken, holderExists } from "./utils/index.js"

config()

const URL = process.env.TG_BOT_TOKEN

const bot = new Telegraf(URL)

bot.use(Telegraf.log())

bot.command("start",  async ctx => {
    try {
        if (ctx.message.chat.type == "private") {
            await ctx.replyWithHTML(
                `<b>Hello ${ctx.message.from.username} 👋, Welcome to the ChainD BuyBot 🤖.</b>\n\n<i>It provides blockchain powered trending insights on any token of your choice 🚀.</i>\n\n<b>To get started:</b>\n\n<i>✅ Start by sending your the name of your token's group chat ie: @abcd1234.</i>\n<i>✅ You proceed by sending your the token address ie: 0x23exb.....</i>`,
                {
                    parse_mode : "HTML",
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback("Click to get started 🚀", "start")]
                    ])
                }
            )
        } else {
            await ctx.replyWithHTML(`<b>🚨 This command is only used in private chats.</b>`)
        }
    } catch (err) {
        await ctx.replyWithHTML("<b>🚨 An error occured while using the bot.</b>")
        console.log(err)
    }
})

bot.action("start", async ctx => {
    try {
        await ctx.replyWithHTML(`<b>🔰 Enter the name of your token's group chat ie: @abcd1234.</b>`)
    } catch (err) {
        await ctx.replyWithHTML("<b>🚨 An error occured while using the bot.</b>")
        console.log(err)
    }
})

bot.hears(/^@/, async ctx => {
    try {
        const chat = await ctx.telegram.getChat(ctx.message.text)
        console.log(chat)

        const exists = await chatExists(chat.id)
        console.log(exists)

        if(exists) {
            await ctx.replyWithHTML(`<b>🚨 This group chat is already being monitored.</b>`)
        } else {
            const _chat = await addChat(
                ctx.message.from.username,
                ctx.message.from.id,
                chat.username,
                chat.id
            )
            
            console.log(_chat)

            await ctx.telegram.setChatDescription(ctx.message.from.id, chat.id)

            await ctx.replyWithHTML(`<b>🔰 Enter the name of your token's group chat ie: @abcd1234.</b>`)
        }
    } catch (err) {
        await ctx.replyWithHTML("<b>🚨 An error occured while using the bot.</b>")
        console.log(err)
    }
})

bot.hears(/^0x/, async ctx => {
    try {
        const chat = await ctx.telegram.getChat(ctx.message.from.id)
        console.log(chat)

        const _chat = await updateChatToken(chat.title, ctx.message.text)
        console.log(_chat)

        await ctx.replyWithHTML(`<b>Congratulations ${ctx.message.from.username} 🎉, You have successfully added the ChainD BuyBot to your token group chat. Get ready for super-powered trending insights 🚀.</b>`)

        await getBuys({ 
            token: ctx.message.text,
            chatId: chat.title,
            adminId: ctx.message.from.id
        })
    } catch (err) {
        await ctx.replyWithHTML("<b>🚨 An error occured while using the bot.</b>")
        console.log(err)
    }
})

const getBuys = async chat => {
    const token = new ethers.Contract(
        chat.token,
        PAIR_ERC20_ABI,
        getProvider()
    )

    token.on("Transfer", async (from, to, value, e) => {
        console.log(from, to, value, e)
        const name = await token.name()
        console.log(name)

        const supply = await token.totalSupply()
        console.log(ethers.formatEther(supply))

        const tokenInfo = await getToken(chat.token)
        console.log(tokenInfo)

        const exists = holderExists(chat.chatId, to)
        console.log(exists)

        let text = `${name} Buy!!!!\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀\n\n`

        if(exists) {
            const holder = await getHolder(chat.chatId, to)
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
                chat.adminId,
                chat.chatId,
                to,
                value
            )
            console.log(_chat)

            text += `💵 ${tokenInfo.pairs[0].priceNative * value} BNB ($${tokenInfo.pairs[0].priceUsd * value})\n🪙 ${value.toFixed()} ${name}\n📉 Position : ${priceChange}\n📈Market Cap : ${ethers.formatEther(supply) * tokenInfo.pairs[0].priceUsd}`
        } else {
            const timestamp = getTimestamp()
            console.log(holder, timestamp)

            const _chat = updateChatBuys(
                chat.adminId,
                chat.chatId,
                to,
                value,
                timestamp
            )
            console.log(_chat)

            text += `💵 ${tokenInfo.pairs[0].priceNative * value} BNB ($${tokenInfo.pairs[0].priceUsd * value})\n🪙 ${value.toFixed()} ${name}\n📉 New Holder\n📈Market Cap : ${ethers.formatEther(supply) * tokenInfo.pairs[0].priceUsd}`
        }

        await bot.telegram.sendMessage(chat.chatId, text)
    })
}

// const getBuys = async () => {
//     const chats = await getChats()
//     console.log(chats)

//     chats.forEach(async chat => {
//         const token = new ethers.Contract(
//             chat.token,
//             PAIR_ERC20_ABI,
//             getProvider()
//         )

//         token.on("Transfer", async (from, to, value, e) => {
//             console.log(from, to, value, e)
//             const name = await token.name()
//             console.log(name)

//             const supply = await token.totalSupply()
//             console.log(ethers.formatEther(supply))

//             const tokenInfo = await getToken(chat.token)
//             console.log(tokenInfo)

//             const exists = holderExists(chat.chatId, to)
//             console.log(exists)

//             let text = `${name} Buy!!!!\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀\n\n`

//             if(exists) {
//                 const holder = await getHolder(chat.chatId, to)
//                 const timestamp = getTimestamp()
//                 console.log(holder, timestamp)

//                 let priceChange = ""
//                 const timeDiff = timestamp - holder.timestamp
//                 console.log(timeDiff)

//                 if(timeDiff <= 300) {
//                     priceChange = tokenInfo.pairs[0].priceChange.m5
//                 } else if(timeDiff > 300 && timeDiff <= 3600) {
//                     priceChange = tokenInfo.pairs[0].priceChange.h1
//                 } else if(timeDiff > 3600 && timeDiff <= 21600) {
//                     priceChange = tokenInfo.pairs[0].priceChange.h6
//                 } else if(timeDiff > 19600 && timeDiff <= 86400) {
//                     priceChange = tokenInfo.pairs[0].priceChange.h24
//                 } else if(timeDiff > 86400) {
//                     priceChange = tokenInfo.pairs[0].priceChange.h24
//                 }

//                 console.log(priceChange)

//                 const _chat = updateChatHolderAmount(
//                     chat.adminId,
//                     chat.chatId,
//                     to,
//                     value
//                 )
//                 console.log(_chat)

//                 text += `💵 ${tokenInfo.pairs[0].priceNative * value} BNB ($${tokenInfo.pairs[0].priceUsd * value})\n🪙 ${value.toFixed()} ${name}\n📉 Position : ${priceChange}\n📈Market Cap : ${ethers.formatEther(supply) * tokenInfo.pairs[0].priceUsd}`
//             } else {
//                 const timestamp = getTimestamp()
//                 console.log(holder, timestamp)

//                 const _chat = updateChatBuys(
//                     chat.adminId,
//                     chat.chatId,
//                     to,
//                     value,
//                     timestamp
//                 )
//                 console.log(_chat)

//                 text += `💵 ${tokenInfo.pairs[0].priceNative * value} BNB ($${tokenInfo.pairs[0].priceUsd * value})\n🪙 ${value.toFixed()} ${name}\n📉 New Holder\n📈Market Cap : ${ethers.formatEther(supply) * tokenInfo.pairs[0].priceUsd}`
//             }

//             await bot.telegram.sendMessage(chat.chatId, text)
//         })
//     })
// }

connectDB()

// setTimeout(getBuys, 1000*30)

bot.launch()

process.once("SIGINT", () => bot.stop("SIGINT"))

process.once("SIGTERM", () => bot.stop("SIGTERM"))