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

const readinessData: Record<string, string> = {
  readiness: 'score',
  'readiness.activity_balance': 'contributors.activity_balance',
  'readiness.body_temperature': 'contributors.body_temperature',
  'readiness.hrv_balance': 'contributors.hrv_balance',
  'readiness.previous_day_activity': 'contributors.previous_day_activity',
  'readiness.previous_night': 'contributors.previous_night',
  'readiness.recovery_index': 'contributors.recovery_index',
  'readiness.resting_heart_rate': 'contributors.resting_heart_rate',
  'readiness.sleep_balance': 'contributors.sleep_balance',
  'readiness.temperature_deviation': 'temperature_deviation',
  'readiness.temperature_trend_deviation': 'temperature_trend_deviation',
}

const titleCase = (key: string) =>
  key
    .split(/[\._]/)
    .map(w => w.replace(w[0], w[0].toUpperCase()))
    .join(' ')

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

  Object.keys(readinessData).forEach(key =>
    fields
      .newMetric()
      .setId(key)
      .setName(key === 'readiness' ? 'Readiness' : titleCase(key))
      .setType(types.NUMBER)
      .setAggregation(aggregations.AVG),
  )

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

    const requestedFieldNames = request.fields.map(({ name }) => name)

    console.log({ requestedFieldNames })

    // Readiness
    const url = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`
    const response = UrlFetchApp.fetch(url, { headers: { Authorization: `Bearer ${access_token}` } })

    const rows = JSON.parse(response.getContentText()).data.map(readiness => ({
      values: requestedFieldNames.map(field => {
        if (field === 'day') return readiness.day.split('-').join('')
        if (field === 'readiness') return readiness.score

        if (readinessData[field].includes('.')) {
          const [a, b] = readinessData[field].split('.')
          return readiness[a][b]
        } else return readiness[readinessData[field]]
      }),
    }))

    console.log('Rows', rows)

    return {
      schema: getFields()
        .forIds(requestedFieldNames)
        .build(),
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
    return { schema: [], rows: [] }
  }
}

export { getConfig, getSchema, getData }
