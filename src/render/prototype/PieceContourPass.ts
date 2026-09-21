/** Study only: compare pixel density and visible-piece separation, without polygon wire lines. */
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export type ContourMode = 'off' | 'silhouette' | 'adaptive';
export class PieceContourPass extends Pass {
  pixelSize = 1.5;
  mode: ContourMode = 'adaptive';
  private size = new THREE.Vector2(1, 1);
  readonly beauty = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture() });
  readonly ids = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  private pieces = new Map<THREE.Object3D, number>();
  private idMaterial = new THREE.ShaderMaterial({
    uniforms: { pieceId: { value: 0 }, alphaMap: { value: null }, hasAlpha: { value: false }, uvTransform: { value: new THREE.Matrix3() } },
    vertexShader: `varying vec2 vUv; uniform mat3 uvTransform;
      #include <skinning_pars_vertex>
      void main(){
        vUv=(uvTransform*vec3(uv,1.)).xy;
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);
      }`,
    fragmentShader: `varying vec2 vUv; uniform float pieceId; uniform sampler2D alphaMap; uniform bool hasAlpha;
      void main(){if(hasAlpha && texture2D(alphaMap,vUv).a<.3)discard; gl_FragColor=vec4(pieceId,0.,0.,1.);}`,
    side: THREE.DoubleSide,
  });
  private composite = new THREE.ShaderMaterial({
    uniforms: { beauty: { value: this.beauty.texture }, ids: { value: this.ids.texture }, depth: { value: this.beauty.depthTexture }, stepSize: { value: new THREE.Vector2() }, mode: { value: 2 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      uniform sampler2D beauty,ids,depth; uniform vec2 stepSize; uniform int mode; varying vec2 vUv;
      float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
      void main(){
        vec4 color=texture2D(beauty,vUv);
        float id=texture2D(ids,vUv).r;
        if(mode>0 && id>.001){
          float edge=0., overlap=0., weakContrast=0.;
          float z=texture2D(depth,vUv).r;
          for(int i=0;i<4;i++){
            vec2 d=i==0?vec2(1,0):i==1?vec2(-1,0):i==2?vec2(0,1):vec2(0,-1);
            vec2 uv=vUv+d*stepSize;
            float other=texture2D(ids,uv).r;
            if(abs(id-other)>.002){
              // Ink only the visible foreground figure at a shared boundary; never reveal hidden parts.
              bool front=z<=texture2D(depth,uv).r+.00001;
              if(other<.001 || front){
                edge=1.;
                if(other>.001){
                  overlap=1.;
                  weakContrast=max(weakContrast,1.-smoothstep(.03,.18,abs(lum(color.rgb)-lum(texture2D(beauty,uv).rgb))));
                }
              }
            }
          }
          // Continuous contrast adjustment: lighter blue-grey ink for dark surfaces, dark ink for light ones.
          vec3 ink=mix(vec3(.20,.28,.36),vec3(.035,.042,.05),smoothstep(.10,.28,lum(color.rgb)));
          float strength=mode==1?.60:mix(.30,.55+.35*weakContrast,overlap);
          color.rgb=mix(color.rgb,ink,edge*strength);
        }
        gl_FragColor=color;
      }`,
  });
  private quad = new FullScreenQuad(this.composite);
  private black = new THREE.Color(0);

  constructor(private scene: THREE.Scene, private camera: THREE.Camera) {
    super();
    this.idMaterial.onBeforeRender = (_renderer, _scene, _camera, _geometry, object) => {
      const uniforms = this.idMaterial.uniforms;
      uniforms.pieceId.value = (this.pieces.get(object) ?? 0) / 255;
      const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const map = material?.map;
      uniforms.hasAlpha.value = Boolean(map && material.alphaTest > 0);
      if (map) { map.updateMatrix(); uniforms.alphaMap.value = map; uniforms.uvTransform.value.copy(map.matrix); }
      this.idMaterial.uniformsNeedUpdate = true;
    };
  }

  setPieces(figures: THREE.Object3D[]) {
    this.pieces.clear();
    figures.forEach((figure, i) => figure.traverse(part => { if ((part as THREE.Mesh).isMesh) this.pieces.set(part, i + 1); }));
  }

  setPixelSize(value: number) { this.pixelSize = value; this.setSize(this.size.x, this.size.y); }

  setSize(width: number, height: number) {
    this.size.set(width, height);
    const w = Math.max(1, Math.floor(width / this.pixelSize)), h = Math.max(1, Math.floor(height / this.pixelSize));
    this.beauty.setSize(w, h); this.ids.setSize(w, h);
    this.composite.uniforms.stepSize.value.set(1 / w, 1 / h);
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.beauty); renderer.render(this.scene, this.camera);
    if (this.mode !== 'off') {
      const background = this.scene.background, override = this.scene.overrideMaterial;
      const shadows = renderer.shadowMap.enabled;
      try {
        this.scene.background = this.black; this.scene.overrideMaterial = this.idMaterial;
        renderer.shadowMap.enabled = false;
        renderer.setRenderTarget(this.ids); renderer.render(this.scene, this.camera);
      } finally {
        this.scene.background = background; this.scene.overrideMaterial = override; renderer.shadowMap.enabled = shadows;
      }
    }
    this.composite.uniforms.mode.value = this.mode === 'off' ? 0 : this.mode === 'silhouette' ? 1 : 2;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }

  dispose() { this.beauty.dispose(); this.ids.dispose(); this.idMaterial.dispose(); this.composite.dispose(); this.quad.dispose(); }
}
