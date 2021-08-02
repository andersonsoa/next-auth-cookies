import Router from "next/router";
import { setCookie, parseCookies, destroyCookie } from "nookies";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../services/apiClient";

type User = {
  email: string;
  roles: string[];
  permissions: string[];
};

type AuthCredentialsData = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn: (credentials: AuthCredentialsData) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, "auth.token");
  destroyCookie(undefined, "auth.refreshToken");

  authChannel.postMessage("signOut");

  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  async function signIn({
    email,
    password,
  }: AuthCredentialsData): Promise<void> {
    try {
      const response = await api.post("/sessions", { email, password });

      const { token, refreshToken, permissions, roles } = response.data;

      // sessionStorage => dura somente enquanto o navegador esta aberto
      // localStorage => só é acessivel no navegador
      // cookie => dura muito tempo e é acessivel no navegador e no servidor

      setCookie(undefined, "auth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/",
      });

      setCookie(undefined, "auth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/",
      });

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      Router.push("/dashboard");
      authChannel.postMessage("signIn");
    } catch (e) {
      console.log(e.message);
    }
  }

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          isAuthenticated && signOut();
          break;
        case "signIn":
          Router.push("/dashboard");
          break;
        default:
          break;
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const { "auth.token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((res) => {
          const { email, permissions, roles } = res?.data;

          setUser({
            email,
            permissions,
            roles,
          });
        })
        .catch(() => {
          signOut();
        });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
