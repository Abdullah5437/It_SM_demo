import styles from "./Banner.module.css";

type BannerProps = {
  title: string;
  subtitle: string;
  buttonLabel?: string;
};

export default function Banner({ title, subtitle, buttonLabel }: BannerProps) {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {buttonLabel ? <button className={styles.button}>{buttonLabel}</button> : null}
    </div>
  );
}
