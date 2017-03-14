import {expect} from 'chai'
import {createMockServer, generateToken} from './helper'
import {StaRHsAPIClient} from '../src'
import {StaRHmap} from 'starhs-models'

/* global describe after it */

const mapData = {
  '$context': 'https://github.com/ResourcefulHumans/staRHs-models#StaRHmap',
  '$contextVersion': 1,
  'nodes': [
    {
      'id': '0b8ffafb-8656-46f4-ab0e-23d81c6b6f6d',
      'label': 'Thomas Reichert',
      'features': {
        'Abteilung': '1',
        'Geschlecht': '2',
        'Alter': '3'
      }
    },
    {
      'id': '1d70ff1a-d5c9-4edf-b383-35a0074462c3',
      'label': 'Angela Maus',
      'role': 'Partner'
    },
    {
      'id': '1b71e7a5-122b-489a-9def-e43cfba32adf',
      'label': 'Heiko Fischer',
      'role': 'Associate',
      'features': {
        'Abteilung': 'Research and Development',
        'Geschlecht': 'Männlich',
        'Alter': '30 - 40'
      }
    }
  ],
  'edges': [
    {
      'id': 'e0',
      'source': 'f95b687b-5896-4a27-b30c-2d2c5cccab9e',
      'target': '1d70ff1a-d5c9-4edf-b383-35a0074462c3',
      'size': 2,
      'date': '2017-3-2T18:54:00'
    },
    {
      'id': 'e1',
      'source': 'f95b687b-5896-4a27-b30c-2d2c5cccab9e',
      'target': 'f5e5f697-7fe5-40bc-8ce9-439f222b16dd',
      'size': 2,
      'date': '2017-3-2T18:53:00'
    },
    {
      'id': 'e2',
      'source': 'f95b687b-5896-4a27-b30c-2d2c5cccab9e',
      'target': '1b71e7a5-122b-489a-9def-e43cfba32adf',
      'size': 2,
      'date': '2017-3-2T18:56:00'
    }
  ]
}

describe('staRHmap()', () => {
  let mockServer
  let token

  after(done => mockServer.close(done))
  it('should return the staRHmap', done => {
    mockServer = createMockServer({
      '^/staRHmap$': (req, res) => {
        expect(req.method).to.equal('POST')
        expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
        expect(req.headers['authorization']).to.equal(`Bearer ${token.token}`)
        res.writeHead(
          200,
          {
            'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
          }
        )
        res.end(JSON.stringify(mapData))
      }
    })
    mockServer.listen(61234)

    const cli = new StaRHsAPIClient(mockServer.endpoint)
    generateToken().then(t => {
      token = t
      cli.staRHmap(token, new Date(), new Date()).then(map => {
        expect(map).to.be.instanceof(StaRHmap)
        expect(map.edges.length).to.equal(3)
        expect(map.nodes.length).to.equal(3)
        expect(map.nodes[0].label).to.equal('Thomas Reichert')
        expect(map.nodes[0].features).to.deep.equal({'Abteilung': '1', 'Geschlecht': '2', 'Alter': '3'})
        done()
      })
    })
  })
})
