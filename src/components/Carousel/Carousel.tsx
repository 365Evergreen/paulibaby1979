import { useState, useEffect, useMemo } from "react";
import { Slide } from "./Carousel.types";
import styles from './Carousel.module.css';
import { Link } from "react-router-dom";

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

  const recentSlides = useMemo(() => {
    if (!slides || slides.length === 0) return [];
    return [...slides]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [slides]);

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

  useEffect(() => {
    if (!autoSlide || recentSlides.length <= 1) return;
    const slideTimer = setInterval(nextSlide, interval);
    return () => clearInterval(slideTimer);
  }, [currentIndex, autoSlide, interval, recentSlides.length]);

  if (recentSlides.length === 0) return null;

  return (
    <div className={styles.slideshowContainer}>
      
      {/* Horizontal moving track container */}
      <div 
        className={styles.slideTrack} 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {recentSlides.map((slide) => (
          <div key={slide.slug} className={styles.slideWrapper}>
            {/* Background Image Layer */}
            <div
              className={styles.slideImage}
              style={{ backgroundImage: `url(${slide.cover_image})` }}
              role="img"
              aria-label={slide.title}
            />

            {/* Dark Overlay Layer */}
            <div className={styles.overlay} />
            
            {/* Foreground Text Layer */}
            <div className={styles.slideContent}>
              <div className={styles.slideTitle}> 
                <h2 className={styles.siteTitle}>{slide.title}</h2>
              </div>
              <div className={styles.slideText}>  
                <p>{slide.excerpt}</p>
              </div>
              <Link to={`/blog/${slide.slug}`} className={styles.readMoreButton}>Read more</Link>
            </div>
          </div>
        ))}
      </div>

      {/* Foreground Controls Layer - Placed outside track to remain fixed */}
      {recentSlides.length > 1 && (
        <div className={styles.controls}>
          <button className={styles.prevBtn} onClick={prevSlide} aria-label="Previous slide"> ❮ </button>
          <button className={styles.nextBtn} onClick={nextSlide} aria-label="Next slide"> ❯ </button>
        </div>
      )}
    </div>
  );
}
