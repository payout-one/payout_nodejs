import axios from 'axios'

export type ScalarMap = {[key: string]: string|number}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export type HttpRequest = {
  headers?: ScalarMap
  params?: ScalarMap
  method: HttpMethod
  url: string
  data?: {[key: string]: any}
}

export type HttpResponse = {
  data: object;
}

export type HttpClient = (r: HttpRequest) => Promise<HttpResponse>;

export function defaultHttpClient(r: HttpRequest) : Promise<HttpResponse> {
  return axios.request(r);
}
