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
  externalId: "844c65d5-55a1-6530-f54e-02ddc9ce7b18",
  metadata: {
    note:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been."
  },
  redirectUrl: "https://payout.one/payment/redirect"
}