const snakeCase = require('snakecase-keys')
const { checkout, checkoutSigned, tokenResponse, mockClient } = require('./fixtures')

test("createCheckout", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse)
      default:
        return Promise.resolve({ data: checkoutSigned })
    }
  })
  
  const client = mockClient(httpClient)

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
      'Idempotency-Key': checkout.idempotencyKey
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

  const client = mockClient(httpClient)

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

  const client = mockClient(httpClient)

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