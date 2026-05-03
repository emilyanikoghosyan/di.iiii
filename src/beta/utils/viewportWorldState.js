export function getBetaWorldBackgroundColor(document) {
    const backgroundNode = (document?.nodes || []).find((node) => node?.typeId === 'world.background')
    const nodeColor = backgroundNode?.values?.color
    if (typeof nodeColor === 'string' && nodeColor.trim()) return nodeColor
    return document?.worldState?.backgroundColor || '#0a0e16'
}
