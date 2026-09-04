import { Node } from '@tiptap/core'
import styles from './Accordion.module.css'

export const AccordionContent = Node.create({
  name: 'accordionContent',
  content: 'block+', // Allows any paragraph, list, image or iframe blocks inside the content area
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="accordion-content"]' }]
  },

  renderHTML() {
    return ['div', { 'data-type': 'accordion-content', class: styles.accordionContent }, 0]
  },
})
