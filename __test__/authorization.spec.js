const { createClient } = require('../src/index')
const { tokenResponse, credentials, mockClient } = require('./fixtures')

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

  const client = mockClient(httpClient)

  await client.getToken()
  await client.getToken()

  expect(httpClient.mock.calls.length).toBe(1)
})