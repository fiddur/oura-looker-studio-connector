//const cc = DataStudioApp.createCommunityConnector()
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
function isAuthValid() {
  return getOAuthService().hasAccess()
}

// https://developers.google.com/datastudio/connector/auth#resetauth
function resetAuth() {
  getOAuthService().reset()
}

// Helper function to get the configured OauthService.
function getOAuthService() {
  // Remove this call after setting the necessary config values.
  checkConfiguration()

  const scriptProps = PropertiesService.getScriptProperties()

  return OAuth2.createService(SERVICE_NAME)
    .setAuthorizationBaseUrl(AUTHORIZATION_BASE_URL)
    .setTokenUrl(TOKEN_URL)
    .setClientId(scriptProps.getProperty(CLIENT_ID_PROPERTY_NAME))
    .setClientSecret(scriptProps.getProperty(CLIENT_SECRET_PROPERTY_NAME))
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback')
}

// TODO - remove this function, (and it's invocation on line 47) after setting
// the `OAUTH_CLIENT_ID`, & `OAUTH_CLIENT_SECRET` values in your script
// properties and the SERVICE_NAME, AUTHORIZATION_BASE_URL, & TOKEN_URL
// variables.
function checkConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties()
  const errors = []
  if (!scriptProperties.getProperty(CLIENT_ID_PROPERTY_NAME)) {
    errors.push('Set the "' + CLIENT_ID_PROPERTY_NAME + '" script property for this project.')
  }
  if (!scriptProperties.getProperty(CLIENT_ID_PROPERTY_NAME)) {
    errors.push('Set the "' + CLIENT_ID_PROPERTY_NAME + '" script property for this project.')
  }
  if (errors.length !== 0) {
    cc.newDebugError()
      .setText(errors.join(' '))
      .throwException()
  }
}
