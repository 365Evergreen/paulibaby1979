import React, { useState, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/core'

interface BlockHoverOverlayProps {
  editor: Editor
}

export const BlockHoverOverlay: React.FC<BlockHoverOverlayProps> = ({ editor }) => {
  const [hoveredNodePos, setHoveredNodePos] = useState<number | null>(null)
  const [nodeType, setNodeType] = useState<string>('')
  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' })
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!editor || !editor.view.dom.contains(event.target as Node)) {
        return
      }

      // Find the Prosemirror position coordinates under the mouse pointer
      const posAtCoords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })
      if (!posAtCoords) return

      const { pos } = posAtCoords
      const { doc } = editor.state
      
      // Resolve the position up to root level 1 to select the whole block element
      const $pos = doc.resolve(pos)
      const blockDepth = 1
      
      if ($pos.depth >= blockDepth) {
        const startPos = $pos.before(blockDepth)
        const node = doc.nodeAt(startPos)

        if (node) {
          setHoveredNodePos(startPos)
          setNodeType(node.type.name)

          // Query the real DOM element matching this block to anchor coordinates
          const nodeDOM = editor.view.nodeDOM(startPos) as HTMLElement
          if (nodeDOM) {
            const rect = nodeDOM.getBoundingClientRect()
            const editorRect = editor.view.dom.getBoundingClientRect()

            setStyle({
              display: 'flex',
              top: `${rect.top - editorRect.top + editor.view.dom.scrollTop}px`,
              left: `${rect.left - editorRect.left}px`,
              height: `${rect.height}px`,
            })
            return
          }
        }
      }
      
      // Hide if mouse leaves a valid root block
      setStyle({ display: 'none' })
    }

    const handleMouseLeave = () => {
      setStyle({ display: 'none' })
    }

    const dom = editor.view.dom
    dom.addEventListener('mousemove', handleMouseMove)
    dom.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      dom.removeEventListener('mousemove', handleMouseMove)
      dom.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor])

  if (hoveredNodePos === null) return null

  // Universal Movement Actions
  const moveBlock = (direction: 'up' | 'down') => {
    const { state, view } = editor
    const doc = state.doc
    const $pos = doc.resolve(hoveredNodePos)
    const index = $pos.index(0)
    const totalChildCount = doc.childCount

    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index >= totalChildCount - 1) return

    const currentBlockNode = doc.nodeAt(hoveredNodePos)
    if (!currentBlockNode) return
    const currentBlockSize = currentBlockNode.nodeSize

    const tr = state.tr
    if (direction === 'up') {
      const prevBlockNode = doc.child(index - 1)
      const prevBlockPos = hoveredNodePos - prevBlockNode.nodeSize
      tr.delete(hoveredNodePos, hoveredNodePos + currentBlockSize)
      tr.insert(prevBlockPos, currentBlockNode)
    } else {
      const nextBlockNode = doc.child(index + 1)
      const nextBlockPos = hoveredNodePos + currentBlockSize + nextBlockNode.nodeSize
      tr.insert(nextBlockPos, currentBlockNode)
      tr.delete(hoveredNodePos, hoveredNodePos + currentBlockSize)
    }

    view.dispatch(tr)
    editor.chain().focus().run()
    setStyle({ display: 'none' }) // Reset overlay coordinate tracking
  }

  const deleteBlock = () => {
    const { state, view } = editor
    const currentBlockNode = state.doc.nodeAt(hoveredNodePos)
    if (!currentBlockNode) return

    const tr = state.tr.delete(hoveredNodePos, hoveredNodePos + currentBlockNode.nodeSize)
    view.dispatch(tr)
    setStyle({ display: 'none' })
  }

  // Dynamic conditional block rendering logic based on active block type
  const renderCustomBlockOptions = () => {
    switch (nodeType) {
      case 'iframe':
        return (
          <>
            <span className="block-hover-divider">|</span>
            <button 
              onClick={() => {
                const newUrl = window.prompt('Update Iframe URL:')
                if (newUrl) {
                  editor.chain().focus().setNodeSelection(hoveredNodePos).updateAttributes('iframe', { src: newUrl }).run()
                }
              }}
              title="Change Source URL"
            >
              🔗 URL
            </button>
          </>
        )
      case 'columns':
        return (
          <>
            <span className="block-hover-divider">|</span>
            <button 
              onClick={() => {
                // Dynamically transform a 2-col to a 3-col wrapper structure
                editor.chain().focus().setNodeSelection(hoveredNodePos).updateAttributes('columns', { count: 3 }).run()
              }}
              title="Switch layout schema"
            >
              ◪ 3-Col
            </button>
          </>
        )
      case 'heading':
        return (
          <>
            <span className="block-hover-divider">|</span>
            <button 
              onClick={() => {
                editor.chain().focus().setNodeSelection(hoveredNodePos).toggleHeading({ level: 2 }).run()
              }}
              title="Convert to Heading 2"
            >
              H2
            </button>
          </>
        )
      default:
        return null // Standard text nodes like paragraphs just get default actions
    }
  }

  return (
    <div ref={overlayRef} className="block-hover-wrapper" style={style}>
      <div className="block-hover-toolbar">
        {/* Core Actions shared across all blocks */}
        <button onClick={() => moveBlock('up')} title="Move Block Up">▲</button>
        <button onClick={() => moveBlock('down')} title="Move Block Down">▼</button>
        
        {/* Context-Aware Dynamic Actions Injection */}
        {renderCustomBlockOptions()}

        <span className="block-hover-divider">|</span>
        <button onClick={deleteBlock} className="delete-btn" title="Delete Entire Block">
          🗑️
        </button>
      </div>
    </div>
  )
}
