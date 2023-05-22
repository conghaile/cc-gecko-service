import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
const GECKOROOT = process.env.GECKOROOT

class geckoHandler{
    constructor(redisClient) {
        this.client = redisClient
    }

    async search(coin) {
        let result
        let redisResult = await this.client.get(coin)
        if (redisResult !== null) {
            result = redisResult == "No results" ? redisResult : JSON.parse(redisResult)
        } else {
            try {
                let res = await axios.get(`${GECKOROOT}/search?query=${coin}&x_cg_pro_api_key=${process.env.CGKEY}`)
                let coins = res.data.coins
                if (coins.length > 0) {
                        result = {
                        "id": coins[0].id,
                        "name": coins[0].name,
                        "symbol": coins[0].symbol
                    }
                    await this.client.set(coin, JSON.stringify(result))
                } else {
                    result = "No results"
                    await this.client.set(coin, result)

                } 
            } catch (error) {
                if (error.response) {
                    result = error.response.status
                }
            }
        }
        
        return result
        
    }

    async getCurrentPrice(coin) {
        let result
        let redisResult = await this.client.get(`${coin}price`)
        if (redisResult !== null) {
            result = redisResult
        } else {
            try {
                let res = await axios.get(`${GECKOROOT}/simple/price?ids=${coin}&vs_currencies=usd&x_cg_pro_api_key=${process.env.CGKEY}`)
                result = String(res.data[coin].usd)
                this.client.set(`${coin}price`, result, {
                    EX: 300
                })
            } catch (error) {
                result = error.response.status
            }
        }

        return result
    }

    async getPriceData(coin, days) {
        let result
        let redisResult = await this.client.get(`${coin}${days}`)
        if (redisResult !== null) {
            result = JSON.parse(redisResult)
        } else {
            try {
                let res = await axios.get(`${GECKOROOT}/coins/${coin}/market_chart?vs_currency=usd&days=${days}&x_cg_pro_api_key=${process.env.CGKEY}`)
                result = res.data.prices
                this.client.set(`${coin}${days}`, JSON.stringify(result), {
                    EX: 300
                })
            } catch (error) {
                result = error.response.status
            }
        }
        return result
    }
}



export default geckoHandler