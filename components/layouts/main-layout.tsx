import Head from "next/head";
import { ReactNode } from "react";
import { Flex, Box } from "@chakra-ui/react";

import Nav from "../common/nav";
import Footer from "../common/footer";
import VideoBackground from "../VideoBackground";
import Image from "next/image";
import { getFaviconPath } from "../../lib/utils/paths";

type BackgroundType = 'gradient' | 'image' | 'video' | 'none';

interface MainLayoutProps {
  children: ReactNode;
  hideBackground?: boolean;
  backgroundType?: BackgroundType;
  videoSrc?: string;
  imageSrc?: string;
}

export default function MainLayout(props: MainLayoutProps) {
  const {
    children,
    hideBackground = false,
    backgroundType = 'gradient',
    videoSrc,
    imageSrc
  } = props;

  // Determine background based on type
  const getBackground = () => {
    if (hideBackground || backgroundType === 'none') {
      return 'transparent';
    }

    switch (backgroundType) {
      case 'video':
        return 'transparent'; // Video will be handled separately
      case 'image':
        return 'transparent'; // Image will be handled separately
      case 'gradient':
      default:
        return 'linear-gradient(to bottom, rgba(66, 152, 255, 1) 0%, rgba(66, 152, 255, 0.6) 80px, rgba(127, 187, 255, 0.6), rgba(244, 244, 180, 0.6), rgba(252, 242, 59, 0.6))';
    }
  };

  return (
    <>
      <Head>
        <title>MBTI 性格測試</title>
        <meta
          name="description"
          content="MBTI 性格測試"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          href={getFaviconPath()}
        />
      </Head>

      {/* Background Components */}
      {backgroundType === 'video' && videoSrc && (
        <VideoBackground
          videoSrc={videoSrc}
          overlay={true}
          overlayOpacity={0.75}
        />
      )}

      {backgroundType === 'image' && imageSrc && (
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100%"
          height="100%"
          zIndex="-1"
        >
          <Image
            alt="background"
            src={imageSrc}
            fill
            style={{
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            priority
          />
        </Box>
      )}

      <Box
        w="full"
        minH="100vh"
        background={getBackground()}
      >
        <Nav />
        <Flex
          as="main"
          w="100%"
          minH="calc(100vh - 80px)"
          justifyContent="center"
          alignItems="center"
          position="relative"
        >
          {children}
        </Flex>
      </Box>
      <Footer />
    </>
  );
}
