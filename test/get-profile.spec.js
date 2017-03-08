import {expect} from 'chai'
import {createMockServer, generateToken, generateProfile} from './helper'
import {StaRHsAPIClient} from '../src'
import Promise from 'bluebird'

/* global describe afterEach it */

describe('profile()', () => {
  let mockServer
  afterEach(done => mockServer.close(done))
  it('should fetch the profile from the server', () => {
    let profile
    let token

    let requestOk
    let requestPromise = new Promise((resolve, reject) => {
      requestOk = resolve
    })
    let responseOk
    let responsePromise = new Promise((resolve, reject) => {
      responseOk = resolve
    })

    mockServer = createMockServer({
      '^/profile/Antarctica$': (req, res) => {
        expect(req.method).to.equal('POST')
        expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
        expect(req.headers['authorization']).to.equal(`Bearer ${token.token}`)
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
          expect(body.join('')).to.equal('')
          res.end(JSON.stringify(profile))
          requestOk()
        })
      }
    })
    mockServer.listen(61234)

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    profile = generateProfile(cli.endpoint, 'Antarctica')

    generateToken().then(t => {
      token = t
      cli.profile(profile.$id, t)
        .then(p => {
          expect(p.$id.toString()).to.equal(profile.$id.toString())
          responseOk()
        })
    })

    return Promise.join(requestPromise, responsePromise)
  })
})
