import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          background: 'linear-gradient(135deg, #0a1a3d 0%, #0e2a52 100%)',
          color: 'white',
          fontWeight: 900,
        }}
      >
        <div style={{ fontSize: 72, lineHeight: 1 }}>S</div>
        <div style={{ fontSize: 14, marginTop: 4, color: '#fdba74', letterSpacing: '0.15em' }}>SPANC</div>
      </div>
    ),
    { ...size },
  )
}
