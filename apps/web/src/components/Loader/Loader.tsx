import styles from './Loader.module.css';

export default function LoaderPulse() {
  return (
    <div className={styles.item}>
      <div className={styles.loaderPulse}></div>
    </div>
  );
}

