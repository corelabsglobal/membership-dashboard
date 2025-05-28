export const Icons = {
  logo: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Rollerblade wheel 1 */}
      <circle cx="12" cy="36" r="5" fill="none" />
      <circle cx="12" cy="36" r="2" fill="currentColor" />
      
      {/* Rollerblade wheel 2 */}
      <circle cx="24" cy="36" r="5" fill="none" />
      <circle cx="24" cy="36" r="2" fill="currentColor" />
      
      {/* Rollerblade wheel 3 */}
      <circle cx="36" cy="36" r="5" fill="none" />
      <circle cx="36" cy="36" r="2" fill="currentColor" />
      
      {/* Skate boot/shoe */}
      <path d="M10 28 L16 20 L32 20 L38 28 L36 32 L12 32 Z" fill="none" />
      
      {/* Ankle cuff */}
      <path d="M16 20 L16 12 L32 12 L32 20" fill="none" />
      
      {/* Speed lines */}
      <path d="M40 28 L44 24" fill="none" />
      <path d="M40 32 L44 36" fill="none" />
    </svg>
  ),
  spinner: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}