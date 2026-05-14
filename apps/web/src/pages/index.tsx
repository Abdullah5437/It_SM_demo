import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <h1>I-ITSM Web</h1>
      {/* <p>Frontend workspace is running.</p> */}
      <p>
        Open <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
