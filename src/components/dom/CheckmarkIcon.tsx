const CheckmarkIcon = ({ className }) => (
  <svg className={className} width='24' height='25' viewBox='0 0 24 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <g filter='url(#filter0_d_113_19935)'>
      <path
        d='M8.36382 19.0458L4 14.682L5.45427 13.2277L8.36382 16.1373L18.5457 5.95435L20 7.40959L8.36382 19.0458Z'
        fill='#F38332'
      />
    </g>
    <defs>
      <filter
        id='filter0_d_113_19935'
        x='4'
        y='5.95435'
        width='16'
        height='14.0916'
        filterUnits='userSpaceOnUse'
        colorInterpolationFilters='sRGB'
      >
        <feFlood floodOpacity='0' result='BackgroundImageFix' />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy='1' />
        <feComposite in2='hardAlpha' operator='out' />
        <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.32 0' />
        <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_113_19935' />
        <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow_113_19935' result='shape' />
      </filter>
    </defs>
  </svg>
)

export default CheckmarkIcon
