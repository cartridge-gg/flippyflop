const OrangeButton = ({ icon, text }) => (
  <button
    className='flex px-2 py-3 justify-center items-center gap-1 rounded-lg border-2 border-[#F38332] backdrop-blur font-bold text-[#F38332]'
    style={{
      boxShadow: '0px 4px 4px 0px #000',
      background: 'rgba(8, 14, 19, 0.64)',
    }}
  >
    {icon}
    {text}
  </button>
)

export default OrangeButton
