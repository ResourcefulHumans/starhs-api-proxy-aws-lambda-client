import {expect} from 'chai'
import {createMockServer, generateToken, generateProfile} from './helper'
import {StaRHsAPIClient} from '../src'

/* global describe after it */

describe('share()', () => {
  let mockServer
  after(done => mockServer.close(done))
  it('should send the correct stringified payload to server', done => {
    let toID
    const message = 'Share some starhs'
    const starhAmount = 5

    mockServer = createMockServer({
      '^/share$': (req, res) => {
        expect(req.method).to.equal('POST')
        expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
        res.writeHead(
          200,
          {
            'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
          }
        )
        const body = []
        req.on('data', (chunk) => {
          body.push(chunk)
        }).on('end', () => {
          res.end(JSON.stringify({}))
          const payload = JSON.parse(Buffer.concat(body).toString())
          expect(payload.to).to.equal(toID)
          expect(payload.message).to.equal(message)
          expect(payload.amount).to.equal(starhAmount)
          done()
        })
      }
    })
    mockServer.listen(61234)

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    const from = generateProfile(cli.endpoint, 'antartica')
    const to = generateProfile(cli.endpoint, 'artica')
    toID = to.$id.toString()
    generateToken().then(token => {
      cli.share(token, from, to, message, starhAmount)
    })
  })
})
