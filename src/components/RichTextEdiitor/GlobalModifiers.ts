import { Extension } from '@tiptap/core'

export const GlobalBlockModifiers = Extension.create({
  name: 'globalBlockModifiers',

  addGlobalAttributes() {
    return [
      {
        // Target all block-level elements in the schema
        types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'listItem', 'iframe', 'youtube'],
        attributes: {
          // Injects the native HTML5 draggable attribute
          draggable: {
            default: 'true',
            keepOnSplit: false,
            parseHTML: element => element.getAttribute('draggable') ?? 'true',
            renderHTML: () => ({ draggable: 'true' }),
          },
          // Adds a data attribute for clean CSS targeting
          'data-selectable-block': {
            default: 'true',
            parseHTML: element => element.getAttribute('data-selectable-block') ?? 'true',
            renderHTML: () => ({ 'data-selectable-block': 'true' }),
          },
        },
      },
    ]
  },
})
