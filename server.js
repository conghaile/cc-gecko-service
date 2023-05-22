import express from 'express';
import geckoHandler from './geckoHandler.js';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config()

const PORT = Number(process.env.PORT)
const app = express()
const redisClient = createClient()
redisClient.on('error', err => console.log('Redis Client Error', err))
await redisClient.connect()

app.use(cors())

app.get('/search', async (req, res) => {
    let coin = req.query.coin
    let handler = new geckoHandler(redisClient)
    let realCoin = await handler.search(coin)
    res.send(realCoin)
    
})

app.get('/price', async (req, res) => {
    let coin = req.query.coin
    let days = req.query.days
    let handler = new geckoHandler(redisClient)

    let prices = await handler.getPriceData(coin, days)
    
    res.send(prices)
})

app.get('/current-price', async (req, res) => {
    let coin = req.query.coin
    console.log(coin)
    let handler = new geckoHandler(redisClient)
    let price = await handler.getCurrentPrice(coin)
    res.send(price)

})


app.listen(PORT)
console.log('App running on port', PORT)