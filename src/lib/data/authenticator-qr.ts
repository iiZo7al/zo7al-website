/** Native Supabase SVGs include the XML header and SVGo generator comment. */
export function authenticatorQR(value:unknown) {
 if(typeof value!=='string'||value.length>100000)return '';
 let text=value.trim();
 const svgData=text.match(/^data:image\/svg\+xml(?:;(?:charset=utf-8|utf-8|utf8))?,([\s\S]+)$/i);
 if(svgData){try{text=decodeURIComponent(svgData[1]);}catch{return '';}}
 text=text.replace(/^(?:(?:<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE\s+svg[^>]*>)\s*)+/i,'');
 if(/^<svg(?:\s|>)/i.test(text)&&/<\/svg>\s*$/.test(text))return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(text);
 if(/^data:image\/(?:svg\+xml|png)(?:;charset=utf-8)?;base64,[a-z0-9+/]+={0,2}$/i.test(text))return text;
 return '';
}
