import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={styles.header}>
      <Link href="/">
        <img src="/logo.svg" alt="logo" width="239" height="26" />
      </Link>
    </div>
  );
}
