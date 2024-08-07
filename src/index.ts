import { createHash, randomBytes } from 'crypto'

import * as snakeCase from 'snakecase-keys'
import * as camelCase from 'camelcase-keys'

import {
  HttpClient,
  HttpMethod,
  HttpRequest,
  ScalarMap,
  defaultHttpClient
} from './common'

export {
  wapConfigure,
  wapGenerateAuthorizationUrl,
  wapHandleRedirect,
  wapGetToken,
  wapAccounts,
  wapAccountInfo,
  wapTransactions,
  wapRefreshToken
} from './wap'

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

export type Mode = "standard" | "store_card" | "recurrent"

export type ClientConfig = {
  clientId: string;
  clientSecret: string;
  httpClient?: HttpClient;
  endpointUrl?: string;
}

export type Access = {
  token: string
  retrievedAt: number
  validFor: number
}

export type Customer = {
  firstName: string
  lastName: string
  email: string
}

export type Address = {
  name: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  countryCode: string
  city: string
}

export type Product = {
  name: string
  unitPrice: number
  quantity: number
}

export type LimitOffset = {
  limit?: number
  offset?: number
}

export type CreateCheckout = {
  amount: number
  currency: string
  customer: Customer
  billingAddress?: Address
  shippingAddress?: Address
  products: Product[]
  externalId: string
  redirectUrl: string
  mode?: Mode
  recurrentToken?: string
  idempotencyKey?: string
  metadata?: ScalarMap
}

export type CreatedCheckout = {
  amount: number
  currency: string
  customer: Customer
  billingAddress?: Address
  shippingAddress?: Address
  products: Product[]
  id: number
  externalId: string
  idempotencyKey: string
  metadata: object
  nonce: string
  object: string
  redirectUrl: string
  signature: string
  status: string
  checkoutUrl: string
}

export type Checkout = {
  amount: number
  currency: string
  customer: Customer
  id: number
  externalId: string
  idempotencyKey: string
  metadata: object
  nonce: string
  object: string
  payment: object
  redirectUrl: string
  signature: string
  status: string
}

export type CreateWithdrawal = { 
  amount: number
  currency: string
  externalId: string
  iban: string
  customer: Customer
  statementDescriptor?: string
}

export type CreatedWithdrawal = {
  amount: number
  apiKeyId: string
  createdAt: number
  currency: string
  customer: Customer
  externalId: string
  iban: string
  id: number
  nonce: string
  object: string
  signature: string
  status: string
}

export type Withdrawal = {
   amount: number
   apiKeyId: string
   createdAt: number
   currency: string
   customer: Customer
   externalId: string
   iban: string
   id: number
   nonce: string
   object: string
   signature: string
   status: string
}

export type TokenDetails = {
  cardExpirationYear: string
  cardExpirationMonth: string
  cardNumberMasked: string
  cardBrand: string
  value: string
  brandImageUrl: string
  preferred: boolean
  status: string
}

export type TokenInvalid = {
  errors: {
    token: 'invalid'
  }
}

export type TokenStatus = {
  status: TokenDetails | TokenInvalid | "no_tokens"
}

export type TokenDeleted = {
  status: "deleted"
}

export type PaymentMethod = {
  fixedFee: number
  identificator: string
  name: string
  percentualFee: number
}

export type Balance = {
  available: number
  currency: string
  pending: number
}

function castNumber(input: any) {
  const value = Number(input)

  if (Number.isNaN(value)) throw new Error("Invalid server response");

  return value;
}

function castString(input: any) {
  if (typeof input === 'object') throw new Error("Invalid server response");
  return String(input)
}

function createCastObject<R extends {[key: string] : any}>(schema: {[key: string]: (v: any) => any}) {
  return (input: any) => { 
    if (typeof input !== 'object') throw new Error("Invalid response");

    const result : {[key: string]: any} = {}

    for (const [k, v] of Object.entries(schema)) {
      result[k] = v(input[k])
    }

    return result as R;
  }
}

const castTokenResponse = createCastObject({
  token: castString,
  validFor: castNumber
})

class Client {
  clientId: string
  clientSecret: string
  httpClient: HttpClient
  endpointUrl: string

  access: Access = {
    token: null,
    validFor: null,
    retrievedAt: null
  }

  constructor(config: ClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.httpClient = config.httpClient;
    this.endpointUrl = config.endpointUrl;
  }

  async createCheckout(input: CreateCheckout) : Promise<CreatedCheckout | TokenInvalid> {
    const normalizedAddresses = this.normalizeCheckoutAddress(input) 
    return this.postAuthorizedSigned("/api/v1/checkouts", normalizedAddresses, checkoutSignKeys) as Promise<CreatedCheckout>;
  }

  async listCheckouts(params : LimitOffset = {}) : Promise<Checkout[]> {
    return this.listAuthorizedSigned('/api/v1/checkouts', params, checkoutSignKeys) as Promise<Checkout[]>;
  }

  async getCheckout(checkoutId : number) : Promise<Checkout> {
    return this.getAuthorizedSigned(`/api/v1/checkouts/${checkoutId}`, checkoutSignKeys) as Promise<Checkout>;
  }

  async createWithdrawal(input : CreateWithdrawal) : Promise<CreatedWithdrawal> {
    return this.postAuthorizedSigned('/api/v1/withdrawals', input, withdrawalSignKeys) as Promise<CreatedWithdrawal>;
  }

  async listWithdrawals(params : LimitOffset = {}) : Promise<Withdrawal[]> {
    return this.listAuthorizedSigned('/api/v1/withdrawals', params, withdrawalSignKeys) as Promise<Withdrawal[]>
  }

  async getWithdrawal(withdrawalId : number) : Promise<Withdrawal> {
    return this.getAuthorizedSigned(`/api/v1/withdrawals/${withdrawalId}`, withdrawalSignKeys) as Promise<Withdrawal>;
  }

  async getTokenStatus(token : string) {
    return this.getAuthorized(`/api/v1/tokens/${token}/status`) as Promise<TokenStatus>
  }

  async deleteToken(token : string) {
    return this.deleteAuthorized(`/api/v1/tokens/${token}`) as Promise<TokenDeleted>
  }

  async listPaymentMethods() : Promise<PaymentMethod[]> {
    return this.getAuthorized('/api/v1/payment_methods') as Promise<PaymentMethod[]>
  }

  async getBalance() : Promise<Balance[]> {
    return this.getAuthorized('/api/v1/balance') as Promise<Balance[]>
  }

  async post(path : string, data : object, headers : ScalarMap = {}) {
    return this.createRequest('POST', path, headers)
      .then(this.assignData(data))
      .then(this.execute())
  }

  async deleteAuthorized(path : string) {
    return this.createRequest('DELETE', path)
      .then(this.authorize())
      .then(this.execute())
  }

  async postAuthorizedSigned(path : string, data : object, signatureKeys : string[]) {
    return this.createRequest('POST', path)
      .then(this.assignData(data))
      .then(this.signData(signatureKeys))
      .then(this.authorize())
      .then(this.idempotencyKey('idempotencyKey'))
      .then(this.execute())
      .then(this.validateSignature(signatureKeys))
  }

  async getAuthorized(path : string) {
    return this.createRequest('GET', path)
      .then(this.authorize())
      .then(this.execute())
  }

  async getAuthorizedSigned(path : string, keys : string[]) {
    return this.getAuthorized(path)
      .then(this.validateSignature(keys))
  }

  async listAuthorizedSigned(path : string, params : ScalarMap, keys : string[]) {
    const signatureValidator = this.validateSignature(keys)

    return this.createRequest('GET', path)
      .then(this.assignParams(params))
      .then(this.authorize())
      .then(this.execute())
      .then(r => {
        if (!Array.isArray(r)) throw new Error("Invalid server response")
        return Promise.all(r.map(signatureValidator))
      })
  }

  signData(keys : string[]) {
    return async (conn : HttpRequest) => {
      const signValues = keys.map((key : string) => conn.data[key] ?? "")

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
  }

  validateSignature(signKeys : string[]) {
    return async (data: {[key: string]: any}) => {
      const {
        nonce = null,
        signature: remoteSignature = null
      } = data

      const localSignature = this.signValues(nonce, signKeys.map(k => data[k] ?? ""))

      if (remoteSignature !== localSignature) {
        throw new Error("Invalid server signature")
      } else {
        return data
      }
    }
  }

  idempotencyKey(key : string) {
    return async (conn : HttpRequest) => {
      if (conn.data.hasOwnProperty(key)) {
        return {...conn, headers: {...conn.headers, "Idempotency-Key": conn.data[key]}}
      } else {
        return conn
      }
    }
  }

  execute() {
    return async (conn: HttpRequest) => {
      const config = {
        ...conn,
        data: conn.data ? snakeCase(conn.data, {deep: true}) : null,
        headers: {...baseHeaders, ...conn.headers}
      }

      return this.httpClient(config)
        .then(r => camelCase(r.data, {deep: true}))
        .catch(async e => {
          if (e.response && e.response.data) throw e.response.data
          else throw e
        })
    }
  }

  async createRequest(method : HttpMethod, path : string, headers : ScalarMap = {}) {
    return {
      method,
      url: `${this.endpointUrl}${path}`,
      headers
    }
  }

  authorize() {
    return async (conn: HttpRequest) => {
      const token = await this.getToken()

      const config = {
        ...conn,
        headers: {...conn.headers, 'Authorization': `Bearer ${token}`}
      }

      return config
    }
  }

  assignData(data: object) {
    return async (conn: HttpRequest) => ({...conn, data})
  }

  assignParams(params: ScalarMap) {
    return async (conn: HttpRequest) => ({...conn, params})
  }

  async getToken() {
    const {
      token,
      validFor,
      retrievedAt
    } = this.access

    if (!token || ((validFor * 1000) + retrievedAt) < (new Date()).getTime()) {
      await this.retrieveToken()
    }

    return this.access.token
  }

  async retrieveToken() {
    const data = {clientId: this.clientId, clientSecret: this.clientSecret}
    const result = await this.post('/api/v1/authorize', data)
    const { validFor = 0, token = "" } = castTokenResponse(result)

    this.access = { token, validFor, retrievedAt: (new Date()).getTime() }

    return this.access
  }

  createNonceAndSignature(params: string[]) {
    const nonce = randomBytes(16).toString('base64');
    return { nonce, signature: this.signValues(nonce, params) }
  }

  signValues(nonce : string, values: string[]) {
    return createHash('sha256')
      .update(`${values.join('|')}|${nonce}|${this.clientSecret}`)

      .digest('hex')
      .toString()
  }

  normalizeCheckoutAddress(checkout: CreateCheckout) {
    if ('billingAddress' in checkout) {
      checkout = {...checkout, billingAddress: this.normalizeAddress(checkout.billingAddress)}
    }

    if ('shippingAddress' in checkout) {
      checkout = {...checkout, shippingAddress: this.normalizeAddress(checkout.shippingAddress)}
    }

    return checkout
  }

  normalizeAddress(input: Address) {
    const address = {
      ...input,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2
    }

    delete address.addressLine1
    delete address.addressLine2

    return address
  }
}

export const createClient = ({
  clientId,
  clientSecret,
  httpClient = defaultHttpClient,
  endpointUrl = "https://app.payout.one"
} : ClientConfig) => new Client({clientId, clientSecret, httpClient, endpointUrl});
