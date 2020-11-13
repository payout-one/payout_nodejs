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
 * @type {object}
 * @property {'GET' | 'POST'} method
 * @property {object} [params]
 * @property {object} [headers]
 * @property {object} [data]
 * @property {string} url
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
 * @typedef {object} ClientOptions
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} [endpointUrl] - alternative API url, mostly useful for testing
 * @property {HttpClient} [httpClient] - client to use, defaults to `axios`
 */

/**
  * @typedef {object} CreateCheckoutParams
  * @property {number} amount
  * @property {string} currency - Upper case name of currency, for example 'EUR' or 'PLN
  * @property {Customer} customer
  * @property {string} externalId
  * @property {string} [idempotencyKey]
  * @property {json} [metadata]	- Can be used for payment notation or also for internal use, for example set origin of payment if merchant has more systems. for instance {"type: "eshop"}
  */

/**
 * @typedef {object} CreateCheckoutResult
 * @property {number} amount Amount in cents for instance 1050
 * @property {string} currency Currency code by ISO 4217 for instance EUR
 * @property {Customer} customer Customer details. See Section with Customer attributes	
 * @property {number} id Checkout ID for instance 1
 * @property {string} externalId	Client order's ID or another ID for reference to reason of payment. for instance f0ac316a-9ea6-7998-01a7-720437afb34c
 * @property {string} idempotencyKey	Key uniq per request and user. It used for accepting request at most once. for instance 31f0ac6a-9ea6-01a7-7998-720437afb34c
 * @property {json} metadata	Can be used for payment notation or also for internal use, for example set origin of payment if merchant has more systems. for instance {"type: "eshop"}
 * @property {string} nonce Required random data so signature cant be reused for instance ZUc0Mk9sVXZDOXNsdklzMQ
 * @property {String} object Object type checkout
 * @property {string} redirectUrl	URL where user will be redirected after payment form is filled	
 * @property {string} signature Response signature for instance	5a940ff7f1698f5d334527951519c84fa104c77ecf6691936093835bcac14d52
 * @property {string} status State of payment, for more information check States section	processing
 * @property {string} checkoutUrl URL of payment form for users order. You should redirect user to this URL. for instance	https://app.payout.one/checkouts/je81r4AasdJJdsdsdBMb9Go6mRglpwdax
 */
/**
 * @typedef {object} Checkout
 * @property {number} amount	- Amount in cents, for instance	1050
 * @property {string} currency	- Currency code by ISO 4217, for instance	'EUR'
 * @property {Customer} customer	- Customer details
 * @property {number} id
 * @property {string} externalId	- Client order's ID or another ID for reference to reason of payment
 * @property {string} idempotencyKey	- Key uniq per request and user. It used for accepting request at most once
 * @property {json} metadata	Can be used for payment notation or also for internal use, for example set origin of payment if merchant has more systems, for example	{"type: "eshop"}
 * @property {string} nonce	- Required random data so signature cant be reused
 * @property {string} object	Object type	checkout
 * @property {Payment} payment	Payment details. See Section with Payment Attributes	
 * @property {string} redirectUrl	URL where user will be redirected after payment form is filled	
 * @property {string} signature - Response signature
 * @property {CheckoutStatuses} status	- State of payment, for more information check States
 */

/**
 * Checkout statuses
 *  processing - created payment form
 *  requires_capture - additional authorization requested (if some qate way has additional authorization)
 *  successed - from checkout created transaction
 *  expired - no transaction has been created. Expires 1 hour after creation
 * 
 * @typedef CheckoutStatuses
 * @type {'processing' | 'requires_capture' | 'successed' | 'expired' }
 */

/**
 * @typedef {object} CreateWithdrawalParams
 * @property {number} amount	- A positive number representing how much to charge in the smallest currency unit (e.g. 100 cents to withdraw 1.00€)
 * @property {string} currency	- Three-letter ISO currency code, in uppercase.
 * @property {string} externalId - Identificator from your system.
 * @property {string} iban	- IBAN of the bank account, where the amount will be sent.
 * @property {Customer} customer - Object containing customer's information.
 * @property {string} [statementDescriptor]	- Description that will appear on customer's statement
 */

/**
 * @typedef {object} CreateWithdrawalResult
 * @property {number} amount - Amount in cents, for instance 1050
 * @property {string} apiKeyId - API key ID, for instance 35a4cb08-2aa1-4482-90d9-2023c0255fb3
 * @property {number} createdAt - Timestamp, for instance 1556049039
 * @property {string} currency - Currency code by ISO 4217, for instance EUR
 * @property {Customer} customer - Customer details. See Section with Customer attributes	
 * @property {string} externalId - Client order's ID or another ID for reference to reason of payment., for instance f0ac316a-9ea6-7998-01a7-720437afb34c
 * @property {string} iban - IBAN, for instance SK01234567890
 * @property {number} id - Withdrawal ID, for instance 1
 * @property {string} nonce - Required random data so signature cant be reused, for instance ZUc0Mk9sVXZDOXNsdklzMQ
 * @property {String} object - Object type	withdrawal
 * @property {string} signature - Response signature, for instance 5a940ff7f1698f5d334527951519c84fa104c
 * @property {PaymentStatus} status - State of payment, for more information check States section	pending
 */

 /**
 * @typedef {object} Withdrawal
 * @property {number} amount - Amount in cents, for instance 1050
 * @property {string} api_key_id - API key ID, for instance 35a4cb08-2aa1-4482-90d9-2023c0255fb3
 * @property {number} created_at - Timestamp, for instance 1556049039
 * @property {string} currency - Currency code by ISO 4217, for instance EUR
 * @property {Customer} customer - Customer details. See Section with Customer attributes	
 * @property {string} external_id - Client order's ID or another ID for reference to reason of payment. For instance f0ac316a-9ea6-7998-01a7-720437afb34c
 * @property {string} iban - IBAN, for instance SK01234567890
 * @property {number} id - Withdrawal ID, for instance 1
 * @property {string} nonce - Required random data so signature cant be reused, for instance ZUc0Mk9sVXZDOXNsdklzMQ
 * @property {string} object - Object type, in this case 'withdrawal'
 * @property {string} signature - Response signature, for instance 5a940ff7f1698f5d334527951519c84fa104c
 * @property {PaymentStatus} status - State of payment, for more information check States section, for instance pending
 */

 /**
  * @typedef {object} PaymentMethod
  * @property {number} fixedFee - static fee on this payment method, for instance 200
  * @property {string} identificator - identificator of this method, for instance "payu"
  * @property {string} name - name of this method, for instance "PayU"
  * @property {number} percentualFee - percentual fee used with this method, for instance 2.9
  */

/**
 * @typedef {object} Balance
 * @property {number} available - available resources in this currency, for instance 25500
 * @property {string} currency - currency in ISO 4217, for instance 'USD'
 * @property {number} pending - sum of unmatched transactions, for instance 0
 */

/**
 * Payment status
 *  pending - manually created withdrawal
 *  in_transit - process withdrawal
 *  paid - processed withdrawal
 * @typedef {'pending' | 'in_transit' | 'paid'}  PaymentStatus
 */

/**
  * @typedef {object} Customer
  * @property {string} firstName
  * @property {string} lastName
  * @property {string} email 
  */

 /**
  * @typedef {object} LimitOffset
  * @property {number} [limit]
  * @property {number} [offset]
  */

/**
 * @callback CreateCheckout
 * @param {CreateCheckoutParams} checkout
 * @return {Promise<CreateCheckoutResult>} 
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
 * @param {CreateWithdrawalParams} withdrawal
 * @return {Promise<CreateWithdrawalResult>} 
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
 * @callback ListPaymentMethods
 * @return {Promise<Array<PaymentMethod>>} 
 */

/**
 * @callback GetBalance
 * @return {Promise<Array<Balance>>}
 */

 /**
  * @typedef {object} Client
  * @property {CreateCheckout} createCheckout
  * @property {ListCheckouts} listCheckouts
  * @property {GetCheckout} getCheckout
  * @property {CreateWithdrawal} createWithdrawal
  * @property {ListWithdrawals} listWithdrawals
  * @property {GetWithdrawal} getWithdrawal
  * @property {ListPaymentMethods} listPaymentMethods
  * @property {GetBalance} getBalance
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
        .then(this.idempotencyKey('idempotencyKey'))
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