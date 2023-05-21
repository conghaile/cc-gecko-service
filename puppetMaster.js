import { response } from 'express';
import puppeteer from 'puppeteer';

class puppetMaster{
    constructor(args) {
        this.client = args
    }

    async search(coin) {

            
        let result = await this.client.get(coin)
        if (result) {
            return result
        }
        
        const browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--disable-gpu",
            ],
            headless: false
        })
        
        const page = await browser.newPage()
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            if (req.resourceType() === 'image') {
                req.abort()
            } else {
                req.continue()
            }
        })

        await page.goto('https://coingecko.com')
        await page.waitForSelector('div[data-action^="click->search#showSearchPopup"]')

        await page.click('div[data-action^="click->search#showSearchPopup"]')
        await page.type('input[data-target^="search.input search.searchInput"]', coin)
        await page.waitForResponse(`https://api.coingecko.com/api/v3/search/geckoterminal_tokens?query=${coin.replace(' ', '%20')}`)
        console.log("Searched")
        console.log(`Searching for ${coin}`)
        const url = await page.evaluate((coin) => {
            let results = document.querySelectorAll('span.tw-pr-3')
            if (results.length > 0) {
                results = document.querySelectorAll('li > a')
                let re = new RegExp("^" + coin + "\\s|\\(" + coin + "\\)")
                let matchHref = ""
                for (let i = 0; i < results.length; i++) {
                    if (re.test(results[i].innerText)) {
                        matchHref = results[i].href
                        break
                    }
                }
                if (matchHref !== "") {
                    return matchHref
                } else {
                    return null
                }
            } else {
                return null
            }
            
        }, coin)

        await browser.close()
        
        if (url !== undefined && url !== null) {
            console.log(url)
            let realCoin = url.split(/id=|&type=coin/)[1]
            console.log(realCoin)
            return realCoin
        }
        return null
        
    }

    async getPrice() {
        const client = this.data.client
        const coin = this.data.coin
        const days = this.data.days

        let coinPriceKey = coin + "_" + days
        let result = await client.get(coinPriceKey)
        if (!result) {
            console.log(coinPriceKey, "not found")
            let coinUrlKey = coin + "_" + days + "_url"
            let result = await client.get(coinUrlKey)
            if (!result) {
                console.log(coinUrlKey, "not found")
                const browser = await puppeteer.launch({
                    args: [
                        "--no-sandbox",
                        '--disable-gpu'
                    ],
                    headless: false
                })
                const page = await browser.newPage()
                await page.setRequestInterception(true)
                page.on('request', req => {
                    if (req.resourceType === 'image') {
                        req.abort()
                    } else {
                        req.continue()
                    }
                })

                await page.goto(`https://coingecko.com/en/coins/${coin}`)
                const priceUrls = await page.evaluate(() => {
                    let urls = []
                    document.querySelectorAll('a[data-graph-stats-url^="https://www.coingecko.com/price_charts"]')
                        .forEach(button => urls.push(button.getAttribute('data-graph-stats-url')))
                    return urls
                })

                const urlKeys = [
                    "24_hours",
                    "7_days",
                    "14_days",
                    "30_days",
                    "90_days",
                    "180_days",
                    "365_days",
                    "max"
                ]

                await browser.close()

                for (let i = 0; i < priceUrls.length; i++) {
                    let urlKey = coin + "_" + urlKeys[i] + "_url"
                    await client.set(urlKey, priceUrls[i])
                }

                result = await client.get(coinUrlKey)
                
                // await page.goto(`https://coingecko.com/en/coins/${coin}`)
                // const [response] = await Promise.all([
                //     page.waitForResponse(res => res.url().includes('usd/max.json'))
                // ])
                // await client.set(coinUrlKey, response.url())
                // result = response.url()
                // await browser.close()



            }
            const browser = await puppeteer.launch({
                args: [
                    "--no-sandbox",
                    '--disable-gpu'
                ],
                headless: false
            })
            console.log(result)
            const page = await browser.newPage()
            await page.setRequestInterception(true)
            page.on('request', req => {
                if (req.resourceType === 'image') {
                    req.abort()
                } else {
                    req.continue()
                }
            })
            await page.goto(result)
            wait(1000)
            await page.content()
            let priceJson = await page.evaluate(() => {
                return JSON.parse(document.querySelector("body").innerText)
            })
            await browser.close()
            await client.set(coinPriceKey, JSON.stringify(priceJson["stats"]), {EX: 1800, NX: true})
            this.searchResults = priceJson["stats"]
            return this.searchResults
        }
        this.searchResults = JSON.parse(result)
        return this.searchResults
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default puppetMaster