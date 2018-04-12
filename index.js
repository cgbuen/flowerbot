let environment = process.argv[2]
let ua = process.argv[3] || "moov-prerender-cache-exerciser"
let debug = process.argv[4]

let Crawler = require("crawler")
let { padStart } = require("lodash")

let host = `https://${environment}.1800flowers.com`
let cache = {
  [host + "/"]: {
    depth: 1,
    referers: []
  }
}
let options = {
  userAgent: ua,
  maxConnections: 10,
  retryTimeout: 1
}
let c = new Crawler(options)

let exclusions = [
  "//",
  "/faq",
  "/sitemap-1800flowers",
  "/blog",
  "/wedding",
  "/international-flower-delivery",
  "/flower-clubs"
]

let callbackOuter = c => {
  return (error, res, done) => {
    let $ = res.$
    if (error) {
      console.log(error, res.request.uri.href, res.options && res.options.uri)
    } else if ($) {
      debug && console.log("==>", res.options.uri)
      let queue = [];
      $("a[href^='/']").each(function() {
        let $this = $(this)
        let path = $this.attr("href")
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


const startTime = new Date();
console.log(`--> ${padStart(startTime.getUTCHours(), 2, 0)}:${padStart(startTime.getUTCMinutes(), 2, 0)}:${padStart(startTime.getUTCSeconds(), 2, 0)} Starting crawl.`);
c.queue([{
  uri: host + '/',
  callback: callbackOuter(c)
}])

c.on("drain", () => {
  const endTime = new Date();
  console.log(`--> ${padStart(endTime.getUTCHours(), 2, 0)}:${padStart(endTime.getUTCMinutes(), 2, 0)}:${padStart(endTime.getUTCSeconds(), 2, 0)} Crawl complete. ${Object.keys(cache).length} total pages crawled. Took ${(endTime - startTime)/1000} seconds to complete.`);
  debug && console.log(`\nCrawl cache:\n${JSON.stringify(cache)}`)
})
