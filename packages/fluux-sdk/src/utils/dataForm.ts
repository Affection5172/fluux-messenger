import type { Element } from '@xmpp/client'
import type { DataForm, DataFormField, DataFormFieldType } from '../core/types'

/**
 * Parse XEP-0004 Data Form from XML element.
 */
export function parseDataForm(formEl: Element): DataForm {
  const form: DataForm = {
    type: (formEl.attrs.type as DataForm['type']) || 'form',
    fields: [],
  }

  // Parse title
  const titleEl = formEl.getChild('title')
  if (titleEl) {
    form.title = titleEl.text() || undefined
  }

  // Parse instructions
  const instructionsEls = formEl.getChildren('instructions')
  if (instructionsEls.length > 0) {
    form.instructions = instructionsEls
      .map(el => el.text() || '')
      .filter(Boolean)
  }

  // Parse fields
  const fieldEls = formEl.getChildren('field')
  for (const fieldEl of fieldEls) {
    const field: DataFormField = {
      var: fieldEl.attrs.var || '',
      type: (fieldEl.attrs.type as DataFormFieldType) || 'text-single',
      label: fieldEl.attrs.label,
    }

    // Parse value(s)
    const valueEls = fieldEl.getChildren('value')
    if (valueEls.length === 1) {
      field.value = valueEls[0].text() || ''
    } else if (valueEls.length > 1) {
      field.value = valueEls.map(v => v.text() || '')
    }

    // Parse options (for list fields)
    const optionEls = fieldEl.getChildren('option')
    if (optionEls.length > 0) {
      field.options = optionEls.map(opt => ({
        label: opt.attrs.label || opt.getChildText('value') || '',
        value: opt.getChildText('value') || '',
      }))
    }

    // Parse required
    if (fieldEl.getChild('required')) {
      field.required = true
    }

    // Parse description
    const descEl = fieldEl.getChild('desc')
    if (descEl) {
      field.desc = descEl.text() || undefined
    }

    form.fields.push(field)
  }

  return form
}

/**
 * Get a field value from a parsed data form.
 * Returns the first value if single, or undefined if not found.
 */
export function getFormFieldValue(form: DataForm, varName: string): string | undefined {
  const field = form.fields.find(f => f.var === varName)
  if (!field?.value) return undefined
  return Array.isArray(field.value) ? field.value[0] : field.value
}

/**
 * Get all field values from a parsed data form.
 * Returns an array of values.
 */
export function getFormFieldValues(form: DataForm, varName: string): string[] {
  const field = form.fields.find(f => f.var === varName)
  if (!field?.value) return []
  return Array.isArray(field.value) ? field.value : [field.value]
}
