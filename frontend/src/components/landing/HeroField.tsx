/* ============================================================================
   HERO FIELD — the landing page's WebGL background.

   A hand-rolled raymarched SDF, not a 3D library. Three.js would add ~150KB
   gzipped to a page whose whole point is that it loads fast, and the only
   primitive we want is one signed-distance field. The same reasoning as the
   hand-rolled SVG charts: off-the-shelf abstractions would fight us here.

   The object is a slowly twisting torus band fused to a smaller sphere — an
   abstract, continuously-scored form that sits behind the hero copy and the
   console panel. It is deliberately low-contrast: it reads as depth and
   parallax, never as content competing with the headline.

   Failure behaviour is the important part:
     • no WebGL, or context creation fails  -> renders nothing, CSS blobs carry
     • prefers-reduced-motion                -> one static frame, no RAF loop
     • scrolled out of view / tab hidden     -> RAF suspended, canvas kept
     • context lost                          -> listener tears down cleanly
   ========================================================================== */

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

/* Fragment shader.
   - Raymarches a smooth-min union of a twisted torus band and a sphere.
   - Lighting is three-point (key, fill, rim) with a Fresnel edge, plus a cheap
     ambient-occlusion term derived from iteration count. No shadow rays: they
     roughly double the cost and the AO approximation reads identically at this
     scale and opacity. */
const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform float u_opacity;
uniform vec3  u_deep;    // #005127 body
uniform vec3  u_mid;     // #1b6b3a lit side
uniform vec3  u_glow;    // #a5f4b6 rim / highlights
uniform vec3  u_warm;    // #a0f399 bounce

const int   MAX_STEPS = 96;
const float MAX_DIST  = 24.0;
const float SURF_DIST = 0.0015;

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

/* Written out rather than as mat3(rot(a), rot(b), rot(c)). The multi-matrix
   constructor is valid GLSL ES 1.00 but its column ordering is a portability
   trap; these three are unambiguous. */
mat3 rotX(float a) {
  float s = sin(a), c = cos(a);
  return mat3(1.0, 0.0, 0.0,  0.0, c, -s,  0.0, s, c);
}
mat3 rotY(float a) {
  float s = sin(a), c = cos(a);
  return mat3(c, 0.0, s,  0.0, 1.0, 0.0,  -s, 0.0, c);
}
mat3 rotZ(float a) {
  float s = sin(a), c = cos(a);
  return mat3(c, -s, 0.0,  s, c, 0.0,  0.0, 0.0, 1.0);
}

/* Polynomial smooth minimum. The k term is what melts the sphere into the
   band instead of leaving it intersecting as a visible crease. */
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdBand(vec3 p, float t) {
  // Twist the domain around Y, then offset the ring by an angle that itself
  // varies with the azimuth. That offset is what turns a torus into a knot.
  p.xz *= rot(t);
  float a = atan(p.z, p.x);
  float ring = length(p.xz) - 1.55;
  vec3 q = vec3(cos(a * 2.0) * ring, p.y, sin(a * 2.0) * ring);
  return length(q) - 0.62;
}

float map(vec3 p, float t) {
  p.yz *= rot(t * 0.35);
  p.xy *= rot(t * 0.22);
  float band = sdBand(p, t * 0.4);
  float orb  = length(p - vec3(0.0, 1.55, 0.0)) - 0.34;
  return smin(band, orb, 0.45);
}

vec3 calcNormal(vec3 p, float t) {
  // Central differences. Two tetrahedral samples rather than the usual four
  // axis probes — same silhouette, one fewer texture-free map() call.
  vec2 e = vec2(1.0, -1.0) * 0.0012;
  return normalize(
    e.xyy * map(p + e.xyy, t) +
    e.yyx * map(p + e.yyx, t) +
    e.yxy * map(p + e.yxy, t) +
    e.xxx * map(p + e.xxx, t)
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / u_res.y;

  // Push the form to the right and down so the headline column stays clear.
  vec3 ro = vec3(0.0, 0.35, 5.2);
  vec3 rd = normalize(vec3(uv, -1.55));
  ro.x += 0.85;
  ro.y -= 0.15;

  float t = u_time;

  // Slow compound drift: the knot turns on two axes at incommensurate rates so
  // the loop never visibly repeats.
  mat3 spin = rotX(t * 0.16) * rotY(t * 0.11);

  float dist = 0.0;
  float steps = 0.0;
  bool hit = false;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 pos = ro + rd * dist;
    pos = spin * pos;
    float d = map(pos, t);
    // Step a fraction of the distance for stability on the near-grazing rays
    // where the SDF gradient is shallow.
    dist += d * 0.75;
    steps = float(i);
    if (d < SURF_DIST) { hit = true; break; }
    if (dist > MAX_DIST) break;
  }

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  if (hit) {
    vec3 pos = ro + rd * dist;
    pos = spin * pos;
    vec3 n = calcNormal(pos, t);

    vec3 key  = normalize(vec3(-0.55, 0.75, 0.65));
    vec3 fill = normalize(vec3(0.70, -0.25, 0.55));
    vec3 view = -rd;

    float keyD  = max(dot(n, key), 0.0);
    float fillD = max(dot(n, fill), 0.0);
    // Fresnel: bright at grazing angles, which is what gives the edge its
    // glassy lift against the pale page.
    float fres = pow(1.0 - max(dot(n, view), 0.0), 3.0);

    // Cheap AO from how many steps were spent near the surface.
    float ao = 1.0 - clamp(steps / float(MAX_STEPS), 0.0, 1.0) * 0.55;

    col  = u_deep * 0.55;
    col += u_mid  * keyD  * 1.05;
    col += u_warm * fillD * 0.28;
    col += u_glow * fres  * 0.85;
    col += u_glow * pow(keyD, 24.0) * 0.45;   // tight specular
    col *= ao;

    // Fade the silhouette out so the canvas edge is not a hard rectangle.
    alpha = u_opacity * ao;
    alpha *= 1.0 - smoothstep(1.25, 2.4, length(uv * vec2(0.72, 1.0)));
  }

  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col, alpha);
}
`

/* Internal resolution is a fraction of CSS pixels. Raymarching is fill-rate
   bound and this layer is deliberately soft, so the lost detail is invisible
   while the frame cost drops by roughly 2.5x. */
const RENDER_SCALE = 0.62
const MAX_DPR = 1.75

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Surfaced in devtools rather than swallowed: a silent shader failure is
    // indistinguishable from "WebGL blocked", which is a much harder bug.
    console.error('[hero-field] shader compile failed:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function HeroField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'low-power',
      }) as WebGLRenderingContext | null) ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

    // No WebGL: render nothing. The CSS blurred blobs behind us are a complete
    // fallback, so this is a silent no-op by design.
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[hero-field] program link failed:', gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    // One oversized triangle covers the viewport with no index buffer and no
    // seam down the diagonal where two quads would meet.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uOpacity = gl.getUniformLocation(prog, 'u_opacity')
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_deep'), hexToRgb('#005127'))
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_mid'), hexToRgb('#1b6b3a'))
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_glow'), hexToRgb('#a5f4b6'))
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_warm'), hexToRgb('#a0f399'))
    gl.uniform1f(uOpacity, 0.9)

    gl.enable(gl.BLEND)
    // Premultiplied source over premultiplied destination: the shader writes
    // straight (non-premultiplied) colour, so colour must be scaled by alpha.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    let raf = 0
    let disposed = false
    let inView = true
    let visible = !document.hidden

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr * RENDER_SCALE))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr * RENDER_SCALE))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }

    const start = performance.now()
    const draw = (now: number) => {
      raf = 0
      if (disposed) return
      resize()
      gl.uniform2f(uRes, canvas.width, canvas.height)
      // Reduced motion still gets a frame — just a single one at t=0, never a
      // loop — so the hero is not empty for those users.
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (!reduced && inView && visible) {
        raf = requestAnimationFrame(draw)
      }
    }

    const schedule = () => {
      if (raf === 0 && !disposed) raf = requestAnimationFrame(draw)
    }

    /* ---- visibility gates -------------------------------------------------
       A background canvas that keeps raymarching while scrolled away is the
       fastest way to make a good laptop fan spin. Both gates suspend the loop
       and the resume path re-arms it. */
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting
          if (inView) schedule()
          else if (raf !== 0) {
            cancelAnimationFrame(raf)
            raf = 0
          }
        },
        { threshold: 0 },
      )
      io.observe(canvas)
    }

    const onVisibility = () => {
      visible = !document.hidden
      if (visible) schedule()
      else if (raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onLost = (e: Event) => {
      e.preventDefault()
      if (raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    canvas.addEventListener('webglcontextlost', onLost)

    schedule()

    return () => {
      disposed = true
      if (raf !== 0) cancelAnimationFrame(raf)
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      // Best-effort: returns the context to the pool immediately rather than
      // waiting for GC, which matters when navigating back and forth.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      /* Not focusable and not clickable: this is decoration behind real
         content, and a canvas in the tab order would be a keyboard trap. */
      tabIndex={-1}
    />
  )
}