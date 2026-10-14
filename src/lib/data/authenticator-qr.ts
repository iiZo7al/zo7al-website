/** Supabase may return an SVG string (including an XML declaration), or a data URI. */
export function authenticatorQR(value:unknown) {
 if(typeof value!=='string'||value.length>100000)return '';
 const text=value.trim().replace(/^<\?xml[^?]*\?>\s*/,'');
 if(/^<svg(?:\s|>)/i.test(text)&&/<\/svg>\s*$/.test(text))return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(text);
 if(/^data:image\/(?:svg\+xml|png);(?:base64,|charset=utf-8,)/i.test(text))return text;
 return '';
}
