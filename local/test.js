process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const redirectUri = 'https://client.banklink/client/session/callback'

const {
  wapConfigure,
  wapGenerateAuthorizationUrl,
  wapHandleRedirect,
  wapGetToken,
  wapAccounts,
  wapAccountInfo,
  wapTransactions,
  wapRefreshToken
} = require('../lib/index')

const config = wapConfigure({
  clientId: '4f383cbb-5d65-459d-b02b-d3df0b766Fd2',
  clientSecret: 'cKUZezdXTbWSxPCVVXnuj2lXl3YwNJoupJRvalCIVtc=/+',
  endpointUrl: 'https://blapi.payout/api',
  authorizationUrl: 'https://merchant.payout/oauth'
})

// console.log(wapGenerateAuthorizationUrl(config, redirectUri))

const url = 'https://client.banklink/client/session/callback?code=01fc077ea92daa1cafc91f8547977eb32253eb2434fac347124ce4ac2eda39be'

const code = wapHandleRedirect(config, url)

/*
wapGetToken(config, code,redirectUri).then(response => {
  console.log(response)
})
.catch(e => {
  console.log('error', e)
})
*/

const auth = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBsaWNhdGlvbl9pZCI6NSwiYXVkIjoiSm9rZW4iLCJjcmVhdGVkX2F0IjoiMjAyMS0wOS0zMFQwODowMzo0OC45OTIxMTYiLCJleHAiOjE2MzI5OTYyMjgsImV4cGlyZXNfaW4iOjcyMDAsImlhdCI6MTYzMjk4OTAyOCwiaXNzIjoiSm9rZW4iLCJqdGkiOiIycWtvbG5sajY0M3E2ODNuMjQwMDAwaTMiLCJuYmYiOjE2MzI5ODkwMjgsInJlc291cmNlX293bmVyX2lkIjozNCwic2NvcGVzIjoiQkxBSVNQIiwidWlkIjo4NzE2fQ.TedbawjX60dhWt3ih3SBr5TFHt56Wx4BsWGY4JYASOM',
  createdAt: '2021-09-30T08:03:48.992591',
  expiresIn: 7200,
  refreshToken: '4fb25493a967897b70815b4922facde029242702d8de6febdca6829eb0ad7ca1',
  scope: 'BLAISP',
  tokenType: 'bearer',
  userId: 34

}

/*
wapAccounts(config, auth.accessToken).then(response => {
  console.log('accounts', response)
})
.catch(e => {
  console.log('accounts error', e)
})

wapAccountInfo(config, auth.accessToken, 'SK0511000000002600000054').then(response => {
  console.log('account', response)
})
.catch(e => {
  console.log('account error', e)
})

wapTransactions(config, auth.accessToken, 'SK0511000000002600000054').then(response => {
  console.log('transactions', response)
})
.catch(e => {
  console.log('transactions error', e)
})
*/

wapRefreshToken(config, auth.refreshToken).then(response => {
  console.log('refresh-token', response)
}).catch(e => {
  console.log('refresh-token-error', e)
})
