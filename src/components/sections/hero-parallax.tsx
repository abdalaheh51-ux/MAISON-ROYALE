'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * Parallax hero background. Wraps the hero image with a subtle scroll-driven
 * zoom + translate so the luxury image drifts as the reader scrolls.
 */
export function HeroParallax({ image, children }: { image: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18])
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.6])

  return (
    <section id="top" ref={ref} className="relative grain-overlay overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${image}')` }}
          aria-hidden
        />
      </motion.div>
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-24">
        {children}
      </div>
    </section>
  )
}

export default HeroParallax
