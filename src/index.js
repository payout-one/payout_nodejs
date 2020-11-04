
const axios = require('axios')
const snakeCase = require('snakecase-keys')
const camelCase = require('camelcase-keys')
const { createHash, randomBytes } = require('crypto')

const baseHeaders = {
  'Content-Type': 'application/json', 
  'Accept': 'application/json'
}

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
      const data = this.signData(input, ["amount", "currency", "externalId"])
      const headers = {'Idempotency-Key': input.externalId}

      return this.postAuthorized("/api/v1/checkouts", data, headers)
    },

    async listCheckouts(params) {
      return this.getAuthorizedWithParams('/api/v1/checkouts', params)
    },

    async getCheckout(checkoutId) {
      return this.getAuthorized(`/api/v1/checkouts/${checkoutId}`)
    },

    async createWithdrawal(input) {
      const signedData = this.signData(input, ["amount", "currency", "externalId", "iban"])
      const headers = {'Idempotency-Key': input.externalId}

      return this.postAuthorized('/api/v1/withdrawals', signedData, headers)
    },

    async listWithdrawals(params) {
      return this.getAuthorizedWithParams('/api/v1/withdrawals', params)
    },

    async getWithdrawal(withdrawalId) {
      return this.getAuthorized(`/api/v1/withdrawals/${withdrawalId}`)
    },

    async listPaymentMethods() {
      return this.getAuthorized('/api/v1/payment_methods')
    },

    async getBalance() {
      return this.getAuthorized('/api/v1/balance')
    },

    async refundPayment(input) {
      const signedData = this.signData(input, ["amount", "currency", "externalId", "iban"])

      return this.postAuthorized('/api/v1/refunds', signedData)
    },

    async post(path, data, headers = {}) {
      return this.createRequest('POST', path, headers)
        .then(this.assignData(data))
        .then(this.execute)
    },

    async postAuthorized(path, data, headers = {}) {
      return this.createRequest('POST', path, headers)
        .then(this.assignData(data))
        .then(this.authorize())
        .then(this.execute)
    },

    async getAuthorized(path, headers = {}) {
      return this.createRequest('GET', path, headers)
        .then(this.authorize())
        .then(this.execute)
    },

    async getAuthorizedWithParams(path, params) {
      return this.createRequest('GET', path)
        .then(this.assignParams(params))
        .then(this.authorize())
        .then(this.execute)
    },

    signData(input, signKeys) {
      const signValues = signKeys.map(key => input[key])

      const {
        nonce,
        signature
      } = this.createNonceAndSignature(signValues)

      return {
        ...input,
        nonce,
        signature
      }
    },

    async execute(conn) {
      const config = {
        ...conn,
        headers: {...baseHeaders, ...conn.headers}
      }

      return httpClient(config)
        .then(r => camelCase(r.data, {deep: true}))
        .catch(e => { 
          if (e.response) throw e.response.data
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

    assignData(inputData) {
      data = snakeCase(inputData, {deep: true})
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
      const content = `${params.join('|')}|${nonce}|${clientSecret}`

      const signature = createHash('sha256')
        .update(content)
        .digest('hex')
        .toString()

      return { nonce, signature }
    }
  }
}