const CLIENT_ID_PROPERTY_NAME = 'OAUTH_CLIENT_ID'
const CLIENT_SECRET_PROPERTY_NAME = 'OAUTH_CLIENT_SECRET'

// TODO - Edit these values to reflect your service.
const SERVICE_NAME = 'oura-looker-studio-connector'
const AUTHORIZATION_BASE_URL = 'https://cloud.ouraring.com/oauth/authorize'
const TOKEN_URL = 'https://api.ouraring.com/oauth/token'

// https://developers.google.com/datastudio/connector/auth#getauthtype
const getAuthType = (): GetAuthTypeResponse => {
  const AuthTypes = cc.AuthType
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.OAUTH2)
    .build()
}

// https://developers.google.com/datastudio/connector/auth#get3pauthorizationurls
const get3PAuthorizationUrls = () => getOAuthService().getAuthorizationUrl()

// https://developers.google.com/datastudio/connector/auth#authcallback
const authCallback = (request: object) => {
  const authorized = getOAuthService().handleCallback(request)
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.')
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab')
  }
}

// https://developers.google.com/datastudio/connector/auth#isauthvalid
const isAuthValid = () => getOAuthService().hasAccess()

// https://developers.google.com/datastudio/connector/auth#resetauth
const resetAuth = () => getOAuthService().reset()

// Helper function to get the configured OauthService.
const getOAuthService = () => {
  const scriptProps = PropertiesService.getScriptProperties()

  return OAuth2.createService(SERVICE_NAME)
    .setAuthorizationBaseUrl(AUTHORIZATION_BASE_URL)
    .setTokenUrl(TOKEN_URL)
    .setClientId(scriptProps.getProperty(CLIENT_ID_PROPERTY_NAME))
    .setClientSecret(scriptProps.getProperty(CLIENT_SECRET_PROPERTY_NAME))
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback')
}
