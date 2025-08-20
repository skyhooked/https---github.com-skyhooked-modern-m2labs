import Header from './Header';
import Footer from './Footer';
import CartSidebar from './cart/CartSidebar';
import SupportChatWidget from './support/SupportChatWidget';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main className="pt-15">
        {children}
      </main>
      <Footer />
      <CartSidebar />
      <SupportChatWidget />
    </>
  );
}