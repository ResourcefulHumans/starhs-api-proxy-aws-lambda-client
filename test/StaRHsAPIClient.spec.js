import {expect} from 'chai'
import {createMockServer} from './helper'
import {StaRHsAPIClient} from '../src'
import {URIValue} from 'rheactor-value-objects'

/* global describe after it */

describe('StaRHsAPIClient', () => {
  describe('fetch()', () => {
    let mockServer
    after(done => mockServer.close(done))
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
})
