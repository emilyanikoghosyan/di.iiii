import { useCallback, useRef, useState } from 'react'
import StudioPresentationSurface from './StudioPresentationSurface.jsx'

const CAMERA_OPTIONS = [
    { value: 'perspective', label: 'Persp' },
    { value: 'top', label: 'Top' },
    { value: 'front', label: 'Front' },
    { value: 'right', label: 'Right' },
]

function ViewPane({ node, isRoot, onSplit, onClose, shared }) {
    const [cam, setCam] = useState('perspective')

    return (
        <div className="svl-pane">
            <div className="svl-toolbar">
                <select className="svl-cam" value={cam} onChange={(e) => setCam(e.target.value)}>
                    {CAMERA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <div className="svl-toolbar-actions">
                    <button className="svl-tbtn" onClick={() => onSplit(node.id, 'h')} title="Split left/right">⊟</button>
                    <button className="svl-tbtn" onClick={() => onSplit(node.id, 'v')} title="Split top/bottom">⊞</button>
                    {!isRoot && (
                        <button className="svl-tbtn svl-tbtn--close" onClick={() => onClose(node.id)} title="Close pane">×</button>
                    )}
                </div>
            </div>
            <div className="svl-canvas">
                <StudioPresentationSurface
                    document={shared.document}
                    selectedEntityId={shared.selectedEntityId}
                    onSelectEntity={shared.onSelectEntity}
                    cursors={shared.cursors}
                    onCursorMove={shared.onCursorMove}
                    onCursorLeave={shared.onCursorLeave}
                    cameraView={cam}
                    onCameraChange={setCam}
                    controlsRef={undefined}
                    xrStore={shared.xrStore}
                    editMode={shared.editMode}
                    gizmoMode={shared.gizmoMode}
                    onTransformCommit={shared.onTransformCommit}
                />
            </div>
        </div>
    )
}

function SplitContainer({ node, isRoot, onSplit, onClose, setRatio, shared }) {
    const containerRef = useRef(null)
    const [ratio, setLocalRatio] = useState(node.ratio ?? 0.5)

    const onHandleDown = useCallback((e) => {
        e.preventDefault()
        const el = containerRef.current
        if (!el) return

        const onMove = (ev) => {
            const rect = el.getBoundingClientRect()
            const r = node.dir === 'h'
                ? (ev.clientX - rect.left) / rect.width
                : (ev.clientY - rect.top) / rect.height
            const clamped = Math.min(Math.max(r, 0.1), 0.9)
            setLocalRatio(clamped)
            setRatio(node.id, clamped)
        }
        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }, [node.dir, node.id, setRatio])

    const aStyle = node.dir === 'h'
        ? { width: `${ratio * 100}%` }
        : { height: `${ratio * 100}%` }
    const bStyle = node.dir === 'h'
        ? { width: `${(1 - ratio) * 100}%` }
        : { height: `${(1 - ratio) * 100}%` }

    return (
        <div ref={containerRef} className={`svl-split svl-split--${node.dir}`}>
            <div className="svl-slot" style={aStyle}>
                <LayoutNode node={node.a} isRoot={false} onSplit={onSplit} onClose={onClose} setRatio={setRatio} shared={shared} />
            </div>
            <div className={`svl-handle svl-handle--${node.dir}`} onPointerDown={onHandleDown} />
            <div className="svl-slot" style={bStyle}>
                <LayoutNode node={node.b} isRoot={false} onSplit={onSplit} onClose={onClose} setRatio={setRatio} shared={shared} />
            </div>
        </div>
    )
}

function LayoutNode({ node, isRoot, onSplit, onClose, setRatio, shared }) {
    if (node.type === 'split') {
        return <SplitContainer node={node} isRoot={isRoot} onSplit={onSplit} onClose={onClose} setRatio={setRatio} shared={shared} />
    }
    return <ViewPane node={node} isRoot={isRoot} onSplit={onSplit} onClose={onClose} shared={shared} />
}

export default function StudioViewportLayout({ layout, onSplit, onClose, onSetRatio, shared }) {
    return (
        <div className="svl-root">
            <LayoutNode
                node={layout}
                isRoot={layout.type === 'view'}
                onSplit={onSplit}
                onClose={onClose}
                setRatio={onSetRatio}
                shared={shared}
            />
        </div>
    )
}
