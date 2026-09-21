import { dataClient, throwOnErrors } from './client'

let writes = Promise.resolve()
export const saveAccountPreferences = (owner, values) => {
  const save = writes
    .catch(() => {})
    .then(async () => {
      const model = dataClient.models.AccountPreferences
      const existing = throwOnErrors(await model.get({ id: owner }))
      const input = { id: owner, ...values }
      return throwOnErrors(
        await (existing ? model.update(input) : model.create({ ...input, owner })),
      )
    })
  writes = save
  return save
}
