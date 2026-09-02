import { useState, useEffect } from "react";
import { Post } from "./Carousel.types";
import styles from './Carousel.module.css';

interface LatestPostsSliderProps {
  posts: Post[];
  autoSlide?: boolean;
  interval?: number;
  limit?: number
}

export default function LatestPostsSlider({
  posts,
  autoSlide = true,
  interval = 5000,
  limit=3,
}: LatestPostsSliderProps) {  const displayedPosts = posts.slice(0, limit);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const nextSlide = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex === displayedPosts.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? displayedPosts.length - 1 : prevIndex - 1));
  };

  useEffect(() => {
    if (!autoSlide || posts.length <= 1) return;
    const slideTimer = setInterval(nextSlide, interval);
    return () => clearInterval(slideTimer);
  }, [currentIndex, autoSlide, interval, displayedPosts.length]);

  if (!posts || posts.length === 0) return null;

  const currentPost = displayedPosts[currentIndex];

  return (
    <div className={styles.slideshowContainer}>
      <div className={styles.slide}>
        <img src={currentPost.cover_image} alt={currentPost.title} />
        <div className={styles.slideContent}>
          <h3>{currentPost.title}</h3>
          <p>{currentPost.excerpt}</p>
          <a href={currentPost.url}>Read More</a>
        </div>
      </div>
      {/* 8. Conditional rendering: hide arrows if there is only 1 slide */}
      {displayedPosts.length > 1 && (
        <>
          <button className={styles.prevBtn} onClick={prevSlide} aria-label="Previous slide"> ❮ </button>
          <button className={styles.nextBtn} onClick={nextSlide} aria-label="Next slide"> ❯ </button>
        </>
      )}
    </div>
  );
}