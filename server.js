// const express = require('express');
// const bodyParser = require('body-parser');
// const pm = require('./puppetMaster')

import express from 'express';
import bodyParser from 'body-parser';
import puppetMaster from './puppetMaster.js';
import { createClient } from 'redis';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config()

const PORT = Number(process.env.PORT)
const app = express()
const client = createClient()
client.on('error', err => console.log('Redis Client Error', err))
await client.connect()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

app.get('/search', async (req, res) => {
    let coin = req.query.coin
    console.log("queried coin:", coin)
    let master = new puppetMaster(client)
    let realCoin = await master.search(coin)
    if (realCoin !== null) {
        res.send({
            "Real coin": realCoin
        })
    } else {
        res.send({
            "Real coin": "Not found"
        })
    }
    
})

app.get('/price', async (req, res) => {
    let coin = req.query.coin
    let days = req.query.days
    let master = new puppetMaster({
        'coin': coin,
        'days': days,
        'client': client
    })

    let prices = await master.getPrice()
    
    res.send(prices)
})

app.get('/cachetest', async (req, res) => {
    res.send(searchCache)
})

app.listen(PORT)
console.log('App running on port', PORT)