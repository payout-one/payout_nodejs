import { URL, parse } from 'url';

import * as snakeCase from 'snakecase-keys'
import * as camelCase from 'camelcase-keys'

import { HttpClient, defaultHttpClient } from './common';

export type Config = {
  clientId: string;
  clientSecret: string;
  httpClient?: HttpClient;
  authorizationUrl: string;
  endpointUrl: string;
}

export type TokenResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  scopes: string[];
}

export const wapConfigure = ({
  clientId,
  clientSecret,
  httpClient = defaultHttpClient,
  endpointUrl = "https://wap.payout.one/api",
  authorizationUrl = "https://app.payout.one/oauth"
} : Config ) => ({
  clientId,
  clientSecret,
  httpClient,
  endpointUrl,
  authorizationUrl
})

export const wapGenerateAuthorizationUrl = (config: Config, redirectUri: string) => {
  const url = new URL(config.authorizationUrl);
  url.pathname = `${url.pathname}authorize`
  url.searchParams.append('client_id', config.clientId)
  url.searchParams.append('redirect_uri', redirectUri)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', 'BLAISP')
  return url.toString()
}

export const wapHandleRedirect = (config: Config, uri: string) => {
  const url = new URL(uri)

  if (url.searchParams.has('error')) {
    throw new Error(url.searchParams.get('errorDescription'))
  }

  if (url.searchParams.has('code')) {
    return url.searchParams.get('code')
  }

  throw new Error('Invalid redirect, missing code or error parameter')
}

export const wapGetToken = async (config: Config, code: string, redirectUri: string) => {
  return config.httpClient({
    method: 'POST',
    url: `${config.authorizationUrl}/token`,
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    },
    data: {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      code 
    }
  })
  .then(response => camelCase(response.data, { deep: true }))
}

export const wapRefreshToken = async (config: Config, refreshToken: string) => {
  return config.httpClient({
    method: 'POST',
    url: `${config.authorizationUrl}/token`,
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    },
    data: {
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken
    }
  })
  .then(response => camelCase(response.data, { deep: true }))
}

export const wapAccounts = async (config: Config, accessToken: string) => {
  return config.httpClient({
    method: 'POST',
    url: `${config.endpointUrl}/v1/accounts`,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'authorization': `Bearer ${accessToken}`
    }
  })
  .then(response => camelCase(response.data, { deep: true }))
}

export const wapAccountInfo = async (config: Config, accessToken: string, iban: string) => {
  return config.httpClient({
    method: 'POST',
    url: `${config.endpointUrl}/v1/accounts/information`,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'authorization': `Bearer ${accessToken}`
    },
    data: { iban }
  })
  .then(response => camelCase(response.data, { deep: true }))
}

export const wapTransactions = async (config: Config, accessToken: string, iban: string) => {
  return config.httpClient({
    method: 'POST',
    url: `${config.endpointUrl}/v1/transactions`,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'authorization': `Bearer ${accessToken}`
    },
    data: { iban }
  })
  .then(response => camelCase(response.data, { deep: true }))
}

