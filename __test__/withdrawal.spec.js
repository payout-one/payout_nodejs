const snakeCase = require('snakecase-keys')
const { withdrawal, withdrawalSigned, tokenResponse, mockClient } = require('./fixtures')

test("createWithdrawal", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse)
      default:
        return Promise.resolve({ data: withdrawalSigned })
    }
  })
  
  const client = mockClient(httpClient)

  const response = await client.createWithdrawal(withdrawal)

  expect(response).toMatchObject(withdrawal)

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/withdrawals",
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token',
      'Idempotency-Key': withdrawal.idempotencyKey
    },
    data: {
      ...snakeCase(withdrawal), 
      nonce: expect.any(String), 
      signature: expect.any(String)
    }
  })
})

test("listWithdrawal", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse) 
      default:
        return Promise.resolve({ data: [withdrawalSigned] })
    }
  })

  const client = mockClient(httpClient)

  const response = await client.listWithdrawals({limit: 5, offset: 2})

  expect(response).toMatchObject([withdrawal])

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/withdrawals",
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

test("getWithdrawal", async () => {
  const httpClient = jest.fn(r => {
    switch(r.url) {
      case "http://example.com/api/v1/authorize": 
        return Promise.resolve(tokenResponse)
      default:
        return Promise.resolve({ data: withdrawalSigned })
    }
  })

  const client = mockClient(httpClient)

  const response = await client.getWithdrawal(124)

  expect(response).toMatchObject(withdrawal)

  expect(httpClient.mock.calls.length).toBe(2)
  expect(httpClient.mock.calls[1][0]).toEqual({
    url: "http://example.com/api/v1/withdrawals/124",
    method: 'GET',
    data: null,
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token',
    }
  })
})