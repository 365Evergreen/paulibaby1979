import React from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Editor, isNodeSelection } from '@tiptap/core'
import styles from './BlockSettingsMenu.module.css'


interface BlockSettingsMenuProps {
  editor: Editor
}

export const BlockSettingsMenu: React.FC<BlockSettingsMenuProps> = ({ editor }) => {
  // Only display the overlay when a structured block asset is directly selected
  const shouldShow = ({ state }: { state: any }) => {
    const { selection } = state
    // Only displays popover controls if a node layout itself is focused/selected
    return isNodeSelection(selection)
  }



  const moveUp = () => {
    const { state, view } = editor
    const { selection } = state
    if (!isNodeSelection(selection)) return

    const { $from } = selection
    const index = $from.index(0)

    // Already the top-most root block element
    if (index === 0) return

    const currentBlockNode = selection.node
    const currentBlockPos = selection.from
    const currentBlockSize = currentBlockNode.nodeSize

    // Find the position directly before the preceding sibling node
    const prevBlockNode = $from.node(0).child(index - 1)
    const prevBlockPos = currentBlockPos - prevBlockNode.nodeSize

    // Execute standard atomic transaction: remove block from old position, insert at new position
    const tr = state.tr
    tr.delete(currentBlockPos, currentBlockPos + currentBlockSize)
    tr.insert(prevBlockPos, currentBlockNode)

    view.dispatch(tr)
    editor.chain().focus().run()
  }

  const moveDown = () => {
    const { state, view } = editor
    const { selection } = state
    if (!isNodeSelection(selection)) return

    const { $from } = selection
    const index = $from.index(0)
    const totalChildCount = $from.node(0).childCount

    // Already the bottom-most root block item
    if (index >= totalChildCount - 1) return

    const currentBlockNode = selection.node
    const currentBlockPos = selection.from
    const currentBlockSize = currentBlockNode.nodeSize

    // Find the position directly after the next sibling node
    const nextBlockNode = $from.node(0).child(index + 1)
    const nextBlockPos = currentBlockPos + currentBlockSize + nextBlockNode.nodeSize

    const tr = state.tr
    // Insert first at destination position, then safely clear out the original starting position
    tr.insert(nextBlockPos, currentBlockNode)
    tr.delete(currentBlockPos, currentBlockPos + currentBlockSize)

    view.dispatch(tr)
    editor.chain().focus().run()
  }

  const deleteBlock = () => {
    editor.chain().focus().deleteSelection().run()
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
    >
      <div className={styles.blockPopover}>
        <button onClick={moveUp} title="Move Up">▲</button>
        <button onClick={moveDown} title="Move Down">▼</button>
        <span className={styles.popoverDivider}>|</span>
        <button onClick={deleteBlock} className={styles.deleteButton} title="Delete Block">
          🗑️
        </button>
      </div>
    </BubbleMenu>
  )
}
