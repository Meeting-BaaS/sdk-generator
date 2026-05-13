import Axios, { type AxiosRequestConfig } from "axios"

const AXIOS_INSTANCE = Axios.create()

// Strip Content-Type when there's no request body.
// Axios sets Content-Type: application/json by default on POST/PUT/PATCH even
// when the body is undefined, causing Fastify to reject the request with
// FST_ERR_CTP_EMPTY_JSON_BODY or FST_ERR_CTP_INVALID_MEDIA_TYPE.
AXIOS_INSTANCE.interceptors.request.use((config) => {
  if (config.data === undefined || config.data === null) {
    config.headers.delete("Content-Type")
  }
  return config
})

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return AXIOS_INSTANCE({
    ...config,
    ...options
  }).then(({ data }) => data)
}

export default customInstance

export type ErrorType<Error> = import("axios").AxiosError<Error>
export type BodyType<BodyData> = BodyData
