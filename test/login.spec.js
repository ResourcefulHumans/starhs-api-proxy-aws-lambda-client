import {expect} from 'chai'
import {createMockServer} from './helper'
import {StaRHsAPIClient} from '../src'
import {HttpProblem, HttpProblemType} from 'rheactor-models'
import {URIValue} from 'rheactor-value-objects'

/* global describe after it */

describe('login()', () => {
  let mockServer
  after(done => mockServer.close(done))
  it('should thrown an exception on login failed', done => {
    mockServer = createMockServer({
      '^/login$': (req, res) => {
        expect(req.method).to.equal('POST')
        expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
        res.writeHead(
          403,
          {
            'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
          }
        )
        res.end(JSON.stringify(
          {
            '$context': 'https://www.ietf.org/id/draft-ietf-appsawg-http-problem-01.txt',
            'type': 'https://github.com/ResourcefulHumans/starhs-api-proxy-aws-lambda#Forbidden',
            'title': 'Login credentials wrong! Generation of Session failed',
            'status': 403,
            'detail': '{\'Message\':\'Fehler\',\'ExceptionMessage\':\'Login credentials wrong! Generation of Session failed\',\'ExceptionType\':\'System.Exception\',\'StackTrace\':null}'
          }
        ))
      }
    })

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    cli.login('foo', 'bar').catch(err => {
      HttpProblemType(err)
      expect(err).to.be.instanceof(HttpProblem)
      expect(err.status).to.equal(403)
      expect(err.type.equals(new URIValue('https://github.com/ResourcefulHumans/starhs-api-proxy-aws-lambda#Forbidden'))).to.equal(true)
      expect(err.title).to.equal('Login credentials wrong! Generation of Session failed')
      expect(err.detail).to.equal('{\'Message\':\'Fehler\',\'ExceptionMessage\':\'Login credentials wrong! Generation of Session failed\',\'ExceptionType\':\'System.Exception\',\'StackTrace\':null}')
      done()
    })
  })
})
