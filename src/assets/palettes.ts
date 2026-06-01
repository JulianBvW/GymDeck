export interface Palette {
  name: string
  wave1: string
  wave2: string
  wave3: string
  accent: string
}

export const PALETTES: Palette[] = [
  { name: 'Ocean', wave1: '#0077b6', wave2: '#0096c7', wave3: '#48cae4', accent: '#ade8f4' },
  { name: 'Sunset', wave1: '#e76f51', wave2: '#e9c46a', wave3: '#f4a261', accent: '#ffd6a5' },
  { name: 'Forest', wave1: '#1b4332', wave2: '#2d6a4f', wave3: '#52b788', accent: '#b7e4c7' },
  { name: 'Lavender', wave1: '#6a0572', wave2: '#9d4edd', wave3: '#c77dff', accent: '#e0aaff' },
  { name: 'Rose', wave1: '#c9184a', wave2: '#ff4d6d', wave3: '#ff8fa3', accent: '#ffb3c1' },
  { name: 'Slate', wave1: '#023e8a', wave2: '#0077b6', wave3: '#90e0ef', accent: '#caf0f8' },
  { name: 'Ember', wave1: '#7f4f24', wave2: '#b5451b', wave3: '#e2711d', accent: '#ffca3a' },
  { name: 'Mint', wave1: '#006466', wave2: '#0b525b', wave3: '#144552', accent: '#99d8c0' },
]
