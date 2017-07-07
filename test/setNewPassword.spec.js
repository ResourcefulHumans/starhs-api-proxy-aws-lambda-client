import {expect} from 'chai'
import {createMockServer, generateToken} from './helper'
import {StaRHsAPIClient} from '../src'

/* global describe after it */

describe('setNewPassword()', () => {
  let mockServer
  after(done => mockServer.close(done))
  it('should send the correct stringified payload to server', done => {
    const oldPassword = '1234'
    const newPassword = '12345678'

    mockServer = createMockServer({
      '^/setNewPassword$': (req, res) => {
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
          expect(payload.oldPassword).to.equal(oldPassword)
          expect(payload.newPassword).to.equal(newPassword)
          done()
        })
      }
    })
    mockServer.listen(61234)

    const client = new StaRHsAPIClient(mockServer.endpoint)
    generateToken().then(token => {
      client.setNewPassword(token, oldPassword, newPassword)
    })
  })
})
