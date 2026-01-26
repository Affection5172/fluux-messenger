import { xml, Element } from '@xmpp/client'
import type { RSMRequest, RSMResponse } from '../core/types'
import { NS_RSM } from '../core/namespaces'

/**
 * Parse RSM response from XML element (XEP-0059).
 */
export function parseRSMResponse(setElement: Element | undefined): RSMResponse {
  if (!setElement) return {}

  const response: RSMResponse = {}

  const firstEl = setElement.getChild('first')
  if (firstEl) {
    response.first = firstEl.getText() || undefined
    const indexAttr = firstEl.attrs.index
    if (indexAttr !== undefined) {
      response.firstIndex = parseInt(indexAttr, 10)
    }
  }

  const lastEl = setElement.getChild('last')
  if (lastEl) {
    response.last = lastEl.getText() || undefined
  }

  const countEl = setElement.getChild('count')
  if (countEl) {
    const countText = countEl.getText()
    if (countText) {
      response.count = parseInt(countText, 10)
    }
  }

  return response
}

/**
 * Build RSM request XML element (XEP-0059).
 */
export function buildRSMElement(rsm: RSMRequest): Element {
  const children: Element[] = []

  if (rsm.max !== undefined) {
    children.push(xml('max', {}, String(rsm.max)))
  }

  if (rsm.after !== undefined) {
    children.push(xml('after', {}, rsm.after))
  }

  if (rsm.before !== undefined) {
    children.push(xml('before', {}, rsm.before))
  }

  if (rsm.index !== undefined) {
    children.push(xml('index', {}, String(rsm.index)))
  }

  return xml('set', { xmlns: NS_RSM }, ...children)
}
