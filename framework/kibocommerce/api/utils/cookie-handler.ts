import { KiboCommerceConfig } from './../index'
import { getCookieExpirationDate } from '@framework/lib/getCookieExpirationDate'
import { prepareSetCookie } from '@framework/lib/prepareSetCookie'
import { setCookies } from '@framework/lib/setCookie'
import { NextApiRequest } from 'next'
import getAnonymousShopperToken from './get-anonymous-shopper-token'

export default class CookieHandler {
  config: KiboCommerceConfig
  request: NextApiRequest
  response: any
  accessToken: any
  constructor(config: any, req: NextApiRequest, res: any) {
    this.config = config
    this.request = req
    this.response = res
    const encodedToken = req.cookies[config.customerCookie]
    const token = encodedToken
      ? JSON.parse(Buffer.from(encodedToken, 'base64').toString('ascii'))
      : null
    this.accessToken = token ? token.accessToken : null
  }

  async getAnonymousToken() {
    const response: any = await getAnonymousShopperToken({
      config: this.config,
    })
    let anonymousAccessToken = response?.accessToken
    return {
      response,
      accessToken: anonymousAccessToken,
    }
  }

  setAnonymousShopperCookie(anonymousShopperTokenResponse: any) {
    const cookieExpirationDate = getCookieExpirationDate(
      this.config.customerCookieMaxAgeInDays
    )

    const authCookie = prepareSetCookie(
      this.config.customerCookie,
      JSON.stringify(anonymousShopperTokenResponse),
      anonymousShopperTokenResponse?.accessTokenExpiration
        ? { expires: cookieExpirationDate }
        : {}
    )
    setCookies(this.response, [authCookie])
  }
  getAccessToken() {
    return this.accessToken
  }
}
