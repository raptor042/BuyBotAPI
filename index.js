import { Telegraf } from "telegraf"
import { config } from "dotenv"
import { connectDB, getChat, getChats, getChatsViaVolume, updateChatBuys, updateChatHolderAmount } from "./__db__/index.js"
import { ethers } from "ethers"
import { format, getHolder, getTimestamp, getToken, holderExists } from "./utils/index.js"
import { PAIR_ERC20_ABI } from "./__web3__/config.js"
import { getProvider } from "./__web3__/init.js"

import fs from "fs"

config()

const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

const BSC_TRENDING = process.env.BSC_TRENDING

const ETH_TRENDING = process.env.ETH_TRENDING

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
            getProvider(chat.chain)
        )

        token.on("Transfer", async (from, to, value, e) => {
            console.log(chat.chain)
            console.log(from, to, value)
            const name = await token.name()
            console.log(name)

            const decimals = await token.decimals()
            console.log(decimals)

            const supply = await token.totalSupply()
            console.log(format(supply, decimals))

            const tokenInfo = await getToken(chat.token)
            // console.log(tokenInfo)

            const _holder = holderExists(chat.chat_id, to)
            console.log(_holder > 0)

            let text = `${name} Buy!!!!\n`

            if(chat.emoji) {
                for(let i = 0; i < 36; i++) {
                    text += `${chat.emoji}`
                }
            } else {
                for(let i = 0; i < 36; i++) {
                    text += `🟢`
                }
            }

            text += "\n\n"

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

                await updateChatHolderAmount(
                    chat.chat_id,
                    to,
                    format(value, decimals)
                )

                text += `💵 ${Number(tokenInfo.pairs[0].priceNative * format(value, decimals))} ${chat.chain == "bsc" ? "BNB" : "ETH"} ($${Number(tokenInfo.pairs[0].priceUsd * format(value, decimals))})\n\n🪙 ${format(value, decimals).toLocaleString()} ${name}\n\n📉 Position : ${priceChange}\n\n📈Market Cap : $${Number(format(supply, decimals) * tokenInfo.pairs[0].priceUsd).toLocaleString()}`
            } else {
                const timestamp = getTimestamp()
                console.log(timestamp)

                await updateChatBuys(
                    chat.chat_id,
                    to,
                    format(value, decimals),
                    timestamp
                )

                text += `💵 ${Number(tokenInfo.pairs[0].priceNative * format(value, decimals))} ${chat.chain == "bsc" ? "BNB" : "ETH"} ($${Number(tokenInfo.pairs[0].priceUsd * format(value, decimals))})\n\n🪙 ${format(value, decimals).toLocaleString()} ${name}\n\n📉 New Holder\n\n📈Market Cap : $${Number(format(supply, decimals) * tokenInfo.pairs[0].priceUsd).toLocaleString()}`
            }

            if(chat.photo) {
                try {
                    await bot.telegram.sendPhoto(chat.chat_id, chat.photo, {
                        caption: text
                    })
                } catch (error) {
                    console.log(error)
    
                    setTimeout(() => {
                        bot.telegram.sendPhoto(chat.chat_id, chat.photo, {
                            caption: text
                        })
                    }, 1000*10);
                }
            } else if(chat.gif) {
                try {
                    await bot.telegram.sendAnimation(chat.chat_id, chat.gif, {
                        caption: text
                    })
                } catch (error) {
                    console.log(error)
    
                    setTimeout(() => {
                        bot.telegram.sendAnimation(chat.chat_id, chat.gif, {
                            caption: text
                        })
                    }, 1000*10);
                }
            } else {
                try {
                    await bot.telegram.sendMessage(chat.chat_id, text)
                } catch (error) {
                    console.log(error)
    
                    setTimeout(() => {
                        bot.telegram.sendMessage(chat.chat_id, text)
                    }, 1000*10);
                }
            }
        })
    })
}

const trending = async (chain) => {
    const chats = await getChatsViaVolume(chain)
    console.log(chats)

    let text = chain == "bsc" ? "BSC TRENDING (LIVE)\n\n" : "ETH TRENDING (LIVE)\n\n"

    chats.forEach(async (chat, index) => {
        const token = new ethers.Contract(
            chat.token,
            PAIR_ERC20_ABI.abi,
            getProvider(chat.chain)
        )

        const name = await token.name()
        console.log(name)

        const tokenInfo = await getToken(chat.token)
        // console.log(tokenInfo)

        if(tokenInfo.pairs == null) {
            text += `${emojis[index]} ${name} | Nil | Nil\n`
        } else {
            text += `${emojis[index]} ${name} | $${Number(tokenInfo.pairs[0].volume.h24).toLocaleString()} | ${tokenInfo.pairs[0].priceChange.h24}\n`
        }

        token.on("Transfer", async (from, to, value, e) => {
            console.log(chat.chain)
            console.log(from, to, value)
            const name = await token.name()
            console.log(name)

            const decimals = await token.decimals()
            console.log(decimals)

            const supply = await token.totalSupply()
            console.log(format(supply, decimals))

            const tokenInfo = await getToken(chat.token)
            // console.log(tokenInfo)

            const _holder = holderExists(chat.chat_id, to)
            console.log(_holder > 0)

            let text = `${name} Buy!!!!\n`

            if(chat.emoji) {
                for(let i = 0; i < 36; i++) {
                    text += `${chat.emoji}`
                }
            } else {
                for(let i = 0; i < 36; i++) {
                    text += `🟢`
                }
            }

            text += "\n\n"

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

                await updateChatHolderAmount(
                    chat.chat_id,
                    to,
                    format(value, decimals)
                )

                text += `💵 ${Number(tokenInfo.pairs[0].priceNative * format(value, decimals))} ${chat.chain == "bsc" ? "BNB" : "ETH"} ($${Number(tokenInfo.pairs[0].priceUsd * format(value, decimals))})\n\n🪙 ${format(value, decimals).toLocaleString()} ${name}\n\n📉 Position : ${priceChange}\n\n📈Market Cap : $${Number(Number(format(supply, decimals) * tokenInfo.pairs[0].priceUsd).toFixed(2)).toLocaleString()}`
            } else {
                const timestamp = getTimestamp()
                console.log(timestamp)

                await updateChatBuys(
                    chat.chat_id,
                    to,
                    format(value, decimals),
                    timestamp
                )

                text += `💵 ${Number(tokenInfo.pairs[0].priceNative * format(value, decimals))} ${chat.chain == "bsc" ? "BNB" : "ETH"} ($${Number(tokenInfo.pairs[0].priceUsd * format(value, decimals))})\n\n🪙 ${format(value, decimals).toLocaleString()} ${name}\n\n📉 New Holder\n\n📈Market Cap : $${Number(Number(format(supply, decimals) * tokenInfo.pairs[0].priceUsd).toFixed(2)).toLocaleString()}`
            }

            if(chain == "bsc") {
                if(chat.photo) {
                    try {
                        await bot.telegram.sendPhoto(Number(BSC_TRENDING), chat.photo, {
                            caption: text
                        })
                    } catch (error) {
                        console.log(error)
        
                        setTimeout(() => {
                            bot.telegram.sendPhoto(Number(BSC_TRENDING), chat.photo, {
                                caption: text
                            })
                        }, 1000*10);
                    }
                } else if(chat.gif) {
                    try {
                        await bot.telegram.sendAnimation(Number(BSC_TRENDING), chat.gif, {
                            caption: text
                        })
                    } catch (error) {
                        console.log(error)
        
                        setTimeout(() => {
                            bot.telegram.sendAnimation(Number(BSC_TRENDING), chat.gif, {
                                caption: text
                            })
                        }, 1000*10);
                    }
                } else {
                    try {
                        await bot.telegram.sendMessage(Number(BSC_TRENDING), text)
                    } catch (error) {
                        console.log(error)
        
                        setTimeout(() => {
                            bot.telegram.sendMessage(Number(BSC_TRENDING), text)
                        }, 1000*10);
                    }
                }
            } else {
                if(chat.photo) {
                    try {
                        await bot.telegram.sendPhoto(Number(ETH_TRENDING), chat.photo, {
                            caption: text
                        })
                    } catch (error) {
                        console.log(error)
        
                        setTimeout(() => {
                            bot.telegram.sendPhoto(Number(ETH_TRENDING), chat.photo, {
                                caption: text
                            })
                        }, 1000*10);
                    }
                } else if(chat.gif) {
                    try {
                        await bot.telegram.sendAnimation(Number(ETH_TRENDING), chat.gif, {
                            caption: text
                        })
                    } catch (error) {
                        console.log(error)
        
                        setTimeout(() => {
                            bot.telegram.sendAnimation(Number(ETH_TRENDING), chat.gif, {
                                caption: text
                            })
                        }, 1000*10);
                    }
                } else {
                    try {
                        await bot.telegram.sendMessage(Number(ETH_TRENDING), text)
                    } catch (error) {
                        console.log(error)
        
                        setTimeout(() => {
                            bot.telegram.sendMessage(Number(ETH_TRENDING), text)
                        }, 1000*10);
                    }
                }
            }
        })
        
        if(index == chats.length - 1) {
            text += "\nAutomatically updates Trending every 30 seconds"

            if(chain == "bsc") {
                try {
                    await bot.telegram.sendMessage(Number(BSC_TRENDING), text)
                } catch (error) {
                    console.log(error)
    
                    setTimeout(() => {
                        bot.telegram.sendMessage(Number(BSC_TRENDING), text)
                    }, 1000*5);
                }
            } else {
                try {
                    await bot.telegram.sendMessage(Number(ETH_TRENDING), text)
                } catch (error) {
                    console.log(error)
    
                    setTimeout(() => {
                        bot.telegram.sendMessage(Number(ETH_TRENDING), text)
                    }, 1000*5);
                }
            }
        }
    })
}

connectDB()

// const mCAP = async (token, chain) => {
//     const token_ca = new ethers.Contract(
//         token,
//         PAIR_ERC20_ABI.abi,
//         getProvider(chain)
//     )

//     const name = await token_ca.name()
//     console.log(name)

//     const decimals = await token_ca.decimals()
//     console.log(decimals)

//     const supply = await token_ca.totalSupply()
//     console.log(format(supply, decimals))

//     const tokenInfo = await getToken(token)
//     console.log(tokenInfo.pairs[0].priceUsd)

//     console.log(Number(format(supply, decimals) * tokenInfo.pairs[0].priceUsd))
// }

// mCAP("0x6ec07DbD9311975b8002079d70C6F6d9E3e1EE5C", "bsc")

setTimeout(() => {
    getBuys()

    setInterval(getBuys, 1000*60*5)
}, 1000)

setInterval(() => {
    trending("bsc")

    setTimeout(() => {
        trending("eth")
    }, 1000*2)
}, 1000*30)