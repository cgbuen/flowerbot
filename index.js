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
    if (error) {
      console.log(error, res.request.uri.href)
    } else {
      if (debug) {
        console.log("==>", res.request.uri.href)
      }
      let $ = res.$
      if ($) {
        $("a[href^='/']").each(function() {
          let path = $(this).attr("href")
          if (!path.startsWith("//")) {
            if (!cache[host + path]) {
              c.queue([{
                uri: host + path,
                callback: callbackOuter(c)
              }])
              try {
                cache[host + path] = {
                  depth: cache[res.request.uri.href].depth + 1,
                  referers: []
                }
              } catch (e) {
                console.log(e)
                if (debug) {
                  console.log(cache)
                }
              }
            }
            if (debug && cache[host + path].depth > 3) {
              cache[host + path].referers.push(res.request.uri.path)
            }
          }
        })
      }
    }
    done()
  }
}

c.queue([{
  uri: host + '/',
  callback: callbackOuter(c)
}])

c.on("drain", () => {
  console.log(`Cache exercising complete. ${Object.keys(cache).length} total pages crawled.`)
  if (debug) {
    console.log(JSON.stringify(cache))
  }
})
