import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1a3d 0%, #0e2a52 50%, #071026 100%)',
          color: 'white',
          fontWeight: 900,
        }}
      >
        <div style={{ fontSize: 180, lineHeight: 1, letterSpacing: '-0.05em' }}>S</div>
        <div style={{ fontSize: 36, marginTop: 8, color: '#fdba74', letterSpacing: '0.2em' }}>SPANC</div>
      </div>
    ),
    { ...size },
  )
}
