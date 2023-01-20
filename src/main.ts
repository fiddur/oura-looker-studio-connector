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

// https://developers.google.com/datastudio/connector/reference#getdata
const getData = (request: GetDataRequest): GetDataResponse => {
  try {
    const { startDate, endDate } = request.dateRange
    const token = getOAuthService().getToken()

    // Calling `UrlFetchApp.fetch()` makes this connector require authentication.
    const response = UrlFetchApp.fetch(
      `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    console.log(response)

    const requestedFields = getFields().forIds(request.fields.map(({ name }) => name))
    const rows = JSON.parse(response.getContentText()).data.map(({ day, score }) => [day, score])

    console.log({ schema: requestedFields.build(), rows })

    return {
      schema: requestedFields.build(),
      rows,
    }
  } catch (e) {
    cc.newUserError()
      .setDebugText('Error fetching data from API. Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.',
      )
      .throwException()
  }
}
