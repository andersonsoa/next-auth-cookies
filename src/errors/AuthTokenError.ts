export class AuthTokenError extends Error {
  constructor() {
    super("erro com o token de autenticação");
  }
}
