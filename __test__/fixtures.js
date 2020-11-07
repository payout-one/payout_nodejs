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
  currency: "EUR",
  customer: {
    email: "john.doe@payout.one",
    firstName: "John",
    lastName: "Doe"
  },
  externalId: "ext-id",
  metadata: {
    note:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been."
  },
  redirectUrl: "https://payout.one/payment/redirect"
}

exports.checkoutSigned = {
  ...exports.checkout,
  nonce: "test-nonce",
  signature: "6552bbdd00833d1197f4c0b0768b55c1e5a62ea8afe439dfaabe22981bf03632"
}