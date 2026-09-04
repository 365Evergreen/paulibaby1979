import { Node } from '@tiptap/core'
import styles from './Accordion.module.css'

export const AccordionHeader = Node.create({
  name: 'accordionHeader',
  // Keeps it strictly restricted to text only, preventing nested structural block injection
  content: 'text*',
  marks: '', // Optional: leaves empty to prevent bolding/italics inside headings if desired
  defining: true,

  parseHTML() {
    return [{ tag: 'summary[data-type="accordion-header"]' }]
  },

  renderHTML() {
    return ['summary', { 'data-type': 'accordion-header', class: styles.accordionHeader }, 0]
  },
})
