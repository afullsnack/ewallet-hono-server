import { logger } from "../../middlewares/logger";
import { Env } from "../../app";
import { pipe, Effect } from "effect";
import { Schema } from "@effect/schema";
import { HttpClient, HttpClientResponse, HttpClientRequest } from "@effect/platform"
import { Context } from "hono";
import { errors } from "effect/Brand";


const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  expires_in: Schema.Number,
  token_type: Schema.String,
  scope: Schema.String,
});

interface ILogtoService {
  register({
    username,
    email,
    password,
  }: { username: string; email: string; password: string; }): Promise<any>;
  login({ email, password }: { email: string; password: string; }): Promise<any>
}
export class LogtoAuthAdapter implements ILogtoService {
  private endpoint = process.env.LOGTO_APP_ENDPOINT!;
  private appId = process.env.LOGTO_APP_ID!;
  private appSecret = process.env.LOGTO_APP_SECRET!;
  public auth = {};

  constructor(c?: Context<Env>) { }

  async generateAccessToken() {
    return pipe(
      HttpClientRequest.post(`${this.endpoint}/oidc/token`),
      HttpClientRequest.acceptJson,
      HttpClientRequest.setHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64')}`
      }),
      HttpClientRequest.urlParamsBody({
        'grant_type': 'client_credentials',
        'resource': `${this.endpoint}/api`,
        'scope': 'all'
      }), // url params body
      HttpClient.fetch,
      Effect.tap((response) => Effect.gen(function*(){
        const json = yield* response.json;
        console.log(json, ":::json");
      })),
      Effect.andThen(HttpClientResponse.schemaBodyJson(TokenResponse, { errors: 'all' })),
      Effect.scoped,
      Effect.catchAll((e) => Effect.fail(e)),
      Effect.andThen((value) => {
        this.auth = {
          token: value.access_token,
          type: value.token_type,
        };
      }),
      Effect.runPromise
    )
  }

  async register({ username, email, password }: { username: string; email: string; password: string; }): Promise<{}> {
    logger.info(username, email, password);
    return Promise.all([]);
  }

  async login({ email, password }: { email: string; password: string; }): Promise<any> {
    logger.info(email, password);
  }

  get getConfig() {
    return {
      appId: this.appId,
      appSecret: this.appSecret,
      endpoint: this.endpoint,
    };
  }
}
