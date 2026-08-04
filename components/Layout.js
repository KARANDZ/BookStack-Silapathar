import Header from './Header';

export default function Layout({ children }) {
  return (
    <div>
      <Header />
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}
