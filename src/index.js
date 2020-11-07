const axios = require('axios')
const snakeCase = require('snakecase-keys')
const camelCase = require('camelcase-keys')
const { createHash, randomBytes } = require('crypto')

const baseHeaders = {
  'Content-Type': 'application/json', 
  'Accept': 'application/json'
}

const checkoutSignKeys = [
  "amount", 
  "currency", 
  "externalId"
]

const withdrawalSignKeys = [
  "amount", 
  "currency", 
  "externalId", 
  "iban"
]

/**
 * @typedef HttpRequest
 * @param {'GET' | 'POST'} method
 * @param {object} [params]
 * @param {object} [headers]
 * @param {object} [data]
 * @param {string} url
 */

/**
 * Function to execute http requests
 * 
 * @name HttpClient
 * @function
 * @param {HttpRequest} conn 
 * @return {Promise<object>}
 */

/**
 * @typedef ClientOptions
 * @type {object}
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} [endpointUrl] - alternative API url, mostly useful for testing
 * @property {HttpClient} [httpClient] - client to use, defaults to `axios`
 */

/**
 * @typedef Checkout
 * @type {object}
 * @property {string} externalId
 */

 /**
  * @typedef LimitOffset
  * @param {limit} number
  * @param {offset} number
  */

 /**
 * @typedef Withdrawal
 * @type {object}
 * @property {string} externalId
 */

/**
 * @callback CreateCheckout
 * @param {Checkout} checkout
 * @return {Promise<Checkout>} 
 */

 /**
 * @callback ListCheckouts
 * @param {LimitOffset} [limitOffset]
 * @return {Promise<Array<Checkout>>} 
 */

 /**
  * @callback GetCheckout
  * @param {number} checkoutId
  * @return {Promise<Checkout>} 
  */

  /**
 * @callback CreateWithdrawal
 * @param {Withdrawal} withdrawal
 * @return {Promise<Withdrawal>} 
 */

 /**
 * @callback ListWithdrawals
 * @param {LimitOffset} [limitOffset]
 * @return {Promise<Array<Withdrawal>>} 
 */

 /**
  * @callback GetWithdrawal
  * @param {number} withdrawalId
  * @return {Promise<Withdrawal>} 
  */

 /**
  * @typedef Client
  * @type {object}
  * @property {CreateCheckout} createCheckout
  * @property {ListCheckouts} listCheckouts
  * @property {GetCheckout} getCheckout
  * @property {CreateWithdrawal} createWithdrawal
  * @property {ListWithdrawals} listWithdrawals
  * @property {GetWithdrawal} getWithdrawal
  */

/**
 * Create new payout API client
 * 
 * @param {ClientOptions} options
 * @return {Client} 
 */
exports.createClient = function({
  clientId, 
  clientSecret, 
  httpClient = axios,
  endpointUrl = "https://app.payout.one"
}) {
  let access = {
    token: null,
    retrievedAt: 0,
    validFor: 0
  }

  return {
    async createCheckout(input) {
      return this.postAuthorizedSigned("/api/v1/checkouts", input, checkoutSignKeys)
    },

    async listCheckouts(params = {}) {
      return this.listAuthorizedSigned('/api/v1/checkouts', params, checkoutSignKeys)
    },

    async getCheckout(checkoutId) {
      return this.getAuthorizedSigned(`/api/v1/checkouts/${checkoutId}`, checkoutSignKeys)
    },

    async createWithdrawal(input) {
      return this.postAuthorizedSigned('/api/v1/withdrawals', input, withdrawalSignKeys)
    },

    async listWithdrawals(params) {
      return this.listAuthorizedSigned('/api/v1/withdrawals', params, withdrawalSignKeys)
    },

    async getWithdrawal(withdrawalId) {
      return this.getAuthorizedSigned(`/api/v1/withdrawals/${withdrawalId}`, withdrawalSignKeys)
    },

    async listPaymentMethods() {
      return this.getAuthorized('/api/v1/payment_methods')
    },

    async getBalance() {
      return this.getAuthorized('/api/v1/balance')
    },

    async post(path, data, headers = {}) {
      return this.createRequest('POST', path, headers)
        .then(this.assignData(data))
        .then(this.execute)
    },

    async postAuthorizedSigned(path, data, signatureKeys) {
      return this.createRequest('POST', path)
        .then(this.assignData(data))
        .then(this.signData(signatureKeys))
        .then(this.authorize())
        .then(this.idempotencyKey("externalId"))
        .then(this.execute)
        .then(this.validateSignature(signatureKeys))
    },

    async getAuthorized(path) {
      return this.createRequest('GET', path)
        .then(this.authorize())
        .then(this.execute)
    },

    async getAuthorizedSigned(path, keys) {
      return this.getAuthorized(path)
        .then(this.validateSignature(keys))
    },

    async listAuthorizedSigned(path, params, keys) {
      const signatureValidator = this.validateSignature(keys)

      return this.createRequest('GET', path)
        .then(this.assignParams(params))
        .then(this.authorize())
        .then(this.execute)
        .then(r => Promise.all(r.map(signatureValidator)))
    },

    signData(keys) {
      return async conn => {
        const signValues = keys.map(key => conn.data[key] || "")

        const {
          nonce,
          signature
        } = this.createNonceAndSignature(signValues)

        return {
          ...conn, 
          data: {
            ...conn.data,
            nonce,
            signature
          }
        }
      }
    },

    validateSignature(signKeys) {
      return async data => {
        const {
          nonce,
          signature: remoteSignature
        } = data

        const localSignature = this.signValues(nonce, signKeys.map(k => data[k] || ""))

        if (remoteSignature != localSignature) {
          throw new Error("Invalid server signature")
        } else {
          return data
        }
      }
    },

    idempotencyKey(key) {
      return async conn => {
        if (conn.data.hasOwnProperty(key)) {
          return {...conn, headers: {...conn.headers, "Idempotency-Key": conn.data[key]}}
        } else {
          return conn
        }
      }
    },

    async execute(conn) {
      const config = {
        ...conn,
        data: conn.data ? snakeCase(conn.data, {deep: true}) : null,
        headers: {...baseHeaders, ...conn.headers}
      }

      return httpClient(config)
        .then(r => camelCase(r.data, {deep: true}))
        .catch(async e => {
          if (e.response && e.response.data) throw e.response.data
          else throw e
        })
    },

    async createRequest(method, path, headers = {}) {
      return {
        method,
        url: `${endpointUrl}${path}`,
        headers
      }
    },

    authorize() {
      return async conn => {
        const token = await this.getToken()

        const config = {
          ...conn,
          headers: {...conn.headers, 'Authorization': `Bearer ${token}`}
        }

        return config
      }
    },

    assignData(data) {
      return async conn => ({...conn, data})
    },

    assignParams(params) {
      return async conn => ({...conn, params})
    },

    async getToken() {
      if (!access.token || ((access.validFor * 1000) + access.retrievedAt) < (new Date()).getTime()) {
        await this.retrieveToken()
      }

      return access.token
    },

    async retrieveToken() {
      const data = {clientId, clientSecret}
      const result = await this.post('/api/v1/authorize', data)
      const { validFor, token } = result

      access = { token, validFor, retrievedAt: (new Date()).getTime() }

      return access
    },

    createNonceAndSignature(params) {
      const nonce = randomBytes(16).toString('base64');
      return { nonce, signature: this.signValues(nonce, params) }
    },

    signValues(nonce, values) {
      return createHash('sha256')
        .update(`${values.join('|')}|${nonce}|${clientSecret}`)
        .digest('hex')
        .toString()
    }
  }
}