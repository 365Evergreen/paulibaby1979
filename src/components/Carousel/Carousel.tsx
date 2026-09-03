import styles from './Carousel.module.css';


interface CarouselProps {
  images: string[];
}

interface PostProps {
  title: string[];
  images: string[];
}

const Post: React.FC<PostProps> = ({ images }) => {
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

export default Post;
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
