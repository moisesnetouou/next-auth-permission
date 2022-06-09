import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestQueue = [];

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
});

api.interceptors.response.use(response => {
  return response;
}, (error: AxiosError) => {
  if (error.response.status === 401) {
    //@ts-ignore
    if (error.response.data?.code === 'token.expired') {
      //renovar o token
      cookies = parseCookies(); //Para ter esses dados atualizados sempre

      const { 'nextauth.refreshToken': refreshToken } = cookies;

      const originalConfig = error.config; // configuração original do back

      if (!isRefreshing) {
        isRefreshing = true;

        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data;

          setCookie(undefined, 'nextauth.token', token, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
          });

          // tem que adicionar agora o novo refreshToken, para sempre continuar o ciclo
          setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
          });

          api.defaults.headers['Authorization'] = `Bearer ${token}`;

          failedRequestQueue.forEach(request => request.onSuccess(token));
          failedRequestQueue = [];
        }).catch(err => {
          failedRequestQueue.forEach(request => request.onFailure(err));
          failedRequestQueue = [];
        }).finally(() => {
          isRefreshing = false;
        })
      }


      return new Promise((resolve, reject) => { // não é possivel usar Await
        failedRequestQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`;

            resolve(api(originalConfig));
          },
          onFailure: (err: AxiosError) => {
            reject(err)
          }

        })
      })
    } else {
      //desligar o usuário -> deslogar mesmo assim
    }
  }
})