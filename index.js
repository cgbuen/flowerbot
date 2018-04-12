const environment = process.argv[2]
const ua = process.argv[3] || "moov-prerender-cache-exerciser"
const debug = process.argv[4]

const Crawler = require("crawler")

const host = `https://${environment}.1800flowers.com`
const cache = {
  [host + "/"]: {
    depth: 1,
    referers: []
  }
}
const options = {
  userAgent: ua,
  maxConnections: 10,
  retryTimeout: 1
}
const c = new Crawler(options)

const exclusions = [
  "//",
  "/faq",
  "/sitemap-1800flowers",
  "/blog",
  "/wedding",
  "/international-flower-delivery",
  "/flower-clubs"
]

const callbackOuter = c => {
  return (error, res, done) => {
    const $ = res.$
    if (error) {
      console.log(error, res.request.uri.href, res.options && res.options.uri)
    } else if ($) {
      debug && console.log("==>", res.options.uri)
      const queue = []
      $("a[href^='/']").each(function() {
        const path = $(this).attr("href")
        if (!exclusions.reduce((acc, cv) => path.startsWith(cv) || acc, false)) {
          if (!cache[host + path]) {
            try {
              cache[host + path] = {
                depth: cache[res.options.uri].depth + 1,
                referers: []
              }
              queue.push({
                uri: host + path,
                callback: callbackOuter(c)
              })
            } catch (e) {
              console.log(`ERR: ${host + path} not added to crawl queue`)
              console.log(e)
              debug && console.log(cache)
            }
          }
          debug && cache[host + path].depth > 2 && cache[host + path].referers.push(res.request.uri.path)
        }
      })
      c.queue(queue)
    } else {
      debug && console.log("==> ERR: Could not initialize Cheerio for", res.request.uri.href, res.options && res.options.uri)
    }
    done()
  }
}


const startTime = new Date()
console.log(`--> ${startTime.toUTCString()} Starting crawl.`)
c.queue([{
  uri: host + '/',
  callback: callbackOuter(c)
}])

c.on("drain", () => {
  const endTime = new Date()
  console.log(`--> ${endTime.toUTCString()} Crawl complete. ${Object.keys(cache).length} total pages crawled. Took ${(endTime - startTime)/1000} seconds to complete.`)
  debug && console.log(`\nCrawl cache:\n${JSON.stringify(cache)}`)
})
