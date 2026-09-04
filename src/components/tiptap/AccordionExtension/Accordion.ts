import { Node } from '@tiptap/core'
import styles from './Accordion.module.css'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordion: {
      /**
       * Insert a new accordion element tree
       */
      insertAccordion: () => ReturnType
    }
  }
}

export const Accordion = Node.create({
  name: 'accordion',
  group: 'block',
  // Enforces that an accordion must strictly contain a header followed by content
  content: 'accordionHeader accordionContent',
  isolating: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'details[data-type="accordion"]' }]
  },

  renderHTML() {
    // Renders as a native open/collapsible details wrapper using CSS modules class injection
    return ['details', { 'data-type': 'accordion', class: styles.accordionContainer, open: 'true' }, 0]
  },

  addCommands() {
    return {
      insertAccordion:
        () =>
        ({ editor }) => {
          const headerNode = editor.schema.nodes.accordionHeader.createAndFill()
          const defaultParagraph = editor.schema.nodes.paragraph.createAndFill()
          const contentNode = editor.schema.nodes.accordionContent.createAndFill({}, defaultParagraph)

          if (!headerNode || !contentNode) return false

          const accordionTree = this.type.create({}, [headerNode, contentNode])
          return editor.chain().insertContent(accordionTree.toJSON()).run()
        },
    }
  },
})
