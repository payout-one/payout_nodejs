
const axios = require('axios')
const { createHash, randomBytes } = require('crypto')

const baseHeaders = {
  'Content-Type': 'application/json', 
  'Accept': 'application/json'
}

exports.createClient = function({clientId, clientSecret, endpointUrl = "https://app.payout.one"}) {
  let access = {
    token: null,
    retrievedAt: 0,
    validFor: 0
  }

  return {
    async post(path, data, headers = {}) {
      const config = {
        method: "POST",
        url: `${endpointUrl}${path}`,
        headers: {...baseHeaders, ...headers},
        data: data
      }

      return axios(config)
    },

    async postAuthorized(path, data, inputHeaders = {}) {
      const token = await this.getToken()

      const headers = {
        'Authorization': `Bearer ${token}`,
        ...inputHeaders
      }

      this.post(path, data, headers)
    },

    async getAuthorized(path, inputHeaders = {}) {
      const token = await this.getToken()

      const headers = {
        ...baseHeaders,
        'Authorization': `Bearer ${token}`,
        ...inputHeaders
      }

      const config = {
        method: "GET",
        url: `${endpointUrl}${path}`,
        headers
      }

      return axios(config)
    },

    async retrieveToken() {
      const data = {client_id: clientId, client_secret: clientSecret}
      const result = await this.post('/api/v1/authorize', data)

      const { valid_for: validFor, token } = result.data

      return access = { token, validFor, retrievedAt: (new Date()).getTime() }
    },

    async getToken() {
      if (!access.token || ((access.validFor * 1000) + access.retrievedAt) < (new Date()).getTime()) {
        await this.retrieveToken()
      }

      return access.token
    },

    createNonceAndSignature(params) {
      const nonce = randomBytes(16).toString('base64');
      const content = `${params.join('|')}|${nonce}|${clientSecret}`

      return createHash('sha256')
        .update(content)
        .digest('hex')
        .toString()
    },

    signData(input, signData) {
      const {
        nonce,
        signature
      } = this.createNonceAndSignature(signData)

      return {
        ...input,
        nonce,
        signature
      }
    },

    async createCheckout(input) {
      const {
        currency,
        amount,
        external_id: externalId,
      } = input

      const data = this.signData(input, [amount, currency, externalId])

      const headers = {
        'Idempotency-Key': externalId
      }

      return this.postAuthorized("/api/v1/checkouts", data, headers)
    },

    async listCheckouts() {
      return this.getAuthorized('/api/v1/checkouts')
    },

    async getCheckout(checkoutId) {
      return this.getAuthorized(`/api/v1/checkouts/${checkoutId}`)
    },

    async createWithdrawal(input) {
      const {
        amount,
        currency,
        external_id: externalId,
        iban
      } = input

      const data = this.signData(input, [amount, currency, externalId, iban])

      return this.postAuthorized('/api/v1/withdrawals', data)
    },

    async listWithdrawals() {
      return this.getAuthorized('/api/v1/withdrawals')
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
      const {
        amount,
        currency,
        external_id: externalId,
        iban
      } = input

      const data = this.signData(input, [amount, currency, externalId, iban])

      return this.postAuthorized('/api/v1/refunds', data)
    }
  }
}