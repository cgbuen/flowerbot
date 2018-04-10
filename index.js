let environment = process.argv[2]
let ua = process.argv[3] || "moov-prerender-cache-exerciser"
let debug = process.argv[4]

let Crawler = require("crawler")

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

let callbackOuter = c => {
  return (error, res, done) => {
    let $ = res.$
    if (error) {
      console.log(error, res.request.uri.href, res.options && res.options.uri)
    } else if ($) {
      debug && console.log("==>", res.options.uri)
      let queue = [];
      $("a[href^='/']").each(function() {
        let path = $(this).attr("href")
        if (!path.startsWith("//")) {
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
          debug && cache[host + path].depth > 3 && cache[host + path].referers.push(res.request.uri.path)
        }
      })
      c.queue(queue)
    } else {
      debug && console.log("==> ERR: Could not initialize Cheerio for", res.request.uri.href, res.options && res.options.uri)
    }
    done()
  }
}

c.queue([{
  uri: host + '/',
  callback: callbackOuter(c)
}])

c.on("drain", () => {
  console.log(`Crawl complete. ${Object.keys(cache).length} total pages crawled.`)
  debug && console.log(`\nCrawl cache:\n${JSON.stringify(cache)}`)
})
