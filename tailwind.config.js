export default { content: ['./index.html','./src/**/*.{ts,tsx}'], theme: { extend: {
  colors: { cream: '#FBF8F1', ink: '#1D3E4B', jade: { 50:'#EAF6F4',100:'#CDEAE5',400:'#3AA699',500:'#1F8A7E',600:'#186D6A',700:'#145A58' } },
  fontFamily: { sans: ['"Be Vietnam Pro"','system-ui','sans-serif'], hanzi: ['"Noto Sans SC"','"Noto Serif SC"','"PingFang SC"','"Microsoft YaHei"','sans-serif'] },
  borderRadius: { card: '18px' }, boxShadow: { soft: '0 2px 12px rgba(29,62,75,.07)' } } }, plugins: [] }
