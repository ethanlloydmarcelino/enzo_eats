import { defaults } from './defaults'
// Tombstones remain in the table, so deleted defaults are never recreated.
export const ensureMenuDefaults = async (models: any) => {
  for (const item of defaults) {
    const id = String(item.id)
    const imageId = 'bundled-' + id
    for (const [model, input] of [
      [models.MenuImage, { id: imageId, label: item.name.en, bundledId: item.id }],
      [
        models.MenuItem,
        {
          id,
          name: item.name.en,
          nameTl: item.name.tl,
          description: item.description.en,
          descriptionTl: item.description.tl,
          price: item.price,
          category: item.category,
          visible: true,
          available: true,
          deleted: false,
          imageAssetId: imageId,
          options: item.options?.map((option) => option.name.en) ?? [],
        },
      ],
    ]) {
      const found = await model.get({ id: input.id })
      if (found.errors?.length) throw new Error('MENU_LOAD_FAILED')
      if (!found.data) {
        const created = await model.create(input)
        if (created.errors?.length && !(await model.get({ id: input.id })).data)
          throw new Error('MENU_INITIALIZE_FAILED')
      }
    }
  }
}
