"use client"

import { useEffect, useRef } from "react"
import "./landing.css"
import { ChapterMeasure } from "./ChapterMeasure"
import { ChapterQuestion } from "./ChapterQuestion"
import { ChapterScore } from "./ChapterScore"
import { ChapterShift } from "./ChapterShift"
import { Faq, Finale, Footer, Path, Pricing } from "./Closing"
import { Features } from "./Features"
import { Hero, Nav } from "./Hero"

/** Fortschrittslinie am oberen Rand – direkt per DOM, ohne React-Rerender. */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      if (ref.current) ref.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])
  return <div ref={ref} className="lx-progress" style={{ transform: "scaleX(0)" }} aria-hidden="true" />
}

export function Landing({ toolHref, isLoggedIn }: { toolHref: string; isLoggedIn: boolean }) {
  return (
    <div className="lx min-h-screen">
      <ScrollProgress />
      <div className="lx-grain" aria-hidden="true" />
      <Nav toolHref={toolHref} isLoggedIn={isLoggedIn} />
      <main>
        <Hero />
        <ChapterQuestion />
        <ChapterShift />
        <ChapterMeasure />
        <ChapterScore />
        <Features />
        <Path />
        <Pricing />
        <Faq />
        <Finale />
      </main>
      <Footer />
    </div>
  )
}
