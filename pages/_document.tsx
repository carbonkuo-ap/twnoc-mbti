import { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        <Script
          id="baidu-hm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "//hm.baidu.com/hm.js?922e7991abd659d219be3e5932ec15c9";
                var s = document.getElementsByTagName("script")[0]; 
                s.parentNode.insertBefore(hm, s);
              })();
            `,
          }}
        />
      </Head>
      <body>
        <ColorModeScript initialColorMode="light" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
