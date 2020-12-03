const { createClient } = require('payout_node_sdk')

exports.credentials = {
  clientId: "test-client-id",
  clientSecret: "test-client-secret"
}

exports.tokenResponse = { 
  data: { 
    token: "test-token", 
    validFor: 5000 
  }
}

exports.checkout = {
  amount: 683,
  currency: 'EUR',
  customer: {
    email: 'john.doe@payout.one',
    firstName: 'John',
    lastName: 'Doe'
  },
  externalId: 'ext-id',
  idempotencyKey: 'idempotency',
  metadata: {
    note:'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been.'
  },
  redirectUrl: 'https://payout.one/payment/redirect'
}

exports.checkoutSigned = {
  ...exports.checkout,
  nonce: "test-nonce",
  signature: "6552bbdd00833d1197f4c0b0768b55c1e5a62ea8afe439dfaabe22981bf03632"
}

exports.withdrawal = {
  amount: 1,  
  currency: 'EUR',  
  externalId: 'ext-id',
  idempotencyKey: 'idempotency',
  iban: 'IBAN IBAN IBAN',
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@payout.one"
  },
  description: 'Simple statement description'
}

exports.withdrawalSigned = {
  ...exports.withdrawal,
  nonce: 'OCDnRkTCOFny/QJEH+EgVw==',
  signature: '57854b66da18dbeb6e77837ee12c6690069bb992e0e4fd478e9ee8ee62ecc76e'
}

exports.mockClient = httpClient => createClient({
  clientId: "Test",
  endpointUrl: "http://example.com",
  clientSecret: "the-secret", 
  httpClient
})