import styles from './Carousel.module.css';

interface CarouselProps {
  images: string[];
}

export const Carousel: React.FC<CarouselProps> = ({ images }) => {
  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.carouselTrack}>
        {images.map((src, index) => (
          <div key={index} className={styles.carouselSlide}>
            <img 
              src={src} 
              alt={`Slide ${index + 1}`} 
              className={styles.carouselImage} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};