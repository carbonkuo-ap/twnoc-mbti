import { useState } from "react";
import MainLayout from "../../components/layouts/main-layout";
import TestDisplay from "../../components/test/test-display";
import { getAssetPath } from "../../lib/utils/paths";

export default function TestPage() {
  const [backgroundType, setBackgroundType] = useState<'gradient' | 'image' | 'video'>('video');
  const [backgroundSrc, setBackgroundSrc] = useState<string>(getAssetPath('/video/original-c8e62757e4f0b807908cbcc6962cad10.mp4'));

  const handleBackgroundChange = (type: 'gradient' | 'image' | 'video', src?: string) => {
    setBackgroundType(type);
    if (src) {
      setBackgroundSrc(src);
    }
  };

  return (
    <MainLayout
      backgroundType={backgroundType}
      videoSrc={backgroundType === 'video' ? backgroundSrc : undefined}
      imageSrc={backgroundType === 'image' ? backgroundSrc : undefined}
    >
      <TestDisplay onBackgroundChange={handleBackgroundChange} />
    </MainLayout>
  );
}
