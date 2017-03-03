import {expect} from 'chai'
import {createMockServer, generateToken, generateProfile} from './helper'
import {StaRHsAPIClient} from '../src'

/* global describe after it */

describe('updateProfile()', () => {
  let mockServer
  after(done => mockServer.close(done))
  it('should send the profile to server', done => {
    let profile

    mockServer = createMockServer({
      '^/profileUpdate/Antarctica': (req, res) => {
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
          expect(payload.$id).to.equal(profile.$id.toString())
          done()
        })
      }
    })

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    profile = generateProfile(cli.endpoint, 'Antarctica')

    generateToken().then(token => {
      cli.updateProfile(profile, token)
    })
  })
})
