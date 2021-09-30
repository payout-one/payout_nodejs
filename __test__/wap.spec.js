const { wapConfigure, wapGenerateAuthorizationUrl, wapHandleRedirect, wapGetToken, wapAccounts, wapAccountInfo, wapTransactions } = require('payout_node_sdk')
const { checkout, checkoutSigned, tokenResponse, mockClient } = require('./fixtures')

test('generate authorization url', () => {
  const config = generateConfig()
  const authorizationUrl = wapGenerateAuthorizationUrl(config, 'https://example.com')
  expect(authorizationUrl).toBe('https://authorization/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fexample.com&response_type=code&scope=BLAISP')
})

test('handle redirect result', async () => {
  const config = generateConfig()
  const result = await wapHandleRedirect(config, 'https://origin?code=test')
  expect(result).toBe('test')
})

test('get token', async () => {
  const httpClient = jest.fn(r => {
    expect(r.url).toBe('https://authorization/token')
    return Promise.resolve({data: {access_token: 'test-token'}})
  })

  const config = generateConfig({httpClient})

  const result = await wapGetToken(config, 'test-code')
  expect(result).toEqual({
    accessToken: 'test-token'
  })
})

test('accounts', async () => {
  const accessToken = 'access-token'
  const httpClient = jest.fn(r => {
    expect(r.url).toBe('https://endpoint/v1/accounts')
    expect(r.method).toBe('POST')
    checkHeaders(r, accessToken)
    return Promise.resolve({data: {accounts: []}})
  })

  const config = generateConfig({httpClient})
  const result = await wapAccounts(config, 'access-token')

  expect(result).toEqual({accounts: []})
})

test('account info', async () => {
  const accessToken = 'access-token'
  const iban = 'SK123'

  const response = {
    data: {
      account: {
        test_att: 'value'
      },
      balances: []
    }
  }

  const httpClient = jest.fn(r => {
    expect(r.url).toBe('https://endpoint/v1/accounts/information')
    expect(r.method).toBe('POST')
    expect(r.data).toEqual({iban})
    checkHeaders(r, accessToken)
    return Promise.resolve(response)
  })

  const config = generateConfig({httpClient})
  const result = await wapAccountInfo(config, 'access-token', iban)

  expect(result).toEqual({
    account: {
      testAtt: 'value'
    },
    balances: []
  })
})

test('transactions', async () => {
  const accessToken = 'access-token'
  const iban = 'SK123'

  const response = {
    data: {
      transactions: []
    }
  }

  const httpClient = jest.fn(r => {
    expect(r.url).toBe('https://endpoint/v1/transactions')
    expect(r.method).toBe('POST')
    expect(r.data).toEqual({iban})
    checkHeaders(r, accessToken)
    return Promise.resolve(response)
  })

  const config = generateConfig({httpClient})
  const result = await wapTransactions(config, accessToken, iban)

  expect(result).toEqual({
    transactions: []
  })
})

function checkHeaders(r, accessToken) {
  expect(r.headers['authorization']).toBe(`Bearer ${accessToken}`)
  expect(r.headers['content-type']).toBe('application/json;charset=UTF-8')
}

function generateConfig(params = {}) {
  return wapConfigure({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    authorizationUrl: 'https://authorization',
    endpointUrl: 'https://endpoint',
    ...params
  })
}

