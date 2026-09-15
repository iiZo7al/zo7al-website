import fs from 'node:fs';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();}); }
};
if (!process.argv[2]) throw new Error('Usage: node scripts/prepare-space-pack.mjs /path/to/unpacked/04-Cartoon.Space.Pack');
const source=process.argv[2].replace(/\/$/,'')+'/';
const out=new URL('../public/assets/models/space-pack/',import.meta.url).pathname;
fs.mkdirSync(out,{recursive:true});
const group=new OBJLoader().parse(fs.readFileSync(source+'a150c4f658974b74a667e9933c792dfe.obj','utf8'));
const chosen=['Asteroid','Comet','Satellite','SpaceCapsule','Sputnik','UFO','Earth','FullMoon','Planet_B','Planet_H'];
const manifest=[];
for(const name of chosen){
 const mesh=group.children.find(m=>m.name===name+'_'+name+'_0');
 if(!mesh) throw Error(name);
 mesh.geometry = mergeVertices(mesh.geometry, 0.00001); mesh.geometry.center(); mesh.material=new THREE.MeshStandardMaterial();
 const size=new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
 mesh.geometry.scale(1/Math.max(size.x,size.y,size.z),1/Math.max(size.x,size.y,size.z),1/Math.max(size.x,size.y,size.z));
 const scene=new THREE.Scene();scene.add(mesh);
 const binary=await new GLTFExporter().parseAsync(scene,{binary:true});
 fs.writeFileSync(out+name+'.glb',Buffer.from(binary));
 const maps={};
 for(const [kind,pattern] of [['color','_RGB_'+name+'_BaseColor.png'],['normal','_N_'+name+'_Normal.png'],['roughness','_R_'+name+'_Roughtness.png']]){
  const path=fs.readdirSync(source).find(f=>f.endsWith(pattern));
  if(path){fs.copyFileSync(source+path,out+path);maps[kind]=path;}
 }
 manifest.push({name,model:name+'.glb',...maps});
}
fs.writeFileSync(out+'manifest.json',JSON.stringify(manifest,null,2));
fs.writeFileSync(out+'CREDITS.txt','Cartoon Space Pack by CartoonObjects\nSource: https://sketchfab.com/3d-models/a150c4f658974b74a667e9933c792dfe\nSupplied by the site owner. Geometry extracted and centered for use in Space Run.\n');
console.log(manifest.map(m=>({name:m.name,bytes:fs.statSync(out+m.model).size})));
