import { useState, useEffect, useMemo } from "react";
import { Slide } from "./Carousel.types";
import styles from './Carousel.module.css';

interface LatestslidesSliderProps {
  slides: Slide[];
  autoSlide?: boolean;
  interval?: number;
}

export default function LatestslidesSlider({
  slides,
  autoSlide = true,
  interval = 5000,
}: LatestslidesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 1. Process the 5 most recent slides first
  const recentSlides = useMemo(() => {
    if (!slides || slides.length === 0) return [];
    return [...slides]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [slides]);

  // 2. Navigation handlers locked to recentSlides length
  const nextSlide = (): void => {
    setCurrentIndex((prevIndex) =>
      prevIndex === recentSlides.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = (): void => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? recentSlides.length - 1 : prevIndex - 1
    );
  };

  // 3. Auto-slide timer linked to recentSlides
  useEffect(() => {
    if (!autoSlide || recentSlides.length <= 1) return;
    const slideTimer = setInterval(nextSlide, interval);
    return () => clearInterval(slideTimer);
  }, [currentIndex, autoSlide, interval, recentSlides.length]);

  // Early return if no data exists
  if (recentSlides.length === 0) return null;

  // 4. Extract the currently active slide from our 5 recent items
  const currentSlide = recentSlides[currentIndex];

  return (
<div className={styles.sliderContainer}>
  <div className={styles.slideContent}>
    
    {/* Background Image Layer */}
    <div 
      className={styles.slideImage}
      style={{ backgroundImage: `url(${currentSlide.cover_image})` }}
      role="img"
      aria-label={currentSlide.title} 
    />
    
    {/* Dark Overlay Layer */}
    <div className={styles.overlay} />
    
    {/* Foreground Text Layer */}
    <div className={styles.slideText}>
      <h3 className={styles.slideTitle}>{currentSlide.title}</h3>
      <p>{currentSlide.excerpt}</p>
      <a href={currentSlide.url} className={styles.button}>Read more</a>
    </div>
)</div>
    {/* Foreground Controls Layer */}
    {recentSlides.length > 1 && (
      <div className={styles.controls}>
        <button className={styles.prevBtn} onClick={prevSlide} aria-label="Previous slide"> ❮ </button>
        <button className={styles.nextBtn} onClick={nextSlide} aria-label="Next slide"> ❯ </button>
      </div>
    )}
    
 
</div>
  )
}