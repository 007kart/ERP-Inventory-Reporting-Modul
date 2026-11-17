import './globals.css';
export const metadata = {title:'Portfolio Dashboard', description:'Full stack dashboard using Next.js and PostgreSQL'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
