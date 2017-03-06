import {expect} from 'chai'
import {createMockServer, generateToken, generateProfile} from './helper'
import {StaRHsAPIClient} from '../src'

/* global describe after it */

describe('updateAvatar()', () => {
  let mockServer
  after(done => mockServer.close(done))
  it('should send the avatar to server', done => {
    let profile
    const avatarPicture = new Buffer('1234', 'binary')

    mockServer = createMockServer({
      '^/avatarUpdate/Antarctica': (req, res) => {
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
          expect(payload.file).to.equal(new Buffer('1234', 'binary').toString('base64'))
          done()
        })
      }
    })
    mockServer.listen(61234)

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    profile = generateProfile(cli.endpoint, 'Antarctica')

    generateToken().then(token => {
      cli.updateAvatar(profile, avatarPicture.toString('base64'), token)
    })
  })
})
