import {expect} from 'chai'
import {createMockServer} from './helper'
import {StaRHsAPIClient} from '../src'
import {Status} from 'rheactor-models'

/* global describe after it */

describe('status()', () => {
  let mockServer
  after(done => mockServer.close(done))
  it('should return the status', done => {
    mockServer = createMockServer({
      '^/status$': (req, res) => {
        expect(req.method).to.equal('POST')
        expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
        res.writeHead(
          200,
          {
            'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
          }
        )
        res.end(JSON.stringify(
          {
            'status': 'ok',
            'time': '2017-01-09T07:20:47.727Z',
            'version': '1.8.1+production.1483709840850',
            '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Status'
          }
        ))
      }
    })
    mockServer.listen(61234)

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    cli.status().then(status => {
      expect(status).to.be.instanceof(Status)
      expect(status.status).to.equal('ok')
      expect(status.version).to.equal('1.8.1+production.1483709840850')
      expect(status.time.getTime()).to.equal(new Date('2017-01-09T07:20:47.727Z').getTime())
      done()
    })
  })
})
