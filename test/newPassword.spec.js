import {expect} from 'chai'
import {createMockServer} from './helper'
import {StaRHsAPIClient} from '../src'
import {HttpProblem, HttpProblemType} from 'rheactor-models'
import {URIValue} from 'rheactor-value-objects'

/* global describe after before it */

describe('newPassword()', () => {
  const validUsername = 'sample@user.com'
  const invalidUsername = 'wrong@user.com'
  const mockServer = createMockServer({
    '^/newPassword$': (req, res) => {
      expect(req.method).to.equal('POST')
      expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')

      const body = []
      req.on('data', (chunk) => {
        body.push(chunk)
      }).on('end', () => {
        const payload = JSON.parse(Buffer.concat(body).toString())

        if (payload.username === validUsername) {
          expect(payload.username).to.equal(validUsername)
          res.writeHead(200, {'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'})
          res.end(JSON.stringify({ 'Message': 'A new Password has been send' }))
        } else {
          expect(payload.username).to.equal(invalidUsername)
          res.writeHead(403, {'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'})
          res.end(JSON.stringify(
            {
              '$context': 'https://www.ietf.org/id/draft-ietf-appsawg-http-problem-01.txt',
              'type': 'https://github.com/ResourcefulHumans/starhs-api-proxy-aws-lambda#Forbidden',
              'title': 'Username not found',
              'status': 403,
              'detail': '{\'Message\':\'Fehler\',\'ExceptionMessage\':\'Username not found\',\'ExceptionType\':\'System.Exception\',\'StackTrace\':null}'
            }
        ))
        }
      })
    }
  })
  before(() => mockServer.listen(61234))
  after(done => mockServer.close(done))

  it('should reset the password', done => {
    const cli = new StaRHsAPIClient(mockServer.endpoint)
    cli.newPassword(validUsername).then(() => done())
  })

  it('should thrown an exception on unknown username', done => {
    const cli = new StaRHsAPIClient(mockServer.endpoint)
    cli.newPassword(invalidUsername).catch(err => {
      HttpProblemType(err)
      expect(err).to.be.instanceof(HttpProblem)
      expect(err.status).to.equal(403)
      expect(err.type.equals(new URIValue('https://github.com/ResourcefulHumans/starhs-api-proxy-aws-lambda#Forbidden'))).to.equal(true)
      expect(err.title).to.equal('Username not found')
      expect(err.detail).to.equal('{\'Message\':\'Fehler\',\'ExceptionMessage\':\'Username not found\',\'ExceptionType\':\'System.Exception\',\'StackTrace\':null}')
      done()
    })
  })
})
