import React, { useState, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/core'

interface BlockHoverOverlayProps {
  editor: Editor
}

export const BlockHoverOverlay: React.FC<BlockHoverOverlayProps> = ({ editor }) => {
  const [hoveredNodePos, setHoveredNodePos] = useState<number | null>(null)
  const [nodeType, setNodeType] = useState<string>('')
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden', opacity: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)
  const currentPosRef = useRef<number | null>(null)

  useEffect(() => {
    let animationFrameId: number

    const handleMouseMove = (event: MouseEvent) => {
      cancelAnimationFrame(animationFrameId)

      animationFrameId = requestAnimationFrame(() => {
        // Fix: If the cursor is physically inside the popover toolbar, freeze tracking and do nothing
        if (overlayRef.current && overlayRef.current.contains(event.target as Node)) {
          return
        }

        if (!editor || !editor.view.dom.contains(event.target as Node)) {
          return
        }

        const targetElement = document.elementFromPoint(event.clientX, event.clientY)
        if (!targetElement || !editor.view.dom.contains(targetElement)) return

        const posAtCoords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!posAtCoords) return

        const { pos } = posAtCoords
        const { doc } = editor.state
        
        if (pos > doc.content.size) return

        const $pos = doc.resolve(pos)
        const blockDepth = 1
        
        if ($pos.depth >= blockDepth) {
          const startPos = $pos.before(blockDepth)
          
          if (currentPosRef.current === startPos) return

          const node = doc.nodeAt(startPos)
          if (node) {
            currentPosRef.current = startPos
            setHoveredNodePos(startPos)
            setNodeType(node.type.name)

            const nodeDOM = editor.view.nodeDOM(startPos) as HTMLElement
            const relativeContainer = editor.view.dom.parentElement

            if (nodeDOM && relativeContainer) {
              const rect = nodeDOM.getBoundingClientRect()
              const containerRect = relativeContainer.getBoundingClientRect()

              setStyle({
                visibility: 'visible',
                opacity: 1,
                top: `${rect.top - containerRect.top + relativeContainer.scrollTop}px`,
                left: `${rect.left - containerRect.left}px`,
              })
              return
            }
          }
        }
      })
    }

    const handleMouseLeave = (event: MouseEvent) => {
      // Fix: If the mouse leaves the text element but moves into our menu container, do not close it
      if (overlayRef.current && overlayRef.current.contains(event.relatedTarget as Node)) {
        return
      }

      const relativeContainer = editor.view.dom.parentElement
      if (relativeContainer && !relativeContainer.contains(event.relatedTarget as Node)) {
        cancelAnimationFrame(animationFrameId)
        currentPosRef.current = null
        setStyle({ visibility: 'hidden', opacity: 0 })
      }
    }

    const dom = editor.view.dom
    const container = dom.parentElement

    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [editor])

  if (hoveredNodePos === null) return null

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
    currentPosRef.current = null
    setStyle({ visibility: 'hidden', opacity: 0 })
  }

  const deleteBlock = () => {
    const { state, view } = editor
    const currentBlockNode = state.doc.nodeAt(hoveredNodePos)
    if (!currentBlockNode) return

    const tr = state.tr.delete(hoveredNodePos, hoveredNodePos + currentBlockNode.nodeSize)
    view.dispatch(tr)
    currentPosRef.current = null
    setStyle({ visibility: 'hidden', opacity: 0 })
  }

  const renderCustomBlockOptions = () => {
    switch (nodeType) {
      case 'iframe':
        return (
          <>
            <span className="block-hover-divider" style={dividerStyle}>|</span>
            <button 
              onClick={() => {
                const newUrl = window.prompt('Update Iframe URL:')
                if (newUrl) {
                  editor.chain().focus().setNodeSelection(hoveredNodePos).updateAttributes('iframe', { src: newUrl }).run()
                }
              }}
              title="Change Source URL"
              style={btnStyle}
            >
              🔗 URL
            </button>
          </>
        )
      case 'columns':
        return (
          <>
            <span className="block-hover-divider" style={dividerStyle}>|</span>
            <button 
              onClick={() => {
                editor.chain().focus().setNodeSelection(hoveredNodePos).updateAttributes('columns', { count: 3 }).run()
              }}
              title="Switch layout schema"
              style={btnStyle}
            >
              ◪ 3-Col
            </button>
          </>
        )
      case 'heading':
        return (
          <>
            <span className="block-hover-divider" style={dividerStyle}>|</span>
            <button 
              onClick={() => {
                editor.chain().focus().setNodeSelection(hoveredNodePos).toggleHeading({ level: 2 }).run()
              }}
              title="Convert to Heading 2"
              style={btnStyle}
            >
              H2
            </button>
          </>
        )
        case 'accordion':
  return (
    <>
      <span className="block-hover-divider" style={dividerStyle}>|</span>
      <button 
        onClick={() => {
          // Selects the target element and shifts open state parameters
          editor.chain().focus().setNodeSelection(hoveredNodePos).run()
        }}
        title="Focus element selection container"
        style={btnStyle}
      >
        👁️ Focus Frame
      </button>
    </>
  )
case 'callout':
  return (
    <>
      <span className="block-hover-divider" style={dividerStyle}>|</span>
      <button 
        onClick={() => {
          editor.chain().focus().updateAttributes('callout', { type: 'info' }).run()
        }}
        title="Switch to Info theme style"
        style={btnStyle}
      >
        🔵 Info
      </button>
      <button 
        onClick={() => {
          editor.chain().focus().updateAttributes('callout', { type: 'warning' }).run()
        }}
        title="Switch to Warning theme style"
        style={btnStyle}
      >
        🟡 Warn
      </button>
      <button 
        onClick={() => {
          editor.chain().focus().updateAttributes('callout', { type: 'success' }).run()
        }}
        title="Switch to Success theme style"
        style={btnStyle}
      >
        🟢 Success
      </button>
    </>
  )

      default:
        return null
    }
  }

  return (
    <div 
      ref={overlayRef} 
      className="block-hover-wrapper" 
      // Fixed: This container element remains un-hidden and handles layout mouse-leave bubbling checks cleanly
  
      style={{
        ...style,
        position: 'absolute',
        pointerEvents: 'auto', // Keep container receptive to catch mouse bridge hovers
        display: 'block',
        zIndex: 9999,
        // Fixed: Added padding-top to create an invisible hover "bridge" connecting the toolbar to the block
        paddingTop: '32px', 
        transform: 'translateY(-32px)', // Offsets the padding height adjustment perfectly
        transition: 'top 0.1s cubic-bezier(0.25, 1, 0.5, 1), left 0.1s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
    >
      <div 
        className="block-hover-toolbar"
        style={{ 
          display: 'flex',
          background: '#ffffff',
          border: '1px solid #1e1e1e',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1), 0px 12px 24px rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
          padding: '4px',
          gap: '4px',
          position: 'absolute',
          top: 0, // Aligns toolbar perfectly inside the newly created absolute container bounds
          left: 0,
        }}
      >
        <button onClick={() => moveBlock('up')} title="Move Block Up" style={btnStyle}>▲</button>
        <button onClick={() => moveBlock('down')} title="Move Block Down" style={btnStyle}>▼</button>
        {renderCustomBlockOptions()}
        <span className="block-hover-divider" style={dividerStyle}>|</span>
        <button onClick={deleteBlock} className="delete-btn" style={deleteBtnStyle} title="Delete Entire Block">🗑️</button>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '12px',
  color: '#1e1e1e',
  borderRadius: '2px',
}

const deleteBtnStyle: React.CSSProperties = {
  ...btnStyle,
  color: '#dc2626',
}

const dividerStyle: React.CSSProperties = {
  color: '#ccc', 
  alignSelf: 'center', 
  margin: '0 2px',
  fontSize: '12px',
}
