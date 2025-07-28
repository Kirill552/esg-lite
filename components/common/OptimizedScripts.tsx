'use client';

import Script from 'next/script';

export function OptimizedScripts() {
  return (
    <>
      {/* Google Analytics с worker strategy для лучшей производительности */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="worker"
          />
          <Script id="google-analytics" strategy="worker">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        </>
      )}
      
      {/* Yandex Metrica с lazyOnload для неблокирующей загрузки */}
      {process.env.NEXT_PUBLIC_YANDEX_METRICA_ID && (
        <Script id="yandex-metrica" strategy="lazyOnload">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            
            ym(${process.env.NEXT_PUBLIC_YANDEX_METRICA_ID}, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true
            });
          `}
        </Script>
      )}
    </>
  );
}
