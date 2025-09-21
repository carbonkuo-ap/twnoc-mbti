import React, { useRef, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';

interface VideoBackgroundProps {
  videoSrc: string;
  posterSrc?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoSrc,
  posterSrc,
  overlay = true,
  overlayOpacity = 0.3
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const video = videoRef.current;
    if (video && !prefersReducedMotion) {
      const handleLoadedData = () => {
        setIsLoaded(true);
        video.play().catch(error => {
          console.log('Video autoplay failed:', error);
          setIsLoaded(true); // Still show the video even if autoplay fails
        });
      };

      const handleCanPlay = () => {
        setIsLoaded(true);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        window.removeEventListener('resize', checkMobile);
      };
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (isMobile) {
    // Use gradient background for mobile devices
    return (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex="-1"
        bg="linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
      >
        {overlay && (
          <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            bg={`rgba(0, 0, 0, ${overlayOpacity})`}
          />
        )}
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100%"
      height="100%"
      zIndex="-10"
      overflow="hidden"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 1
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Fallback background for when video doesn't load */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
        zIndex="-1"
      />

      {/* Overlay for better text readability */}
      {overlay && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          bgGradient={`linear(to-b, rgba(0, 0, 0, ${overlayOpacity * 0.6}), rgba(0, 0, 0, ${overlayOpacity}))`}
        />
      )}
    </Box>
  );
};

export default VideoBackground;