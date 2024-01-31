import { ethers } from "ethers"
import { 
    getGroup
} from "../__db__/index.js"

export const groupExists = async chatId => {
    const group = await getGroup(chatId)
    console.log(group)

    return group ? true : false
}