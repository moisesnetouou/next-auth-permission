/* eslint-disable prefer-const */
import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'

interface AxiosErrorResponse {
  code?: string
}

type FailedRequestQueue = {
  onSuccess: (token: string) => void
  onFailure: (error: AxiosError) => void
}

let cookies = parseCookies()
let isRefreshing = false
let failedRequestsQueue: FailedRequestQueue[] = []

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['@nextauth.token']}`,
  },
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError<AxiosErrorResponse>) => {
    console.log('ops', error.response?.status)
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        // renovar o token
        cookies = parseCookies()

        const { '@nextauth.refreshToken': refreshToken } = cookies

        const originalConfig = error.config

        if (!isRefreshing) {
          isRefreshing = true

          api
            .post('/refresh', {
              refreshToken,
            })
            .then((response) => {
              const { token } = response.data

              setCookie(undefined, '@nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
              })

              setCookie(
                undefined,
                '@nextauth.refreshToken',
                response.data.refreshToken,
                {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: '/',
                },
              )

              api.defaults.headers.Authorization = `Bearer ${token}`

              failedRequestsQueue.forEach((request) => request.onSuccess(token))
              failedRequestsQueue = []
            })
            .catch((err) => {
              failedRequestsQueue.forEach((request) => request.onFailure(err))
              failedRequestsQueue = []
            })
            .finally(() => {
              isRefreshing = false
            })
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              if (!originalConfig?.headers) {
                return
              }

              originalConfig.headers.Authorization = `Bearer ${token}`

              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            },
          })
        })
      } else {
        // deslogar usuário
      }
    }
  },
)
