export const palettes = {
  light: {
    background: '#ffffff',
    foreground: '#141414',
    card: '#ffffff',
    primary: '#1bad69',
    muted: '#f3f4f3',
    mutedForeground: '#6b6b6b',
    border: '#e1e1e1',
    lilac: '#e8f6ee',
    coral: '#fb8c08',
    ink: '#141414',
    cream: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.45)',
  },
  dark: {
    background: '#0f0f0f',
    foreground: '#f5f5f5',
    card: '#1c1c1c',
    primary: '#2bc97d',
    muted: '#292929',
    mutedForeground: '#a6a6a6',
    border: '#383838',
    lilac: '#1b2d23',
    coral: '#ff961f',
    ink: '#f5f5f5',
    cream: '#0f0f0f',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
}

export const useColors = (theme) => palettes[theme] ?? palettes.light
