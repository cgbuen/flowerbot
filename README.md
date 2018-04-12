# Flower Bot

Crawl the 1800Flowers site to exercise the prerender.io cache. Uses
node-crawler.

## Installation

`npm install` or `yarn install`

## Execution

### Commands

From 1800flowers-pwa directory

    node cache-exerciser [environment] [ua] [debug]

From this directory

    node index.js [environment] [ua] [debug]

### Examples

    node index.js www 
    node index.js m.www 
    node index.js pwa.www moov-prerender-cache-exerciser
    node index.js pwastage2.www Twitterbot/1.0 debug
