import React from 'react'

// Shimmering placeholder. Use to fill shapes while data loads.
const Skeleton = ({ className = '', rounded = 'rounded-lg' }) => (
  <div className={`skeleton ${rounded} ${className}`} />
)

export default Skeleton
