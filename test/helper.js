import {createServer} from 'http'
import {URIValue, EmailValue} from 'rheactor-value-objects'
import {JsonWebToken, Link} from 'rheactor-models'
import {expect} from 'chai'
import jwt from 'jsonwebtoken'
import Promise from 'bluebird'
import {Profile, StaRH} from 'starhs-models'

export function createMockServer (routes) {
  const server = createServer((req, res) => {
    if (req.url.match(/^\/index/)) {
      expect(req.method).to.equal('GET')
      expect(req.headers['content-type']).to.equal('application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8')
      res.writeHead(
        200,
        {
          'Content-Type': 'application/vnd.resourceful-humans.starhs.v1+json; charset=utf-8'
        }
      )
      res.end(JSON.stringify(
        {
          '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Index',
          '$links': [
            {
              '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Link',
              'subject': 'https://github.com/ResourcefulHumans/rheactor-models#Status',
              'href': 'http://127.0.0.1:61234/status'
            },
            {
              '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Link',
              'subject': 'https://tools.ietf.org/html/rfc7519',
              'href': 'http://127.0.0.1:61234/login'
            },
            {
              '$context': 'https://github.com/ResourcefulHumans/rheactor-models#Link',
              'subject': 'https://github.com/ResourcefulHumans/rheactor-models#User',
              'href': 'http://127.0.0.1:61234/newPassword',
              'rel': 'newPassword'
            }
          ]
        }
      ))
    }
    for (let r in routes) {
      const match = new RegExp(r)
      if (match.test(req.url)) {
        routes[r](req, res)
      }
    }
  })

  return {
    close: server.close.bind(server),
    listen: server.listen.bind(server),
    endpoint: new URIValue('http://127.0.0.1:61234/')
  }
}

export function generateToken () {
  return Promise.try(() => jwt.sign(
    {
      SessionToken: 'some-session-token'
    },
    'myapikey.apiuser.apipass',
    {
      algorithm: 'HS256',
      issuer: 'login',
      subject: 'some-user-name',
      expiresIn: 60 * 60
    }))
    .then(token => new JsonWebToken(token))
}

export function generateProfile (endpoint, username) {
  const profile = new Profile({
    $id: new URIValue(`${endpoint}/profile/${username}`),
    email: new EmailValue(`${username}@example.com`),
    firstname: username,
    lastname: 'Sample',
    organization: 'Resourceful Humans',
    avatar: new URIValue('http://starhs.net/profileimgs/')
  })
  profile.$links.push(new Link(new URIValue([endpoint, 'staRHs', username, 'shared'].join('/')), StaRH.$context, true, 'shared-staRHs'))
  profile.$links.push(new Link(new URIValue([endpoint, 'staRHs', username, 'received'].join('/')), StaRH.$context, true, 'received-staRHs'))
  profile.$links.push(new Link(new URIValue([endpoint, 'colleagues', username].join('/')), Profile.$context, true, 'colleagues'))
  profile.$links.push(new Link(new URIValue([endpoint, 'share'].join('/')), StaRH.$context, false, 'share-staRH'))
  profile.$links.push(new Link(new URIValue([endpoint, 'profileUpdate', username].join('/')), Profile.$context, false, 'update-profile'))
  profile.$links.push(new Link(new URIValue([endpoint, 'avatarUpdate', username].join('/')), Profile.$context, false, 'update-avatar'))
  return profile
}
