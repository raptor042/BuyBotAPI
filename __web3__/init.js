import { ethers } from "ethers"
import { config } from "dotenv"

config()

export const getProvider = chain => {
    return chain == "bsc" ? 
            new ethers.JsonRpcProvider(process.env.BSC_API_URL) :
            new ethers.JsonRpcProvider(process.env.ETH_API_URL)
}