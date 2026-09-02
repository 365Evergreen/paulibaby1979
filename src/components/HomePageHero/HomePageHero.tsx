import  { useState, useEffect } from 'react';
import styles from './HomePageHero.module.css'


const slideData = [
  {
    image: 'https://media.paulibaby.com/1788336576917-134312749643235365.jpg',
    title: 'Explore the Great Outdoors',
    subtitle: 'Discover breathtaking landscapes and hidden trails.',
    ctaText: 'Start Journey',
    ctaLink: '#journey'
  },
  {
    image: 'https://media.paulibaby.com/1786730182653-1200x675.webp',
    title: 'Embrace the Serenity',
    subtitle: 'Find peace away from the chaotic city life.',
    ctaText: 'Find Peace',
    ctaLink: '#peace'
  },
  {
    image: 'https://media.paulibaby.com/1788336576917-134312749643235365.jpg',
    title: 'Connect with Nature',
    subtitle: 'Experience pristine ecosystems firsthand.',
    ctaText: 'Learn More',
    ctaLink: '#about'
  }
];

export default function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slideData.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slideData.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.slideshowContainer}>
      {/* Slides Container */}
      {slideData.map((slide, index) => {
        // Construct conditional classes using string interpolation
        const isCurrent = index === currentIndex;
        const slideClassName = `${styles.slide} ${isCurrent ? styles.slideActive : ''}`;

        return (
          <div key={index} className={slideClassName}>
            <img
              src={slide.image}
              alt={slide.title}
              className={styles.image}
            />
            <div className={styles.overlay} />
            
            <div className={styles.content}>
              <h1 className={styles.title}>{slide.title}</h1>
              <p className={styles.subtitle}>{slide.subtitle}</p>
              <a href={slide.ctaLink} className={styles.ctaButton}>
                {slide.ctaText}
              </a>
            </div>
          </div>
        );
      })}

      {/* Manual Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className={`${styles.arrowButton} ${styles.leftArrow}`}
      >
        &#10094;
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className={`${styles.arrowButton} ${styles.rightArrow}`}
      >
        &#10095;
      </button>

      {/* Bottom Dot Indicators */}
      <div className={styles.dotContainer}>
        {slideData.map((_, index) => {
          const isCurrent = index === currentIndex;
          const dotClassName = `${styles.dot} ${isCurrent ? styles.dotActive : ''}`;

          return (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={dotClassName}
            />
          );
        })}
      </div>
    </div>
  );
}
