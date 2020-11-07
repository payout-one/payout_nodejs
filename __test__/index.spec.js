const { createClient } = require('../src/index')
const snakeCase = require('snakecase-keys')
const { checkout, checkoutSigned, tokenResponse, credentials } = require('./fixtures')

test('create nonce and signature', () => {
  const client = createClient(credentials)
  const result = client.createNonceAndSignature(["key", "test"])
  
  expect(result).toEqual({
    nonce: expect.any(String),
    signature: expect.any(String)
  })
})

test('retrieve token', async () => {
  const httpClient = jest.fn(_ => 
    Promise.resolve(tokenResponse)
  )

  const client = createClient({
    ...credentials,
    endpointUrl: "http://example.com",
    httpClient
  })

  const result = await client.retrieveToken()

  expect(httpClient.mock.calls.length).toBe(1)

  expect(httpClient.mock.calls[0][0]).toMatchObject({
    data: {
      client_id: "test-client-id",
      client_secret: "test-client-secret"
    },
    method: 'POST',
    url: "http://example.com/api/v1/authorize",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  expect(result).toEqual(expect.objectContaining({
    token: "test-token",
    validFor: 5000,
    retrievedAt: expect.any(Number)
  }))
})

test("get token called twice", async () => {
  const httpClient = jest.fn(_ => Promise.resolve(tokenResponse))

  const client = createClient({
    clientId: "Test",
    endpointUrl: "http://example.com",
    clientSecret: "the-secret", 
    httpClient
  })

  await client.getToken()
  await client.getToken()

  expect(httpClient.mock.calls.length).toBe(1)
})

test("create checkout", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse)
      default:
        return Promise.resolve({ data: checkoutSigned })
    }
  })
  
  const client = createClient({
    clientId: "Test",
    endpointUrl: "http://example.com",
    clientSecret: "the-secret", 
    httpClient
  })

  const response = await client.createCheckout(checkout)

  expect(response).toMatchObject(checkout)

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/checkouts",
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token',
      'Idempotency-Key': checkout.externalId
    },
    data: {
      ...snakeCase(checkout), 
      nonce: expect.any(String), 
      signature: expect.any(String)
    }
  })
})

test("listCheckouts", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse) 
      default:
        return Promise.resolve({ data: [checkoutSigned] })
    }
  })

  const client = createClient({
    clientId: "Test",
    endpointUrl: "http://example.com",
    clientSecret: "the-secret", 
    httpClient
  })

  const response = await client.listCheckouts({limit: 5, offset: 2})

  expect(response).toMatchObject([checkout])

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/checkouts",
    method: 'GET',
    data: null,
    params: {
      limit: 5,
      offset: 2
    },
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token',
    }
  })
})

test("getCheckout", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse)
      default:
        return Promise.resolve({ data: checkoutSigned })
    }
  })

  const client = createClient({
    clientId: "Test",
    endpointUrl: "http://example.com",
    clientSecret: "the-secret", 
    httpClient
  })

  const response = await client.getCheckout(124)

  expect(response).toMatchObject(checkout)

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/checkouts/124",
    method: 'GET',
    data: null,
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token',
    }
  })
})