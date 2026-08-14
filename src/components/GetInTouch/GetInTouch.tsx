import React from 'react';
import styles from './GetInTouch.module.css'
import { AdaptiveCardForm } from './AdaptiveCardForm';

// Define the TypeScript interface for the component props
interface GetInTouchProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string; // Optional extra styling classes
}

export const GetInTouch: React.FC<GetInTouchProps> = ({
  leftColumn,
  rightColumn,
  className = '',
}) => {
  return (
    <section className={`${styles.twoColumnContainer} ${className}`}>
      <div className={`${styles.column} ${styles.columnLeft}`}>
        {leftColumn}
        <h2 className={styles.content + ' ' + styles.h2}>Get in Touch</h2>
        <p className={styles.content + ' ' + styles.p}>We'd love to hear from you! Please fill out the form and we'll get back to you as soon as possible.</p>
      </div>
      <div className={`${styles.column} ${styles.columnRight}`}>
        {rightColumn}
        <AdaptiveCardForm />
      </div>
    </section>
  );
};
