import { useEffect } from 'react';

interface MetaTagsOptions {
  title?: string;
  description?: string;
  image?: string;
}

export const useMetaTags = ({ title, description, image }: MetaTagsOptions) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | Playxcade` : 'Playxcade - Gaming & Streaming Ecosystem';
    const desc = description || 'The unified social gaming and streaming platform for gamers, creators, and communities.';
    const img = image || 'https://api.dicebear.com/7.x/bottts/svg?seed=playxcade';

    document.title = fullTitle;

    // Update meta tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', img);

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', fullTitle);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', desc);

    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage) twImage.setAttribute('content', img);
  }, [title, description, image]);
};
