import 'server-only';
import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';

export async function localizedPageMetadata(titleKey:string,descriptionKey?:string,robots?:Metadata['robots']):Promise<Metadata>{
  const t=await getTranslations();
  return {title:t(titleKey),...(descriptionKey?{description:t(descriptionKey)}:{}),...(robots?{robots}:{})};
}
