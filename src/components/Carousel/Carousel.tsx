import { useState, useEffect } from "react";
import { Post } from "./Carousel.types";
import styles from './Carousel.module.css';

interface LatestPostsSliderProps {
  posts: Post[];
  autoSlide?: boolean;
  interval?: number;
}

export default function LatestPostsSlider({
  posts,
  autoSlide = true,
  interval = 5000,
}: LatestPostsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const nextSlide = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex === posts.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? posts.length - 1 : prevIndex - 1));
  };

  useEffect(() => {
    if (!autoSlide || posts.length <= 1) return;
    const slideTimer = setInterval(nextSlide, interval);
    return () => clearInterval(slideTimer);
  }, [currentIndex, autoSlide, interval, posts.length]);

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <div className={styles.slideshowContainer}>
      <div className={styles.slide}>
        <img src={currentPost.image} alt={currentPost.title} />
        <div className={styles.slideContent}>
          <h3>{currentPost.title}</h3>
          <p>{currentPost.excerpt}</p>
          <a href={currentPost.url}>Read More</a>
        </div>
      </div>
      <>
        <button className={styles.prevBtn} onClick={prevSlide} aria-label="Previous slide"> ❮ </button>
        <button className={styles.nextBtn} onClick={nextSlide} aria-label="Next slide"> ❯ </button>
      </>
    </div>
  );
}
