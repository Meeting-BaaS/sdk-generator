import Axios, { type AxiosRequestConfig } from "axios"

const AXIOS_INSTANCE = Axios.create()

// For requests with no body (data is undefined/null), set data to "{}" and
// Content-Type to application/json. This prevents Node's http module from
// adding Content-Type: application/x-www-form-urlencoded on POST requests,
// which Fastify rejects with FST_ERR_CTP_INVALID_MEDIA_TYPE. Fastify accepts
// an empty JSON object {} with application/json.
//
// We use a request interceptor which runs after axios merges defaults but
// before the request is dispatched.
AXIOS_INSTANCE.interceptors.request.use((config) => {
  if (config.data === undefined || config.data === null) {
    config.data = "{}"
    config.headers.setContentType("application/json")
  }
  return config
})

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...config?.headers,
      ...options?.headers
    }
  }).then(({ data }) => data)
}

export default customInstance

export type ErrorType<Error> = import("axios").AxiosError<Error>
export type BodyType<BodyData> = BodyData
