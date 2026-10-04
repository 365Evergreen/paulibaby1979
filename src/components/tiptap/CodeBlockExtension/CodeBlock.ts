// CustomCodeBlock.ts
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import styles from './CodeBlock.module.css'

export const CodeBlock = CodeBlockLowlight.extend({
  // Define how the HTML is rendered inside the editor schema
  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre', 
      { 
        ...HTMLAttributes,
        class: styles.codeBlockWrapper,
        'data-language': node.attrs.language || 'plaintext'
      }, 
      [
        'code', 
        { class: styles.codeBlock }, 
        0 // 0 specifies where the text content is injected
      ]
    ]
  },
})
