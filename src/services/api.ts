import axios, { AxiosError, AxiosResponse } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../context/AuthContext";
import { AuthTokenError } from "../errors/AuthTokenError";

let isRefreshing = false;
let failedRequestsQueue = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["auth.token"]}`,
    },
  });

  function sucessHandler(res: AxiosResponse) {
    return res;
  }

  function errorHandler(error: AxiosError) {
    if (error.response.status === 401) {
      if (error.response.data?.code === "token.expired") {
        // logar
        cookies = parseCookies(ctx);

        const { "auth.refreshToken": currentRefreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;
          api
            .post("/refresh", {
              refreshToken: currentRefreshToken,
            })
            .then((res) => {
              const { token, refreshToken } = res.data;

              setCookie(ctx, "auth.token", token, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: "/",
              });

              setCookie(ctx, "auth.refreshToken", refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: "/",
              });

              api.defaults.headers["Authorization"] = `Bearer ${token}`;

              failedRequestsQueue.forEach((request) =>
                request.onSuccess(token)
              );
              failedRequestsQueue = [];
            })
            .catch((err) => {
              failedRequestsQueue.forEach((request) => request.onFail(err));
              failedRequestsQueue = [];

              if (process.browser) {
                signOut();
              }
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers["Authorization"] = `Bearer ${token}`;

              resolve(api(originalConfig));
            },
            onFail: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      } else {
        if (process.browser) {
          signOut();
        } else {
          return Promise.reject(new AuthTokenError());
        }
      }
    }

    return Promise.reject(error);
  }

  api.interceptors.response.use(sucessHandler, errorHandler);

  return api;
}
