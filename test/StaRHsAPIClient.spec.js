import {expect} from 'chai'
import {createMockServer} from './helper'
import {StaRHsAPIClient} from '../src'
import {URIValue} from 'rheactor-value-objects'
import {HttpProblem} from 'rheactor-models'

/* global describe afterEach it */

describe('StaRHsAPIClient', () => {
  let mockServer
  afterEach(done => mockServer.close(done))

  describe('fetch()', () => {
    it('should return an empty result if status code 204 is returned from the API', done => {
      mockServer = createMockServer({
        '.*': (req, res) => {
          expect(req.method).to.equal('POST')
          expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
          res.writeHead(
            204,
            {
              'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
            }
          )
          res.end()
        }
      })
      mockServer.listen(61234)

      const cli = new StaRHsAPIClient(mockServer.endpoint)
      cli.fetch('POST', new URIValue(`${mockServer.endpoint}/foo`)).then(response => {
        expect(response).to.equal(undefined)
        done()
      })
    })
  })

  it('should throw an exception if the request fails', done => {
    mockServer = createMockServer({
      '.*': (req, res) => {
        res.writeHead(500)
        res.end('foo')
      }
    })
    mockServer.listen(61234)
    const cli = new StaRHsAPIClient(mockServer.endpoint)
    cli.fetch('POST', new URIValue(mockServer.endpoint))
      .catch(err => {
        expect(HttpProblem.is(err)).to.equal(true)
        expect(err.title).to.equal('Malformed server response!')
        expect(err.status).to.equal(500)
        expect(err.detail).to.equal('"foo"')
        done()
      })
  })

  it('should accept content-types without charset', done => {
    mockServer = createMockServer({
      '.*': (req, res) => {
        expect(req.method).to.equal('GET')
        expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
        res.writeHead(
          200,
          {
            'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json'
          }
        )
        res.end(JSON.stringify({foo: 'bar'}))
      }
    })
    mockServer.listen(61234)

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    cli.get(new URIValue(mockServer.endpoint)).then(response => {
      expect(response).to.deep.equal({foo: 'bar'})
      done()
    })
  })
})
