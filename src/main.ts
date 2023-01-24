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

const pick = (obj: object, key: string[]) =>
  key.length > 1 && obj[key[0]] ? pick(obj[key[0]], key.slice(1)) : obj[key[0]] || 0

const dataFields: Record<string, string> = {
  'readiness.score': 'readiness.score',
  'readiness.activity_balance': 'readiness.contributors.activity_balance',
  'readiness.body_temperature': 'readiness.contributors.body_temperature',
  'readiness.hrv_balance': 'readiness.contributors.hrv_balance',
  'readiness.previous_day_activity': 'readiness.contributors.previous_day_activity',
  'readiness.previous_night': 'readiness.contributors.previous_night',
  'readiness.recovery_index': 'readiness.contributors.recovery_index',
  'readiness.resting_heart_rate': 'readiness.contributors.resting_heart_rate',
  'readiness.sleep_balance': 'readiness.contributors.sleep_balance',
  'readiness.temperature_deviation': 'readiness.temperature_deviation',
  'readiness.temperature_trend_deviation': 'readiness.temperature_trend_deviation',

  'activity.score': 'activity.score',
  'activity.active_calories': 'activity.active_calories',
  'activity.average_met_minutes': 'activity.average_met_minutes',
  'activity.equivalent_walking_distance': 'activity.equivalent_walking_distance',
  'activity.high_activity_met_minutes': 'activity.high_activity_met_minutes',
  'activity.high_activity_time': 'activity.high_activity_time',
  'activity.inactivity_alerts': 'activity.inactivity_alerts',
  'activity.low_activity_met_minutes': 'activity.low_activity_met_minutes',
  'activity.low_activity_time': 'activity.low_activity_time',
  'activity.medium_activity_met_minutes': 'activity.medium_activity_met_minutes',
  'activity.medium_activity_time': 'activity.medium_activity_time',
  'activity.meet_daily_targets': 'activity.contributors.meet_daily_targets',
  'activity.meters_to_target': 'activity.meters_to_target',
  'activity.move_every_hour': 'activity.contributors.move_every_hour',
  'activity.non_wear_time': 'activity.non_wear_time',
  'activity.recovery_time': 'activity.contributors.recovery_time',
  'activity.resting_time': 'activity.resting_time',
  'activity.sedentary_met_minutes': 'activity.sedentary_met_minutes',
  'activity.sedentary_time': 'activity.sedentary_time',
  'activity.stay_active': 'activity.contributors.stay_active',
  'activity.steps': 'activity.steps',
  'activity.target_calories': 'activity.target_calories',
  'activity.target_meters': 'activity.target_meters',
  'activity.total_calories': 'activity.total_calories',
  'activity.training_frequency': 'activity.contributors.training_frequency',
  'activity.training_volume': 'activity.contributors.training_volume',
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

  Object.keys(dataFields).forEach(key =>
    fields
      .newMetric()
      .setId(key)
      .setName(titleCase(key))
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

type ReadinessDay = {
  id: string
  contributors: {
    activity_balance?: number
    body_temperature?: number
    hrv_balance?: number
    previous_day_activity?: number
    previous_night?: number
    recovery_index?: number
    resting_heart_rate?: number
    sleep_balance?: number
  }
  day: string
  score?: number
  temperature_deviation?: number
  temperature_trend_deviation?: number
  timestamp: string
}

type ActivityDay = {
  id: string
  contributors: Record<string, number>
  day: string
  timestamp: string
} & Record<string, number>

// https://developers.google.com/datastudio/connector/reference#getdata
const getData = (request: GetDataRequest): GetDataResponse => {
  try {
    const { access_token } = getOAuthService().getToken() as Token
    const { startDate, endDate } = request.dateRange

    const requestedFieldNames = request.fields.map(({ name }) => name)

    console.log({ requestedFieldNames })

    const data = {} // data by day for each subpart

    // Readiness
    if (requestedFieldNames.filter(name => name.startsWith('readiness')).length > 0) {
      const url = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`
      console.log(`Reading readiness from ${url}`)
      const response = UrlFetchApp.fetch(url, { headers: { Authorization: `Bearer ${access_token}` } })

      const { data: readinessDays }: { data: ReadinessDay[] } = JSON.parse(response.getContentText())
      readinessDays.forEach(readinessDay => {
        if (!(readinessDay.day in data)) data[readinessDay.day] = {}
        data[readinessDay.day].readiness = readinessDay
      })
    }

    // Activity
    if (requestedFieldNames.filter(name => name.startsWith('activity')).length > 0) {
      const url = `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`
      console.log(`Reading activity from ${url}`)
      const response = UrlFetchApp.fetch(url, { headers: { Authorization: `Bearer ${access_token}` } })

      const { data: activityDays }: { data: ActivityDay[] } = JSON.parse(response.getContentText())
      activityDays.forEach(activityDay => {
        if (!(activityDay.day in data)) data[activityDay.day] = {}
        data[activityDay.day].activity = activityDay
      })
    }

    const rows = Object.keys(data)
      .sort()
      .map(day => ({
        values: requestedFieldNames.map(field =>
          field === 'day' ? day.split('-').join('') : pick(data[day], dataFields[field].split('.')),
        ),
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
