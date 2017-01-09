import {createServer} from 'http'
import {URIValue} from 'rheactor-value-objects'
import {expect} from 'chai'

export function createMockServer (routes) {
  const server = createServer((req, res) => {
    if (req.url.match(/^\/index/)) {
      expect(req.method).to.equal('GET')
      expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
      res.writeHead(
        200,
        {
          'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
        }
      )
      res.end(JSON.stringify(
        {
          '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Index',
          '$links': [
            {
              '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Link',
              'subject': 'https://github.com/ResourcefulHumans/rheactor-models#Status',
              'href': 'http://127.0.0.1:61234/status'
            },
            {
              '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Link',
              'subject': 'https://tools.ietf.org/html/rfc7519',
              'href': 'http://127.0.0.1:61234/login'
            }
          ]
        }
      ))
    }
    for (let r in routes) {
      const match = new RegExp(r)
      if (match.test(req.url)) {
        routes[r](req, res)
      }
    }
  })

  server.listen(61234)

  return {
    close: server.close.bind(server),
    endpoint: new URIValue('http://127.0.0.1:61234/')
  }
}
