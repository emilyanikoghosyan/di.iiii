import { describe, expect, it } from 'vitest'
import { getBetaWorldBackgroundColor } from './viewportWorldState.js'

describe('getBetaWorldBackgroundColor', () => {
    it('uses the world.background node color before legacy worldState color', () => {
        expect(getBetaWorldBackgroundColor({
            worldState: { backgroundColor: '#111111' },
            nodes: [
                {
                    id: 'background',
                    typeId: 'world.background',
                    values: { color: '#224466' }
                }
            ]
        })).toBe('#224466')
    })

    it('falls back to worldState and then the Beta default', () => {
        expect(getBetaWorldBackgroundColor({
            worldState: { backgroundColor: '#05070a' },
            nodes: []
        })).toBe('#05070a')

        expect(getBetaWorldBackgroundColor({ nodes: [] })).toBe('#0a0e16')
    })
})
