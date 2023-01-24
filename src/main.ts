const cc = DataStudioApp.createCommunityConnector()

// https://developers.google.com/datastudio/connector/reference#isadminuser
const isAdminUser = () => false

// https://developers.google.com/datastudio/connector/reference#getconfig
const getConfig = (): GetConfigResponse => {
  const config = cc.getConfig()

  config
    .setDateRangeRequired(true)
    .newInfo()
    .setId('generalInfo')
    .setText('Simple play project to get some data from Oura into Looker Studio, no guarantees')

  return config.build()
}

type Fields = GoogleAppsScript.Data_Studio.Fields
const getFields = (): Fields => {
  const fields = cc.getFields()
  const types = cc.FieldType
  const aggregations = cc.AggregationType

  fields
    .newDimension()
    .setId('day')
    .setName('Date')
    .setType(types.YEAR_MONTH_DAY)

  fields
    .newMetric()
    .setId('readiness')
    .setName('Readiness')
    .setType(types.NUMBER)
    .setAggregation(aggregations.AVG)

  return fields
}

// https://developers.google.com/datastudio/connector/reference#getschema
const getSchema = (): GetSchemaResponse => ({ schema: getFields().build() })

type Token = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  granted_time: number
}

// https://developers.google.com/datastudio/connector/reference#getdata
const getData = (request: GetDataRequest): GetDataResponse => {
  try {
    const { access_token } = getOAuthService().getToken() as Token
    const { startDate, endDate } = request.dateRange

    const url = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`

    // console.log('Fetching', url)

    // Calling `UrlFetchApp.fetch()` makes this connector require authentication.
    const response = UrlFetchApp.fetch(url, { headers: { Authorization: `Bearer ${access_token}` } })

    const requestedFieldNames = request.fields.map(({ name }) => name)
    const requestedFields = getFields().forIds(requestedFieldNames)

    const rows = JSON.parse(response.getContentText()).data.map(({ day, score }) => ({
      values: [
        requestedFieldNames.includes('day') && day.split('-').join(''),
        requestedFieldNames.includes('readiness') && score,
      ].filter(Boolean),
    }))

    // console.log('Rows', rows)

    return {
      schema: requestedFields.build(),
      rows,
    }
  } catch (e) {
    console.error(e)

    cc.newUserError()
      .setDebugText('Error fetching data from API. Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.',
      )
      .throwException()
  }
}
