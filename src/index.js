/* globals fetch */
import {polyfill as es6promisePolyfill} from 'es6-promise'
import 'isomorphic-fetch'
import {URIValue, URIValueType} from 'rheactor-value-objects'
import {memoize} from 'lodash'
import {Promise} from 'bluebird'
import {StaRH, StaRHsStatus, Profile, ProfileType, StaRHmap} from 'starhs-models'
import {Link, LinkType, Status, List, JsonWebToken, JsonWebTokenType, HttpProblem, User} from 'rheactor-models'
import {String as StringType, Object as ObjectType, Number as NumberType, maybe, Date as DateType} from 'tcomb'

es6promisePolyfill()

const MaybeObjectType = maybe(ObjectType)
const MaybeJsonWebTokenType = maybe(JsonWebTokenType)
const MIME_TYPE = 'application/vnd.resourceful-humans.starhs.v1+json'
const CONTENT_TYPE = MIME_TYPE + '; charset=utf-8'

export class StaRHsAPIClient {
  constructor (endpoint) {
    URIValueType(endpoint)
    this.endpoint = endpoint.slashless()
  }

  get (uri) {
    return this.fetch('GET', uri)
  }

  post (uri, data, token) {
    return this.fetch('POST', uri, data, token)
  }

  /**
   * @param {String} method
   * @param {URIValue} uri
   * @param {Object} data
   * @param {JsonWebToken} token
   * @returns {Promise.<Object>}
   * @throws {HttpProblem}
   */
  fetch (method, uri, data, token) {
    StringType(method)
    URIValueType(uri)
    MaybeObjectType(data)
    MaybeJsonWebTokenType(token)
    const opts = {
      method: method,
      headers: {
        'Content-Type': CONTENT_TYPE,
        'Accept': MIME_TYPE
      }
    }
    if (data) opts.body = JSON.stringify(data)
    if (token) opts.headers.Authorization = 'Bearer ' + token.token
    return Promise
      .try(() => fetch(uri.toString(), opts)
        .catch(err => {
          throw new HttpProblem(
            new URIValue('https://github.com/ResourcefulHumans/starhs-api-proxy-aws-lambda-client#fetchError'),
            `${method} ${uri.toString()}: ${err.message}`,
            500
          )
        })
      )
      .then(response => {
        if (response.status === 204) return
        const responseContentType = response.headers.get('Content-Type')
        if (!responseContentType || responseContentType.toLowerCase().indexOf(MIME_TYPE.toLowerCase()) !== 0) {
          return response.text().then(text => {
            throw new HttpProblem(
              new URIValue('https://github.com/ResourcefulHumans/starhs-api-proxy-aws-lambda-client#fetchError'),
              'Malformed server response!',
              response.status,
              JSON.stringify(text)
            )
          })
        }
        return response.json()
          .then(data => {
            if (response.status >= 400) {
              const {type, title, status, detail} = data
              throw new HttpProblem(new URIValue(type), title, status, detail)
            }
            return data
          })
      })
  }

  /**
   * @returns {Promise.<Array.<Link>>}
   */
  index () {
    return memoize(() => this.get(new URIValue(this.endpoint.toString() + '/index?t=' + Date.now()))
      .then(data => Promise.resolve(data.$links).map(data => Link.fromJSON(data)))
    )()
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise.<Array.<JsonWebToken, Profile>>}
   */
  login (username, password) {
    StringType(username)
    StringType(password)
    const tokenContext = new URIValue(JsonWebToken.$context)
    return this.index()
      .filter(link => link.subject.equals(tokenContext))
      .spread(loginLink => this
        .post(
          loginLink.href,
        {
          username,
          password
        }
        )
        .then(data => Promise.resolve(data.$links).map(data => Link.fromJSON(data))
          .then(links => {
            const token = new JsonWebToken(data.token.token, links)
            return Promise
                .join(
                  token,
                  Promise.resolve(links.filter(link => link.subject.equals(Profile.$context))).spread(profileLink => this.post(profileLink.href, {}, token).then(data => Profile.fromJSON(data)))
                )
          }
          )
        )
      )
  }

  /**
   * Share a starh
   * @param {JsonWebToken} token
   * @param {Profile} from
   * @param {Profile} to
   * @param {string} message
   * @param {number} amount
   */
  share (token, from, to, message, amount) {
    JsonWebTokenType(token)
    ProfileType(from)
    ProfileType(to)
    StringType(message)
    NumberType(amount)
    const data = {
      to: to.$id.toString(),
      message,
      amount
    }
    return this.post(from.$links.filter(link => link.subject.equals(StaRH.$context) && link.rel === 'share-staRH')[0].href, data, token)
  }

  /**
   * @param {JsonWebToken} token
   * @returns {Promise.<StaRHsStatus>}
   */
  staRHsStatus (token) {
    JsonWebTokenType(token)
    return this.post(token.$links.filter(link => link.subject.equals(StaRHsStatus.$context))[0].href, {}, token)
      .then(data => StaRHsStatus.fromJSON(data))
  }

  /**
   * TODO: Implement pagination
   * @param {Profile} profile
   * @param {JsonWebToken} token
   * @returns {Promise.<Array.<Profile>>}
   */
  colleagues (profile, token) {
    ProfileType(profile)
    JsonWebTokenType(token)
    return this.post(profile.$links.filter(link => link.subject.equals(Profile.$context))[0].href, {}, token)
      .then(response => response.items)
      .map(data => Profile.fromJSON(data))
  }

  /**
   * @returns {Promise.<Status>}
   */
  status () {
    return this.index()
      .filter(link => link.subject.equals(Status.$context))
      .spread(statusLink => this.post(statusLink.href))
      .then(data => Status.fromJSON(data))
  }

  /**
   * Returns the received staRHs
   *
   * @param {Profile} profile
   * @param {JsonWebToken} token
   * @returns {Promise.<List>}
   */
  received (profile, token) {
    ProfileType(profile)
    JsonWebTokenType(token)
    return this.fetchList(profile.$links.filter(link => link.subject.equals(StaRH.$context) && link.rel === 'received-staRHs' && link.list)[0], token)
  }

  /**
   * Returns the shared staRHs
   *
   * @param {Profile} profile
   * @param {JsonWebToken} token
   * @returns {Promise.<List>}
   */
  shared (profile, token) {
    ProfileType(profile)
    JsonWebTokenType(token)
    return this.fetchList(profile.$links.filter(link => link.subject.equals(StaRH.$context) && link.rel === 'shared-staRHs' && link.list)[0], token)
  }

  /**
   * Fetches the list for the given link
   * @param {Link} link
   * @param {JsonWebToken} token
   * @returns {Promise.<List>}
   */
  fetchList (link, token) {
    LinkType(link)
    JsonWebTokenType(token)
    return this.post(link.href, {}, token)
      .then(data => List.fromJSON(data, staRHdata => StaRH.fromJSON(staRHdata))) // NOTE: currently only staRHs list is implemented
  }

  /**
   * Update the users profile with the data given in profile
   *
   * @param {Profile} profile
   * @param {JsonWebToken} token
   * @returns {Promise}
   */
  updateProfile (profile, token) {
    ProfileType(profile)
    JsonWebTokenType(token)
    return this.post(profile.$links.filter(link => link.rel === 'update-profile')[0].href, profile.toJSON(), token)
  }

  /**
   * Returns the profile for the given ID
   *
   * @param {URIValue} id
   * @param {JsonWebToken} token
   * @returns {Promise}
   */
  profile (id, token) {
    URIValueType(id)
    JsonWebTokenType(token)
    return this.post(id, undefined, token).then(response => Profile.fromJSON(response))
  }

  /**
   * Update the user's profile picture
   *
   * @param {Profile} profile
   * @param {ArrayBuffer} picture Data of the image, base64 encoded
   * @param {JsonWebToken} token
   * @returns {Promise}
   */
  updateAvatar (profile, picture, token) {
    ProfileType(profile)
    StringType(picture)
    JsonWebTokenType(token)
    return this.post(profile.$links.filter(link => link.rel === 'update-avatar')[0].href, {file: picture}, token)
  }

  /**
   * @param {string} username
   * @returns {Promise.<Object>}
   */
  newPassword (username) {
    StringType(username)
    return this.index()
      .filter(link => link.subject.equals(User.$context) && link.rel === 'newPassword')
      .spread(passwordLink => this.post(passwordLink.href, {username}))
  }

  /**
   * @param {JsonWebToken} token
   * @param {string} oldPassword
   * @param {string} newPassword
   * @returns {Promise.<Object>}
   */
  setNewPassword (token, oldPassword, newPassword) {
    JsonWebTokenType(token)
    StringType(oldPassword)
    StringType(newPassword)
    return this.index()
      .filter(link => link.subject.equals(User.$context) && link.rel === 'setNewPassword')
      .spread(link => this.post(link.href, {oldPassword, newPassword}, token))
  }

  /**
   * @param {JsonWebToken} token
   * @param {Date} start
   * @param {Date} end
   * @returns {Promise.<StaRHmap>}
   */
  staRHmap (token, start, end) {
    JsonWebTokenType(token)
    DateType(start)
    DateType(end)
    return this.index()
      .filter(link => link.subject.equals(StaRHmap.$context))
      .spread(link => this.post(link.href, {start: start.toISOString(), end: end.toISOString()}, token))
      .then(response => StaRHmap.fromJSON(response))
  }
}
