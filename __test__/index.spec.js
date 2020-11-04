const { createClient } = require('../src/index')

test('create nonce and signature', () => {
  const client = createClient({clientId: "Test", clientSecret: "the-secret"})
  const result = client.createNonceAndSignature(["key", "test"])
  
  expect(result).toEqual({
    nonce: expect.any(String),
    signature: expect.any(String)
  })
})

test('retrieve token', async () => {
  const httpClient = jest.fn(_ => 
    Promise.resolve({ data: { token: "test-token", valid_for: 5000 }})
  )

  const client = createClient({
    clientId: "Test",
    endpointUrl: "http://example.com",
    clientSecret: "the-secret", 
    httpClient
  })

  const result = await client.retrieveToken()

  expect(httpClient.mock.calls.length).toBe(1)

  expect(httpClient.mock.calls[0][0]).toMatchObject({
    method: 'POST',
    url: "http://example.com/api/v1/authorize",
    data: {client_id: "Test", client_secret: "the-secret"},
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
  const httpClient = jest.fn(_ => 
    Promise.resolve({ data: { token: "test-token", valid_for: 5000 }})
  )

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
  const input = {
    amount: 683,
    currency: "EUR",
    customer: {
      email: "john.doe@payout.one",
      first_name: "John",
      last_name: "Doe"
    },
    external_id: "844c65d5-55a1-6530-f54e-02ddc9ce7b18",
    metadata: {
      note:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been."
    },
    redirect_url: "https://payout.one/payment/redirect"
  }

  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve({ 
          data: { 
            token: "test-token", 
            valid_for: 5000 
          }
        })
      default:
        return Promise.resolve({ data: input })
    }
  })
  
  const client = createClient({
    clientId: "Test",
    endpointUrl: "http://example.com",
    clientSecret: "the-secret", 
    httpClient
  })

  const response = await client.createCheckout(input)

  expect(response).toMatchObject(input)

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/checkouts",
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token',
      'Idempotency-Key': input.external_id
    },
    data: {
      ...input, 
      nonce: expect.any(String), 
      signature: expect.any(String)
    }
  })
})