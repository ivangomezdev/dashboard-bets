import "./globals.css";

export const metadata = {
  title: "Arbs Dashboard",
  description: "Panel privado de arbs resueltos"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
